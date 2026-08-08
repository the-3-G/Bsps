'use client';

import React from 'react';

// ── BATCH 1 ─────────────────────────────────────
import { HomeHero }               from '../components/home/HomeHero';
import { FlexibleSavingsSection } from '../components/home/FlexibleSavingsSection';
import { MarketReferenceSection } from '../components/home/MarketReferenceSection';

// ── BATCH 2 ─────────────────────────────────────
import { ComputingPoolSection }   from '../components/home/ComputingPoolSection';
import { OutputSection }          from '../components/home/OutputSection';
import { DailyInterestSection }   from '../components/home/DailyInterestSection';
import { FixedTermSavingsSection } from '../components/home/FixedTermSavingsSection';

// ── BATCH 3 ─────────────────────────────────────
import { WalletSupportSection }   from '../components/home/WalletSupportSection';
import { DappsSection }           from '../components/home/DappsSection';
import { SmartContractsSection }  from '../components/home/SmartContractsSection';
import { Web3BenefitsSection }    from '../components/home/Web3BenefitsSection';

// ── BATCH 4 ─────────────────────────────────────
import { WalletEducationSection } from '../components/home/WalletEducationSection';
import { HelpCenterSection }      from '../components/home/HelpCenterSection';
import { FaqSection }             from '../components/home/FaqSection';
import { HomeFooter }             from '../components/home/HomeFooter';

export default function HomePage() {
  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      {/* ── Hero Carousel ─────────────────────────── */}
      <HomeHero />

      {/* ── Savings Products ──────────────────────── */}
      <FlexibleSavingsSection />
      <MarketReferenceSection />

      {/* ── Network Activity ──────────────────────── */}
      <ComputingPoolSection />
      <OutputSection />
      <DailyInterestSection />
      <FixedTermSavingsSection />

      {/* ── Ecosystem Education ───────────────────── */}
      <WalletSupportSection />
      <DappsSection />
      <SmartContractsSection />
      <Web3BenefitsSection />

      {/* ── Deep Education + Support ──────────────── */}
      <WalletEducationSection />
      <HelpCenterSection />
      <FaqSection />

      {/* ── Footer ───────────────────────────────── */}
      <HomeFooter />
    </div>
  );
}
