import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PublicRoute Component
 * Prevents authenticated users from accessing public routes like login/register
 * Redirects authenticated users to home or to their intended destination (from state)
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to intended path (from state) or home
  if (isAuthenticated) {
    const from = location.state?.from?.pathname;
    const isValidFrom = typeof from === 'string' && from !== '' && from !== '/login' && from.startsWith('/');
    const to = isValidFrom ? from : '/home';
    return <Navigate to={to} state={location.state?.from?.state} replace />;
  }

  // User is not authenticated, allow access to public route
  return children;
};

export default PublicRoute;
