import React, { useState, useEffect } from "react";
import { ArrowLeft, Key } from "lucide-react";
import { communityService } from "../services/communityService";
import LiveProfilePhoto from "./LiveProfilePhoto";
import { getCommunityProfileVideoUrl } from "../utils/communityVideos";
import { DISCOVERY_CATEGORIES } from "../constants/communityCategories";

export default function DiscoverCommunities({ onBack }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [recommendedCommunities, setRecommendedCommunities] = useState([]);
  const [categoryCommunities, setCategoryCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joiningIds, setJoiningIds] = useState(new Set());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  const categories = DISCOVERY_CATEGORIES;

  useEffect(() => {
    fetchCommunities();
  }, [activeCategory]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch recommended communities (always shown)
      const recommended = await communityService.getPublicCommunities({ limit: 6 });
      setRecommendedCommunities(recommended || []);
      
      // Fetch category-specific communities if not "All"
      if (activeCategory !== "All") {
        const categoryData = await communityService.getPublicCommunities({
          category: activeCategory,
          limit: 6
        });
        setCategoryCommunities(categoryData || []);
      } else {
        setCategoryCommunities([]);
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError(err.message || 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (community) => {
    const communityId = community._id || community.id;
    if (joiningIds.has(communityId)) return;

    // Restricted communities cannot be joined
    if (community.type === "Restricted") {
      setError("This community is restricted. Only moderators can add members.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // For public communities, join directly without code
    if (community.type === "public" || community.type === "Public" || !community.type) {
      try {
        setJoiningIds(prev => new Set(prev).add(communityId));
        await communityService.joinCommunity(communityId);
        
        // Optimistic update - remove from lists after joining
        setRecommendedCommunities(prev => prev.filter(c => (c._id || c.id) !== communityId));
        setCategoryCommunities(prev => prev.filter(c => (c._id || c.id) !== communityId));
      } catch (err) {
        console.error('Error joining community:', err);
        setError("Failed to join community. Please try again.");
        setTimeout(() => setError(""), 5000);
      } finally {
        setJoiningIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(communityId);
          return newSet;
        });
      }
      return;
    }

    // For private communities, show code modal
    setSelectedCommunity(community);
    setShowCodeModal(true);
  };

  const handleCodeSubmit = async () => {
    if (!codeInput.trim()) {
      setCodeError("Please enter a community code.");
      return;
    }

    try {
      // If selectedCommunity is null, this is a direct join by code (not from the discover list)
      if (!selectedCommunity) {
        setJoiningIds(prev => new Set(prev).add('joining-by-code'));
        
        // Use the joinCommunityByCode endpoint
        await communityService.joinCommunityByCode(codeInput.trim().toUpperCase());
        
        setCodeError("");
        setShowCodeModal(false);
        setCodeInput("");
        
        // Show success message
        alert("Successfully joined the community!");
        
        // Refresh communities list
        await fetchCommunities();
        
        setJoiningIds(prev => {
          const newSet = new Set(prev);
          newSet.delete('joining-by-code');
          return newSet;
        });
        return;
      }

      // Original code verification logic for communities from the list
      const communityCode = selectedCommunity.code || selectedCommunity.id?.toString() || "";
      
      if (codeInput.trim().toUpperCase() !== communityCode.toUpperCase()) {
        setCodeError("Invalid community code. Please try again.");
        return;
      }

      setCodeError("");
      setShowCodeModal(false);
      setCodeInput("");

      // If private community, show password modal after code is correct
      if (selectedCommunity.type === "Private") {
        setShowPasswordModal(true);
      } else {
        // For public communities, join after code verification
        await joinCommunityAfterVerification();
      }
    } catch (err) {
      console.error('Error joining by code:', err);
      setCodeError(err.response?.data?.message || "Failed to join community. Please check the code and try again.");
    }
  };

  const handlePasswordSubmit = async () => {
    if (!selectedCommunity) return;

    // In a real app, verify password from API
    const correctPassword = selectedCommunity.password || "";

    if (!passwordInput.trim()) {
      setPasswordError("Please enter a password.");
      return;
    }

    if (passwordInput.trim() !== correctPassword && correctPassword) {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    setPasswordError("");
    setShowPasswordModal(false);
    setPasswordInput("");
    
    await joinCommunityAfterVerification();
  };

  const joinCommunityAfterVerification = async () => {
    if (!selectedCommunity) return;
    const communityId = selectedCommunity.id;

    try {
      setJoiningIds(prev => new Set(prev).add(communityId));
      await communityService.joinCommunity(communityId);
      
      // Optimistic update - remove from lists after joining
      setRecommendedCommunities(prev => prev.filter(c => c.id !== communityId));
      setCategoryCommunities(prev => prev.filter(c => c.id !== communityId));
    } catch (err) {
      console.error('Error joining community:', err);
      setError("Failed to join community. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setJoiningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(communityId);
        return newSet;
      });
      setSelectedCommunity(null);
    }
  };

  const CommunityCard = ({ community, onJoin, isJoining }) => {
    const communityId = community._id || community.id;
    return (
    <div className="bg-white dark:bg-[#0f0f0f] border border-black dark:border-gray-800 rounded-2xl p-4 hover:border-primary transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          <LiveProfilePhoto
            imageSrc={community.icon}
            videoSrc={getCommunityProfileVideoUrl(community._id || community.id, community.icon, community)}
            alt={community.name}
            className="w-12 h-12 rounded-xl"
            maxDuration={10}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-black dark:text-white font-medium">{community.name}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs">{community.members}</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 line-clamp-2">
            {community.description}
          </p>
        </div>
        {community.isJoined ? (
          <button
            disabled
            className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-full cursor-default flex-shrink-0"
          >
            Joined
          </button>
        ) : community.type === "Restricted" ? (
          <button
            disabled
            className="px-4 py-1.5 bg-gray-500/50 text-gray-400 text-sm font-medium rounded-full cursor-not-allowed flex-shrink-0"
            title="Restricted communities can only be joined by invitation"
          >
            Restricted
          </button>
        ) : (
          <button
            onClick={() => onJoin(community)}
            disabled={isJoining}
            className="px-4 py-1.5 bg-primary hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full transition-colors flex-shrink-0"
          >
            {isJoining ? 'Joining...' : 'Join'}
          </button>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fffcfa] dark:bg-[#0b0b0b] text-black dark:text-white pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-black dark:border-gray-800 px-4 md:px-6 py-4">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-black dark:text-white" />
          </button>
          <h1 className="text-lg md:text-2xl font-semibold">Discover more Communities</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {error && typeof error === 'string' && error.includes('restricted') && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
        
        {error && typeof error === 'string' && !error.includes('restricted') && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchCommunities}
              className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
        {/* Join with code - prominent entry point */}
        <div className="mb-8 p-4 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Key className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-black dark:text-white">Have a community code?</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Enter the code to join a specific community.</p>
            </div>
            <button
              onClick={() => {
                setSelectedCommunity(null);
                setCodeInput('');
                setCodeError('');
                setShowCodeModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700 transition whitespace-nowrap"
            >
              Join with code
            </button>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="mb-8">
          <h2 className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-4">What are you looking for?</h2>

          {/* Categories - Horizontal scroll on mobile */}
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0 ${activeCategory === category
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-400 hover:bg-secondary-100 dark:hover:bg-[#222] hover:text-black dark:hover:text-white border border-black dark:border-gray-800"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Section */}
        {recommendedCommunities.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white mb-4">Recommended for you</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedCommunities.map((community) => (
                <CommunityCard
                  key={community._id || community.id}
                  community={community}
                  onJoin={handleJoinCommunity}
                  isJoining={joiningIds.has(community._id || community.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category-Specific Section */}
        {activeCategory !== "All" && categoryCommunities.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white mb-4">{activeCategory}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onJoin={handleJoinCommunity}
                  isJoining={joiningIds.has(community._id || community.id)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && !error && recommendedCommunities.length === 0 && categoryCommunities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No communities found. Try a different category.
            </p>
          </div>
        )}
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Community Code Modal - shown for "Join with code" (no selected community) or when joining a private community from list */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#121212] rounded-xl p-6 max-w-md w-full border border-black dark:border-gray-800">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              {selectedCommunity ? 'Enter Community Code' : 'Join with a code'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {selectedCommunity
                ? 'Please enter the community code to join this community.'
                : 'Enter the 6-character code shared by the community to join.'}
            </p>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value);
                    setCodeError("");
                  }}
                  placeholder="Enter community code"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleCodeSubmit();
                    }
                  }}
                />
                {codeError && (
                  <p className="text-sm text-red-500 mt-2">{codeError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCodeModal(false);
                    setCodeInput("");
                    setCodeError("");
                    setSelectedCommunity(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCodeSubmit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedCommunity && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#121212] rounded-xl p-6 max-w-md w-full border border-black dark:border-gray-800">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Enter Password</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This is a private community. Please enter the password to join.
            </p>
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-gray-700 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handlePasswordSubmit();
                    }
                  }}
                />
                {passwordError && (
                  <p className="text-sm text-red-500 mt-2">{passwordError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput("");
                    setPasswordError("");
                    setSelectedCommunity(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}