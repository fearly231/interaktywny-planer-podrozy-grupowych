import React, { useState } from 'react';

export default function PackingList({ packingList, togglePacking, addPackingItem }) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      addPackingItem(newItem.trim());
      setNewItem("");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Co zabrać?</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Dodaj rzecz do spakowania..."
          className="flex-1 border rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">
          Dodaj
        </button>
      </form>
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
