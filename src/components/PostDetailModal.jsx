import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, MoreVertical, Trash2, Flag, Pin, Reply, ChevronDown, ChevronUp } from "lucide-react";
import ShareModal from "./ShareModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ReportModal from "./ReportModal";
import commentIcon from "../assets/comment.svg";
import messageIcon from "../assets/message.svg";
import LiveProfilePhoto from "./LiveProfilePhoto";
import { getProfileVideoUrl } from "../utils/profileVideos";
import { postService } from "../services/postService";
import { useUserProfile } from "../hooks/useUserProfile";
import { toast } from "react-hot-toast";

export default function PostDetailModal({ isOpen, onClose, post, onViewUserProfile, currentUserId, onPostDeleted }) {
  const [liked, setLiked] = useState(post?.isLiked || post?.liked || false);
  const [likes, setLikes] = useState(post?.likesCount || post?.likes || 0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const commentsEndRef = useRef(null);
  const commentsContainerRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [commentMenuOpenId, setCommentMenuOpenId] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState({ type: '', id: '' });
  const [expandedReplies, setExpandedReplies] = useState({});
  const [repliesMap, setRepliesMap] = useState({});
  
  // Get current logged-in user data (for new comment display)
  const { profilePhoto: currentUserPhoto, profileVideo: currentUserVideo, username: currentUsername } = useUserProfile();
  // Backend sends userId on post; getPost also sends author.uid, feed/userPosts send author or only userId
  const postOwnerId = post?.userId || post?.user?.uid || post?.author?.uid;
  const isOwnPost = currentUserId && postOwnerId && postOwnerId === currentUserId;

  // Get post ID (handle both _id and id)
  const postId = post?.id || post?._id;

  // Post data: backend getPost returns author.{profilePhoto,username}, feed returns author.*, getUserPosts returns only userId
  const postImage = post?.imageUrl || post?.image || post?.images?.[0];
  const profileImage = post?.user?.profilePhoto || post?.author?.profilePhoto || post?.author?.avatar || post?.profileImage;
  const username = post?.user?.username || post?.author?.username || post?.username;
  const caption = post?.caption || "";

  // Fetch comments when modal opens or post changes
  useEffect(() => {
    const loadComments = async () => {
      if (!postId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await postService.getPostComments(postId);
        // Ensure we preserve the isLiked state from backend
        setComments(response.comments || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError(err.message || 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && postId) {
      loadComments();
      // Update like state from post prop - ensure we use the backend value
      setLiked(post?.isLiked || post?.liked || false);
      setLikes(post?.likesCount || post?.likes || 0);
    }
  }, [isOpen, postId, post?.isLiked, post?.liked, post?.likesCount, post?.likes]);

  const fetchComments = async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getPostComments(postId);
      setComments(response.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    if (commentsEndRef.current && commentsContainerRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  const handleLike = async () => {
    if (!postId) return;
    
    try {
      // Optimistic update
      const wasLiked = liked;
      setLiked(!liked);
      setLikes(liked ? likes - 1 : likes + 1);

      // API call
      if (wasLiked) {
        await postService.unlikePost(String(postId));
      } else {
        await postService.likePost(String(postId));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
      // Revert on error
      setLiked(!liked);
      setLikes(liked ? likes + 1 : likes - 1);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!postId) return;
    
    try {
      const comment = comments.find(c => (c._id || c.id) === commentId);
      if (!comment) return;
      
      const isLiked = comment.isLiked || comment.liked;
      const actualCommentId = comment._id || comment.id;
      
      // Optimistic update
      setComments(comments.map(c => {
        const cId = c._id || c.id;
        return cId === commentId
          ? { ...c, isLiked: !isLiked, liked: !isLiked, likesCount: isLiked ? (c.likesCount || 0) - 1 : (c.likesCount || 0) + 1, likes: isLiked ? (c.likes || 0) - 1 : (c.likes || 0) + 1 }
          : c;
      }));
      
      // Call API with actual comment ID
      if (isLiked) {
        await postService.unlikeComment(postId, actualCommentId);
      } else {
        await postService.likeComment(postId, actualCommentId);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
      // Revert on error
      fetchComments();
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !postId) return;
    
    const commentText = newComment.trim();
    setNewComment("");
    const parentId = replyingTo?.id || null;
    setReplyingTo(null);
    
    try {
      const body = { text: commentText };
      if (parentId) body.parentId = parentId;
      const response = await postService.addComment(postId, body);
      
      const raw = response?.comment ?? response?.data ?? response;
      if (raw && (raw._id || raw.id)) {
        const newCommentObj = {
          ...raw,
          content: raw.content ?? raw.text,
          user: raw.user ?? {
            uid: currentUserId,
            username: currentUsername,
            profilePhoto: currentUserPhoto,
          },
        };
        if (parentId) {
          setRepliesMap(prev => ({
            ...prev,
            [parentId]: [...(prev[parentId] || []), newCommentObj],
          }));
          setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
        } else {
          setComments(prev => [...prev, newCommentObj]);
        }
      } else {
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setNewComment(commentText);
      toast.error('Failed to add comment. Please try again.');
    }
  };

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handlePinComment = async (commentId) => {
    if (!postId) return;
    try {
      const comment = comments.find(c => (c._id || c.id) === commentId);
      if (comment?.isPinned) {
        await postService.unpinComment(postId, commentId);
      } else {
        await postService.pinComment(postId, commentId);
      }
      setCommentMenuOpenId(null);
      fetchComments();
    } catch (error) {
      console.error('Error pinning comment:', error);
      toast.error('Failed to pin comment');
    }
  };

  const handleReportPost = () => {
    setPostMenuOpen(false);
    setReportTarget({ type: 'post', id: String(postId) });
    setShowReportModal(true);
  };

  const handleReportComment = (commentId) => {
    setCommentMenuOpenId(null);
    setReportTarget({ type: 'comment', id: String(commentId) });
    setShowReportModal(true);
  };

  const toggleReplies = async (commentId) => {
    const isExpanded = expandedReplies[commentId];
    if (isExpanded) {
      setExpandedReplies(prev => ({ ...prev, [commentId]: false }));
      return;
    }
    try {
      const response = await postService.getCommentReplies(postId, commentId);
      setRepliesMap(prev => ({ ...prev, [commentId]: response.replies || [] }));
      setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (error) {
      console.error('Error loading replies:', error);
      toast.error('Failed to load replies');
    }
  };

  const handleDeletePost = async () => {
    if (!postId || isDeletingPost) return;
    try {
      setIsDeletingPost(true);
      setPostMenuOpen(false);
      await postService.deletePost(String(postId));
      if (onPostDeleted) onPostDeleted(String(postId));
      onClose();
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast.error("Failed to delete post. Please try again.");
      throw err; // rethrow so DeleteConfirmationModal stays open
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!postId || deletingCommentId) return;
    try {
      setDeletingCommentId(commentId);
      setCommentMenuOpenId(null);
      await postService.deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => (c._id || c.id) !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
      toast.error("Failed to delete comment. Please try again.");
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (!isOpen) return null;

  // Don't render if post data is missing
  if (!post || !postId) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 dark:bg-black/90 backdrop-blur-sm z-[100]"
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-0 md:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full md:h-[90vh] md:max-w-7xl bg-white dark:bg-[#0f0f0f] md:rounded-2xl overflow-hidden pointer-events-auto flex flex-col md:grid md:grid-cols-2 gap-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top-right: post menu + close */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPostMenuOpen((prev) => !prev); }}
                    className="w-8 h-8 rounded-full bg-black/80 hover:bg-black dark:bg-black/80 dark:hover:bg-black flex items-center justify-center transition-colors"
                    aria-label="Post options"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                  {postMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setPostMenuOpen(false)} aria-hidden="true" />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 top-10 z-30 min-w-[160px] rounded-xl bg-gray-900 dark:bg-gray-800 border border-gray-700 shadow-xl py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isOwnPost && (
                          <button
                            onClick={() => {
                              setPostMenuOpen(false);
                              setShowDeleteConfirm(true);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-400 hover:bg-gray-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete post
                          </button>
                        )}
                        {!isOwnPost && (
                          <button
                            onClick={handleReportPost}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-orange-400 hover:bg-gray-800 transition"
                          >
                            <Flag className="w-4 h-4" />
                            Report post
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/80 hover:bg-black dark:bg-black/80 dark:hover:bg-black flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white dark:text-white" />
                </button>
              </div>

              {/* Left Side - Post (looks exactly like PostCard) */}
              <div className="w-full h-1/2 md:h-full flex flex-col bg-gray-100 dark:bg-[#111] md:border-r border-b md:border-b-0 border-gray-300 dark:border-gray-800 overflow-hidden">
                {/* User Info Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 flex-shrink-0">
                  <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0">
                    <LiveProfilePhoto
                      imageSrc={profileImage}
                      videoSrc={getProfileVideoUrl(profileImage, username)}
                      alt="profile"
                      className="h-9 w-9 rounded-full"
                    />
                  </div>
                  <button
                    onClick={() => onViewUserProfile && onViewUserProfile(username)}
                    className="text-sm font-medium hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    {username}
                  </button>
                </div>

                {/* Post Image - Fills available space */}
                <div className="flex-1 bg-white dark:bg-black overflow-hidden flex items-center justify-center">
                  <img
                    src={postImage}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 px-4 py-3 flex-shrink-0 border-t border-gray-800">
                  <button onClick={handleLike} className="focus:outline-none">
                    <Heart
                      className={`h-6 w-6 cursor-pointer hover:scale-110 transition-all duration-200 ${liked ? "fill-red-500 text-red-500" : "text-black dark:text-white"
                        }`}
                    />
                  </button>
                  <button className="focus:outline-none">
                    <img
                      src={commentIcon}
                      alt="comment"
                      className="h-6 w-6 cursor-pointer hover:scale-110 transition-transform duration-200 invert dark:invert-0"
                    />
                  </button>
                  <button onClick={handleShareClick} className="focus:outline-none">
                    <img
                      src={messageIcon}
                      alt="share"
                      className="h-6 w-6 cursor-pointer hover:scale-110 transition-transform duration-200 invert dark:invert-0"
                    />
                  </button>
                </div>

                {/* Likes Count */}
                <div className="px-4 pb-2 flex-shrink-0">
                  <p className="text-sm font-semibold">{likes.toLocaleString()} likes</p>
                </div>

                {/* Caption */}
                {caption && (
                  <div className="px-4 pb-4 flex-shrink-0">
                    <p className="text-sm">
                      <button
                        onClick={() => onViewUserProfile && onViewUserProfile(username)}
                        className="font-semibold mr-2 hover:opacity-70 transition-opacity cursor-pointer"
                      >
                        {username}
                      </button>
                      <span className="text-gray-700 dark:text-gray-300">{caption}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side - Comments Section */}
              <div className="w-full h-1/2 md:h-full flex flex-col bg-white dark:bg-[#0f0f0f] overflow-hidden">
                {/* Comments Header */}
                <div className="flex items-center justify-between p-3 md:p-5 border-b border-gray-300 dark:border-gray-800 flex-shrink-0">
                  <h3 className="text-base md:text-xl font-semibold text-black dark:text-white">Comments</h3>
                </div>

                {/* Comments List - Scrollable with fixed height */}
                <div
                  ref={commentsContainerRef}
                  className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-5 scrollbar-hide"
                >
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      <p className="text-gray-400 text-sm mt-4">Loading comments...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                      <p className="text-red-500 text-sm mb-4">{error}</p>
                      <button
                        onClick={fetchComments}
                        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-700 transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                      <p className="text-gray-400 text-center">No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    <>
                      {comments.map((comment, index) => {
                        const commentId = comment._id || comment.id;
                        const commentContent = comment.content || comment.text;
                        const commentUsername = comment.user?.username || comment.username || comment.author?.username || comment.user?.displayName || comment.author?.displayName || 'User';
                        const commentAuthorId = comment.userId || comment.user?.uid;
                        const canDelete = currentUserId && (commentAuthorId === currentUserId || isOwnPost);
                        const isDeletingThis = deletingCommentId === commentId;
                        const replyCount = comment.replyCount || comment.repliesCount || 0;
                        const replies = repliesMap[commentId] || [];
                        const isExpanded = expandedReplies[commentId];
                        return (
                        <div key={commentId}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="flex gap-3 md:gap-4"
                        >
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-700">
                            <LiveProfilePhoto
                              imageSrc={comment.user?.profilePhoto || comment.author?.profilePhoto || comment.author?.avatar || comment.image}
                              videoSrc={getProfileVideoUrl(comment.user?.profilePhoto || comment.author?.profilePhoto || comment.image, commentUsername)}
                              alt={commentUsername}
                              className="w-9 h-9 md:w-10 md:h-10 rounded-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`rounded-2xl px-4 py-2.5 md:px-5 md:py-3 transition-colors ${comment.isPinned ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-200 dark:bg-[#1a1a1a] hover:bg-gray-300 dark:hover:bg-[#1f1f1f]'}`}>
                              {comment.isPinned && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Pin className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Pinned</span>
                                </div>
                              )}
                              <button
                                onClick={() => onViewUserProfile && commentUsername !== 'User' && onViewUserProfile(comment.user?.username || comment.username || comment.author?.username)}
                                className="font-semibold text-sm md:text-base text-black dark:text-white mb-1 hover:opacity-70 transition-opacity cursor-pointer"
                              >
                                {commentUsername}
                              </button>
                              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed break-words">
                                {commentContent}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 md:gap-5 mt-2 px-2">
                              <button
                                onClick={() => handleLikeComment(commentId)}
                                className="flex items-center gap-1.5 text-xs md:text-sm hover:scale-105 transition-transform group"
                              >
                                <Heart
                                  className={`h-4 w-4 md:h-5 md:w-5 transition-all group-hover:scale-110 ${(comment.isLiked || comment.liked) ? "fill-red-500 text-red-500" : "text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                                    }`}
                                />
                                <span
                                  className={(comment.isLiked || comment.liked) ? "text-red-500 font-semibold" : "text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"}
                                >
                                  {(comment.likesCount || comment.likes || 0) > 0 ? (comment.likesCount || comment.likes).toLocaleString() : "Like"}
                                </span>
                              </button>
                              <button
                                onClick={() => setReplyingTo({ commentId, username: commentUsername })}
                                className="flex items-center gap-1 text-xs md:text-sm text-gray-400 hover:text-primary transition-colors"
                              >
                                <Reply className="w-4 h-4" />
                                Reply
                              </button>
                              <span className="text-xs md:text-sm text-gray-500">
                                {comment.time || (comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'now')}
                              </span>
                            </div>
                            {/* Reply thread toggle */}
                            {replyCount > 0 && (
                              <button
                                onClick={() => toggleReplies(commentId)}
                                className="flex items-center gap-1 mt-2 px-2 text-xs text-primary hover:underline"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {isExpanded ? 'Hide replies' : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
                              </button>
                            )}
                          </div>
                          {/* Comment menu - show for own comments/post owner (delete) or others (report) */}
                          <div className="relative flex-shrink-0 self-start">
                            <button
                              onClick={() => setCommentMenuOpenId(commentMenuOpenId === commentId ? null : commentId)}
                              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              aria-label="Comment options"
                            >
                              <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                            {commentMenuOpenId === commentId && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setCommentMenuOpenId(null)} aria-hidden="true" />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="absolute right-0 top-8 z-30 min-w-[140px] rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 shadow-lg py-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteComment(commentId)}
                                      disabled={isDeletingThis}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      {isDeletingThis ? 'Deleting...' : 'Delete'}
                                    </button>
                                  )}
                                  {isOwnPost && !comment.isPinned && (
                                    <button
                                      onClick={() => { handlePinComment(commentId); setCommentMenuOpenId(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                    >
                                      <Pin className="w-4 h-4" />
                                      Pin comment
                                    </button>
                                  )}
                                  {isOwnPost && comment.isPinned && (
                                    <button
                                      onClick={() => { handlePinComment(commentId); setCommentMenuOpenId(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                    >
                                      <Pin className="w-4 h-4" />
                                      Unpin comment
                                    </button>
                                  )}
                                  {commentAuthorId !== currentUserId && (
                                    <button
                                      onClick={() => handleReportComment(commentId)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                    >
                                      <Flag className="w-4 h-4" />
                                      Report
                                    </button>
                                  )}
                                </motion.div>
                              </>
                            )}
                          </div>
                        </motion.div>

                        {/* Reply thread */}
                        {isExpanded && replies.length > 0 && (
                          <div className="ml-12 md:ml-14 mt-2 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                            {replies.map((reply) => {
                              const replyUsername = reply.user?.username || reply.username || reply.author?.username || 'User';
                              return (
                                <motion.div
                                  key={reply._id || reply.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex gap-2"
                                >
                                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-gray-700">
                                    <LiveProfilePhoto
                                      imageSrc={reply.user?.profilePhoto || reply.author?.profilePhoto || reply.image}
                                      videoSrc={getProfileVideoUrl(reply.user?.profilePhoto || reply.author?.profilePhoto || reply.image, replyUsername)}
                                      alt={replyUsername}
                                      className="w-7 h-7 rounded-full"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-xl px-3 py-2">
                                      <button
                                        onClick={() => onViewUserProfile && replyUsername !== 'User' && onViewUserProfile(reply.user?.username || reply.username || reply.author?.username)}
                                        className="font-semibold text-xs text-black dark:text-white hover:opacity-70 cursor-pointer"
                                      >
                                        {replyUsername}
                                      </button>
                                      <p className="text-xs text-gray-600 dark:text-gray-300 break-words">{reply.content || reply.text}</p>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1 px-1">
                                      {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : 'now'}
                                    </span>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                        </div>
                      );
                      })}
                      {/* Invisible element to scroll to */}
                      <div ref={commentsEndRef} />
                    </>
                  )}
                </div>

                {/* Comment Input */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="border-t border-gray-300 dark:border-gray-800 p-3 md:p-5 bg-white dark:bg-[#0f0f0f] flex-shrink-0"
                >
                  {replyingTo && (
                    <div className="flex items-center gap-2 mb-2 px-2 text-xs text-gray-500">
                      <Reply className="w-3 h-3" />
                      <span>Replying to <span className="font-semibold text-black dark:text-white">@{replyingTo.username}</span></span>
                      <button onClick={() => setReplyingTo(null)} className="ml-auto text-gray-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2 md:gap-4 items-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-700">
                      <LiveProfilePhoto
                        imageSrc={currentUserPhoto}
                        videoSrc={currentUserVideo}
                        alt="Your profile"
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                      />
                    </div>
                    <div className="flex-1 flex gap-2 items-center min-w-0">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendComment()}
                        placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
                        className="flex-1 min-w-0 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-full px-3 md:px-5 py-2 md:py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-500 transition-all"
                      />
                      <motion.button
                        onClick={handleSendComment}
                        disabled={!newComment.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 md:px-6 py-2 md:py-3 bg-primary hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:hover:bg-gray-700 rounded-full text-xs md:text-base font-semibold transition-colors text-white flex-shrink-0"
                      >
                        Send
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Share Modal */}
          <ShareModal 
            isOpen={isShareModalOpen} 
            onClose={() => setIsShareModalOpen(false)} 
            onViewUserProfile={onViewUserProfile}
            postId={postId}
            postUrl={postImage}
          />

          {/* Delete post confirmation - permanently removes from database */}
          <DeleteConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeletePost}
            title="Delete post?"
            message="Are you sure? This action cannot be undone. The post will be permanently removed from the database."
            confirmLabel="Delete post"
            cancelLabel="Cancel"
          />

          {/* Report Modal */}
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            targetType={reportTarget.type}
            targetId={reportTarget.id}
          />
        </>
      )}
    </AnimatePresence>
  );
}