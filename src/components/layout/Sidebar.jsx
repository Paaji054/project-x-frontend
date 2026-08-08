// Normal icons
import { NavLink } from "react-router-dom";
import { FiBarChart2, FiZap, FiBookmark } from "react-icons/fi";
import React, { useState, useEffect } from "react";
import homeIcon from "../../assets/home.svg";
import exploreIcon from "../../assets/explore.svg";
import communitiesIcon from "../../assets/communities.svg";
import messageIcon from "../../assets/message.svg";
import profileIcon from "../../assets/profile.svg";
import logoutIcon from "../../assets/logout.svg";

import LogoutConfirmationModal from "../LogoutConfirmationModal";
import LiveProfilePhoto from "../LiveProfilePhoto";
import { useUserProfile } from "../../hooks/useUserProfile";
import { userService } from "../../services";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ onLogout }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const { profilePhoto, profileVideo, username } = useUserProfile();
  const { user } = useAuth();
  
  // Fetch stats from backend
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!username) return;
      try {
        const response = await userService.getUserStats(username);
        if (response) {
          setStats({
            posts: response.posts || 0,
            followers: response.followers || 0,
            following: response.following || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserStats();

    // Listen for profile updates and follow/unfollow events to refresh stats
    const handleStatsUpdate = () => {
      setStatsLoading(true);
      fetchUserStats();
    };

    window.addEventListener('profileUpdated', handleStatsUpdate);
    window.addEventListener('followUpdated', handleStatsUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleStatsUpdate);
      window.removeEventListener('followUpdated', handleStatsUpdate);
    };
  }, [username]);
  const items = [
    { label: "Home", value: "/home", icon: homeIcon },
    { label: "Explore", value: "/explore", icon: exploreIcon },
    { label: "Saved", value: "/saved", icon: null, isReactIcon: true, reactIcon: FiBookmark },
    { label: "Communities", value: "/communities", icon: communitiesIcon },
    { label: "Messages", value: "/messages", icon: messageIcon },
    { label: "Analytics", value: "/analytics", icon: null, isReactIcon: true },
    { label: "AI Tools", value: "/ai-tools", icon: null, isReactIcon: true, reactIcon: FiZap },
    { label: "Profile", value: "/profile", icon: profileIcon },
  ];

  const handleLogout = () => {
    // Clear token and redirect to login
    if (onLogout) {
      onLogout();
    }
    setIsLogoutModalOpen(false);
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  return (
    <aside className="hidden md:flex flex-col w-80 bg-[#fffcfa] dark:bg-[#0f0f0f] border-r border-black dark:border-gray-800 transition-colors duration-300 p-8 fixed left-0 top-16 h-[calc(100vh-4rem)] text-black dark:text-white overflow-y-auto">

      {/* Profile Image */}
      <div className="relative w-28 h-28 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-primary to-primary-700 rounded-full blur-lg opacity-90"></div>
        <div className="relative w-28 h-28 rounded-full border-2 dark:border-gray-900 border-black overflow-hidden">
          <LiveProfilePhoto
            imageSrc={profilePhoto}
            videoSrc={profileVideo}
            alt="Profile"
            className="w-full h-full"
          />
        </div>
      </div>

      <h2 className="text-lg font-semibold text-center">{username}</h2>
      <p className="text-sm dark:text-gray-400 text-gray-600 text-center mb-8">{user?.displayName || username}</p>

      {/* Stats */}
      <div className="flex justify-center text-center mb-10 text-sm">
        <div className="px-3">
          <p className="font-bold">{statsLoading ? "..." : stats.posts}</p>
          <p className="dark:text-gray-400 text-gray-600 text-xs">Posts</p>
        </div>

        <div className="border-l dark:border-gray-700 border-black mx-2 h-5"></div>

        <div className="px-3">
          <p className="font-bold">{statsLoading ? "..." : stats.followers}</p>
          <p className="dark:text-gray-400 text-gray-600 text-xs">Followers</p>
        </div>

        <div className="border-l dark:border-gray-700 border-black mx-2 h-5"></div>

        <div className="px-3">
          <p className="font-bold">{statsLoading ? "..." : stats.following}</p>
          <p className="dark:text-gray-400 text-gray-600 text-xs">Following</p>
        </div>
      </div>

      {/* Buttons */}
      <nav className="space-y-4 text-[15px] font-medium">
        {items.map((item, i) => {
          return (
            <NavLink
              key={i}
              to={item.value}
              className={({ isActive }) =>
                `relative w-full rounded-2xl p-[3px] border ${isActive ? "border-transparent" : "dark:border-gray-600 border-black"} ${isActive ? "bg-gradient-to-r from-red-600 via-red-700 to-red-800" : "hover:border-transparent hover:bg-gradient-to-r hover:from-red-600 hover:via-red-700 hover:to-red-800"} transition-all duration-300 block`
              }
            >
              {({ isActive }) => (
                <span className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white dark:bg-[#0f0f0f]">
                  {item.isReactIcon ? (
                    (() => {
                      const IconComponent = item.reactIcon || FiBarChart2;
                      return <IconComponent className="h-5 w-5 text-black dark:text-white" />;
                    })()
                  ) : (
                    <img src={item.icon} className="h-5 w-5 invert dark:invert-0" alt={item.label} />
                  )}
                  <span className={`${isActive ? "text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-700 to-red-800" : ""}`}>
                    {item.label}
                  </span>
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Logout */}
        <button
          className="group relative w-full rounded-2xl p-[3px] border dark:border-gray-600 border-black hover:border-transparent hover:bg-gradient-to-r hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 mt-6"
          onClick={handleLogoutClick}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
        >
          <span className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white dark:bg-[#0f0f0f]">
            <img src={logoutIcon} className="h-5 w-5 invert dark:invert-0" alt="Logout" />
            <span className="text-black dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:via-red-700 group-hover:to-red-800 transition-all duration-300">
              Logout
            </span>
          </span>
        </button>
      </nav>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </aside>
  );
}