'use client';

import AIChat from '@/components/AIChat';
import CommandPalette from '@/components/CommandPalette';
import DailyDigest from '@/components/DailyDigest';
import FilterBar from '@/components/FilterBar';
import NoteCard from '@/components/NoteCard';
import NoteForm from '@/components/NoteForm';
import SearchBar from '@/components/SearchBar';
import SkeletonCard from '@/components/SkeletonCard';
import StatsBar from '@/components/StatsBar';
import { useAuth } from '@/context/AuthContext';
import useDebounce from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { logOut } from '@/lib/firebase';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  Keyboard,
  LogOut,
  MessageSquare,
  Plus,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ type: 'all', tag: null, sort: 'newest' });
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user && !isSigningOut) {
      router.push('/login');
    }
  }, [user, authLoading, isSigningOut, router]);

  // Load notes
  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filter.type !== 'all') params.set('type', filter.type);
      if (filter.tag) params.set('tag', filter.tag);
      params.set('sort', filter.sort);
      params.set('limit', '30');

      const data = await api.get(`/api/notes?${params}`);
      setNotes(data.notes);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [user, debouncedSearch, filter]);

  // Load stats and tags
  const fetchMeta = useCallback(async () => {
    if (!user) return;
    try {
      const [statsData, tagsData] = await Promise.all([
        api.get('/api/notes/meta/stats'),
        api.get('/api/tags'),
      ]);
      setStats(statsData);
      setTags(tagsData.tags || []);
    } catch {}
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowForm(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowChat(c => !c);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
        setShowForm(false);
        setEditNote(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('chat-open', showChat);
    return () => document.documentElement.classList.remove('chat-open');
  }, [showChat]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await logOut();
      router.replace('/');
    } catch {
      setIsSigningOut(false);
      toast.error('Sign out failed');
    }
  };

  const handleNoteCreated = () => {
    setShowForm(false);
    setEditNote(null);
    fetchNotes();
    fetchMeta();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>

      {/* Command Palette */}
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        notes={notes}
        onNewNote={() => { setCommandOpen(false); setShowForm(true); }}
        onOpenChat={() => { setCommandOpen(false); setShowChat(true); }}
      />

      {/* ─── Header ────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/5"
        style={{ background: 'var(--color-surface)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 h-15 flex items-center justify-between gap-4 py-3">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🧠</span>
            <span className="font-bold text-base hidden sm:block">AI Cognitive Knowledge Retrieval System</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <SearchBar
              value={search}
              onChange={setSearch}
              onCmdK={() => setCommandOpen(true)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDigest(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-all"
              title="Daily Digest"
            >
              <Brain size={16} />
              <span className="hidden lg:block">Digest</span>
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-indigo-400 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 transition-all"
            >
              <MessageSquare size={15} />
              <span className="hidden sm:block">Ask AI</span>
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={16} />
              <span className="hidden sm:block">New Note</span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/8 transition-all"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                )}
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 py-1 shadow-xl z-50"
                    style={{ background: 'var(--color-surface-2)' }}
                    onBlur={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-sm font-medium text-white truncate">
                        {user.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); setCommandOpen(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <Keyboard size={15} />
                      Shortcuts
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); router.push('/settings'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <Settings size={15} />
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Layout ──────────────────────────── */}
      <div className="flex">
        <main className="flex-1 max-w-screen-xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* Stats */}
          {stats && <StatsBar stats={stats} />}

          {/* Filters */}
          <FilterBar
            filter={filter}
            onFilter={setFilter}
            tags={tags}
            total={total}
          />

          {/* Notes Grid */}
          <div className="flex flex-wrap justify-center gap-4">
            <AnimatePresence>
              {loading
                ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} index={i} />)
                : notes.map((note, i) => (
                    <motion.div
                      key={note.id}
                      layout
                      className="w-full sm:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.67rem)] max-w-[420px]"
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                    >
                      <NoteCard
                        note={note}
                        onDelete={() => { fetchNotes(); fetchMeta(); }}
                        onUpdate={() => { fetchMeta(); }}
                        onEdit={(n) => { setEditNote(n); setShowForm(true); }}
                        onTagClick={(tag) => setFilter(f => ({ ...f, tag }))}
                      />
                    </motion.div>
                  ))
              }
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {!loading && notes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="text-7xl mb-6 animate-float">
                {debouncedSearch ? '🔍' : filter.type !== 'all' ? '📂' : '🌱'}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {debouncedSearch
                  ? `No results for "${debouncedSearch}"`
                  : filter.type !== 'all'
                  ? `No ${filter.type}s yet`
                  : 'Your brain is empty'}
              </h3>
              <p className="text-gray-400 max-w-sm mb-6">
                {debouncedSearch
                  ? 'Try a different search term or clear the filters.'
                  : 'Start capturing knowledge to grow your ai cognitive knowledge retrieval system.'}
              </p>
              {!debouncedSearch && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  Add Your First Note
                </button>
              )}
            </motion.div>
          )}

          {/* Keyboard hint */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600 pb-6">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 font-mono">⌘K</kbd> Command palette</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 font-mono">⌘N</kbd> New note</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 font-mono">⌘/</kbd> AI Chat</span>
          </div>
        </main>

        {/* AI Chat Sidebar */}
        <AnimatePresence>
          {showChat && (
            <AIChat onClose={() => setShowChat(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Note Form Modal */}
      <AnimatePresence>
        {showForm && (
          <NoteForm
            note={editNote}
            onClose={() => { setShowForm(false); setEditNote(null); }}
            onSuccess={handleNoteCreated}
          />
        )}
      </AnimatePresence>

      {/* Daily Digest Modal */}
      <AnimatePresence>
        {showDigest && (
          <DailyDigest onClose={() => setShowDigest(false)} />
        )}
      </AnimatePresence>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
}


