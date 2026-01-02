'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TripDetails from './TripDetails';
import NewTripForm from './NewTripForm';

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
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [activeTab, setActiveTab] = useState('harmonogram');
  const [showNewTrip, setShowNewTrip] = useState(false);
  const API_BASE = 'http://localhost:5001';

  const handleCreateTrip = (tripOrId) => {
    setShowNewTrip(false);
    if (!tripOrId) return;

    // jeśli otrzymaliśmy pełny obiekt tripa
    if (typeof tripOrId === 'object') {
      const trip = tripOrId;
      setTrips(prev => [trip, ...prev]);
      setSelectedTripId(trip.id);
      return;
    }

    // inaczej traktujemy jako id
    const tripId = tripOrId;
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setSelectedTripId(tripId);
      return;
    }
    // fallback: pobierz konkretny trip po id i dodaj do stanu
    fetch(`${API_BASE}/api/trips/${tripId}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => {
        // backend zwróci pełny obiekt tripa
        setTrips(prev => [data, ...prev]);
        setSelectedTripId(tripId);
      })
      .catch(() => {
        // jeśli nie uda się pobrać konkretnego tripa, spróbuj przeładować listę
        fetch(`${API_BASE}/api/trips`).then(r => r.json()).then(data => {
          setTrips(data);
          setSelectedTripId(tripId);
        }).catch(() => setSelectedTripId(tripId));
      });
  };

  // 2. EFEKT: Pobranie danych z backendu
  useEffect(() => {
    fetch('http://127.0.0.1:5001/api/trips')
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(err => console.error("Błąd pobierania tripów:", err));
  }, []);

  // Funkcja do odświeżenia tripa z backendu (gdy zmienią się atrakcje/członkowie)
  const refreshTrip = async (tripId) => {
    try {
      const res = await fetch(`${API_BASE}/api/trips/${tripId}`);
      if (res.ok) {
        const updatedTrip = await res.json();
        setTrips(prevTrips => prevTrips.map(t => t.id === tripId ? updatedTrip : t));
      }
    } catch (err) {
      console.error('Nie udało się odświeżyć tripa', err);
    }
  };

  // 3. OBSŁUGA GŁOSOWANIA
  const handleVote = (tripId, attractionId) => {
    const USER_ID = localStorage.getItem('user_id');
    if (!USER_ID) {
      console.error('Musisz być zalogowany, aby głosować');
      return;
    }

    fetch(`${API_BASE}/api/attractions/${attractionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(USER_ID) })
    })
    .then(res => {
      if (res.status === 409) {
        alert('Już głosowałeś na tę atrakcję!');
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(updatedAttraction => {
      if (!updatedAttraction) return; // 409 case
      setTrips(prevTrips => prevTrips.map(trip => {
        if (trip.id !== tripId) return trip;
        return {
          ...trip,
          attractions: trip.attractions.map(attr => 
            attr.id === attractionId ? { ...attr, votes: updatedAttraction.votes } : attr
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

  // Dodawanie nowej rzeczy do listy pakowania
  const addPackingItem = async (itemName) => {
    const USER_ID = localStorage.getItem('user_id');
    if (!selectedTripId || !itemName) return;
    try {
      const res = await fetch(`${API_BASE}/api/packing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: selectedTripId,
          user_id: USER_ID,
          item_name: itemName,
          is_checked: 0
        })
      });
      if (!res.ok) throw new Error('Błąd dodawania rzeczy');
      const newItem = await res.json();
      setTrips(prevTrips => prevTrips.map(trip => {
        if (trip.id !== selectedTripId) return trip;
        return { ...trip, packingList: [...trip.packingList, newItem] };
      }));
    } catch (err) {
      console.error('Nie udało się dodać rzeczy do pakowania', err);
    }
  };

  // Ładowanie listy pakowania z backendu lub tworzenie jej jeśli nie istnieje
  const loadPacking = async (trip) => {
    const USER_ID = localStorage.getItem('user_id');
    try {
      const res = await fetch(`${API_BASE}/api/packing?trip_id=${trip.id}`);
      if (!res.ok) {
        console.error('Failed to load packing items:', await res.text());
        setSelectedTripId(trip.id);
        return;
      }
      const items = await res.json();
      if (items && items.length > 0) {
        setTrips(prevTrips => prevTrips.map(t => t.id === trip.id ? { ...trip, packingList: items } : t));
        setSelectedTripId(trip.id);
        return;
      }
      // If backend has no items yet, create them from the trip object
      const created = [];
      if (trip.packingList) {
        for (const it of trip.packingList) {
          const r = await fetch(`${API_BASE}/api/packing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trip_id: trip.id, user_id: USER_ID, item_name: it.item, is_checked: it.checked ? 1 : 0 })
          });
          if (r.ok) created.push(await r.json());
        }
        setTrips(prevTrips => prevTrips.map(t => t.id === trip.id ? { ...trip, packingList: created } : t));
      }
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
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition" onClick={() => setShowNewTrip(true)}>
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
              <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 p-4 flex items-end">
                <span className="bg-white/90 px-2 py-1 rounded text-xs font-bold text-gray-700">
                  {trip.start_date} - {trip.end_date}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                  {trip.title}
                </h3>
                <div className="flex gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <span>{trip.attractions ? trip.attractions.length : 0} Atrakcji</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showNewTrip && (
          <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-4xl my-8">
              <NewTripForm onCreate={handleCreateTrip} />
              <div className="mt-4 text-right mb-8">
                <button className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition" onClick={() => setShowNewTrip(false)}>Zamknij</button>
              </div>
            </div>
          </div>
        )}
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
          addPackingItem={addPackingItem}
          refreshTrip={refreshTrip}
        />
      </div>
    </>
  );
}