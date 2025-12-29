import React from 'react';

export default function Schedule({ schedule }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Plan Dnia</h2>
      <div className="relative border-l-2 border-blue-100 ml-3 space-y-8">
        {schedule.map((item, idx) => (
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
  );
}
