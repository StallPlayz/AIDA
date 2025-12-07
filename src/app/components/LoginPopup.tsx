'use client';
import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RegisterPopup from './RegisterPopup';
import './popup.css';

interface LoginPopupProps {
  onClose: () => void;
}

export default function LoginPopup({ onClose }: LoginPopupProps) {
  const router = useRouter();
  const { update } = useSession();
  const [showRegister, setShowRegister] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showVerify, setShowVerify] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInfo('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'VERIFICATION_REQUIRED' || result.error?.includes('VERIFICATION_REQUIRED')) {
          setShowVerify(true);
          setInfo('Verification required. Check your email for a 6-digit code.');
          setLoading(false);
          return;
        }
        setError(result.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        setSuccess('Login successful! Redirecting...');
        // Update the session state immediately
        setTimeout(() => {
          router.refresh();
          handleClose();
        }, 500);
        return;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 350);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const card = document.querySelector('.popupCard');
      if (card && !card.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (showRegister)
    return <RegisterPopup onBack={() => setShowRegister(false)} onClose={onClose} />;

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, token: verifyToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid token');
        setLoading(false);
        return;
      }
      setSuccess('Sign up successful, please login.');
      setShowVerify(false);
      setVerifyToken('');
      setLoading(false);
    } catch (err) {
      setError('Failed to verify token');
      setLoading(false);
    }
  };

  return (
    <div className={`popupOverlay ${closing ? 'closing' : ''}`}>
      <div className="popupCard">
        <div className="popupLeft">
          <img src="/aida-star.webp" alt="Logo" className="popupLogoLarge" />
        </div>

        <div className="popupRight">
          <img 
            src="/aida-star.webp" 
            alt="Logo" 
            className="popupLogoSmall" 
            onClick={handleClose} 
            style={{ cursor: 'pointer' }}
          />

          <h2 className="popupTitle">Login</h2>

          {!showVerify ? (
            <form onSubmit={handleLogin} className="popupForm">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="popupInput"
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="popupInput"
                disabled={loading}
              />
              {error && <p className="popupError" style={{ color: '#d32f2f' }}>{error}</p>}
              {info && <p className="popupError" style={{ color: '#0ea5e9' }}>{info}</p>}
              {success && <p className="popupError" style={{ color: '#4caf50' }}>{success}</p>}
              <button 
                type="submit" 
                className="popupBtnMain"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="popupDivider"></div>

              <button
                type="button"
                className="popupBtnGoogle"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <img 
                  src="https://www.svgrepo.com/show/475656/google-color.svg" 
                  alt="Google" 
                  width={'18px'}
                />
                Sign in with Google
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerification} className="popupForm">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="popupInput"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Enter 6-digit token"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="popupInput"
                disabled={loading}
              />
              {error && <p className="popupError" style={{ color: '#d32f2f' }}>{error}</p>}
              {info && <p className="popupError" style={{ color: '#0ea5e9' }}>{info}</p>}
              {success && <p className="popupError" style={{ color: '#4caf50' }}>{success}</p>}
              <button 
                type="submit" 
                className="popupBtnMain"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <div className="popupDivider"></div>
              <button
                type="button"
                className="popupBtnGoogle"
                onClick={async () => {
                  setError('');
                  setInfo('');
                  setSuccess('');
                  setLoading(true);
                  try {
                    await fetch('/api/auth/send-token', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: formData.email }),
                    });
                    setInfo('A new token has been sent.');
                  } catch (err) {
                    setError('Failed to resend token');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Resend Token
              </button>
            </form>
          )}

          <p 
            className="popupSwitchText" 
            onClick={() => !loading && setShowRegister(true)}
            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Create Your Account →
          </p>
        </div>
      </div>
    </div>
  );
}
