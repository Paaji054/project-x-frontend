import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LiveProfilePhoto from "../components/LiveProfilePhoto";
import { getProfileVideoUrl } from "../utils/profileVideos";
import { notificationService, userService } from "../services";
import { toast } from "react-hot-toast";

export default function Notifications({ setActiveView, onViewUserProfile, previousView = "home" }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    today: [],
    yesterday: [],
    thisWeek: []
  });
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const notifs = await notificationService.getNotifications();
      setAllNotifications(notifs || []);
      
      // Group notifications by time period
      const grouped = groupNotificationsByTime(notifs || []);
      setNotifications(grouped);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const groupNotificationsByTime = (notifs) => {
    const now = new Date();
    const today = [];
    const yesterday = [];
    const thisWeek = [];

    notifs.forEach(notif => {
      const createdAt = new Date(notif.createdAt);
      const diffHours = (now - createdAt) / (1000 * 60 * 60);

      const transformed = {
        id: notif._id,
        type: notif.type,
        avatar: notif.sender?.profilePicture || "https://i.pravatar.cc/100",
        username: notif.sender?.username || "user",
        message: notif.message || getNotificationMessage(notif),
        action: getNotificationAction(notif),
        actionType: notif.type,
        isFollowing: notif.isFollowing || false,
        showDismiss: notif.type === 'follow_request',
        isRead: notif.isRead
      };

      if (diffHours < 24) {
        today.push(transformed);
      } else if (diffHours < 48) {
        yesterday.push(transformed);
      } else if (diffHours < 168) {
        thisWeek.push(transformed);
      }
    });

    return { today, yesterday, thisWeek };
  };

  const getNotificationMessage = (notif) => {
    const typeMessages = {
      follow: 'started following you',
      like: 'liked your post',
      comment: `commented: ${notif.content || ''}`,
      follow_request: 'requested to follow you',
      mention: 'mentioned you in a post'
    };
    return typeMessages[notif.type] || 'sent you a notification';
  };

  const getNotificationAction = (notif) => {
    if (notif.type === 'follow') return notif.isFollowing ? 'Following' : 'Follow Back';
    if (notif.type === 'follow_request') return 'Confirm';
    return null;
  };

  const [oldNotifications] = useState({
    today: [
      {
        id: 1,
        type: "follow",
        avatar: "https://i.pravatar.cc/100?img=50",
        username: "pxhf_12",
        message: "started following you",
        action: "Follow Back",
        actionType: "follow_back",
        isFollowing: false,
      },
      {
        id: 2,
        type: "story_like",
        avatar: "https://i.pravatar.cc/100?img=51",
        username: "xsd_hgf",
        message: "and 12 others liked your story",
        action: null,
      },
      {
        id: 3,
        type: "comment",
        avatar: "https://i.pravatar.cc/100?img=52",
        username: "shane_xd",
        message: "commented on your post: padhle bhai..",
        action: null,
      },
    ],
    yesterday: [
      {
        id: 4,
        type: "follow_request",
        avatar: "https://i.pravatar.cc/100?img=53",
        username: "garvv_pvt",
        message: "requested to follow you",
        action: "Confirm",
        actionType: "confirm_request",
        showDismiss: true,
      },
      {
        id: 5,
        type: "follow_request",
        avatar: "https://i.pravatar.cc/100?img=54",
        username: "masooom",
        message: "requested to follow you",
        action: "Confirm",
        actionType: "confirm_request",
        showDismiss: true,
      },
    ],
    thisWeek: [
      {
        id: 6,
        type: "follow",
        avatar: "https://i.pravatar.cc/100?img=51",
        username: "xsd_hgf",
        message: "started following you",
        action: "Following",
        actionType: "following",
        isFollowing: true,
      },
      {
        id: 7,
        type: "follow_request",
        avatar: "https://i.pravatar.cc/100?img=53",
        username: "garvv_pvt",
        message: "requested to follow you",
        action: "Confirm",
        actionType: "confirm_request",
        showDismiss: true,
      },
      {
        id: 8,
        type: "community_post",
        avatar: "https://via.placeholder.com/48",
        icon: "code",
        message: "72daysdesign posted in community: Ways to capture the..",
        action: null,
      },
      {
        id: 9,
        type: "community_post",
        avatar: "https://via.placeholder.com/48",
        icon: "code",
        message: "72daysdesign posted in community: Ways to capture the..",
        action: null,
      },
      {
        id: 10,
        type: "community_post",
        avatar: "https://via.placeholder.com/48",
        icon: "code",
        message: "72daysdesign posted in community:",
        action: null,
      },
    ],
  });

  const handleAction = async (notificationId, section, actionType) => {
    if (actionType === "dismiss") {
      try {
        await notificationService.deleteNotification(notificationId);
        setNotifications((prev) => {
          const updated = { ...prev };
          updated[section] = updated[section].filter((n) => n.id !== notificationId);
          return updated;
        });
      } catch (err) {
        console.error("Error dismissing notification:", err);
        toast.error("Failed to dismiss notification");
      }
      return;
    }

    // Find the notification to get username
    const notif = notifications[section]?.find((n) => n.id === notificationId);
    if (!notif) return;

    // Optimistically update UI
    setNotifications((prev) => {
      const updated = { ...prev };
      const n = updated[section]?.find((n) => n.id === notificationId);
      if (!n) return prev;

      if (actionType === "follow_back" || actionType === "confirm_request" || actionType === "follow") {
        n.isFollowing = true;
        n.action = "Following";
        n.actionType = "following";
        n.showDismiss = false;
      } else if (actionType === "following") {
        n.isFollowing = false;
        n.action = n.type === "follow_request" ? "Follow" : "Follow Back";
        n.actionType = "follow_back";
      }

      return updated;
    });

    try {
      // Call API
      if (actionType === "follow_back" || actionType === "confirm_request" || actionType === "follow") {
        // Backend expects userId (uid), so use sender uid when available
        const userIdToFollow = notif.senderUid || notif.senderId || notif.username;
        await userService.followUser(userIdToFollow);
      } else if (actionType === "following") {
        const userIdToUnfollow = notif.senderUid || notif.senderId || notif.username;
        await userService.unfollowUser(userIdToUnfollow);
      }

      // Mark notification as read
      await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.error("Error handling notification action:", err);
      toast.error("Failed to update follow status");
      // Revert optimistic update on error
      fetchNotifications();
    }
  };

  const renderNotification = (notification, section) => (
    <motion.div
      key={notification.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f0f0f] hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {notification.icon === "code" ? (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <LiveProfilePhoto
              imageSrc={notification.avatar}
              videoSrc={getProfileVideoUrl(notification.avatar, null)}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
          </div>
        )}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-black dark:text-white leading-relaxed">
          {notification.username ? (
            <>
              <button
                onClick={() => onViewUserProfile && onViewUserProfile(notification.username)}
                className="font-semibold hover:opacity-70 transition-opacity cursor-pointer"
              >
                {notification.username}
              </button>
              {" "}
              {notification.message.replace(notification.username, "").trim()}
            </>
          ) : (
            notification.message
          )}
        </p>
      </div>

      {/* Action Button */}
      {notification.action && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleAction(notification.id, section, notification.actionType)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${notification.isFollowing
              ? "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            {notification.action}
          </button>
          {notification.showDismiss && (
            <button
              onClick={() => handleAction(notification.id, section, "dismiss")}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );

  const renderSection = (title, sectionKey) => {
    const sectionNotifications = notifications[sectionKey];
    if (sectionNotifications.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4 px-4">{title}</h3>
        <div className="space-y-3">
          {sectionNotifications.map((notification) =>
            renderNotification(notification, sectionKey)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fffcfa] dark:bg-black text-black dark:text-white pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#fffcfa] dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg md:text-2xl font-semibold text-black dark:text-white">Notifications</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 overflow-y-auto scrollbar-hide">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchNotifications}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && allNotifications.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No notifications yet</p>
            <p className="text-sm mt-2">When you get notifications, they'll show up here</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {renderSection("Today", "today")}
            {renderSection("Yesterday", "yesterday")}
            {renderSection("This Week", "thisWeek")}
          </>
        )}
      </div>

    </div>
  );
}