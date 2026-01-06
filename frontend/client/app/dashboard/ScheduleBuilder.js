'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScheduleBuilder({ trip, attractions }) {
  const [scheduleItems, setScheduleItems] = useState(trip.schedule || []);
  const [draggedAttraction, setDraggedAttraction] = useState(null);

  // Oblicz procent głosów dla atrakcji
  const getVotePercentage = (votes) => {
    if (trip.members?.length === 0) return 0;
    return Math.round((votes / trip.members.length) * 100);
  };

  // Filtruj zatwierdzone atrakcje (>50%)
  const approvedAttractions = attractions.filter(
    a => getVotePercentage(a.votes) > 50
  ).sort((a, b) => b.votes - a.votes);

  // Generuj listę dni wycieczki
  const generateDays = () => {
    if (!trip.start_date || !trip.end_date) return [];
    
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const days = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  const days = generateDays();

  // Obsługa drag & drop
  const handleDragStart = (e, attraction) => {
    setDraggedAttraction(attraction);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnDay = (e, dayIndex) => {
    e.preventDefault();
    if (!draggedAttraction) return;

    const newItem = {
      id: `schedule-${Date.now()}`,
      day: dayIndex,
      attraction_id: draggedAttraction.id,
      attraction_name: draggedAttraction.name,
      time: '09:00',
      notes: '',

    };

    setScheduleItems([...scheduleItems, newItem]);
    setDraggedAttraction(null);
  };

  const handleRemoveFromSchedule = (itemId) => {
    setScheduleItems(scheduleItems.filter(item => item.id !== itemId));
  };

  const handleTimeChange = (itemId, newTime) => {
    setScheduleItems(scheduleItems.map(item =>
      item.id === itemId ? { ...item, time: newTime } : item
    ));
  };

  const handleNotesChange = (itemId, newNotes) => {
    setScheduleItems(scheduleItems.map(item =>
      item.id === itemId ? { ...item, notes: newNotes } : item
    ));
  };

  // Formatuj datę
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  };

  // Pobierz atrakcje dla danego dnia (sortowane po godzinie)
  const getAttrationsForDay = (dayIndex) => {
    const items = scheduleItems.filter(item => item.day === dayIndex);
    // Sortuj: najpierw bez godziny, potem chronologicznie
    return items.sort((a, b) => {
      // Jeśli brak czasu, daj na koniec (nie na początek)
      if (!a.time || a.time === '') return 1;
      if (!b.time || b.time === '') return -1;
      // Sortuj chronologicznie
      return a.time.localeCompare(b.time);
    });
  };

  // Zapisz harmonogram do bazy
  const handleSaveSchedule = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/trips/${trip.id}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule: scheduleItems }),
      });

      if (response.ok) {
        alert('✅ Harmonogram został zapisany!');
      } else {
        alert('❌ Błąd podczas zapisywania harmonogramu');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('❌ Błąd podczas zapisywania harmonogramu');
    }
  };

  // Wyczyść harmonogram
  const handleClearSchedule = () => {
    if (confirm('Czy na pewno chcesz wyczyścić cały harmonogram?')) {
      setScheduleItems([]);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🧩</span>
        Buduj Harmonogram
      </h2>

      {/* Układ dwukolumnowy: Atrakcje po lewej (sticky) + Dni po prawej */}
      <div className="flex gap-6">
        {/* Lewa kolumna - Zatwierdzone Atrakcje (sticky) */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl border-2 border-green-200 p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                <span>✅</span>
                Atrakcje
              </h3>
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {approvedAttractions.length > 0 ? (
                  approvedAttractions.map((attraction, idx) => {
                    const votePercentage = getVotePercentage(attraction.votes);
                    const isUsed = scheduleItems.some(item => item.attraction_id === attraction.id);
                    
                    return (
                      <motion.div
                        key={attraction.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, attraction)}
                        className={`p-3 rounded-lg cursor-grab active:cursor-grabbing transition ${
                          isUsed
                            ? 'bg-gray-100 border-2 border-gray-300 opacity-60'
                            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 hover:shadow-md'
                        }`}
                        whileHover={{ scale: isUsed ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{'🥇🥈🥉'[idx] || '📍'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm line-clamp-2">
                              {attraction.name}
                            </p>
                            <p className="text-xs text-gray-700 mt-1">
                              {votePercentage}%
                            </p>
                          </div>
                        </div>
                        {isUsed && (
                          <div className="mt-2 text-xs text-green-600 font-semibold text-center">
                            ✓ Dodana
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-center">
                    <p className="text-sm text-yellow-700">
                      Brak zatwierdzonych atrakcji. Głosuj w zakładce &quot;Atrakcje&quot;!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Prawa kolumna - Harmonogram (dni jeden pod drugim) */}
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>📅</span>
            Harmonogram
          </h3>
          <div className="space-y-4">
            {days.map((day, dayIndex) => {
              const dayAttractions = getAttrationsForDay(dayIndex);
              
              return (
                <motion.div
                  key={dayIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dayIndex * 0.1 }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnDay(e, dayIndex)}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-300 p-6 min-h-[300px] hover:border-blue-500 transition"
                >
                  {/* Nagłówek dnia */}
                  <div className="mb-4 pb-3 border-b-2 border-blue-200">
                    <h4 className="text-lg font-bold text-gray-900">
                      📅 Dzień {dayIndex + 1}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {formatDate(day)}
                    </p>
                  </div>

                  {/* Drop zone z atrakcjami */}
                  <AnimatePresence>
                    {dayAttractions.length > 0 ? (
                      <div className="space-y-3">
                        {dayAttractions.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-lg border-2 border-purple-200 shadow-md p-3 hover:shadow-lg transition group"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm mb-2">
                                  {item.attraction_name}
                                </p>
                                <input
                                  type="time"
                                  value={item.time}
                                  onChange={(e) => handleTimeChange(item.id, e.target.value)}
                                  step="300"
                                  pattern="[0-9]{2}:[0-9]{2}"
                                  className="w-full text-sm font-medium text-gray-900 px-3 py-2 border-2 border-gray-400 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-500 transition"
                                  style={{ colorScheme: 'light' }}
                                />
                              </div>
                              <button
                                onClick={() => handleRemoveFromSchedule(item.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Notes */}
                            <textarea
                              value={item.notes}
                              onChange={(e) => handleNotesChange(item.id, e.target.value)}
                              placeholder="Notatki (opcjonalnie)..."
                              className="w-full text-sm font-medium text-gray-900 px-3 py-2 border-2 border-gray-400 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-500 transition resize-none"
                              rows="2"
                            />
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-center">
                        <p className="text-4xl mb-2">🎯</p>
                        <p className="text-sm text-gray-700">
                          Przeciągnij atrakcje tutaj
                        </p>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Licznik */}
                  {dayAttractions.length > 0 && (
                    <div className="mt-4 pt-3 border-t-2 border-blue-200 text-xs text-gray-700 font-semibold">
                      {dayAttractions.length} {dayAttractions.length === 1 ? 'atrakcja' : 'atrakcje'}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Przycisk do zapisania */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 mt-6"
          >
            <button 
              onClick={handleSaveSchedule}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg"
            >
              💾 Zapisz Harmonogram
            </button>
            <button 
              onClick={handleClearSchedule}
              className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-xl transition"
            >
              🔄 Wyczyść
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
