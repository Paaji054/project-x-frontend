import React, { useState, useEffect } from "react";
import { Heart, Trash2 } from "lucide-react";
import ShareModal from "./ShareModal";
import commentIcon from "../assets/comment.svg";
import messageIcon from "../assets/message.svg";
import LiveProfilePhoto from "./LiveProfilePhoto";
import { getProfileVideoUrl } from "../utils/profileVideos";
import { postService } from "../services";

export default function PostCard({ 
  variant = "grid", 
  post, 
  postId, 
  onCommentClick, 
  isActive, 
  onViewUserProfile,
  onDelete,
  currentUsername
}) {
  // Use post data if provided, otherwise fallback to defaults
  const postData = post || {};
  const author = postData.author || postData.user || {};
  
  const [liked, setLiked] = useState(postData.isLiked || postData.liked || false);
  const [likes, setLikes] = useState(postData.likesCount || postData.likes || 0);
  
  // Update liked state when post data changes (e.g., after relogin)
  useEffect(() => {
    setLiked(postData.isLiked || postData.liked || false);
    setLikes(postData.likesCount || postData.likes || 0);
  }, [postData.isLiked, postData.liked, postData.likesCount, postData.likes]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const postImage = postData.imageUrl || postData.image || postData.images?.[0];
  const profileImage = author.profilePhoto || author.profilePicture || postData.profileImage;
  const username = author.username || postData.username;
  const caption = postData.caption || postData.content || "";

  const handleLike = async () => {
    const previousLiked = liked;
    const previousLikes = likes;

    // Optimistic update
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    try {
      const id = postData._id || postId;
      
      if (liked) {
        await postService.unlikePost(id);
      } else {
        await postService.likePost(id);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert on error
      setLiked(previousLiked);
      setLikes(previousLikes);
    }
  };

  const handleCommentClick = () => {
    if (onCommentClick && (postData.id || postData._id || postId !== undefined)) {
      onCommentClick(postData.id || postData._id || postId);
    }
  };

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const id = postData._id || postId;
      await postService.deletePost(id);
      if (onDelete) {
        onDelete(id);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    }
  };

  const isOwnPost = currentUsername && (author.username === currentUsername || postData.username === currentUsername);

  // Feed variant (vertical list for Home)
  if (variant === "feed") {
    return (
      <>
        <div
          className={`
          w-full rounded-xl overflow-hidden bg-white dark:bg-[#111] border shadow-sm
          transition-all duration-300
          md:max-h-[700px] md:flex md:flex-col
            ${isActive ? 'border-primary-400' : 'border-black dark:border-gray-800 hover:border-primary'}
        `}
        >
          {/* User Info Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
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
            {isOwnPost && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors group"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-500" />
              </button>
            )}
          </div>

          {/* Post Image - 4:3 aspect ratio (Instagram standard) */}
          <div className="w-full aspect-[4/3] md:aspect-auto md:flex-1 dark:bg-black bg-gray-100 overflow-hidden flex items-center justify-center">
            <img
              src={postImage}
              alt="post"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 px-4 py-3 flex-shrink-0">
            <button onClick={handleLike} className="focus:outline-none">
              <Heart
                className={`h-6 w-6 cursor-pointer hover:scale-110 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'dark:text-white text-black'
                  }`}
              />
            </button>
            <button onClick={handleCommentClick} className="focus:outline-none">
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
                <span className="dark:text-gray-300 text-gray-700">{caption}</span>
              </p>
            </div>
          )}
        </div>

        {/* Share Modal */}
        <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onViewUserProfile={onViewUserProfile} />
      </>
    );
  }

  // Grid variant (for Explore page)
  return (
    <>
      <div className="w-full rounded-xl overflow-hidden bg-white dark:bg-[#111] border border-black dark:border-gray-800 hover:border-primary transition shadow-sm">
        {/* Post Image - 4:3 aspect ratio (Instagram standard) */}
        <div className="w-full aspect-[4/3] dark:bg-black bg-gray-100 overflow-hidden flex items-center justify-center">
          <img
            src={postImage}
            alt="post"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* User + Icons Row */}
        <div className="flex justify-between items-start px-3 py-3">
          {/* User Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0">
              <LiveProfilePhoto
                imageSrc={profileImage}
                videoSrc={getProfileVideoUrl(profileImage, username)}
                alt="profile"
                className="h-7 w-7 rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onViewUserProfile && onViewUserProfile(username)}
                className="text-sm font-medium hover:opacity-70 transition-opacity cursor-pointer block truncate"
              >
                {username}
              </button>
              {caption && (
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {caption}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={handleLike} className="focus:outline-none">
              <Heart
                className={`h-5 w-5 cursor-pointer hover:scale-110 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'dark:text-white text-black'
                  }`}
              />
            </button>
            <button onClick={handleCommentClick} className="focus:outline-none">
              <img
                src={commentIcon}
                alt="comment"
                className="h-5 w-5 cursor-pointer hover:scale-110 transition-transform duration-200 invert dark:invert-0"
              />
            </button>
            <button onClick={handleShareClick} className="focus:outline-none">
              <img
                src={messageIcon}
                alt="share"
                className="h-6 w-5 cursor-pointer hover:scale-110 transition-transform duration-200 invert dark:invert-0"
              />
            </button>
            {isOwnPost && (
              <button
                onClick={handleDelete}
                className="focus:outline-none p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors group"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        onViewUserProfile={onViewUserProfile}
        postId={postData._id || postId}
        postUrl={postImage}
      />
    </>
  );
}