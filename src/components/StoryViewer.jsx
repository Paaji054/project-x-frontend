import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Send, SendHorizonal, MoreVertical, Trash2 } from "lucide-react";
import ShareModal from "./ShareModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { storyService } from "../services/storyService";
import { messageService } from "../services/messageService";
import { toast } from "react-hot-toast";

export default function StoryViewer({ stories, initialIndex, onClose, onStoryViewed, currentUserId, onStoryDeleted }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [viewedStories, setViewedStories] = useState(new Set([initialIndex]));
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isPaused, setIsPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [storyMenuOpen, setStoryMenuOpen] = useState(false);
  const [showDeleteStoryConfirm, setShowDeleteStoryConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const progressIntervalRef = useRef(null);
  const handleNextRef = useRef(null);
  const handlePrevRef = useRef(null);

  const currentStory = stories[currentStoryIndex];
  // Backend sends story with userId and author: { uid, username, ... }
  const storyOwnerId = currentStory?.userId || currentStory?.author?.uid;
  const isOwnStory = currentUserId && storyOwnerId && storyOwnerId === currentUserId;
  const storyUsername = currentStory?.author?.username || currentStory?.username;

  // Get previous viewed stories
  const prevStories = stories
    .slice(0, currentStoryIndex)
    .map((story, idx) => ({ ...story, originalIndex: idx }))
    .filter((_, idx) => viewedStories.has(idx));

  // Get next unviewed stories
  const nextStories = stories
    .slice(currentStoryIndex + 1)
    .map((story, idx) => ({ ...story, originalIndex: currentStoryIndex + 1 + idx }))
    .filter((_, idx) => !viewedStories.has(currentStoryIndex + 1 + idx));

  // Format story timestamp as relative time (e.g., "Just now", "5m", "2h")
  const getRelativeTime = (dateValue) => {
    if (!dateValue) return "";
    const created = new Date(dateValue);
    if (Number.isNaN(created.getTime())) return "";

    const diffMs = Date.now() - created.getTime();
    if (diffMs < 0) return "Just now";

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Progress bar animation
  useEffect(() => {
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (!isPaused) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (handleNextRef.current) {
              handleNextRef.current();
            }
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStoryIndex, isPaused]);

  const markViewed = (index) => {
    setViewedStories((prev) => {
      const nextSet = new Set([...prev, index]);
      return nextSet;
    });
    if (onStoryViewed && stories[index]) {
      const storyId = stories[index]._id || stories[index].id;
      onStoryViewed(storyId);
    }
  };

  // Mark initial story as viewed on mount
  useEffect(() => {
    markViewed(initialIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      markViewed(nextIndex);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      markViewed(prevIndex);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleStoryClick = (index) => {
    setCurrentStoryIndex(index);
    markViewed(index);
    setProgress(0);
  };

  // Store refs for use in interval
  handleNextRef.current = handleNext;
  handlePrevRef.current = handlePrev;

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    if (!storyOwnerId) return;
    if (isOwnStory) return;
    if (isSendingReply) return;

    try {
      setIsSendingReply(true);
      const conversation = await messageService.createConversation(storyOwnerId);
      const conversationId = conversation?._id || conversation?.id;
      if (!conversationId) throw new Error("Conversation not created");

      await messageService.sendMessage(conversationId, storyOwnerId, text);
      setReplyText("");
      toast.success("Reply sent!");
    } catch (err) {
      console.error("Failed to send story reply:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteStory = async () => {
    const storyId = currentStory?._id || currentStory?.id;
    if (!storyId || isDeleting) return;
    try {
      setIsDeleting(true);
      setStoryMenuOpen(false);
      await storyService.deleteStory(storyId);
      if (onStoryDeleted) onStoryDeleted(storyId);
      onClose();
    } catch (err) {
      console.error("Failed to delete story:", err);
      toast.error("Failed to delete story. Please try again.");
      throw err; // rethrow so DeleteConfirmationModal keeps modal open
    } finally {
      setIsDeleting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowRight" && handleNextRef.current) handleNextRef.current();
      if (e.key === "ArrowLeft" && handlePrevRef.current) handlePrevRef.current();
      if (e.key === "Escape") {
        setStoryMenuOpen(false);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onClose]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Desktop Layout: Left Preview | Center Story | Right Preview */}
        <div className="h-full flex">
          {/* Left Side - Viewed Stories (Desktop Only) */}
          {!isMobile && prevStories.length > 0 && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-32 border-r border-gray-800 bg-black/50 overflow-y-auto"
            >
              <div className="p-4 space-y-3">
                {prevStories.map((story) => (
                  <motion.div
                    key={story.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.6 }}
                    whileHover={{ opacity: 1, scale: 1.05 }}
                    onClick={() => handleStoryClick(story.originalIndex)}
                    className="cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-700">
                      <img
                        src={story.mediaUrl || story.image}
                        alt={story.author?.username || story.username || 'Story'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">{story.author?.username || story.username || ''}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Center - Current Story */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Top-right: three-dots (owner) + close */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {isOwnStory && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStoryMenuOpen((prev) => !prev);
                    }}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
                    aria-label="Story options"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                  {storyMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setStoryMenuOpen(false)}
                        aria-hidden="true"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 top-12 z-20 min-w-[160px] rounded-xl bg-gray-900 border border-gray-700 shadow-xl py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setStoryMenuOpen(false);
                            setShowDeleteStoryConfirm(true);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-400 hover:bg-gray-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-10">
              <motion.div
                className="h-full bg-white"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Story Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStoryIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full max-w-md mx-auto flex items-center justify-center"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) * velocity.x;

                  if (swipe < -10000) {
                    // Swiped left - next story
                    handleNext();
                  } else if (swipe > 10000) {
                    // Swiped right - previous story
                    handlePrev();
                  }
                }}
                onClick={() => setIsPaused(!isPaused)}
              >
                <div className="relative w-full aspect-[9/16] max-h-[90vh] rounded-lg overflow-hidden bg-black">
                  {currentStory.mediaType === 'video' ? (
                    <video
                      src={currentStory.mediaUrl || currentStory.image}
                      className="w-full h-full object-cover select-none"
                      playsInline
                      autoPlay
                      muted
                      loop
                    />
                  ) : (
                    <img
                      src={currentStory.mediaUrl || currentStory.image}
                      alt={storyUsername || 'Story'}
                      className="w-full h-full object-cover select-none"
                      draggable="false"
                      loading="eager"
                      decoding="async"
                    />
                  )}

                  {/* Pause Indicator */}
                  {isPaused && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                    >
                      <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="flex gap-2">
                          <div className="w-1 h-8 bg-white rounded-full"></div>
                          <div className="w-1 h-8 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Story Info Overlay */}
                  <div className="absolute top-4 left-4 right-4 flex items-center gap-3 z-10">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                      <img
                        src={currentStory.author?.avatar || currentStory.author?.profilePhoto || currentStory.user?.profilePhoto || currentStory.mediaUrl || currentStory.image}
                        alt={storyUsername || 'Story'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{storyUsername || 'User'}</p>
                      <p className="text-gray-300 text-xs">
                        {getRelativeTime(currentStory.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Interaction Buttons */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 md:gap-4 z-10">
                    {/* Reply only for other users' stories and when logged in */}
                    {!isOwnStory && currentUserId && (
                      <div className="flex-1 flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-full px-3 md:px-4 py-2">
                        <input
                          type="text"
                          value={replyText}
                          placeholder={`Reply to ${storyUsername || 'user'}...`}
                          disabled={isSendingReply}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => {
                            e.stopPropagation();
                            setIsPaused(true);
                          }}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSendReply();
                            }
                          }}
                          className="flex-1 bg-transparent text-sm md:text-base text-white placeholder-gray-400 focus:outline-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendReply();
                          }}
                          disabled={isSendingReply || !replyText.trim()}
                          className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
                          aria-label="Send reply"
                        >
                          <SendHorizonal className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLiked(!liked);
                      }}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
                    >
                      <Heart
                        className={`w-5 h-5 transition-all ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsShareModalOpen(true);
                      }}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Side - Unviewed Stories (Desktop Only) */}
          {!isMobile && nextStories.length > 0 && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-32 border-l border-gray-800 bg-black/50 overflow-y-auto"
            >
              <div className="p-4 space-y-3">
                {nextStories.map((story) => (
                  <motion.div
                    key={story.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.6 }}
                    whileHover={{ opacity: 1, scale: 1.05 }}
                    onClick={() => handleStoryClick(story.originalIndex)}
                    className="cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-700">
                      <img
                        src={story.mediaUrl || story.image}
                        alt={story.author?.username || story.username || 'Story'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">{story.author?.username || story.username || ''}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Share Modal */}
        <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />

        {/* Delete story confirmation - permanently removes from database */}
        <DeleteConfirmationModal
          isOpen={showDeleteStoryConfirm}
          onClose={() => setShowDeleteStoryConfirm(false)}
          onConfirm={handleDeleteStory}
          title="Delete story?"
          message="Are you sure? This action cannot be undone. The story will be permanently removed from the database."
          confirmLabel="Delete story"
          cancelLabel="Cancel"
        />
      </motion.div>
    </AnimatePresence>
  );
}