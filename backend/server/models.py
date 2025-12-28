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
