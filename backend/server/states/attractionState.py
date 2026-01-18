from abc import ABC, abstractmethod

class AttractionState(ABC):
    @abstractmethod
    def get_status_name(self):
        pass

    @abstractmethod
    def handle_vote(self, attraction):
        pass

    @abstractmethod
    def approve(self, attraction):
        pass

    @abstractmethod
    def reject(self, attraction):
        pass