import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Leaf, Droplets, ShieldCheck, Mail, ShoppingBag } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis, useLenis } from '@studio-freight/react-lenis';
import Carousel from './Carousel';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. STYLES (Injected directly for single-file structure)
// ==========================================
const globalStyles = `
  :root {
    --apple-font: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --gold: #D4AF37;
    --bg-color: #FAFAFC;
    --text-color: #1D1D1F;
  }
  
  body, html {
    margin: 0;
    padding: 0;
    font-family: var(--apple-font);
    background-color: var(--bg-color);
    color: var(--text-color);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Splash Screen */
  .splash-screen {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100vh;
    background: #1D1D1F;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition: opacity 1s cubic-bezier(0.8, 0, 0.2, 1), visibility 1s;
  }
  .splash-screen.hidden {
    opacity: 0;
    visibility: hidden;
  }
  .splash-logo {
    color: var(--gold);
    font-size: 2rem;
    font-weight: 300;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    animation: pulse 2s infinite ease-in-out;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.6; transform: scale(0.98); }
    50% { opacity: 1; transform: scale(1); }
  }

  /* Scroll Float - From User Input */
  .scroll-float {
    overflow: hidden;
    padding-bottom: 0.25em;
    margin-bottom: -0.25em;
  }
  .scroll-float-text {
    display: inline-block;
    font-size: clamp(2rem, 6vw, 5rem);
    font-weight: 700;
    text-align: center;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .char {
    display: inline-block;
  }

  /* Dock CSS - Adapted from User Input */
  .dock-container {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    pointer-events: none;
  }
  .dock {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 24px;
    pointer-events: all;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
    transition: padding .3s cubic-bezier(0.2, 0, 0.2, 1);
  }
  .dock-item {
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    border-radius: 12px;
    background: transparent;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0.2, 1),
                width 0.2s cubic-bezier(0.2, 0, 0.2, 1),
                height 0.2s cubic-bezier(0.2, 0, 0.2, 1),
                background 0.2s;
    transform-origin: bottom center;
    color: #1D1D1F;
  }
  .dock-item:hover {
    background: rgba(0,0,0,0.05);
  }
  .dock-item::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 140%;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    padding: 6px 12px;
    background: rgba(29, 29, 31, 0.9);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 8px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .dock-item:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  .dock-item:hover {
    transform: scale(1.3) translateY(-8px);
    z-index: 10;
  }
  .dock:hover {
    padding-bottom: 12px;
  }
  .dock-divider {
    width: 1px;
    height: 32px;
    background: rgba(0, 0, 0, 0.15);
    margin: 0 4px 6px;
    align-self: flex-end;
  }
  .dock-item::before {
    content: '';
    position: absolute;
    bottom: -6px;
    width: 4px;
    height: 4px;
    background: var(--gold);
    border-radius: 50%;
    opacity: 0;
    transition: opacity .2s;
  }
  .dock-item.active::before {
    opacity: 1;
  }
  @media (max-width: 600px) {
    .dock { gap: 8px; padding: 6px 10px; border-radius: 20px; }
    .dock-item { width: 38px; height: 38px; }
  }

  /* Typography / Utilities */
  .section-padding { padding: 8rem 2rem; }
  .apple-hero-text {
    font-size: clamp(3rem, 10vw, 8rem);
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.05;
  }
  .apple-sub-text {
    font-size: clamp(1.2rem, 3vw, 1.8rem);
    font-weight: 400;
    color: #86868B;
    letter-spacing: 0.01em;
  }
`;

// ==========================================
// 2. COMPONENTS
// ==========================================

const ScrollFloat = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=20%',
  scrollEnd = 'bottom center',
  stagger = 0.02,
  isGsapLoaded = false
}) => {
  const containerRef = useRef(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split('').map((char, index) => (
      <span className="char" key={index} style={char === ' ' ? { whiteSpace: 'pre' } : {}}>
        {char}
      </span>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const charElements = el.querySelectorAll('.char');
      const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

      gsap.fromTo(
        charElements,
        {
          willChange: 'opacity, transform',
          opacity: 0,
          yPercent: 120,
          scaleY: 2.3,
          scaleX: 0.7,
          transformOrigin: '50% 0%'
        },
        {
          duration: animationDuration,
          ease: ease,
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          scaleX: 1,
          stagger: stagger,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: scrollStart,
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, el);

    return () => ctx.revert();
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger]);

  return (
    <h2 ref={containerRef} className={`scroll-float ${containerClassName}`}>
      <span className={`scroll-float-text ${textClassName}`}>{splitText}</span>
    </h2>
  );
};

const AccordionItem = ({ title, content, isOpen, onClick }) => {
  const contentRef = useRef(null);

  return (
    <div className="border-b border-gray-200 py-6">
      <button
        className="w-full flex justify-between items-center text-left focus:outline-none group"
        onClick={onClick}
      >
        <span className="text-xl md:text-2xl font-semibold text-gray-900 group-hover:text-[#D4AF37] transition-colors">
          {title}
        </span>
        <span className="ml-6 flex-shrink-0">
          <svg className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isOpen ? contentRef.current?.scrollHeight + 'px' : '0px',
          opacity: isOpen ? 1 : 0
        }}
      >
        <div className="pt-4 text-lg text-gray-500 leading-relaxed max-w-3xl">
          {content}
        </div>
      </div>
    </div>
  );
};

const BottomDock = ({ activeSection }) => {
  const navItems = [
    { id: 'hero', icon: <Leaf size={20} />, label: 'Home' },
    { id: 'about', icon: <ShieldCheck size={20} />, label: 'Purity' },
    { id: 'benefits', icon: <Droplets size={20} />, label: 'Benefits' },
    { id: 'shop', icon: <ShoppingBag size={20} />, label: 'Shop' },
  ];

  return (
    <div className="dock-container">
      <div className="dock">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`dock-item ${activeSection === item.id ? 'active' : ''}`}
            data-tooltip={item.label}
          >
            {item.icon}
          </a>
        ))}
        <div className="dock-divider"></div>
        <a href="#contact" className="dock-item" data-tooltip="Contact Us">
          <Mail size={20} />
        </a>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN APP
// ==========================================

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');
  const [openAccordion, setOpenAccordion] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(850);

  // Responsive logic for massive rectangular gallery width
  useEffect(() => {
    const handleResize = () => {
      setCarouselWidth(Math.min(850, window.innerWidth - 32));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Parallax Effect
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.parallax-bg').forEach((bg) => {
        gsap.to(bg, {
          yPercent: 20,
          ease: "none",
          scrollTrigger: {
            trigger: bg.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          }
        });
      });
    });
    return () => ctx.revert();
  }, []);

  // Intersection Observer for Dock
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { threshold: 0.5 });

    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => observer.observe(section));

    return () => sections.forEach(section => observer.unobserve(section));
  }, []);

  const accordionData = [
    {
      title: "100% Authentic Niah Cave Origins",
      content: "Harvested responsibly from the ancient limestone caves of Miri, Sarawak. Our nests are completely natural, unbleached, and hand-cleaned by local artisans to preserve their pure nutritional profile."
    },
    {
      title: "Rich in Epidermal Growth Factor (EGF)",
      content: "Known as the 'beauty gene', the high concentration of EGF in our swiftlet nests stimulates cell renewal, promoting a youthful, radiant complexion from the inside out."
    },
    {
      title: "Immunity & Vitality Boost",
      content: "Packed with glycoproteins, amino acids, and essential minerals, regular consumption traditionally supports respiratory health, boosts the immune system, and enhances overall vitality."
    }
  ];

  return (
    <ReactLenis root options={{ lerp: 0.05, smoothWheel: true }}>
      <style>{globalStyles}</style>

      {/* Splash Screen */}
      <div className={`splash-screen ${!loading ? 'hidden' : ''}`}>
        <div className="splash-logo">MIRI'S Bird Nest</div>
      </div>

      <main className="relative bg-[#FAFAFC]">

        {/* HERO SECTION */}
        <section id="hero" className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20 overflow-hidden">
          {/* Background Image Layer */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/hero.jpeg')",
              filter: "blur(6px)",
              transform: "scale(1.05)" /* Prevent edges from showing due to blur */
            }}
          ></div>
          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 z-0 bg-black/40"></div>

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <h1 className="apple-hero-text text-white tracking-tighter drop-shadow-lg">
              Nature's <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FFE28A]">
                Purest Gold.
              </span>
            </h1>
            <p className="apple-sub-text !text-gray-200 max-w-2xl mx-auto mt-6 drop-shadow-md">
              Sustainably harvested from the majestic caves of Miri, Sarawak.
              Experience the pinnacle of wellness and beauty with our premium, hand-cleaned swiftlet nests.
            </p>

          </div>

          {/* Subtle scroll indicator */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center opacity-70 z-10 text-white">
            <span className="text-sm font-medium mb-2 uppercase tracking-widest text-gray-200">Scroll</span>
            <div className="w-[1px] h-12 bg-white animate-pulse"></div>
          </div>
        </section>

        {/* FLOATING TEXT SECTION (Using User's GSAP Component) */}
        <section id="about" className="section-padding bg-white flex flex-col justify-center items-center text-center overflow-hidden min-h-[80vh]">
          <div className="max-w-5xl w-full">
            <p className="text-[#D4AF37] font-semibold tracking-widest uppercase mb-4 text-sm md:text-base">The Miri Heritage</p>
            <ScrollFloat
              animationDuration={1.2}
              ease='power3.out'
              scrollStart='top bottom'
              scrollEnd='center center'
              stagger={0.015}
              textClassName="text-gray-900"
            >
              Uncompromised Quality.
            </ScrollFloat>
            <ScrollFloat
              animationDuration={1.2}
              ease='power3.out'
              scrollStart='top bottom-=10%'
              scrollEnd='center center'
              stagger={0.015}
              textClassName="text-gray-400"
            >
              From Cave to Cup.
            </ScrollFloat>
          </div>
        </section>

        {/* PARALLAX IMAGE SECTION */}
        <section className="relative h-[80vh] overflow-hidden flex items-center justify-center">
          <div
            className="absolute inset-0 w-full h-[120%] -top-[10%] parallax-bg"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2000')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          <div className="relative z-10 text-center text-white px-4">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter">Ancient Wisdom, Modern Elegance.</h2>
            <p className="text-xl md:text-2xl font-light max-w-2xl mx-auto">Discover the timeless beauty secrets hidden within the limestone caves.</p>
          </div>
        </section>

        {/* ACCORDION / BENEFITS SECTION */}
        <section id="benefits" className="section-padding bg-[#FAFAFC] min-h-screen flex items-center">
          <div className="max-w-4xl mx-auto w-full px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">The Science of Essence</h2>
              <p className="apple-sub-text">Why our Miri bird nests are the choice of connoisseurs.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              {accordionData.map((item, index) => (
                <AccordionItem
                  key={index}
                  title={item.title}
                  content={item.content}
                  isOpen={openAccordion === index}
                  onClick={() => setOpenAccordion(openAccordion === index ? -1 : index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCT GALLERY CAROUSEL SECTION */}
        <section id="gallery" className="section-padding bg-white flex flex-col justify-center items-center text-center overflow-hidden min-h-[90vh]">
          <div className="max-w-5xl w-full mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Explore the Collection</h2>
            <p className="apple-sub-text">Interact to swipe and discover our purest yields.</p>
          </div>

          <div className="w-full flex justify-center pb-8 mx-auto px-4 md:px-12">
            <Carousel
              baseWidth={carouselWidth}
              autoplay={false}
              autoplayDelay={3000}
              pauseOnHover={false}
              loop={false}
              round={false}
            />
          </div>
        </section>

        {/* SHOP/CTA SECTION */}
        <section id="shop" className="section-padding bg-gray-900 text-white min-h-[80vh] flex flex-col justify-center items-center text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter">Elevate your ritual.</h2>
            <p className="text-xl text-gray-400 mb-12">Limited quantities available due to strict sustainable harvesting practices in Sarawak.</p>
            <button className="bg-white text-gray-900 rounded-full px-10 py-5 text-xl font-medium hover:bg-gray-100 transition-transform hover:scale-105 duration-300">
              Shop Premium Nests
            </button>
          </div>
        </section>

        {/* BOTTOM DOCK NAVIGATION */}
        <BottomDock activeSection={activeSection} />

      </main>
    </ReactLenis>
  );
}
