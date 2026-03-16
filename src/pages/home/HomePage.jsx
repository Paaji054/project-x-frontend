import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Stories from "../../components/Stories";
import PostCard from "../../components/PostCard";
import PostDetailModal from "../../components/PostDetailModal";
import Comments from "../../components/Comments";
import { postService } from "../../services";
import { toast } from "react-hot-toast";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useAuth } from "../../context/AuthContext";

export default function HomePage({ onViewUserProfile }) {
  const navigate = useNavigate();
  const { username: currentUsername } = useUserProfile();
  const { user } = useAuth();
  const currentUserId = user?.uid || user?.id || user?._id;
  const [activePostId, setActivePostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
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

  const handleAddStory = () => {
    navigate('/story/add');
  };

  const handleDeletePost = (postId) => {
    const idStr = postId != null ? String(postId) : '';
    if (!idStr) return;
    setPosts((prev) => prev.filter((p) => String(p.id || p._id) !== idStr));
    setSelectedPost(null);
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
                onClick={() => setSelectedPost(post)}
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
              onDeleteComment={handleDeleteComment}
              currentUserId={currentUserId}
            postId={activePostId}
            commentsDisabled={activePostId ? !!posts.find(p => String(p.id || p._id) === String(activePostId))?.turnOffCommenting : false}
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
              onDeleteComment={handleDeleteComment}
              currentUserId={currentUserId}
            postId={activePostId}
            commentsDisabled={activePostId ? !!posts.find(p => String(p.id || p._id) === String(activePostId))?.turnOffCommenting : false}
            />
          </div>
        </div>
      </div>

      <PostDetailModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        post={selectedPost}
        onViewUserProfile={onViewUserProfile}
        currentUserId={currentUserId}
        onPostDeleted={handleDeletePost}
      />
    </main>
  );
}