import { useEffect, useState, useCallback, useRef } from 'react';
import { tokenManager, api } from "../../utils/httpClient";
import { toast } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AuthCallback() {
  const [processing, setProcessing] = useState(true);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const checkTimeoutRef = useRef(null);

  const validateUsername = useCallback((value) => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 30) return 'Username must be less than 30 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores allowed';
    return '';
  }, []);

  const checkUsernameAvailability = useCallback(async (value) => {
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
      const response = await api.get(`/api/users/${value.toLowerCase()}`);
      if (response.success && response.data) {
        setIsAvailable(false);
        setError('Username already taken');
      }
    } catch (err) {
      if (err.status === 404) {
        setIsAvailable(true);
        setError('');
      } else {
        setError('Could not check username');
      }
    } finally {
      setIsChecking(false);
    }
  }, [validateUsername]);

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
    setIsAvailable(null);
    setError('');
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }
    if (value.length >= 3) {
      checkTimeoutRef.current = setTimeout(() => checkUsernameAvailability(value), 500);
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (isAvailable !== true) {
      setError('Please choose an available username');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post('/api/auth/complete-username', { username });
      if (response.success && response.data) {
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.removeItem('pendingUsernameSetup');
        window.location.href = '/';
        return;
      }
      setError('Failed to set username');
    } catch (err) {
      const msg = err?.data?.error?.message || err?.message || 'Failed to set username. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokensParam = params.get('tokens');
      const errorParam = params.get('error');

      if (errorParam) {
        toast.error('Google login failed: ' + errorParam);
        window.location.href = '/login';
        return;
      }

      if (!tokensParam) {
        toast.error('No authentication tokens received');
        window.location.href = '/login';
        return;
      }

      try {
        const { accessToken, refreshToken, needsUsername } = JSON.parse(decodeURIComponent(tokensParam));

        tokenManager.setAccessToken(accessToken);
        tokenManager.setRefreshToken(refreshToken);
        const expiryTime = Date.now() + (2 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiry', expiryTime.toString());
        localStorage.setItem('authToken', accessToken);

        if (needsUsername) {
          sessionStorage.setItem('pendingUsernameSetup', 'true');
          setShowUsernameDialog(true);
          setProcessing(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.data) {
            const user = userData.data.user || userData.data;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        window.location.href = '/';
      } catch (err) {
        console.error('Callback error:', err);
        toast.error('Failed to complete login');
        window.location.href = '/login';
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, []);

  const loadingScreen = (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          width: '48px',
          height: '48px',
          border: '4px solid #ff5722',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ marginTop: '16px', color: '#ffffff' }}>Completing Google login...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (processing && !showUsernameDialog) {
    return loadingScreen;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      {/* Username dialog */}
      {showUsernameDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 24,
          }}
          onClick={(e) => e.target === e.currentTarget && null}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="username-dialog-title"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
              border: '1px solid #333',
              borderRadius: 16,
              padding: 32,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="username-dialog-title" style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Choose your username
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
              This username will be visible to everyone on the platform.
            </p>
            <form onSubmit={handleUsernameSubmit}>
              <label htmlFor="username-input" style={{ display: 'block', color: '#d1d5db', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Username
              </label>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="e.g. johndoe"
                autoFocus
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#111',
                  border: `1px solid ${error ? '#ef4444' : '#374151'}`,
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 16,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                3–30 characters. Letters, numbers, and underscores only.
              </p>
              {error && <p style={{ color: '#ef4444', fontSize: 14, marginTop: 8 }}>{error}</p>}
              {!error && isAvailable === true && <p style={{ color: '#22c55e', fontSize: 14, marginTop: 8 }}>Username is available</p>}
              <button
                type="submit"
                disabled={!username || isSubmitting || isChecking || isAvailable !== true}
                style={{
                  width: '100%',
                  marginTop: 24,
                  padding: '12px 24px',
                  background: (username && !isSubmitting && isAvailable === true) ? '#ff5722' : '#374151',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: (username && !isSubmitting && isAvailable === true) ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? 'Setting up...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showUsernameDialog ? null : loadingScreen}
    </div>
  );
}
