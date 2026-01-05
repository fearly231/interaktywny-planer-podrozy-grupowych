# backend/server/db.py
import sqlite3

class Database:
    _instance = None
    DB_FILE = '/app/db/travel_planner.db'

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):

        if self._initialized:
            return
        self.connection = sqlite3.connect(self.DB_FILE, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        self._init_db_structure()
        self._initialized = True

    def _init_db_structure(self):
        """Metoda wewnętrzna: Tworzy tabele i użytkownika, jeśli nie istnieją."""
        try:
            cur = self.connection.cursor()
            
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL
                )
            ''')

            cur.execute('''
                CREATE TABLE IF NOT EXISTS schedule_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trip_id INTEGER,
                    time TEXT,
                    activity TEXT
                )
            ''')

            cur.execute('''
                CREATE TABLE IF NOT EXISTS packing_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trip_id INTEGER,
                    user_id INTEGER,
                    item_name TEXT,
                    is_checked INTEGER DEFAULT 0
                )
            ''')

            cur.execute('''
                CREATE TABLE IF NOT EXISTS trips (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    start_date TEXT,
                    end_date TEXT,
                    budget_limit REAL,
                    owner_user_id INTEGER
                )
            ''')

            cur.execute('''
                CREATE TABLE IF NOT EXISTS trip_members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trip_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    role TEXT DEFAULT 'member',
                    UNIQUE(trip_id, user_id)
                )
            ''')

            cur.execute('''
                CREATE TABLE IF NOT EXISTS trip_attractions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trip_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    type TEXT,
                    note TEXT
                )
            ''')

            cur.execute('''
                CREATE TABLE IF NOT EXISTS attraction_votes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    attraction_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    UNIQUE(attraction_id, user_id)
                )
            ''')

            cur.execute("PRAGMA table_info(trips)")
            cols = [r['name'] for r in cur.fetchall()]
            if 'owner_user_id' not in cols:
                try:
                    cur.execute('ALTER TABLE trips ADD COLUMN owner_user_id INTEGER')
                except Exception:
                    pass

            cur.execute("PRAGMA table_info(packing_items)")
            cols = [r['name'] for r in cur.fetchall()]
            if 'trip_id' not in cols:
                try:
                    cur.execute('ALTER TABLE packing_items ADD COLUMN trip_id INTEGER')
                except Exception:
                    pass

            cur.execute("PRAGMA table_info(schedule_items)")
            cols = [r['name'] for r in cur.fetchall()]
            if 'trip_id' not in cols:
                try:
                    cur.execute('ALTER TABLE schedule_items ADD COLUMN trip_id INTEGER')
                except Exception:
                    pass

            cur.execute("SELECT * FROM users WHERE username = ?", ('podroznik',))
            if cur.fetchone() is None:
                cur.execute("INSERT INTO users (username, password) VALUES (?, ?)", ('podroznik', '1234'))

            # Migracja: zmień wszystkie role 'admin' na 'moderator'
            cur.execute("UPDATE trip_members SET role = 'moderator' WHERE role = 'admin'")

            self.connection.commit()
            
        except sqlite3.Error as e:
            print(f"Błąd inicjalizacji bazy: {e}")

    def get_connection(self):
        """Zwraca aktywny obiekt połączenia."""
        return self.connection

    def close(self):
        """Metoda do ręcznego zamknięcia połączenia (np. przy zamykaniu serwera)."""
        if self.connection:
            self.connection.close()
            self.connection = None