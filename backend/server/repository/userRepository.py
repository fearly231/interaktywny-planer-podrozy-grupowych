from db.db import Database
from entities.user import User

class UserRepository:
    def __init__(self):
        self.db = Database()
        self.conn = self.db.get_connection()
    
    def get_by_username(self, username: str):
        """Pobierz użytkownika po nazwie użytkownika"""
        try:
            row = self.conn.execute(
                'SELECT id, username, password FROM users WHERE username = ?',
                (username,)
            ).fetchone()
            
            if not row:
                return None
            
            return User(
                id=row['id'],
                username=row['username'],
                password=row['password']
            )
        except Exception as e:
            print(f"Error getting user by username {username}: {e}")
            return None
    
    def get_by_id(self, user_id: int):
        """Pobierz użytkownika po ID"""
        try:
            row = self.conn.execute(
                'SELECT id, username, password FROM users WHERE id = ?',
                (user_id,)
            ).fetchone()
            
            if not row:
                return None
            
            return User(
                id=row['id'],
                username=row['username'],
                password=row['password']
            )
        except Exception as e:
            print(f"Error getting user by id {user_id}: {e}")
            return None
    
    def create(self, username: str, password: str):
        """Utwórz nowego użytkownika"""
        try:
            cursor = self.conn.execute(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                (username, password)
            )
            self.conn.commit()
            
            return User(
                id=cursor.lastrowid,
                username=username,
                password=password
            )
        except Exception as e:
            print(f"Error creating user {username}: {e}")
            return None
    
    def exists(self, username: str) -> bool:
        """Sprawdź czy użytkownik istnieje"""
        return self.get_by_username(username) is not None
    
    def verify_password(self, username: str, password: str) -> bool:
        """Zweryfikuj hasło użytkownika"""
        user = self.get_by_username(username)
        if not user:
            return False
        return user.password == password
    
    def get_all(self):
        """Pobierz wszystkich użytkowników (dla celów administracyjnych)"""
        try:
            rows = self.conn.execute(
                'SELECT id, username, password FROM users ORDER BY username'
            ).fetchall()
            
            return [
                User(
                    id=row['id'],
                    username=row['username'],
                    password=row['password']
                )
                for row in rows
            ]
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []
    
    def delete(self, user_id: int) -> bool:
        """Usuń użytkownika"""
        try:
            result = self.conn.execute(
                'DELETE FROM users WHERE id = ?',
                (user_id,)
            )
            self.conn.commit()
            return result.rowcount > 0
        except Exception as e:
            print(f"Error deleting user {user_id}: {e}")
            return False
    
    def update_password(self, user_id: int, new_password: str) -> bool:
        """Zaktualizuj hasło użytkownika"""
        try:
            self.conn.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                (new_password, user_id)
            )
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error updating password for user {user_id}: {e}")
            return False
