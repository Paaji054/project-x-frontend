import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMoreVertical, FiZap, FiBarChart2 } from "react-icons/fi";
import logo from "../../assets/logo.svg";
import bell from "../../assets/bell.svg";
import shop from "../../assets/shop.svg";
import ThemeToggle from "../ThemeToggle";

export default function Navbar({ onCreatePostClick }) {
  const navigate = useNavigate();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [moreMenuOpen]);

  const moreMenuItems = [
    { label: "AI Tools", path: "/ai-tools", icon: FiZap },
    { label: "Analytics", path: "/analytics", icon: FiBarChart2 },
  ];

  const handleCreatePost = () => {
    if (onCreatePostClick) {
      onCreatePostClick();
    }
  };

  const handleLogoClick = () => {
    navigate("/home");
  };

  return (
    <header className="w-full h-14 md:h-16 border-b border-black dark:border-gray-800 px-4 md:px-2 flex items-center justify-between sticky top-0 bg-gradient-to-r from-secondary-100 via-secondary-50 to-secondary-100 dark:from-black dark:via-gray-950 dark:to-black z-20">
      <div
        onClick={handleLogoClick}
        className="flex items-center py-2 cursor-pointer hover:opacity-80 transition-opacity ml-2 md:ml-4"
      >
        <img
          src={logo}
          alt="Project Logo"
          className="h-12 md:h-16 w-auto select-none object-contain"
        />

      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <ThemeToggle />

        {/* 3-dot menu for mobile - pages not in bottom nav */}
        <div className="relative md:hidden" ref={menuRef}>
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <FiMoreVertical className="w-5 h-5 text-black dark:text-white" />
          </button>

          <AnimatePresence>
            {moreMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-gray-800 shadow-xl overflow-hidden z-50"
              >
                {moreMenuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMoreMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <img
          src={shop}
          alt="Shop"
          onClick={() => navigate("/shop")}
          className="h-5 w-5 md:h-6 md:w-6 cursor-pointer opacity-90 hover:opacity-100 transition invert dark:invert-0"
        />
        <img
          src={bell}
          alt="Notifications"
          onClick={() => navigate("/notifications")}
          className="h-5 w-5 md:h-6 md:w-6 cursor-pointer opacity-90 hover:opacity-100 transition invert dark:invert-0"
        />

        <button
          onClick={handleCreatePost}
          className="relative rounded-full p-[2px] animate-spin-slow-glow hover:opacity-90"
        >
          <span className="block px-3 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-medium rounded-full bg-white dark:bg-black text-black dark:text-white border border-primary ">
            Create a Post
          </span>
        </button>
      </div>
    </header>
  );
}