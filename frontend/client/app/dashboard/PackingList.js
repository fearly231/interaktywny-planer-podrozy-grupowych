import React from 'react';

export default function PackingList({ packingList, togglePacking }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Co zabrać?</h2>
      <ul className="space-y-3">
        {packingList.map((item) => (
          <li key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
            <input 
              type="checkbox" 
              checked={!!(item.is_checked ?? item.checked)}
              onChange={() => togglePacking(item.id)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
            />
            <span className={(item.is_checked ?? item.checked) ? "text-gray-400 line-through" : "text-gray-700"}>
              {item.item_name ?? item.item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
