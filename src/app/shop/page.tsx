// src/app/shop/page.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import CartModal from "./CartModal";
import "./Cart.css";
import Navbar from "./Navbar";
import AuthButton from "../components/AuthButton";
import AdminProductManager from "../components/AdminProductManager";
import { useLanguage } from "../contexts/LanguageContext";
import "./shop.css";
import "../globals.css";

type DBProduct = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  price: number;
  thumbnailUrl: string;
  category: string;
  status: string;
  viewCount: number;
  featured: boolean;
  discountType?: "NONE" | "PERCENT" | "FIXED";
  discountValue?: number;
};

export type Product = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  image: string;
  category: string;
  status: string;
  viewCount: number;
  featured: boolean;
  discountType?: "NONE" | "PERCENT" | "FIXED";
  discountValue?: number;
};

type CartItem = {
  id: string;
  productId: string;
  addedAt: string;
  product: DBProduct;
};

export default function Page() {
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPanelVisible, setAdminPanelVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const { t } = useLanguage();
  // Align cart and user buttons visually; user button sits at right:30, so offset cart by ~70px
  const cartButtonRight = session?.user ? 100 : 140;
  const adminAnimTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/auth/check-role");
          const data = await response.json();
          setIsAdmin(data.role === "ADMIN");
        } catch (err) {
          console.error("Error checking admin status:", err);
        }
      }
    };

    if (status !== "loading") {
      checkAdmin();
    }
  }, [session, status]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle admin panel mount for exit animation
  useEffect(() => {
    if (showAdminPanel) {
      setAdminPanelVisible(true);
      if (adminAnimTimeout.current) clearTimeout(adminAnimTimeout.current);
    } else if (adminPanelVisible) {
      adminAnimTimeout.current = setTimeout(() => setAdminPanelVisible(false), 260);
    }
    return () => {
      if (adminAnimTimeout.current) clearTimeout(adminAnimTimeout.current);
    };
  }, [showAdminPanel, adminPanelVisible]);

  // Fetch cart when user logs in
  useEffect(() => {
    if (session?.user) {
      fetchCart();
      fetchOwned();
    } else {
      setCartItems([]);
      setOwnedIds(new Set());
    }
  }, [session]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data: DBProduct[] = await response.json();
      const transformedProducts: Product[] = data.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle || "",
        description: p.description,
        price: p.price,
        image: p.thumbnailUrl,
        category: p.category,
        status: p.status,
        viewCount: p.viewCount ?? 0,
        featured: p.featured ?? false,
        discountType: p.discountType,
        discountValue: p.discountValue,
      }));

      setProducts(transformedProducts);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "info" | "success" | "error" = "info") => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  const fetchOwned = async () => {
    try {
      const res = await fetch("/api/user/owned-products");
      if (!res.ok) return;
      const data = await res.json();
      const ids = new Set<string>();
      data.forEach((op: any) => ids.add(op.product.id));
      setOwnedIds(ids);
    } catch (err) {
      console.error("Error fetching owned products:", err);
    }
  };

  const handleCartClick = () => {
    console.log("Cart clicked! Session:", session);
    console.log("Cart items:", cartItems);
    console.log("Current cartOpen state:", cartOpen);
    
    if (!session?.user) {
      showToast("Please login to view your cart", "info");
      return;
    }
    
    console.log("Opening cart...");
    setCartOpen(true);
  };

  const addToCart = async (productId: string) => {
    if (!session?.user) {
      showToast("Please login to add items to cart", "info");
      return;
    }

    if (ownedIds.has(productId)) {
      showToast("You already own this product", "info");
      return;
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        await fetchCart();
        showToast("Product added to cart!", "success");
      } else {
        const data = await response.json();
        if (data.message === "Item already in cart") {
          showToast("Item is already in your cart", "info");
        } else {
          throw new Error(data.error || "Failed to add to cart");
        }
      }
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      showToast(err.message || "Failed to add to cart", "error");
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (response.ok) {
        setCartItems([]);
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  const openModal = (p: Product) => setSelected(p);
  const closeModal = () => setSelected(null);

  const handleProductAdded = () => {
    fetchProducts();
    setShowAdminPanel(false);
  };

  // Refresh cart when cart modal is opened to reflect latest prices/discounts
  useEffect(() => {
    if (cartOpen) {
      fetchCart();
    }
  }, [cartOpen]);

  // Transform cart items to match CartModal expected format
  const cartItemsForModal = cartItems.map((item) => ({
    p: {
      id: item.product.id,
      title: item.product.title,
      subtitle: item.product.subtitle || "",
      description: item.product.description,
      price: item.product.price,
      image: item.product.thumbnailUrl,
      category: item.product.category,
      status: item.product.status,
      viewCount: (item.product as any).viewCount ?? 0,
      featured: (item.product as any).featured ?? false,
      discountType: (item.product as any).discountType,
      discountValue: (item.product as any).discountValue,
    },
    qty: 1,
  }));

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="page-root">
      <header className="hero">
        <nav className="topbar">
          <div className="nav-items">
            <Navbar />
            <AuthButton />
          </div>
          {/* FIXED: Better positioned cart icon with click handler */}
          <button
            onClick={handleCartClick}
            className="cart-icon fancy-cart"
            style={{
              position: 'fixed',
              right: `${cartButtonRight}px`,
              top: '20px',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
              zIndex: 200,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
              background: 'linear-gradient(135deg, #123036, #1a4d56)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35), 0 0 12px rgba(46,185,185,0.45)',
              borderRadius: '999px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08) translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 12px 34px rgba(0,0,0,0.45), 0 0 16px rgba(46,185,185,0.6)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #1c5963, #267b86)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35), 0 0 12px rgba(46,185,185,0.45)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #123036, #1a4d56)';
            }}
          >
            🛒
            {cartItems.length > 0 && (
              <span className="badge">{cartItems.length}</span>
            )}
          </button>
        </nav>
        <h1 className="hero-title">{t.shop.title}</h1>
      </header>

      {isAdmin && (
        <div
          style={{
            position: "fixed",
            top: "100px",
            left: "30px",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="admin-panel-btn"
          >
            {showAdminPanel ? "Close Admin Panel" : "Admin Panel"}
          </button>
        </div>
      )}

      {isAdmin && adminPanelVisible && (
        <div
          className={`admin-panel-surface ${showAdminPanel ? "open" : "closing"}`}
          style={{
            position: "fixed",
            top: "160px",
            left: "30px",
            zIndex: 99,
            width: "fit-content",
          }}
        >
          <AdminProductManager onProductAdded={handleProductAdded} />
        </div>
      )}

      <section className="products-wrap">
        <div className="search-row">
          <input
            className="search-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn">Search</button>
        </div>

        <div className="grid-container">
          {loading ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "white" }}
            >
              Loading products...
            </div>
          ) : error ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#f44336" }}
            >
              Error: {error}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "white" }}
            >
              {searchQuery
                ? "No products found."
                : "No products available yet."}
            </div>
          ) : (
            <div className="grid">
              {filteredProducts.map((p, i) => (
                <div
                  key={p.id}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                >
                  <ProductCard
                    product={p}
                    index={i}
                    purchased={ownedIds.has(p.id)}
                    onClick={() => openModal(p)}
                    onAdd={(ev?: React.MouseEvent) => {
                      ev?.stopPropagation();
                      addToCart(p.id);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <ProductModal
          product={selected}
          onClose={closeModal}
          onAdd={() => {
            addToCart(selected.id);
          }}
        />
      )}

      {cartOpen && (
        <>
          {console.log("Rendering CartModal with:", { cartOpen, itemsCount: cartItemsForModal.length })}
          <CartModal
            onClose={() => {
              console.log("Closing cart");
              setCartOpen(false);
            }}
            items={cartItemsForModal}
            onRemove={(productId: string) => {
              const item = cartItems.find((i) => i.product.id === productId);
              if (item) removeFromCart(item.id);
            }}
            onClearCart={clearCart}
          />
        </>
      )}

      {toast && (
        <div
          className={`toast ${toast.type}`}
          style={{
            right: `${cartButtonRight + 200}px`,
            top: '24px',
          }}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
