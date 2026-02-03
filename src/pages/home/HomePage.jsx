import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Stories from "../../components/Stories";
import PostCard from "../../components/PostCard";
import Comments from "../../components/Comments";
import { postService } from "../../services";
import { useUserProfile } from "../../hooks/useUserProfile";

export default function HomePage({ onViewUserProfile }) {
  const navigate = useNavigate();
  const { username: currentUsername } = useUserProfile();
  const [activePostId, setActivePostId] = useState(null);
  const [postsComments, setPostsComments] = useState({});

  // Feed state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDocId, setLastDocId] = useState(null);
  const loadingRef = useRef(null);

  // Fetch initial posts
  useEffect(() => {
    fetchPosts();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchPosts();
        }
      },
      { threshold: 0.5 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, lastDocId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { limit: 10 };
      if (lastDocId) {
        params.lastDocId = lastDocId;
      }

      const response = await postService.getFeed(params);

      if (response.posts && response.posts.length > 0) {
        setPosts((prev) => [...prev, ...response.posts]);
        setLastDocId(response.lastDocId);
        setHasMore(response.hasMore || false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching feed:", err);
      setError(err.message || "Failed to load posts");
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

  const handleAddComment = async (commentText) => {
    if (!activePostId || !commentText.trim()) return;

    try {
      const response = await postService.addComment(activePostId, { 
        text: commentText,
        content: commentText 
      });

      const newComment = response.comment || response.data || response;

      // Update local state with the new comment
      setPostsComments((prev) => ({
        ...prev,
        [activePostId]: [...(prev[activePostId] || []), newComment]
      }));

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
      // Revert on error - refetch comments
      try {
        const response = await postService.getPostComments(activePostId);
        setPostsComments((prev) => ({
          ...prev,
          [activePostId]: response.comments || []
        }));
      } catch (refetchErr) {
        console.error("Error refetching comments:", refetchErr);
      }
    }
  };

  const handleAddStory = () => {
    navigate('/story/add');
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => (p.id || p._id) !== postId));
  };

  return (
    <main className="flex-1 overflow-y-auto h-[calc(100vh-7.5rem)] md:h-[calc(100vh-4rem)] bg-white dark:bg-black">
      <div className="p-4 md:p-8">
        {/* Stories Section - Centered */}
        <div className="w-full flex justify-center mb-6">
          <Stories onAddStory={handleAddStory} />
        </div>

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={() => {
                setPosts([]);
                setLastDocId(null);
                setHasMore(true);
                fetchPosts();
              }}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Posts Section with Comments */}
        <div className={`max-w-2xl mx-auto transition-all duration-300 ${activePostId !== null ? 'md:max-w-none md:grid md:grid-cols-2 md:gap-6' : ''}`}>
          {/* Posts Container */}
          <div className="space-y-6">
            {posts.map((post, index) => (
              <PostCard
                key={`${post.id || post._id}-${index}`}
                post={post}
                postId={post.id || post._id}
                variant="feed"
                onCommentClick={handleCommentClick}
                isActive={activePostId === (post.id || post._id)}
                onViewUserProfile={onViewUserProfile}
                onDelete={handleDeletePost}
                currentUsername={currentUsername}
              />
            ))}


            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Load More Trigger */}
            {hasMore && !loading && (
              <div ref={loadingRef} className="h-10" />
            )}

            {/* No More Posts */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && posts.length === 0 && !error && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-2">No posts yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Follow some users to see their posts here</p>
              </div>
            )}
          </div>

          {/* Comments Section - Desktop only, side by side */}
          <div className="hidden md:block sticky top-0 h-fit">
            <Comments
              isOpen={activePostId !== null}
              onClose={handleCloseComments}
              initialComments={activePostId !== null ? (postsComments[activePostId] || []) : []}
              onViewUserProfile={onViewUserProfile}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
            />
          </div>

          {/* Comments Section - Mobile only, overlay */}
          <div className="md:hidden">
            <Comments
              isOpen={activePostId !== null}
              onClose={handleCloseComments}
              initialComments={activePostId !== null ? (postsComments[activePostId] || []) : []}
              onViewUserProfile={onViewUserProfile}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
            />
          </div>
        </div>
      </div>
    </main>
  );
}