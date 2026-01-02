from Trip.trip import Trip

class TripBuilder:
    def __init__(self):
        self._id = None
        self._title = None
        self._start = None
        self._end = None
        self._budget = 0.0
        self._initial_members = []

    def set_id(self, id):
        self._id = id
        return self

    def set_title(self, title):
        self._title = title
        return self

    def set_dates(self, start, end):
        self._start = start
        self._end = end
        return self

    def set_budget(self, amount):
        self._budget = amount
        return self

    def add_initial_member(self, user):
        self._initial_members.append(user)
        return self

    def build(self):
        trip = Trip(self._id, self._title, self._start, self._end, self._budget)
        for u in self._initial_members:
            trip.members.append(u)
        return trip
