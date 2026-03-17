'use client';

import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Bot, Brain, Loader2, Send, Trash2, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export default function AIChat({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your AI assistant. Ask me anything about your notes, and I'll search through your entire knowledge base to answer.",
      ts: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const historyLoadedRef = useRef(false);

  // Load history on mount
  useEffect(() => {
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    api.get('/api/ai/history')
      .then(({ messages: hist }) => {
        if (hist?.length > 0) {
          const formatted = hist.map(m => ({ ...m, ts: new Date(m.timestamp) }));
          setMessages(prev => [...prev, ...formatted]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendQuestion = async (question) => {
    const q = question.trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const { answer, notesSearched } = await api.post('/api/ai/query', {
        question: q,
        conversationHistory: history,
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          meta: `Searched ${notesSearched} note${notesSearched !== 1 ? 's' : ''}`,
          ts: new Date(),
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${err.message || 'Sorry, I ran into an issue. Please try again.'}`,
          ts: new Date(),
          error: true,
        }
      ]);
      toast.error(err.message || 'AI query failed');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    return sendQuestion(input);
  };

  const clearChat = async () => {
    if (!confirm('Clear conversation history?')) return;
    try {
      await api.delete('/api/ai/history');
      setMessages([{
        role: 'assistant',
        content: "Chat cleared! Ask me anything about your notes.",
        ts: new Date(),
      }]);
      toast.success('Chat cleared');
    } catch {
      toast.error('Failed to clear chat');
    }
  };

  const suggestions = [
    'What are my most recent insights?',
    'Summarize my notes about AI',
    'What todos do I have?',
    'What have I learned about productivity?',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="fixed right-0 top-0 h-screen w-full max-w-[420px] flex flex-col z-50 border-l border-white/8 shadow-2xl"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
            <Brain size={16} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Brain AI</p>
            <p className="text-xs" style={{ color: 'var(--color-muted-2)' }}>Your knowledge assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Clear chat"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/8'
              }`}
              style={msg.role !== 'user' ? { color: 'var(--color-muted)' } : undefined}
            >
              {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : msg.error
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 rounded-tl-sm'
                    : 'bg-white/6 border border-white/8 rounded-tl-sm'
                }`}
                style={msg.role === 'assistant' && !msg.error ? { color: 'var(--color-text)' } : undefined}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
              {msg.meta && (
                <p className="text-xs px-1" style={{ color: 'var(--color-muted-2)' }}>{msg.meta}</p>
              )}
              <p className="text-xs px-1" style={{ color: 'var(--color-muted-2)' }}>
                {msg.ts?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-xl bg-white/8 flex items-center justify-center shrink-0" style={{ color: 'var(--color-muted)' }}>
              <Bot size={13} />
            </div>
            <div className="bg-white/6 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (show when only welcome message) */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => sendQuestion(s)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-left"
              style={{ color: 'var(--color-muted)' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/8">
        <form onSubmit={sendMessage} className="flex gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your notes..."
            disabled={loading}
            className="ai-chat-input flex-1 px-4 py-2.5 text-sm border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none rounded-xl transition-all disabled:opacity-50"
            style={{
              color: 'var(--color-text)',
              background: 'var(--color-surface-2)',
              caretColor: 'var(--color-text)',
              WebkitTextFillColor: 'var(--color-text)',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
