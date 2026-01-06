'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditTripModal({ trip, onClose, onSave }) {
  const [title, setTitle] = useState(trip.title || '');
  const [startDate, setStartDate] = useState(trip.start_date || '');
  const [endDate, setEndDate] = useState(trip.end_date || '');
  const [budget, setBudget] = useState(trip.budget || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    
    // Walidacja
    if (!title.trim()) {
      setError('Nazwa wycieczki jest wymagana');
      return;
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Data rozpoczęcia nie może być późniejsza niż data zakończenia');
      return;
    }

    try {
      setSaving(true);
      const currentUserId = localStorage.getItem('user_id');
      
      const response = await fetch(`http://localhost:5001/api/trips/${trip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requester_id: parseInt(currentUserId),
          title: title.trim(),
          start_date: startDate,
          end_date: endDate,
          budget: parseFloat(budget) || 0
        }),
      });

      if (response.ok) {
        const updatedTrip = await response.json();
        onSave(updatedTrip);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Błąd podczas zapisywania zmian');
      }
    } catch (err) {
      console.error('Error updating trip:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>✏️</span>
                Edytuj wycieczkę
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Nazwa */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nazwa wycieczki
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                placeholder="np. Weekend w Zakopanem"
              />
            </div>

            {/* Daty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data rozpoczęcia
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data zakończenia
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                />
              </div>
            </div>

            {/* Budżet */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Budżet (PLN)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                placeholder="0"
              />
            </div>

            {/* Warning o zmianach dat */}
            {(startDate !== trip.start_date || endDate !== trip.end_date) && (
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Zmiana dat może wpłynąć na harmonogram. Elementy harmonogramu poza nowymi datami zostaną usunięte.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 rounded-b-2xl flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-xl transition disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg disabled:opacity-50"
            >
              {saving ? '⏳ Zapisywanie...' : '💾 Zapisz zmiany'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
