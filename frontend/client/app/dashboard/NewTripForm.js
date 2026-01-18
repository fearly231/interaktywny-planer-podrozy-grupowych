import React, { useState, useRef } from 'react';

export default function NewTripForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [attractionName, setAttractionName] = useState('');
  const [attractionCost, setAttractionCost] = useState('');
  const [attractionLink, setAttractionLink] = useState('');
  const [attractions, setAttractions] = useState([]);
  const [memberUsername, setMemberUsername] = useState('');
  const [members, setMembers] = useState([]);
  const [description, setDescription] = useState('');

  const monthsPL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  const [startDay, setStartDay] = useState('');
  const [startMonthIdx, setStartMonthIdx] = useState(1);
  const [startYearInput, setStartYearInput] = useState('');
  const [endDay, setEndDay] = useState('');
  const [endMonthIdx, setEndMonthIdx] = useState(1);
  const [endYearInput, setEndYearInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [memberError, setMemberError] = useState('');
  const [touched, setTouched] = useState(false);

  const titleRef = useRef(null);

  const addAttraction = () => {
    setTouched(true);
    const name = attractionName.trim();
    if (!name) return;
    
    const cost = parseFloat(attractionCost) || 0;
    const link = attractionLink.trim();
    
    setAttractions(prev => [...prev, { 
      name, 
      cost,
      link: link || null
    }]);
    setAttractionName('');
    setAttractionCost('');
    setAttractionLink('');
  };

  const removeAttraction = (idx) => {
    setAttractions(prev => prev.filter((_, i) => i !== idx));
  };

  const addMember = async () => {
    setTouched(true);
    const username = memberUsername.trim();
    if (!username) return;
    
    // Sprawdź czy użytkownik już jest na liście
    if (members.some(m => m.username.toLowerCase() === username.toLowerCase())) {
      setMemberError('Użytkownik już dodany.');
      setTimeout(() => setMemberError(''), 2500);
      return;
    }

    // Sprawdź czy użytkownik istnieje w bazie danych
    try {
      const res = await fetch('http://localhost:5001/api/users/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.exists) {
        setMemberError(data.message || `Użytkownik '${username}' nie istnieje w systemie`);
        setTimeout(() => setMemberError(''), 3000);
        return;
      }
      
      // Użytkownik istnieje - dodaj do listy
      setMembers(prev => [...prev, { username: data.username }]);
      setMemberUsername('');
      setMemberError('');
    } catch (err) {
      console.error('Błąd sprawdzania użytkownika:', err);
      setMemberError('Błąd połączenia z serwerem');
      setTimeout(() => setMemberError(''), 2500);
    }
  };

  const removeMember = (idx) => {
    setMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const makeIso = (d, mIdx, y) => {
    if (d && mIdx && y) {
      const dd = String(d).padStart(2, '0');
      const mm = String(mIdx).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    }
    return null;
  };

  const validate = () => {
    if (!title.trim()) return 'Podaj nazwę wycieczki.';
    const s = makeIso(startDay, startMonthIdx, startYearInput);
    const e = makeIso(endDay, endMonthIdx, endYearInput);
    if (s && e) {
      try {
        const ds = new Date(s);
        const de = new Date(e);
        if (isNaN(ds.valueOf()) || isNaN(de.valueOf())) return 'Nieprawidłowe daty.';
        if (ds > de) return 'Data startu nie może być późniejsza niż data końca.';
      } catch (err) {
        return 'Błąd przy interpretacji dat.';
      }
    }
    return null;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    setSuccess('');

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setLoading(true);
      const USER_ID = localStorage.getItem('user_id');
      if (!USER_ID) {
        setError('Musisz być zalogowany, aby utworzyć wycieczkę.');
        setLoading(false);
        return;
      }

      const start_iso = makeIso(startDay, startMonthIdx, startYearInput) || '';
      const end_iso = makeIso(endDay, endMonthIdx, endYearInput) || '';

      const payload = {
        title: title.trim(),
        start_date: start_iso,
        end_date: end_iso,
        budget: Number(budget) || 0,
        description: description.trim(),
        user_id: USER_ID
      };

      const res = await fetch('http://localhost:5001/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let txt = await res.text().catch(() => null);
        setError(`Błąd tworzenia wycieczki: ${res.status}${txt ? ' - ' + txt : ''}`);
        setLoading(false);
        return;
      }

      const trip = await res.json();

      // Dodaj atrakcje i zbierz ostatnie dane
      let updatedAttractions = [...(trip.attractions || [])];
      for (const a of attractions) {
        try {
          const res = await fetch(`http://localhost:5001/api/trips/${trip.id}/attractions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: a.name,
              cost: a.cost || 0,
              link: a.link || null
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.attractions) {
              updatedAttractions = data.attractions;
            }
          }
        } catch (err) {
          console.warn('Nie udało się dodać atrakcji', a, err);
        }
      }

      // Dodaj członków i zbierz ostatnie dane
      let updatedMembers = [...(trip.members || [])];
      for (const m of members) {
        try {
          const res = await fetch(`http://localhost:5001/api/trips/${trip.id}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: m.username })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.members) {
              updatedMembers = data.members;
            }
          } else {
            // Obsłuż błąd z serwera
            const errorData = await res.json().catch(() => ({}));
            const errorMsg = errorData.message || 'Nie udało się dodać członka';
            setMemberError(`Błąd dodawania użytkownika "${m.username}": ${errorMsg}`);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Nie udało się dodać członka', m, err);
          setMemberError(`Błąd połączenia podczas dodawania użytkownika "${m.username}"`);
          setLoading(false);
          return;
        }
      }

      let updated = trip;
      // Zsynchronizuj zaktualizowane atrakcje i członków
      if (updatedAttractions.length > 0) {
        updated.attractions = updatedAttractions;
      }
      if (updatedMembers.length > 0) {
        updated.members = updatedMembers;
      }
      
      try {
        const r = await fetch(`http://localhost:5001/api/trips/${trip.id}`);
        if (r.ok) updated = await r.json();
      } catch (err) { /* ignore */ }

      setSuccess('Wycieczka utworzona pomyślnie!');
      setLoading(false);
      setTitle('');
      setStartDay(''); setStartYearInput(''); setEndDay(''); setEndYearInput('');
      setBudget('');
      setAttractions([]);
      setMembers([]);
      setDescription('');

      onCreate(updated);
    } catch (err) {
      console.error('Error in handleCreate', err);
      setError('Błąd połączenia. Sprawdź konsolę.');
      setLoading(false);
    }
  };

  const formError = touched && validate();

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 rounded-lg">
      <form onSubmit={handleCreate} className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">✈️</div>
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Nowa wycieczka</h2>
          </div>
          <p className="text-gray-600 ml-14">Zaplanuj swoją następną przygodę</p>
        </div>

        {/* Alerts */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div role="status" className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">✓</span>
              <span className="text-green-700 font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Section 1: Podstawowe informacje */}
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Podstawowe informacje
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nazwa wycieczki</label>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Weekend w Zakopanem"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition font-medium"
                  required
                  aria-required="true"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Data startu</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="31" value={startDay} onChange={e => setStartDay(e.target.value.replace(/[^0-9]/g, ''))} placeholder="DD" className="w-16 px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-center text-gray-800 placeholder-gray-400 transition" />
                    <select value={startMonthIdx} onChange={e => setStartMonthIdx(parseInt(e.target.value))} className="flex-1 px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-gray-800 transition">
                      {monthsPL.map((m, i) => (
                        <option key={i} value={i+1}>{m}</option>
                      ))}
                    </select>
                    <input type="number" min="1900" max="2100" value={startYearInput} onChange={e => setStartYearInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="YYYY" className="w-20 px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-center text-gray-800 placeholder-gray-400 transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Data końca</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="31" value={endDay} onChange={e => setEndDay(e.target.value.replace(/[^0-9]/g, ''))} placeholder="DD" className="w-16 px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-center text-gray-800 placeholder-gray-400 transition" />
                    <select value={endMonthIdx} onChange={e => setEndMonthIdx(parseInt(e.target.value))} className="flex-1 px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-gray-800 transition">
                      {monthsPL.map((m, i) => (
                        <option key={i} value={i+1}>{m}</option>
                      ))}
                    </select>
                    <input type="number" min="1900" max="2100" value={endYearInput} onChange={e => setEndYearInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="YYYY" className="w-20 px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-center text-gray-800 placeholder-gray-400 transition" />
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budżet (PLN)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-semibold">💰</span>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition font-medium" placeholder="0" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Opis */}
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">📖</span>
              Opis wycieczki
            </h3>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Weekend w Tatrach — krótki opis planu i atrakcji"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition resize-none"
              rows="5"
            />
          </div>

          {/* Section 3: Atrakcje i Uczestnicy */}
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Atrakcje i uczestnicy
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Attractions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Atrakcje</label>
                
                {/* Nazwa atrakcji */}
                <div className="mb-3">
                  <input
                    value={attractionName}
                    onChange={e => setAttractionName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addAttraction(); } }}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition"
                    placeholder="Nazwa atrakcji (np. Morskie Oko)"
                  />
                </div>
                
                {/* Koszt i Link w jednym wierszu */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="number"
                    value={attractionCost}
                    onChange={e => setAttractionCost(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAttraction(); } }}
                    className="px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition text-sm"
                    placeholder="Koszt (PLN)"
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="url"
                    value={attractionLink}
                    onChange={e => setAttractionLink(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAttraction(); } }}
                    className="px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-gray-800 placeholder-gray-400 transition text-sm"
                    placeholder="Link (opcjonalnie)"
                  />
                </div>
                
                {/* Przycisk dodaj */}
                <button
                  type="button"
                  onClick={addAttraction}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-[1.02] active:scale-95"
                >
                  + Dodaj atrakcję
                </button>

                <div className="space-y-2 bg-gray-50 rounded-lg p-4 min-h-[120px] mt-4">
                  {attractions.length ? (
                    <div className="space-y-2">
                      {attractions.map((a, i) => (
                        <div key={i} className="group flex items-center justify-between bg-white text-gray-800 px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition border border-gray-200">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{a.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {a.cost > 0 && <span className="font-semibold text-blue-600">{a.cost} PLN</span>}
                              {a.link && (
                                <span className="ml-2">
                                  <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    🔗 Link
                                  </a>
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttraction(i)}
                            aria-label={`Usuń atrakcję ${a.name}`}
                            className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-red-500 font-bold transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic">Brak atrakcji. Dodaj pierwszą!</p>
                  )}
                </div>
              </div>

              {/* Members */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Uczestnicy</label>
                <div className="flex gap-2 mb-4">
                  <input
                    value={memberUsername}
                    onChange={e => setMemberUsername(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }}
                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-purple-500 focus:outline-none text-gray-800 placeholder-gray-400 transition"
                    placeholder="np. username"
                  />
                  <button
                    type="button"
                    onClick={addMember}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-105 active:scale-95"
                  >
                    +
                  </button>
                </div>

                {memberError && (
                  <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <span className="text-red-700 text-sm font-medium">{memberError}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 bg-gray-50 rounded-lg p-4 min-h-[120px]">
                  {members.length ? (
                    <div className="flex flex-wrap gap-2">
                      {members.map((m, i) => (
                        <div key={i} className="group flex items-center gap-2 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition border border-purple-200">
                          <span className="text-sm font-medium">👤 {m.username}</span>
                          <button
                            type="button"
                            onClick={() => removeMember(i)}
                            aria-label={`Usuń użytkownika ${m.username}`}
                            className="opacity-0 group-hover:opacity-100 text-purple-600 hover:text-red-500 font-bold transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic">Brak uczestników. Dodaj kogoś!</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Action Buttons */}
          <div className="p-8 bg-gradient-to-r from-gray-50 to-blue-50 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setAttractions([]);
                setMembers([]);
                setError('');
                setSuccess('');
                setDescription('');
                setBudget('');
                setStartDay('');
                setEndDay('');
              }}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition shadow-sm"
            >
              Wyczyść
            </button>
            <button
              type="submit"
              disabled={loading || !!formError}
              className={`px-8 py-3 font-semibold rounded-lg shadow-lg transition transform ${
                loading || formError
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl active:scale-95 hover:scale-105'
              }`}
            >
              {loading ? '⏳ Tworzenie...' : '🚀 Utwórz wycieczkę'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
