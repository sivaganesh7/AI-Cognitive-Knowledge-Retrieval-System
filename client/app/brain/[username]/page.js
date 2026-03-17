'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Brain, Search, Map, Calendar, Hash, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicBrainPage() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [queryAnswer, setQueryAnswer] = useState(null);
  const [querying, setQuerying] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});

  useEffect(() => {
    if (!username) return;
    
    // Using fetch directly because public API shouldn't need auth token
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/public/brain/${username}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        toast.error('Brain not found or private');
        setLoading(false);
      });
  }, [username]);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setQuerying(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/public/brain/query?username=${username}&q=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error('Failed to query');
      const result = await res.json();
      setQueryAnswer(result.answer);
    } catch {
      toast.error('Query failed');
    } finally {
      setQuerying(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-6xl mb-4 opacity-50">🙈</div>
          <h1 className="text-2xl font-bold text-white mb-2">Brain Not Found</h1>
          <p className="text-gray-400">This user doesn't exist or their brain is set to private.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Header Profile */}
      <header className="border-b border-white/5 bg-white/3 pt-12 pb-8 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          {data.user.photo_url ? (
            <img src={data.user.photo_url} alt={data.user.display_name} className="w-20 h-20 rounded-full border-2 border-white/10 mb-4" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-indigo-500/20">
              {data.user.display_name[0]?.toUpperCase()}
            </div>
          )}
          
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2 justify-center">
            {data.user.display_name}'s Brain
            <Globe className="text-cyan-400" size={20} />
          </h1>
          <a href={`https://twitter.com/${data.user.username}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-400 font-medium mb-4 block">
            @{data.user.username}
          </a>
          
          {data.user.bio && (
            <p className="text-gray-300 max-w-xl mx-auto leading-relaxed mb-6">
              {data.user.bio}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 mt-2 bg-black/20 p-2 px-4 rounded-xl border border-white/5">
            <span className="flex items-center gap-1.5"><Brain size={14} className="text-indigo-400" /> {data.total} Public Notes</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-amber-400" /> Joined {new Date(data.user.created_at).getFullYear()}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-10">
        
        {/* Ask AI Search widget */}
        <section className="bg-[#111827] border border-indigo-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-indigo-400" /> Ask {data.user.display_name}'s Brain
            </h2>
            
            <form onSubmit={handleQuery} className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="e.g., What are their thoughts on React?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-white placeholder-gray-500"
                />
              </div>
              <button
                type="submit"
                disabled={querying || !search.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {querying ? 'Thinking...' : 'Ask AI'}
              </button>
            </form>

            <AnimatePresence>
              {queryAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5 text-sm leading-relaxed text-indigo-100"
                >
                  <p className="font-semibold text-indigo-300 mb-2">AI Answer:</p>
                  {queryAnswer}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Public Notes Feed */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Map size={20} className="text-emerald-400" />
              Public Knowledge Base
            </h2>
          </div>

          <div className="space-y-4">
            {data.notes.map((note, i) => {
              const expanded = expandedNotes[note.id];
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#161b22] border border-white/10 hover:border-white/20 rounded-xl p-5 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h3 className="font-semibold text-lg text-white leading-snug">{note.title}</h3>
                    <span className="text-xs text-gray-500 shrink-0 mt-1 whitespace-nowrap">
                      {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {note.summary && !expanded && (
                    <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                      {note.summary}
                    </p>
                  )}

                  {expanded && (
                    <div className="text-sm text-gray-300 leading-relaxed mt-4 mb-4 whitespace-pre-wrap pl-4 border-l-2 border-indigo-500/30">
                      {note.content}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2 flex-wrap">
                      {note.tags?.map(t => (
                        <span key={t} className="text-[11px] font-medium border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1 rounded-full flex items-center gap-0.5 hover:text-white transition-colors cursor-default">
                          <Hash size={10} /> {t}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => toggleExpand(note.id)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors ml-4 shrink-0"
                    >
                      {expanded ? 'Show Less' : 'Read Full Note'}
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
            
            {data.notes.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <Globe size={40} className="mx-auto mb-4 opacity-20" />
                This brain doesn't have any public notes yet.
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
