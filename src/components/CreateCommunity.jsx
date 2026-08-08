import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Lock, Upload, Sparkles, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { communityService } from "../services/communityService";
import { aiService } from "../services/aiService";
import { uploadService } from "../services/uploadService";
import { useUserProfile } from "../hooks/useUserProfile";
import { COMMUNITY_CATEGORIES } from "../constants/communityCategories";

export default function CreateCommunity({ setActiveView }) {
  const navigate = useNavigate();
  const { username } = useUserProfile();
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [communityType, setCommunityType] = useState("public");
  const [bannerPreview, setBannerPreview] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [bannerVideoPreview, setBannerVideoPreview] = useState(null);
  const [profileVideoPreview, setProfileVideoPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState("");

  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

  const handleGenerateIcon = async () => {
    if (!communityName.trim() || communityName.trim().length < 3) {
      toast.error('Enter a community name (3+ chars) first');
      return;
    }
    if (!description.trim() || description.trim().length < 3) {
      toast.error('Enter a description (3+ chars) first');
      return;
    }
    try {
      setIsGeneratingIcon(true);
      const result = await aiService.generateCommunityIcon(communityName.trim(), description.trim().slice(0, 200));
      if (result?.iconUrl) {
        setIconPreview(result.iconUrl);
        toast.success('Community icon generated!');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to generate icon');
    } finally {
      setIsGeneratingIcon(false);
    }
  };

  const topics = COMMUNITY_CATEGORIES;

  const handleTopicToggle = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

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

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result);
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
    if (newRule.trim() && rules.length < 10) {
      setRules([...rules, newRule.trim()]);
      setNewRule("");
    }
  };

  const handleRemoveRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const uploadMediaIfNeeded = async (value, folder) => {
    if (!value) return null;
    if (!value.startsWith("data:")) return value;
    const uploaded = await uploadService.uploadFromBase64(value, folder);
    return uploaded?.url || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = communityName.trim();
    const desc = description.trim();

    if (name.length < 3) {
      toast.error("Community name must be at least 3 characters");
      return;
    }
    if (name.length > 50) {
      toast.error("Community name must be 50 characters or less");
      return;
    }
    if (desc.length > 500) {
      toast.error("Description must be 500 characters or less");
      return;
    }

    if (selectedTopics.length === 0) {
      toast.error("Please select at least one topic", { duration: 3000 });
      return;
    }

    try {
      setIsCreating(true);
      setError("");

      const newCommunity = {
        name,
        description: desc,
        type: communityType,
        topics: selectedTopics,
        rules: rules.length > 0 ? rules : [],
      };

      if (bannerPreview) newCommunity.banner = await uploadMediaIfNeeded(bannerPreview, "community-banners");
      if (iconPreview) newCommunity.icon = await uploadMediaIfNeeded(iconPreview, "community-icons");
      if (bannerVideoPreview) newCommunity.bannerVideo = await uploadMediaIfNeeded(bannerVideoPreview, "community-banners");
      if (profileVideoPreview) newCommunity.profileVideo = await uploadMediaIfNeeded(profileVideoPreview, "community-icons");

      // Create community via API
      const response = await communityService.createCommunity(newCommunity);
      
      if (response && response.community) {
        const communityCode = response.community.code;
        const isPrivate = communityType.toLowerCase() === 'private';
        
        // Show appropriate message based on community type
        if (isPrivate) {
          toast.success(
            `Community created successfully!\n\nYour Community Code: ${communityCode}\n\nShare this code with others so they can join your private community.`,
            { duration: 5000 }
          );
        } else {
          toast.success('Community created successfully!', { duration: 3000 });
        }
        
        // Navigate back to communities page
        navigate('/communities');
      } else {
        throw new Error('Failed to create community');
      }
    } catch (err) {
      console.error("Error creating community:", err);
      const details = err.data?.error?.details?.[0]?.message;
      setError(details || err.message || "Failed to create community");
      toast.error(details || err.message || "Failed to create community");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fffcfa] dark:bg-[#0b0b0b] px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-black dark:text-white">Create Community</h1>
        </div>

        {/* Main Title */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-8">
          Tell us about your community
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Community Details */}
            <div className="space-y-6">
              {/* Community Name */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Community Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                  placeholder="Enter community name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Description <span className="text-primary">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition resize-none"
                  placeholder="Describe your community"
                />
              </div>

              {/* Community Banner */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Community Banner
                </label>
                <label className="w-full h-32 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:border-primary-400 transition flex items-center justify-center">
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-primary mx-auto mb-2" />
                      <span className="text-sm text-gray-400">Upload Image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 mb-1">
                  Live Banner Video (Optional)
                </label>
                <label className="w-full h-24 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:border-primary-400 transition flex items-center justify-center">
                  {bannerVideoPreview ? (
                    <video
                      src={bannerVideoPreview}
                      className="w-full h-full object-cover rounded-lg"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-5 h-5 text-primary/70 mx-auto mb-1" />
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

              {/* Community Icon */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-black dark:text-white">
                    Community Icon
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateIcon}
                    disabled={isGeneratingIcon}
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingIcon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isGeneratingIcon ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <label className="w-24 h-24 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-primary rounded-full cursor-pointer hover:border-primary-400 transition flex items-center justify-center overflow-hidden">
                  {iconPreview ? (
                    <img
                      src={iconPreview}
                      alt="Icon preview"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 mb-1">
                  Live Profile Video (Optional)
                </label>
                <label className="w-24 h-24 bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-primary/50 rounded-full cursor-pointer hover:border-primary-400 transition flex items-center justify-center overflow-hidden">
                  {profileVideoPreview ? (
                    <video
                      src={profileVideoPreview}
                      className="w-full h-full object-cover rounded-full"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-4 h-4 text-primary/70" />
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

            {/* Right Column - Topics and Type */}
            <div className="space-y-6">
              {/* Add Topics */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-3">
                  Add Topics <span className="text-primary">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicToggle(topic)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedTopics.includes(topic)
                          ? "bg-primary text-white border-2 border-primary"
                          : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-2 border-black dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                        }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Community Rules */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-3">
                  Community Rules (Optional)
                </label>
                <div className="space-y-3">
                  {rules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {index + 1}. {rule}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium px-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                      placeholder="Add a new rule..."
                      maxLength={200}
                      className="flex-1 px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-black dark:border-gray-700 rounded-lg text-black dark:text-white focus:outline-none focus:border-primary text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddRule}
                      disabled={!newRule.trim() || rules.length >= 10}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {rules.length}/10 rules • Press Enter to add
                  </p>
                </div>
              </div>

              {/* Community Type */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-3">
                  Community Type <span className="text-primary">*</span>
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setCommunityType("public")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition ${communityType === "public"
                        ? "bg-primary/20 border-primary text-black dark:text-white"
                        : "bg-gray-100 dark:bg-gray-900 border-black dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                      }`}
                  >
                    <Globe className="w-5 h-5" />
                    <span className="font-medium">Public</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommunityType("private")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition ${communityType === "private"
                        ? "bg-primary/20 border-primary text-black dark:text-white"
                        : "bg-gray-100 dark:bg-gray-900 border-black dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                      }`}
                  >
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Private</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-primary via-primary to-primary-700 hover:from-primary-700 hover:via-primary-700 hover:to-primary-800 text-white font-medium rounded-lg transition"
            >
              Create Community
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}