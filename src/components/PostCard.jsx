import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import ShareModal from "./ShareModal";
import commentIcon from "../assets/comment.svg";
import messageIcon from "../assets/message.svg";
import LiveProfilePhoto from "./LiveProfilePhoto";
import { getProfileVideoUrl } from "../utils/profileVideos";
import { postService } from "../services";
import { toast } from "react-hot-toast";

export default function PostCard({ 
  variant = "grid", 
  post, 
  postId, 
  onCommentClick, 
  isActive, 
  onViewUserProfile,
  onClick
}) {
  // Use post data if provided, otherwise fallback to defaults
  const postData = post || {};
  const author = postData.author || postData.user || {};
  
  const [liked, setLiked] = useState(postData.isLiked || false);
  const [likes, setLikes] = useState(postData.likesCount || postData.likes || 0);
  const [commentsCount, setCommentsCount] = useState(postData.commentsCount || 0);
  const [sharesCount, setSharesCount] = useState(postData.sharesCount || 0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync like state from backend when post data updates (e.g. after refresh/navigation)
  useEffect(() => {
    setLiked(postData.isLiked || false);
    setLikes(postData.likesCount ?? postData.likes ?? 0);
    setCommentsCount(postData.commentsCount ?? 0);
    setSharesCount(postData.sharesCount ?? 0);
  }, [postData.isLiked, postData.likesCount, postData.likes, postData.commentsCount, postData.sharesCount]);

  const postImage = postData.imageUrl || postData.image || postData.images?.[0];
  const profileImage = author.profilePhoto || author.avatar || author.profilePicture || postData.profileImage;
  const username = author.username || postData.username || 'user';
  const caption = postData.caption || postData.content || "";
  const fontFamily = postData.fontFamily || '';
  const colorPalette = postData.colorPalette || {};

  const handleLike = async () => {
    const id = postData._id || postId;
    if (!id) return;

    const previousLiked = liked;
    const previousLikes = likes;

    // Optimistic update
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    try {
      if (liked) {
        await postService.unlikePost(String(id));
      } else {
        await postService.likePost(String(id));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("Failed to like post");
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
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black dark:border-gray-800 flex-shrink-0">
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

          {/* Post media / text-only content */}
          {postImage ? (
            <div 
              className="w-full aspect-[4/3] md:aspect-auto md:flex-1 dark:bg-black bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer"
              onClick={onClick}
            >
              <img
                src={postImage}
                alt="post"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div
              className="w-full md:flex-1 dark:bg-black bg-gray-100 flex items-center justify-center px-5 py-10 cursor-pointer"
              onClick={onClick}
            >
              <div
                className="w-full max-w-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm"
                style={colorPalette.background ? { backgroundColor: colorPalette.background } : {}}
              >
                <p
                  className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap"
                  style={{
                    ...(fontFamily ? { fontFamily } : {}),
                    ...(colorPalette.text ? { color: colorPalette.text } : {}),
                  }}
                >
                  {caption || 'New post'}
                </p>
              </div>
            </div>
          )}

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

          {/* Likes / Comments / Shares Count */}
          <div className="px-4 pb-2 flex-shrink-0">
            <p className="text-sm font-semibold">
              {likes.toLocaleString()} likes
              {commentsCount > 0 ? ` · ${commentsCount.toLocaleString()} comments` : ''}
              {sharesCount > 0 ? ` · ${sharesCount.toLocaleString()} shares` : ''}
            </p>
          </div>

          {/* Caption */}
          {caption && (
            <div
              className="px-4 pb-4 flex-shrink-0"
              style={colorPalette.background ? { backgroundColor: colorPalette.background } : {}}
            >
              <p className="text-sm">
                <button
                  onClick={() => onViewUserProfile && onViewUserProfile(username)}
                  className="font-semibold mr-2 hover:opacity-70 transition-opacity cursor-pointer"
                >
                  {username}
                </button>
                <span
                  className="dark:text-gray-300 text-gray-700"
                  style={{
                    ...(fontFamily ? { fontFamily } : {}),
                    ...(colorPalette.text ? { color: colorPalette.text } : {}),
                  }}
                >{caption}</span>
              </p>
            </div>
          )}
        </div>

        {/* Share Modal */}
        <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onViewUserProfile={onViewUserProfile} postId={postData._id || postData.id || postId} postUrl={postImage} onShareSuccess={() => setSharesCount(prev => prev + 1)} />
      </>
    );
  }

  // Grid variant (for Explore page)
  return (
    <>
      <div className="w-full rounded-xl overflow-hidden bg-white dark:bg-[#111] border border-black dark:border-gray-800 hover:border-primary transition shadow-sm">
        {/* Post media / text-only content */}
        {postImage ? (
          <div 
            className="w-full aspect-[4/3] dark:bg-black bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer"
            onClick={onClick}
          >
            <img
              src={postImage}
              alt="post"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div
            className="w-full aspect-[4/3] dark:bg-black bg-gray-100 flex items-center justify-center p-4 cursor-pointer"
            onClick={onClick}
          >
            <div
              className="w-full h-full rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-center"
              style={colorPalette.background ? { backgroundColor: colorPalette.background } : {}}
            >
              <p
                className="text-base md:text-lg leading-relaxed whitespace-pre-wrap text-center"
                style={{
                  ...(fontFamily ? { fontFamily } : {}),
                  ...(colorPalette.text ? { color: colorPalette.text } : {}),
                }}
              >
                {caption || 'New post'}
              </p>
            </div>
          </div>
        )}

        {/* User + Icons Row */}
        <div className="flex justify-between items-center px-3 py-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0">
              <LiveProfilePhoto
                imageSrc={profileImage}
                videoSrc={getProfileVideoUrl(profileImage, username)}
                alt="profile"
                className="h-7 w-7 rounded-full"
              />
            </div>
            <button
              onClick={() => onViewUserProfile && onViewUserProfile(username)}
              className="text-sm font-medium hover:opacity-70 transition-opacity cursor-pointer"
            >
              {username}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} postId={postData._id || postData.id || postId} postUrl={postImage} onShareSuccess={() => setSharesCount(prev => prev + 1)} />
    </>
  );
}