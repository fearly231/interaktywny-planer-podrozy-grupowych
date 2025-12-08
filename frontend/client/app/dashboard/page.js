'use client';
import { useState } from 'react';

// --- MOCK DATA (DANE PRZYKŁADOWE) ---
// W przyszłości pobierzemy to z Twojego API we Flasku
const mockTrips = [
  {
    id: 1,
    title: 'Weekend w Tatrach 🏔️',
    date: '15-17 Października',
    description: 'Jesienne wyjście na szlaki i relaks w termach.',
    image: 'bg-gradient-to-br from-green-400 to-blue-500', // Uproszczone tło zamiast zdjęcia
    packingList: [
      { id: 1, item: 'Kurtka przeciwdeszczowa', checked: false },
      { id: 2, item: 'Buty trekkingowe', checked: true },
      { id: 3, item: 'Powerbank', checked: false },
      { id: 4, item: 'Gotówka (na schroniska)', checked: false },
    ],
    attractions: [
      { id: 1, name: 'Morskie Oko', type: 'Natura', note: 'Wyjść rano o 7:00!' },
      { id: 2, name: 'Krupówki', type: 'Miasto', note: 'Kupić oscypka' },
      { id: 3, name: 'Termy Chochołowskie', type: 'Relaks', note: 'Wieczorem' },
    ],
    schedule: [
      { time: '08:00', activity: 'Wyjazd z Krakowa' },
      { time: '11:00', activity: 'Wejście na szlak (Palenica)' },
      { time: '18:00', activity: 'Obiad w karczmie' },
    ]
  },
  {
    id: 2,
    title: 'City Break Trójmiasto 🌊',
    date: '10-12 Lipca',
    description: 'Zwiedzanie Gdańska, Sopotu i Gdyni.',
    image: 'bg-gradient-to-br from-blue-400 to-indigo-600',
    packingList: [
      { id: 1, item: 'Okulary przeciwsłoneczne', checked: true },
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

  // --- WIDOK 1: LISTA PODRÓŻY (DASHBOARD GŁÓWNY) ---
  if (!selectedTrip) {
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
          {mockTrips.map((trip) => (
            <div 
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 overflow-hidden group"
            >
              {/* Kolorowy nagłówek karty (zamiast zdjęcia) */}
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
                  <span>{trip.attractions.length} Atrakcji</span>
                  <span>•</span>
                  <span>{trip.packingList.length} Rzeczy</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- WIDOK 2: SZCZEGÓŁY PODRÓŻY ---
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