import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Key } from "lucide-react";
import { communityService } from "../services/communityService";
import LiveBanner from "./LiveBanner";
import LiveProfilePhoto from "./LiveProfilePhoto";
import { getCommunityBannerVideoUrl, getCommunityProfileVideoUrl } from "../utils/communityVideos";

export default function JoinedCommunities({ onDiscoverClick }) {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinCodeLoading, setJoinCodeLoading] = useState(false);
  const [joinCodeError, setJoinCodeError] = useState("");
  const [joinCodeSuccess, setJoinCodeSuccess] = useState("");

  useEffect(() => {
    fetchJoinedCommunities();
  }, []);

  const fetchJoinedCommunities = async () => {
    try {
      console.log('fetchJoinedCommunities: Starting...');
      setLoading(true);
      setError(null);
      
      const data = await communityService.getUserCommunities();
      console.log('fetchJoinedCommunities: Received data:', data);
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        console.log('fetchJoinedCommunities: Data is array, setting communities');
        setCommunities(data);
      } else if (data && Array.isArray(data.communities)) {
        console.log('fetchJoinedCommunities: Data.communities is array, setting communities');
        setCommunities(data.communities);
      } else {
        console.log('fetchJoinedCommunities: No valid array found, setting empty array');
        setCommunities([]);
      }
    } catch (err) {
      console.error('Error fetching joined communities:', err);
      setError(err.message || 'Failed to load communities');
      // Set empty array on error to prevent undefined issues
      setCommunities([]);
    } finally {
      console.log('fetchJoinedCommunities: Setting loading to false');
      setLoading(false);
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    try {
      // Optimistic update - handle both _id and id
      setCommunities(prev => prev.filter(c => (c._id || c.id) !== communityId));
      await communityService.leaveCommunity(communityId);
    } catch (err) {
      console.error('Error leaving community:', err);
      // Revert on error
      fetchJoinedCommunities();
    }
  };

  const handleCommunityClick = (community) => {
    // Use slug if available, otherwise use ID
    const identifier = community.slug || community._id || community.id;
    navigate(`/communities/${identifier}`);
  };

  const handleJoinByCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinCodeError("Please enter a community code.");
      return;
    }
    setJoinCodeError("");
    setJoinCodeSuccess("");
    setJoinCodeLoading(true);
    try {
      await communityService.joinCommunityByCode(code);
      setJoinCode("");
      setJoinCodeSuccess("You joined the community successfully.");
      fetchJoinedCommunities();
      setTimeout(() => setJoinCodeSuccess(""), 4000);
    } catch (err) {
      setJoinCodeError(err.message || "Invalid or expired code. Please try again.");
    } finally {
      setJoinCodeLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-black dark:text-white">
            Communities you&apos;re in
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
            Pick up where you left off, join live sessions, or explore what&apos;s trending inside your circles.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Join with code - inline on Communities page */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a]">
              <Key className="w-4 h-4 text-primary flex-shrink-0" />
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                  setJoinCodeError("");
                }}
                placeholder="Community code"
                maxLength={6}
                className="w-28 px-2 py-1.5 rounded bg-white dark:bg-[#121212] border border-gray-300 dark:border-gray-600 text-black dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleJoinByCode}
                disabled={joinCodeLoading}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition whitespace-nowrap"
              >
                {joinCodeLoading ? "Joining…" : "Join"}
              </button>
            </div>
            {joinCodeError && <p className="text-sm text-red-500">{joinCodeError}</p>}
            {joinCodeSuccess && <p className="text-sm text-green-600 dark:text-green-400">{joinCodeSuccess}</p>}
          </div>
          <button
            onClick={onDiscoverClick}
            className="px-4 py-2 rounded-lg border border-black dark:border-gray-700 bg-white dark:bg-[#161616] text-sm text-gray-700 dark:text-gray-300 hover:border-primary hover:text-black dark:hover:text-white transition-all duration-300"
          >
            Discover more
          </button>
          <button
            onClick={() => navigate('/communities/create')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary via-primary to-primary-700 text-sm font-medium text-white hover:shadow-[0_0_24px_rgba(119,5,36,0.35)] transition-all duration-300"
          >
            Create community
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchJoinedCommunities}
            className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-700 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && communities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You haven&apos;t joined any communities yet.
          </p>
          <button
            onClick={onDiscoverClick}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary via-primary to-primary-700 text-white hover:shadow-[0_0_24px_rgba(119,5,36,0.35)] transition-all duration-300"
          >
            Discover communities
          </button>
        </div>
      )}

      {!loading && !error && communities.length > 0 && (
        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2">
          {communities.map((community) => (
          <article
            key={community._id || community.id}
            onClick={() => handleCommunityClick(community)}
            className="group relative rounded-3xl border border-black dark:border-gray-800 bg-white dark:bg-[#121212] transition-all duration-500 hover:border-primary hover:shadow-[0_0_35px_rgba(249,115,22,0.15)] cursor-pointer"
          >
            <div className="relative h-40 overflow-hidden rounded-t-3xl">
              <LiveBanner
                imageSrc={community.cover || community.icon || ''}
                videoSrc={getCommunityBannerVideoUrl(community._id || community.id, community.cover || community.icon, community)}
                alt={`${community.name || 'Community'} cover`}
                className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                maxDuration={10}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60 pointer-events-none" />
            </div>

            <div className="relative pt-12 pb-6 px-6">
              <div className="absolute -top-8 left-6">
                <div className="w-16 h-16 rounded-2xl border-4 border-[#121212] overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                  <LiveProfilePhoto
                    imageSrc={community.avatar || community.icon || ''}
                    videoSrc={getCommunityProfileVideoUrl(community._id || community.id, community.avatar || community.icon, community)}
                    alt={`${community.name || 'Community'} avatar`}
                    className="h-full w-full rounded-2xl"
                    maxDuration={10}
                  />
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-white">{community.name || 'Unnamed Community'}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                    {community.description || 'No description available'}
                  </p>
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-primary-400 bg-primary/10 border border-primary/40 px-3 py-1 rounded-full">
                  Active
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {community.membersCount || community.members?.length || 0} members
                </span>
                {community.topics && community.topics.length > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-700" />
                    <div className="flex flex-wrap items-center gap-2">
                      {community.topics.slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-xs font-medium text-primary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-primary/10 border border-secondary-300 dark:border-primary/30"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCommunityClick(community);
                  }}
                  className="flex-1 rounded-xl border border-black dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-all duration-300 hover:border-primary hover:text-black dark:hover:text-white"
                >
                  View latest posts
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveCommunity(community._id || community.id);
                  }}
                  className="rounded-xl border border-red-500 px-4 py-2 text-sm text-red-500 transition-all duration-300 hover:bg-red-500 hover:text-white"
                >
                  Leave
                </button>
              </div>
            </div>
          </article>
          ))}
        </div>
      )}
    </div>
  );
}