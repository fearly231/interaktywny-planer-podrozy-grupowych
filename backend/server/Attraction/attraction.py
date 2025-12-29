from Attraction.attractionState import AttractionState
from Attraction.proposedState import ProposedState

class Attraction:
    def __init__(self, id, name: str, type: str, note: str = ""):
        self.id = id
        self.name = name
        self.type = type
        self.note = note
        self.votes = 0
        # Domyślny stan na start to "Proposed" (Propozycja)
        self._state: AttractionState = ProposedState()

    # Metoda zmieniająca stan (używana przez stany konkretne)
    def change_state(self, new_state: AttractionState) -> None:
        print(f"--- Zmiana stanu: {type(self._state).__name__} -> {type(new_state).__name__} ---")
        self._state = new_state

    # --- Delegowanie zadań do aktualnego stanu ---
    # Atrakcja nie myśli "czy mogę zagłosować?". Ona pyta o to swój Stan.
    
    def vote_up(self):
        self._state.handle_vote(self)

    def approve(self):
        self._state.approve(self)

    def reject(self):
        self._state.reject(self)

    def __str__(self):
        return f"Atrakcja '{self.name}' (Głosów: {self.votes}, Stan: {type(self._state).__name__})"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "note": self.note,
            "votes": self.votes,
            "status": self._state.get_status_name()
        }