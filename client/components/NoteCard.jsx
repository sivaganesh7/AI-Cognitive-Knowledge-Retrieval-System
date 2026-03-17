'use client';

import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
    CheckSquare,
    ChevronDown, ChevronUp,
    Clock,
    Copy,
    Edit3, ExternalLink,
    Globe,
    Hash,
    Heart,
    Pin,
    Sparkles,
    Square,
    Trash2
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  note:    { emoji: '📝', label: 'Note',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)'  },
  link:    { emoji: '🔗', label: 'Link',    color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.25)'   },
  insight: { emoji: '💡', label: 'Insight', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
  quote:   { emoji: '💬', label: 'Quote',   color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.25)'  },
  todo:    { emoji: '✅', label: 'Todo',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)'  },
};

export default function NoteCard({ note, onDelete, onUpdate, onEdit, onTagClick }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState('');
  const [localNote, setLocalNote] = useState(note);
  const config = TYPE_CONFIG[note.type] || TYPE_CONFIG.note;
  const isBusy = loading !== '';

  const toggle = async (field) => {
    if (isBusy) return;
    setLoading(field);
    try {
      const updated = await api.patch(`/api/notes/${note.id}/toggle`, { field });
      setLocalNote(updated);
      onUpdate?.();
    } catch {
      toast.error('Update failed');
    } finally {
      setLoading('');
    }
  };

  const handleDelete = async () => {
    if (isBusy) return;
    if (!confirm('Delete this note?')) return;
    try {
      setLoading('delete');
      await api.delete(`/api/notes/${note.id}`);
      toast.success('Note deleted');
      onDelete?.();
    } catch {
      toast.error('Delete failed');
    } finally {
      setLoading('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localNote.content);
    toast.success('Copied to clipboard!');
  };

  const handleExport = async () => {
    try {
      const res = await api.download(`/api/notes/${note.id}/export`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title.replace(/[^a-z0-9]/gi, '-')}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const truncate = (str, len = 180) =>
    str?.length > len ? str.slice(0, len) + '…' : str;

  const timeAgo = formatDistanceToNow(new Date(localNote.created_at), { addSuffix: true });

  return (
    <motion.div
      layout
      className="group relative rounded-2xl overflow-hidden transition-all duration-200 flex flex-col min-h-[260px]"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
      }}
      whileHover={{ y: -1, boxShadow: `0 8px 30px rgba(0,0,0,0.3)` }}
    >
      {/* Type indicator bar */}
      <div
        className="h-[3px] w-full"
        style={{ background: `linear-gradient(90deg, ${config.color}, transparent)` }}
      />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Type Badge */}
            <span
              className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
            >
              {config.emoji} {config.label}
            </span>

            {/* Pinned */}
            {localNote.is_pinned && (
              <Pin size={12} className="text-amber-400 shrink-0" />
            )}
            {/* Public */}
            {localNote.is_public && (
              <Globe size={12} className="text-cyan-400 shrink-0" />
            )}
          </div>

          {/* Action buttons (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => toggle('is_pinned')}
              disabled={isBusy}
              className={`p-1.5 rounded-lg transition-all ${localNote.is_pinned ? 'text-amber-400 bg-amber-400/10' : 'text-gray-600 hover:text-amber-400 hover:bg-amber-400/10'}`}
              title="Pin"
            >
              <Pin size={14} />
            </button>
            <button
              onClick={() => toggle('is_favorite')}
              disabled={isBusy}
              className={`p-1.5 rounded-lg transition-all ${localNote.is_favorite ? 'text-pink-400 bg-pink-400/10' : 'text-gray-600 hover:text-pink-400 hover:bg-pink-400/10'}`}
              title="Favorite"
            >
              <Heart size={14} fill={localNote.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => onEdit?.(localNote)}
              disabled={isBusy}
              className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
              title="Edit"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={handleCopy}
              disabled={isBusy}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all"
              title="Copy"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isBusy}
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug line-clamp-2" style={{ color: 'var(--color-text)' }}>
          {localNote.title}
        </h3>

        {/* Todo checkbox */}
        {localNote.type === 'todo' && (
          <button
            onClick={() => toggle('todo_done')}
            disabled={isBusy}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors self-start"
          >
            {localNote.todo_done
              ? <CheckSquare size={16} className="text-green-400" />
              : <Square size={16} />}
            <span className={localNote.todo_done ? 'line-through text-gray-600' : ''}>
              {localNote.todo_done ? 'Done' : 'Mark as done'}
            </span>
          </button>
        )}

        {/* Source URL */}
        {localNote.source_url && (
          <a
            href={localNote.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ExternalLink size={12} />
            <span className="truncate">{new URL(localNote.source_url).hostname}</span>
          </a>
        )}

        {/* Content / Summary */}
        <div className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {localNote.summary && !expanded ? (
            <p>{localNote.summary}</p>
          ) : (
            <p className={expanded ? '' : 'line-clamp-3'}>
              {localNote.content}
            </p>
          )}
        </div>

        {/* AI Summary badge */}
        {localNote.ai_processed && !expanded && localNote.summary && (
          <div className="flex items-center gap-1 text-xs text-indigo-400">
            <Sparkles size={11} />
            <span>AI Summary</span>
          </div>
        )}

        {/* Expand / Collapse */}
        {localNote.content?.length > 180 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors self-start"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Tags */}
        {localNote.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {localNote.tags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 transition-all"
              >
                <Hash size={10} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between text-xs text-gray-600 border-t border-white/5 pt-3 mt-auto">
        <span>{timeAgo}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {localNote.reading_time}m
          </span>
          <span>{localNote.word_count} words</span>
        </div>
      </div>
    </motion.div>
  );
}
