'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import LoginPopup from './LoginPopup';
import './auth-button.css';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'CUSTOMER'>('CUSTOMER');
  const [loadingRole, setLoadingRole] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi viewport mobile
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Ambil role user begitu session siap
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user?.email) {
        setLoadingRole(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/check-role');
        const data = await response.json();
        if (data.role) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoadingRole(false);
      }
    };

    if (status !== 'loading') {
      fetchUserRole();
    }
  }, [session, status]);

  // KONTEN YANG DI-INJECT UNTUK MOBILE (di bawah tombol bahasa)
  const getMobileContent = () => {
    // Loading di mobile
    if (status === 'loading') {
      return `
        <div style="padding: 10px 12px; text-align: center;">
          <div style="
            background: #246E76;
            color: #ffffff;
            border-radius: 10px;
            padding: 10px 18px;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.18);
          ">
            ${t.auth.loading}
          </div>
        </div>
      `;
    }

    // USER SUDAH LOGIN (MOBILE)
    if (session?.user) {
      return `
        <div style="
          padding: 12px 14px;
          border-top: 1px solid rgba(0,0,0,0.08);
          margin-top: 10px;
          font-family: 'Poppins', sans-serif;
        ">
          <div style="
            padding: 8px 0 10px;
            margin-bottom: 8px;
            border-bottom: 1px solid #eeeeee;
          ">
            <p style="
              margin: 0 0 4px 0;
              color: #333333;
              font-weight: 600;
              font-size: 14px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            ">
              ${session.user.name || 'User'}
            </p>
            <p style="
              margin: 0;
              color: #666666;
              font-size: 12px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            ">
              ${session.user.email || ''}
            </p>

            ${!loadingRole ? `
              <span style="
                display: inline-block;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 600;
                background: ${userRole === 'ADMIN' ? '#246E76' : '#e0e0e0'};
                color: ${userRole === 'ADMIN' ? '#ffffff' : '#666666'};
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 6px;
              ">
                ${userRole}
              </span>
            ` : ''}
          </div>

          <button
            id="mobile-library-btn"
            style="
              width: 100%;
              padding: 9px 0;
              background: transparent;
              color: #333333;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 500;
              text-align: left;
              display: flex;
              align-items: center;
              gap: 8px;
            "
          >
            📚 ${t.auth.myLibrary}
          </button>

          <button
            id="mobile-purchases-btn"
            style="
              width: 100%;
              padding: 9px 0;
              background: transparent;
              color: #333333;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 500;
              text-align: left;
              display: flex;
              align-items: center;
              gap: 8px;
            "
          >
            🛒 ${t.auth.purchaseHistory}
          </button>

          <button
            id="mobile-signout-btn"
            style="
              width: 100%;
              padding: 9px 0;
              background: transparent;
              color: #f44336;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              text-align: left;
              margin-top: 2px;
              display: flex;
              align-items: center;
              gap: 8px;
            "
          >
            🚪 ${t.auth.signOut}
          </button>
        </div>
      `;
    }

     // BELUM LOGIN DI MOBILE → TOMBOL LOGIN (DIPERKECIL)
  return `
    <button
      id="mobile-login-btn"
      style="
        width: 80%;
        margin-left: 10%;
        padding: 7px 10px;
        background: #2fafbeff;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        margin-top: 8px;
        box-shadow: 0 3px 9px rgba(0,0,0,0.16);
      "
    >
      ${t.auth.login}
    </button>
  `;

  };

  // EVENT LISTENER UNTUK BUTTON MOBILE
  const attachEventListeners = () => {
    const loginBtn = document.getElementById('mobile-login-btn');
    const libraryBtn = document.getElementById('mobile-library-btn');
    const purchasesBtn = document.getElementById('mobile-purchases-btn');
    const signoutBtn = document.getElementById('mobile-signout-btn');

    if (loginBtn) {
      loginBtn.onclick = () => setShowLogin(true);
    }
    if (libraryBtn) {
      libraryBtn.onclick = () => router.push('/owned-products');
    }
    if (purchasesBtn) {
      purchasesBtn.onclick = () => router.push('/purchases');
    }
    if (signoutBtn) {
      signoutBtn.onclick = () => signOut({ callbackUrl: '/' });
    }
  };

  // Inject HTML ke placeholder mobile navbar
  useEffect(() => {
    if (!isMobile) return;

    const placeholder = document.getElementById('mobile-auth-placeholder');
    if (!placeholder) return;

    placeholder.innerHTML = getMobileContent();
    attachEventListeners();
  }, [session, status, loadingRole, userRole, isMobile, t]);

  // DESKTOP: LOADING STATE
  if (status === 'loading' && !isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '30px',
          zIndex: 200,
        }}
      >
        <div
          style={{
            background: '#246E76',
            color: '#fff',
            borderRadius: '10px',
            padding: '10px 18px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {t.auth.loading}
        </div>
      </div>
    );
  }

  // DESKTOP: USER SUDAH LOGIN → AVATAR + DROPDOWN
  if (session?.user && !isMobile) {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '30px',
            zIndex: 200,
          }}
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="auth-avatar-btn"
          >
            {session.user.name?.charAt(0).toUpperCase() ||
              session.user.email?.charAt(0).toUpperCase() ||
              'U'}
          </button>

          {menuOpen && (
            <>
              {/* overlay klik luar */}
              <div
                onClick={() => setMenuOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 199,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '60px',
                  right: '0',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  padding: '8px',
                  minWidth: '260px',
                  zIndex: 200,
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #eee',
                    marginBottom: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '5px',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: '#333',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingRight: '8px',
                      }}
                    >
                      {session.user.name || 'User'}
                    </p>
                    {!loadingRole && (
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background:
                            userRole === 'ADMIN' ? '#246E76' : '#e0e0e0',
                          color: userRole === 'ADMIN' ? '#ffffff' : '#666666',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          flexShrink: 0,
                        }}
                      >
                        {userRole}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: '#666',
                      fontSize: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {session.user.email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    router.push('/owned-products');
                    setMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '4px',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#f5f5f5')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <span style={{ fontSize: '18px' }}>📚</span>
                  {t.auth.myLibrary}
                </button>

                <button
                  onClick={() => {
                    router.push('/purchases');
                    setMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '4px',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#f5f5f5')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <span style={{ fontSize: '18px' }}>🛒</span>
                  {t.auth.purchaseHistory}
                </button>

                <button
                  onClick={() => {
                    signOut({ callbackUrl: '/' });
                    setMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    color: '#f44336',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '4px',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#fff5f5')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <span style={{ fontSize: '18px' }}>🚪</span>
                  {t.auth.signOut}
                </button>
              </div>
            </>
          )}
        </div>
        {showLogin && <LoginPopup onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  // DESKTOP: BELUM LOGIN → TOMBOL LOGIN
  if (!session?.user && !isMobile) {
    return (
      <>
        <button
          onClick={() => setShowLogin(true)}
          className="auth-login-btn"
          style={{
            position: 'fixed',
            top: '20px',
            right: '30px',
            zIndex: 200,
          }}
        >
          {t.auth.login}
        </button>
        {showLogin && <LoginPopup onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  // MOBILE: tombol/menu muncul dari inject, tapi popup tetap dari sini
  return showLogin ? <LoginPopup onClose={() => setShowLogin(false)} /> : null;
}
