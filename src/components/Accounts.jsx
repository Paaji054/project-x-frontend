import React, { useRef, useState, useEffect } from "react";
import { userService } from "../services/userService";
import { Link } from "react-router-dom";

export default function Accounts({ searchQuery = "", hasSearched = false }) {
  const scrollRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedAccounts, setSuggestedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch search results when searchQuery changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery && searchQuery.trim() && hasSearched) {
        try {
          setLoading(true);
          const results = await userService.searchUsers(searchQuery, 12);
          setSearchResults(Array.isArray(results) ? results : results.users || []);
        } catch (error) {
          console.error("Error searching users:", error);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSearchResults();
  }, [searchQuery, hasSearched]);

  // Fetch suggested accounts on mount
  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        // Fetch random suggested users - using a space or wildcard to avoid empty query validation
        const results = await userService.searchUsers(" ", 8);
        setSuggestedAccounts(Array.isArray(results) ? results : results.users || []);
      } catch (error) {
        console.error("Error fetching suggested accounts:", error);
        setSuggestedAccounts([]);
      }
    };

    fetchSuggested();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-6 text-black dark:text-white">
      {/* Results Section - Only show if search has been performed */}
      {hasSearched && searchQuery && (
        <>
          <h2 className="text-lg md:text-xl font-semibold mb-5">
            Results for <span className="text-gray-600 dark:text-gray-300">"{searchQuery}"</span>
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="relative mb-12">
              {/* Scrollable Accounts Container */}
              <div
                ref={scrollRef}
                className="flex gap-6 md:gap-8 overflow-x-auto pb-4 scrollbar-hide"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {searchResults.map((account) => {
                  const username = account?.username;
                  if (!username) return null;
                  return (
                  <Link
                    key={account._id || account.id}
                    to={`/user/${username}`}
                    className="flex flex-col items-center min-w-[100px] md:min-w-[120px] flex-shrink-0"
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-3 border border-gray-300 dark:border-gray-600 hover:border-primary transition-all overflow-hidden">
                      {account.avatar ? (
                        <img 
                          src={account.avatar} 
                          alt={account.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
                      )}
                    </div>
                    <p className="text-sm md:text-base font-medium">
                      {account.username}
                    </p>
                    <p className="text-xs md:text-sm text-gray-400">
                      {account.displayName || account.name}
                    </p>
                  </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </>
      )}

      {/* Suggested Accounts Section */}
      <h3 className="text-lg md:text-xl font-semibold mb-5">
        Other Accounts You Could Follow
      </h3>

      {suggestedAccounts.length > 0 ? (
        <div className="flex flex-wrap gap-6 md:gap-8">
          {suggestedAccounts.map((account) => {
            const username = account?.username;
            if (!username) return null;
            return (
            <Link
              key={account._id || account.id}
              to={`/user/${username}`}
              className="flex items-center gap-4 border border-black dark:border-gray-700 rounded-lg px-4 py-3 md:px-6 md:py-4 hover:border-primary transition-all bg-white dark:bg-[#0f0f0f]"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                {account.avatar ? (
                  <img 
                    src={account.avatar} 
                    alt={account.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
                )}
              </div>
              <div>
                <p className="text-sm md:text-base font-medium">
                  {account.username}
                </p>
                <p className="text-xs md:text-sm text-gray-400">
                  {account.displayName || account.name}
                </p>
              </div>
            </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No suggested accounts available</p>
        </div>
      )}
    </div>
  );
}