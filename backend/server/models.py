"""Models for the travel planner backend.

This module currently defines the `ScheduleItem` dataclass used to
represent a single item in a trip schedule (time + activity).
"""
from dataclasses import dataclass
from datetime import datetime, time
from typing import Optional, Union


@dataclass
class ScheduleItem:
    id: Optional[int] = None
    # store time either as a datetime.time or as an ISO-like string "HH:MM:SS"
    time: Optional[Union[time, str]] = None
    activity: str = ""

    def to_dict(self) -> dict:
        """Return a JSON-serializable representation."""
        t = self.time
        if isinstance(t, time):
            t = t.strftime("%H:%M:%S")
        return {"id": self.id, "time": t, "activity": self.activity}

    @classmethod
    def from_row(cls, row) -> Optional['ScheduleItem']:
        """Create ScheduleItem from a sqlite3.Row-like mapping.

        Expects `row` to have at least the keys `id`, `time`, `activity`
        (or `activity_name`). If `time` is a string it will be parsed to
        a `datetime.time` when possible; otherwise left as-is.
        """
        if row is None:
            return None

        raw_time = None
        try:
            raw_time = row["time"]
        except Exception:
            raw_time = None

        parsed_time = raw_time
        if isinstance(raw_time, str) and raw_time:
            for fmt in ("%H:%M:%S", "%H:%M"):
                try:
                    parsed_time = datetime.strptime(raw_time, fmt).time()
                    break
                except Exception:
                    pass

        activity = None
        try:
            activity = row["activity"]
        except Exception:
            activity = row.get("activity_name") if hasattr(row, "get") else None

        _id = None
        try:
            _id = row["id"]
        except Exception:
            _id = None

        return cls(id=_id, time=parsed_time, activity=activity or "")


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

    @classmethod
    def from_row(cls, row) -> Optional['PackingItem']:
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
        return cls(id=_id, trip_id=trip_id, user_id=user_id, item_name=name or "", is_checked=bool(checked))
