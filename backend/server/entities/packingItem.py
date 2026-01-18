from dataclasses import dataclass
from typing import Optional

@dataclass
class PackingItem:
    id: Optional[int] = None
    trip_id: Optional[int] = None
    user_id: Optional[int] = None
    item_name: str = ""
    is_checked: bool = False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "trip_id": self.trip_id,
            "user_id": self.user_id,
            "item_name": self.item_name,
            "is_checked": bool(self.is_checked),
        }

    @staticmethod
    def from_row(row) -> Optional['PackingItem']:
        if row is None:
            return None
        try:
            _id = row["id"]
        except Exception:
            _id = None
        try:
            trip_id = row["trip_id"]
        except Exception:
            trip_id = None
        try:
            user_id = row["user_id"]
        except Exception:
            user_id = None
        try:
            name = row["item_name"]
        except Exception:
            name = row.get("item_name") if hasattr(row, "get") else ""
        try:
            checked = row["is_checked"]
        except Exception:
            checked = 0
        return PackingItem(id=_id, trip_id=trip_id, user_id=user_id, item_name=name or "", is_checked=bool(checked))
