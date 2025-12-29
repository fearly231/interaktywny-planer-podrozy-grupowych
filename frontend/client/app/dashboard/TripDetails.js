import React from 'react';

export default function TripDetails({ selectedTrip, activeTab, setActiveTab, setSelectedTrip, handleVote }) {
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
                      defaultChecked={item.checked}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    />
                    <span className={item.checked ? "text-gray-400 line-through" : "text-gray-700"}>
                      {item.item}
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
                      <div className="flex gap-2 items-center">
                        <button 
                            onClick={() => handleVote(selectedTrip.id, place.id)}
                            // Dodajemy disabled, jeśli status to Odrzucone
                            disabled={place.status === 'Odrzucone'}
                            className={`flex items-center gap-1 text-xs border px-2 py-1 rounded-md transition shadow-sm active:scale-95 
                                ${place.status === 'Odrzucone' 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' // Styl dla zablokowanego
                                : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700' // Styl normalny
                                }`}
                            >
                            👍 <span className="font-bold">
                                {/* Zabezpieczenie: jeśli votes jest undefined, pokaż 0 */}
                                {place.votes || 0}
                                </span>
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          place.status === 'Zatwierdzone' ? 'bg-green-100 text-green-700 border-green-200' :
                          place.status === 'Odrzucone' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                          {place.status}
                        </span>
                      </div>
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
