"use client";
import Image from "next/image";
import "./global.css";
import Navbar from "./Navbar";
import Footer from "../components/Footer";
import AuthButton from "../components/AuthButton";
import PhotoSlideshow from "./PhotoSlideshow";
import CanvaEmbed from "../components/CanvaEmbed"; // Import komponen Canva
import { useLanguage } from "../contexts/LanguageContext";


export default function Home() {
  const { t } = useLanguage();
  return (
    <main>
      {/* HEADER */}
      <Navbar />
      <AuthButton />

      {/* HERO SECTION */}
      <section className="hero">
        <p className="Services">{t.portofolio.services}</p>
        <div className="hero-row">
          <PhotoSlideshow />
          <div className="hero-box-vidio">
            <Image
              src="/vidio.webp"
              alt="Videography"
              fill
              className="img"
              unoptimized
            />
            <div className="overlay">{t.portofolio.videoGallery}</div>
          </div>
        </div>
        <div className="hero-row">
          <div className="hero-box wide">
            <Image src="/sosmed.webp" alt="Social Media Management" fill className="img" />
            <div className="overlay">{t.portofolio.socialMediaManagement}</div>
          </div>
        </div>
      </section>

      {/* CANVA PRESENTATION SECTION */}
      <section className="canva-section">
        <CanvaEmbed 
          embedUrl="https://www.canva.com/design/DAGzolF2lTM/NFqa9_BhIBlkUXiesX4nDg/view?embed"
          height="600px"
          className="canva-showcase"
        />
      </section>
      {/* FOOTER */}
      <Footer />
    </main>
  );
}
