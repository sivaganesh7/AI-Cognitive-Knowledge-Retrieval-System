import { motion } from 'framer-motion';

export default function SkeletonCard({ index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="p-5 rounded-2xl border border-white/5 bg-white/5 animate-pulse flex flex-col gap-4 h-[240px]"
    >
      <div className="flex justify-between items-center">
        <div className="w-20 h-6 rounded-full bg-white/10" />
        <div className="w-6 h-6 rounded-lg bg-white/10" />
      </div>

      <div className="w-3/4 h-5 rounded bg-white/10" />

      <div className="space-y-2 mt-2 flex-1">
        <div className="w-full h-3 rounded bg-white/10" />
        <div className="w-full h-3 rounded bg-white/10" />
        <div className="w-2/3 h-3 rounded bg-white/10" />
      </div>

      <div className="flex gap-2 mb-2">
        <div className="w-12 h-5 rounded-full bg-white/10" />
        <div className="w-16 h-5 rounded-full bg-white/10" />
      </div>

      <div className="border-t border-white/5 pt-3 flex justify-between">
        <div className="w-16 h-3 rounded bg-white/10" />
        <div className="w-16 h-3 rounded bg-white/10" />
      </div>
    </motion.div>
  );
}
