import { useState, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import MobileNav from "./components/layout/MobileNav";
import HomePage from "./pages/home/HomePage";
import ExplorePage from "./pages/explore/ExplorePage";
import MessagesPage from "./pages/messages/MessagesPage";
import ProfilePage from "./pages/profile/ProfilePage";
import ShopPage from "./pages/shop/ShopPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AuthCallback from "./pages/auth/AuthCallback";
import SetUsername from "./pages/auth/SetUsername";
import CreatePost from "./components/CreatePost";
import CommunitiesPage from "./pages/communities/CommunitiesPage";
import CreateCommunity from "./components/CreateCommunity";
import CommunityDetail from "./components/CommunityDetail";
import Notifications from "./components/Notifications";
import BookmarkedPostsPage from "./pages/saved/BookmarkedPostsPage";
import OtherUserProfile from "./components/OtherUserProfile";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import SignInGoogleRedirect from "./pages/auth/SignInGoogleRedirect";
import AITools from "./components/AITools";
import AddStory from "./components/AddStory";
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import SupportPage from "./pages/legal/SupportPage";
import AgeSuitabilityPage from "./pages/legal/AgeSuitabilityPage";

export default function App() {
  const { isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [, setSwipeDirection] = useState(0);

  // Swipe gesture detection for mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Legal / public pages stay available without waiting on auth.
  const isPublicLegalPage =
    location.pathname === "/privacy" ||
    location.pathname === "/terms" ||
    location.pathname === "/support" ||
    location.pathname === "/age-suitability";

  if (authLoading && !isPublicLegalPage) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Swipe gesture handlers for mobile navigation
  const handleTouchStart = (e) => {
    if (window.innerWidth >= 768) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (window.innerWidth >= 768) return;
    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;
    handleSwipeGesture();
  };

  const handleSwipeGesture = () => {
    const swipeThreshold = 75;
    const verticalThreshold = 50;
    
    const horizontalDistance = touchStartX.current - touchEndX.current;
    const verticalDistance = Math.abs(touchStartY.current - touchEndY.current);
    
    if (verticalDistance > verticalThreshold) return;
    
    const swipeablePages = ["/home", "/explore", "/messages", "/communities"];
    const currentIndex = swipeablePages.indexOf(location.pathname);
    
    if (currentIndex === -1) return;
    
    if (horizontalDistance > swipeThreshold) {
      const nextIndex = Math.min(currentIndex + 1, swipeablePages.length - 1);
      if (nextIndex !== currentIndex) {
        setSwipeDirection(-1);
        navigate(swipeablePages[nextIndex]);
      }
    }
    
    if (horizontalDistance < -swipeThreshold) {
      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex !== currentIndex) {
        setSwipeDirection(1);
        navigate(swipeablePages[prevIndex]);
      }
    }
  };

  const handleCreatePostClick = () => {
    setIsCreatePostOpen(true);
  };

  const handleViewUserProfile = (username) => {
    navigate(`/user/${username}`);
  };

  const isStoryPage = location.pathname === "/story/add";

  // Wrapper components to pass navigation props
  const HomePageWrapper = () => (
    <ErrorBoundary>
      <HomePage onViewUserProfile={handleViewUserProfile} />
    </ErrorBoundary>
  );
  
  const ExplorePageWrapper = () => (
    <ErrorBoundary>
      <ExplorePage onViewUserProfile={handleViewUserProfile} />
    </ErrorBoundary>
  );
  
  const MessagesPageWrapper = () => {
    const params = new URLSearchParams(location.search);
    const selectedChatUsername = params.get('user');
    return (
      <ErrorBoundary>
        <MessagesPage onViewUserProfile={handleViewUserProfile} selectedChatUsername={selectedChatUsername} />
      </ErrorBoundary>
    );
  };
  
  const ProfilePageWrapper = () => (
    <ErrorBoundary>
      <ProfilePage onLogout={handleLogout} onViewUserProfile={handleViewUserProfile} />
    </ErrorBoundary>
  );
  
  const CommunitiesPageWrapper = () => (
    <ErrorBoundary>
      <CommunitiesPage onViewUserProfile={handleViewUserProfile} />
    </ErrorBoundary>
  );
  
  const NotificationsWrapper = () => (
    <ErrorBoundary>
      <Notifications onViewUserProfile={handleViewUserProfile} />
    </ErrorBoundary>
  );
  
  const UserProfileWrapper = () => {
    const { username } = useParams();
    return (
      <ErrorBoundary>
        <OtherUserProfile username={username} onViewUserProfile={handleViewUserProfile} />
      </ErrorBoundary>
    );
  };
  
  const CommunityDetailWrapper = () => {
    const { id } = useParams();
    return (
      <ErrorBoundary>
        <CommunityDetail communityId={id} onViewUserProfile={handleViewUserProfile} />
      </ErrorBoundary>
    );
  };

  const AIToolsWrapper = () => (
    <ErrorBoundary>
      <AITools />
    </ErrorBoundary>
  );

  const BookmarkedPostsPageWrapper = () => (
    <ErrorBoundary>
      <BookmarkedPostsPage onViewUserProfile={handleViewUserProfile} />
    </ErrorBoundary>
  );

  return (
    <>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
    <Routes>
      {/* Public Routes - Accessible only when NOT authenticated */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/age-suitability" element={<AgeSuitabilityPage />} />
      
      {/* Frontend-only path for Google sign-in to avoid exposing backend URL in client */}
      <Route path="/auth/signin-google" element={<SignInGoogleRedirect />} />
      
      {/* OAuth Callback & Username Setup - Special handling */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/set-username" element={<SetUsername />} />

      {/* Protected Routes - Require authentication */}
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout 
            isStoryPage={isStoryPage}
            handleLogout={handleLogout}
            handleCreatePostClick={handleCreatePostClick}
            isCreatePostOpen={isCreatePostOpen}
            setIsCreatePostOpen={setIsCreatePostOpen}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
          >
            <Routes>
              <Route path="/home" element={<HomePageWrapper />} />
              <Route path="/explore" element={<ExplorePageWrapper />} />
              <Route path="/saved" element={<BookmarkedPostsPageWrapper />} />
              <Route path="/messages" element={<MessagesPageWrapper />} />
              <Route path="/profile" element={<ProfilePageWrapper />} />
              <Route path="/user/:username" element={<UserProfileWrapper />} />
              <Route path="/communities" element={<CommunitiesPageWrapper />} />
              <Route path="/ai-tools" element={<AIToolsWrapper />} />
              <Route path="/communities/create" element={<CreateCommunity />} />
              <Route path="/communities/:id" element={<CommunityDetailWrapper />} />
              <Route path="/notifications" element={<NotificationsWrapper />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/story/add" element={<AddStory />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
    </>
  );
}

// Separate layout component for authenticated routes
function AppLayout({ 
  children, 
  isStoryPage, 
  handleLogout, 
  handleCreatePostClick, 
  isCreatePostOpen, 
  setIsCreatePostOpen,
  handleTouchStart,
  handleTouchEnd
}) {

  return (
    <div 
      className="bg-secondary-50 dark:bg-black text-black dark:text-white min-h-screen flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {!isStoryPage && (
        <>
          <Navbar onCreatePostClick={handleCreatePostClick} />

          <div className="flex flex-1 overflow-hidden pb-14 md:pb-0">
            <Sidebar onLogout={handleLogout} />

            <div className="flex-1 md:ml-80 overflow-hidden bg-white dark:bg-black">
              <div className="h-full min-h-screen bg-white dark:bg-black">
                {children}
              </div>
            </div>
          </div>

          <MobileNav />
        </>
      )}

      {isStoryPage && children}

      <CreatePost
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
    </div>
  );
}
