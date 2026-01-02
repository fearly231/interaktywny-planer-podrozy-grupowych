from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: Optional[int] = None
    username: str = ""
    password: str = ""
    system_role: str = "user"  # np. 'user', 'admin', 'system'

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "system_role": self.system_role
        }

    @staticmethod
    def from_row(row) -> Optional['User']:
        if row is None:
            return None
        try:
            _id = row["id"]
        except Exception:
            _id = None
        try:
            username = row["username"]
        except Exception:
            username = row.get("username") if hasattr(row, "get") else ""
        try:
            password = row["password"]
        except Exception:
            password = row.get("password") if hasattr(row, "get") else ""
        # system_role may be absent in old DBs
        try:
            system_role = row["system_role"]
        except Exception:
            system_role = row.get("system_role") if hasattr(row, "get") else "user"
        return User(id=_id, username=username or "", password=password or "", system_role=system_role or "user")
