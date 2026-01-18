from states.attractionState import AttractionState
class ApprovedState(AttractionState):
    def get_status_name(self):
        return "Zatwierdzone"
    def handle_vote(self, attraction):
        print("Atrakcja już jest zatwierdzona! Głosowanie nie ma wpływu, ale dziękujemy.")

    def approve(self, attraction):
        from states.approvedState import ApprovedState
        print("Już jest zatwierdzona.")
