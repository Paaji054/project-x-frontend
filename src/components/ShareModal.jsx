import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LiveProfilePhoto from "./LiveProfilePhoto";
import { getProfileVideoUrl } from "../utils/profileVideos";
import { postService, messageService, userService } from "../services";
import { toast } from "react-hot-toast";

export default function ShareModal({ isOpen, onClose, onViewUserProfile, postId, postUrl }) {
  const navigate = useNavigate();
  const [selectedFriends, setSelectedFriends] = useState(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Fetch friends (conversations) when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      // Get conversations to show list of people to share with
      const conversations = await messageService.getConversations(50, 0);
      
      // Transform conversations to friends format
      const friendsList = conversations.map(convo => ({
        id: convo.otherUser?.id || convo.otherUser?.uid || convo._id,
        userId: convo.otherUser?.id || convo.otherUser?.uid,
        username: convo.otherUser?.username || 'Unknown',
        name: convo.otherUser?.displayName || convo.otherUser?.username || 'Unknown User',
        image: convo.otherUser?.profilePhoto || convo.otherUser?.avatar,
        conversationId: convo._id
      }));
      
      setFriends(friendsList);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleFriendToggle = (friendId) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleShare = async () => {
    if (selectedFriends.size === 0) return;

    try {
      setIsSharing(true);
      
      // Record the share in backend
      if (postId) {
        await postService.sharePost(postId);
      }
      
      // Send message to each selected friend
      const sharePromises = Array.from(selectedFriends).map(async (friendId) => {
        const friend = friends.find(f => f.id === friendId);
        if (!friend) return;
        
        try {
          let conversationId = friend.conversationId;
          
          // If no conversation exists, create one
          if (!conversationId && friend.userId) {
            const newConvo = await messageService.createConversation(friend.userId);
            conversationId = newConvo?._id;
          }
          
          if (conversationId && friend.userId) {
            // Send message with shared post as post_share type
            const shareText = postId
              ? `Shared a post with you`
              : `Shared a post with you!`;
            
            await messageService.sendMessage(
              conversationId,
              friend.userId,
              shareText,
              postUrl || null,
              postId ? 'post_share' : 'text',
              postId || null
            );
          }
        } catch (err) {
          console.error(`Error sharing with ${friend.username}:`, err);
        }
      });
      
      await Promise.all(sharePromises);
      
      // Navigate to messages page and select the first friend's chat
      const firstFriendId = Array.from(selectedFriends)[0];
      const firstFriend = friends.find(f => f.id === firstFriendId);
      
      onClose();
      setSelectedFriends(new Set());
      
      // Navigate to messages and pass the username to auto-open the chat
      if (firstFriend?.username) {
        navigate('/messages', { state: { openChatWithUsername: firstFriend.username } });
      } else {
        navigate('/messages');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 bottom-0 bg-black/70 backdrop-blur-sm z-[200]"
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              margin: 0
            }}
          />

          {/* Modal Container - Centers the modal */}
          <div
            className="fixed top-0 left-0 right-0 bottom-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
            style={{
              position: 'fixed !important',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              margin: 0
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.3 }}
              className="w-full max-w-[400px] sm:max-w-[420px] h-auto max-h-[85vh] bg-white dark:bg-[#0f0f0f] border-2 border-black dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center justify-between p-4 md:p-5 border-b border-black dark:border-gray-800 flex-shrink-0"
              >
                <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white">Share Post</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/messages?newChat=true');
                    }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                    title="Start new chat"
                  >
                    <Plus className="w-5 h-5 text-black dark:text-white" />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </motion.div>

              {/* Friends List */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-2 scrollbar-hide">
                {loadingFriends ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No conversations yet</p>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/messages?newChat=true');
                      }}
                      className="px-6 py-2 bg-primary hover:bg-primary-700 text-white rounded-full transition-colors"
                    >
                      Start a New Chat
                    </button>
                  </div>
                ) : (
                  <AnimatePresence>
                    {friends.map((friend, index) => {
                    const isSelected = selectedFriends.has(friend.id);
                    return (
                      <motion.button
                        key={friend.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        onClick={() => handleFriendToggle(friend.id)}
                        className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-secondary-50 dark:hover:bg-[#1a1a1a] transition-colors group"
                      >
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 transition-all"
                            style={{
                              borderColor: isSelected ? '#f97316' : 'transparent',
                            }}
                          >
                            <LiveProfilePhoto
                              imageSrc={friend.image}
                              videoSrc={getProfileVideoUrl(friend.image, friend.username)}
                              alt={friend.username}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full"
                            />
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-primary rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f0f0f]"
                            >
                              <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </div>

                        {/* Friend Info */}
                        <div className="flex-1 text-left min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewUserProfile && onViewUserProfile(friend.username);
                            }}
                            className="font-semibold text-sm md:text-base text-black dark:text-white truncate hover:opacity-70 transition-opacity cursor-pointer text-left w-full"
                          >
                            {friend.username}
                          </button>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                            {friend.name}
                          </p>
                        </div>

                        {/* Selection Indicator */}
                        <div
                          className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                            ? 'bg-primary border-primary'
                            : 'border-gray-400 dark:border-gray-600 group-hover:border-gray-500'
                            }`}
                        >
                          {isSelected && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-3 h-3 md:w-4 md:h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
                )}
              </div>

              {/* Share Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="border-t border-black dark:border-gray-800 p-4 md:p-5 flex-shrink-0 bg-white dark:bg-[#0f0f0f]"
              >
                <motion.button
                  onClick={handleShare}
                  disabled={selectedFriends.size === 0 || isSharing}
                  whileHover={{ scale: selectedFriends.size > 0 && !isSharing ? 1.02 : 1 }}
                  whileTap={{ scale: selectedFriends.size > 0 && !isSharing ? 0.98 : 1 }}
                  className="w-full py-3 md:py-3.5 px-4 bg-gradient-to-r from-primary-400 via-primary to-primary-700 hover:from-primary hover:via-primary-700 hover:to-primary-800 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed dark:disabled:hover:bg-gray-700 disabled:hover:bg-gray-300 rounded-xl text-white font-semibold text-sm md:text-base transition-colors"
                >
                  {isSharing 
                    ? 'Sharing...'
                    : selectedFriends.size > 0
                      ? `Send to ${selectedFriends.size} ${selectedFriends.size === 1 ? 'friend' : 'friends'}`
                      : 'Select friends to share'}
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at body level
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}