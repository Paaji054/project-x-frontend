import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle } from "lucide-react";
import PostDetailModal from "../components/PostDetailModal";
import FollowersFollowingModal from "../components/FollowersFollowingModal";
import LiveProfilePhoto from "../components/LiveProfilePhoto";
import { getProfileVideoUrl } from "../utils/profileVideos";
import { useUserProfile } from "../hooks/useUserProfile";
import { userService, postService } from "../services";

export default function OtherUserProfile({ username: viewedUsername, onViewUserProfile }) {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState("followers");
  const { username: currentUsername } = useUserProfile();

  const viewedUser = viewedUsername || "sheryanne_xoxo";

  // Profile data state
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Posts state - counts will be dynamic based on this array length
  const [posts, setPosts] = useState([]);

  // Followers and Following lists - counts will be dynamic based on these array lengths
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  // Dynamic counts based on array lengths or API data
  const postsCount = userData?.stats?.posts || posts.length;
  const followersCount = userData?.stats?.followers || followersList.length;
  const followingCount = userData?.stats?.following || followingList.length;

  // Fetch user profile data with optimized parallel loading
  const fetchUserProfile = async () => {
    console.log('fetchUserProfile: Starting...', viewedUser);
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user data first (most important)
      console.log('fetchUserProfile: Fetching user data...');
      const user = await userService.getUserByUsername(viewedUser);
      console.log('fetchUserProfile: User data received:', user);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      setUserData(user);
      setIsFollowing(user?.isFollowing || false);

      // Fetch other data in parallel for faster loading
      console.log('fetchUserProfile: Fetching posts, followers, following in parallel...');
      const [userPosts, followersData, followingData] = await Promise.allSettled([
        postService.getUserPosts(viewedUser),
        userService.getUserFollowers(viewedUser),
        userService.getUserFollowing(viewedUser)
      ]);

      // Handle posts
      if (userPosts.status === 'fulfilled') {
        console.log('fetchUserProfile: Posts data:', userPosts.value);
        const postsArray = userPosts.value?.posts || [];
        setPosts(Array.isArray(postsArray) ? postsArray : []);
      } else {
        console.error('Error fetching posts:', userPosts.reason);
        setPosts([]);
      }

      // Handle followers
      if (followersData.status === 'fulfilled') {
        console.log('fetchUserProfile: Followers data:', followersData.value);
        const followersArray = followersData.value?.followers || [];
        setFollowersList(Array.isArray(followersArray) ? followersArray : []);
      } else {
        console.error('Error fetching followers:', followersData.reason);
        setFollowersList([]);
      }

      // Handle following
      if (followingData.status === 'fulfilled') {
        console.log('fetchUserProfile: Following data:', followingData.value);
        const followingArray = followingData.value?.following || [];
        setFollowingList(Array.isArray(followingArray) ? followingArray : []);
      } else {
        console.error('Error fetching following:', followingData.reason);
        setFollowingList([]);
      }

      console.log('fetchUserProfile: Complete!');
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to load user profile');
    } finally {
      console.log('fetchUserProfile: Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [viewedUser]);


  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleFollow = async () => {
    const newFollowingState = !isFollowing;
    const previousFollowingState = isFollowing;
    
    // Optimistic update
    setIsFollowing(newFollowingState);

    try {
      if (newFollowingState) {
        // Use userId from userData instead of username
        const userIdToFollow = userData?.uid || userData?._id;
        if (!userIdToFollow) {
          throw new Error('User ID not found');
        }
        await userService.followUser(userIdToFollow);
        
        // Update follower count
        if (userData?.stats) {
          setUserData({
            ...userData,
            stats: { ...userData.stats, followers: (userData.stats.followers || 0) + 1 }
          });
        }
        
        // Dispatch global event for real-time sync across all components
        window.dispatchEvent(new CustomEvent('userFollowed', { 
          detail: { 
            userId: userIdToFollow, 
            username: viewedUser,
            action: 'follow'
          } 
        }));
        window.dispatchEvent(new CustomEvent('followUpdated'));
      } else {
        // Use userId from userData instead of username
        const userIdToUnfollow = userData?.uid || userData?._id;
        if (!userIdToUnfollow) {
          throw new Error('User ID not found');
        }
        await userService.unfollowUser(userIdToUnfollow);
        
        // Update follower count
        if (userData?.stats) {
          setUserData({
            ...userData,
            stats: { ...userData.stats, followers: Math.max(0, (userData.stats.followers || 0) - 1) }
          });
        }
        
        // Dispatch global event for real-time sync across all components
        window.dispatchEvent(new CustomEvent('userUnfollowed', { 
          detail: { 
            userId: userIdToUnfollow, 
            username: viewedUser,
            action: 'unfollow'
          } 
        }));
        window.dispatchEvent(new CustomEvent('followUpdated'));
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      // Revert on error
      setIsFollowing(previousFollowingState);
      alert("Failed to update follow status. Please try again.");
    }
  };

  const handleFollowersClick = () => {
    setFollowersModalType("followers");
    setFollowersModalOpen(true);
  };

  const handleFollowingClick = () => {
    setFollowersModalType("following");
    setFollowersModalOpen(true);
  };

  const handleFollowUser = async (targetUsername) => {
    try {
      await userService.followUser(targetUsername);
      
      // Update followers list
      setFollowersList(followersList.map(user =>
        user.username === targetUsername ? { ...user, isFollowing: true } : user
      ));

      // Update following list
      setFollowingList(followingList.map(user =>
        user.username === targetUsername ? { ...user, isFollowing: true } : user
      ));
    } catch (err) {
      console.error("Error following user:", err);
      alert("Failed to follow user. Please try again.");
    }
  };

  const handleUnfollowUser = async (targetUsername) => {
    try {
      await userService.unfollowUser(targetUsername);
      
      // Update followers list
      setFollowersList(followersList.map(user =>
        user.username === targetUsername ? { ...user, isFollowing: false } : user
      ));

      // Update following list
      setFollowingList(followingList.map(user =>
        user.username === targetUsername ? { ...user, isFollowing: false } : user
      ));
    } catch (err) {
      console.error("Error unfollowing user:", err);
      alert("Failed to unfollow user. Please try again.");
    }
  };

  const handleMessage = () => {
    // Navigate to messages page and open chat with this user
    const usernameToMessage = viewedUsername || userData.username;
    navigate(`/messages?user=${usernameToMessage}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffcfa] dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#fffcfa] dark:bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchUserProfile}
            className="px-6 py-2 bg-primary hover:bg-primary-700 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!userData) {
    return (
      <div className="min-h-screen bg-[#fffcfa] dark:bg-black flex items-center justify-center p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffcfa] dark:bg-black text-black dark:text-white pb-20 md:pb-0">
      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Back Button */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white" />
          </button>
        </div>

        {/* Profile Info Section */}
        <div className="flex flex-col items-center gap-6 mb-8">
          {/* Profile Picture */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-black dark:border-gray-800"
          >
            <LiveProfilePhoto
              imageSrc={userData.profilePhoto}
              videoSrc={userData.profileVideo}
              alt="Profile"
              className="w-full h-full rounded-full"
            />
          </motion.div>

          {/* Profile Details */}
          <div className="flex flex-col items-center text-center w-full">
            {/* Username */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-xl md:text-2xl font-semibold text-black dark:text-white mb-2"
            >
              {userData.username}
            </motion.h2>

            {/* Full Name */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-gray-700 dark:text-gray-300 mb-3"
            >
              {userData.fullName}
            </motion.p>

            {/* Bio */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-black dark:text-white mb-6 text-sm md:text-base"
            >
              {userData.bio}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="flex items-center justify-center gap-4 md:gap-6 text-base md:text-lg mb-6"
            >
              <div className="text-center">
                <p className="font-bold text-black dark:text-white">{postsCount}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">Posts</p>
              </div>

              <div className="h-6 w-px bg-gray-400 dark:bg-gray-700"></div>

              <button
                onClick={handleFollowersClick}
                className="text-center hover:opacity-70 transition-opacity cursor-pointer"
              >
                <p className="font-bold text-black dark:text-white">{followersCount}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">Followers</p>
              </button>

              <div className="h-6 w-px bg-gray-400 dark:bg-gray-700"></div>

              <button
                onClick={handleFollowingClick}
                className="text-center hover:opacity-70 transition-opacity cursor-pointer"
              >
                <p className="font-bold text-black dark:text-white">{followingCount}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">Following</p>
              </button>
            </motion.div>

            {/* Follow and Message Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-3 w-full max-w-md px-4"
            >
              <button
                onClick={handleFollow}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${isFollowing
                  ? "bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-400 dark:border-gray-700"
                  : "bg-gradient-to-r from-primary-400 via-primary to-primary-700 text-white hover:from-primary hover:via-primary-700 hover:to-primary-800"
                  }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button
                onClick={handleMessage}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-400 dark:border-gray-700 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </button>
            </motion.div>
          </div>
        </div>

        {/* Posts Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="grid grid-cols-3 gap-1 md:gap-2"
        >
          {posts.map((post, index) => (
            <motion.div
              key={post.id || post._id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.03, duration: 0.4 }}
              onClick={() => handlePostClick(post)}
              className="aspect-square overflow-hidden bg-gray-200 dark:bg-gray-900 cursor-pointer group border-2 border-black dark:border-gray-800 transition-all"
            >
              <img
                src={post.imageUrl || post.image}
                alt={`Post ${(post.id || post._id) + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        post={selectedPost}
        onViewUserProfile={onViewUserProfile}
      />

      {/* Followers/Following Modal */}
      <FollowersFollowingModal
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        type={followersModalType}
        followersList={followersList}
        followingList={followingList}
        onFollow={handleFollowUser}
        onUnfollow={handleUnfollowUser}
        onViewUserProfile={onViewUserProfile}
        currentUsername={currentUsername}
      />
    </div>
  );
}