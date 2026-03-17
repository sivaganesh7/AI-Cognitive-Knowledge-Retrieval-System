'use client';

import { Search, Command } from 'lucide-react';

export default function SearchBar({ value, onChange, onCmdK }) {
  return (
    <div className="relative w-full max-w-xl group">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 group-focus-within:text-indigo-400 transition-colors">
        <Search size={18} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search in your ai cognitive knowledge retrieval system..."
        className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-10 pr-12 pt-2.5 pb-2.5 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder-gray-500"
      />
      <button
        onClick={onCmdK}
        className="absolute inset-y-1.5 right-1.5 px-2 flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Open Command Palette"
      >
        <Command size={12} />
        <span className="font-mono">K</span>
      </button>
    </div>
  );
}


