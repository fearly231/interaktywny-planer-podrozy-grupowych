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
      { id: 2, item: 'Buty trekkingowe', checked: false },
      { id: 3, item: 'Powerbank', checked: false },
      { id: 4, item: 'Gotówka (na schroniska)', checked: false },
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
  {
    id: 2,
    title: 'City Break Trójmiasto 🌊',
    date: '10-12 Lipca',
    description: 'Zwiedzanie Gdańska, Sopotu i Gdyni.',
    image: 'bg-gradient-to-br from-blue-400 to-indigo-600',
    packingList: [
      { id: 1, item: 'Okulary przeciwsłoneczne', checked: false },
      { id: 2, item: 'Krem z filtrem', checked: false },
      { id: 3, item: 'Strój kąpielowy', checked: false },
    ],
    attractions: [
      { id: 1, name: 'Muzeum II Wojny Światowej', type: 'Muzeum', note: 'Rezerwacja biletów online' },
      { id: 2, name: 'Molo w Sopocie', type: 'Spacer', note: 'Lody na monciaku' },
      { id: 3, name: 'Akwarium Gdyńskie', type: 'Edukacja', note: '' },
    ],
    schedule: [
      { time: '10:00', activity: 'Spacer po Starówce' },
      { time: '14:00', activity: 'Rejs statkiem' },
      { time: '20:00', activity: 'Impreza w Sopocie' },
    ]
  }
];

export default function Dashboard() {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('harmonogram'); // harmonogram | pakowanie | atrakcje
  const API_BASE = 'http://localhost:5001';

  const togglePacking = async (id) => {
    // optimistic update
    let newChecked = false;
    setSelectedTrip((prev) => {
      if (!prev) return prev;
      const newPacking = prev.packingList.map((it) => {
        if (it.id === id) {
          newChecked = !it.is_checked && !it.checked ? true : !it.is_checked && it.checked === undefined ? !it.checked : !it.is_checked;
          // support both legacy `checked` and persisted `is_checked`
          return { ...it, is_checked: !(it.is_checked || it.checked) };
        }
        return it;
      });
      return { ...prev, packingList: newPacking };
    });

    try {
      const item = selectedTrip?.packingList?.find((p) => p.id === id);
      if (!item) return;
      // Ensure we reference the id from persisted items
      await fetch(`${API_BASE}/api/packing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_checked: !(item.is_checked || item.checked) })
      });
    } catch (err) {
      console.error('Failed to persist packing toggle', err);
    }
  };

  const loadPacking = async (trip) => {
    const USER_ID = 1; // temporary static user id
    try {
      const res = await fetch(`${API_BASE}/api/packing?trip_id=${trip.id}&user_id=${USER_ID}`);
      if (!res.ok) throw new Error('Failed to load packing items');
      const items = await res.json();
      if (items && items.length > 0) {
        setSelectedTrip({ ...trip, packingList: items });
        return;
      }
      // if backend has no items yet, create them from mock trip
      const created = [];
      for (const it of trip.packingList) {
        const r = await fetch(`${API_BASE}/api/packing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trip_id: trip.id, user_id: USER_ID, item_name: it.item, is_checked: it.checked ? 1 : 0 })
        });
        if (r.ok) created.push(await r.json());
      }
      setSelectedTrip({ ...trip, packingList: created });
    } catch (err) {
      console.error('Error loading/creating packing items:', err);
      // fallback to local mock data
      setSelectedTrip(JSON.parse(JSON.stringify(trip)));
    }
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
              onClick={() => loadPacking(trip)}
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
        {/* Treść Zakładek */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
          
          {activeTab === 'harmonogram' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Plan Dnia</h2>
              <div className="relative border-l-2 border-blue-100 ml-3 space-y-8">
                {selectedTrip.schedule.map((item, idx) => (
                  <div key={idx} className="relative pl-8">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 bg-blue-500 rounded-full border-4 border-white ring-1 ring-blue-100"></span>
                    <span className="block text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">
                      {item.time}
                    </span>
                    <p className="text-gray-700 text-lg">{item.activity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pakowanie' && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Co zabrać?</h2>
              <ul className="space-y-3">
                {selectedTrip.packingList.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                    <input 
                      type="checkbox" 
                      checked={!!(item.is_checked ?? item.checked)}
                      onChange={() => togglePacking(item.id)}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    />
                    <span className={(item.is_checked ?? item.checked) ? "text-gray-400 line-through" : "text-gray-700"}>
                      {item.item_name ?? item.item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'atrakcje' && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Miejsca do odwiedzenia</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTrip.attractions.map((place) => (
                  <div key={place.id} className="border border-gray-200 p-4 rounded-xl hover:border-blue-300 transition bg-gray-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{place.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {place.type}
                      </span>
                    </div>
                    {place.note && (
                      <p className="text-sm text-gray-500 italic">"{place.note}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}