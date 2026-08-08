import React, { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import PostCard from "../../components/PostCard";
import PostDetailModal from "../../components/PostDetailModal";
import { postService } from "../../services/postService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

export default function BookmarkedPostsPage({ onViewUserProfile }) {
  const { user } = useAuth();
  const currentUserId = user?.uid || user?.id || user?._id;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const fetchBookmarkedPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getBookmarkedPosts(50, 0);
      setPosts(response.posts || []);
    } catch (err) {
      console.error("Error fetching bookmarked posts:", err);
      setError(err.message || "Failed to load bookmarked posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarkedPosts();
  }, []);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  const handleBookmarkChange = (postId, isSaved) => {
    if (!isSaved) {
      setPosts((prev) => prev.filter((p) => String(p._id || p.id) !== String(postId)));
    } else {
      setPosts((prev) =>
        prev.map((p) =>
          String(p._id || p.id) === String(postId) ? { ...p, isSaved: true } : p
        )
      );
    }
  };

  return (
    <main className="h-full overflow-y-auto bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Bookmark className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">Bookmarked Posts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Posts you saved for later</p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchBookmarkedPosts}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-700 transition"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">No bookmarked posts yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tap the bookmark icon on a post to save it here.
            </p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {posts.map((post) => (
              <PostCard
                key={post._id || post.id}
                post={post}
                postId={post._id || post.id}
                onViewUserProfile={onViewUserProfile}
                onClick={() => handlePostClick(post)}
                onBookmarkChange={handleBookmarkChange}
              />
            ))}
          </div>
        )}
      </div>

      <PostDetailModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        onViewUserProfile={onViewUserProfile}
        currentUserId={currentUserId}
        onBookmarkChange={handleBookmarkChange}
      />
    </main>
  );
}
