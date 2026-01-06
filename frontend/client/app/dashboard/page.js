'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TripDetails from './TripDetails';
import NewTripForm from './NewTripForm';
import Snowfall from './Snowfall';

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/');
      } else {
        // Pobierz nazwę użytkownika z localStorage z fallbackiem
        const name = localStorage.getItem('username') || localStorage.getItem('user_id') || 'Użytkowniku';
        setUserName(name);
      }
    }
  }, [router]);

  // 1. STAN: Trzymamy tylko ID wybranej wycieczki
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [activeTab, setActiveTab] = useState('harmonogram');
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [userVotedAttractions, setUserVotedAttractions] = useState([]);
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
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.error('Brak user_id w localStorage');
        return;
      }
      
      const response = await fetch(`http://localhost:5001/api/trips?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      } else {
        console.error('Błąd pobierania wycieczek:', response.status);
      }
    } catch (err) {
      console.error('Błąd ładowania wycieczek:', err);
    }
  };

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

  // Funkcja do pobrania głosów użytkownika dla wycieczki
  const loadUserVotes = async (tripId) => {
    const USER_ID = localStorage.getItem('user_id');
    if (!USER_ID) return;

    try {
      const trip = trips.find(t => t.id === tripId);
      if (!trip || !trip.attractions) return;

      // Sprawdź które atrakcje użytkownik zagłosował
      // Tymczasowo używamy informacji z attractions (votes)
      // W przyszłości można dodać endpoint do sprawdzania głosów użytkownika
      const votedIds = [];
      // Backend nie ma jeszcze endpointu do sprawdzania głosów użytkownika
      // Więc tymczasowo będziemy śledzić to lokalnie po akcjach głosowania
      setUserVotedAttractions(votedIds);
    } catch (err) {
      console.error('Błąd ładowania głosów użytkownika', err);
    }
  };

  // Załaduj głosy użytkownika gdy zmieni się wybrana wycieczka
  useEffect(() => {
    if (selectedTripId) {
      loadUserVotes(selectedTripId);
    }
  }, [selectedTripId]);

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
      // Aktualizuj liczbę głosów w state
      setTrips(prevTrips => prevTrips.map(trip => {
        if (trip.id !== tripId) return trip;
        return {
          ...trip,
          attractions: trip.attractions.map(attr => 
            attr.id === attractionId ? { ...attr, votes: updatedAttraction.votes } : attr
          )
        };
      }));
      // Dodaj do listy głosów użytkownika
      setUserVotedAttractions(prev => [...prev, attractionId]);
    })
    .catch(err => console.error("Błąd głosowania:", err));
  };

  // Cofnij głos
  const handleUnvote = (tripId, attractionId) => {
    const USER_ID = localStorage.getItem('user_id');
    if (!USER_ID) {
      console.error('Musisz być zalogowany, aby cofnąć głos');
      return;
    }

    fetch(`${API_BASE}/api/attractions/${attractionId}/vote`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(USER_ID) })
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(updatedAttraction => {
      // Aktualizuj liczbę głosów w state
      setTrips(prevTrips => prevTrips.map(trip => {
        if (trip.id !== tripId) return trip;
        return {
          ...trip,
          attractions: trip.attractions.map(attr => 
            attr.id === attractionId ? { ...attr, votes: updatedAttraction.votes } : attr
          )
        };
      }));
      // Usuń z listy głosów użytkownika
      setUserVotedAttractions(prev => prev.filter(id => id !== attractionId));
    })
    .catch(err => console.error("Błąd cofania głosu:", err));
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
        <Snowfall />
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Moje Podróże 🌍</h1>
            <p className="text-gray-500">Wybierz wyjazd, aby zobaczyć szczegóły</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <p className="text-gray-700 font-medium">Witaj {userName}!</p>
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
                <div className="flex gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  <span>{trip.attractions ? trip.attractions.length : 0} Atrakcji</span>
                </div>
                
                {/* Lista uczestników */}
                {trip.members && trip.members.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Uczestnicy:</p>
                    <div className="flex flex-wrap gap-2">
                      {trip.members.slice(0, 4).map((member, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
                        >
                          <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center font-bold">
                            {member.username ? member.username.charAt(0).toUpperCase() : '?'}
                          </span>
                          <span>{member.username || member.name || `Użytkownik ${member.user_id}`}</span>
                        </div>
                      ))}
                      {trip.members.length > 4 && (
                        <div className="flex items-center text-xs text-gray-500 font-semibold">
                          +{trip.members.length - 4} więcej
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
      <Snowfall />
      <div className="min-h-screen bg-gray-50 p-8">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Szczegóły podróży</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <p className="text-gray-700 font-medium">Witaj {userName}</p>
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
        <TripDetails 
          selectedTrip={selectedTrip}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSelectedTrip={() => setSelectedTripId(null)}
          handleVote={handleVote}
          handleUnvote={handleUnvote}
          togglePacking={togglePacking}
          addPackingItem={addPackingItem}
          refreshTrip={refreshTrip}
          userVotedAttractions={userVotedAttractions}
        />
      </div>
    </>
  );
}