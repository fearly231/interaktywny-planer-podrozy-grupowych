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
        # Serializuj schedule - obsłuż zarówno ScheduleItem jak i dynamiczne obiekty
        schedule_list = []
        for s in self.schedule:
            if hasattr(s, 'to_dict'):
                schedule_list.append(s.to_dict())
            else:
                # Dynamiczny obiekt z atrybutami
                schedule_list.append({
                    "id": getattr(s, 'id', None),
                    "day": getattr(s, 'day', 0),
                    "attraction_id": getattr(s, 'attraction_id', None),
                    "attraction_name": getattr(s, 'attraction_name', ''),
                    "time": getattr(s, 'time', '09:00'),
                    "notes": getattr(s, 'notes', '')
                })
        
        return {
            "id": self.id,
            "title": self.title,
            "date": f"{self.start_date} - {self.end_date}", # Formatowanie dla frontu
            "start_date": self.start_date,
            "end_date": self.end_date,
            "budget": self.total_budget_limit,
            "attractions": [a.to_dict() for a in self.attractions],
            "schedule": schedule_list,
            "packingList": [p.to_dict() for p in self.packing_list],
            "members": [{"user_id": m.id, "username": m.username, "role": m.role} for m in self.members]
        }