'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Code, Cpu, Database, FileText, Server, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  const sections = [
    {
      title: 'System Architecture',
      icon: Server,
      content: `The application follows a clean client-server REST architecture. 
The Next.js frontend acts solely as the presentation layer, communicating with the Express backend via authenticated API calls. 
Every API call passes a Firebase JWT token which the backend verifies to ensure data isolation.`,
    },
    {
      title: 'Database Schema',
      icon: Database,
      content: `PostgreSQL is used as the primary database. The schema is highly normalized.
The "notes" table is the core entity, referencing the "users" table. We use PostgreSQL's native GIN indexes on array columns (like tags) to perform extremely fast filtering. A full-text search index powers keyword searches.`,
    },
    {
      title: 'AI Integration',
      icon: Cpu,
      content: `Google Gemini (gemini-1.5-flash) powers all AI features. 
Background processing: When a note is saved, the API immediately returns a 201 response so the UI is snappy. In the background, the server calls Gemini to generate a summary and tags, then silently updates the database.`,
    },
    {
      title: 'Frontend State & UI',
      icon: Smartphone,
      content: `React Context manages global auth state. Local state handles search and filtering. 
We use Framer Motion for all micro-interactions and layout animations. The UI uses Tailwind CSS with custom CSS variables to create a cohesive glassmorphism design system.`,
    },
    {
      title: 'Portable Architecture',
      icon: Code,
      content: `The system is built to be modular.
- Swap AI: Rewrite server/services/ai.js
- Swap DB: Rewrite server/db/queries.js
- Swap Auth: Update Firebase verify function in server/middleware/auth.js`,
    },
  ];

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="text-indigo-400" /> Architecture Documentation
          </h1>
        </div>

        <div className="space-y-6">
          {sections.map((sec, i) => (
            <motion.div
              key={sec.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-indigo-500/30 transition-colors"
              style={{ background: 'var(--color-surface)' }}
            >
              <div className="flex items-start gap-5">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
                  <sec.icon size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">{sec.title}</h2>
                  <div className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {sec.content}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 border-t border-white/5 pt-8">
          AI Cognitive Knowledge Retrieval System Version 1.0.0 — See README for setup instructions.
        </div>
      </div>
    </div>
  );
}

