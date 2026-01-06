from Attraction.attractionState import AttractionState
class ApprovedState(AttractionState):
    def get_status_name(self):
        return "Zatwierdzone"
    def handle_vote(self, attraction):
        print("Atrakcja już jest zatwierdzona! Głosowanie nie ma wpływu, ale dziękujemy.")

    def approve(self, attraction):
        from Attraction.approvedState import ApprovedState
        print("Już jest zatwierdzona.")

    def reject(self, attraction):
        from Attraction.rejectedState import RejectedState
        print("Cofanie zatwierdzenia...")
        attraction.change_state(RejectedState())