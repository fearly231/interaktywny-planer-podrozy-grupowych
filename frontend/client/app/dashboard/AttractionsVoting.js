'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function AttractionsVoting({ attractions, totalMembers, handleVote, handleUnvote, tripId, userVotedAttractions, isModerator, onDeleteAttraction }) {
  // Oblicz procent głosów
  const getVotePercentage = (votes) => {
    if (totalMembers === 0) return 0;
    return Math.round((votes / totalMembers) * 100);
  };

  // Sprawdź czy użytkownik głosował na daną atrakcję
  const hasUserVoted = (attractionId) => {
    return userVotedAttractions && userVotedAttractions.includes(attractionId);
  };

  // Podziel atrakcje na zatwierdzone i do rozważenia (używając statusu z backendu)
  const approvedAttractions = attractions.filter(
    a => a.status === "Zatwierdzone"
  );
  const pendingAttractions = attractions.filter(
    a => a.status !== "Zatwierdzone"
  );

  // Sortuj po liczbie głosów (malejąco)
  const sortedApproved = approvedAttractions.sort((a, b) => b.votes - a.votes);
  const sortedPending = pendingAttractions.sort((a, b) => b.votes - a.votes);

  const AttractionCard = ({ attraction, isApproved, index }) => {
    const votePercentage = getVotePercentage(attraction.votes);
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•';

    return (
      <motion.div
        className="cursor-default"
        whileHover={{ scale: 1.02 }}
      >
        <div className={`p-4 rounded-xl border-2 transition ${
          isApproved
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md'
            : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 hover:border-blue-300'
        }`}>
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">{medal}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{attraction.name}</h3>
              {attraction.note && (
                <p className="text-xs text-gray-500 italic mt-1">"{attraction.note}"</p>
              )}
              {/* Koszt atrakcji */}
              {attraction.cost > 0 && (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  💰 {attraction.cost.toFixed(2)} PLN
                </p>
              )}
              {/* Link do atrakcji */}
              {attraction.link && (
                <a 
                  href={attraction.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-700 underline mt-1 inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  🔗 Zobacz szczegóły
                </a>
              )}
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              attraction.type === 'landmark' ? 'bg-blue-100 text-blue-700' :
              attraction.type === 'restaurant' ? 'bg-orange-100 text-orange-700' :
              attraction.type === 'nature' ? 'bg-green-100 text-green-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {attraction.type}
            </span>
          </div>

          {/* Vote Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-700">
                {attraction.votes}/{totalMembers} głosów
              </span>
              <span className={`text-sm font-bold ${
                isApproved ? 'text-green-600' : 'text-gray-600'
              }`}>
                {votePercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-all ${
                  isApproved
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-400 to-blue-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${votePercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {isApproved && (
              <div className="mt-1 text-xs text-green-600 font-semibold">✓ Przechodzi do harmonogramu</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <div className="flex-1">
              {hasUserVoted(attraction.id) ? (
                <button
                  onClick={() => handleUnvote(tripId, attraction.id)}
                  className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition"
                >
                  ✕ Cofnij głos
                </button>
              ) : (
                <button
                  onClick={() => handleVote(tripId, attraction.id)}
                  className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition"
                >
                  👍 Głosuj
                </button>
              )}
            </div>
            {isModerator && (
              <button
                onClick={() => onDeleteAttraction(attraction.id, attraction.name)}
                className="px-3 py-2 bg-gray-200 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg transition"
                title="Usuń atrakcję"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>🗳️</span>
        System Głosowania
      </h2>

      {/* Approved Attractions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-600">✓ Zatwierdzone atrakcje</span>
          <span className="text-sm bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
            {sortedApproved.length}
          </span>
        </div>
        {sortedApproved.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedApproved.map((attraction, idx) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                isApproved={true}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl text-center text-green-600">
            <p className="text-sm">Brak zatwierdzonych atrakcji. Głosuj, aby dodać!</p>
          </div>
        )}
      </div>

      {/* Divider */}
      {sortedApproved.length > 0 && sortedPending.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-sm font-semibold text-gray-500">lub</span>
          </div>
        </div>
      )}

      {/* Pending Attractions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-700">📋 Do rozważenia</span>
          <span className="text-sm bg-gray-100 text-gray-700 font-semibold px-3 py-1 rounded-full">
            {sortedPending.length}
          </span>
        </div>
        {sortedPending.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedPending.map((attraction, idx) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                isApproved={false}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl text-center text-blue-600">
            <p className="text-sm">Wszystkie atrakcje są zatwierdzone! 🎉</p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {attractions.length === 0 && (
        <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
          <p className="text-gray-500 text-lg">Brak atrakcji. Dodaj pierwszą w formularzu!</p>
        </div>
      )}
    </div>
  );
}
