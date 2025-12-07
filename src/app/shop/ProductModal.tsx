'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { Product } from './page';
import './shop.css';
import { computeDiscountedPrice } from '@/utils/pricing';

export default function ProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [views, setViews] = useState(product.viewCount ?? 0);
  const hasIncrementedRef = useRef<string | null>(null);
  const { finalPrice, discountPercent } = computeDiscountedPrice(
    product.price,
    product.discountType,
    product.discountValue
  );
  const hasDiscount = !!product.discountType && product.discountType !== "NONE" && finalPrice < product.price;

  useEffect(() => {
    let cancelled = false;
    if (hasIncrementedRef.current === product.id) {
      return;
    }
    hasIncrementedRef.current = product.id;
    const incrementViews = async () => {
      try {
        const res = await fetch(`/api/products/${product.id}/view`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && typeof data.viewCount === "number") {
            setViews(data.viewCount);
          }
        }
      } catch (err) {
        console.error("Failed to increment view count", err);
      }
    };

    incrementViews();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 320);
  };

  return (
    <div className={`overlay ${closing ? 'out' : 'in'}`} onClick={handleClose}>
      <div
        className="product-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* big dark framed card like screenshot */}
        <div className="frame">
        <div className="frame-inner">
          <div className="modal-media">
            <img src={product.image} alt={product.title} />
            {product.featured && (
              <span className="featured-badge modal-featured">Featured</span>
            )}
          </div>

              <div className="modal-info">
                <h4 className="modal-sub">{product.subtitle}</h4>
                <h2 className="modal-title">{product.title}</h2>
                <p className="modal-desc">{product.description}</p>

                <div className="modal-bottom">
                  <div className="modal-price-block">
                    {hasDiscount && (
                      <div className="price-old">IDR{product.price}</div>
                    )}
                    <div className="modal-price">IDR{finalPrice}</div>
                    {hasDiscount && (
                      <span className="price-discount-tag">-{discountPercent}%</span>
                    )}
                  </div>
                  <div className="modal-views" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                    {views} views
                  </div>
                  <button
                    className="modal-add-btn"
                  onClick={() => {
                    onAdd();
                  }}
                  aria-label="add-to-cart"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
