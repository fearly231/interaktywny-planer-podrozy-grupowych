from db import Database
import json

db = Database()
conn = db.get_connection()

# insert test item
conn.execute('INSERT INTO schedule_items (time,activity) VALUES (?,?)', ('07:30','Morning walk'))
conn.commit()

rows = [dict(r) for r in conn.execute('SELECT id,time,activity FROM schedule_items ORDER BY id')]
print(json.dumps(rows, ensure_ascii=False))
