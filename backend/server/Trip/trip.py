from Attraction.attraction import Attraction

class Trip:
    def __init__(self, id, title, start_date, end_date, budget_limit):
        self.id = id
        self.title = title
        self.start_date = start_date # Przechowujemy jako string lub datetime
        self.end_date = end_date
        self.total_budget_limit = budget_limit
        
        # Kompozycja (listy obiektów)
        self.attractions = []     # List[Attraction]
        self.schedule = []        # List[ScheduleItem]
        self.packing_list = []    # List[PackingItem]
        self.members = []         # List[GroupMember]

    # Metody biznesowe z diagramu UML
    def calculate_total_estimated_cost(self):
        # Tu w przyszłości zsumujesz koszty atrakcji i inne wydatki
        pass

    def sort_attractions(self, strategy):
        # Wykorzystujemy Twój wzorzec Strategy
        self.attractions = strategy.sort(self.attractions)

    # Helper do API
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "date": f"{self.start_date} - {self.end_date}", # Formatowanie dla frontu
            "start_date": self.start_date,
            "end_date": self.end_date,
            "budget": self.total_budget_limit,
            "attractions": [a.to_dict() for a in self.attractions],
            "schedule": [s.to_dict() for s in self.schedule],
            "packingList": [p.to_dict() for p in self.packing_list],
            "members": [{"user_id": m.id, "username": m.username, "role": m.role} for m in self.members]
        }