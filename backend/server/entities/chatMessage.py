from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class ChatMessage:
    id: Optional[int] = None
    trip_id: int = 0
    user_id: int = 0
    username: str = ""
    message: str = ""
    timestamp: str = ""
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "trip_id": self.trip_id,
            "user_id": self.user_id,
            "username": self.username,
            "message": self.message,
            "timestamp": self.timestamp
        }
    
    @staticmethod
    def from_row(row) -> Optional['ChatMessage']:
        if row is None:
            return None
        
        return ChatMessage(
            id=row.get("id"),
            trip_id=row.get("trip_id", 0),
            user_id=row.get("user_id", 0),
            username=row.get("username", ""),
            message=row.get("message", ""),
            timestamp=row.get("timestamp", "")
        )
