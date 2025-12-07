'use client';
import React, { useState, useEffect } from 'react';
import './popup.css';

interface RegisterPopupProps {
  onBack: () => void;
  onClose: () => void;
}

export default function RegisterPopup({ onBack, onClose }: RegisterPopupProps) {
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    name: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const isValidEmail = (email: string) => {
    // Basic but stricter email pattern: no spaces, must have domain and TLD 2+ chars
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      const emailNote = data.emailSent === false
        ? ' (Verification email could not be sent; please request a new token from the login screen.)'
        : ' Check your email for the 6-digit verification code.';

      setSuccess(`Registration successful.${emailNote}`);
      setLoading(false);
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration');
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

          <h2 className="popupTitle">Sign Up</h2>

          <form onSubmit={handleRegister} className="popupForm">
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="popupInput"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Full Name (optional)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="popupInput"
              disabled={loading}
            />
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
              placeholder="Password (min. 8 characters)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="popupInput"
              disabled={loading}
            />
            {error && <p className="popupError">{error}</p>}
            {success && <p className="popupError" style={{ color: '#22c55e' }}>{success}</p>}
            <button 
              type="submit" 
              className="popupBtnMain"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Get Started'}
            </button>
          </form>

          <p 
            className="popupSwitchText" 
            onClick={() => !loading && onBack()}
            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Already have an account? <span>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
}
