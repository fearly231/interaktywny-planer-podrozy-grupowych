# backend/server/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
# Importujemy nasze funkcje z nowego pliku db.py
from db import get_db_connection, init_db 
from Attraction.attraction import Attraction
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
