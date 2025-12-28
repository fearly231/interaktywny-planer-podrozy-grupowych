from Attraction.attractionState import AttractionState

class ProposedState(AttractionState):

    def get_status_name(self):
        return "Propozycja"
    
    def handle_vote(self, attraction):
        attraction.votes += 1
        print(f"Dodano głos do '{attraction.name}'. Razem: {attraction.votes}")

    def approve(self, attraction):
        # Przejście do stanu Zatwierdzonego
        from Attraction.approvedState import ApprovedState
        attraction.change_state(ApprovedState())

    def reject(self, attraction):
        # Przejście do stanu Odrzuconego
        from Attraction.rejectedState import RejectedState
        attraction.change_state(RejectedState())