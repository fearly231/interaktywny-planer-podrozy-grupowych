import React from 'react';

export default function AttractionsList({ attractions, handleVote, tripId }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Miejsca do odwiedzenia</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attractions && attractions.length > 0 ? (
          attractions.map((place, index) => (
            <div key={place.id !== undefined && place.id !== null ? `attraction-${place.id}` : `attraction-${index}`} className="border border-gray-200 p-4 rounded-xl hover:border-blue-300 transition bg-gray-50/50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{place.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {place.type}
                </span>
              </div>
              {place.note && (
                <p className="text-sm text-gray-500 italic">"{place.note}"</p>
              )}
              <button
                className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                onClick={() => handleVote(tripId, place.id)}
              >
                Głosuj ({place.votes ?? 0})
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full">Brak atrakcji do wyświetlenia</p>
        )}
      </div>
    </div>
  );
}
