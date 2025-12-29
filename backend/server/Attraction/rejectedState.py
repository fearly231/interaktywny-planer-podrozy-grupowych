from Attraction.attractionState import AttractionState
# USUŃ IMPORTY INNYCH STANÓW Z GÓRY

class RejectedState(AttractionState):
    def get_status_name(self):
        return "Odrzucone"

    def handle_vote(self, attraction):
        print("Błąd: Nie można głosować na odrzuconą atrakcję.")
        
    def approve(self, attraction):
        # IMPORT WEWNĄTRZ METODY
        from Attraction.approvedState import ApprovedState
        print("Przywracanie -> Zatwierdzone")
        attraction.change_state(ApprovedState())

    def reject(self, attraction):
        print("Już odrzucone.")