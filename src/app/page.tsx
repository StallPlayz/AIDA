import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Footer from "./components/Footer";
import AuthButton from "./components/AuthButton";
import "./globals.css";
export default function Home() {
  return (
    <>
      <Navbar />
      <AuthButton />
      <Hero />
      <img src="/aida-star.webp" alt="left decoration" className="star-left" />
      <img src="/aida-star.webp" alt="background decoration" className="star-bg-right" />
      <About />
      <Footer />

      <style>{`
        @media (max-width: 768px) {
          /* Inject AuthButton content into mobile menu */
          .mobile-menu {
            padding-bottom: 180px;
          }

          #mobile-auth-content {
            position: static;
            padding: 10px 12px;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </>
  );
}
