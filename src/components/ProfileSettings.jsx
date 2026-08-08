import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Video, Upload, X, Plus, Link, Sparkles, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import LiveProfilePhoto from "../components/LiveProfilePhoto";
import { useAuth } from "../context/AuthContext";
import { userService, uploadService } from "../services";
import { aiService } from "../services/aiService";

export default function ProfileSettings({ onBack, onProfileUpdate }) {
  const { user, updateUser } = useAuth();
  
  // Fetch user stats
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [formData, setFormData] = useState({
    username: user?.username || "",
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    website: user?.website || ""
  });
  const [links, setLinks] = useState(user?.links || []);
  const [accountType, setAccountType] = useState(user?.accountType || "public");
  const [notifications, setNotifications] = useState({
    likes: user?.notificationSettings?.likes ?? true,
    comments: user?.notificationSettings?.comments ?? true,
    messages: user?.notificationSettings?.messages ?? true,
    followRequests: user?.notificationSettings?.followRequests ?? true
  });
  
  // Read receipts setting - load from user data
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(
    user?.readReceiptsEnabled ?? true
  );

  // API state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const usernameCheckRef = useRef(null);

  // Preview states (not saved until "Save Changes" is clicked)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(
    user?.profilePhoto || user?.avatar
  );
  const [profileVideoPreview, setProfileVideoPreview] = useState(
    user?.profileVideo || null
  );

  // AI generation states
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [showBioAIOptions, setShowBioAIOptions] = useState(false);
  const [bioTone, setBioTone] = useState('casual');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [showAvatarAIInput, setShowAvatarAIInput] = useState(false);
  const [avatarDescription, setAvatarDescription] = useState('');

  const handleGenerateBio = async () => {
    try {
      setIsGeneratingBio(true);
      const interests = formData.bio ? formData.bio.split(/[,.\n]/).map(s => s.trim()).filter(Boolean).slice(0, 5) : [];
      const result = await aiService.generateBio(interests, bioTone);
      if (result?.bio) {
        setFormData(prev => ({ ...prev, bio: result.bio.slice(0, 500) }));
        toast.success('Bio generated!');
        setShowBioAIOptions(false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to generate bio');
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarDescription.trim()) {
      toast.error('Please describe your avatar');
      return;
    }
    try {
      setIsGeneratingAvatar(true);
      const result = await aiService.generateAvatar(avatarDescription.trim());
      if (result?.avatarUrl) {
        setProfilePhotoPreview(result.avatarUrl);
        toast.success('Avatar generated!');
        setShowAvatarAIInput(false);
        setAvatarDescription('');
      }
    } catch (err) {
      toast.error(err?.message || err?.data?.error?.message || 'Failed to generate avatar');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // Fetch user stats on mount
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.username) return;
      try {
        const response = await userService.getUserStats(user.username);
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
    
    // Listen for follow/unfollow events to update stats in real-time
    const handleFollowUpdate = (event) => {
      const { action } = event.detail;
      setStats(prev => ({
        ...prev,
        following: action === 'follow' ? prev.following + 1 : Math.max(0, prev.following - 1)
      }));
    };
    
    window.addEventListener('userFollowed', handleFollowUpdate);
    window.addEventListener('userUnfollowed', handleFollowUpdate);
    
    return () => {
      window.removeEventListener('userFollowed', handleFollowUpdate);
      window.removeEventListener('userUnfollowed', handleFollowUpdate);
    };
  }, [user?.username]);

  // Sync formData when user updates (e.g. from auth context)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || prev.username,
        displayName: user.displayName ?? prev.displayName,
        bio: user.bio ?? prev.bio,
        email: user.email ?? prev.email,
        phone: user.phone ?? prev.phone,
        gender: user.gender ?? prev.gender,
        website: user.website ?? prev.website
      }));
      setLinks(user.links || []);
    }
  }, [user]);

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') {
      const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setFormData({ ...formData, username: normalized });
      setUsernameError('');
      setUsernameAvailable(null);
      if (normalized.length >= 3 && normalized !== (user?.username || '')) {
        if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
        usernameCheckRef.current = setTimeout(() => {
          userService.getUserByUsername(normalized)
            .then((data) => {
              const existing = data?.user || data;
              if (existing && existing.uid !== user?.uid) {
                setUsernameAvailable(false);
                setUsernameError('Username is already taken');
              } else {
                setUsernameAvailable(true);
                setUsernameError('');
              }
            })
            .catch(() => {
              setUsernameAvailable(true);
              setUsernameError('');
            });
        }, 500);
      } else if (normalized === (user?.username || '')) {
        setUsernameAvailable(true);
        setUsernameError('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleNotificationToggle = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadingPhoto(true);
      try {
        // Convert to base64 for upload
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result;
          
          try {
            // Upload to backend
            const response = await uploadService.uploadFromBase64(dataUrl, 'profiles');
            
            // Update preview with uploaded URL
            if (response && response.url) {
              setProfilePhotoPreview(response.url);
            }
          } catch (err) {
            console.error("Error uploading photo:", err);
            toast.error("Failed to upload photo. Please try again.");
          } finally {
            setUploadingPhoto(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Error reading file:", err);
        setUploadingPhoto(false);
      }
    } else {
      toast.error("Please select a valid image file.");
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Video file size should be less than 10MB.");
        e.target.value = '';
        return;
      }
      
      setUploadingVideo(true);
      try {
        // Convert to base64 for upload
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result;
          
          try {
            // Upload to backend
            const response = await uploadService.uploadFromBase64(dataUrl, 'profile-videos');
            
            // Update preview with uploaded URL
            if (response && response.url) {
              setProfileVideoPreview(response.url);
            }
          } catch (err) {
            console.error("Error uploading video:", err);
            toast.error("Failed to upload video. Please try again.");
          } finally {
            setUploadingVideo(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Error reading file:", err);
        setUploadingVideo(false);
      }
    } else {
      toast.error("Please select a valid video file.");
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemoveVideo = () => {
    // Only update preview, don't save yet
    setProfileVideoPreview(null);
  };

  const handleSaveChanges = async () => {
    const newUsername = (formData.username || '').trim().toLowerCase();
    if (newUsername && newUsername !== (user?.username || '')) {
      if (newUsername.length < 3 || newUsername.length > 30) {
        setSaveError('Username must be 3–30 characters');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
        setSaveError('Username can only contain letters, numbers, and underscores');
        return;
      }
      if (usernameAvailable === false || (usernameAvailable === null && newUsername !== user?.username)) {
        setSaveError('Please choose an available username');
        return;
      }
    }

    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Create update data object matching backend validation schema
      const updateData = {
        username: (formData.username || '').trim().toLowerCase() || undefined,
        displayName: formData.displayName,
        bio: formData.bio,
        email: formData.email,
        phone: formData.phone || '',
        gender: formData.gender || '',
        website: formData.website || '',
        links: links.filter(l => l.trim()),
        accountType: accountType,
        notificationSettings: notifications,
        readReceiptsEnabled: readReceiptsEnabled
      };
      if (!updateData.username) delete updateData.username;

      // Add uploaded media URLs if they exist
      if (profilePhotoPreview) {
        updateData.avatar = profilePhotoPreview;
        updateData.profilePhoto = profilePhotoPreview;
      }
      
      if (profileVideoPreview) {
        updateData.profileVideo = profileVideoPreview;
      } else {
        // If video was removed, send empty string to clear it
        updateData.profileVideo = '';
      }

      // Call API to update profile
      const response = await userService.updateProfile(updateData);
      
      if (response && response.user) {
        // Update auth context
        if (updateUser) {
          updateUser(response.user);
        }
        
        // Trigger global profile update event
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: response.user
        }));
        
        // Call parent callback
        if (onProfileUpdate) {
          onProfileUpdate(response.user);
        }
        
        // Show success toast for 2 seconds
        toast.success("Profile updated successfully!", {
          duration: 2000,
        });
        
        // Go back to profile page after a short delay
        setTimeout(() => {
          if (onBack) {
            onBack();
          }
        }, 500);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setSaveError(err.message || "Failed to update profile. Please try again.");
      
      // Show error toast for 2 seconds
      toast.error(err.message || "Failed to update profile. Please try again.", {
        duration: 2000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffcfa] dark:bg-black text-black dark:text-white pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-gray-300 dark:border-gray-800 px-4 md:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-black dark:text-white" />
          </button>
          <h1 className="text-lg md:text-2xl font-semibold">Profile Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Profile Picture
              </label>
              <div className="relative w-32 h-32 mx-auto md:mx-0">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-800">
                  <LiveProfilePhoto
                    imageSrc={profilePhotoPreview}
                    videoSrc={profileVideoPreview}
                    alt="Profile"
                    className="w-full h-full rounded-full"
                  />
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors border-2 border-white dark:border-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload profile photo"
                >
                  {uploadingPhoto ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
              <p className="text-center md:text-left text-sm text-gray-400 mt-2">
                @{user?.username || 'username'}
              </p>
              <p className="text-center md:text-left text-xs text-gray-500">
                {user?.displayName || user?.username || 'User'}
              </p>

              {/* AI Avatar Generation */}
              <div className="mt-3">
                {!showAvatarAIInput ? (
                  <button
                    type="button"
                    onClick={() => setShowAvatarAIInput(true)}
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors mx-auto md:mx-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Avatar</span>
                  </button>
                ) : (
                  <div className="space-y-2 max-w-xs mx-auto md:mx-0">
                    <input
                      type="text"
                      value={avatarDescription}
                      onChange={(e) => setAvatarDescription(e.target.value)}
                      placeholder="Describe your avatar (e.g., a cool astronaut)"
                      maxLength={200}
                      className="w-full bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateAvatar}
                        disabled={isGeneratingAvatar || !avatarDescription.trim()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {isGeneratingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {isGeneratingAvatar ? 'Generating...' : 'Generate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAvatarAIInput(false); setAvatarDescription(''); }}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center md:justify-start gap-6 mt-3 text-sm">
                <div className="text-center">
                  <p className="font-bold">{statsLoading ? "..." : stats.posts}</p>
                  <p className="text-gray-400 text-xs">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{statsLoading ? "..." : stats.followers}</p>
                  <p className="text-gray-400 text-xs">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{statsLoading ? "..." : stats.following}</p>
                  <p className="text-gray-400 text-xs">Following</p>
                </div>
              </div>
            </div>

            {/* Live Profile Video */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Live Profile Video
              </label>
              <div className="space-y-3">
                {profileVideoPreview ? (
                  <div className="relative">
                    <div className="w-full max-w-xs mx-auto md:mx-0 rounded-lg overflow-hidden border-2 border-gray-800">
                      <video
                        src={profileVideoPreview}
                        className="w-full h-auto max-h-48 object-cover"
                        controls
                        muted
                      />
                    </div>
                    <button
                      onClick={handleRemoveVideo}
                      className="mt-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Remove Video
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                    <Video className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-3">No live profile video uploaded</p>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="px-4 py-2 bg-primary hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Video (Max 10MB)
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Video will play on hover</p>
                  </div>
                )}
              </div>
            </div>

            {/* Username (editable) */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="3–30 characters, letters, numbers, underscores"
                maxLength={30}
                className="w-full bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3 text-black dark:text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors"
              />
              {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
              {usernameAvailable === true && !usernameError && formData.username.length >= 3 && (
                <p className="text-xs text-green-500 mt-1">Username is available</p>
              )}
              <p className="text-xs text-gray-500 mt-1">{formData.username.length}/30 characters</p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Your display name"
                className="w-full bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3 text-black dark:text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-primary">
                  Bio
                </label>
                <button
                  type="button"
                  onClick={() => setShowBioAIOptions(!showBioAIOptions)}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Generate</span>
                </button>
              </div>
              {showBioAIOptions && (
                <div className="mb-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Pick a tone for your bio:</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['casual', 'professional', 'funny', 'creative'].map(tone => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setBioTone(tone)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${bioTone === tone ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-600 text-gray-400 hover:border-purple-500'}`}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateBio}
                    disabled={isGeneratingBio}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingBio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isGeneratingBio ? 'Generating...' : 'Generate Bio'}
                  </button>
                </div>
              )}
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows="3"
                maxLength="500"
                className="w-full bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3 text-black dark:text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="example.com or https://example.com"
                className="w-full bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3 text-black dark:text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                <div className="flex items-center gap-1">
                  <Link className="w-4 h-4" />
                  Links (up to 5)
                </div>
              </label>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => {
                        const updated = [...links];
                        updated[index] = e.target.value;
                        setLinks(updated);
                      }}
                      placeholder="https://example.com"
                      className="flex-1 bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm text-black dark:text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setLinks(links.filter((_, i) => i !== index))}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {links.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setLinks([...links, ''])}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add link
                  </button>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3 text-black dark:text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="w-full bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3 text-black dark:text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleInputChange}
                className="w-full bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3 text-black dark:text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Account Type - commented out
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Account Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="public"
                    checked={accountType === "public"}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-black dark:text-white">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="private"
                    checked={accountType === "private"}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-black dark:text-white">Private</span>
                </label>
              </div>
            </div>
            */}

            {/* Notifications */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Notifications
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3">
                  <span className="text-black dark:text-white">Likes</span>
                  <button
                    onClick={() => handleNotificationToggle("likes")}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications.likes ? "bg-primary" : "bg-gray-600"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications.likes ? "translate-x-6" : ""
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3">
                  <span className="text-black dark:text-white">Comments</span>
                  <button
                    onClick={() => handleNotificationToggle("comments")}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications.comments ? "bg-primary" : "bg-gray-600"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications.comments ? "translate-x-6" : ""
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3">
                  <span className="text-black dark:text-white">Messages</span>
                  <button
                    onClick={() => handleNotificationToggle("messages")}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications.messages ? "bg-primary" : "bg-gray-600"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications.messages ? "translate-x-6" : ""
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3">
                  <span className="text-black dark:text-white">Follow Requests</span>
                  <button
                    onClick={() => handleNotificationToggle("followRequests")}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications.followRequests ? "bg-primary" : "bg-gray-600"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications.followRequests ? "translate-x-6" : ""
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Read Receipts */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Read Receipts
              </label>
              <div className="bg-gray-100 dark:bg-[#1a1a1a] border border-black dark:border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <span className="text-black dark:text-white font-medium">Read Receipts</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      When disabled, you won't see read receipts from others and others won't see yours
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !readReceiptsEnabled;
                      setReadReceiptsEnabled(newValue);
                      localStorage.setItem('readReceiptsEnabled', newValue.toString());
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ml-4 ${readReceiptsEnabled ? "bg-primary" : "bg-gray-600"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${readReceiptsEnabled ? "translate-x-6" : ""
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Changes Button */}
            <div>
              {saveError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{saveError}</p>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-6 py-3 bg-primary hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}