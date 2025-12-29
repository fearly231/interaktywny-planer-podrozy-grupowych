import React from 'react';
import PackingList from './PackingList';
import AttractionsList from './AttractionsList';
import Schedule from './Schedule';

export default function TripDetails({ selectedTrip, activeTab, setActiveTab, setSelectedTrip, handleVote, togglePacking }) {
  if (!selectedTrip) return null;

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
          {selectedTrip.date}
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
            <PackingList packingList={selectedTrip.packingList} togglePacking={togglePacking} />
          )}
          {activeTab === 'atrakcje' && (
            <AttractionsList attractions={selectedTrip.attractions} handleVote={handleVote} tripId={selectedTrip.id} />
          )}
        </div>
      </main>
    </div>
  );
}
