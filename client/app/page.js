'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Brain, Check, Database, Globe, Shield, Sparkles, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const BRAIN_VIDEO_DARK = 'https://res.cloudinary.com/dcpa501nb/video/upload/v1773585278/D_GIF_Generation_with_Slow_Rotation_fgryz4.mp4';
const BRAIN_VIDEO_LIGHT = 'https://res.cloudinary.com/dcpa501nb/video/upload/v1773588172/WhatsApp_Video_2026-03-15_at_8.52.21_PM_moligr.mp4';
const DEMO_VIDEO = 'https://res.cloudinary.com/dcpa501nb/video/upload/v1773585206/AI_Knowledge_App_Demo_Video_e3zte1.mp4';

const features = [
  {
    icon: Sparkles,
    title: 'AI Summarization',
    desc: 'Auto-generate 2-3 sentence summaries for every note you capture.',
    color: '#6366f1',
  },
  {
    icon: Zap,
    title: 'Smart Auto-Tagging',
    desc: 'AI analyzes your content and creates 3-5 relevant tags automatically.',
    color: '#f59e0b',
  },
  {
    icon: Brain,
    title: 'Conversational Q&A',
    desc: 'Ask questions about your entire knowledge base in natural language.',
    color: '#06b6d4',
  },
  {
    icon: Globe,
    title: 'Smart Connections',
    desc: 'Discover hidden links between your notes you would never spot manually.',
    color: '#ec4899',
  },
  {
    icon: Database,
    title: 'Flashcard Generator',
    desc: 'Turn any note into a study card set instantly with one click.',
    color: '#10b981',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'Firebase authentication with complete data isolation per user.',
    color: '#8b5cf6',
  },
];

const noteTypes = [
  { type: 'note',    emoji: '📝', color: '#6366f1', label: 'Note' },
  { type: 'link',    emoji: '🔗', color: '#06b6d4', label: 'Link' },
  { type: 'insight', emoji: '💡', color: '#f59e0b', label: 'Insight' },
  { type: 'quote',   emoji: '💬', color: '#ec4899', label: 'Quote' },
  { type: 'todo',    emoji: '✅', color: '#10b981', label: 'Todo' },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const { theme, mounted } = useTheme();
  const router = useRouter();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const brainVideoSrc = mounted && theme === 'light' ? BRAIN_VIDEO_LIGHT : BRAIN_VIDEO_DARK;

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!isDemoOpen) return;

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsDemoOpen(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isDemoOpen]);

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-lg text-white">AI Cognitive Knowledge Retrieval System</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8">
              <Sparkles size={14} />
              Powered by Google Gemini AI
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="text-white">Your Knowledge,</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Organized by AI
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl lg:mx-0 mx-auto mb-10 leading-relaxed">
              Capture anything. AI processes it instantly — summarizing, tagging, and
              connecting ideas. Then ask it anything in plain English.
            </p>

            <div className="flex items-center lg:justify-start justify-center gap-4 flex-wrap">
              <Link
                href="/login"
                className="group flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 text-lg"
              >
                Start Building Your Brain
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                type="button"
                onClick={() => setIsDemoOpen(true)}
                className="px-8 py-4 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium rounded-2xl transition-all hover:bg-white/5 text-lg"
              >
                See a Demo
              </button>
            </div>

            {/* Note types pill row */}
            <div className="flex items-center lg:justify-start justify-center gap-3 mt-12 flex-wrap">
              {noteTypes.map(({ type, emoji, color, label }) => (
                <div
                  key={type}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                >
                  <span>{emoji}</span>
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="relative hero-brain-wrap">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-90 hero-brain-glow" />
              <video
                className="relative z-10 w-full h-[300px] md:h-[420px] object-cover rounded-2xl hero-brain-video"
                autoPlay
                loop
                muted
                playsInline
                key={brainVideoSrc}
              >
                <source src={brainVideoSrc} type="video/mp4" />
              </video>
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {isDemoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setIsDemoOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-black p-2"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsDemoOpen(false)}
                className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
                aria-label="Close demo video"
              >
                <X size={18} />
              </button>
              <video
                className="w-full max-h-[80vh] rounded-xl"
                src={DEMO_VIDEO}
                controls
                autoPlay
                playsInline
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            AI That Actually Understands Your Notes
          </h2>
          <p className="text-gray-400 text-lg">
            10+ AI features built on Google Gemini, working silently in the background
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-white/7 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all group cursor-default"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feat.color}20`, color: feat.color }}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feat.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Value Prop / CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl p-12 border border-indigo-500/20 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5" />
          <div className="relative">
            <h2 className="text-4xl font-bold text-white mb-4">
              Stop forgetting what you learn
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join the knowledge revolution. AI Cognitive Knowledge Retrieval System turns scattered information
              into an organized, queryable knowledge system — powered by AI.
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-10">
              {[
                'Auto-summarization',
                'Smart tagging',
                'Conversational Q&A',
                'Flashcards',
                'Writing improvement',
                'Topic clustering',
              ].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-gray-300">
                  <Check size={14} className="text-green-400" />
                  {item}
                </div>
              ))}
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 text-lg"
            >
              <span>🧠</span> Build Your AI Cognitive Knowledge Retrieval System
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 text-center text-gray-500 text-sm">
        <p>
          Built with Next.js · Express · PostgreSQL · Google Gemini AI · Firebase
        </p>
        <p className="mt-2">
          Full-Stack Internship Project — Version 1.0.0
        </p>
      </footer>
    </div>
  );
}

