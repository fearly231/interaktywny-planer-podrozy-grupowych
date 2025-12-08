# backend/server/db.py
import sqlite3

DB_FILE = 'travel_planner.db'

def get_db_connection():
    """Łączy się z bazą danych i pozwala odczytywać wyniki jak słowniki."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Tworzy tabelę i dodaje przykładowego użytkownika."""
    conn = get_db_connection()
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    ''')
    
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = ?", ('podroznik',))
    if cur.fetchone() is None:
        cur.execute("INSERT INTO users (username, password) VALUES (?, ?)", ('podroznik', '1234'))
        print("--- DB: Utworzono domyślnego użytkownika ---")
    
    conn.commit()
    conn.close()