from dataclasses import dataclass
from typing import Optional

@dataclass
class GroupMember:
    user_id: Optional[int] = None
    trip_id: Optional[int] = None
    role: str = 'member'  # 'member' lub 'moderator'

    def to_dict(self):
        return {"user_id": self.user_id, "trip_id": self.trip_id, "role": self.role}

    @staticmethod
    def from_row(row) -> Optional['GroupMember']:
        if row is None:
            return None
        try:
            user_id = row['user_id']
        except Exception:
            user_id = row.get('user_id') if hasattr(row, 'get') else None
        try:
            trip_id = row['trip_id']
        except Exception:
            trip_id = row.get('trip_id') if hasattr(row, 'get') else None
        try:
            role = row['role']
        except Exception:
            role = row.get('role') if hasattr(row, 'get') else 'member'
        return GroupMember(user_id=user_id, trip_id=trip_id, role=role)
