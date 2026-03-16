/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PostCard from "../../components/PostCard";
import PostDetailModal from "../../components/PostDetailModal";
import Filters from "../../components/Filters";
import Accounts from "../../components/Accounts";
import Comments from "../../components/Comments";
import { searchService, postService } from "../../services";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function ExplorePage({ onViewUserProfile }) {
  const { user } = useAuth();
  const currentUserId = user?.uid || user?.id || user?._id;
  const [activeTab, setActiveTab] = useState("Posts");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activePostId, setActivePostId] = useState(null);
  const [postsComments, setPostsComments] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // API state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch trending or AI posts on mount and when category changes
  useEffect(() => {
    if (isAIEnabled) {
      fetchAIPosts();
    } else {
      fetchTrendingPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAIEnabled, selectedCategory]);

  // Search when query changes
  useEffect(() => {
    if (searchQuery) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory]);

  const fetchTrendingPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Request a larger set so Explore shows a full catalog across categories (not just one)
      const trendingPosts = await postService.getTrending(40, 1);
      let allPosts = trendingPosts.posts || [];
      // Apply category filter only when user selects one; default shows all
      if (selectedCategory) {
        allPosts = allPosts.filter(post => post.category === selectedCategory);
      }
      setPosts(allPosts);
    } catch (err) {
      console.error("Error fetching trending posts:", err);
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAIPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const aiPosts = await searchService.getAIPosts();
      let allPosts = aiPosts.posts || [];
      // Apply category filter if selected
      if (selectedCategory) {
        allPosts = allPosts.filter(post => post.category === selectedCategory);
      }
      setPosts(allPosts);
    } catch (err) {
      console.error("Error fetching AI posts:", err);
      setError(err.message || "Failed to load AI posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await searchService.search(
        searchQuery,
        activeTab.toLowerCase(),
        1,
        20
      );
      
      if (activeTab === "Posts") {
        // Backend returns { results: { posts: [...] } }
        let allPosts = response.results?.posts || response.posts || [];
        // Apply category filter if selected
        if (selectedCategory) {
          allPosts = allPosts.filter(post => post.category === selectedCategory);
        }
        setPosts(allPosts);
      }
    } catch (err) {
      console.error("Error searching:", err);
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentClick = async (postId) => {
    // Fetch comments if not already loaded
    if (!postsComments[postId]) {
      try {
        const response = await postService.getPostComments(postId);
        setPostsComments((prev) => ({
          ...prev,
          [postId]: response.comments || []
        }));
      } catch (err) {
        console.error("Error fetching comments:", err);
        toast.error("Failed to load comments");
        setPostsComments((prev) => ({
          ...prev,
          [postId]: []
        }));
      }
    }
    setActivePostId(postId);
  };

  const handleCloseComments = () => {
    setActivePostId(null);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  const handleClosePostModal = () => {
    setIsPostModalOpen(false);
    setSelectedPost(null);
  };

  const handleAddComment = async (commentText, parentId = null) => {
    if (!activePostId || !commentText.trim()) return;

    try {
      const response = await postService.addComment(activePostId, {
        text: commentText,
        content: commentText,
        ...(parentId ? { parentId } : {}),
      });

      const newComment = response.comment || response.data || response;

      // Only add to top-level list if it's not a reply to another comment
      if (!parentId) {
        setPostsComments((prev) => ({
          ...prev,
          [activePostId]: [...(prev[activePostId] || []), newComment]
        }));
        // Increment comment count on the post card
        setPosts(prev => prev.map(p =>
          String(p.id || p._id) === String(activePostId)
            ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
            : p
        ));
      }

      return newComment;
    } catch (err) {
      console.error("Error adding comment:", err);
      throw err;
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!activePostId) return;

    try {
      const comment = postsComments[activePostId]?.find(c => (c._id || c.id) === commentId);
      if (!comment) return;

      const isLiked = comment.isLiked || comment.liked;
      const actualCommentId = comment._id || comment.id;

      // Optimistic update
      setPostsComments((prev) => ({
        ...prev,
        [activePostId]: prev[activePostId].map(c => {
          const cId = c._id || c.id;
          return cId === commentId
            ? { 
                ...c, 
                isLiked: !isLiked, 
                liked: !isLiked, 
                likesCount: isLiked ? (c.likesCount || 0) - 1 : (c.likesCount || 0) + 1,
                likes: isLiked ? (c.likes || 0) - 1 : (c.likes || 0) + 1 
              }
            : c;
        })
      }));

      // Call API
      if (isLiked) {
        await postService.unlikeComment(activePostId, actualCommentId);
      } else {
        await postService.likeComment(activePostId, actualCommentId);
      }
    } catch (err) {
      console.error("Error liking comment:", err);
      toast.error("Failed to like comment");
      // Revert on error - refetch comments
      try {
        const response = await postService.getPostComments(activePostId);
        setPostsComments((prev) => ({
          ...prev,
          [activePostId]: response.comments || []
        }));
      } catch (refetchErr) {
        console.error("Error refetching comments:", refetchErr);
        toast.error("Failed to refresh comments");
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!activePostId) return;
    try {
      await postService.deleteComment(activePostId, commentId);
      setPostsComments((prev) => ({
        ...prev,
        [activePostId]: (prev[activePostId] || []).filter((c) => (c._id || c.id) !== commentId)
      }));
      // Decrement comment count on the post card
      setPosts(prev => prev.map(p =>
        String(p.id || p._id) === String(activePostId)
          ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }
          : p
      ));
    } catch (err) {
      console.error("Error deleting comment:", err);
      throw err;
    }
  };

  const categories = [
    "Memes",
    "Entertainment",
    "Social Media",
    "Technology",
    "Gaming",
    "Sports",
    "Music",
    "Art",
  ];

  // Handle Enter key press
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchTerm);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 h-[calc(100vh-7.5rem)] md:h-[calc(100vh-4rem)] bg-white dark:bg-black">
      {/* Filters */}
      <div onKeyPress={handleSearchKeyPress}>
        <Filters
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isAIEnabled={isAIEnabled}
          setIsAIEnabled={setIsAIEnabled}
        />
      </div>

      {/* Categories Section - Only show for Posts tab */}
      {activeTab === "Posts" && (
        <div className="max-w-7xl mx-auto mb-6 md:mb-8">
          {/* Categories Title */}
          <div className="mb-4 md:mb-5">
            <h2 className="text-xl md:text-2xl font-semibold text-primary mb-2">
              Categories
            </h2>
            <div className="h-0.5 w-16 md:w-20 bg-primary rounded-full"></div>
          </div>

          {/* Categories Grid */}
          <div className="flex flex-wrap gap-3 md:gap-4">
            {categories.map((category, index) => {
              const isSelected = selectedCategory === category;
              return (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(isSelected ? null : category)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-4 md:px-6 py-2 md:py-3 rounded-xl
                    text-sm md:text-base font-medium
                    transition-all duration-200
                    ${isSelected
                      ? "bg-primary text-white shadow-lg shadow-primary/50"
                      : "bg-gray-100 dark:bg-[#1a1a1a] text-black dark:text-white border border-black dark:border-gray-700 hover:border-primary/50 hover:bg-gray-200 dark:hover:bg-[#222]"
                    }
                  `}
                >
                  {category}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conditional Rendering */}
      {activeTab === "Posts" && (
        <>
          {searchQuery && (
            <h2 className="text-lg md:text-xl font-semibold mb-5 text-black dark:text-white max-w-7xl mx-auto">
              Results for <span className="text-gray-600 dark:text-gray-300">"{searchQuery}"</span>
            </h2>
          )}
          
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="max-w-7xl mx-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 max-w-7xl mx-auto">
              <p>No posts found</p>
              <p className="text-sm mt-2">Try a different search or category</p>
            </div>
          )}

          <div
            className="
              grid 
              gap-4 md:gap-8
              grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
              max-w-7xl
              mx-auto
            "
          >
            {posts.map((post) => (
              <PostCard
                key={post.id || post._id}
                post={post}
                postId={post.id || post._id}
                onCommentClick={handleCommentClick}
                isActive={activePostId === (post.id || post._id)}
                onViewUserProfile={onViewUserProfile}
                onClick={() => handlePostClick(post)}
              />
            ))}
          </div>

          {/* Comments Section - Overlay for both mobile and desktop */}
          <Comments
            isOpen={activePostId !== null}
            onClose={handleCloseComments}
            variant="overlay"
            initialComments={activePostId !== null ? (postsComments[activePostId] || []) : []}
            onViewUserProfile={onViewUserProfile}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
            currentUserId={currentUserId}
            postId={activePostId}
            commentsDisabled={activePostId ? !!posts.find(p => String(p.id || p._id) === String(activePostId))?.turnOffCommenting : false}
          />
        </>
      )}

      {activeTab === "Accounts" && (
        <Accounts searchQuery={searchQuery} hasSearched={searchQuery !== ""} />
      )}

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={isPostModalOpen}
        onClose={handleClosePostModal}
        post={selectedPost}
        onViewUserProfile={onViewUserProfile}
        currentUserId={currentUserId}
        onPostDeleted={(deletedPostId) => {
          const idStr = deletedPostId != null ? String(deletedPostId) : '';
          if (idStr) setPosts((prev) => prev.filter((p) => String(p._id || p.id) !== idStr));
          handleClosePostModal();
        }}
      />
    </main>
  );
}