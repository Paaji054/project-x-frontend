import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, Upload, X, Plus, Trash2, Eye, EyeOff, Globe, Lock, Eye as EyeIcon, RefreshCw } from "lucide-react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuth } from "../context/AuthContext";
import { communityService } from "../services/communityService";
import { userService } from "../services/userService";
import LiveBanner from "./LiveBanner";
import LiveProfilePhoto from "./LiveProfilePhoto";

export default function CommunitySettings({ communityId, communitySlug, initialCommunity, setActiveView }) {
  const navigate = useNavigate();
  const { username, profile } = useUserProfile();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [community, setCommunity] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rules: [],
    newRule: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
    showPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    communityCode: "",
    communityType: "Public",
    hasPassword: false,
  });

  // Media state
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerVideoPreview, setBannerVideoPreview] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileVideoPreview, setProfileVideoPreview] = useState(null);

  // Moderators state
  const [moderators, setModerators] = useState([]);
  const [newModerator, setNewModerator] = useState("");
  const [passwordValidationError, setPasswordValidationError] = useState("");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Fetch community data from API
  useEffect(() => {
    const fetchCommunity = async () => {
      // If we have initial community data, use it immediately
      if (initialCommunity) {
        setCommunity(initialCommunity);
        setFormData({
          name: initialCommunity.name || "",
          description: initialCommunity.description || "",
          rules: initialCommunity.rules || [],
          newRule: "",
          password: "",
          newPassword: "",
          confirmPassword: "",
          showPassword: false,
          showNewPassword: false,
          showConfirmPassword: false,
          communityCode: initialCommunity.code || initialCommunity.id?.toString() || initialCommunity._id?.toString() || "",
          communityType: initialCommunity.type || "Public",
          hasPassword: initialCommunity.hasPassword || !!initialCommunity.password,
        });
        setModerators(initialCommunity.moderators || []);
        setBannerPreview(initialCommunity.banner);
        setBannerVideoPreview(initialCommunity.bannerVideo || null);
        setProfilePreview(initialCommunity.icon || initialCommunity.avatar);
        setProfileVideoPreview(initialCommunity.profileVideo || null);
        setLoading(false);
        return;
      }

      // Otherwise fetch from API using slug
      try {
        setLoading(true);
        setError("");
        const data = await communityService.getCommunityBySlug(communitySlug || communityId);
        setCommunity(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          rules: data.rules || [],
          newRule: "",
          password: "",
          newPassword: "",
          confirmPassword: "",
          showPassword: false,
          showNewPassword: false,
          showConfirmPassword: false,
          communityCode: data.code || data.id?.toString() || data._id?.toString() || "",
          communityType: data.type || "Public",
          hasPassword: data.hasPassword || !!data.password,
        });
        setModerators(data.moderators || []);
        setBannerPreview(data.banner);
        setBannerVideoPreview(data.bannerVideo || null);
        setProfilePreview(data.icon || data.avatar);
        setProfileVideoPreview(data.profileVideo || null);
      } catch (err) {
        setError("Failed to load community data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (initialCommunity || communityId || communitySlug) {
      fetchCommunity();
    } else {
      setLoading(false);
    }
  }, [communityId, communitySlug, initialCommunity]);

  // Check if user is admin/moderator — must be declared BEFORE the useEffect that uses them
  const userUid = authUser?.uid || authUser?.id || profile?.uid || profile?.id;
  const isAdmin = community?.creatorId === userUid;
  const isModerator = moderators.some((m) => (typeof m === "string" ? m : m?.uid) === userUid);

  // Fetch members when owner/moderator and community is loaded
  useEffect(() => {
    if (!communityId || !(isAdmin || isModerator)) return;
    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        const list = await communityService.getMembers(communityId);
        setMembers(Array.isArray(list) ? list : []);
      } catch {
        setMembers([]);
      } finally {
        setMembersLoading(false);
      }
    };
    fetchMembers();
  }, [communityId, isAdmin, isModerator]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#fffcfa] dark:bg-[#0b0b0b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen w-full bg-[#fffcfa] dark:bg-[#0b0b0b] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">Community not found</h1>
          <button
            onClick={() => setActiveView ? setActiveView("detail") : navigate(`/communities/${communityId}`)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return (
      <div className="min-h-screen w-full bg-[#fffcfa] dark:bg-[#0b0b0b] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => setActiveView ? setActiveView("detail") : navigate(`/communities/${communityId}`)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddRule = () => {
    if (formData.newRule.trim()) {
      setFormData({
        ...formData,
        rules: [...formData.rules, formData.newRule.trim()],
        newRule: "",
      });
    }
  };

  const handleRemoveRule = (index) => {
    setFormData({
      ...formData,
      rules: formData.rules.filter((_, i) => i !== index),
    });
  };

  const handleAddModerator = async () => {
    if (!newModerator.trim()) return;
    setError("");
    try {
      // Look up user by username to get their UID
      const data = await userService.getUserByUsername(newModerator.trim());
      const foundUser = data?.user || data;
      if (!foundUser?.uid) {
        setError(`User "${newModerator.trim()}" not found.`);
        return;
      }
      await communityService.addModerator(communityId, foundUser.uid);
      setModerators((prev) => [
        ...prev,
        {
          uid: foundUser.uid,
          username: foundUser.username || newModerator.trim(),
          avatar: foundUser.avatar || foundUser.profilePhoto || null,
        },
      ]);
      setNewModerator("");
      setSuccess("Moderator added successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error adding moderator:", err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to add moderator.";
      setError(msg);
    }
  };

  const handleDeleteCommunity = async () => {
    const confirmation = window.confirm(
      `Are you sure you want to delete "${community.name}"? This action cannot be undone.`
    );
    
    if (!confirmation) return;
    
    const secondConfirmation = window.prompt(
      `To confirm deletion, please type the community name: ${community.name}`
    );
    
    if (secondConfirmation !== community.name) {
      setError("Community name doesn't match. Deletion cancelled.");
      return;
    }
    
    try {
      setLoading(true);
      await communityService.deleteCommunity(communityId);
      setSuccess("Community deleted successfully");
      // Navigate back to communities list after a short delay
      setTimeout(() => {
        navigate("/communities");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete community");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveModerator = async (mod) => {
    const userId = typeof mod === "string" ? mod : (mod?.uid ?? mod?.id);
    if (!userId || !communityId) return;
    try {
      setError("");
      await communityService.removeModerator(communityId, userId);
      setModerators((prev) => prev.filter((m) => (typeof m === "string" ? m : m?.uid ?? m?.id) !== userId));
      setSuccess("Moderator removed.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error removing moderator:", err);
      setError(err.response?.data?.error?.message || err.message || "Failed to remove moderator.");
    }
  };

  const handleRemoveMember = async (member) => {
    const userId = typeof member === "string" ? member : member?.uid;
    if (!userId || !communityId) return;
    if (userId === community?.creatorId) return;
    try {
      setError("");
      await communityService.removeMember(communityId, userId);
      setMembers((prev) => prev.filter((m) => (typeof m === "string" ? m : m?.uid) !== userId));
      setSuccess("Member removed.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error removing member:", err);
      setError(err.response?.data?.error?.message || err.message || "Failed to remove member.");
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Validate password if changing
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setPasswordValidationError("New passwords do not match");
          setSaving(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setPasswordValidationError("Password must be at least 6 characters");
          setSaving(false);
          return;
        }
        setPasswordValidationError("");
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        description: formData.description,
        rules: formData.rules,
        banner: bannerPreview,
        bannerVideo: bannerVideoPreview,
        icon: profilePreview,
        avatar: profilePreview,
        profileVideo: profileVideoPreview,
        type: formData.communityType,
      };

      // Add password if changing (only for private communities)
      if (formData.communityType === "Private" && formData.newPassword) {
        updateData.password = formData.newPassword;
        updateData.hasPassword = true;
      } else if (formData.communityType !== "Private") {
        // Clear password if switching away from private
        updateData.password = null;
        updateData.hasPassword = false;
      }

      // Update community locally first
      if (community) {
        Object.assign(community, updateData);
      }

      // Call API to update
      try {
        await communityService.updateCommunity(communityId, updateData);
        setSuccess("Community settings updated successfully!");
        
        // Return to detail view after a short delay
        setTimeout(() => {
          setActiveView("detail");
        }, 1500);
      } catch (err) {
        console.error("Error updating community:", err);
        setError(err.message || "Failed to update community settings");
      }
    } catch {
      setError("An error occurred while saving changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fffcfa] dark:bg-[#0b0b0b] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <button
            onClick={() => setActiveView("detail")}
            className="p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-black dark:text-white">Community Settings</h1>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-xs sm:text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-xs sm:text-sm">
            {success}
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Community Name */}
          <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
              Community Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-sm sm:text-base text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
              placeholder="Enter community name"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
              Description <span className="text-primary">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-sm sm:text-base text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition resize-none"
              placeholder="Describe your community"
              required
            />
          </div>

          {/* Banner */}
          <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-3">
              Community Banner
            </label>
            
            {/* Static Banner */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Banner Image
              </label>
              <label className="w-full h-24 sm:h-28 md:h-32 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:border-primary-400 transition flex items-center justify-center overflow-hidden">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-1 sm:mb-2" />
                      <span className="text-xs sm:text-sm text-gray-400">Upload Image</span>
                    </div>
                  )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Live Banner Video */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Live Banner Video (Optional)
              </label>
              <label className="w-full h-20 sm:h-22 md:h-24 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:border-primary-400 transition flex items-center justify-center overflow-hidden">
                {bannerVideoPreview ? (
                  <video
                    src={bannerVideoPreview}
                    className="w-full h-full object-cover rounded-lg"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-primary/70 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">Upload Video (10s max)</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleBannerVideoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-3">
              Community Icon
            </label>
            
            {/* Static Profile */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Profile Image
              </label>
              <label className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-primary rounded-full cursor-pointer hover:border-primary-400 transition flex items-center justify-center overflow-hidden mx-auto">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Live Profile Video */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">
                Live Profile Video (Optional)
              </label>
              <label className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-primary/50 rounded-full cursor-pointer hover:border-primary-400 transition flex items-center justify-center overflow-hidden mx-auto">
                {profileVideoPreview ? (
                  <video
                    src={profileVideoPreview}
                    className="w-full h-full object-cover rounded-full"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-primary/70" />
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleProfileVideoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Community Code */}
          <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-2">
              Community Code
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              This code is required for users to join this community
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <input
                type="text"
                value={formData.communityCode}
                readOnly
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-xs sm:text-sm text-black dark:text-white font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(formData.communityCode);
                  setSuccess("Community code copied to clipboard!");
                  setTimeout(() => setSuccess(""), 3000);
                }}
                className="px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition text-xs sm:text-sm whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Community Type */}
          <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-3">
              Community Type
            </label>
            <div className="space-y-2 sm:space-y-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, communityType: "Public" })}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border-2 transition ${formData.communityType === "Public"
                    ? "bg-primary/20 border-primary text-black dark:text-white"
                    : "bg-gray-100 dark:bg-gray-900 border-black dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
              >
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Public</span>
                <span className="ml-auto text-xs text-gray-500 hidden sm:inline">Anyone can view and join</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, communityType: "Restricted" })}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border-2 transition ${formData.communityType === "Restricted"
                    ? "bg-primary/20 border-primary text-black dark:text-white"
                    : "bg-gray-100 dark:bg-gray-900 border-black dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
              >
                <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Restricted</span>
                <span className="ml-auto text-xs text-gray-500 hidden sm:inline">Only moderators can add members</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, communityType: "Private" })}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border-2 transition ${formData.communityType === "Private"
                    ? "bg-primary/20 border-primary text-black dark:text-white"
                    : "bg-gray-100 dark:bg-gray-900 border-black dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Private</span>
                <span className="ml-auto text-xs text-gray-500 hidden sm:inline">Requires password to join</span>
              </button>
            </div>
          </div>

          {/* Password (Private Communities Only) */}
          {formData.communityType === "Private" && (
            <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                <label className="block text-xs sm:text-sm font-medium text-black dark:text-white">
                  Community Password
                </label>
                {!formData.hasPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      const resetPassword = prompt("Enter a new password for this community (minimum 6 characters):");
                      if (resetPassword && resetPassword.length >= 6) {
                        setFormData({
                          ...formData,
                          newPassword: resetPassword,
                          confirmPassword: resetPassword,
                          hasPassword: true,
                        });
                        setPasswordValidationError("");
                        setSuccess("Password set successfully!");
                        setTimeout(() => setSuccess(""), 3000);
                      } else if (resetPassword) {
                        setPasswordValidationError("Password must be at least 6 characters");
                      }
                    }}
                    className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2 self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Set Password
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={formData.showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, newPassword: e.target.value });
                        setPasswordValidationError("");
                      }}
                      onBlur={(e) => {
                        if (e.target.value && e.target.value.length < 6) {
                          setPasswordValidationError("Password must be at least 6 characters");
                        } else {
                          setPasswordValidationError("");
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-sm sm:text-base text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition pr-10 sm:pr-12"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showNewPassword: !formData.showNewPassword })}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {formData.showNewPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {passwordValidationError && (
                    <p className="text-xs text-red-500 mt-2">{passwordValidationError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={formData.showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (passwordValidationError === "New passwords do not match") {
                          setPasswordValidationError("");
                        }
                      }}
                      onBlur={(e) => {
                        if (formData.newPassword && e.target.value && formData.newPassword !== e.target.value) {
                          setPasswordValidationError("New passwords do not match");
                        } else if (passwordValidationError === "New passwords do not match") {
                          setPasswordValidationError("");
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-sm sm:text-base text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition pr-10 sm:pr-12"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword })}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {formData.showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rules */}
          <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-3">
              Community Rules
            </label>
            
            {/* Existing Rules */}
            <div className="space-y-2 mb-4">
              {formData.rules.map((rule, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <span className="flex-shrink-0 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {index + 1}.
                  </span>
                  <p className="flex-1 text-xs sm:text-sm text-black dark:text-white">{rule}</p>
                  <button
                    onClick={() => handleRemoveRule(index)}
                    className="flex-shrink-0 p-1 text-red-500 hover:bg-red-500/10 rounded transition"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Rule */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={formData.newRule}
                onChange={(e) => setFormData({ ...formData, newRule: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddRule();
                  }
                }}
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-sm sm:text-base text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                placeholder="Add a new rule"
              />
              <button
                onClick={handleAddRule}
                className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Moderators */}
          {isAdmin && (
            <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-3">
                Moderators
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                Moderators can edit settings, remove posts, and manage the community
              </p>

              {/* Existing Moderators */}
              <div className="space-y-2 sm:space-y-3 mb-4">
                {moderators.map((mod) => (
                  <div key={mod.id || mod.username} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
                      <LiveProfilePhoto
                        imageSrc={mod.avatar}
                        videoSrc={null}
                        alt={mod.username}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-black dark:text-white truncate">{mod.username}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveModerator(mod)}
                      className="p-1.5 sm:p-2 text-red-500 hover:bg-red-500/10 rounded transition flex-shrink-0"
                      title="Remove moderator"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Moderator */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newModerator}
                  onChange={(e) => setNewModerator(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddModerator();
                    }
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-sm sm:text-base text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                  placeholder="Enter username to add as moderator"
                />
                <button
                  onClick={handleAddModerator}
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Members - owner and moderators can view and remove */}
          {(isAdmin || isModerator) && (
            <div className="bg-white dark:bg-[#121212] border border-black dark:border-gray-800 rounded-xl p-4 sm:p-5 md:p-6">
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-3">
                Members
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                View and remove members. Only the owner can add moderators; moderators can remove members.
              </p>
              {membersLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-60 overflow-y-auto">
                  {members.map((member) => {
                    const uid = typeof member === "string" ? member : member?.uid;
                    const username = typeof member === "string" ? null : member?.username;
                    const isCreator = uid === community?.creatorId;
                    return (
                      <div key={uid} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-300 dark:bg-gray-700">
                          {typeof member === "object" && member?.avatar && (
                            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-black dark:text-white truncate">
                            {username || uid || "Unknown"}
                            {isCreator && <span className="ml-1 text-primary text-xs">(Owner)</span>}
                          </p>
                        </div>
                        {!isCreator && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            className="p-1.5 sm:p-2 text-red-500 hover:bg-red-500/10 rounded transition flex-shrink-0"
                            title="Remove from community"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {members.length === 0 && !membersLoading && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No members yet.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Danger Zone - Only for Admins */}
          {isAdmin && (
            <div className="border border-red-500/30 rounded-lg p-4 sm:p-6 bg-red-500/5">
              <h3 className="text-base sm:text-lg font-bold text-red-500 mb-3 sm:mb-4 flex items-center gap-2">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Danger Zone
              </h3>
              
              {/* Delete Community */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Delete Community</h4>
                  <p className="text-xs sm:text-sm text-gray-400 mb-3">
                    Once you delete a community, there is no going back. This action is permanent.
                  </p>
                  <button
                    onClick={handleDeleteCommunity}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete This Community
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              onClick={() => setActiveView("detail")}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving || !formData.name.trim() || !formData.description.trim()}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary via-primary to-primary-700 hover:from-primary-700 hover:via-primary-700 hover:to-primary-800 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}