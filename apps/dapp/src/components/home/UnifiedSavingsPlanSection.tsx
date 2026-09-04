'use client';

import React from 'react';
import { SectionShell } from './SectionShell';
import { SavingsPlanBenefitsStrip } from '../SavingsPlanFeatures';
import { SavingsPlanCarousel } from '../SavingsPlanCarousel';

export function UnifiedSavingsPlanSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(180deg, #020914 0%, #06152B 100%)',
          padding: '40px 16px 36px',
        }}
        aria-label="Savings Plans"
      >
        {/* ── 5 Benefit Icons Strip on top ── */}
        <SavingsPlanBenefitsStrip />

        {/* ── Single Horizontally Scrollable / Swipeable Savings Plan Card ── */}
        <SavingsPlanCarousel defaultSlide={0} />
      </section>
    </SectionShell>
  );
}
