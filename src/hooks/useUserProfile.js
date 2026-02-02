import { useState, useEffect } from 'react';

/**
 * Get user profile from localStorage
 */
const getUserProfile = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Hook to get current user profile data with reactive updates
 * Automatically updates when profile changes
 */
export const useUserProfile = () => {
  const [profile, setProfile] = useState(() => getUserProfile());
  const [profilePhoto, setProfilePhoto] = useState(() => profile?.profilePhoto || null);
  const [profileVideo, setProfileVideo] = useState(() => profile?.profileVideo || null);

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const updatedProfile = e.detail;
      setProfile(updatedProfile);
      setProfilePhoto(updatedProfile.profilePhoto || null);
      setProfileVideo(updatedProfile.profileVideo || null);
    };

    // Listen for profile updates
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    // Check for updates periodically (in case updated from another tab)
    const checkProfile = () => {
      const currentProfile = getUserProfile();
      if (currentProfile) {
        setProfile(currentProfile);
        setProfilePhoto(currentProfile.profilePhoto || null);
        setProfileVideo(currentProfile.profileVideo || null);
      }
    };
    
    checkProfile();
    const interval = setInterval(checkProfile, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      clearInterval(interval);
    };
  }, []);

  return {
    profile,
    profilePhoto,
    profileVideo,
    username: profile?.username || "user"
  };
};

