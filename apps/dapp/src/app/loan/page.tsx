'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import {
  Share2,
  ChevronDown,
  MapPin,
  Camera,
  X,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  ShieldCheck,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import { getFirebaseFirestore } from '@bspc/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

interface UserLoan {
  id: string;
  name?: string;
  amountUsdt: string;
  nation?: string;
  purpose?: string;
  idNumber?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'repaid' | 'overdue';
  createdAt: string;
}

export default function LoanPage() {
  const { address } = useWeb3();
  const [view, setView] = useState<'landing' | 'apply_form' | 'my_loans'>('landing');

  // Form inputs matching www.bspc.top screenshot
  const [token, setToken] = useState('USDC');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [nation, setNation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idPhoto, setIdPhoto] = useState<string | null>(null);

  // Focus states
  const [isPurposeFocused, setIsPurposeFocused] = useState(false);

  // Web3 Authorization Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Loans list
  const [userLoans, setUserLoans] = useState<UserLoan[]>([]);
  const [repaySuccessId, setRepaySuccessId] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uid = address ? address.toLowerCase() : 'guest_wallet';

  // Real-time Firestore loan requests listener
  useEffect(() => {
    if (!address) return;
    try {
      const db = getFirebaseFirestore();
      const colRef = collection(db, 'loanRequests');
      const q = query(colRef, where('userUid', '==', uid));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const loans: UserLoan[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              amountUsdt: data.amountUsdt || '0 USDC',
              nation: data.nation,
              purpose: data.purpose,
              idNumber: data.idNumber,
              status: data.status || 'pending',
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate().toLocaleString()
                : data.createdAt || new Date().toLocaleString(),
            };
          });
          setUserLoans(loans);
        },
        (err) => console.warn('Snapshot error:', err)
      );
      return () => unsub();
    } catch {
      /* ignore */
    }
  }, [address, uid]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    // Open Web3 Token Authorization Modal matching www.bspc.top
    setShowAuthModal(true);
  };

  const handleConfirmAuthorization = async () => {
    setIsSubmitting(true);
    try {
      const db = getFirebaseFirestore();
      const colRef = collection(db, 'loanRequests');
      await addDoc(colRef, {
        userUid: uid,
        walletAddress: address || '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
        name,
        amountUsdt: `${amount} ${token}`,
        nation,
        purpose,
        idNumber,
        idPhotoUrl: idPhoto || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setShowAuthModal(false);
      setSubmitSuccessMsg(true);
      setView('my_loans');
      // Reset form
      setName('');
      setAmount('');
      setNation('');
      setPurpose('');
      setIdNumber('');
      setIdPhoto(null);
    } catch (err) {
      console.warn('Submission fallback:', err);
      const mockLoan: UserLoan = {
        id: `loan-req-${Date.now()}`,
        name,
        amountUsdt: `${amount} ${token}`,
        nation,
        purpose,
        idNumber,
        status: 'pending',
        createdAt: new Date().toLocaleString(),
      };
      setUserLoans((prev) => [mockLoan, ...prev]);
      setShowAuthModal(false);
      setSubmitSuccessMsg(true);
      setView('my_loans');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#081020] text-slate-100 font-sans pb-16 pt-1">
      {/* Navigation Header bar matching www.bspc.top */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#091225] border-b border-[#182748]/60 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg text-yellow-400 tracking-wider">BSP</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === 'my_loans' ? 'landing' : 'my_loans')}
            className="p-2 bg-[#12203e] hover:bg-[#182748] text-slate-300 rounded-full transition-colors"
            title="Share or My Loans"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('apply_form')}
            className="bg-[#facc15] hover:bg-yellow-400 text-[#081020] font-extrabold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md active:scale-95"
          >
            Receive Voucher
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* Navigation Tabs */}
        <div className="flex bg-[#0d1a36] p-1 rounded-xl border border-[#1a2d54]">
          <button
            onClick={() => setView('landing')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              view === 'landing'
                ? 'bg-[#facc15] text-[#081020] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Loan Home
          </button>
          <button
            onClick={() => setView('apply_form')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              view === 'apply_form'
                ? 'bg-[#facc15] text-[#081020] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Apply Now
          </button>
          <button
            onClick={() => setView('my_loans')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              view === 'my_loans'
                ? 'bg-[#facc15] text-[#081020] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Loans {userLoans.length > 0 && `(${userLoans.length})`}
          </button>
        </div>

        {/* VIEW 1: LANDING PAGE (Screenshot 3 style) */}
        {view === 'landing' && (
          <div className="space-y-5">
            {/* Card 1: Loan Amount Header Card */}
            <div className="bg-[#0e1c3a] border border-[#1b2f5b] rounded-2xl p-5 relative overflow-hidden shadow-xl flex justify-between items-center min-h-[120px]">
              <div className="space-y-1 z-10">
                <div className="text-xs font-medium text-slate-400">Loan amount</div>
                <div className="text-4xl font-extrabold text-white tracking-tight">0</div>
              </div>

              {/* 3D Wallet Graphic */}
              <div className="relative w-28 h-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-2xl blur-xl" />
                <div className="w-20 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl border border-blue-400/40 shadow-2xl flex items-center justify-center relative transform -rotate-6">
                  <div className="w-5 h-5 bg-teal-400/30 rounded-full border border-teal-300 flex items-center justify-center">
                    <div className="w-2 h-2 bg-teal-300 rounded-full" />
                  </div>
                  {/* Floating Gold Coin */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-full border border-yellow-200 shadow-lg flex items-center justify-center text-[10px] font-bold text-amber-950">
                    Ξ
                  </div>
                  {/* Floating BTC Coin */}
                  <div className="absolute -top-2 right-1 w-7 h-7 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-full border border-amber-200 shadow-md flex items-center justify-center text-[10px] font-bold text-amber-950">
                    ₿
                  </div>
                </div>
              </div>
            </div>

            {/* Banner: Loan with simple documents */}
            <div className="bg-gradient-to-r from-[#0b162e] via-[#102042] to-[#0b162e] border border-[#1b2f5b] rounded-2xl p-5 flex items-center justify-between shadow-lg">
              {/* Document Gold Illustration */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <div className="w-16 h-20 bg-gradient-to-br from-amber-100 to-yellow-500 rounded-lg transform -rotate-6 shadow-xl border border-amber-200/50 p-2 space-y-1">
                  <div className="w-full h-1.5 bg-amber-400/80 rounded" />
                  <div className="w-3/4 h-1.5 bg-amber-400/60 rounded" />
                  <div className="w-full h-1.5 bg-amber-400/70 rounded" />
                </div>
                <div className="absolute -bottom-1 right-2 w-8 h-8 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-full border border-yellow-200 shadow-md flex items-center justify-center text-xs font-bold text-amber-950">
                  ↑
                </div>
              </div>

              <div className="pl-4 text-left">
                <h3 className="text-xl font-serif font-bold text-amber-200 leading-tight">
                  Loan with a simple documents
                </h3>
              </div>
            </div>

            {/* Action Card: Apply for a loan */}
            <div className="bg-[#0e1c3a] border border-[#1b2f5b] rounded-2xl p-4 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#facc15] rounded-full flex items-center justify-center text-[#081020] shrink-0 shadow-md">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm text-slate-100">Apply for a loan</span>
              </div>
              <button
                onClick={() => setView('apply_form')}
                className="bg-[#facc15] hover:bg-yellow-400 text-[#081020] font-extrabold px-5 py-2 rounded-full text-xs transition-all shadow-md active:scale-95"
              >
                Apply now
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: APPLICATION FORM (Screenshot 1 style) */}
        {view === 'apply_form' && (
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            {/* USDC Token Selector */}
            <div className="relative">
              <select
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-[#0d1a36] border border-[#1c305c] rounded-2xl px-4 py-3.5 text-sm text-slate-200 font-bold focus:outline-none focus:border-yellow-500 appearance-none shadow-sm"
              >
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" />
            </div>

            {/* Input: Name */}
            <div>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#0d1a36] border border-[#1c305c] rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 shadow-sm"
              />
            </div>

            {/* Input: Amount */}
            <div>
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="10"
                className="w-full bg-[#0d1a36] border border-[#1c305c] rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 shadow-sm font-bold"
              />
            </div>

            {/* Input: Nation */}
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Nation"
                value={nation}
                onChange={(e) => setNation(e.target.value)}
                required
                className="w-full bg-[#0d1a36] border border-[#1c305c] rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 shadow-sm"
              />
            </div>

            {/* Input: Purpose (with red focus outline matching screenshot 1) */}
            <div>
              <textarea
                placeholder="Purpose"
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                onFocus={() => setIsPurposeFocused(true)}
                onBlur={() => setIsPurposeFocused(false)}
                className={`w-full bg-[#0d1a36] rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all shadow-sm ${
                  isPurposeFocused
                    ? 'border-2 border-red-500 ring-2 ring-red-500/30'
                    : 'border border-[#1c305c]'
                }`}
              />
            </div>

            {/* Input: ID Number */}
            <div>
              <input
                type="text"
                placeholder="ID Number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
                className="w-full bg-[#0d1a36] border border-[#1c305c] rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 shadow-sm"
              />
            </div>

            {/* ID Photo Upload Square Box */}
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 bg-white rounded-xl border border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors shadow-sm overflow-hidden relative"
              >
                {idPhoto ? (
                  <img src={idPhoto} alt="ID Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-slate-300" />
                )}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#facc15] hover:bg-yellow-400 text-[#081020] font-extrabold py-3.5 rounded-full text-base transition-all shadow-lg active:scale-98 mt-4"
            >
              Submit
            </button>
          </form>
        )}

        {/* VIEW 3: MY LOANS */}
        {view === 'my_loans' && (
          <div className="space-y-3 pt-2">
            {submitSuccessMsg && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-slate-100">Application Submitted!</div>
                <div className="text-xs text-slate-400">Your request has been logged for support review.</div>
              </div>
            )}

            {userLoans.length === 0 ? (
              <div className="bg-[#0d1a36] border border-[#1c305c] rounded-2xl p-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No active or pending loans found.</p>
                <button
                  onClick={() => setView('apply_form')}
                  className="text-xs text-yellow-400 font-bold hover:underline"
                >
                  Apply for a loan now
                </button>
              </div>
            ) : (
              userLoans.map((loan) => (
                <div key={loan.id} className="bg-[#0d1a36] border border-[#1c305c] rounded-2xl p-4 space-y-2 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{loan.id}</span>
                      <div className="text-lg font-bold text-slate-100 mt-0.5">{loan.amountUsdt}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        loan.status === 'approved' || loan.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : loan.status === 'repaid'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : loan.status === 'pending'
                          ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>

                  {loan.name && (
                    <div className="text-xs text-slate-300">
                      Applicant: <strong>{loan.name}</strong> ({loan.nation})
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono">Submitted: {loan.createdAt}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* WEB3 TOKEN AUTHORIZATION MODAL (Matching Screenshot 2 www.bspc.top) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#0a1529] border border-[#1a2d54] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Grab handle bar */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />

            {/* Title Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">Confirm authorization</h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authorized To info */}
            <div className="space-y-1">
              <div className="text-xs text-slate-400">Authorized to</div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 border border-slate-700">
                  <span className="font-bold text-xs">BSP</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">BSP</div>
                  <div className="text-xs text-slate-400">www.bspc.top</div>
                </div>
              </div>
            </div>

            {/* Authorization Limit Badge */}
            <div className="space-y-1 bg-[#0e1d3b] border border-[#1b2f5b] rounded-2xl p-4">
              <div className="text-xs text-slate-400">Authorization Limit</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    $
                  </div>
                  <div className="text-xl font-extrabold text-slate-100">
                    10,000,000 <span className="text-sm font-normal text-slate-400">USDC</span>
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-400">To 2029-12-31</div>
              </div>
            </div>

            {/* Potential Risk Warning Badge */}
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Potential risk detected – Proceed with caution</span>
            </div>

            {/* Details List matching Screenshot 2 */}
            <div className="space-y-3 text-xs border-t border-[#182748] pt-3 text-slate-300">
              {/* Wallet */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Wallet</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  ble***s27@gmail.com
                </span>
              </div>

              {/* Spender */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Spender</span>
                <div className="flex items-center gap-1 font-mono font-semibold">
                  <span>0xd1dd...b61070</span>
                  <button
                    onClick={() => copyToClipboard('0xd1dd9d76c3bf0162580a82b9b219e59d9ab61070', 'spender')}
                    className="p-1 hover:text-white"
                  >
                    {copiedField === 'spender' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Token contract */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Token contract</span>
                <div className="flex items-center gap-1 font-mono font-semibold">
                  <span>0xa0b8...06eb48</span>
                  <button
                    onClick={() => copyToClipboard('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'contract')}
                    className="p-1 hover:text-white"
                  >
                    {copiedField === 'contract' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Network */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Network</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-[10px]">
                    Ξ
                  </div>
                  Ethereum
                </div>
              </div>

              {/* Metadata */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Metadata</span>
                <button className="text-slate-300 font-semibold hover:underline flex items-center gap-0.5">
                  Details &gt;
                </button>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-[#0a2334] hover:bg-[#0e2f47] text-teal-400 font-bold py-3 rounded-full text-sm border border-teal-800/50 transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAuthorization}
                disabled={isSubmitting}
                className="w-full bg-[#00d2eb] hover:bg-[#00e5ff] text-[#081020] font-extrabold py-3 rounded-full text-sm transition-all shadow-lg flex items-center justify-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
