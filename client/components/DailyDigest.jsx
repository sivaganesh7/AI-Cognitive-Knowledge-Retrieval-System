'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Brain, X, Loader2, Sparkles, Calendar, BookOpen, Quote } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DailyDigest({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/ai/digest')
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        toast.error('Failed to load digest');
        setLoading(false);
        onClose();
      });
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-white/10"
        style={{ background: '#111827' }}
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-600/20 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="text-indigo-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your Daily Digest</h2>
              <p className="text-xs text-gray-400 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 pb-8 relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <Brain size={32} className="text-indigo-400 animate-pulse" />
                </div>
                <Loader2 size={24} className="animate-spin text-white absolute -bottom-2 -right-2" />
              </div>
              <p className="text-gray-400 text-sm animate-pulse">AI is reading your notes and generating insights...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* The AI connection paragraph */}
              <div className="p-5 rounded-2xl bg-indigo-500/50 border border-indigo-400/20 shadow-inner" style={{ background: 'linear-gradient(145deg, rgba(79,70,229,0.15) 0%, rgba(139,92,246,0.05) 100%)' }}>
                <Quote size={24} className="text-indigo-400/50 mb-2" />
                <p className="text-[15px] leading-relaxed text-indigo-50 pb-2">
                  {data?.digest}
                </p>
              </div>

              {/* The 3 randomly selected notes */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Notes Featured Today
                </h3>
                <div className="space-y-3">
                  {data?.notes?.map(note => (
                    <div key={note.id} className="flex gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-[#0d1117] border border-white/10 flex items-center justify-center shrink-0 text-lg">
                        {note.type === 'note' ? '📝' : note.type === 'insight' ? '💡' : note.type === 'link' ? '🔗' : note.type === 'todo' ? '✅' : '💬'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{note.title}</h4>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {note.summary || note.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {(!data?.notes || data?.notes.length === 0) && (
                    <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10 text-gray-400 text-sm">
                      <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                      Not enough notes to generate a digest. Check back tomorrow!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
        
        {/* Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Sparkles size={12} /> Come back tomorrow for a new digest.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
