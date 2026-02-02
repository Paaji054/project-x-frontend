/* eslint-disable no-unused-vars */
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import homeIcon from "../../assets/home_mobnav_icon.png";
import exploreIcon from "../../assets/explore_mobnav_icon.png";
import messageIcon from "../../assets/message_mobnav_icon.png";
import communitiesIcon from "../../assets/communities.svg";
import { useUserProfile } from "../../hooks/useUserProfile";

export default function MobileNav() {
  const location = useLocation();
  const { profilePhoto } = useUserProfile();
  
  const navItems = [
    { id: "home", icon: homeIcon, path: "/home", needsInvert: true },
    { id: "explore", icon: exploreIcon, path: "/explore", needsInvert: true },
    { id: "profile", icon: profilePhoto, path: "/profile", isProfile: true },
    { id: "messages", icon: messageIcon, path: "/messages", needsInvert: true },
    { id: "communities", icon: communitiesIcon, path: "/communities", needsInvert: true },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 pb-5 pt-3">
        {/* Background with subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-[#fafafa]/90 to-transparent dark:from-black/95 dark:via-[#0a0a0a]/90 dark:to-transparent pointer-events-none"></div>

        {/* Navigation Container */}
        <div className="relative flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4">
          {navItems.map((item, index) => {
            const active = isActive(item.path);
            const isCenter = item.isProfile;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className="relative focus:outline-none"
              >
                {() => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.06,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Gradient Border Container */}
                    <motion.div
                      className={`
                        relative rounded-full
                        ${isCenter ? "w-14 h-14 sm:w-16 sm:h-16 p-[2.5px] sm:p-[3px]" : "w-11 h-11 sm:w-12 sm:h-12 p-[2px] sm:p-[2.5px]"}
                      `}
                      animate={{
                        background: active
                          ? "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)"
                          : "linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(249, 115, 22, 0.2) 50%, rgba(234, 88, 12, 0.2) 100%)",
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{
                        filter: active
                          ? "drop-shadow(0 0 10px rgba(251, 146, 60, 0.5)) drop-shadow(0 0 20px rgba(249, 115, 22, 0.4)) drop-shadow(0 0 30px rgba(234, 88, 12, 0.3))"
                          : "drop-shadow(0 0 5px rgba(251, 146, 60, 0.15))",
                      }}
                    >
                      {/* Inner Circle */}
                      <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center overflow-hidden relative">
                        {isCenter ? (
                          <motion.img
                            src={item.icon}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full"
                            whileHover={{ scale: 1.03 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          />
                        ) : (
                          <motion.img
                            src={item.icon}
                            alt={item.id}
                            className={`${isCenter ? "w-full h-full" : "w-6 h-6 sm:w-7 sm:h-7"} object-contain ${item.needsInvert ? "invert dark:invert-0" : ""}`}
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            animate={{
                              opacity: active ? 1 : 0.7,
                              scale: active ? 1 : 0.95,
                            }}
                          />
                        )}
                      </div>

                      {/* Subtle inner glow for active state */}
                      {active && !isCenter && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            background: "radial-gradient(circle at center, rgba(251, 146, 60, 0.12) 0%, transparent 70%)",
                          }}
                        />
                      )}
                    </motion.div>

                    {/* Subtle pulse ring for active center profile */}
                    {active && isCenter && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.3, 0, 0.3],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{
                          border: "2px solid rgba(251, 146, 60, 0.35)",
                        }}
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}