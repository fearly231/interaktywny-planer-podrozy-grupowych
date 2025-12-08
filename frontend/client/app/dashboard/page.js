'use client';
import { useState } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Przegląd');

  // Lista zakładek - na razie tylko UI
  const tabs = [
    { name: 'Przegląd', icon: '🏠' },
    { name: 'Moje Podróże', icon: '✈️' },
    { name: 'Mapa Świata', icon: '🗺️' },
    { name: 'Budżet', icon: '💰' },
    { name: 'Lista Rzeczy', icon: '🎒' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-600">Travel Planner</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                activeTab === tab.name
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">{tab.icon}</span>
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button 
            onClick={() => window.location.href = '/'}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            Wyloguj się
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{activeTab}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Witaj, Podróżniku!</span>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              P
            </div>
          </div>
        </header>

        {/* Placeholder Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Karty - atrapy */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-40 flex flex-col justify-center items-center text-gray-400">
                <span className="text-4xl mb-2">+</span>
                <p>Zaplanuj nową podróż</p>
                <p className="text-xs text-red-400 mt-2">(Funkcja wkrótce)</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-40 flex flex-col justify-center items-center text-gray-400">
                <span className="text-4xl mb-2">📍</span>
                <p>Ostatnie miejsca</p>
                <p className="text-xs text-red-400 mt-2">(Funkcja wkrótce)</p>
            </div>
        </div>
      </main>
    </div>
  );
}