# backend/server/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import jwt
import datetime

from db.db import Database 
from scheduleItem import ScheduleItem
from packingItem import PackingItem
from Attraction.attraction import Attraction
from Trip.tripRepository import TripRepository
from Trip.tripBuilder import TripBuilder
from users.user import User

app = Flask(__name__)
CORS(app)

# Inicjalizujemy Singletona (to automatycznie stworzy tabele w bazie)
Database()

SECRET_KEY = 'supersekretnykluczjwt'  # w produkcji ustaw przez ENV!

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    db = Database()
    conn = db.get_connection()
    
    try:
        # Wykonujemy zapytanie
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

        if user and user['password'] == password:
            # Generujemy token JWT
            token = jwt.encode({
                'username': user['username'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, SECRET_KEY, algorithm='HS256')
            return jsonify({
                "status": "success",
                "token": token,
                "user": user['username'],
                "user_id": user['id']
            }), 200
        else:
            return jsonify({"status": "error", "message": "Błędne dane logowania"}), 401
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"status": "error", "message": "Brak nazwy użytkownika lub hasła"}), 400
    db = Database()
    conn = db.get_connection()
    try:
        conn.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        conn.commit()
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    return jsonify({"status": "success"}), 201

@app.route('/api/data', methods=['GET'])
def get_dashboard_data():
    return jsonify({
        "message": "Witaj w planerze!",
        "stats": {"planned_trips": 0, "visited_countries": 0}
    })


@app.route('/api/trips', methods=['GET'])


@app.route('/api/trips', methods=['GET'])
def get_trips():
    # Pobierz user_id z query parametru lub header'a
    user_id = request.args.get('user_id') or request.headers.get('X-User-ID')
    
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400
    
    repo = TripRepository()
    conn = Database().get_connection()
    try:
        # Pobierz tylko wycieczki, w których użytkownik jest członkiem
        trips_rows = conn.execute(
            '''SELECT DISTINCT t.id FROM trips t 
               JOIN trip_members tm ON t.id = tm.trip_id 
               WHERE tm.user_id = ? 
               ORDER BY t.id DESC''',
            (user_id,)
        ).fetchall()
        
        trips_list = []
        for row in trips_rows:
            trip = repo.get_by_id(row['id'])
            if trip:
                trips_list.append(trip.to_dict())
        return jsonify(trips_list)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/attractions/<int:attr_id>/vote', methods=['POST'])
def vote_attraction(attr_id):
    """Dodaj głos użytkownika na atrakcję (jeden głos per użytkownik per atrakcja)."""
    data = request.json or {}
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    
    conn = Database().get_connection()
    try:
        # Sprawdź czy atrakcja istnieje
        attraction = conn.execute(
            'SELECT id, trip_id, name, type, note FROM trip_attractions WHERE id = ?',
            (attr_id,)
        ).fetchone()
        
        if not attraction:
            return jsonify({"error": "Nie znaleziono atrakcji"}), 404
        
        # Sprawdź czy użytkownik już głosował
        existing_vote = conn.execute(
            'SELECT id FROM attraction_votes WHERE attraction_id = ? AND user_id = ?',
            (attr_id, user_id)
        ).fetchone()
        
        if existing_vote:
            return jsonify({"error": "Już głosowałeś na tę atrakcję"}), 409
        
        # Dodaj nowy głos
        conn.execute(
            'INSERT INTO attraction_votes (attraction_id, user_id) VALUES (?, ?)',
            (attr_id, user_id)
        )
        conn.commit()
        
        # Pobierz liczę głosów
        vote_count = conn.execute(
            'SELECT COUNT(*) as votes FROM attraction_votes WHERE attraction_id = ?',
            (attr_id,)
        ).fetchone()['votes']
        
        # Zwróć zaktualizowaną atrakcję
        return jsonify({
            "id": attraction['id'],
            "name": attraction['name'],
            "type": attraction['type'],
            "note": attraction['note'],
            "votes": vote_count
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    """Return all schedule items from the database."""
    db = Database()
    conn = db.get_connection()
    try:
        cur = conn.execute('SELECT id, time, activity FROM schedule_items ORDER BY time')
        rows = cur.fetchall()
        items = [ScheduleItem.from_row(r).to_dict() for r in rows]
        return jsonify(items)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/packing', methods=['GET'])
def get_packing_items():
    """Return packing items for given `trip_id` and `user_id` (query params)."""
    trip_id = request.args.get('trip_id')
    user_id = request.args.get('user_id')
    if not trip_id:
        return jsonify({"status": "error", "message": "trip_id required"}), 400
    db = Database()
    conn = db.get_connection()
    try:
        if user_id:
            cur = conn.execute('SELECT id, trip_id, user_id, item_name, is_checked FROM packing_items WHERE trip_id = ? AND user_id = ? ORDER BY id', (trip_id, user_id))
        else:
            cur = conn.execute('SELECT id, trip_id, user_id, item_name, is_checked FROM packing_items WHERE trip_id = ? ORDER BY id', (trip_id,))
        rows = cur.fetchall()
        items = [PackingItem.from_row(r).to_dict() for r in rows]
        return jsonify(items)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/packing', methods=['POST'])
def create_packing_item():
    data = request.json or {}
    trip_id = data.get('trip_id')
    user_id = data.get('user_id')
    item_name = data.get('item_name', '')
    is_checked = 1 if data.get('is_checked') else 0
    if not trip_id:
        return jsonify({"status": "error", "message": "trip_id required"}), 400
    db = Database()
    conn = db.get_connection()
    try:
        cur = conn.execute('INSERT INTO packing_items (trip_id, user_id, item_name, is_checked) VALUES (?, ?, ?, ?)', (trip_id, user_id, item_name, is_checked))
        conn.commit()
        new_id = cur.lastrowid
        row = conn.execute('SELECT id, trip_id, user_id, item_name, is_checked FROM packing_items WHERE id = ?', (new_id,)).fetchone()
        return jsonify(PackingItem.from_row(row).to_dict()), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/packing/<int:item_id>', methods=['PUT'])
def update_packing_item(item_id):
    data = request.json or {}
    item_name = data.get('item_name')
    is_checked = data.get('is_checked')
    db = Database()
    conn = db.get_connection()
    try:
        existing = conn.execute('SELECT id FROM packing_items WHERE id = ?', (item_id,)).fetchone()
        if existing is None:
            return jsonify({"status": "error", "message": "Not found"}), 404
        # Build update tuple
        if item_name is not None and is_checked is not None:
            conn.execute('UPDATE packing_items SET item_name = ?, is_checked = ? WHERE id = ?', (item_name, 1 if is_checked else 0, item_id))
        elif item_name is not None:
            conn.execute('UPDATE packing_items SET item_name = ? WHERE id = ?', (item_name, item_id))
        elif is_checked is not None:
            conn.execute('UPDATE packing_items SET is_checked = ? WHERE id = ?', (1 if is_checked else 0, item_id))
        conn.commit()
        row = conn.execute('SELECT id, trip_id, user_id, item_name, is_checked FROM packing_items WHERE id = ?', (item_id,)).fetchone()
        return jsonify(PackingItem.from_row(row).to_dict())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/packing/<int:item_id>', methods=['DELETE'])
def delete_packing_item(item_id):
    db = Database()
    conn = db.get_connection()
    try:
        existing = conn.execute('SELECT id FROM packing_items WHERE id = ?', (item_id,)).fetchone()
        if existing is None:
            return jsonify({"status": "error", "message": "Not found"}), 404
        conn.execute('DELETE FROM packing_items WHERE id = ?', (item_id,))
        conn.commit()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/schedule', methods=['POST'])
def create_schedule_item():
    data = request.json or {}
    time_str = data.get('time')
    activity = data.get('activity', '')
    db = Database()
    conn = db.get_connection()
    try:
        cur = conn.execute('INSERT INTO schedule_items (time, activity) VALUES (?, ?)', (time_str, activity))
        conn.commit()
        new_id = cur.lastrowid
        row = conn.execute('SELECT id, time, activity FROM schedule_items WHERE id = ?', (new_id,)).fetchone()
        item = ScheduleItem.from_row(row)
        return jsonify(item.to_dict()), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/schedule/<int:item_id>', methods=['PUT'])
def update_schedule_item(item_id):
    data = request.json or {}
    time_str = data.get('time')
    activity = data.get('activity')
    db = Database()
    conn = db.get_connection()
    try:
        existing = conn.execute('SELECT id FROM schedule_items WHERE id = ?', (item_id,)).fetchone()
        if existing is None:
            return jsonify({"status": "error", "message": "Not found"}), 404
        conn.execute('UPDATE schedule_items SET time = ?, activity = ? WHERE id = ?', (time_str, activity, item_id))
        conn.commit()
        row = conn.execute('SELECT id, time, activity FROM schedule_items WHERE id = ?', (item_id,)).fetchone()
        return jsonify(ScheduleItem.from_row(row).to_dict())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/schedule/<int:item_id>', methods=['DELETE'])
def delete_schedule_item(item_id):
    db = Database()
    conn = db.get_connection()
    try:
        existing = conn.execute('SELECT id FROM schedule_items WHERE id = ?', (item_id,)).fetchone()
        if existing is None:
            return jsonify({"status": "error", "message": "Not found"}), 404
        conn.execute('DELETE FROM schedule_items WHERE id = ?', (item_id,))
        conn.commit()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/trips', methods=['POST'])
def create_trip():
    data = request.json or {}
    title = data.get('title')
    start = data.get('start_date')
    end = data.get('end_date')
    budget = data.get('budget', 0)
    user_id = data.get('user_id')

    if not title:
        return jsonify({'status': 'error', 'message': 'title required'}), 400

    # validate user_id exists and convert to int when possible
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400
    try:
        user_id = int(user_id)
    except Exception:
        # try to fetch user by username if a string was passed
        db = Database()
        conn = db.get_connection()
        urow = conn.execute('SELECT id FROM users WHERE username = ?', (user_id,)).fetchone() if isinstance(user_id, str) else None
        if urow:
            user_id = urow['id']
        else:
            return jsonify({'status': 'error', 'message': 'invalid user_id'}), 400

    try:
        # build trip
        builder = TripBuilder().set_title(title).set_dates(start, end).set_budget(budget)
        trip = builder.build()
        repo = TripRepository()
        trip = repo.save(trip)

        # add creator as moderator
        conn = Database().get_connection()
        conn.execute('INSERT INTO trip_members (trip_id, user_id, role) VALUES (?, ?, ?)', (trip.id, user_id, 'moderator'))
        conn.commit()

        # Przeładuj trip z bazy, aby zawierał członków
        trip = repo.get_by_id(trip.id)
        
        return jsonify(trip.to_dict()), 201
    except Exception as e:
        # Log and return error details to help debugging (safe in dev)
        print('Error creating trip:', e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/trips/<int:trip_id>', methods=['GET'])
def get_trip(trip_id):
    repo = TripRepository()
    trip = repo.get_by_id(trip_id)
    if not trip:
        return jsonify({'status': 'error', 'message': 'not found'}), 404
    return jsonify(trip.to_dict())

@app.route('/api/trips/<int:trip_id>/members', methods=['POST'])
def add_trip_member(trip_id):
    data = request.json or {}
    username = data.get('username')
    if not username:
        return jsonify({'status': 'error', 'message': 'username required'}), 400
    conn = Database().get_connection()
    user = conn.execute('SELECT id, username FROM users WHERE username = ?', (username,)).fetchone()
    if not user:
        return jsonify({'status': 'error', 'message': 'user not found'}), 404
    
    # Sprawdź czy użytkownik już jest członkiem
    existing_member = conn.execute(
        'SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?',
        (trip_id, user['id'])
    ).fetchone()
    if existing_member:
        return jsonify({'status': 'error', 'message': 'user already a member'}), 409
    
    try:
        conn.execute('INSERT INTO trip_members (trip_id, user_id, role) VALUES (?, ?, ?)', (trip_id, user['id'], 'member'))
        conn.commit()
        # Pobierz zaktualizowaną listę członków
        members = conn.execute(
            'SELECT u.id as user_id, u.username, tm.role FROM trip_members tm JOIN users u ON tm.user_id = u.id WHERE tm.trip_id = ?',
            (trip_id,)
        ).fetchall()
        members_list = [dict(m) for m in members] if members else []
        return jsonify({'status': 'success', 'members': members_list}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/trips/<int:trip_id>/members/<int:user_id>', methods=['DELETE'])
def remove_trip_member(trip_id, user_id):
    """Usuń członka z wycieczki (tylko moderator może usuwać)"""
    data = request.json or {}
    requester_id = data.get('requester_id')  # ID użytkownika wykonującego żądanie
    
    if not requester_id:
        return jsonify({'status': 'error', 'message': 'requester_id required'}), 400
    
    conn = Database().get_connection()
    
    # Sprawdź czy użytkownik wykonujący żądanie jest moderatorem
    requester = conn.execute(
        'SELECT role FROM trip_members WHERE trip_id = ? AND user_id = ?',
        (trip_id, requester_id)
    ).fetchone()
    
    if not requester or requester['role'] != 'moderator':
        return jsonify({'status': 'error', 'message': 'only moderators can remove members'}), 403
    
    # Nie pozwól moderatorowi usunąć samego siebie
    if int(requester_id) == int(user_id):
        return jsonify({'status': 'error', 'message': 'cannot remove yourself'}), 400
    
    try:
        # Usuń członka
        result = conn.execute('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?', (trip_id, user_id))
        conn.commit()
        
        if result.rowcount == 0:
            return jsonify({'status': 'error', 'message': 'member not found'}), 404
        
        # Zwróć zaktualizowaną listę członków
        members = conn.execute(
            'SELECT u.id as user_id, u.username, tm.role FROM trip_members tm JOIN users u ON tm.user_id = u.id WHERE tm.trip_id = ?',
            (trip_id,)
        ).fetchall()
        members_list = [dict(m) for m in members] if members else []
        return jsonify({'status': 'success', 'members': members_list}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/trips/<int:trip_id>/attractions', methods=['POST'])
def add_trip_attraction(trip_id):
    data = request.json or {}
    name = data.get('name')
    type_ = data.get('type')
    note = data.get('note')
    if not name:
        return jsonify({'status': 'error', 'message': 'name required'}), 400
    conn = Database().get_connection()
    try:
        conn.execute('INSERT INTO trip_attractions (trip_id, name, type, note) VALUES (?, ?, ?, ?)', (trip_id, name, type_, note))
        conn.commit()
        # Pobierz zaktualizowaną listę atrakcji dla tego tripa z liczbą głosów
        attractions = conn.execute(
            '''SELECT ta.id, ta.trip_id, ta.name, ta.type, ta.note, COUNT(av.id) as votes 
               FROM trip_attractions ta 
               LEFT JOIN attraction_votes av ON ta.id = av.attraction_id 
               WHERE ta.trip_id = ? 
               GROUP BY ta.id''',
            (trip_id,)
        ).fetchall()
        attractions_list = [dict(a) for a in attractions] if attractions else []
        return jsonify({'status': 'success', 'attractions': attractions_list}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
