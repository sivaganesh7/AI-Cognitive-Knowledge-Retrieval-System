'use client';

import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckSquare, Lightbulb, Link2, Loader2, Quote, Sparkles, Tag, Type, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: 'note', label: 'Note', emoji: '📝', icon: Type, accent: '#6366f1' },
  { value: 'link', label: 'Link', emoji: '🔗', icon: Link2, accent: '#06b6d4' },
  { value: 'insight', label: 'Insight', emoji: '💡', icon: Lightbulb, accent: '#f59e0b' },
  { value: 'quote', label: 'Quote', emoji: '💬', icon: Quote, accent: '#ec4899' },
  { value: 'todo', label: 'Todo', emoji: '✅', icon: CheckSquare, accent: '#10b981' },
];

function fieldClass() {
  return 'w-full rounded-xl px-4 py-3 text-sm transition-all border focus:outline-none';
}

function inputStyle() {
  return {
    background: 'var(--color-surface-2)',
    color: 'var(--color-text)',
    borderColor: 'var(--color-border)',
  };
}

function TypeBadge({ type }) {
  const current = TYPE_OPTIONS.find((item) => item.value === type) || TYPE_OPTIONS[0];
  const Icon = current.icon;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
      style={{
        color: current.accent,
        border: `1px solid ${current.accent}55`,
        background: `${current.accent}1a`,
      }}
    >
      <Icon size={13} />
      {current.label} Creator
    </div>
  );
}

export default function NoteForm({ note, onClose, onSuccess }) {
  const isEdit = !!note;
  const [form, setForm] = useState({
    title: note?.title || '',
    content: note?.content || '',
    type: note?.type || 'note',
    source_url: note?.source_url || '',
    tags: note?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSummarizing, setAiSummarizing] = useState(false);
  const [aiTagging, setAiTagging] = useState(false);
  const [aiImproving, setAiImproving] = useState(false);
  const titleRef = useRef(null);

  const selectedType = useMemo(
    () => TYPE_OPTIONS.find((item) => item.value === form.type) || TYPE_OPTIONS[0],
    [form.type]
  );

  useEffect(() => {
    titleRef.current?.focus();
  }, [form.type]);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const addTag = (tag) => {
    const t = tag.toLowerCase().trim().replace(/\s+/g, '-');
    if (t && !form.tags.includes(t) && form.tags.length < 10) {
      update('tags', [...form.tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => update('tags', form.tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  };

  const handleAISummarize = async () => {
    if (!form.content) return toast.error('Add some content first');
    setAiSummarizing(true);
    try {
      const { summary } = await api.post('/api/ai/summarize', {
        title: form.title,
        content: form.content,
      });
      const summaryBlock = `AI Summary:\n${summary}\n\n`;
      const nextContent = form.content.startsWith('AI Summary:')
        ? form.content.replace(/^AI Summary:[\s\S]*?\n\n/, summaryBlock)
        : `${summaryBlock}${form.content}`;

      update('content', nextContent);
      toast.success('AI summary inserted into content!');
      toast(
        () => (
          <div className="max-w-xs">
            <p className="mb-1 text-xs font-semibold text-purple-400">AI Summary</p>
            <p className="text-xs" style={{ color: 'var(--color-text)' }}>{summary}</p>
          </div>
        ),
        { duration: 5000 }
      );
    } catch {
      toast.error('AI summarization failed');
    } finally {
      setAiSummarizing(false);
    }
  };

  const handleAITag = async () => {
    if (!form.content) return toast.error('Add some content first');
    setAiTagging(true);
    try {
      const { tags } = await api.post('/api/ai/autotag', {
        title: form.title,
        content: form.content,
      });
      const newTags = [...new Set([...form.tags, ...tags])].slice(0, 10);
      update('tags', newTags);
      toast.success(`Added ${tags.length} AI tags!`);
    } catch {
      toast.error('AI tagging failed');
    } finally {
      setAiTagging(false);
    }
  };

  const handleAIImprove = async () => {
    if (!form.content) return toast.error('Add some content first');
    setAiImproving(true);
    try {
      const { improved } = await api.post('/api/ai/improve', { content: form.content });
      if (String(improved || '').trim() === String(form.content || '').trim()) {
        toast('No major rewrite suggested this time.', { icon: 'ℹ️' });
      } else {
        update('content', improved);
        toast.success('Writing improved by AI!');
      }
    } catch {
      toast.error('AI improvement failed');
    } finally {
      setAiImproving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.content.trim()) return toast.error('Content is required');

    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/api/notes/${note.id}`, form);
        toast.success('Note updated!');
      } else {
        await api.post('/api/notes', form);
        toast.success('Note saved!');
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const renderTypeFields = () => {
    const commonTitleClass = `${fieldClass()} text-lg font-semibold`;
    const commonTextClass = `${fieldClass()} min-h-[210px] resize-y leading-relaxed`;

    if (form.type === 'link') {
      return (
        <div className="space-y-4">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${selectedType.accent}66`, background: `${selectedType.accent}12` }}
          >
            <p className="text-sm font-semibold" style={{ color: selectedType.accent }}>
              Link Capture Window
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
              Save the source first, then add key takeaways and why it matters.
            </p>
          </div>
          <input
            type="url"
            value={form.source_url}
            onChange={(e) => update('source_url', e.target.value)}
            placeholder="https://source-link.com/article"
            className={commonTitleClass}
            style={inputStyle()}
          />
          <input
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Resource title"
            className={commonTitleClass}
            style={inputStyle()}
          />
          <textarea
            value={form.content}
            onChange={(e) => update('content', e.target.value)}
            placeholder="Write key insights from this link..."
            className={commonTextClass}
            style={{ ...inputStyle(), caretColor: 'var(--color-primary)' }}
          />
        </div>
      );
    }

    if (form.type === 'insight') {
      return (
        <div className="space-y-4">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${selectedType.accent}66`, background: `${selectedType.accent}12` }}
          >
            <p className="text-sm font-semibold" style={{ color: selectedType.accent }}>
              Insight Creator
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
              Capture the idea clearly, then explain context and potential impact.
            </p>
          </div>
          <input
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Core insight in one line"
            className={commonTitleClass}
            style={inputStyle()}
          />
          <textarea
            value={form.content}
            onChange={(e) => update('content', e.target.value)}
            placeholder="Expand the insight: why it matters, examples, next actions..."
            className={`${commonTextClass} min-h-[250px]`}
            style={{ ...inputStyle(), caretColor: 'var(--color-primary)' }}
          />
        </div>
      );
    }

    if (form.type === 'quote') {
      return (
        <div className="space-y-4">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${selectedType.accent}66`, background: `${selectedType.accent}12` }}
          >
            <p className="text-sm font-semibold" style={{ color: selectedType.accent }}>
              Quote Capture
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
              Keep quote text in the content area and use title for speaker/source.
            </p>
          </div>
          <input
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Who said this / where from"
            className={commonTitleClass}
            style={inputStyle()}
          />
          <div
            className="rounded-2xl border px-4 py-3"
            style={{ borderColor: `${selectedType.accent}66`, background: 'var(--color-surface-2)' }}
          >
            <textarea
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              placeholder='"Write the quote text here..."'
              className="w-full min-h-[220px] resize-y bg-transparent text-[15px] leading-relaxed focus:outline-none"
              style={{ color: 'var(--color-text)', caretColor: 'var(--color-primary)' }}
            />
          </div>
        </div>
      );
    }

    if (form.type === 'todo') {
      return (
        <div className="space-y-4">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${selectedType.accent}66`, background: `${selectedType.accent}12` }}
          >
            <p className="text-sm font-semibold" style={{ color: selectedType.accent }}>
              Task Creator
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
              Put the task name in title and checklist/context in details.
            </p>
          </div>
          <input
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Task title"
            className={commonTitleClass}
            style={inputStyle()}
          />
          <textarea
            value={form.content}
            onChange={(e) => update('content', e.target.value)}
            placeholder="Add details, checklist, dependencies, or deadline notes..."
            className={`${commonTextClass} min-h-[230px]`}
            style={{ ...inputStyle(), caretColor: 'var(--color-primary)' }}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: `${selectedType.accent}66`, background: `${selectedType.accent}12` }}
        >
          <p className="text-sm font-semibold" style={{ color: selectedType.accent }}>
            Note Writer
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
            Capture structured thoughts, references, and ideas in one place.
          </p>
        </div>
        <input
          ref={titleRef}
          type="text"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Note title"
          className={`${fieldClass()} text-xl font-semibold`}
          style={inputStyle()}
        />
        <textarea
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
          placeholder="Write your note here... (Markdown supported)"
          className={`${fieldClass()} min-h-[240px] resize-y leading-relaxed`}
          style={{ ...inputStyle(), color: 'var(--color-text)', caretColor: 'var(--color-primary)' }}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 380 }}
        className="relative z-10 w-full max-w-3xl rounded-3xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: `1px solid ${selectedType.accent}55`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.45), inset 0 0 0 1px ${selectedType.accent}22`,
          maxHeight: '92dvh',
        }}
      >
        <form onSubmit={handleSubmit} className="flex max-h-[92dvh] min-h-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
            <div className="space-y-1">
              <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {isEdit ? `Edit ${selectedType.label}` : `Create ${selectedType.label}`}
              </h2>
              <TypeBadge type={form.type} />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAISummarize}
                disabled={aiSummarizing}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
                style={{ color: '#818cf8', background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.35)' }}
              >
                {aiSummarizing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Summarize
              </button>
              <button
                type="button"
                onClick={handleAITag}
                disabled={aiTagging}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
                style={{ color: '#d8b4fe', background: 'rgba(168,85,247,0.14)', border: '1px solid rgba(168,85,247,0.35)' }}
              >
                {aiTagging ? <Loader2 size={13} className="animate-spin" /> : <Tag size={13} />}
                Auto-Tag
              </button>
              <button
                type="button"
                onClick={handleAIImprove}
                disabled={aiImproving}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
                style={{ color: '#fcd34d', background: 'rgba(234,179,8,0.14)', border: '1px solid rgba(234,179,8,0.35)' }}
              >
                {aiImproving ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Improve
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 transition-all"
                style={{ color: 'var(--color-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6 space-y-5">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('type', opt.value)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all"
                  style={{
                    color: form.type === opt.value ? '#fff' : 'var(--color-muted)',
                    background: form.type === opt.value ? opt.accent : 'var(--color-surface-2)',
                    border: form.type === opt.value ? `1px solid ${opt.accent}` : '1px solid var(--color-border)',
                  }}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {renderTypeFields()}

            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                Tags
              </label>
              <div
                className="flex min-h-[46px] flex-wrap gap-1.5 rounded-xl border p-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
                onClick={() => document.getElementById('tag-input')?.focus()}
              >
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                    style={{
                      background: `${selectedType.accent}22`,
                      color: selectedType.accent,
                      border: `1px solid ${selectedType.accent}44`,
                    }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(tag);
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => tagInput && addTag(tagInput)}
                  placeholder={form.tags.length === 0 ? 'Add tags (Enter or comma)...' : ''}
                  className="min-w-[130px] flex-1 bg-transparent text-sm focus:outline-none"
                  style={{ color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted-2)' }}>
              <span>{wordCount} words</span>
              <span>{readTime} min read</span>
              <span>{form.content.length} chars</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium"
              style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
            >
              Cancel
            </button>

            <div className="hidden items-center gap-2 text-xs sm:flex" style={{ color: 'var(--color-muted-2)' }}>
              <Sparkles size={12} style={{ color: selectedType.accent }} />
              AI can improve this {selectedType.label.toLowerCase()} after saving.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: selectedType.accent }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {isEdit ? 'Save Changes' : `Create ${selectedType.label}`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
