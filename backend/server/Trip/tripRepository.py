from db.db import Database
from Trip.trip import Trip
from Attraction.attraction import Attraction
from scheduleItem import ScheduleItem
from packingItem import PackingItem

class TripRepository:
    def __init__(self):
        self.db = Database()
        self.conn = self.db.get_connection()

    def save(self, trip: Trip):
        cur = self.conn.cursor()
        if trip.id is None:
            cur.execute('INSERT INTO trips (title, start_date, end_date, budget_limit, owner_user_id) VALUES (?, ?, ?, ?, ?)', (trip.title, trip.start_date, trip.end_date, trip.total_budget_limit, None))
            self.conn.commit()
            trip_id = cur.lastrowid
            trip.id = trip_id
        else:
            cur.execute('UPDATE trips SET title=?, start_date=?, end_date=?, budget_limit=? WHERE id=?', (trip.title, trip.start_date, trip.end_date, trip.total_budget_limit, trip.id))
            self.conn.commit()
            trip_id = trip.id
        # save members
        cur.execute('DELETE FROM trip_members WHERE trip_id=?', (trip_id,))
        for m in trip.members:
            cur.execute('INSERT INTO trip_members (trip_id, user_id, role) VALUES (?, ?, ?)', (trip_id, getattr(m, 'id', None), getattr(m, 'role', 'member')))
        # save attractions
        cur.execute('DELETE FROM trip_attractions WHERE trip_id=?', (trip_id,))
        for a in trip.attractions:
            # a may be an Attraction instance or simple object with attributes
            name = getattr(a, 'name', None)
            type_ = getattr(a, 'type', None)
            note = getattr(a, 'note', None)
            cur.execute('INSERT INTO trip_attractions (trip_id, name, type, note) VALUES (?, ?, ?, ?)', (trip_id, name, type_, note))
        self.conn.commit()
        return trip

    def get_by_id(self, id):
        cur = self.conn.cursor()
        trip_row = cur.execute('SELECT id, title, start_date, end_date, budget_limit FROM trips WHERE id=?', (id,)).fetchone()
        if not trip_row:
            return None
        trip = Trip(trip_row['id'], trip_row['title'], trip_row['start_date'], trip_row['end_date'], trip_row['budget_limit'])
        # load attractions with vote counts
        rows = cur.execute('''
            SELECT ta.id, ta.name, ta.type, ta.note, COUNT(av.id) as votes 
            FROM trip_attractions ta 
            LEFT JOIN attraction_votes av ON ta.id = av.attraction_id 
            WHERE ta.trip_id=? 
            GROUP BY ta.id 
            ORDER BY ta.id
        ''', (id,)).fetchall()
        for r in rows:
            a = Attraction(r['id'], r['name'], r['type'], r['note'])
            a.votes = r['votes']
            trip.attractions.append(a)
        # load members
        rows = cur.execute('SELECT tm.user_id, u.username, tm.role FROM trip_members tm JOIN users u ON u.id=tm.user_id WHERE tm.trip_id=?', (id,)).fetchall()
        for r in rows:
            m = type('M', (), {})()
            m.id = r['user_id']
            m.username = r['username']
            m.role = r['role']
            trip.members.append(m)
        # load schedule
        rows = cur.execute('SELECT id, trip_id, time, activity FROM schedule_items WHERE trip_id=? ORDER BY time', (id,)).fetchall()
        for r in rows:
            # Parse activity field which contains: "attraction_name|day:X|notes:Y|attr_id:Z"
            activity_str = r['activity'] or ''
            parts = activity_str.split('|')
            
            # Stwórz obiekt harmonogramu w formacie który frontend oczekuje
            schedule_obj = type('S', (), {})()
            schedule_obj.id = r['id']
            schedule_obj.time = r['time']
            schedule_obj.attraction_name = parts[0] if len(parts) > 0 else activity_str
            
            # Wyciągnij day, notes, attraction_id
            for part in parts[1:]:
                if part.startswith('day:'):
                    schedule_obj.day = int(part.split(':')[1])
                elif part.startswith('notes:'):
                    schedule_obj.notes = part.split(':', 1)[1] if ':' in part else ''
                elif part.startswith('attr_id:'):
                    schedule_obj.attraction_id = int(part.split(':')[1])
            
            # Ustaw domyślne wartości jeśli brak
            if not hasattr(schedule_obj, 'day'):
                schedule_obj.day = 0
            if not hasattr(schedule_obj, 'notes'):
                schedule_obj.notes = ''
            if not hasattr(schedule_obj, 'attraction_id'):
                schedule_obj.attraction_id = None
                
            trip.schedule.append(schedule_obj)
        # load packing
        rows = cur.execute('SELECT id, trip_id, user_id, item_name, is_checked FROM packing_items WHERE trip_id=? ORDER BY id', (id,)).fetchall()
        for r in rows:
            p = PackingItem.from_row(r)
            if p:
                trip.packing_list.append(p)
        return trip

    def delete(self, id):
        cur = self.conn.cursor()
        cur.execute('DELETE FROM trip_members WHERE trip_id=?', (id,))
        cur.execute('DELETE FROM trip_attractions WHERE trip_id=?', (id,))
        cur.execute('DELETE FROM schedule_items WHERE trip_id=?', (id,))
        cur.execute('DELETE FROM packing_items WHERE trip_id=?', (id,))
        cur.execute('DELETE FROM trips WHERE id=?', (id,))
        self.conn.commit()

    def find_by_user(self, user_id):
        cur = self.conn.cursor()
        rows = cur.execute('SELECT t.id, t.title FROM trips t JOIN trip_members tm ON tm.trip_id=t.id WHERE tm.user_id=?', (user_id,)).fetchall()
        return [{'id': r['id'], 'title': r['title']} for r in rows]
