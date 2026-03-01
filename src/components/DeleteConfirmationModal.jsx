import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

/**
 * Reusable confirmation modal for destructive actions (e.g. delete post, delete story).
 * Confirms with the user before calling onConfirm. Content is permanently deleted from the database (hard delete).
 */
export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete?",
  message = "Are you sure? This action cannot be undone. This will be permanently deleted.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Delete confirmation failed:", err);
      setIsConfirming(false);
      // Leave modal open; caller may have shown an error (e.g. alert)
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.3 }}
              className="w-full max-w-[320px] sm:max-w-[360px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              aria-describedby="delete-confirm-message"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <h2 id="delete-confirm-title" className="text-xl md:text-2xl font-bold text-black dark:text-white">
                    {title}
                  </h2>
                </div>
                <p id="delete-confirm-message" className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {message}
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isConfirming}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isConfirming ? "Deleting…" : confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return isOpen ? createPortal(modalContent, document.body) : null;
}
