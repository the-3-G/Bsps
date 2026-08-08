'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

const SLIDES = [
  {
    id: 'slide-1',
    tag: 'BLOCKCHAIN SAVINGS',
    title: 'Decentralized\nSavings for\nEveryone',
    subtitle: 'Access flexible digital asset savings with transparent on-chain records and open protocol infrastructure.',
    image: '/images/hero-slide1.png',
  },
  {
    id: 'slide-2',
    tag: 'DIGITAL ASSET INFRASTRUCTURE',
    title: 'Powered by\nOpen Web3\nInfrastructure',
    subtitle: 'Our protocol operates on a decentralized computing network with public activity records and no central authority.',
    image: '/images/hero-slide2.png',
  },
  {
    id: 'slide-3',
    tag: 'WEB3 ECOSYSTEM',
    title: 'Your Gateway\nto the Web3\nEcosystem',
    subtitle: 'Connect your compatible wallet, explore decentralized applications and participate in the open financial internet.',
    image: '/images/hero-slide3.png',
  },
  {
    id: 'slide-4',
    tag: 'SECURE WALLET TECHNOLOGY',
    title: 'Your Keys,\nYour Assets,\nYour Control',
    subtitle: 'BSP is non-custodial and compatible with leading hardware and software wallets for maximum security.',
    image: '/images/hero-slide4.png',
  },
];

// Fixed subtle gold ambient particles
const PARTICLES = [
  { top: '12%', left: '15%', opacity: 0.3 },
  { top: '22%', left: '78%', opacity: 0.25 },
  { top: '45%', left: '88%', opacity: 0.2 },
  { top: '65%', left: '10%', opacity: 0.25 },
  { top: '80%', left: '40%', opacity: 0.2 },
];

export function HomeHero() {
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number) => {
    const next = ((idx % SLIDES.length) + SLIDES.length) % SLIDES.length;
    if (next === current) return;
    setPrevSlide(current);
    setTransitioning(true);
    setCurrent(next);
    setTimeout(() => {
      setTransitioning(false);
      setPrevSlide(null);
    }, 400);
  }, [current]);

  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      if (!paused) goTo(current + 1);
    }, 5000);
  }, [paused, current, goTo]);

  useEffect(() => {
    startAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [startAuto]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 44) goTo(dx < 0 ? current + 1 : current - 1);
    setTimeout(() => setPaused(false), 3000);
  };

  const slide = SLIDES[current];

  return (
    <section
      aria-label="Hero Carousel"
      style={{
        width: '100%',
        height: 650,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #06284A 0%, #021B35 50%, #00152B 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Low-opacity gold ambient particles ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: '#FFD34D',
              top: p.top,
              left: p.left,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* ── Soft radial blue illumination behind artwork ── */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          right: -20,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(3,44,92,0.45) 0%, rgba(6,40,74,0.2) 50%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Background-integrated artwork (PREVIOUS — crossfading out) ── */}
      {prevSlide !== null && transitioning && (
        <div
          key={`prev-${SLIDES[prevSlide].id}`}
          style={{
            position: 'absolute',
            top: 60,
            right: -25,
            width: 330,
            height: 310,
            zIndex: 2,
            opacity: 0,
            transition: 'opacity 0.4s ease-out',
            pointerEvents: 'none',
          }}
        >
          <Image
            src={SLIDES[prevSlide].image}
            alt=""
            width={480}
            height={440}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 95%), linear-gradient(to left, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.25) 60%, transparent 100%)',
              WebkitMaskComposite: 'source-in' as any,
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 95%), linear-gradient(to left, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.25) 60%, transparent 100%)',
              maskComposite: 'intersect' as any,
            }}
          />
        </div>
      )}

      {/* ── Background-integrated artwork (CURRENT — fading in) ── */}
      <div
        key={`curr-${slide.id}`}
        style={{
          position: 'absolute',
          top: 60,
          right: -25,
          width: 330,
          height: 310,
          zIndex: 2,
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.4s ease-in',
          pointerEvents: 'none',
        }}
      >
        <Image
          src={slide.image}
          alt={slide.tag}
          width={480}
          height={440}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 95%), linear-gradient(to left, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.25) 60%, transparent 100%)',
            WebkitMaskComposite: 'source-in' as any,
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 95%), linear-gradient(to left, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.25) 60%, transparent 100%)',
            maskComposite: 'intersect' as any,
          }}
          priority
        />
      </div>

      {/* ── Top Zone: Category Label ── */}
      <div style={{ position: 'relative', zIndex: 5, padding: '24px 24px 0' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 32,
            padding: '0 14px',
            borderRadius: 999,
            background: 'rgba(0, 23, 46, 0.6)',
            border: '1px solid rgba(255, 211, 77, 0.25)',
            color: '#FFD34D',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            backdropFilter: 'blur(6px)',
          }}
        >
          {slide.tag}
        </span>
      </div>

      {/* ── Bottom Zone: Headline + Copy + Pagination Dots ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          padding: '0 24px 30px',
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontWeight: 800,
            fontSize: 'clamp(44px, 12vw, 50px)',
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            margin: '0 0 16px',
            whiteSpace: 'pre-line',
            maxWidth: 370,
            paddingRight: 24,
          }}
        >
          {slide.title}
        </h1>

        {/* Supporting Copy */}
        <p
          style={{
            color: '#A7B0BE',
            fontSize: 'clamp(17px, 4.2vw, 19px)',
            lineHeight: 1.5,
            margin: '0 0 24px',
            maxWidth: 350,
            fontWeight: 400,
          }}
        >
          {slide.subtitle}
        </p>

        {/* Pagination Dots (Left aligned) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                goTo(i);
                setPaused(true);
                setTimeout(() => setPaused(false), 3500);
              }}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === current ? 24 : 7,
                height: 7,
                borderRadius: 999,
                background: i === current ? '#FFD34D' : 'rgba(167, 176, 190, 0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'width 0.3s ease, background 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
