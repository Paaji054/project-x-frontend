import { useEffect } from 'react';
import { tokenManager } from "../../utils/httpClient";

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      // Parse URL parameters
      const params = new URLSearchParams(window.location.search);
      const tokensParam = params.get('tokens');
      const error = params.get('error');

      if (error) {
        console.error('OAuth error:', error);
        alert('Google login failed: ' + error);
        window.location.href = '/';
        return;
      }

      if (tokensParam) {
        try {
          const { accessToken, refreshToken, needsUsername } = JSON.parse(decodeURIComponent(tokensParam));
          
          // Store tokens
          tokenManager.setAccessToken(accessToken);
          tokenManager.setRefreshToken(refreshToken);
          
          // Set token expiry (2 hours from now)
          const expiryTime = Date.now() + (2 * 60 * 60 * 1000);
          localStorage.setItem('tokenExpiry', expiryTime.toString());
          localStorage.setItem('authToken', accessToken);
          
          // Check if user needs to set username (Google OAuth new users)
          if (needsUsername) {
            // Store flag temporarily to prevent direct access bypass
            sessionStorage.setItem('pendingUsernameSetup', 'true');
            window.location.href = '/set-username';
            return;
          }
          
          // Fetch user data
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include' // Important: include cookies
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.success && userData.data) {
              // Backend returns { data: { user } }
              const user = userData.data.user || userData.data;
              localStorage.setItem('user', JSON.stringify(user));
            }
          }
          
          // Redirect to home - reload to trigger auth state update
          window.location.href = '/';
        } catch (err) {
          console.error('Failed to parse tokens:', err);
          alert('Failed to complete login');
          window.location.href = '/';
        }
      } else {
        alert('No authentication tokens received');
        window.location.href = '/';
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          width: '48px',
          height: '48px',
          border: '4px solid #ff5722',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: '#ffffff' }}>Completing Google login...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
