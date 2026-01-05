import React, { useState } from 'react';
import PackingList from './PackingList';
import AttractionsList from './AttractionsList';
import Schedule from './Schedule';

export default function TripDetails({ selectedTrip, activeTab, setActiveTab, setSelectedTrip, handleVote, togglePacking, addPackingItem, refreshTrip }) {
  const [newAttractionName, setNewAttractionName] = useState('');
  const [addingAttraction, setAddingAttraction] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  if (!selectedTrip) return null;

  const currentUserId = localStorage.getItem('user_id');
  const currentUserMember = selectedTrip.members?.find(m => m.user_id === parseInt(currentUserId));
  const isModerator = currentUserMember?.role === 'moderator';

  const handleAddAttraction = async () => {
    const name = newAttractionName.trim();
    if (!name) return;
    
    try {
      setAddingAttraction(true);
      const res = await fetch(`http://localhost:5001/api/trips/${selectedTrip.id}/attractions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewAttractionName('');
        // Odśwież trip aby pobrać zaktualizowaną listę atrakcji
        await refreshTrip(selectedTrip.id);
      }
    } catch (err) {
      console.error('Nie udało się dodać atrakcji', err);
    } finally {
      setAddingAttraction(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!isModerator) return;
    
    if (!confirm('Czy na pewno chcesz usunąć tego uczestnika z wycieczki?')) return;
    
    try {
      setRemovingMemberId(userId);
      const res = await fetch(`http://localhost:5001/api/trips/${selectedTrip.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: currentUserId })
      });
      
      if (res.ok) {
        // Odśwież trip aby pobrać zaktualizowaną listę uczestników
        await refreshTrip(selectedTrip.id);
      } else {
        const error = await res.json();
        alert(error.message || 'Nie udało się usunąć uczestnika');
      }
    } catch (err) {
      console.error('Nie udało się usunąć uczestnika', err);
      alert('Wystąpił błąd podczas usuwania uczestnika');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleAddMember = async () => {
    const username = newMemberUsername.trim();
    if (!username) return;
    
    try {
      setAddingMember(true);
      const res = await fetch(`http://localhost:5001/api/trips/${selectedTrip.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (res.ok) {
        setNewMemberUsername('');
        setShowAddMember(false);
        // Odśwież trip aby pobrać zaktualizowaną listę uczestników
        await refreshTrip(selectedTrip.id);
      } else {
        const error = await res.json();
        alert(error.message || 'Nie udało się dodać uczestnika');
      }
    } catch (err) {
      console.error('Nie udało się dodać uczestnika', err);
      alert('Wystąpił błąd podczas dodawania uczestnika');
    } finally {
      setAddingMember(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Pasek nawigacji powrotu */}
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setSelectedTrip(null);
              setActiveTab('harmonogram'); // Reset zakładki po wyjściu
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600"
          >
            ⬅ Wróć
          </button>
          <h1 className="text-xl font-bold text-gray-800">{selectedTrip.title}</h1>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {selectedTrip.start_date} - {selectedTrip.end_date}
        </div>
      </div>

      <main className="flex-1 p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto flex gap-6">
          {/* Lewa kolumna - główna zawartość */}
          <div className="flex-1">
            {/* Zakładki */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl mb-8 w-fit">
              {[
                { id: 'harmonogram', label: '📅 Harmonogram' },
                { id: 'pakowanie', label: '🎒 Lista Pakowania' },
                { id: 'atrakcje', label: '🎡 Atrakcje' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Treść Zakładek */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
          {activeTab === 'harmonogram' && (
            <Schedule schedule={selectedTrip.schedule} />
          )}
          {activeTab === 'pakowanie' && (
            <PackingList packingList={selectedTrip.packingList} togglePacking={togglePacking} addPackingItem={addPackingItem} />
          )}
          {activeTab === 'atrakcje' && (
            <div className="space-y-6">
              {/* Formularz do dodawania atrakcji */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-3">➕ Dodaj nową atrakcję</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAttractionName}
                    onChange={e => setNewAttractionName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddAttraction(); }}
                    placeholder="np. Muzeum, Park, Restauracja..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                  />
                  <button
                    onClick={handleAddAttraction}
                    disabled={addingAttraction || !newAttractionName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:bg-gray-400"
                  >
                    {addingAttraction ? 'Dodawanie...' : 'Dodaj'}
                  </button>
                </div>
              </div>
              
              {/* Lista atrakcji */}
              <AttractionsList attractions={selectedTrip.attractions} handleVote={handleVote} tripId={selectedTrip.id} />
            </div>
          )}
            </div>
          </div>

          {/* Prawa kolumna - lista uczestników */}
          <div className="w-80 hidden lg:block">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  Uczestnicy
                </h3>
                {isModerator && (
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-bold text-lg"
                    title="Dodaj uczestnika"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Formularz dodawania uczestnika */}
              {isModerator && showAddMember && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemberUsername}
                      onChange={e => setNewMemberUsername(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddMember(); }}
                      placeholder="Nazwa użytkownika..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-800"
                    />
                    <button
                      onClick={handleAddMember}
                      disabled={addingMember || !newMemberUsername.trim()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm disabled:bg-gray-400"
                    >
                      {addingMember ? '...' : 'Dodaj'}
                    </button>
                  </div>
                </div>
              )}

              {selectedTrip.members && selectedTrip.members.length > 0 ? (
                <div className="space-y-3">
                  {[...selectedTrip.members]
                    .sort((a, b) => {
                      // Moderatorzy na górze
                      if (a.role === 'moderator' && b.role !== 'moderator') return -1;
                      if (a.role !== 'moderator' && b.role === 'moderator') return 1;
                      return 0;
                    })
                    .map((member, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {member.username ? member.username.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {member.username || `Użytkownik ${member.user_id}`}
                        </p>
                        {member.role && (
                          <p className="text-xs text-gray-500 capitalize">{member.role === 'moderator' ? '👑 Moderator' : 'Członek'}</p>
                        )}
                      </div>
                      {isModerator && member.role !== 'moderator' && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={removingMemberId === member.user_id}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Usuń uczestnika"
                        >
                          {removingMemberId === member.user_id ? '⏳' : '✕'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">Brak uczestników</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
