import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  Lock,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  QrCode,
  Building2,
  Wallet,
  Copy,
  Check,
  X,
  Calendar,
  Zap,
  RefreshCw,
  LogOut,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import type {
  UserProfile,
  SubscriptionInfo,
  SubscriptionPlanType,
} from './types';
import { db } from './db';

export const MONTHLY_SUBSCRIPTION_PRICE = 27000;
export const FREE_TRIAL_DAYS = 7;

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getSubscriptionRemainingDays(sub: SubscriptionInfo | null): number {
  if (!sub || sub.status === 'expired') return 0;
  const diffMs = new Date(sub.expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isSubscriptionLocked(sub: SubscriptionInfo | null): boolean {
  if (!sub) return false;
  if (sub.status === 'expired') return true;
  return new Date(sub.expiresAt).getTime() <= Date.now();
}

// ============================================================================
// 1. KOMPONEN PEMILIH PAKET SAAT DAFTAR BARU (SIGN UP DI AUTHPAGE)
// ============================================================================
interface SubscriptionPlanSelectorProps {
  selectedPlan: SubscriptionPlanType;
  onSelectPlan: (plan: SubscriptionPlanType) => void;
  selectedPaymentMethod: string;
  onSelectPaymentMethod: (method: string) => void;
}

export function SubscriptionPlanSelector({
  selectedPlan,
  onSelectPlan,
  selectedPaymentMethod,
  onSelectPaymentMethod,
}: SubscriptionPlanSelectorProps) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Pilih Paket Langganan Akun</span>
        </label>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30">
          Wajib Saat Pendaftaran
        </span>
      </div>

      {/* 2 Pilihan Paket: Free Trial 7 Hari vs Langganan Pro Rp 27.000/Bulan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Paket 1: Free Trial 7 Hari */}
        <button
          type="button"
          onClick={() => onSelectPlan('free_trial_7d')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            selectedPlan === 'free_trial_7d'
              ? 'bg-gradient-to-b from-[#0071e3]/30 to-[#0a1b38]/90 border-[#38bdf8] shadow-lg shadow-[#0071e3]/20'
              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/70'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Free 7 Hari
            </span>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedPlan === 'free_trial_7d'
                  ? 'border-[#38bdf8] bg-[#38bdf8] text-black'
                  : 'border-white/30'
              }`}
            >
              {selectedPlan === 'free_trial_7d' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </div>
          <div className="font-black text-sm text-white">Rp 0 / 7 Hari</div>
          <p className="text-[10px] text-blue-100/75 mt-1 leading-relaxed">
            Akses penuh selama 7 hari pertama. Setelah 7 hari habis, akun terkunci otomatis &amp; lanjut Rp 27.000/bln.
          </p>
        </button>

        {/* Paket 2: Langganan Pro Bulanan Rp 27.000 */}
        <button
          type="button"
          onClick={() => onSelectPlan('pro_monthly')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            selectedPlan === 'pro_monthly'
              ? 'bg-gradient-to-b from-amber-500/25 to-[#0a1b38]/90 border-amber-400 shadow-lg shadow-amber-500/20'
              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/70'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
              Pro Bulanan
            </span>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedPlan === 'pro_monthly'
                  ? 'border-amber-400 bg-amber-400 text-black'
                  : 'border-white/30'
              }`}
            >
              {selectedPlan === 'pro_monthly' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </div>
          <div className="font-black text-sm text-white">Rp 27.000 / Bln</div>
          <p className="text-[10px] text-blue-100/75 mt-1 leading-relaxed">
            Langsung aktif 30 hari penuh tanpa kunci layar, termasuk Team Connect, AI &amp; Ekspor Laporan.
          </p>
        </button>
      </div>

      {/* Pilihan Metode Pembayaran jika memilih Pro Bulanan Rp 27.000 saat daftar */}
      {selectedPlan === 'pro_monthly' && (
        <div className="p-3 rounded-2xl bg-white/[0.05] border border-amber-400/30 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-amber-300">Metode Pembayaran (Rp 27.000):</span>
            <span className="text-emerald-300 font-semibold">Aktivasi Instan</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            {['QRIS Instan', 'BCA Virtual Account', 'GoPay / OVO / DANA'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSelectPaymentMethod(m)}
                className={`py-1.5 px-2 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                  selectedPaymentMethod === m
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-black/40 text-white/70 border-white/10 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center gap-2 text-[10px] text-blue-200">
        <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
        <span>
          Tarif tetap <strong>Rp 27.000/bulan</strong>. Jika masa aktif berakhir, workspace terkunci otomatis hingga diperpanjang.
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 2. BADGE STATUS LANGGANAN DI HEADER / SIDEBAR APP.TSX
// ============================================================================
interface SubscriptionStatusBadgeProps {
  subscription: SubscriptionInfo | null;
  onOpenModal: () => void;
}

export function SubscriptionStatusBadge({
  subscription,
  onOpenModal,
}: SubscriptionStatusBadgeProps) {
  if (!subscription) return null;
  const remDays = getSubscriptionRemainingDays(subscription);
  const isTrial = subscription.plan === 'free_trial_7d';
  const isLocked = isSubscriptionLocked(subscription);

  return (
    <button
      type="button"
      onClick={onOpenModal}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
        isLocked
          ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-sm'
          : isTrial
          ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs'
      }`}
      title="Klik untuk mengelola langganan Rp 27.000/bulan atau simulasi kunci layar"
    >
      {isLocked ? (
        <>
          <Lock className="w-3.5 h-3.5" />
          <span>Terkunci • Bayar Rp 27rb</span>
        </>
      ) : isTrial ? (
        <>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>
            Free 7H: <strong className="font-black">{remDays} Hari Lagi</strong>
          </span>
        </>
      ) : (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Pro Aktif <span className="hidden xl:inline">({remDays}h)</span>
          </span>
        </>
      )}
    </button>
  );
}

// ============================================================================
// 3. MODAL PEMBAYARAN & MANAJEMEN LANGGANAN (RP 27.000 / BULAN)
// ============================================================================
interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  user?: UserProfile;
  subscription: SubscriptionInfo | null;
  onSubscriptionUpdated?: (updated: SubscriptionInfo) => void;
  onConfirmPayment?: (paymentMethod: string) => void;
  onSimulateExpire?: () => void;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  currentUser: propCurrentUser,
  user: propUser,
  subscription: rawSubscription,
  onSubscriptionUpdated,
  onConfirmPayment,
  onSimulateExpire: propOnSimulateExpire,
}: SubscriptionModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'qris' | 'va' | 'ewallet'>('qris');
  const [selectedBank, setSelectedBank] = useState<string>('BCA Virtual Account');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const currentUser: UserProfile = propCurrentUser || propUser || {
    id: 'owner-admin',
    fullName: 'User',
    phone: '-',
    email: 'user@jadwalpro.id',
  };

  const subscription: SubscriptionInfo = rawSubscription || {
    userId: currentUser.id,
    userEmail: currentUser.email,
    userName: currentUser.fullName,
    plan: 'free_trial_7d',
    status: 'trial_active',
    pricePerMonth: MONTHLY_SUBSCRIPTION_PRICE,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    invoiceHistory: [],
  };

  if (!isOpen) return null;

  const remDays = getSubscriptionRemainingDays(subscription);
  const isLocked = isSubscriptionLocked(subscription);
  const isTrial = subscription.plan === 'free_trial_7d';

  const handlePayNow = () => {
    setIsProcessing(true);
    const methodLabel =
      selectedMethod === 'qris'
        ? 'QRIS Instan Nasional'
        : selectedMethod === 'va'
        ? selectedBank
        : 'E-Wallet (GoPay/OVO/DANA)';

    setTimeout(() => {
      if (onConfirmPayment) {
        onConfirmPayment(methodLabel);
      } else {
        const updated = db.activateMonthlySubscription(currentUser, methodLabel);
        if (onSubscriptionUpdated) onSubscriptionUpdated(updated);
      }
      setIsProcessing(false);
    }, 450);
  };

  const handleSimulateExpire = () => {
    if (propOnSimulateExpire) {
      propOnSimulateExpire();
      return;
    }
    const updated = db.simulateExpireSubscription(currentUser);
    if (onSubscriptionUpdated) onSubscriptionUpdated(updated);
    onClose();
  };

  const handleResetTrial = () => {
    const updated = db.initSubscriptionOnSignUp(currentUser, 'free_trial_7d');
    if (onSubscriptionUpdated) onSubscriptionUpdated(updated);
  };

  const handleCopyPaymentCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-amber-300 shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Langganan Workspace &amp; Status Masa Aktif
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-black">
                  Rp 27.000 / Bulan
                </span>
              </div>
              <p className="text-[11px] text-indigo-200">
                Owner: {currentUser.fullName} ({currentUser.email})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Status Paket Saat Ini */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Paket Aktif Saat Ini:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isLocked
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : isTrial
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {isLocked
                    ? 'Masa Aktif Habis (Terkunci)'
                    : isTrial
                    ? 'Paket Free Trial (7 Hari)'
                    : 'Paket Pro Bulanan (Aktif)'}
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900">
                {isLocked
                  ? 'Masa aktif telah berakhir — Silakan perpanjang Rp 27.000/bulan'
                  : `Sisa Masa Aktif: ${remDays} Hari Lagi`}
              </div>
              <div className="text-[11px] text-slate-500">
                Berlaku s/d:{' '}
                <strong className="text-slate-800">
                  {new Date(subscription.expiresAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>
            </div>

            {/* Tombol Simulasi Testing Penguncian 7 Hari Habis */}
            <div className="flex flex-wrap sm:flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleSimulateExpire}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Uji coba bagaimana tampilan saat masa Free 7 Hari habis dan layar terkunci"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Simulasi Habis 7 Hari (Tes Lock)</span>
              </button>
              <button
                type="button"
                onClick={handleResetTrial}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Free Trial 7 Hari</span>
              </button>
            </div>
          </div>

          {/* Perbandingan 2 Paket */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                  Paket 1 • Free Trial
                </span>
                <span className="font-black text-sm text-slate-900">Rp 0 / 7 Hari</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Akses penuh seluruh fitur selama 7 hari</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Otomatis terkunci penuh setelah 7 hari habis</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50/40 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px]">
                  Paket 2 • Langganan Bulanan
                </span>
                <span className="font-black text-base text-indigo-700">
                  {formatRupiah(MONTHLY_SUBSCRIPTION_PRICE)} <span className="text-[10px] font-normal">/bln</span>
                </span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-700 font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Aktif penuh 30 hari &amp; buka seluruh kunci akses</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Full Team Connect (Auto-Sync Akun A &amp; B) &amp; Ekspor</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Checkout Pembayaran Rp 27.000 / Bulan */}
          <div className="p-4 rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Pembayaran Langganan Bulanan (Rp 27.000 / Bulan)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Pilih metode pembayaran di bawah untuk mengaktifkan atau memperpanjang masa aktif 30 hari.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Total Tagihan Bulanan</span>
                <span className="text-lg font-black text-indigo-700">Rp 27.000</span>
              </div>
            </div>

            {/* Tab Metode Pembayaran */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('qris')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedMethod === 'qris'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS Instan</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('va')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedMethod === 'va'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Virtual Account</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('ewallet')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedMethod === 'ewallet'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>GoPay / OVO / DANA</span>
              </button>
            </div>

            {/* Detail Instruksi Metode Pembayaran */}
            {selectedMethod === 'qris' && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 rounded-2xl bg-slate-900 p-2.5 flex flex-col items-center justify-center text-white shrink-0 border-2 border-indigo-500 shadow-md">
                  <QrCode className="w-16 h-16 text-white" />
                  <span className="text-[9px] font-black tracking-widest uppercase mt-1 text-amber-300">
                    QRIS Rp 27.000
                  </span>
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="font-extrabold text-xs text-slate-900">
                    Scan QRIS dengan Aplikasi M-Banking / E-Wallet Apa Saja
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Mendukung BCA Mobile, Livin Mandiri, BRImo, BNI, GoPay, OVO, DANA, dan ShopeePay. Nominal otomatis terisi <strong>Rp 27.000</strong>.
                  </p>
                  <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-block">
                    NMID: ID2026JADWALPRO27000
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'va' && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {['BCA Virtual Account', 'Mandiri Virtual Account', 'BRI Virtual Account', 'BNI Virtual Account'].map(
                    (bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          selectedBank === bank
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {bank}
                      </button>
                    )
                  )}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">{selectedBank}</span>
                    <span className="text-sm font-black font-mono text-slate-900 tracking-wider">
                      8801 2700 0202 6889
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPaymentCode('8801270002026889')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Tersalin' : 'Salin VA'}</span>
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'ewallet' && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-900">
                  Pembayaran Instan E-Wallet (Rp 27.000)
                </div>
                <p className="text-[11px] text-slate-600">
                  Klik tombol konfirmasi di bawah untuk menyelesaikan pembayaran Rp 27.000 melalui GoPay, OVO, DANA, atau ShopeePay Anda.
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePayNow}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>
                {isProcessing
                  ? 'Memverifikasi Pembayaran...'
                  : 'Bayar & Aktifkan Langganan Rp 27.000 / Bulan (+30 Hari)'}
              </span>
            </button>
          </div>

          {/* Riwayat Tagihan / Invoice */}
          {subscription.invoiceHistory && subscription.invoiceHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                <span>Riwayat Pembayaran Langganan</span>
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="py-2 px-3">No. Invoice</th>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">Metode</th>
                      <th className="py-2 px-3">Nominal</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscription.invoiceHistory.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{inv.id}</td>
                        <td className="py-2 px-3 text-slate-600">
                          {new Date(inv.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{inv.method}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{formatRupiah(inv.amount)}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                            LUNAS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. LAYAR KUNCI OTOMATIS (PAYWALL GATE) SAAT FREE TRIAL 7 HARI / BULANAN HABIS
// ============================================================================
interface SubscriptionPaywallGateProps {
  currentUser?: UserProfile;
  user?: UserProfile;
  subscription: SubscriptionInfo | null;
  onSubscriptionUpdated?: (updated: SubscriptionInfo) => void;
  onConfirmPayment?: (paymentMethod: string) => void;
  onLogout: () => void;
}

export function SubscriptionPaywallGate({
  currentUser: propCurrentUser,
  user: propUser,
  onSubscriptionUpdated,
  onConfirmPayment,
  onLogout,
}: SubscriptionPaywallGateProps) {
  const [selectedMethod, setSelectedMethod] = useState<'qris' | 'va' | 'ewallet'>('qris');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const currentUser: UserProfile = propCurrentUser || propUser || {
    id: 'owner-admin',
    fullName: 'User',
    phone: '-',
    email: 'user@jadwalpro.id',
  };

  const handleUnlockWithPayment = () => {
    setIsProcessing(true);
    const methodLabel =
      selectedMethod === 'qris'
        ? 'QRIS Instan Nasional'
        : selectedMethod === 'va'
        ? 'Virtual Account Bank'
        : 'E-Wallet Instan';

    setTimeout(() => {
      if (onConfirmPayment) {
        onConfirmPayment(methodLabel);
      } else {
        const updated = db.activateMonthlySubscription(currentUser, methodLabel);
        if (onSubscriptionUpdated) onSubscriptionUpdated(updated);
      }
      setIsProcessing(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-gradient-to-b from-[#0e172a] to-[#070b14] text-white rounded-3xl border border-rose-500/40 shadow-2xl overflow-hidden my-auto">
        {/* Top Banner Terkunci */}
        <div className="p-6 bg-gradient-to-r from-rose-600/30 via-indigo-900/40 to-amber-500/20 border-b border-white/10 text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mx-auto shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white">
            Masa Aktif 7 Hari Habis • Akses Terkunci
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Workspace Anda Saat Ini Terkunci
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Masa uji coba gratis 7 hari (atau periode bulanan) untuk akun{' '}
            <strong className="text-white">{currentUser.fullName}</strong> telah berakhir. Lakukan pembayaran{' '}
            <strong className="text-amber-300">Rp 27.000 / bulan</strong> untuk membuka kembali seluruh fitur dan data kerja Anda.
          </p>
        </div>

        {/* Form Pembayaran Buka Kunci */}
        <div className="p-6 space-y-5 text-xs">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Paket Berlangganan Bulanan
              </span>
              <span className="text-base font-black text-white">
                JadwalPro Full Workspace + Team Connect
              </span>
              <span className="text-[11px] text-emerald-400 block mt-0.5">
                ✓ Data kalender, presensi, laporan &amp; catatan Anda tetap aman tersimpan
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-black text-amber-400">Rp 27.000</span>
              <span className="text-[10px] text-slate-400 block">/ bulan (30 hari)</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Pilih Metode Pembayaran Instan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('qris')}
                className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  selectedMethod === 'qris'
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                    : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS Instan</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('va')}
                className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  selectedMethod === 'va'
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                    : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Virtual Account</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('ewallet')}
                className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  selectedMethod === 'ewallet'
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                    : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>GoPay / DANA</span>
              </button>
            </div>
          </div>

          {selectedMethod === 'qris' && (
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3.5">
              <div className="w-20 h-20 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0">
                <QrCode className="w-16 h-16 text-slate-900" />
              </div>
              <div className="space-y-1 text-left">
                <div className="font-bold text-white text-xs">QRIS Nasional — Rp 27.000</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Scan menggunakan aplikasi perbankan atau e-wallet Anda, lalu klik tombol konfirmasi di bawah untuk membuka kunci secara instan.
                </p>
              </div>
            </div>
          )}

          {selectedMethod === 'va' && (
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Nomor Virtual Account (BCA / Mandiri / BRI):</span>
                <span className="font-mono font-black text-sm text-amber-300 tracking-wider">
                  8801 2700 0202 6889
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-white/10 text-white font-bold text-[10px]">
                Rp 27.000
              </span>
            </div>
          )}

          {selectedMethod === 'ewallet' && (
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 text-slate-300 text-[11px]">
              Pembayaran instan terhubung ke nomor HP akun ({currentUser.phone || 'Aktif'}) sebesar <strong>Rp 27.000</strong>.
            </div>
          )}

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleUnlockWithPayment}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Membuka Kunci Workspace...'
                : 'Bayar Rp 27.000 & Buka Kunci Workspace Sekarang'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ingin beralih ke akun lain?</span>
            <button
              type="button"
              onClick={onLogout}
              className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}