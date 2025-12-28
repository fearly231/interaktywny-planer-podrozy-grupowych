# backend/server/db.py
import sqlite3

class Database:
    _instance = None
    DB_FILE = 'travel_planner.db'

    def __new__(cls):
        # 1. Sprawdzamy, czy instancja już istnieje
        if cls._instance is None:
            print("--- TWORZĘ NOWĄ INSTANCJĘ BAZY (TO POWINNO BYĆ TYLKO RAZ) ---")
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._initialized = False
        else:
            print("--- Używam istniejącej instancji bazy ---")
        return cls._instance

    def __init__(self):
        # 2. Jeśli już zainicjalizowano, nic nie rób
        if self._initialized:
            return

        # 3. Nawiązanie trwałego połączenia
        # check_same_thread=False jest kluczowe, jeśli używasz tego w serwerze (np. Flask),
        # aby wątki nie kłóciły się o jeden obiekt połączenia.
        self.connection = sqlite3.connect(self.DB_FILE, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row

        # 4. Automatyczne uruchomienie logiki tworzenia tabel (dawne init_db)
        self._init_db_structure()

        # Oznaczamy jako zainicjalizowany
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

            # tabela przechowująca elementy harmonogramu (ScheduleItem)
            cur.execute('''
                CREATE TABLE IF NOT EXISTS schedule_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    time TEXT,
                    activity TEXT
                )
            ''')

            cur.execute("SELECT * FROM users WHERE username = ?", ('podroznik',))
            if cur.fetchone() is None:
                cur.execute("INSERT INTO users (username, password) VALUES (?, ?)", ('podroznik', '1234'))
                print("--- DB: Utworzono domyślnego użytkownika ---")

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