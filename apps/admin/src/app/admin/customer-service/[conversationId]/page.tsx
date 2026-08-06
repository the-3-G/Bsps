'use client';

import React, { useState } from 'react';
import { PageHeader, StatusBadge } from '../../../../components/ui/Reusables';
import { Headset, Send, ArrowLeft, UserCheck, Lock } from 'lucide-react';
import Link from 'next/link';

interface ThreadMessage {
  id: string;
  senderType: 'guest' | 'user' | 'agent' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

export default function CustomerServiceThreadPage() {
  const [messages, setMessages] = useState<ThreadMessage[]>([
    {
      id: 'm1',
      senderType: 'system',
      senderName: 'System',
      text: 'Conversation initiated via Receive Voucher prompt.',
      timestamp: '10:15 AM',
    },
    {
      id: 'm2',
      senderType: 'guest',
      senderName: 'Guest 4821',
      text: 'Hello. I would like to inquire about the voucher eligibility for node staking.',
      timestamp: '10:16 AM',
    },
    {
      id: 'm3',
      senderType: 'agent',
      senderName: 'Support Agent Alpha',
      text: 'Hello Guest 4821, thank you for reaching out. A support representative is reviewing your request.',
      timestamp: '10:18 AM',
    },
  ]);

  const [replyText, setReplyText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [notesList, setNotesList] = useState<string[]>([
    'Verified IP source Singapore. No abusive logs.',
  ]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        senderType: 'agent',
        senderName: 'Current Support Agent',
        text: replyText.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setReplyText('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim()) return;
    setNotesList((prev) => [...prev, internalNote.trim()]);
    setInternalNote('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <Link href="/admin/customer-service" className="inline-flex items-center gap-1 text-teal-600 font-bold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
        </Link>
      </div>

      <PageHeader
        title="Support Conversation: conv-8921"
        subtitle="Live agent thread communication with Guest 4821."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status="active" />
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
              Voucher Request
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {/* Main Chat Thread (2 cols) */}
        <div className="col-span-2 bg-white rounded border border-gray-200 shadow-sm flex flex-col h-[520px]">
          {/* Thread Header */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-800">
              <Headset className="w-4 h-4 text-amber-600" /> Live Chat Thread
            </div>
            <div className="text-[11px] text-gray-500 font-mono">Assigned: Support Agent Alpha</div>
          </div>

          {/* Thread Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
            {messages.map((m) => {
              const isAgent = m.senderType === 'agent';
              const isSystem = m.senderType === 'system';

              if (isSystem) {
                return (
                  <div key={m.id} className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 text-center font-mono">
                    {m.text}
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                  <div className="text-[10px] font-bold text-gray-500 mb-0.5">{m.senderName}</div>
                  <div
                    className={`max-w-[75%] p-3 rounded-lg text-xs leading-relaxed ${
                      isAgent
                        ? 'bg-teal-primary text-white font-medium rounded-tr-none shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono mt-0.5">{m.timestamp}</div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder="Type official support reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-teal-primary"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="bg-teal-primary hover:bg-teal-hover disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded inline-flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Send Reply
            </button>
          </form>
        </div>

        {/* Sidebar Info & Notes (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded border border-gray-200 p-4 space-y-3 shadow-sm text-xs">
            <div className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-600" /> Guest Details
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-gray-600">
              <div><span className="text-gray-400">Guest ID:</span> Guest 4821</div>
              <div><span className="text-gray-400">Auth Mode:</span> Anonymous Auth</div>
              <div><span className="text-gray-400">Source:</span> Receive Voucher</div>
              <div><span className="text-gray-400">Created:</span> Today 10:15 AM</div>
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 p-4 space-y-3 shadow-sm text-xs">
            <div className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600" /> Internal Notes (Audited)
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {notesList.map((note, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200 text-[11px] text-gray-700">
                  {note}
                </div>
              ))}
            </div>
            <form onSubmit={handleAddNote} className="space-y-2 pt-1">
              <input
                type="text"
                placeholder="Add internal note..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] py-1 rounded transition-colors"
              >
                Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
