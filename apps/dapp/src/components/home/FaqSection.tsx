'use client';

import React, { useState } from 'react';
import { SectionShell } from './SectionShell';

const FAQS = [
  {
    number: '01',
    question: 'How do withdrawals work?',
    answer:
      'For flexible savings, withdrawals can be initiated at any time through your connected wallet and the BSP portal. The smart contract processes the withdrawal request and returns your assets to your wallet address. Network gas fees apply. Illustrative processing times may vary based on blockchain congestion.',
  },
  {
    number: '02',
    question: 'How does USDC staking work?',
    answer:
      'USDC can be deposited into the BSP protocol smart contract. The contract automatically calculates daily illustrative interest based on your deposit amount and the applicable rate tier. Interest accrues daily and is added to your balance. All figures shown on this portal are for educational and illustrative purposes only.',
  },
  {
    number: '03',
    question: 'How do invitations work?',
    answer:
      'The BSP referral system allows existing participants to invite new users via their unique referral link. When a referred user joins and participates, both parties may receive illustrative promotional benefits subject to the current program terms. Details are provided through the customer service channel.',
  },
  {
    number: '04',
    question: 'What are decentralized protocols?',
    answer:
      'Decentralized protocols are sets of rules enforced by code (smart contracts) rather than by a central authority. They operate on public blockchains, are transparent, and function without needing permission from any single entity. Any user with a compatible wallet can interact with an open protocol.',
  },
  {
    number: '05',
    question: 'How does the protocol work?',
    answer:
      'BSP operates through a series of smart contracts deployed on the public blockchain. When you deposit assets, the contract records your balance on-chain. Interest calculations follow deterministic rules written into the contract code. All operations are publicly auditable on the blockchain explorer.',
  },
  {
    number: '06',
    question: 'What security measures are used?',
    answer:
      'BSP is designed as a non-custodial protocol — your private keys never leave your wallet. Smart contract code is designed to be transparent and auditable. Users should always verify smart contract addresses independently, use hardware wallets for large amounts, and never share their seed phrase with anyone.',
  },
  {
    number: '07',
    question: 'Platform development history',
    answer:
      'BSP was developed as an educational and illustrative Web3 savings portal. The platform is intended to demonstrate how decentralized savings protocols function in a transparent and open manner. It is not a live financial product and makes no claims about real returns or guaranteed yields.',
  },
  {
    number: '08',
    question: 'Mobile application',
    answer:
      'BSP is designed as a mobile-first web application compatible with Web3 mobile browsers such as Bitget Wallet\'s in-app browser, MetaMask Mobile, and similar dApp-compatible wallets. No separate native app download is required.',
  },
  {
    number: '09',
    question: 'Privacy Policy',
    answer:
      'BSP does not collect personal identifying information. Anonymous session data may be used to operate the customer service chat system. No wallet private keys, seed phrases, or sensitive cryptographic material are ever transmitted to or stored by BSP servers. You interact directly with public blockchain infrastructure.',
  },
  {
    number: '10',
    question: 'Information for Participants',
    answer:
      'All content on this portal is for educational and illustrative purposes only. Nothing on this platform constitutes financial advice, investment advice, or a solicitation to buy, sell, or hold any digital asset. Always conduct your own research and consult qualified professionals before making financial decisions. Rates shown are hypothetical and illustrative only.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#0A213B 0%,#00152B 100%)',
          padding: '56px 16px 56px',
        }}
        aria-label="FAQ"
      >
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ color: '#8F98A6', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
            Frequently Asked Questions
          </p>
          <h2 style={{
            fontWeight: 900,
            fontSize: 'clamp(28px, 8.5vw, 42px)',
            color: '#FFFFFF',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            FAQ
          </h2>
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.number}
                style={{
                  background: 'linear-gradient(160deg,#0A213B,#061C35)',
                  border: `1px solid ${isOpen ? 'rgba(255,211,77,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  transition: 'border-color 0.25s',
                  boxShadow: isOpen ? '0 4px 24px rgba(255,211,77,0.06)' : 'none',
                }}
              >
                <button
                  id={`faq-${faq.number}-btn`}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    minHeight: 96,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '20px 18px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Number */}
                  <span style={{
                    color: '#FFD34D',
                    fontSize: 'clamp(22px, 6vw, 30px)',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    minWidth: 36,
                    flexShrink: 0,
                  }}>
                    {faq.number}
                  </span>

                  {/* Question */}
                  <span style={{
                    flex: 1,
                    color: '#FFFFFF',
                    fontSize: 'clamp(16px, 4.8vw, 22px)',
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}>
                    {faq.question}
                  </span>

                  {/* Gold circular arrow */}
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255,211,77,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'transform 0.3s, border-color 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    borderColor: isOpen ? '#FFD34D' : 'rgba(255,211,77,0.45)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 5l4 4 4-4" stroke="#FFD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {/* Answer */}
                <div className={`accordion-body ${isOpen ? 'open' : ''}`}>
                  <div className="accordion-inner">
                    <div style={{
                      padding: '0 18px 24px 70px',
                      color: 'rgba(255,255,255,0.72)',
                      fontSize: 'clamp(15px, 4.2vw, 19px)',
                      lineHeight: 1.7,
                    }}>
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </SectionShell>
  );
}
