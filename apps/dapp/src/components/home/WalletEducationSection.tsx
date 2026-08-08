'use client';

import React from 'react';
import { SectionShell } from './SectionShell';

// Wallet education concept nodes
const CONCEPT_NODES = [
  { id: 'network',       label: 'Network',       icon: '🌐', x: 160, y: 60,  color: '#FFD34D' },
  { id: 'communication', label: 'Communication',  icon: '📡', x: 260, y: 110, color: '#E6C45F' },
  { id: 'resource',      label: 'Resource',       icon: '⚡', x: 240, y: 200, color: '#FFD34D' },
  { id: 'account',       label: 'Account',        icon: '👤', x: 110, y: 220, color: '#C9A227' },
  { id: 'data',          label: 'Data',           icon: '💾', x: 60,  y: 140, color: '#E6C45F' },
  { id: 'application',   label: 'Application',    icon: '📱', x: 100, y: 55,  color: '#FFD34D' },
];

const CONNECTIONS = [
  ['network', 'communication'],
  ['network', 'application'],
  ['communication', 'resource'],
  ['resource', 'account'],
  ['account', 'data'],
  ['data', 'network'],
  ['network', 'account'],
  ['application', 'data'],
];

function getNode(id: string) {
  return CONCEPT_NODES.find((n) => n.id === id)!;
}

export function WalletEducationSection() {
  return (
    <SectionShell>
      <section
        style={{
          background: 'linear-gradient(160deg,#061C35 0%,#100D43 100%)',
          padding: '56px 20px 56px',
          width: '100%',
        }}
        aria-label="Wallet Education"
      >
        <p style={{ color: '#8F98A6', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          Wallet Education
        </p>

        <h2 style={{
          fontWeight: 900,
          fontSize: 'clamp(26px, 8vw, 40px)',
          color: '#FFFFFF',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: '0 0 12px',
        }}>
          How a Web3 Wallet Works
        </h2>

        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 'clamp(14px, 4vw, 17px)',
          lineHeight: 1.65,
          margin: '0 0 36px',
          maxWidth: 480,
        }}>
          A Web3 wallet is the foundation of your decentralized identity. It manages your cryptographic
          keys and acts as your interface to the blockchain network — connecting accounts, applications,
          resources, data, and communications.
        </p>

        {/* Concept diagram SVG */}
        <div style={{
          background: 'rgba(255,211,77,0.03)',
          border: '1px solid rgba(255,211,77,0.12)',
          borderRadius: 24,
          padding: '24px 16px',
          marginBottom: 36,
        }}>
          <p style={{ color: '#FFD34D', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', margin: '0 0 16px' }}>
            BSP Wallet Concept Diagram
          </p>

          <svg
            viewBox="0 0 320 280"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', maxWidth: 400, display: 'block', margin: '0 auto' }}
          >
            {/* Connection lines */}
            {CONNECTIONS.map(([a, b]) => {
              const na = getNode(a);
              const nb = getNode(b);
              return (
                <line
                  key={`${a}-${b}`}
                  x1={na.x} y1={na.y}
                  x2={nb.x} y2={nb.y}
                  stroke="rgba(255,211,77,0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              );
            })}

            {/* Central wallet node */}
            <circle cx="160" cy="148" r="34" fill="rgba(255,211,77,0.08)" stroke="#FFD34D" strokeWidth="2" />
            <circle cx="160" cy="148" r="20" fill="rgba(255,211,77,0.15)" />
            <text x="160" y="145" textAnchor="middle" fill="#FFD34D" fontSize="11" fontWeight="900" fontFamily="Inter,sans-serif">
              BSP
            </text>
            <text x="160" y="158" textAnchor="middle" fill="rgba(255,211,77,0.7)" fontSize="8" fontFamily="Inter,sans-serif">
              WALLET
            </text>

            {/* Concept nodes */}
            {CONCEPT_NODES.map((node) => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r="26" fill="rgba(10,33,59,0.9)" stroke={node.color} strokeWidth="1.5" />
                <text x={node.x} y={node.y - 4} textAnchor="middle" fontSize="14">{node.icon}</text>
                <text x={node.x} y={node.y + 12} textAnchor="middle" fill={node.color} fontSize="7.5" fontWeight="700" fontFamily="Inter,sans-serif">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Concept explanations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '🌐', concept: 'Network',       text: 'The blockchain network your wallet connects to (e.g., Ethereum, BSC)' },
            { icon: '📡', concept: 'Communication', text: 'How your wallet sends transactions and signs messages' },
            { icon: '⚡', concept: 'Resource',      text: 'Gas fees paid to the network for computation' },
            { icon: '👤', concept: 'Account',       text: 'Your public address — your on-chain identity' },
            { icon: '💾', concept: 'Data',          text: 'On-chain state your wallet reads and writes' },
            { icon: '📱', concept: 'Application',   text: 'dApps your wallet connects to via the dApp browser' },
          ].map((item) => (
            <div key={item.concept} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 22, width: 30, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <span style={{ color: '#FFD34D', fontSize: 14, fontWeight: 700 }}>{item.concept}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 4px' }}>—</span>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.5 }}>{item.text}</span>
              </div>
            </div>
          ))}
        </div>

        <p style={{
          color: '#8F98A6',
          fontSize: 12,
          marginTop: 24,
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          Educational content only. This diagram is a simplified conceptual model.
        </p>
      </section>
    </SectionShell>
  );
}
