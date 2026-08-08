import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IMAGE_QUALITY_PRESETS } from '../utils/imageCompression';

export default function ImageQualityPicker({ isOpen, onClose, onSelect, estimatedSize }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[200]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-gray-800 rounded-xl z-[201] p-4 max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Upload quality</h2>
          <button onClick={onClose} className="text-gray-400" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {estimatedSize && (
          <p className="text-xs text-gray-400 mb-3">Original size: {estimatedSize}</p>
        )}
        <div className="space-y-2">
          {Object.entries(IMAGE_QUALITY_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className="w-full text-left p-3 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-colors"
            >
              <p className="text-sm font-medium text-white">{preset.label}</p>
              <p className="text-xs text-gray-400">{preset.description}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
