import { useState, useEffect } from 'react';

const pickAvatar = (profile) => {
  if (!profile) return null;
  return profile.profilePhoto || profile.avatar || profile.profilePicture || null;
};

const getUserProfile = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

const sameProfile = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.uid === b.uid &&
    a.profilePhoto === b.profilePhoto &&
    a.avatar === b.avatar &&
    a.profileVideo === b.profileVideo &&
    a.username === b.username &&
    a.displayName === b.displayName &&
    a.bio === b.bio
  );
};

export const useUserProfile = () => {
  const [profile, setProfile] = useState(() => getUserProfile());
  const initial = getUserProfile();
  const [profilePhoto, setProfilePhoto] = useState(() => pickAvatar(initial));
  const [profileVideo, setProfileVideo] = useState(() => initial?.profileVideo || null);

  useEffect(() => {
    const apply = (updatedProfile) => {
      if (!updatedProfile) return;
      setProfile((prev) => (sameProfile(prev, updatedProfile) ? prev : updatedProfile));
      setProfilePhoto(pickAvatar(updatedProfile));
      setProfileVideo(updatedProfile.profileVideo || null);
    };

    const handleProfileUpdate = (e) => apply(e.detail);

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', () => apply(getUserProfile()));

    apply(getUserProfile());

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  return {
    profile,
    profilePhoto,
    profileVideo,
    username: profile?.username || "user"
  };
};
