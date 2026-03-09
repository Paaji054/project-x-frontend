import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../services/authService";
import { toast } from "react-hot-toast";

export default function LogoutConfirmationModal({ isOpen, onClose, onConfirm }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      
      if (onConfirm) {
        onConfirm();
      }
      
      onClose();
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed, redirecting anyway...');
      // Still close and redirect even if API fails
      onClose();
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
            onClick={onClose}
          />

          {/* Modal Container - Centers the modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.3 }}
              className="w-full max-w-[320px] sm:max-w-[360px] bg-gradient-to-br from-secondary-100 via-secondary-50 to-secondary-100 dark:from-black border-2 border-primary-700 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Content */}
              <div className="p-6 md:p-8">
                {/* Title */}
                <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-3 md:mb-4">
                  Log out
                </h2>

                {/* Message */}
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6 md:mb-8 leading-relaxed">
                  You will be returned to the login screen.
                </p>

                {/* Buttons */}
                <div className="flex border-t border-black dark:border-gray-400 pt-4 md:pt-5">
                  {/* Cancel Button */}
                  <motion.button
                    onClick={onClose}
                    whileHover={{ opacity: 0.8 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 md:px-5 py-2.5 md:py-3 text-primary dark:text-red-500 font-medium text-sm md:text-base hover:text-primary-400 dark:hover:text-red-400 transition-colors text-center"
                  >
                    Cancel
                  </motion.button>

                  {/* Divider */}
                  <div className="w-px bg-gray-700 dark:bg-gray-300 mx-1"></div>

                  {/* Logout Button */}
                  <motion.button
                    onClick={handleConfirm}
                    disabled={isLoggingOut}
                    whileHover={{ opacity: 0.8 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 md:px-5 py-2.5 md:py-3 text-primary dark:text-red-500 font-bold text-sm md:text-base hover:text-primary-400 dark:hover:text-red-400 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal using portal to ensure it's at the root level
  return isOpen ? createPortal(modalContent, document.body) : null;
}