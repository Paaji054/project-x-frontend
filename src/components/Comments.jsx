import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MoreVertical, Trash2, Flag, Reply, Pin, ChevronDown, ChevronUp } from "lucide-react";
import LiveProfilePhoto from "./LiveProfilePhoto";
import { useUserProfile } from "../hooks/useUserProfile";
import { getProfileVideoUrl } from "../utils/profileVideos";
import { formatDistanceToNow } from "date-fns";
import ReportModal from "./ReportModal";
import { postService } from "../services/postService";
import { toast } from "react-hot-toast";

export default function Comments({ isOpen, onClose, variant = "sidebar", initialComments = [], onViewUserProfile, onAddComment, onLikeComment, onDeleteComment, currentUserId, postId, postOwnerId }) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuCommentId, setOpenMenuCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [repliesMap, setRepliesMap] = useState({});
  const { profilePhoto, profileVideo, username } = useUserProfile();
  const isOwnPost = currentUserId && postOwnerId && postOwnerId === currentUserId;

  // Reset comments when modal opens/closes or initialComments changes
  useEffect(() => {
    if (isOpen) {
      setComments(initialComments);
    }
  }, [isOpen, initialComments]);

  const handleLikeComment = async (commentId) => {
    if (onLikeComment) {
      try {
        // Optimistic update - find the comment and toggle its like state
        setComments(prevComments => prevComments.map(comment => {
          const cId = comment._id || comment.id;
          if (cId === commentId) {
            const currentlyLiked = comment.isLiked || comment.liked || false;
            return {
              ...comment,
              isLiked: !currentlyLiked,
              liked: !currentlyLiked,
              likesCount: currentlyLiked ? Math.max(0, (comment.likesCount || 0) - 1) : (comment.likesCount || 0) + 1,
              likes: currentlyLiked ? Math.max(0, (comment.likes || 0) - 1) : (comment.likes || 0) + 1
            };
          }
          return comment;
        }));

        await onLikeComment(commentId);
        // The parent will update initialComments which triggers useEffect
      } catch (error) {
        console.error('Error liking comment:', error);
        toast.error('Failed to like comment');
        // Revert on error - restore from initialComments
        setComments(initialComments);
      }
    } else {
      // Fallback to local state
      setComments(comments.map(comment => {
        const cId = comment._id || comment.id;
        if (cId === commentId) {
          const currentlyLiked = comment.isLiked || comment.liked || false;
          return {
            ...comment,
            isLiked: !currentlyLiked,
            liked: !currentlyLiked,
            likesCount: currentlyLiked ? Math.max(0, (comment.likesCount || 0) - 1) : (comment.likesCount || 0) + 1,
            likes: currentlyLiked ? Math.max(0, (comment.likes || 0) - 1) : (comment.likes || 0) + 1
          };
        }
        return comment;
      }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!onDeleteComment || !postId || deletingCommentId) return;
    try {
      setDeletingCommentId(commentId);
      setOpenMenuCommentId(null);
      await onDeleteComment(commentId);
      setComments((prev) => prev.filter((c) => (c._id || c.id) !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment. Please try again.");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const toggleReplies = async (commentId) => {
    if (expandedReplies[commentId]) {
      setExpandedReplies(prev => ({ ...prev, [commentId]: false }));
      return;
    }
    try {
      const res = await postService.getCommentReplies(postId, commentId);
      setRepliesMap(prev => ({ ...prev, [commentId]: res.replies || [] }));
      setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (err) {
      console.error('Error loading replies:', err);
      toast.error('Failed to load replies');
    }
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
      setComments(prev => prev.map(c => ({
        ...c,
        isPinned: (c._id || c.id) === commentId ? !c.isPinned : false
      })));
      setOpenMenuCommentId(null);
    } catch (err) {
      console.error('Error pinning comment:', err);
      toast.error('Failed to pin comment');
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    const commentText = newComment.trim();
    setNewComment("");
    setIsSubmitting(true);

    try {
      if (onAddComment) {
        const addedComment = await onAddComment(commentText, replyingTo?.commentId || null);
        if (addedComment) {
          const toAdd = addedComment.user?.username || addedComment.username
            ? addedComment
            : { ...addedComment, content: addedComment.content ?? addedComment.text, username, user: { uid: currentUserId, username, profilePhoto } };
          if (replyingTo) {
            setRepliesMap(prev => ({
              ...prev,
              [replyingTo.commentId]: [...(prev[replyingTo.commentId] || []), toAdd]
            }));
            setExpandedReplies(prev => ({ ...prev, [replyingTo.commentId]: true }));
            setReplyingTo(null);
          } else {
            setComments(prev => [...prev, toAdd]);
          }
        }
      } else {
        // Fallback to local state if no callback provided
        const newCommentObj = {
          id: Date.now(),
          username: username,
          text: commentText,
          content: commentText,
          likes: 0,
          likesCount: 0,
          liked: false,
          isLiked: false,
          image: profilePhoto,
          user: {
            username: username,
            profilePhoto: profilePhoto
          },
          createdAt: new Date().toISOString()
        };
        setComments([...comments, newCommentObj]);
      }
    } catch (err) {
      console.error("Error sending comment:", err);
      // Restore the comment text on error
      setNewComment(commentText);
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => (
    <>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex items-center justify-between p-4 md:p-5 border-b border-black dark:border-gray-800 flex-shrink-0 bg-white dark:bg-[#0f0f0f]"
      >
        <h3 className="text-lg md:text-xl font-semibold dark:text-white text-black">Comments</h3>
        <button
          onClick={onClose}
          className="dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-black transition-colors p-1 dark:hover:bg-gray-800 hover:bg-gray-200 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 md:space-y-5 scrollbar-hide">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <p className="dark:text-gray-400 text-gray-600 text-center">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment, index) => {
              const commentId = comment._id || comment.id;
              const commentContent = comment.content || comment.text;
              const commentUser = comment.user?.username || comment.username || comment.author?.username || comment.user?.displayName || comment.author?.displayName || 'User';
              const commentImage = comment.user?.profilePhoto || comment.author?.profilePhoto || comment.author?.avatar || comment.image;
              const commentLikes = comment.likesCount || comment.likes || 0;
              const isCommentLiked = comment.isLiked || comment.liked;
              const commentAuthorId = comment.userId || comment.user?.uid;
              const canDeleteComment = currentUserId && (commentAuthorId === currentUserId || isOwnPost) && onDeleteComment && postId;
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
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0 border dark:border-gray-700 border-gray-300">
                  <LiveProfilePhoto
                    imageSrc={commentImage}
                    videoSrc={getProfileVideoUrl(commentImage, commentUser)}
                    alt={commentUser}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`rounded-2xl px-4 py-2.5 md:px-5 md:py-3 transition-colors ${comment.isPinned ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#1f1f1f]'}`}>
                    {comment.isPinned && (
                      <div className="flex items-center gap-1 mb-1">
                        <Pin className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Pinned</span>
                      </div>
                    )}
                    <button
                      onClick={() => onViewUserProfile && onViewUserProfile(commentUser)}
                      className="font-semibold text-sm md:text-base dark:text-white text-black mb-1 hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      {commentUser}
                    </button>
                    <p className="text-sm md:text-base dark:text-gray-300 text-gray-700 leading-relaxed break-words">{commentContent}</p>
                  </div>
                  <div className="flex items-center gap-4 md:gap-5 mt-2 px-2">
                    <button
                      onClick={() => handleLikeComment(commentId)}
                      className="flex items-center gap-1.5 text-xs md:text-sm hover:scale-105 transition-transform group"
                    >
                      <Heart
                        className={`h-4 w-4 md:h-5 md:w-5 transition-all group-hover:scale-110 ${isCommentLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-gray-300'
                          }`}
                      />
                      <span className={isCommentLiked ? 'text-red-500 font-semibold' : 'text-gray-400 group-hover:text-gray-300'}>
                        {commentLikes > 0 ? commentLikes.toLocaleString() : 'Like'}
                      </span>
                    </button>
                    <button
                      onClick={() => setReplyingTo({ commentId, username: commentUser })}
                      className="flex items-center gap-1 text-xs md:text-sm text-gray-400 hover:text-primary transition-colors"
                    >
                      <Reply className="w-4 h-4" />
                      Reply
                    </button>
                    <span className="text-xs md:text-sm text-gray-500">
                      {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
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
                <div className="relative flex-shrink-0 self-start">
                  <button
                    onClick={() => setOpenMenuCommentId(openMenuCommentId === commentId ? null : commentId)}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Comment options"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                  {openMenuCommentId === commentId && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuCommentId(null)} aria-hidden="true" />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 top-8 z-20 min-w-[140px] rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 shadow-lg py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canDeleteComment && (
                          <button
                            onClick={() => handleDeleteComment(commentId)}
                            disabled={isDeletingThis}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            {isDeletingThis ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                        {isOwnPost && (
                          <button
                            onClick={() => handlePinComment(commentId)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <Pin className="w-4 h-4" />
                            {comment.isPinned ? 'Unpin comment' : 'Pin comment'}
                          </button>
                        )}
                        {commentAuthorId !== currentUserId && (
                          <button
                            onClick={() => { setReportTargetId(commentId); setShowReportModal(true); setOpenMenuCommentId(null); }}
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
          </AnimatePresence>
        )}
      </div>

      {/* Comment Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="border-t border-gray-200 dark:border-gray-800 p-3 md:p-5 bg-white dark:bg-[#0f0f0f] flex-shrink-0"
      >
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 px-2 text-xs text-gray-500">
            <Reply className="w-3 h-3" />
            <span>Replying to <span className="font-semibold text-black dark:text-white">@{replyingTo.username}</span></span>
            <button onClick={() => setReplyingTo(null)} className="ml-auto text-gray-400 hover:text-red-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="flex gap-2 md:gap-4 items-center">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0 border dark:border-gray-700 border-gray-300">
            <LiveProfilePhoto
              imageSrc={profilePhoto}
              videoSrc={profileVideo}
              alt="Your profile"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full"
            />
          </div>
          <div className="flex-1 flex gap-2 items-center min-w-0">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
              className="flex-1 min-w-0 bg-gray-100 dark:bg-[#1a1a1a] border dark:border-gray-700 border-gray-300 dark:text-white text-black rounded-full px-3 md:px-5 py-2 md:py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:placeholder-gray-500 placeholder-gray-400 transition-all"
            />
            <motion.button
              onClick={handleSendComment}
              disabled={!newComment.trim() || isSubmitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 md:px-6 py-2 md:py-3 bg-primary hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:hover:bg-gray-700 disabled:opacity-50 rounded-full text-xs md:text-base font-semibold transition-colors text-white flex-shrink-0"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Send"
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="comment"
        targetId={reportTargetId}
      />
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for mobile and desktop (when variant is overlay) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[55] ${variant === "sidebar" ? "md:hidden" : ""}`}
            onClick={onClose}
          />

          {/* Comments Panel - Mobile: Slide from bottom (Instagram style) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            className="md:hidden fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-[#0f0f0f] border-t border-gray-200 dark:border-gray-800 rounded-t-3xl flex flex-col z-[60] shadow-2xl"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 dark:bg-gray-600 bg-gray-400 rounded-full"></div>
            </div>
            {renderContent()}
          </motion.div>

          {/* Comments Panel - Desktop Sidebar: Fade in with scale (only for sidebar variant) */}
          {variant === "sidebar" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 250,
                mass: 0.6
              }}
              className="hidden md:flex relative h-auto max-h-[calc(100vh-6rem)] w-full min-w-[400px] max-w-[450px] bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-xl flex-col z-auto shadow-2xl"
            >
              {renderContent()}
            </motion.div>
          )}

          {/* Comments Panel - Desktop Overlay: Centered modal (only for overlay variant) */}
          {variant === "overlay" && (
            <div className="hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  mass: 0.8
                }}
                className="w-full max-w-[500px] h-auto max-h-[85vh] bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col shadow-2xl pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {renderContent()}
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}