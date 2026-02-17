import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Send } from "lucide-react";
import ShareModal from "./ShareModal";

export default function StoryViewer({ stories, initialIndex, onClose, onStoryViewed }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [viewedStories, setViewedStories] = useState(new Set([initialIndex]));
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isPaused, setIsPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const progressIntervalRef = useRef(null);
  const handleNextRef = useRef(null);
  const handlePrevRef = useRef(null);

  const currentStory = stories[currentStoryIndex];

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowRight" && handleNextRef.current) handleNextRef.current();
      if (e.key === "ArrowLeft" && handlePrevRef.current) handlePrevRef.current();
      if (e.key === "Escape") onClose();
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
                        alt={story.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">{story.username}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Center - Current Story */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>

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
                  <img
                    src={currentStory.mediaUrl || currentStory.image}
                    alt={currentStory.username}
                    className="w-full h-full object-cover select-none"
                    draggable="false"
                    loading="eager"
                    decoding="async"
                  />

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
                        src={currentStory.author?.avatar || currentStory.user?.profilePhoto || currentStory.mediaUrl || currentStory.image}
                        alt={currentStory.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{currentStory.username}</p>
                      <p className="text-gray-300 text-xs">
                        {getRelativeTime(currentStory.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Interaction Buttons */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 md:gap-4 z-10">
                    <input
                      type="text"
                      placeholder={`Reply to ${currentStory.username}...`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-full px-3 md:px-4 py-2 text-sm md:text-base text-white placeholder-gray-400 focus:outline-none focus:border-white"
                    />
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
                        alt={story.username}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">{story.username}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Share Modal */}
        <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      </motion.div>
    </AnimatePresence>
  );
}