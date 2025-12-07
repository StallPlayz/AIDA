"use client";
import React from 'react';
import Link from 'next/link';

const ErrorPage = () => {
  return (
    <>
      <div className="error-container">
        {/* Animated Background Pattern */}
        <div className="background-pattern">
          <img src="/hd.webp" alt="" className="pattern-image pattern-image-1" />
          <img src="/hd.webp" alt="" className="pattern-image pattern-image-2" />
          <img src="/hd.webp" alt="" className="pattern-image pattern-image-3" />
          <img src="/hd.webp" alt="" className="pattern-image pattern-image-4" />
        </div>

        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-right">
            <div className="nav-menu">
              <Link href="/" className="nav-link nav-link-active"  style={{ textDecoration: 'none', color: 'black' }}>
                Home
              </Link>
              <Link href="/portofolio" className="nav-link"  style={{ textDecoration: 'none', color: 'black' }}>
                Portfolio
              </Link>
              <Link href="/shop" className="nav-link"  style={{ textDecoration: 'none', color: 'black' }}>
                Shop
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="main-content">
          {/* 404 Number with Geometric Pattern */}
          <div className="error-number-wrapper">
            <div className="geometric-bg">
              <img src="/aida-star.webp" alt="" className="star-image" />
              <img src="/aida-star.webp" alt="" className="star-image2" />
            </div>
            <h1 className="error-number">404</h1>
          </div>

          {/* Error Message */}
          <h2 className="error-title">Page Not Found</h2>
          <p className="error-description">
            Oops! The page you're looking for seems to have wandered off into the creative void.
          </p>

          {/* Action Buttons */}
          <div className="button-group">
            <Link href="/" className="btn btn-primary"  style={{ textDecoration: 'none', color: 'black' }}>
              Back to Home
            </Link>
            <Link href="/portfolio" className="btn btn-secondary"  style={{ textDecoration: 'none', color: 'black' }}>
              View Portfolio
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .error-container {
          min-height: 100vh;
          background: radial-gradient(circle at 20% 20%, rgba(46, 185, 185, 0.15), transparent 35%),
                      radial-gradient(circle at 80% 10%, rgba(46, 185, 185, 0.12), transparent 30%),
                      linear-gradient(135deg, #0b1c1f 0%, #0f3035 45%, #125a64 100%);
          position: relative;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #e5e7eb;
        }

        /* Animated Background Pattern */
        .background-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.15;
          overflow: hidden;
        }

        .pattern-image {
          position: absolute;
          width: 300px;
          height: 300px;
          object-fit: contain;
          filter: brightness(1.2) drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
        }

        .pattern-image-1 {
          top: 5%;
          left: 5%;
          animation: float-rotate 15s ease-in-out infinite;
        }

        .pattern-image-2 {
          top: 10%;
          right: 8%;
          width: 350px;
          height: 350px;
          animation: float-rotate-reverse 18s ease-in-out infinite 2s;
        }

        .pattern-image-3 {
          bottom: 15%;
          left: 10%;
          width: 280px;
          height: 280px;
          animation: float-scale 12s ease-in-out infinite 1s;
        }

        .pattern-image-4 {
          bottom: 8%;
          right: 12%;
          width: 320px;
          height: 320px;
          animation: float-rotate 20s ease-in-out infinite 3s;
          opacity: 0.7;
        }

        /* Navigation */
        .navbar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 24px;
        }

        .nav-right {
          display: flex;
          align-items: center;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 18px;
          background-color: rgba(12, 30, 36, 0.7);
          backdrop-filter: blur(12px);
          border-radius: 9999px;
          padding: 12px 22px;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(46, 185, 185, 0.25);
        }

        .nav-link {
          color: #e5e7eb;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.25s ease, opacity 0.25s ease;
          opacity: 0.9;
        }

        .nav-link:hover {
          color: #70e0e2;
          opacity: 1;
        }

        .nav-link-active {
          color: #2eb9b9;
        }

        /* Main Content */
        .main-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 100px);
          text-align: center;
          padding: 16px;
        }

        /* 404 Number */
        .error-number-wrapper {
          position: relative;
          margin-bottom: 32px;
        }

        .geometric-bg {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.15;
        }

        .star-image {
          width: 500px;
          height: 500px;
          object-fit: contain;
          animation: spin-360 20s linear infinite;
          filter: brightness(1.3) drop-shadow(0 0 30px rgba(255, 255, 255, 0.4));
        }
        .star-image2 {
          width: 500px;
          height: 500px;
          position: absolute;
          object-fit: contain;
          animation: spin-360 15s linear infinite;
          filter: brightness(1.3) drop-shadow(0 0 30px rgba(255, 255, 255, 0.4));
        }

        .error-number {
          font-size: 12rem;
          font-weight: bold;
          color: white;
          letter-spacing: -0.05em;
          position: relative;
          line-height: 1;
        }

        /* Error Message */
        .error-title {
          font-size: 3rem;
          font-weight: bold;
          color: #e5e7eb;
          margin-bottom: 16px;
        }

        .error-description {
          font-size: 1.1rem;
          color: rgba(229, 231, 235, 0.85);
          margin-bottom: 32px;
          max-width: 480px;
        }

        /* Action Buttons */
        .button-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn {
          padding: 16px 32px;
          border-radius: 9999px;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .btn:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #1a5c64, #2eb9b9);
          color: #ffffff;
          border: 1px solid rgba(46, 185, 185, 0.6);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #2eb9b9, #46d5d5);
        }

        .btn-secondary {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          color: #ffffff;
          border: 1px solid rgba(46, 185, 185, 0.4);
        }

        .btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.16);
        }

        /* Decorative Elements */
        .deco-element {
          position: absolute;
          opacity: 0.3;
        }

        .deco-element-1 {
          top: 25%;
          right: 80px;
          width: 128px;
          height: 128px;
          animation: float 4s ease-in-out infinite;
        }

        .deco-element-2 {
          bottom: 25%;
          left: 80px;
          width: 96px;
          height: 96px;
          animation: float-delayed 5s ease-in-out infinite 1s;
        }

        /* Animations */
        @keyframes spin-360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes float-rotate {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
          }
          25% { 
            transform: translateY(-15px) rotate(5deg) scale(1.05);
          }
          50% { 
            transform: translateY(-25px) rotate(0deg) scale(1.1);
          }
          75% { 
            transform: translateY(-15px) rotate(-5deg) scale(1.05);
          }
        }

        @keyframes float-rotate-reverse {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
          }
          25% { 
            transform: translateY(-20px) rotate(-5deg) scale(1.03);
          }
          50% { 
            transform: translateY(-30px) rotate(0deg) scale(1.08);
          }
          75% { 
            transform: translateY(-20px) rotate(5deg) scale(1.03);
          }
        }

        @keyframes float-scale {
          0%, 100% { 
            transform: translateY(0px) scale(1) rotate(0deg);
          }
          33% { 
            transform: translateY(-10px) scale(1.05) rotate(3deg);
          }
          66% { 
            transform: translateY(-18px) scale(1.08) rotate(-3deg);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-10deg); }
        }

        /* Responsive */
        @media (min-width: 640px) {
          .button-group {
            flex-direction: row;
          }
        }

        @media (min-width: 768px) {
          .error-number {
            font-size: 12rem;
          }

          .error-title {
            font-size: 3rem;
          }
        }

        @media (max-width: 768px) {
          .error-number {
            font-size: 6rem;
          }

          .error-title {
            font-size: 2rem;
          }

          .geometric-svg {
            width: 256px;
            height: 256px;
          }

          .star-image {
            width: 350px;
            height: 350px;
          }

          .nav-menu {
            gap: 12px;
            padding: 8px 16px;
            font-size: 14px;
          }

          .pattern-image {
            width: 150px;
            height: 150px;
          }

          .pattern-image-2 {
            width: 180px;
            height: 180px;
          }

          .pattern-image-3 {
            width: 140px;
            height: 140px;
          }

          .pattern-image-4 {
            width: 160px;
            height: 160px;
          }

          .deco-element-1,
          .deco-element-2 {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default ErrorPage;
