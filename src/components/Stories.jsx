import React, { useRef, useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import StoryViewer from "./StoryViewer";
import LiveProfilePhoto from "./LiveProfilePhoto";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuth } from "../context/AuthContext";
import { storyService } from "../services/storyService";

export default function Stories({ onAddStory }) {
  const scrollContainerRef = useRef(null);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [viewingOwnStory, setViewingOwnStory] = useState(false);
  const [viewedStoryIds, setViewedStoryIds] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profilePhoto, profileVideo } = useUserProfile();
  const { user } = useAuth();
  const currentUserId = user?.uid || user?.id || user?._id;

  // Fetch stories on mount
  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const data = await storyService.getStories();
      const normalizedStories = (data || []).map(story => ({
        ...story,
        id: story._id || story.id,
        image: story.mediaUrl || story.image,
      }));
      setStories(normalizedStories);
      // Seed viewed IDs from backend so view state persists across refresh
      const viewedIds = (data || []).filter(s => s.viewed === true).map(s => s._id || s.id);
      setViewedStoryIds(prev => [...new Set([...prev, ...viewedIds])]);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get ring style based on creator tier
  const getRingStyle = (tier, isViewed) => {
    if (!tier || tier === "normal") {
      // Default ring style for normal users
      return isViewed
        ? "bg-gray-600"
        : "bg-gradient-to-tr from-primary-400 via-primary to-primary-700";
    }

    // Special creator tier rings
    const tierStyles = {
      gold: isViewed
        ? "bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 opacity-60"
        : "bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
      silver: isViewed
        ? "bg-gradient-to-tr from-gray-500 via-gray-300 to-gray-400 opacity-60"
        : "bg-gradient-to-tr from-gray-300 via-silver-200 to-gray-500 shadow-[0_0_8px_rgba(156,163,175,0.6)]",
      ruby: isViewed
        ? "bg-gradient-to-tr from-red-700 via-pink-600 to-red-500 opacity-60"
        : "bg-gradient-to-tr from-red-500 via-pink-500 to-red-700 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
      emerald: isViewed
        ? "bg-gradient-to-tr from-emerald-700 via-green-500 to-emerald-500 opacity-60"
        : "bg-gradient-to-tr from-emerald-400 via-green-400 to-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    };

    return tierStyles[tier] || tierStyles.gold;
  };

  // Sort stories: unseen first, then by createdAt desc
  const sortedStories = [...stories].sort((a, b) => {
    const aSeen = viewedStoryIds.includes(a.id);
    const bSeen = viewedStoryIds.includes(b.id);
    if (aSeen !== bSeen) return aSeen ? 1 : -1;
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  // For the current user, avoid showing their story twice:
  // the "Your Story" tile on the left is enough.
  const visibleStories = sortedStories.filter((story) => {
    const ownerId = story.userId || story.author?.uid;
    if (!currentUserId) return true;
    return ownerId !== currentUserId;
  });

  // Current user's own stories — used when viewing own story ring
  const myStories = sortedStories.filter((story) => {
    const ownerId = story.userId || story.author?.uid;
    return currentUserId && ownerId === currentUserId;
  });

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      setShowLeftArrow(scrollLeft > 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener("scroll", checkScrollPosition);

      // Also check on resize to handle responsive changes
      const handleResize = () => {
        setTimeout(checkScrollPosition, 100);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleStoryClick = (index, storyId) => {
    setViewedStoryIds((prev) =>
      prev.includes(storyId) ? prev : [...prev, storyId]
    );
    setSelectedStoryIndex(index);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative bg-white dark:bg-black border border-black dark:border-gray-800 hover:border-primary transition-colors duration-300 rounded-xl py-3 md:py-4 px-3 sm:px-4 md:px-6">
        {/* Left Arrow - Show when scrolled */}
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black dark:border-gray-700 hover:border-primary flex items-center justify-center hover:bg-white/90 dark:hover:bg-black/90 transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 dark:text-white text-black rotate-180" />
          </motion.button>
        )}

        {/* Stories Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Add Story / View Own Story - Instagram Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-1 md:gap-2 flex-shrink-0 py-1"
          >
            <div
              className="relative w-14 h-14 md:w-16 md:h-16 cursor-pointer group"
              onClick={() => {
                if (myStories.length > 0) setViewingOwnStory(true);
                else onAddStory();
              }}
            >
              {/* Story ring if user has stories, plain border otherwise */}
              <div className={`w-full h-full rounded-full overflow-hidden ${
                myStories.length > 0
                  ? 'p-[2.5px] bg-gradient-to-tr from-primary-400 via-primary to-primary-700'
                  : 'border-2 border-black dark:border-gray-700'
              }`}>
                <div className={`w-full h-full rounded-full overflow-hidden ${myStories.length > 0 ? 'border-2 border-white dark:border-black' : ''}`}>
                  <LiveProfilePhoto
                    imageSrc={profilePhoto}
                    videoSrc={profileVideo}
                    alt="Your story"
                    className="w-full h-full rounded-full"
                  />
                </div>
              </div>

              {/* Plus Icon — always opens AddStory */}
              <div
                className="absolute bottom-0 right-0 w-5 h-5 md:w-6 md:h-6 bg-primary rounded-full border-2 dark:border-black border-white flex items-center justify-center hover:bg-primary-700 transition-all duration-200 hover:scale-110 z-10"
                onClick={(e) => { e.stopPropagation(); onAddStory(); }}
                title="Add to story"
              >
                <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <span className="text-xs dark:text-gray-400 text-gray-600 whitespace-nowrap">Your Story</span>
          </motion.div>

          {/* Story Items */}
          {loading && (
            <div className="flex items-center justify-center py-4 px-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
          {!loading && visibleStories.map((story, index) => {
            const isLastStory = index === visibleStories.length - 1;
            const shouldShowArrow = isLastStory && showRightArrow;
            const originalIndex = stories.findIndex((s) => (s._id || s.id) === (story._id || story.id));
            const storyId = story._id || story.id;
            const storyUsername = story.author?.username || story.user?.username || story.username;
            const storyImage = story.author?.avatar || story.user?.profilePhoto || story.image;
            const storyTier = story.author?.tier || story.user?.tier || story.creatorTier;

            return (
              <motion.div
                key={storyId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className="flex flex-col items-center gap-1 md:gap-2 flex-shrink-0"
              >
                <div className="relative group py-1">
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full p-[2.5px] cursor-pointer hover:scale-105 transition-transform duration-200 ${getRingStyle(storyTier, viewedStoryIds.includes(storyId))}`}
                    onClick={() => handleStoryClick(originalIndex, storyId)}
                  >
                    <div className="w-full h-full rounded-full border-2 border-white dark:border-black overflow-hidden relative">
                      <img
                        src={storyImage}
                        alt={storyUsername}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      {/* Arrow Overlay on last story when more content available */}
                      {shouldShowArrow && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-end pr-0.5 md:pr-1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                            <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 text-black" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs dark:text-white text-black max-w-[70px] md:max-w-[80px] truncate text-center">
                  {storyUsername}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Right Arrow Button - Always visible when more content */}
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black dark:border-gray-700 hover:border-primary flex items-center justify-center hover:bg-white/90 dark:hover:bg-black/90 transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 dark:text-white text-black" />
          </motion.button>
        )}
      </div>

      {/* Story Viewer — own stories */}
      {viewingOwnStory && myStories.length > 0 && (
        <StoryViewer
          stories={myStories}
          initialIndex={0}
          onClose={() => setViewingOwnStory(false)}
          onStoryViewed={() => {}}
          currentUserId={currentUserId}
          onStoryDeleted={(deletedStoryId) => {
            setStories((prev) => prev.filter((s) => (s._id || s.id) !== deletedStoryId));
            if (myStories.length <= 1) setViewingOwnStory(false);
          }}
        />
      )}

      {/* Story Viewer — other users' stories */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
          onStoryViewed={(storyId) => {
            setViewedStoryIds((prev) =>
              prev.includes(storyId) ? prev : [...prev, storyId]
            );
            storyService.markViewed(storyId).catch(() => {});
          }}
          currentUserId={currentUserId}
          onStoryDeleted={(deletedStoryId) => {
            setStories((prev) => prev.filter((s) => (s._id || s.id) !== deletedStoryId));
            setSelectedStoryIndex(null);
          }}
        />
      )}
    </div>
  );
}