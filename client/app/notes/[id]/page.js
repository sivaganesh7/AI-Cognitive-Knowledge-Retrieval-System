'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, Edit3, Trash2, Tag, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id) return;
    api.get(`/api/notes/${id}`)
      .then(n => {
        setNote(n);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Note not found');
        router.push('/dashboard');
      });
  }, [id, user, router]);

  const handleDelete = async () => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/api/notes/${id}`);
      toast.success('Deleted');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="min-h-screen bg-[#030712] text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111827] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{note.title}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-400 mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(note.created_at).toLocaleDateString()}</span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {note.reading_time} min read</span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1.5"><Edit3 size={14} /> {note.word_count} words</span>
            {note.source_url && (
              <>
                <span className="text-gray-600">•</span>
                <a href={note.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-cyan-400 hover:underline">
                  <ExternalLink size={14} /> Source Link
                </a>
              </>
            )}
          </div>

          {note.summary && (
            <div className="mb-8 p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-100/90 text-[15px] leading-relaxed relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mt-16 -mr-16" />
              <div className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 mb-2 flex items-center gap-1.5">
                <span className="animate-pulse">✨</span> AI Summary
              </div>
              {note.summary}
            </div>
          )}

          <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-loose prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-img:rounded-2xl prose-a:text-indigo-400">
            {note.content.split('\n').map((para, i) => (
              para ? <p key={i}>{para}</p> : <br key={i} />
            ))}
          </div>

          {note.tags?.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-2">
              {note.tags.map(t => (
                <span key={t} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-400 flex items-center gap-1 cursor-default hover:text-white transition-colors">
                  <Tag size={12} /> {t}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
