import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Pencil, Heart, X, Settings, Share2, Copy, Check, Trash2 } from "lucide-react";
import ShareModal from "../components/ShareModal";
import Comments from "../components/Comments";
import commentIcon from "../assets/comment.svg";
import messageIcon from "../assets/message.svg";
import { AnimatePresence } from "framer-motion";
import LiveProfilePhoto from "../components/LiveProfilePhoto";
import LiveBanner from "../components/LiveBanner";
import { getProfileVideoUrl } from "../utils/profileVideos";
import { getCommunityBannerVideoUrl, getCommunityProfileVideoUrl } from "../utils/communityVideos";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuth } from "../context/AuthContext";
import { communityService } from "../services/communityService";
import { postService } from "../services/postService";
import { toast } from "react-hot-toast";
import CommunitySettings from "./CommunitySettings";
import CreatePost from "./CreatePost";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function CommunityDetail({ communityId, onViewUserProfile }) {
  const navigate = useNavigate();
  const { username, user } = useUserProfile();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.uid || authUser?.id || user?.uid || user?.id;
  const [activeView, setActiveView] = useState("detail"); // "detail" or "settings"
  const [isJoined, setIsJoined] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [postsLikes, setPostsLikes] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [_error, setError] = useState("");
  const [postToDeleteId, setPostToDeleteId] = useState(null);
  
  // Community data state
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch community data
  useEffect(() => {
    const fetchCommunityData = async () => {
      setLoading(true);
      try {
        // Fetch community details - returns { community: {...} }
        const response = await communityService.getCommunityBySlug(communityId);
        const communityData = response?.community || response;
        setCommunity(communityData);
        setIsJoined(communityData?.isJoined || false);

        // Fetch community posts using actual MongoDB _id, not slug
        const actualCommunityId = communityData?._id || communityData?.id;
        let postsData = null;
        if (actualCommunityId) {
          postsData = await communityService.getCommunityPosts(actualCommunityId);
          setPosts(postsData?.posts || []);
        }

        // Initialize likes state (backend sends isLiked, likesCount number, likes array)
        if (postsData?.posts) {
          const likes = {};
          postsData.posts.forEach(post => {
            const count = typeof post.likesCount === 'number' ? post.likesCount : (Array.isArray(post.likes) ? post.likes.length : 0);
            likes[post.id] = {
              liked: post.liked ?? post.isLiked ?? false,
              count
            };
          });
          setPostsLikes(likes);
        }
      } catch (err) {
        console.error('Error fetching community data:', err);
        setError('Failed to load community');
      } finally {
        setLoading(false);
      }
    };

    if (communityId) {
      fetchCommunityData();
    }
  }, [communityId, refreshKey]);

  // Check if user is admin/moderator
  // Backend uses creatorId field which contains the user's uid, not username
  const userUid = user?.uid;
  const isAdmin = community?.creatorId === userUid;
  const isModerator = community?.moderators?.includes(userUid);
  const canManageSettings = isAdmin || isModerator;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0b0b0b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If community not found, show error or redirect
  if (!community) {
    return (
      <div className="min-h-screen w-full bg-[#0b0b0b] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Community not found</h1>
          <button
            onClick={() => navigate("/communities")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition"
          >
            Back to Communities
          </button>
        </div>
      </div>
    );
  }

  const handleJoin = async () => {
    // If already joined, do nothing (leave is handled by a separate button)
    if (isJoined) return;

    // Restricted communities cannot be joined from outside
    if (community.type === "Restricted") {
      setError("This community is restricted. Only moderators can add members.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // For public communities, join directly without code
    if (community.type === "public" || community.type === "Public" || !community.type) {
      try {
        await communityService.joinCommunity(community.id || community._id);
        setIsJoined(true);
        toast.success("Joined community!");
      } catch (err) {
        console.error("Error joining community:", err);
        toast.error("Failed to join community. Please try again.");
        setError("Failed to join community. Please try again.");
      }
      return;
    }

    // For private communities, show code modal
    setShowCodeModal(true);
  };

  const handleLeave = async () => {
    try {
      await communityService.leaveCommunity(community.id || community._id);
      setIsJoined(false);
      toast.success("Left community");
    } catch (err) {
      console.error("Error leaving community:", err);
      toast.error("Failed to leave community. Please try again.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCodeSubmit = async () => {
    const communityCode = community.code || community.id?.toString() || "";
    
    if (codeInput.trim() !== communityCode) {
      setCodeError("Invalid community code. Please try again.");
      return;
    }

    setCodeError("");
    setShowCodeModal(false);
    setCodeInput("");

    // If private community, show password modal after code is correct
    if (community.type === "Private") {
      setShowPasswordModal(true);
    } else {
      // For public communities, join after code verification
      try {
        await communityService.joinCommunity(community.id || community._id);
        setIsJoined(true);
        toast.success("Joined community!");
      } catch (err) {
        console.error("Error joining community:", err);
        toast.error("Failed to join community. Please try again.");
        setError("Failed to join community. Please try again.");
      }
    }
  };

  const handlePasswordSubmit = async () => {
    // In a real app, verify password from API
    // For now, check if password matches (this should come from community data or API)
    const correctPassword = community.password || "";

    if (!passwordInput.trim()) {
      setPasswordError("Please enter a password.");
      return;
    }

    if (passwordInput.trim() !== correctPassword && correctPassword) {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    setPasswordError("");
    setShowPasswordModal(false);
    setPasswordInput("");

    // Call API to join
    try {
      await communityService.joinCommunity(community.id || community._id, { password: passwordInput });
      setIsJoined(true);
      toast.success("Joined community!");
    } catch (err) {
      console.error("Error joining community:", err);
      toast.error("Failed to join community. Please try again.");
    }
  };

  const handleDeleteCommunityPost = async (postId) => {
    if (!postId) return;
    try {
      await postService.deletePost(String(postId));
      setPosts((prev) => prev.filter((p) => String(p.id || p._id) !== String(postId)));
      setPostToDeleteId(null);
      toast.success("Post removed from community.");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post. Please try again.");
      setPostToDeleteId(null);
    }
  };

  const handleLike = (postId) => {
    setPostsLikes(prev => {
      const current = prev[postId] || { liked: false, count: 0 };
      return {
        ...prev,
        [postId]: {
          liked: !current.liked,
          count: current.liked ? current.count - 1 : current.count + 1
        }
      };
    });
  };

  const handleCommentClick = async (postId) => {
    // Fetch comments when opening comments section — only store list, never overwrite count
    try {
      const response = await postService.getPostComments(postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, commentsList: response.comments || [] };
        }
        return p;
      }));
    } catch (err) {
      console.error("Error fetching comments:", err);
      toast.error("Failed to load comments");
    }
    setOpenCommentsPostId(postId);
  };

  const handleCloseComments = () => {
    setOpenCommentsPostId(null);
  };

  const handleAddComment = async (commentText, parentId = null) => {
    if (!openCommentsPostId || !commentText.trim()) return;

    try {
      const response = await postService.addComment(openCommentsPostId, {
        text: commentText,
        content: commentText,
        ...(parentId ? { parentId } : {}),
      });

      const newComment = response.comment || response.data || response;

      // Only add to top-level list and increment count if NOT a reply
      if (!parentId) {
        setPosts(prev => prev.map(p => {
          if (p.id === openCommentsPostId) {
            return {
              ...p,
              commentsList: [...(p.commentsList || []), newComment],
              comments: (p.comments || 0) + 1,
              commentsCount: (p.commentsCount || 0) + 1
            };
          }
          return p;
        }));
      }

      return newComment;
    } catch (err) {
      console.error("Error adding comment:", err);
      throw err;
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!openCommentsPostId) return;

    try {
      const post = posts.find(p => p.id === openCommentsPostId);
      if (!post) return;

      const comment = post.commentsList?.find(c => (c._id || c.id) === commentId);
      if (!comment) return;

      const isLiked = comment.isLiked || comment.liked;
      const actualCommentId = comment._id || comment.id;

      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id === openCommentsPostId) {
          return {
            ...p,
            commentsList: p.commentsList.map(c => {
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
          };
        }
        return p;
      }));

      // Call API
      if (isLiked) {
        await postService.unlikeComment(openCommentsPostId, actualCommentId);
      } else {
        await postService.likeComment(openCommentsPostId, actualCommentId);
      }
    } catch (err) {
      console.error("Error liking comment:", err);
      toast.error("Failed to like comment");
      // Revert on error - refetch comments
      try {
        const response = await postService.getPostComments(openCommentsPostId);
        setPosts(prev => prev.map(p => {
          if (p.id === openCommentsPostId) {
            return {
              ...p,
              commentsList: response.comments || []
            };
          }
          return p;
        }));
      } catch (refetchErr) {
        console.error("Error refetching comments:", refetchErr);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!openCommentsPostId) return;
    try {
      await postService.deleteComment(openCommentsPostId, commentId);
      setPosts(prev => prev.map(p => {
        if (p.id === openCommentsPostId) {
          return {
            ...p,
            commentsList: (p.commentsList || []).filter((c) => (c._id || c.id) !== commentId),
            comments: Math.max(0, (p.comments || 0) - 1),
            commentsCount: Math.max(0, (p.commentsCount || 0) - 1)
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Error deleting comment:", err);
      throw err;
    }
  };

  const handleAddPost = () => {
    setIsCreatePostOpen(true);
  };

  const handlePostCreated = async (postData) => {
    try {
      // Post was already created by CreatePost component, just refresh the posts list
      setIsCreatePostOpen(false);
      
      // Refresh community posts from backend
      const actualCommunityId = community?._id || community?.id;
      if (actualCommunityId) {
        const postsData = await communityService.getCommunityPosts(actualCommunityId);
        setPosts(postsData?.posts || []);
        
        // Update likes state (backend: isLiked, likesCount, likes array)
        if (postsData?.posts) {
          const likes = {};
          postsData.posts.forEach(post => {
            const count = typeof post.likesCount === 'number' ? post.likesCount : (Array.isArray(post.likes) ? post.likes.length : 0);
            likes[post.id] = {
              liked: post.liked ?? post.isLiked ?? false,
              count
            };
          });
          setPostsLikes(likes);
        }
      }
      
      // Force re-render by updating refresh key
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error refreshing posts:', err);
      toast.error('Failed to refresh posts');
    }
  };

  // Render settings view if active
  if (activeView === "settings") {
    return (
      <CommunitySettings 
        communityId={community?._id || community?.id} 
        communitySlug={communityId}
        initialCommunity={community}
        setActiveView={setActiveView} 
      />
    );
  }

  // Render community detail view
  return (
    <div className="min-h-screen w-full bg-[#fffcfa] dark:bg-[#0b0b0b]">
      {/* Header with Banner */}
      <div className="relative w-full">
        {/* Banner Image */}
        <div className="w-full h-48 sm:h-64 md:h-80 overflow-hidden relative">
          <LiveBanner
            imageSrc={community.banner}
            videoSrc={getCommunityBannerVideoUrl(community.id, community.banner, community)}
            alt={`${community.name} banner`}
            className="w-full h-full"
            maxDuration={10}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none" />
        </div>

        {/* Header Content */}
        <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 md:px-6 lg:px-8 pb-4 sm:pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
              {/* Community Icon - Circular */}
              <div className="relative -mb-3 sm:-mb-4 md:-mb-6 flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full border-2 border-white overflow-hidden shadow-xl bg-white">
                  <LiveProfilePhoto
                    imageSrc={community.icon}
                    videoSrc={getCommunityProfileVideoUrl(community.id, community.icon, community)}
                    alt={`${community.name} icon`}
                    className="w-full h-full rounded-full"
                    maxDuration={10}
                  />
                </div>
              </div>

              {/* Community Info */}
              <div className="flex-1 pt-1 sm:pt-2 min-w-0">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 break-words">
                      {community.name}
                    </h1>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm md:text-base text-white/90 flex-wrap">
                      <span>{community.followers} Followers</span>
                      <span className="w-1 h-1 rounded-full bg-white/50" />
                      <span>{community.contributors} Contributors</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={handleJoin}
                      disabled={isJoined}
                      className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition flex-shrink-0 ${
                        isJoined
                          ? "bg-gray-700 text-white border border-gray-600 cursor-default opacity-80"
                          : "bg-primary text-white hover:bg-primary-700"
                      }`}
                    >
                      {isJoined ? "Joined" : "Join"}
                    </button>
                    {isJoined && (
                      <button
                        onClick={handleLeave}
                        className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg bg-transparent text-red-500 border border-red-500 text-xs sm:text-sm font-medium hover:bg-red-500/10 transition flex-shrink-0"
                      >
                        Leave
                      </button>
                    )}
                    <button
                      onClick={handleAddPost}
                      className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg bg-transparent text-white border border-primary text-xs sm:text-sm font-medium hover:bg-primary/10 transition flex-shrink-0"
                    >
                      Add Post
                    </button>
                    {/* Settings button - visible only to admins and moderators */}
                    {canManageSettings && (
                      <button
                        onClick={() => setActiveView("settings")}
                        className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg bg-transparent text-white border border-primary text-xs sm:text-sm font-medium hover:bg-primary/10 transition flex items-center gap-1 sm:gap-2 flex-shrink-0"
                        title="Manage community settings"
                      >
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Settings</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-2 sm:top-4 left-2 sm:left-4 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 dark:bg-black/50 dark:hover:bg-black/70 rounded-full transition backdrop-blur-sm z-10"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Community Information */}
            <div className="bg-gray-100 dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Pencil className="w-4 h-4 text-primary" />
                <span>Created {community.createdAt ? new Date(community.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Globe className="w-4 h-4 text-primary" />
                <span>{community.type || 'Public'}</span>
              </div>

              {/* Community Description */}
              <div>
                <h3 className="text-black dark:text-white font-semibold mb-2">{community.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {community.description || 'No description available'}
                </p>
              </div>

              {/* Rules - always visible */}
              <div className="bg-gray-100 dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-3 sm:p-4">
                <h3 className="text-black dark:text-white font-semibold mb-2">Rules</h3>
                {community.rules && community.rules.length > 0 ? (
                  <ul className="space-y-1.5">
                    {community.rules.map((rule, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                        <span className="text-primary font-medium flex-shrink-0">{index + 1}.</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No rules set yet.
                    {canManageSettings && (
                      <button
                        type="button"
                        onClick={() => setActiveView("settings")}
                        className="ml-1 text-primary font-medium hover:underline"
                      >
                        Add rules in Settings
                      </button>
                    )}
                  </p>
                )}
              </div>

              {/* Community Code */}
              <div>
                <h3 className="text-black dark:text-white font-semibold mb-2">Community Code</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Share this code with others to invite them to join this community
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
                  <div className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg min-w-0">
                    <p className="text-xs sm:text-sm font-mono text-black dark:text-white break-all">
                      {community.code || community.id?.toString() || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const code = community.code || community.id?.toString() || "";
                      navigator.clipboard.writeText(code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    const id = community._id || community.id;
                    const communityLink = `${window.location.origin}/communities/${id}`;
                    navigator.clipboard.writeText(communityLink).then(() => {
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }).catch(() => {
                      window.prompt('Copy this link to share:', communityLink);
                    });
                  }}
                  className="w-full px-3 sm:px-4 py-2 bg-transparent border border-primary text-primary rounded-lg hover:bg-primary/10 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Share Community Link</span>
                      <span className="sm:hidden">Share Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Search By Topic */}
            {community.topics && community.topics.length > 0 && (
              <div className="bg-gray-100 dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-3 sm:p-4">
                <h3 className="text-black dark:text-white font-semibold mb-3">Search By Topic</h3>
                <div className="flex flex-wrap gap-2">
                  {community.topics.map((topic, index) => (
                    <button
                      key={index}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition bg-primary text-white hover:bg-primary-700"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Moderators */}
            {community.moderators && community.moderators.length > 0 && (
              <div className="bg-gray-100 dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-3 sm:p-4">
                <h3 className="text-black dark:text-white font-semibold mb-3">Moderators</h3>
                <div className="space-y-3">
                  {community.moderators.map((mod, index) => (
                    <div key={mod.id || mod.username || index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <LiveProfilePhoto
                          imageSrc={mod.avatar || mod.profilePhoto}
                          videoSrc={getProfileVideoUrl(mod.avatar || mod.profilePhoto, mod.username)}
                          alt={mod.username || 'Moderator'}
                          className="w-8 h-8 rounded-full"
                        />
                      </div>
                      <button
                        onClick={() => onViewUserProfile && onViewUserProfile(mod.username)}
                        className="text-sm text-gray-700 dark:text-gray-300 hover:opacity-70 transition-opacity cursor-pointer"
                      >
                        {mod.username || 'Unknown'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content - Posts */}
          <main className="lg:col-span-2 space-y-4 sm:space-y-6">
            {posts.map((post) => {
              const postLikeCount = typeof post.likesCount === 'number' ? post.likesCount : (Array.isArray(post.likes) ? post.likes.length : 0);
              const postLikeData = postsLikes[post.id] || { liked: post.isLiked ?? false, count: postLikeCount };
              return (
                <div
                  key={post.id}
                  className="bg-gray-100 dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
                        <LiveProfilePhoto
                          imageSrc={post.avatar}
                          videoSrc={getProfileVideoUrl(post.avatar, post.username)}
                          alt={post.username}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        />
                      </div>
                      <button
                        onClick={() => onViewUserProfile && onViewUserProfile(post.username)}
                        className="text-sm sm:text-base text-black dark:text-white font-medium hover:opacity-70 transition-opacity cursor-pointer truncate"
                      >
                        {post.username}
                      </button>
                    </div>
                    {/* Category Badge (Reddit-style) */}
                    {post.category && (
                      <span className="px-2 sm:px-3 py-1 text-xs font-semibold bg-primary/20 text-primary-400 border border-primary/30 rounded-full flex-shrink-0">
                        {post.category}
                      </span>
                    )}
                    {/* Delete post - owner/moderator only */}
                    {canManageSettings && (
                      <button
                        type="button"
                        onClick={() => setPostToDeleteId(post.id || post._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition"
                        title="Delete post"
                        aria-label="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Post Title */}
                  {post.title && (
                    <h3 className="text-black dark:text-white font-bold text-base sm:text-lg">{post.title}</h3>
                  )}

                  {/* Post Content */}
                  {post.content && (
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">{post.content}</p>
                  )}

                  {/* Post Media (Image or Video) - 4:3 aspect ratio */}
                  {(post.image || post.imageUrl) && (
                    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-black">
                      {post.mediaType === 'video' ? (
                        <video
                          src={post.image || post.imageUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={post.image || post.imageUrl}
                          alt={post.title || 'Post'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* Interaction Icons */}
                  <div className="flex items-center gap-3 sm:gap-4 pt-2 border-t border-black dark:border-gray-800">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 sm:gap-2 focus:outline-none group"
                    >
                      <Heart
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${postLikeData.liked
                          ? "fill-red-500 text-red-500"
                          : "text-gray-600 dark:text-gray-400 group-hover:text-red-500 dark:group-hover:text-white"
                          }`}
                      />
                      <span
                        className={`text-xs sm:text-sm ${postLikeData.liked
                          ? "text-red-500 font-semibold"
                          : "text-gray-600 dark:text-gray-400 group-hover:text-red-500 dark:group-hover:text-white"
                          }`}
                      >
                        {postLikeData.count}
                      </span>
                    </button>
                    <button
                      onClick={() => handleCommentClick(post.id)}
                      className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
                    >
                      <img src={commentIcon} alt="comment" className="w-4 h-4 sm:w-5 sm:h-5 opacity-70 dark:opacity-100 brightness-0 dark:brightness-100" />
                      <span className="text-xs sm:text-sm">{post.comments || 0}</span>
                    </button>
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
                    >
                      <img src={messageIcon} alt="share" className="w-4 h-4 sm:w-5 sm:h-5 opacity-70 dark:opacity-100 brightness-0 dark:brightness-100" />
                    </button>
                  </div>
                </div>
              );
            })}
          </main>
        </div>
      </div>

      {/* Comments Section - Overlay for both mobile and desktop */}
      <Comments
        isOpen={openCommentsPostId !== null}
        onClose={handleCloseComments}
        variant="overlay"
        initialComments={
          openCommentsPostId !== null
            ? posts.find(p => p.id === openCommentsPostId)?.commentsList || []
            : []
        }
        onViewUserProfile={onViewUserProfile}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
        onDeleteComment={handleDeleteComment}
        currentUserId={currentUserId}
        postId={openCommentsPostId}
      />

      {/* Share Modal */}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onViewUserProfile={onViewUserProfile} />

      {/* Delete post confirmation (community owner/moderator) */}
      <DeleteConfirmationModal
        isOpen={!!postToDeleteId}
        onClose={() => setPostToDeleteId(null)}
        onConfirm={() => postToDeleteId && handleDeleteCommunityPost(postToDeleteId)}
        title="Delete post?"
        message="This post will be permanently removed from the community. This cannot be undone."
        confirmLabel="Delete post"
      />

      {/* Community Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-xl">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-1">Enter Community Code</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please enter the community code to join this community.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="detail-code-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Community code
                </label>
                <input
                  id="detail-code-input"
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase().slice(0, 6));
                    setCodeError("");
                  }}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                />
                {codeError && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">{codeError}</p>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCodeModal(false);
                    setCodeInput("");
                    setCodeError("");
                  }}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCodeSubmit}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-primary text-white font-medium hover:bg-primary-700 transition"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#121212] rounded-xl p-6 max-w-md w-full border border-black dark:border-gray-800">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Enter Password</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This is a private community. Please enter the password to join.
            </p>
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handlePasswordSubmit();
                    }
                  }}
                />
                {passwordError && (
                  <p className="text-sm text-red-500 mt-2">{passwordError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput("");
                    setPasswordError("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePost
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
        communityId={community?._id || community?.id}
      />
    </div>
  );
}