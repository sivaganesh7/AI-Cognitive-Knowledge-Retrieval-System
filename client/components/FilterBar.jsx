'use client';

import { Tag as TagIcon, BarChart2, Hash, X } from 'lucide-react';

const TABS = [
  { id: 'all',     label: 'All Notes', emoji: '📚' },
  { id: 'note',    label: 'Notes',     emoji: '📝' },
  { id: 'link',    label: 'Links',     emoji: '🔗' },
  { id: 'insight', label: 'Insights',  emoji: '💡' },
  { id: 'quote',   label: 'Quotes',    emoji: '💬' },
  { id: 'todo',    label: 'Todos',     emoji: '✅' },
];

const SORTS = [
  { id: 'newest',    label: 'Newest First' },
  { id: 'oldest',    label: 'Oldest First' },
  { id: 'updated',   label: 'Recently Updated' },
  { id: 'alpha',     label: 'Alphabetical' },
  { id: 'wordcount', label: 'Longest First' },
];

export default function FilterBar({ filter, onFilter, tags, total }) {

  const handleType = (type) => onFilter(f => ({ ...f, type }));
  const handleSort = (e) => onFilter(f => ({ ...f, sort: e.target.value }));
  const handleTag = (tag) => onFilter(f => ({ ...f, tag: f.tag === tag ? null : tag }));

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Row: Types & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Types */}
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleType(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter.type === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="opacity-70">{tab.emoji}</span>
              {tab.label}
              {filter.type === tab.id && (
                <span className="ml-1 text-[11px] bg-white/20 px-1.5 py-0.5 rounded-full font-mono">
                  {total}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-sm">
          <BarChart2 size={16} className="text-gray-500" />
          <select
            value={filter.sort}
            onChange={handleSort}
            className="bg-transparent text-gray-300 hover:text-white font-medium cursor-pointer focus:outline-none appearance-none"
          >
            {SORTS.map(s => <option key={s.id} value={s.id} className="bg-gray-900 text-white">{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Bottom Row: Tags Scrollable */}
      {tags?.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-white/5">
          <TagIcon size={14} className="text-gray-500 shrink-0" />
          
          {filter.tag && (
            <button
              onClick={() => handleTag(filter.tag)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 transition-colors hover:bg-indigo-500/30"
            >
              <Hash size={12} />
              {filter.tag}
              <X size={12} className="ml-0.5" />
            </button>
          )}

          {tags.map(t => {
            if (t.name === filter.tag) return null;
            return (
              <button
                key={t.name}
                onClick={() => handleTag(t.name)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all shrink-0"
              >
                <Hash size={10} className="opacity-50" />
                {t.name}
                <span className="text-[10px] text-gray-600 font-mono">{t.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
