# backend/server/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
# ZMIANA 1: Importujemy klasę Database, a nie stare funkcje
from db import Database 
from models import ScheduleItem

app = Flask(__name__)
CORS(app)

# ZMIANA 2: Inicjalizujemy Singletona (to automatycznie stworzy tabele w bazie)
# Zamiast starego init_db()
Database()

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
            return jsonify({
                "status": "success",
                "token": "fake-jwt-token-123",
                "user": user['username']
            }), 200
        else:
            return jsonify({"status": "error", "message": "Błędne dane logowania"}), 401
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/data', methods=['GET'])
def get_dashboard_data():
    return jsonify({
        "message": "Witaj w planerze!",
        "stats": {"planned_trips": 0, "visited_countries": 0}
    })


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