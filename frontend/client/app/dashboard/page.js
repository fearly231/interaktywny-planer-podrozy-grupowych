'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/');
      }
    }
  }, [router]);

  // 1. STAN: Trzymamy tylko ID wybranej wycieczki
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [activeTab, setActiveTab] = useState('harmonogram');
  const [trips, setTrips] = useState(mockTrips);
  const API_BASE = 'http://localhost:5001';

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

  // --- OBSŁUGA PAKOWANIA ---
  const togglePacking = async (itemId) => {
    setTrips(prevTrips => prevTrips.map(trip => {
      if (trip.id !== selectedTripId) return trip;
      const newPacking = trip.packingList.map((it) => {
        if (it.id === itemId) {
          return { ...it, is_checked: !(it.is_checked ?? it.checked) };
        }
        return it;
      });
      return { ...trip, packingList: newPacking };
    }));
    try {
      const trip = trips.find(t => t.id === selectedTripId);
      const item = trip?.packingList?.find((p) => p.id === itemId);
      if (!item) return;
      await fetch(`${API_BASE}/api/packing/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_checked: !(item.is_checked ?? item.checked) })
      });
    } catch (err) {
      console.error('Failed to persist packing toggle', err);
    }
  };

  // Ładowanie listy pakowania z backendu lub tworzenie jej jeśli nie istnieje
  const loadPacking = async (trip) => {
    const USER_ID = 1; // temporary static user id
    try {
      const res = await fetch(`${API_BASE}/api/packing?trip_id=${trip.id}&user_id=${USER_ID}`);
      if (!res.ok) throw new Error('Failed to load packing items');
      const items = await res.json();
      if (items && items.length > 0) {
        setTrips(prevTrips => prevTrips.map(t => t.id === trip.id ? { ...trip, packingList: items } : t));
        setSelectedTripId(trip.id);
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
      setTrips(prevTrips => prevTrips.map(t => t.id === trip.id ? { ...trip, packingList: created } : t));
      setSelectedTripId(trip.id);
    } catch (err) {
      console.error('Error loading/creating packing items:', err);
      setSelectedTripId(trip.id);
    }
  };

  // --- WIDOK 1: LISTA PODRÓŻY (DASHBOARD GŁÓWNY) ---
  if (!selectedTripId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Moje Podróże 🌍</h1>
            <p className="text-gray-500">Wybierz wyjazd, aby zobaczyć szczegóły</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">
              + Nowa Podróż
            </button>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-blue-700 px-4 py-2 rounded-lg shadow transition font-semibold"
              onClick={() => {
                localStorage.removeItem('token');
                router.replace('/');
              }}
            >
              Wyloguj się
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div 
              key={trip.id}
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
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  if (!selectedTrip) return <div>Nie znaleziono wycieczki.</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Szczegóły podróży</h1>
          </div>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-blue-700 px-4 py-2 rounded-lg shadow transition font-semibold"
            onClick={() => {
              localStorage.removeItem('token');
              router.replace('/');
            }}
          >
            Wyloguj się
          </button>
        </header>
        <TripDetails 
          selectedTrip={selectedTrip}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSelectedTrip={() => setSelectedTripId(null)}
          handleVote={handleVote}
          togglePacking={togglePacking}
        />
      </div>
    </>
  );
}