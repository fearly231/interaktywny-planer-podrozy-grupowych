from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# CORS pozwala frontendowi (Next.js) rozmawiać z backendem (Flask)
CORS(app)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Mockowa walidacja - na razie "na sztywno"
    if username == "podroznik" and password == "1234":
        return jsonify({
            "status": "success",
            "token": "fake-jwt-token-123",
            "user": "Podróżnik"
        }), 200
    else:
        return jsonify({"status": "error", "message": "Błędne dane"}), 401

@app.route('/api/data', methods=['GET'])
def get_dashboard_data():
    # Przykładowe dane na start
    return jsonify({
        "message": "Witaj w planerze!",
        "stats": {"planned_trips": 0, "visited_countries": 0}
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)