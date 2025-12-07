// src/app/purchases/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '../shop/Navbar';
import AuthButton from '../components/AuthButton';
import './purchase.css';
import '../shop/shop.css';

type Purchase = {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  completedAt: string | null;
  items: {
    id: string;
    priceAtPurchase: number;
    product: {
      id: string;
      title: string;
      thumbnailUrl: string;
      status: string;
    };
  }[];
};

export default function MyPurchasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchPurchases();
    }
  }, [session]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/purchases');
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }

      const data = await response.json();
      setPurchases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#4caf50';
      case 'PENDING': return '#ff9800';
      case 'REFUNDED': return '#607d8b';
      case 'FAILED': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'PENDING': return 'Pending';
      case 'REFUNDED': return 'Canceled';
      case 'FAILED': return 'Failed';
      default: return status;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #237b79, #2e9aa1)',
        color: 'white',
        fontSize: '20px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <main className="library-page">
      <header className="hero" style={{ paddingBottom: '40px' }}>
        <nav className="topbar">
          <div className="nav-items">
            <Navbar />
            <AuthButton />
          </div>
        </nav>
        <h1 className="hero-title" style={{ fontSize: '90px' }}>PURCHASE HISTORY</h1>
      </header>

      <section style={{
        maxWidth: '1200px',
        margin: '-40px auto 60px',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Quick Navigation */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '30px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => router.push('/owned-products')}
            onMouseEnter={() => setHoveredBtn('library')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              padding: '10px 40px',
              background: 'transparent',
              color: 'white',
              position: 'relative',
              top:'10px',
              border: '2px solid #246E76',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              transform: hoveredBtn === 'library' ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: hoveredBtn === 'library' 
                ? '0 8px 20px rgba(36, 110, 118, 0.4)' 
                : '0 4px 10px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            My Library
          </button>
          <button
            onClick={() => router.push('/purchases')}
            onMouseEnter={() => setHoveredBtn('history')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              padding: '10px 20px',
              background: '#246E76',
              color: 'white',
              border: 'none',
              position: 'relative',
              top:'10px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              transform: hoveredBtn === 'history' ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: hoveredBtn === 'history' 
                ? '0 8px 20px rgba(36, 110, 118, 0.4)' 
                : '0 4px 10px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            Purchase History
          </button>
        </div>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {purchases.length === 0 ? (
          <div style={{
            background: '#151515',
            borderRadius: '18px',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#9e9e9e'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🛒</div>
            <h3 style={{ color: 'white', marginBottom: '10px' }}>No purchases yet</h3>
            <p>Start shopping to see your purchase history here</p>
            <button
              onClick={() => router.push('/shop')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'var(--teal)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Go to Shop
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                style={{
                  background: '#151515',
                  borderRadius: '18px',
                  padding: '24px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)'
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div>
                    <div style={{ color: '#9e9e9e', fontSize: '14px', marginBottom: '5px' }}>
                      Order ID: {purchase.id.slice(0, 8)}
                    </div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                      IDR {purchase.totalAmount.toLocaleString()}
                    </div>
                    <div style={{ color: '#9e9e9e', fontSize: '14px', marginTop: '5px' }}>
                      {new Date(purchase.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div style={{
                    background: getStatusColor(purchase.paymentStatus),
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {getStatusText(purchase.paymentStatus)}
                  </div>
                </div>

                {/* Items */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {purchase.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={item.product.thumbnailUrl}
                        alt={item.product.title}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                          {item.product.title}
                        </div>
                        <div style={{ color: '#9e9e9e', fontSize: '14px' }}>
                          IDR {item.priceAtPurchase.toLocaleString()}
                        </div>
                        {item.product.status === 'ARCHIVED' && (
                          <div style={{
                            color: '#ff9800',
                            fontSize: '12px',
                            marginTop: '4px'
                          }}>
                            ⚠️ Product archived
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Info */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#9e9e9e',
                  fontSize: '14px'
                }}>
                  <div>Payment Method: {purchase.paymentMethod.replace('_', ' ')}</div>
                  {purchase.completedAt && (
                    <div>
                      Completed: {new Date(purchase.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
