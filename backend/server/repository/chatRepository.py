from db.db import Database
from entities.chatMessage import ChatMessage
from typing import List, Optional
from datetime import datetime

class ChatRepository:
    def __init__(self):
        self.db = Database()
        self.conn = self.db.get_connection()
    
    def get_messages_by_trip(self, trip_id: int, limit: int = 100) -> List[ChatMessage]:
        """Pobierz wiadomości czatu dla danej wycieczki"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT cm.*, u.username 
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.trip_id = ?
            ORDER BY cm.timestamp DESC
            LIMIT ?
        ''', (trip_id, limit))
        
        rows = cursor.fetchall()
        messages = [ChatMessage.from_row(dict(row)) for row in rows]
        # Odwróć kolejność, aby najnowsze były na końcu
        return list(reversed(messages))
    
    def add_message(self, trip_id: int, user_id: int, message: str) -> Optional[ChatMessage]:
        """Dodaj nową wiadomość do czatu"""
        cursor = self.conn.cursor()
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            INSERT INTO chat_messages (trip_id, user_id, message, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (trip_id, user_id, message, timestamp))
        
        self.conn.commit()
        message_id = cursor.lastrowid
        
        # Pobierz utworzoną wiadomość z username
        cursor.execute('''
            SELECT cm.*, u.username 
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.id = ?
        ''', (message_id,))
        
        row = cursor.fetchone()
        if row:
            return ChatMessage.from_row(dict(row))
        return None
    
    def delete_message(self, message_id: int, user_id: int) -> bool:
        """Usuń wiadomość (tylko właściciel może usunąć swoją wiadomość)"""
        cursor = self.conn.cursor()
        cursor.execute('''
            DELETE FROM chat_messages 
            WHERE id = ? AND user_id = ?
        ''', (message_id, user_id))
        
        self.conn.commit()
        return cursor.rowcount > 0
