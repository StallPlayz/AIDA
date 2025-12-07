'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { Product } from './page';
import './shop.css';
import { computeDiscountedPrice } from '@/utils/pricing';

export default function ProductCard({
  product,
  index,
  onClick,
  onAdd,
  purchased = false,
}: {
  product: Product;
  index: number;
  onClick: () => void;
  onAdd: (e?: React.MouseEvent) => void;
  purchased?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const { finalPrice, discountPercent } = computeDiscountedPrice(
    product.price,
    product.discountType,
    product.discountValue
  );
  const hasDiscount = !!product.discountType && product.discountType !== "NONE" && finalPrice < product.price;

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`card ${product.featured ? 'featured-card' : ''} ${visible ? 'animated-in' : 'hidden-card'}`}
      style={{ animationDelay: `${index * 120}ms` }}
      onClick={onClick}
    >
      <div className="card-media">
        <img src={product.image} alt={product.title} />
        <div className="badge-stack">
          {product.featured && <span className="featured-badge">Featured</span>}
          {hasDiscount && <span className="discount-badge">Discount</span>}
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-title">{product.title}</h3>
        <p className="card-sub">{product.subtitle}</p>
        <p className="card-desc clamped-desc">{product.description}</p>
        {purchased && (
          <div className="owned-pill">You already own this product</div>
        )}
        <div className="card-footer">
          <div className="price-group">
            {hasDiscount && <span className="price-old">IDR{product.price}</span>}
            <div className="price-pill">
              IDR{finalPrice}
              {hasDiscount && <span className="price-discount-tag">-{discountPercent}%</span>}
            </div>
          </div>
          <button
            className={`round-add ${purchased ? "round-owned" : ""}`}
            onClick={(e) => {
              if (purchased) return;
              e.stopPropagation();
              onAdd(e);
            }}
            aria-label={purchased ? "owned" : "add"}
            disabled={purchased}
          >
            {purchased ? "Owned" : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}
