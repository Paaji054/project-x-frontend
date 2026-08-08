import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Check } from 'lucide-react';
import { MUSIC_TRACKS } from '../constants/musicTracks';

export default function MusicPickerModal({ isOpen, onClose, selectedTrack, onConfirm }) {
  const audioRef = useRef(null);
  const [previewingId, setPreviewingId] = useState(null);
  const [pendingTrack, setPendingTrack] = useState(selectedTrack || null);

  useEffect(() => {
    if (isOpen) {
      setPendingTrack(selectedTrack || null);
      setPreviewingId(null);
    } else {
      audioRef.current?.pause();
      setPreviewingId(null);
    }
  }, [isOpen, selectedTrack]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const togglePreview = async (track) => {
    if (!track.previewUrl) return;

    if (previewingId === track.id) {
      audioRef.current?.pause();
      setPreviewingId(null);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => setPreviewingId(null));
    }

    audioRef.current.pause();
    audioRef.current.src = track.previewUrl;
    setPreviewingId(track.id);
    try {
      await audioRef.current.play();
    } catch {
      setPreviewingId(null);
    }
  };

  const handleConfirm = () => {
    audioRef.current?.pause();
    setPreviewingId(null);
    onConfirm(pendingTrack);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[200]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 rounded-t-lg z-[201] max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Add audio</h2>
          <button onClick={onClose} className="text-gray-400" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {MUSIC_TRACKS.map((track) => {
            const isPreviewing = previewingId === track.id;
            const isSelected = pendingTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-transparent hover:bg-gray-800'
                }`}
              >
                <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{track.title}</p>
                  <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePreview(track)}
                  className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700"
                  aria-label={isPreviewing ? 'Pause preview' : 'Preview track'}
                >
                  {isPreviewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingTrack(track)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  aria-label="Select track"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-gray-800 text-white text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!pendingTrack}
            className="flex-1 py-2.5 rounded-lg bg-blue-500 disabled:opacity-50 text-white text-sm font-medium"
          >
            Use audio
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
