'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '../shop/Navbar';
import AuthButton from '../components/AuthButton';
import "./owned.css";
import "../shop/shop.css";

type OwnedProduct = {
  id: string;
  purchasedAt: string;
  downloadCount: number;
  lastDownloadAt: string | null;
  product: {
    id: string;
    title: string;
    subtitle: string | null;
    description: string;
    thumbnailUrl: string;
    fileUrl: string | null;
    status: string;
  };
};

export default function OwnedProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ownedProducts, setOwnedProducts] = useState<OwnedProduct[]>([]);
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
      fetchOwnedProducts();
    }
  }, [session]);

  const fetchOwnedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/owned-products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch owned products');
      }

      const data = await response.json();
      setOwnedProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (productId: string, fileUrl: string) => {
    if (!fileUrl) {
      alert('Download file not available');
      return;
    }

    window.open(fileUrl, '_blank');

    try {
      await fetch(`/api/user/owned-products/${productId}/download`, {
        method: 'POST',
      });
      fetchOwnedProducts();
    } catch (err) {
      console.error('Failed to update download count:', err);
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
        <h1 className="hero-title" style={{ fontSize: '100px' }}>MY LIBRARY</h1>
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
              background: '#246E76',
              color: 'white',
              position: 'relative',
              top:'10px',
              border: 'none',
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
              background: 'transparent',
              color: 'white',
               position: 'relative',
              top:'10px',
              border: '2px solid #246E76',
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

        {ownedProducts.length === 0 ? (
          <div style={{
            background: '#151515',
            borderRadius: '18px',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#9e9e9e'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>📦</div>
            <h3 style={{ color: 'white', marginBottom: '10px' }}>No products yet</h3>
            <p>Products you purchase will appear here</p>
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {ownedProducts.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#151515',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Product Image */}
                <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                  <img
                    src={item.product.thumbnailUrl}
                    alt={item.product.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {item.product.status === 'ARCHIVED' && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#ff9800',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Archived
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ 
                    color: 'white', 
                    marginBottom: '8px',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {item.product.title}
                  </h3>
                  <p style={{ 
                    color: '#9e9e9e', 
                    fontSize: '14px',
                    marginBottom: '12px',
                    flex: 1
                  }}>
                    {item.product.subtitle}
                  </p>

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <div>
                      📅 {new Date(item.purchasedAt).toLocaleDateString()}
                    </div>
                    <div>
                      ⬇️ {item.downloadCount} downloads
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(item.id, item.product.fileUrl || '')}
                    disabled={!item.product.fileUrl}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: item.product.fileUrl ? '#246E76' : '#555',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: item.product.fileUrl ? 'pointer' : 'not-allowed',
                      fontSize: '15px',
                      fontWeight: '600',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (item.product.fileUrl) {
                        e.currentTarget.style.background = '#1d5b61';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item.product.fileUrl) {
                        e.currentTarget.style.background = '#246E76';
                      }
                    }}
                  >
                    {item.product.fileUrl ? 'Download' : 'Not Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
