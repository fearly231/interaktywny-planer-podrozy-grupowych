import React, { useState } from 'react';
import PackingList from './PackingList';
import AttractionsList from './AttractionsList';
import Schedule from './Schedule';

export default function TripDetails({ selectedTrip, activeTab, setActiveTab, setSelectedTrip, handleVote, togglePacking, addPackingItem, refreshTrip }) {
  const [newAttractionName, setNewAttractionName] = useState('');
  const [addingAttraction, setAddingAttraction] = useState(false);

  if (!selectedTrip) return null;

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
        setNewAttractionName('');
        // Odśwież trip aby pobrać zaktualizowaną listę atrakcji
        if (refreshTrip) await refreshTrip(selectedTrip.id);
      }
    } catch (err) {
      console.error('Nie udało się dodać atrakcji', err);
    } finally {
      setAddingAttraction(false);
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

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Zakładki */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl mb-8 w-fit mx-auto md:mx-0">
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
      </main>
    </div>
  );
}
