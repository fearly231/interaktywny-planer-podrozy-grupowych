from db.db import Database
from entities.attraction import Attraction

class AttractionRepository:
    def __init__(self):
        self.db = Database()
        self.conn = self.db.get_connection()
    
    def get_by_id(self, attr_id: int):
        """Pobierz atrakcję po ID z liczbą głosów"""
        try:
            row = self.conn.execute(
                'SELECT id, trip_id, name, type, note, cost, link, status FROM trip_attractions WHERE id = ?',
                (attr_id,)
            ).fetchone()
            
            if not row:
                return None
            
            attraction = Attraction(
                id=row['id'],
                name=row['name'],
                type=row['type'],
                note=row['note'] or '',
                cost=row['cost'] or 0.0,
                link=row['link']
            )
            
            # Ustaw stan na podstawie statusu z bazy
            status = row['status'] or 'Propozycja'
            if status == 'Zatwierdzone':
                from states.approvedState import ApprovedState
                attraction.change_state(ApprovedState())
            elif status == 'Odrzucone':
                from states.rejectedState import RejectedState
                attraction.change_state(RejectedState())
            # Domyślnie jest ProposedState
            
            # Pobierz liczbę głosów
            votes_row = self.conn.execute(
                'SELECT COUNT(*) as votes FROM attraction_votes WHERE attraction_id = ?',
                (attr_id,)
            ).fetchone()
            attraction.votes = votes_row['votes'] if votes_row else 0
            
            return attraction
        except Exception as e:
            print(f"Error getting attraction {attr_id}: {e}")
            return None
    
    def get_all_by_trip(self, trip_id: int):
        """Pobierz wszystkie atrakcje dla danej wycieczki z liczbą głosów"""
        try:
            rows = self.conn.execute(
                '''SELECT ta.id, ta.trip_id, ta.name, ta.type, ta.note, ta.cost, ta.link, ta.status, COUNT(av.id) as votes 
                   FROM trip_attractions ta 
                   LEFT JOIN attraction_votes av ON ta.id = av.attraction_id 
                   WHERE ta.trip_id = ? 
                   GROUP BY ta.id
                   ORDER BY votes DESC, ta.name''',
                (trip_id,)
            ).fetchall()
            
            attractions = []
            for row in rows:
                attraction = Attraction(
                    id=row['id'],
                    name=row['name'],
                    type=row['type'] or '',
                    note=row['note'] or '',
                    cost=row['cost'] or 0.0,
                    link=row['link']
                )
                
                # Ustaw stan na podstawie statusu z bazy
                status = row['status'] or 'Propozycja'
                if status == 'Zatwierdzone':
                    from states.approvedState import ApprovedState
                    attraction.change_state(ApprovedState())
                elif status == 'Odrzucone':
                    from states.rejectedState import RejectedState
                    attraction.change_state(RejectedState())
                
                attraction.votes = row['votes'] or 0
                attractions.append(attraction)
            
            return attractions
        except Exception as e:
            print(f"Error getting attractions for trip {trip_id}: {e}")
            return []
    
    def create(self, trip_id: int, name: str, type_: str = None, note: str = None, cost: float = 0.0, link: str = None):
        """Utwórz nową atrakcję"""
        try:
            cursor = self.conn.execute(
                'INSERT INTO trip_attractions (trip_id, name, type, note, cost, link) VALUES (?, ?, ?, ?, ?, ?)',
                (trip_id, name, type_, note, cost, link)
            )
            self.conn.commit()
            
            attraction = Attraction(
                id=cursor.lastrowid,
                name=name,
                type=type_ or '',
                note=note or '',
                cost=cost,
                link=link
            )
            attraction.votes = 0
            return attraction
        except Exception as e:
            print(f"Error creating attraction: {e}")
            return None
    
    def has_user_voted(self, attr_id: int, user_id: int) -> bool:
        """Sprawdź czy użytkownik już głosował na atrakcję"""
        try:
            row = self.conn.execute(
                'SELECT id FROM attraction_votes WHERE attraction_id = ? AND user_id = ?',
                (attr_id, user_id)
            ).fetchone()
            return row is not None
        except Exception:
            return False
    
    def add_vote(self, attr_id: int, user_id: int) -> bool:
        """Dodaj głos użytkownika (jeden głos per użytkownik per atrakcja)"""
        try:
            # Sprawdź czy użytkownik już głosował
            if self.has_user_voted(attr_id, user_id):
                return False
            
            self.conn.execute(
                'INSERT INTO attraction_votes (attraction_id, user_id) VALUES (?, ?)',
                (attr_id, user_id)
            )
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error adding vote: {e}")
            return False
    
    def remove_vote(self, attr_id: int, user_id: int) -> bool:
        """Usuń głos użytkownika z atrakcji"""
        try:
            # Sprawdź czy użytkownik głosował
            if not self.has_user_voted(attr_id, user_id):
                return False
            
            result = self.conn.execute(
                'DELETE FROM attraction_votes WHERE attraction_id = ? AND user_id = ?',
                (attr_id, user_id)
            )
            self.conn.commit()
            return result.rowcount > 0
        except Exception as e:
            print(f"Error removing vote: {e}")
            return False
    
    def get_vote_count(self, attr_id: int) -> int:
        """Pobierz liczbę głosów dla atrakcji"""
        try:
            row = self.conn.execute(
                'SELECT COUNT(*) as votes FROM attraction_votes WHERE attraction_id = ?',
                (attr_id,)
            ).fetchone()
            return row['votes'] if row else 0
        except Exception:
            return 0
    
    def update_status(self, attr_id: int, status: str) -> bool:
        """Zaktualizuj status atrakcji w bazie danych"""
        try:
            self.conn.execute(
                'UPDATE trip_attractions SET status = ? WHERE id = ?',
                (status, attr_id)
            )
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error updating status: {e}")
            return False
    
    def delete(self, attr_id: int) -> bool:
        """Usuń atrakcję"""
        try:
            # Najpierw usuń głosy
            self.conn.execute(
                'DELETE FROM attraction_votes WHERE attraction_id = ?',
                (attr_id,)
            )
            # Potem usuń atrakcję
            result = self.conn.execute(
                'DELETE FROM trip_attractions WHERE id = ?',
                (attr_id,)
            )
            self.conn.commit()
            return result.rowcount > 0
        except Exception as e:
            print(f"Error deleting attraction: {e}")
            return False
