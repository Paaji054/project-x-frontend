import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
import logo from '../../assets/logo.svg';
import { api } from '../../utils/httpClient';
import { toast } from 'react-hot-toast';

export default function SetUsername() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Ensure user came from OAuth flow
  useEffect(() => {
    const hasPendingSetup = sessionStorage.getItem('pendingUsernameSetup');
    if (!hasPendingSetup) {
      // Redirect to home if not from OAuth flow
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const validateUsername = (value) => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 30) return 'Username must be less than 30 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores allowed';
    return '';
  };

  const checkUsernameAvailability = async (value) => {
    if (!value || value.length < 3) {
      setIsAvailable(null);
      return;
    }

    const validationError = validateUsername(value);
    if (validationError) {
      setError(validationError);
      setIsAvailable(false);
      return;
    }

    setIsChecking(true);
    setError('');
    
    try {
      // Check if username exists
      const response = await api.get(`/api/users/username/${value.toLowerCase()}`);
      // If we get a user back, username is taken
      if (response.success && response.data) {
        setIsAvailable(false);
        setError('Username already taken');
      }
    } catch (err) {
      // 404 means username is available
      if (err.response?.status === 404) {
        setIsAvailable(true);
        setError('');
      } else {
        console.error('Error checking username:', err);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
    
    // Clear previous state
    setIsAvailable(null);
    setError('');
    
    // Debounce check
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isAvailable) {
      setError('Please choose an available username');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await api.post('/api/auth/complete-username', { username });
      
      if (response.success) {
        // Update local storage with new user data
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Clear the pending setup flag
        sessionStorage.removeItem('pendingUsernameSetup');
        
        toast.success('Username set successfully!');
        
        // Redirect to home
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (err) {
      console.error('Error setting username:', err);
      setError(err.response?.data?.message || 'Failed to set username. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="Logo" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Choose Your Username</h1>
          <p className="text-gray-400">This will be your unique identity on the platform</p>
        </div>

        {/* Form Card */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="yourname"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                  disabled={isSubmitting}
                  autoFocus
                />
                
                {/* Status Icons */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isChecking && (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  )}
                  {!isChecking && isAvailable === true && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {!isChecking && isAvailable === false && (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              
              {/* Error or Success Message */}
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
              {!error && isAvailable === true && (
                <p className="mt-2 text-sm text-green-500">✓ Username is available!</p>
              )}
              
              {/* Helper Text */}
              <p className="mt-2 text-xs text-gray-500">
                3-30 characters. Letters, numbers, and underscores only.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isAvailable || isSubmitting || isChecking}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white font-semibold rounded-lg hover:from-red-700 hover:via-red-800 hover:to-red-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-400">
              <span className="text-red-500 font-semibold">Important:</span> Your username cannot be changed later, so choose carefully!
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Tips: Keep it simple, memorable, and professional
          </p>
        </div>
      </motion.div>
    </div>
  );
}
