import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag } from "lucide-react";
import { reportService } from "../services/reportService";
import { toast } from "react-hot-toast";

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "violence", label: "Violence or threats" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "false_info", label: "False information" },
  { value: "other", label: "Other" },
];

export default function ReportModal({ isOpen, onClose, targetType, targetId }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await reportService.reportContent(targetType, targetId, reason, description);
      setSubmitted(true);
      toast.success("Report submitted successfully");
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setReason("");
        setDescription("");
      }, 1500);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || "Failed to submit report";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setReason("");
    setDescription("");
    setError("");
    setSubmitted(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-black dark:text-white">
                    Report {targetType}
                  </h3>
                </div>
                <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-green-500 text-lg font-semibold mb-2">Report submitted</div>
                  <p className="text-sm text-gray-500">Thank you for helping keep the community safe.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Why are you reporting this {targetType}?
                  </p>

                  <div className="space-y-2 mb-4">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => { setReason(r.value); setError(""); }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                          reason === r.value
                            ? "bg-red-500/10 border border-red-500 text-red-500"
                            : "bg-gray-100 dark:bg-[#252525] text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#2a2a2a] border border-transparent"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {reason === "other" && (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe the issue..."
                      className="w-full bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 resize-none"
                      rows={3}
                      maxLength={500}
                    />
                  )}

                  {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

                  <button
                    onClick={handleSubmit}
                    disabled={!reason || submitting}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                  >
                    {submitting ? "Submitting..." : "Submit Report"}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
