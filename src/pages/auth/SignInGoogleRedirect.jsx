import { useEffect } from 'react';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api';

/**
 * Redirects to the backend Google OAuth endpoint.
 * Used so the "Sign in with Google" button points to a frontend path (/auth/signin-google)
 * and the backend URL is not exposed in the client interface.
 */
export default function SignInGoogleRedirect() {
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || API_CONFIG.BASE_URL;
    const url = `${apiBase}${API_ENDPOINTS.AUTH.GOOGLE}`;
    window.location.href = url;
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            width: '48px',
            height: '48px',
            border: '4px solid #ff5722',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ marginTop: '16px', color: '#ffffff' }}>Redirecting to sign in...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
