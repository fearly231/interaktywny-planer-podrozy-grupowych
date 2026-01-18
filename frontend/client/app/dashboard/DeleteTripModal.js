'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeleteTripModal({ trip, onClose, onDelete }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    
    if (confirmText !== trip.title) {
      setError('Nazwa wycieczki nie pasuje');
      return;
    }
    
    try {
      setDeleting(true);
      await onDelete();
      onClose();
    } catch (err) {
      setError('Nie udało się usunąć wycieczki');
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Usuń wycieczkę</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">
                Ta akcja jest nieodwracalna!
              </p>
              <p className="text-red-700 text-sm">
                Wszystkie dane związane z wycieczką zostaną trwale usunięte:
              </p>
              <ul className="list-disc list-inside text-red-700 text-sm mt-2 space-y-1">
                <li>Atrakcje i głosy</li>
                <li>Harmonogram</li>
                <li>Lista pakowania</li>
                <li>Wiadomości czatu</li>
                <li>Wszyscy członkowie zostaną usunięci</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wpisz nazwę wycieczki aby potwierdzić:{' '}
                <span className="font-bold text-gray-900">{trip.title}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError('');
                }}
                placeholder="Wpisz nazwę wycieczki"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                disabled={deleting}
              />
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold rounded-lg transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || confirmText !== trip.title}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                {deleting ? 'Usuwanie...' : 'Usuń wycieczkę'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
