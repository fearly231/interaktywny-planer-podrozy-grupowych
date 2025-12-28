# backend/server/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
# ZMIANA 1: Importujemy klasę Database, a nie stare funkcje
from db import Database 

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)