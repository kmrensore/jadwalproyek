import React, { useState } from 'react';
import {
  Calendar,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Clock,
  Lightbulb,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Shield,
  TrendingUp,
  X,
  Activity,
  Check,
  FolderKanban,
  Presentation,
  Timer,
  ChevronLeft,
  ChevronDown,
  Globe,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import type { UserProfile } from './types';
import { db } from './db';

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activePreviewTab, setActivePreviewTab] = useState<'calendar' | 'charts' | 'attendance' | 'ideas'>('calendar');

  const openAuth = (signUpMode: boolean = false) => {
    setIsSignUp(signUpMode);
    setErrorMessage(null);
    setIsAuthModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Silakan lengkapi alamat email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const cleanName = fullName.trim();
        const cleanPhone = phone.trim();

        if (!cleanName) {
          setErrorMessage('Silakan masukkan nama lengkap Anda.');
          setIsLoading(false);
          return;
        }

        if (db.signUp) {
          const res = await db.signUp({
            fullName: cleanName,
            phone: cleanPhone || '-',
            email: cleanEmail,
            password: cleanPassword,
          });

          if (res.error) {
            setErrorMessage(res.error);
            setIsLoading(false);
            return;
          }

          if (res.user) {
            onAuthSuccess(res.user);
            return;
          }
        }

        const localUser: UserProfile = {
          id: `owner-${Date.now().toString(36)}`,
          fullName: cleanName,
          phone: cleanPhone || '-',
          email: cleanEmail,
          createdAt: new Date().toISOString(),
        };
        onAuthSuccess(localUser);
      } else {
        if (db.signIn) {
          const res = await db.signIn(cleanEmail, cleanPassword);

          if (res.error) {
            setErrorMessage(res.error);
            setIsLoading(false);
            return;
          }

          if (res.user) {
            onAuthSuccess(res.user);
            return;
          }
        }

        const localUser: UserProfile = {
          id: 'owner-local-admin',
          fullName: cleanEmail.split('@')[0] || 'User',
          phone: '-',
          email: cleanEmail,
          createdAt: new Date().toISOString(),
        };
        onAuthSuccess(localUser);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kendala saat melakukan otentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#1f1f1f] flex flex-col font-sans selection:bg-[#1a73e8] selection:text-white antialiased">
      {/* 1. DEEPMIND STYLE FLOATING PILL NAVBAR */}
      <div className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <header className="max-w-7xl mx-auto h-16 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-full px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs transition-all">
          {/* Logo Brand Style DeepMind */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                JadwalPro
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
              <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 tracking-tight">
                Workspace
              </span>
            </div>
          </div>

          {/* DeepMind Style Minimal Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-600">
            <a href="#kalender" className="hover:text-slate-900 transition-colors">Kalender Proyek</a>
            <a href="#grafik" className="hover:text-slate-900 transition-colors">4 Grafik Analitik</a>
            <a href="#presensi" className="hover:text-slate-900 transition-colors">Presensi &amp; Lembur</a>
            <a href="#bank-ide" className="hover:text-slate-900 transition-colors">Bank Ide</a>
            <a href="#bento" className="hover:text-slate-900 transition-colors">Fitur Lengkap</a>
          </nav>

          {/* Right Action Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuth(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => openAuth(true)}
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-xs transition-all transform hover:scale-[1.02]"
            >
              Mulai Sekarang
            </button>
          </div>
        </header>
      </div>

      {/* 2. DEEPMIND HERO SECTION: CLEAN, MASSIVE TYPOGRAPHY & EDITORIAL QUOTE */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center space-y-10">
        {/* Kicker Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium tracking-tight">
          <span className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse" />
          <span>Research &amp; Workspace Platform 2026</span>
        </div>

        {/* Massive Headline */}
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal text-slate-900 tracking-tight leading-[1.08]">
            Membuktikan kinerja nyata melalui{' '}
            <span className="font-extrabold text-[#1a73e8]">
              efisiensi &amp; data konkret.
            </span>
          </h1>

          {/* DeepMind Style Editorial Pull-Quote Sesuai Permintaan User */}
          <div className="max-w-3xl mx-auto pt-2">
            <div className="p-6 sm:p-7 rounded-3xl bg-[#f8f9fa] border border-slate-200/80 shadow-2xs relative text-left">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#1a73e8] flex items-center justify-center font-serif text-lg font-bold mb-2">
                &ldquo;
              </div>
              <p className="text-base sm:text-lg text-slate-800 font-normal leading-relaxed italic">
                &ldquo;Seorang profesional tidak sekadar &lsquo;bekerja keras&rsquo;, melainkan mampu membuktikan efisiensi, akuntabilitas, dan nilai tambah kerjanya melalui data konkret.&rdquo;
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Prinsip Akuntabilitas JadwalPro</span>
                <span className="font-semibold text-slate-700">Terukur • Terjadwal • Terverifikasi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            type="button"
            onClick={() => openAuth(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>Daftar &amp; Buka Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => openAuth(false)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200/90 shadow-2xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Masuk ke Akun Anda</span>
          </button>
        </div>

        {/* 3. HERO INTERACTIVE PREVIEW TABS (KALENDER & 4 GRAFIK) */}
        <div className="pt-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
            {/* Tab Selector Header Style DeepMind */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('calendar')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                    activePreviewTab === 'calendar'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Pratinjau: Kalender Proyek Nyata</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('charts')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                    activePreviewTab === 'charts'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Pratinjau: 4 Grafik Analitik SVG</span>
                </button>
              </div>

              <div className="text-[11px] font-semibold text-slate-500 hidden sm:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Sampel Data Riil November 2026</span>
              </div>
            </div>

            {/* TAB PREVIEW CONTENT */}
            {activePreviewTab === 'calendar' && (
              <div id="kalender" className="p-4 sm:p-6 space-y-3">
                {/* Kalender Header Bar */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-bold text-slate-900">November 2026</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1a73e8] border border-blue-200">
                      Multi-Hari Aktif
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Multi-Hari
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Libur Nasional
                    </span>
                  </div>
                </div>

                {/* Day Labels */}
                <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-bold py-2 bg-slate-50 uppercase tracking-wider text-slate-500 rounded-xl">
                  <span>Sen</span>
                  <span>Sel</span>
                  <span>Rab</span>
                  <span>Kam</span>
                  <span>Jum</span>
                  <span className="text-rose-600">Sab</span>
                  <span className="text-rose-600">Min</span>
                </div>

                {/* Exact Calendar Cells Matching Screenshot 1 */}
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-xs border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="min-h-[85px] p-2 bg-slate-50/40 text-slate-400 font-semibold">26</div>
                  <div className="min-h-[85px] p-2 bg-slate-50/40 text-slate-400 font-semibold">27</div>
                  <div className="min-h-[85px] p-2 bg-amber-50/30 space-y-1">
                    <span className="font-semibold text-slate-700">28</span>
                    <div className="p-1 rounded bg-amber-100 text-[9px] font-bold text-amber-900 border border-amber-300">
                      Hari Sumpah Pemuda
                    </div>
                  </div>
                  <div className="min-h-[85px] p-2 bg-slate-50/40 text-slate-400 font-semibold">29</div>
                  <div className="min-h-[85px] p-2 bg-slate-50/40 text-slate-400 font-semibold">30</div>
                  <div className="min-h-[85px] p-2 bg-slate-50/40 text-rose-400 font-semibold">31</div>
                  <div className="min-h-[85px] p-2 bg-slate-50/40 text-rose-500 font-semibold">1</div>

                  {/* Row 2: 2 - 8 */}
                  <div className="min-h-[105px] p-2 space-y-1 bg-white text-left">
                    <span className="font-bold text-slate-800">2</span>
                    <div className="p-1 rounded bg-purple-50 text-[9.5px] font-bold text-purple-800 border border-purple-200 truncate">
                      meeting... <span className="font-normal text-purple-600">Dokumentasi</span>
                    </div>
                    <div className="p-1 rounded bg-amber-50 text-[9.5px] font-bold text-amber-800 border border-amber-200 truncate">
                      admin <span className="font-normal text-amber-600">1h admin</span>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-600 block">+3 lagi &gt;</span>
                  </div>

                  <div className="min-h-[105px] p-2 space-y-1 bg-white text-left">
                    <span className="font-bold text-slate-800">3</span>
                    <div className="p-1 rounded bg-amber-100 text-[9.5px] font-black text-amber-900 border border-amber-300 truncate">
                      ⚠️ Annual R... <span className="font-normal text-amber-800">Rakernas</span>
                    </div>
                    <div className="p-1 rounded bg-purple-50 text-[9.5px] font-semibold text-purple-800 border border-purple-200 truncate">
                      H-2 IR... 2h Kolaborasi
                    </div>
                  </div>

                  <div className="min-h-[105px] p-2 space-y-1 bg-white text-left">
                    <span className="font-bold text-slate-800">4</span>
                    <div className="p-1 rounded bg-amber-100 text-[9.5px] font-bold text-amber-900 border border-amber-300 truncate">
                      H-2 ⚠️ A... Rakernas
                    </div>
                    <div className="p-1 rounded bg-indigo-50 text-[9.5px] font-bold text-indigo-800 border border-indigo-200 truncate">
                      sosmed 1h Divisi Sosmed
                    </div>
                  </div>

                  <div className="min-h-[105px] p-2 space-y-1 bg-white text-left">
                    <span className="font-bold text-slate-800">5</span>
                    <div className="p-1 rounded bg-amber-100 text-[9.5px] font-bold text-amber-900 border border-amber-300 truncate">
                      H-3 ⚠️ A... Rakernas
                    </div>
                    <div className="p-1 rounded bg-blue-50 text-[9.5px] font-semibold text-blue-800 border border-blue-200 truncate">
                      nyuci-gr... 1h Konten Nyuci
                    </div>
                  </div>

                  <div className="min-h-[105px] p-2 space-y-1 bg-white text-left">
                    <span className="font-bold text-slate-800">6</span>
                    <div className="p-1 rounded bg-purple-50 text-[9.5px] font-bold text-purple-800 border border-purple-200 truncate">
                      narasi Konten Nyuci
                    </div>
                    <div className="p-1 rounded bg-purple-100 text-[9px] font-bold text-purple-900 border border-purple-300 truncate">
                      V.. 1h <span className="text-purple-700 bg-white px-1 rounded">+1 Rev</span>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-600 block">+2 lagi &gt;</span>
                  </div>

                  <div className="min-h-[105px] p-2 bg-slate-50/30 text-rose-500 font-bold">7</div>
                  <div className="min-h-[105px] p-2 bg-slate-50/30 text-rose-500 font-bold">8</div>

                  {/* Row 3: 9 - 15 */}
                  <div className="min-h-[105px] p-2 space-y-1 bg-white text-left">
                    <span className="font-bold text-slate-800">9</span>
                    <div className="p-1 rounded bg-purple-50 text-[9.5px] font-bold text-purple-800 border border-purple-200 truncate">
                      [Revisi].. 1h Konten Nyuci
                    </div>
                    <div className="p-1 rounded bg-rose-50 text-[9.5px] font-bold text-rose-800 border border-rose-200 truncate">
                      briefing.. 1h Briefing Senin
                    </div>
                  </div>

                  <div className="min-h-[105px] p-2 space-y-1 bg-blue-50/40 ring-2 ring-inset ring-[#1a73e8] text-left">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-[#1a73e8] text-white font-extrabold flex items-center justify-center text-[10px]">10</span>
                      <span className="text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded bg-[#1a73e8] text-white">Hari Ini</span>
                    </div>
                    <div className="p-1 rounded bg-amber-100 text-[9px] font-bold text-amber-900 border border-amber-300">
                      Hari Pahlawan Nasional
                    </div>
                    <div className="p-1 rounded bg-teal-50 text-[9.5px] font-bold text-teal-800 border border-teal-200 truncate">
                      Pindahin.. IPHONE 15 PRO
                    </div>
                  </div>

                  <div className="min-h-[105px] p-2 bg-white font-semibold text-slate-700 text-left">11</div>
                  <div className="min-h-[105px] p-2 bg-white font-semibold text-slate-700 text-left">12</div>
                  <div className="min-h-[105px] p-2 bg-white font-semibold text-slate-700 text-left">13</div>
                  <div className="min-h-[105px] p-2 bg-slate-50/30 text-rose-500 font-bold text-left">14</div>
                  <div className="min-h-[105px] p-2 bg-slate-50/30 text-rose-500 font-bold text-left">15</div>
                </div>
              </div>
            )}

            {/* TAB 2: 4 GRAFIK ANALITIK SVG (MENGGAMBARKAN PERSIS SCREENSHOT 2) */}
            {activePreviewTab === 'charts' && (
              <div id="grafik" className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                {/* Grafik 1 */}
                <div className="p-5 rounded-2xl bg-[#f8f9fa] border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a73e8]">Grafik 1: Tren Tahunan 12 Bulan</span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">Ringkasan Beban Proyek (Januari — Desember)</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-600">7 Proyek</span>
                  </div>

                  <div className="w-full">
                    <svg viewBox="0 0 540 170" className="w-full h-auto select-none font-sans">
                      <line x1="30" y1="20" x2="520" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="75" x2="520" y2="75" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="130" x2="520" y2="130" stroke="#cbd5e1" strokeDasharray="3 3" />
                      <text x="22" y="24" fontSize="9" fill="#94a3b8" textAnchor="end">12</text>
                      <text x="22" y="79" fontSize="9" fill="#94a3b8" textAnchor="end">6</text>
                      <text x="22" y="134" fontSize="9" fill="#94a3b8" textAnchor="end">0</text>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => (
                        <text key={i} x={45 + i * 40} y="150" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold">{m}</text>
                      ))}
                      <polyline fill="none" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="45,130 85,130 125,130 165,130 205,130 245,130 285,130 325,130 365,130 405,130 445,20 485,130" />
                      <circle cx="445" cy="20" r="4" fill="#1a73e8" stroke="#fff" strokeWidth="2" />
                      <polyline fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="45,130 85,130 125,130 165,130 205,130 245,130 285,130 325,130 365,130 405,130 445,90 485,130" />
                    </svg>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-bold text-slate-700">
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">GT WASH (12j)</span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">TOKOKANGCUCI (1j)</span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">MEETING (4j)</span>
                  </div>
                </div>

                {/* Grafik 2 */}
                <div className="p-5 rounded-2xl bg-[#f8f9fa] border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Grafik 2: Durasi Pengerjaan (Days)</span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">Akumulasi Durasi Kerja Proyek (Days)</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">Days Terlama</span>
                  </div>

                  <div className="w-full">
                    <svg viewBox="0 0 540 170" className="w-full h-auto select-none font-sans">
                      <line x1="45" y1="20" x2="520" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="45" y1="75" x2="520" y2="75" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="45" y1="130" x2="520" y2="130" stroke="#cbd5e1" strokeDasharray="3 3" />
                      <text x="35" y="24" fontSize="9" fill="#94a3b8" textAnchor="end">17 Days</text>
                      <text x="35" y="79" fontSize="9" fill="#94a3b8" textAnchor="end">9 Days</text>
                      <text x="35" y="134" fontSize="9" fill="#94a3b8" textAnchor="end">0 Days</text>
                      <polyline fill="none" stroke="#34a853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="60,35 130,90 200,130 270,130 340,130 410,130 480,130" />
                      <circle cx="60" cy="35" r="4.5" fill="#34a853" stroke="#fff" strokeWidth="2" />
                      <text x="60" y="25" fontSize="9.5" fill="#1e7e34" fontWeight="bold" textAnchor="middle">14d</text>
                      <circle cx="130" cy="90" r="4" fill="#34a853" stroke="#fff" strokeWidth="2" />
                      <text x="130" y="80" fontSize="9.5" fill="#1e7e34" fontWeight="bold" textAnchor="middle">6d</text>
                      <text x="60" y="152" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">GT WASH</text>
                      <text x="130" y="152" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">MEETING</text>
                      <text x="200" y="152" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">TOKOKANG..</text>
                      <text x="270" y="152" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">TOKOMOTO</text>
                    </svg>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-bold text-slate-700">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">#1 GT WASH: 14 Days</span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">#2 MEETING: 6 Days</span>
                  </div>
                </div>

                {/* Grafik 3 */}
                <div className="p-5 rounded-2xl bg-[#f8f9fa] border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a73e8]">Grafik 3: Tren Disiplin Presensi</span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">Fluktuasi Tepat Waktu &amp; Izin</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-600">Tepat vs Telat</span>
                  </div>

                  <div className="w-full">
                    <svg viewBox="0 0 540 150" className="w-full h-auto select-none font-sans">
                      <line x1="30" y1="20" x2="520" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="70" x2="520" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="120" x2="520" y2="120" stroke="#cbd5e1" strokeDasharray="3 3" />
                      {['02', '03', '04', '05', '06', '09', '10'].map((d, i) => (
                        <text key={i} x={60 + i * 65} y="140" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold">{d}</text>
                      ))}
                      <polyline fill="none" stroke="#34a853" strokeWidth="2.5" strokeLinecap="round" points="60,70 125,70 190,70 255,70 320,70 385,70 450,70" />
                      <circle cx="60" cy="70" r="3" fill="#34a853" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="125" cy="70" r="3" fill="#34a853" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="190" cy="70" r="3" fill="#34a853" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="255" cy="70" r="3" fill="#34a853" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="320" cy="70" r="3" fill="#34a853" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="385" cy="70" r="3" fill="#34a853" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="450" cy="70" r="3" fill="#34a853" stroke="#fff" strokeWidth="1.5" />
                      <polyline fill="none" stroke="#ea4335" strokeWidth="2" points="60,120 450,120" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-emerald-700">Tepat Waktu: 7 sesi</span>
                    <span className="text-slate-400 text-[11px]">Toleransi: 15m</span>
                  </div>
                </div>

                {/* Grafik 4 */}
                <div className="p-5 rounded-2xl bg-[#f8f9fa] border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a73e8]">Grafik 4: Realisasi Jam Kerja &amp; Lembur</span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">Jam Bersih &amp; Lembur Bulat Genap</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-[#1a73e8]">Jam Genap</span>
                  </div>

                  <div className="w-full">
                    <svg viewBox="0 0 540 150" className="w-full h-auto select-none font-sans">
                      <line x1="30" y1="20" x2="520" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="70" x2="520" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="120" x2="520" y2="120" stroke="#cbd5e1" strokeDasharray="3 3" />
                      {['02', '03', '04', '05', '06', '09', '10'].map((d, i) => (
                        <text key={i} x={60 + i * 65} y="140" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold">{d}</text>
                      ))}
                      <polyline fill="none" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round" points="60,40 125,40 190,40 255,40 320,40 385,40 450,40" />
                      <circle cx="60" cy="40" r="3" fill="#1a73e8" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="125" cy="40" r="3" fill="#1a73e8" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="190" cy="40" r="3" fill="#1a73e8" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="255" cy="40" r="3" fill="#1a73e8" stroke="#fff" strokeWidth="1.5" />
                      <polyline fill="none" stroke="#fbbc04" strokeWidth="2" points="60,120 450,120" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-[#1a73e8]">Jam Bersih: 48 Jam (Genap)</span>
                    <span className="text-slate-400 text-[11px]">Target: 8j/hari</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. DEEPMIND STYLE ASYMMETRIC BENTO GRID SHOWCASE */}
      <section id="bento" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12 text-left">
        <div className="space-y-3 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">Capabilities &amp; Infrastructure</span>
          <h2 className="text-3xl sm:text-5xl font-normal text-slate-900 tracking-tight">
            Arsitektur Fitur Terpadu.
          </h2>
          <p className="text-base text-slate-600 font-normal">
            Dibangun dengan tolak ukur analitis untuk memastikan setiap jam kerja dan tugas bernilai konkret.
          </p>
        </div>

        {/* Bento Grid Asimetris Style DeepMind */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Wide (Span 2) */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8] block">Project Intelligence</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Penjadwalan Multi-Hari &amp; Jejak Revisi Terstruktur
              </h3>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Kelola proyek dengan hierarki cabang program, hitung durasi hari kerja riil tanpa memasukkan hari libur, dan bekukan status saat tertunda tanpa merusak kalkulasi waktu.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Otomatisasi Hitung Hari Kerja</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Tanda Libur Nasional Kalender</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Histori Penambahan Pekerjaan</span>
              </div>
            </div>
          </div>

          {/* Card 2: 1 Col */}
          <div id="presensi" className="p-8 rounded-3xl bg-[#f8f9fa] border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">Attendance Rigor</span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Presensi Jam Bersih &amp; Lembur Genap
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clock In &amp; Out dengan bukti foto dan koordinat GPS. Seluruh jam bersih dan lembur dihitung bulat per 1 jam tanpa pecahan desimal.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Standar Masuk:</span>
                <span className="font-bold text-slate-900">08:00 (15m Toleransi)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Standar Pulang:</span>
                <span className="font-bold text-slate-900">17:00 (30m Threshold)</span>
              </div>
              <div className="flex justify-between text-[#1a73e8] font-bold border-t border-slate-100 pt-1.5">
                <span>Kalkulasi:</span>
                <span>Bulat 1 Jam Penuh</span>
              </div>
            </div>
          </div>

          {/* Card 3: 1 Col */}
          <div id="bank-ide" className="p-8 rounded-3xl bg-[#f8f9fa] border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">Ideation to Execution</span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Bank Ide to Calendar
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tulis gagasan dan arahan dalam teks. Kapan pun siap, pindahkan ke tanggal kalender dan buka kembali teks arahan lengkapnya dari detail jadwal.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-1">
              <div className="text-[10px] font-bold uppercase text-amber-600">Sample Ide Terjadwal</div>
              <div className="font-bold text-slate-900">Kampanye Iklan Akhir Tahun</div>
              <p className="text-[11px] text-slate-500 line-clamp-1">Arahan konsep dan materi visual...</p>
            </div>
          </div>

          {/* Card 4: Wide (Span 2) */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">Executive Reporting</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Laporan Kinerja Komprehensif &amp; Presentasi PowerPoint AI
              </h3>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Hasilkan dokumen rekapitulasi pekerjaan yang menggabungkan seluruh metrik absensi, jam efektif, rincian tugas per proyek, evaluasi Gemini AI, dan ekspor instan dalam format PDF, Excel (.xlsx), atau slide PowerPoint (.pptx).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-slate-100 font-bold text-slate-700">PDF Print-Ready</span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">Excel (.xlsx) Terstruktur</span>
              <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">PowerPoint (.pptx) Full-Designed</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CLEAN CALL TO ACTION (FOOTER HERO) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center space-y-6">
        <h2 className="text-3xl sm:text-5xl font-normal text-slate-900 tracking-tight">
          Siap membuktikan akuntabilitas kerja Anda?
        </h2>
        <p className="text-base text-slate-600 max-w-xl mx-auto">
          Masuk ke workspace JadwalPro dan mulai jadwalkan proyek dengan tolak ukur presisi hari ini.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => openAuth(true)}
            className="px-8 py-4 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-sm shadow-md transition-all transform hover:scale-[1.02]"
          >
            Mulai Gunakan JadwalPro Sekarang
          </button>
        </div>
      </section>

      {/* 6. DEEPMIND STYLE MINIMALIST FOOTER */}
      <footer className="mt-auto py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 text-sm">JadwalPro</span>
            <span>•</span>
            <span>Platform Kinerja &amp; Proyek Terpadu 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#kalender" className="hover:text-slate-900 transition-colors">Kalender</a>
            <a href="#grafik" className="hover:text-slate-900 transition-colors">Analitik</a>
            <a href="#presensi" className="hover:text-slate-900 transition-colors">Presensi</a>
            <a href="#bank-ide" className="hover:text-slate-900 transition-colors">Bank Ide</a>
            <button
              type="button"
              onClick={() => openAuth(false)}
              className="text-[#1a73e8] font-bold hover:underline"
            >
              Masuk Akun
            </button>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          MODAL AUTENTIKASI MINIMALIS (CLEAN LOOK, TANPA TOMBOL DEMO / SUPABASE)
         ===================================================================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsAuthModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Header Modal */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a73e8] block">JadwalPro Workspace</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                  {isSignUp ? 'Daftar Akun Baru' : 'Masuk Akun'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quote Profesional */}
            <p className="text-xs text-slate-600 italic bg-[#f8f9fa] p-3.5 rounded-2xl border border-slate-200/80 leading-relaxed">
              &ldquo;Seorang profesional tidak sekadar &lsquo;bekerja keras&rsquo;, melainkan mampu membuktikan efisiensi, akuntabilitas, dan nilai tambah kerjanya melalui data konkret.&rdquo;
            </p>

            {/* Switcher Masuk vs Daftar */}
            <div className="grid grid-cols-2 p-1 rounded-full bg-slate-100 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-full transition-all ${
                  !isSignUp ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Masuk Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-full transition-all ${
                  isSignUp ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daftar Baru
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required={isSignUp}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama lengkap Anda"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f9fa] border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1a73e8] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08123456789"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f9fa] border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1a73e8] transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f9fa] border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1a73e8] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi (Password) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#f8f9fa] border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1a73e8] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <span>{isSignUp ? 'Daftar Sekarang' : 'Masuk ke Workspace'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}