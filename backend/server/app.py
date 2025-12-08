# backend/server/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
# Importujemy nasze funkcje z nowego pliku db.py
from db import get_db_connection, init_db 

app = Flask(__name__)
CORS(app)

# Inicjalizujemy bazę przy starcie
init_db()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Używamy funkcji z importu
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if user and user['password'] == password:
        return jsonify({
            "status": "success",
            "token": "fake-jwt-token-123",
            "user": user['username']
        }), 200
    else:
        return jsonify({"status": "error", "message": "Błędne dane logowania"}), 401

@app.route('/api/data', methods=['GET'])
def get_dashboard_data():
    return jsonify({
        "message": "Witaj w planerze!",
        "stats": {"planned_trips": 0, "visited_countries": 0}
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)