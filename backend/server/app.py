# backend/server/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import jwt
import datetime

# Importujemy nasze funkcje z nowego pliku db.py

# ZMIANA 1: Importujemy klasę Database, a nie stare funkcje
from db import Database 
from models import ScheduleItem, PackingItem
from Attraction.attraction import Attraction

app = Flask(__name__)
CORS(app)

# ZMIANA 2: Inicjalizujemy Singletona (to automatycznie stworzy tabele w bazie)
# Zamiast starego init_db()
Database()

SECRET_KEY = 'supersekretnykluczjwt'  # w produkcji ustaw przez ENV!

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # ZMIANA 3: Pobieramy połączenie z Singletona
    db = Database()
    conn = db.get_connection()
    
    try:
        # Wykonujemy zapytanie
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        # WAŻNE: USUNĘLIŚMY conn.close() - Singleton trzyma połączenie otwarte!

        if user and user['password'] == password:
            # Generujemy token JWT
            token = jwt.encode({
                'username': user['username'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, SECRET_KEY, algorithm='HS256')
            return jsonify({
                "status": "success",
                "token": token,
                "user": user['username']
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


attr1 = Attraction(1, "Morskie Oko", "Natura", "Wyjść rano o 7:00!")
attr2 = Attraction(2, "Krupówki", "Miasto", "Kupić oscypka")
attr3 = Attraction(3, "Termy Chochołowskie", "Relaks", "Wieczorem")


attr1.approve()
attr3.reject()  




# --- 2. "BAZA DANYCH" W PAMIĘCI ---
# Dzięki temu możemy szybko znaleźć obiekt po ID
attractions_db = {
    1: attr1,
    2: attr2,
    3: attr3
}

@app.route('/api/trips', methods=['GET'])
def get_trips():
    # Budujemy listę dynamicznie, żeby zawsze mieć aktualne liczby głosów
    trips_data = [
      {
        "id": 1,
        "title": "Weekend w Tatrach 🏔️",
        "date": "15-17 Października",
        "description": "Jesienne wyjście na szlaki.",
        "image": "bg-gradient-to-br from-green-400 to-blue-500",
        "packingList": [],
        "schedule": [],
        "attractions": [
            # Pobieramy aktualny stan obiektów
            attractions_db[1].to_dict(),
            attractions_db[2].to_dict(),
            attractions_db[3].to_dict()
        ]
      }
    ]
    return jsonify(trips_data)

# --- 3. NOWY ENDPOINT: GŁOSOWANIE ---
@app.route('/api/attractions/<int:attr_id>/vote', methods=['POST'])
def vote_attraction(attr_id):
    # Szukamy obiektu w naszej "bazie"
    attraction = attractions_db.get(attr_id)
    
    if not attraction:
        return jsonify({"error": "Nie znaleziono atrakcji"}), 404
    

    attraction.vote_up()
    
    # Zwracamy zaktualizowany obiekt do Reacta
    return jsonify(attraction.to_dict())
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
