'use client';
import { useState, useEffect } from 'react';
import TripDetails from './TripDetails';

// --- MOCK DATA (DANE PRZYKŁADOWE) ---
// Używamy ich jako wartości początkowej, zanim przyjdą dane z API
const mockTrips = [
  {
    id: 1,
    title: 'Weekend w Tatrach 🏔️',
    date: '15-17 Października',
    description: 'Jesienne wyjście na szlaki i relaks w termach.',
    image: 'bg-gradient-to-br from-green-400 to-blue-500', 
    packingList: [
      { id: 1, item: 'Kurtka przeciwdeszczowa', checked: false },
    ],
    attractions: [
      { id: 1, name: 'Morskie Oko', type: 'Natura', note: 'Wyjść rano o 7:00!', votes: 0, status: 'Zatwierdzone' },
      { id: 2, name: 'Krupówki', type: 'Miasto', note: 'Kupić oscypka', votes: 0, status: 'Propozycja' },
    ],
    schedule: []
  },
  // ... (reszta mocków opcjonalna)
];

export default function Dashboard() {
  // 1. STAN: Trzymamy tylko ID wybranej wycieczki
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [activeTab, setActiveTab] = useState('harmonogram');
  const [trips, setTrips] = useState(mockTrips);

  // 2. EFEKT: Pobranie danych z backendu (żeby nadpisać mocki)
  useEffect(() => {
    fetch('http://127.0.0.1:5001/api/trips')
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(err => console.error("Backend nie działa, używam mocków:", err));
  }, []);

  // 3. OBSŁUGA GŁOSOWANIA
  const handleVote = (tripId, attractionId) => {
    fetch(`http://127.0.0.1:5001/api/attractions/${attractionId}/vote`, {
        method: 'POST'
    })
    .then(res => res.json())
    .then(updatedAttraction => {
        console.log("Nowy stan atrakcji:", updatedAttraction);
        
        setTrips(prevTrips => prevTrips.map(trip => {
            if (trip.id !== tripId) return trip;
            return {
                ...trip,
                attractions: trip.attractions.map(attr => 
                    attr.id === attractionId ? updatedAttraction : attr
                )
            };
        }));
    })
    .catch(err => console.error("Błąd głosowania:", err));
  };

  // --- WIDOK 1: LISTA PODRÓŻY (DASHBOARD GŁÓWNY) ---
  // Sprawdzamy ID, a nie obiekt
  if (!selectedTripId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Moje Podróże 🌍</h1>
            <p className="text-gray-500">Wybierz wyjazd, aby zobaczyć szczegóły</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">
            + Nowa Podróż
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div 
              key={trip.id}
              // POPRAWKA: Ustawiamy ID, a nie obiekt
              onClick={() => setSelectedTripId(trip.id)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 overflow-hidden group"
            >
              <div className={`h-32 ${trip.image} p-4 flex items-end`}>
                <span className="bg-white/90 px-2 py-1 rounded text-xs font-bold text-gray-700">
                  {trip.date}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                  {trip.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {trip.description}
                </p>
                <div className="flex gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <span>{trip.attractions ? trip.attractions.length : 0} Atrakcji</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- WIDOK 2: SZCZEGÓŁY PODRÓŻY ---
  
  // KLUCZOWY MOMENT: Znajdujemy aktualną wersję wycieczki na podstawie ID
  // Dzięki temu, gdy `trips` się zmieni (po głosowaniu), `selectedTrip` też się odświeży.
  const selectedTrip = trips.find(t => t.id === selectedTripId);

  // Zabezpieczenie (gdyby ID było niepoprawne)
  if (!selectedTrip) return <div>Nie znaleziono wycieczki.</div>;

  return (
    <TripDetails 
      selectedTrip={selectedTrip} // Przekazujemy "żywą" wersję
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      // Przekazujemy funkcję resetującą ID (powrót do listy)
      setSelectedTrip={() => setSelectedTripId(null)} 
      handleVote={handleVote}
    />
  );
}