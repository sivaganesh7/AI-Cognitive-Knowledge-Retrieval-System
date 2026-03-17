'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CommandPalette({ open, onClose, notes, onNewNote, onOpenChat }) {
  const [query, setQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      document.getElementById('cmd-input')?.focus();
    }
  }, [open]);

  // Filter notes
  useEffect(() => {
    if (!query) {
      setFilteredNotes(notes.slice(0, 5));
    } else {
      const q = query.toLowerCase();
      const filtered = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q))
      ).slice(0, 5);
      setFilteredNotes(filtered);
    }
    setSelectedIndex(0);
  }, [query, notes]);

  const ACTIONS = [
    { id: 'new-note', icon: Plus, label: 'Create new note', shortcut: '⌘N', action: onNewNote },
    { id: 'ask-ai',   icon: MessageSquare, label: 'Ask AI Chat', shortcut: '⌘/', action: onOpenChat },
  ];

  const filteredActions = ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));
  const totalItems = filteredActions.length + filteredNotes.length;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex < filteredActions.length) {
          filteredActions[selectedIndex].action();
          onClose();
        } else {
          // You'd ideally navigate to the note here or open it in edit mode
          // For simplicity we just close for now
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selectedIndex, totalItems, filteredActions, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-[#161b22] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-indigo-500/10"
        >
          {/* Input */}
          <div className="flex items-center px-4 py-3 border-b border-white/10 text-white">
            <Search size={20} className="text-gray-400 mr-3" />
            <input
              id="cmd-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a command or search notes..."
              className="flex-1 bg-transparent border-none outline-none placeholder-gray-500 text-lg font-medium"
            />
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
              <span>ESC</span> to close
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide select-none">
            {/* Actions */}
            {filteredActions.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase px-3 mb-2 opacity-80">
                  Actions
                </div>
                {filteredActions.map((action, i) => {
                  const isSelected = i === selectedIndex;
                  return (
                    <div
                      key={action.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'
                      }`}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => { action.action(); onClose(); }}
                    >
                      <div className="flex items-center gap-3">
                        <action.icon size={16} className={isSelected ? 'text-white' : 'text-gray-400'} />
                        <span className="font-medium text-sm">{action.label}</span>
                      </div>
                      {action.shortcut && (
                        <div className={`text-xs px-2 py-0.5 rounded border ${
                          isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-gray-500'
                        }`}>
                          {action.shortcut}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes */}
            {filteredNotes.length > 0 && (
              <div>
                <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase px-3 mb-2 opacity-80">
                  Notes
                </div>
                {filteredNotes.map((note, idx) => {
                  const i = idx + filteredActions.length;
                  const isSelected = i === selectedIndex;
                  return (
                    <div
                      key={note.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'
                      }`}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={onClose}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                        <span className="font-medium text-sm truncate block">{note.title}</span>
                        <span className={`text-xs truncate ${isSelected ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {note.summary || note.content}
                        </span>
                      </div>
                      <ArrowRight size={14} className={`shrink-0 ${isSelected ? 'opacity-100 text-white' : 'opacity-0'}`} />
                    </div>
                  );
                })}
              </div>
            )}

            {totalItems === 0 && (
              <div className="py-12 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                <Search size={32} className="opacity-20" />
                No results found for "{query}"
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
