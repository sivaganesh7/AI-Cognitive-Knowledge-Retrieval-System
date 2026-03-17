'use client';

import { motion } from 'framer-motion';
import { BookOpen, Hash, Edit3, Heart, Zap } from 'lucide-react';

export default function StatsBar({ stats }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total Notes', value: stats.total_notes, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-500/20' },
    { label: 'Words Written', value: stats.total_words?.toLocaleString() || 0, icon: Edit3, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-500/20' },
    { label: 'Tags Used', value: stats.total_tags || 0, icon: Hash, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-500/20' },
    { label: 'Favorites', value: stats.favorites_count || 0, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-500/20' },
    { label: 'AI Processed', value: stats.ai_processed_count || 0, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`flex items-center gap-3 p-3 rounded-2xl border ${card.bg}`}
        >
          <div className={`p-2 rounded-xl bg-white/5 ${card.color}`}>
            <card.icon size={16} />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none mb-1">{card.value}</p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {card.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
