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
} from 'lucide-react';
import type { UserProfile } from './types';
import { db } from './db';

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activePreviewTab, setActivePreviewTab] = useState<'calendar' | 'charts' | 'attendance' | 'ideas'>('calendar');

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

        // Fallback login lokal
        const localUser: UserProfile = {
          id: `owner-${Date.now().toString(36)}`,
          fullName: cleanName,
          phone: cleanPhone || '-',
          email: cleanEmail,
          createdAt: new Date().toISOString(),
        };
        onAuthSuccess(localUser);
      } else {
        // Sign In
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

        // Fallback login lokal
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. TOP NAVBAR CLEAN LOOK */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                Jadwal<span className="text-indigo-600">Pro</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block -mt-0.5">
                Workspace Kinerja &amp; Proyek
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-slate-600">
            <a href="#sample-kalender" className="hover:text-indigo-600 transition-colors">Sample Kalender</a>
            <a href="#sample-grafik" className="hover:text-indigo-600 transition-colors">4 Grafik Analitik</a>
            <a href="#fitur-utama" className="hover:text-indigo-600 transition-colors">Fitur Lengkap</a>
            <a href="#login-section" className="hover:text-indigo-600 transition-colors">Form Masuk</a>
          </nav>

          {/* Action CTA */}
          <div className="flex items-center gap-2.5">
            <a
              href="#login-section"
              onClick={() => setIsSignUp(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-all"
            >
              Masuk Akun
            </a>
            <a
              href="#login-section"
              onClick={() => setIsSignUp(true)}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition-all"
            >
              Daftar Baru
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION DENGAN FORM LOGIN CLEAN & QUOTE UTAMA */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Kolom Kiri: Headline & Kutipan Profesional */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Workspace Kinerja, Kalender &amp; Presensi Terpadu 2026</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
              Buktikan Efisiensi &amp; Hasil Nyata Proyek Melalui{' '}
              <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">
                Data Konkret
              </span>
            </h1>

            {/* Quote Profesional Sesuai Permintaan */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative">
              <div className="absolute -left-1 top-4 w-2 h-8 bg-indigo-600 rounded-full" />
              <p className="text-sm sm:text-base text-slate-700 italic font-medium leading-relaxed pl-2">
                &ldquo;Seorang profesional tidak sekadar &lsquo;bekerja keras&rsquo;, melainkan mampu membuktikan efisiensi, akuntabilitas, dan nilai tambah kerjanya melalui data konkret.&rdquo;
              </p>
            </div>

            {/* Checklist Ringkas Keunggulan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kalender Multi-Hari &amp; Riwayat Revisi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Presensi Jam Bersih &amp; Lembur Genap</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>4 Grafik Analitik SVG (Beban &amp; Days)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bank Ide Terkoneksi Kalender &amp; AI Pro</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="#sample-kalender"
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <span>Lihat Sample Data Kalender &amp; Grafik</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Kolom Kanan: Form Login & Register Clean Look */}
          <div id="login-section" className="lg:col-span-5 w-full">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5 relative">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {isSignUp ? 'Daftar Akun Baru' : 'Masuk ke Workspace'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isSignUp ? 'Mulai kelola proyek & buktikan kinerja tim Anda' : 'Silakan akses jadwal proyek dan dashboard Anda'}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    !isSignUp ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    isSignUp ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daftar Baru
                </button>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {isSignUp && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          required={isSignUp}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nama lengkap Anda"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="081234567890"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@perusahaan.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi (Password) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
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
                  className="w-full mt-3 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <span>{isSignUp ? 'Daftar Akun Baru' : 'Masuk Sekarang'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE SAMPLE DATA NYATA (MIRRORS SCREENSHOT KALENDER & 4 GRAFIK) */}
      <section id="sample-kalender" className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
              Interactive Feature Previews &amp; Real Data Samples
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Sample Tampilan Kalender &amp; Dashboard Nyata
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Berikut adalah contoh asli dari antarmuka kalender proyek multi-hari dan 4 grafik analitik yang siap Anda gunakan.
            </p>
          </div>

          {/* Tab Pemilih Sample */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActivePreviewTab('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activePreviewTab === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Sample 1: Kalender Proyek Nyata</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab('charts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activePreviewTab === 'charts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Sample 2: Dashboard 4 Grafik SVG</span>
            </button>
          </div>

          {/* SAMPLE 1: KALENDER PROYEK (MENGGAMBARKAN PERSIS SCREENSHOT 1) */}
          {activePreviewTab === 'calendar' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-0">
              {/* Kalender Header Bar */}
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-base text-slate-900">November 2026</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Bulan Aktif
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Multi-Hari Aktif</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Libur Nasional</span>
                  </span>
                </div>
              </div>

              {/* Grid Hari Kalender (Sen - Min) */}
              <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-black py-2.5 bg-slate-100/60 uppercase tracking-wider text-slate-600">
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span className="text-rose-600">Sab</span>
                <span className="text-rose-600">Min</span>
              </div>

              {/* Grid Sel Kalender dengan Sample Data Asli */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-xs">
                {/* Baris 1: 26 - 1 */}
                <div className="min-h-[90px] p-2 bg-slate-50/50 text-slate-400 font-bold">26</div>
                <div className="min-h-[90px] p-2 bg-slate-50/50 text-slate-400 font-bold">27</div>
                <div className="min-h-[90px] p-2 bg-amber-50/40 space-y-1">
                  <span className="font-bold text-slate-700">28</span>
                  <div className="p-1 rounded bg-amber-100 text-[9.5px] font-bold text-amber-900 border border-amber-300">
                    Hari Sumpah Pemuda
                  </div>
                </div>
                <div className="min-h-[90px] p-2 bg-slate-50/50 text-slate-400 font-bold">29</div>
                <div className="min-h-[90px] p-2 bg-slate-50/50 text-slate-400 font-bold">30</div>
                <div className="min-h-[90px] p-2 bg-slate-50/50 text-rose-400 font-bold">31</div>
                <div className="min-h-[90px] p-2 bg-slate-50/50 text-rose-500 font-bold">1</div>

                {/* Baris 2: 2 - 8 (Sample Tugas Asli) */}
                <div className="min-h-[110px] p-2 space-y-1 bg-white">
                  <span className="font-bold text-slate-800">2</span>
                  <div className="p-1 rounded bg-purple-50 text-[10px] font-bold text-purple-800 border border-purple-200 truncate">
                    meeting... <span className="text-purple-600 font-normal">Dokumentasi</span>
                  </div>
                  <div className="p-1 rounded bg-amber-50 text-[10px] font-bold text-amber-800 border border-amber-200 truncate">
                    admin <span className="text-amber-600 font-normal">1h Admin</span>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-600 block">+3 tugas lagi &gt;</span>
                </div>

                <div className="min-h-[110px] p-2 space-y-1 bg-white">
                  <span className="font-bold text-slate-800">3</span>
                  <div className="p-1 rounded bg-amber-100 text-[10px] font-black text-amber-900 border border-amber-300 truncate">
                    ⚠️ Annual R... <span className="font-normal text-amber-800">Rakernas</span>
                  </div>
                  <div className="p-1 rounded bg-purple-50 text-[10px] font-semibold text-purple-800 border border-purple-200 truncate">
                    H-2 IR... 2h Kolaborasi
                  </div>
                </div>

                <div className="min-h-[110px] p-2 space-y-1 bg-white">
                  <span className="font-bold text-slate-800">4</span>
                  <div className="p-1 rounded bg-amber-100 text-[10px] font-bold text-amber-900 border border-amber-300 truncate">
                    H-2 ⚠️ A... Rakernas
                  </div>
                  <div className="p-1 rounded bg-indigo-50 text-[10px] font-bold text-indigo-800 border border-indigo-200 truncate">
                    sosmed 1h Divisi Sosmed
                  </div>
                </div>

                <div className="min-h-[110px] p-2 space-y-1 bg-white">
                  <span className="font-bold text-slate-800">5</span>
                  <div className="p-1 rounded bg-amber-100 text-[10px] font-bold text-amber-900 border border-amber-300 truncate">
                    H-3 ⚠️ A... Rakernas
                  </div>
                  <div className="p-1 rounded bg-blue-50 text-[10px] font-semibold text-blue-800 border border-blue-200 truncate">
                    nyuci-gr... 1h Konten Nyuci
                  </div>
                </div>

                <div className="min-h-[110px] p-2 space-y-1 bg-white">
                  <span className="font-bold text-slate-800">6</span>
                  <div className="p-1 rounded bg-purple-50 text-[10px] font-bold text-purple-800 border border-purple-200 truncate">
                    narasi Konten Nyuci
                  </div>
                  <div className="p-1 rounded bg-purple-100 text-[9.5px] font-bold text-purple-900 border border-purple-300 truncate">
                    V.. 1h Konten Nyuci <span className="text-purple-700 bg-white px-1 rounded">+1 Rev</span>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-600 block">+2 lagi &gt;</span>
                </div>

                <div className="min-h-[110px] p-2 bg-slate-50/30 text-rose-500 font-bold">7</div>
                <div className="min-h-[110px] p-2 bg-slate-50/30 text-rose-500 font-bold">8</div>

                {/* Baris 3: 9 - 15 (Dengan Hari Ini & Revisi) */}
                <div className="min-h-[110px] p-2 space-y-1 bg-white">
                  <span className="font-bold text-slate-800">9</span>
                  <div className="p-1 rounded bg-purple-50 text-[10px] font-bold text-purple-800 border border-purple-200 truncate">
                    [Revisi].. 1h Konten Nyuci
                  </div>
                  <div className="p-1 rounded bg-rose-50 text-[10px] font-bold text-rose-800 border border-rose-200 truncate">
                    briefing.. 1h Briefing Senin
                  </div>
                </div>

                <div className="min-h-[110px] p-2 space-y-1 bg-indigo-50/40 ring-2 ring-inset ring-indigo-500">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-[11px]">10</span>
                    <span className="text-[9px] font-black uppercase tracking-tight px-1.5 py-0.2 rounded bg-indigo-600 text-white">Hari Ini</span>
                  </div>
                  <div className="p-1 rounded bg-amber-100 text-[9.5px] font-bold text-amber-900 border border-amber-300">
                    Hari Pahlawan Nasional
                  </div>
                  <div className="p-1 rounded bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-200 truncate">
                    Pindahin.. IPHONE 15 PRO
                  </div>
                </div>

                <div className="min-h-[110px] p-2 bg-white font-bold text-slate-700">11</div>
                <div className="min-h-[110px] p-2 bg-white font-bold text-slate-700">12</div>
                <div className="min-h-[110px] p-2 bg-white font-bold text-slate-700">13</div>
                <div className="min-h-[110px] p-2 bg-slate-50/30 text-rose-500 font-bold">14</div>
                <div className="min-h-[110px] p-2 bg-slate-50/30 text-rose-500 font-bold">15</div>
              </div>

              {/* Caption Footer Sample Kalender */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <span className="font-semibold">
                  Fitur kalender di atas otomatis menghitung durasi kerja multi-hari, mengelola histori revisi per pekerjaan, dan menandai hari libur nasional secara mandiri.
                </span>
                <a href="#login-section" className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <span>Mulai Jadwalkan Proyek Anda</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* SAMPLE 2: DASHBOARD 4 GRAFIK SVG (MENGGAMBARKAN PERSIS SCREENSHOT 2) */}
          {activePreviewTab === 'charts' && (
            <div id="sample-grafik" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grafik 1: Tren Tahunan 12 Bulan */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Grafik 1: Tren Tahunan 12 Bulan</span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">Ringkasan Beban Proyek (Januari — Desember)</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">7 Proyek Terdata</span>
                </div>

                {/* SVG Visual Grafik 1 */}
                <div className="w-full">
                  <svg viewBox="0 0 540 180" className="w-full h-auto select-none font-sans">
                    <line x1="30" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="30" y1="80" x2="520" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="30" y1="140" x2="520" y2="140" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x="22" y="24" fontSize="9" fill="#94a3b8" textAnchor="end">12</text>
                    <text x="22" y="84" fontSize="9" fill="#94a3b8" textAnchor="end">6</text>
                    <text x="22" y="144" fontSize="9" fill="#94a3b8" textAnchor="end">0</text>
                    
                    {/* Months X */}
                    {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => (
                      <text key={i} x={45 + i * 40} y="162" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold">{m}</text>
                    ))}

                    {/* Blue Peak in Nov */}
                    <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="45,140 85,140 125,140 165,140 205,140 245,140 285,140 325,140 365,140 405,140 445,20 485,140" />
                    <circle cx="445" cy="20" r="4" fill="#6366f1" stroke="#fff" strokeWidth="2" />

                    {/* Red Peak in Nov */}
                    <polyline fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="45,140 85,140 125,140 165,140 205,140 245,140 285,140 325,140 365,140 405,140 445,95 485,140" />
                    <circle cx="445" cy="95" r="3.5" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> GT WASH (12j)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> TOKOKANGCUCI (1j)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> TOKOMOTO (1j)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> MEETING (4j)
                  </span>
                </div>
              </div>

              {/* Grafik 2: Durasi Pengerjaan Days */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Grafik 2: Durasi Pengerjaan (Days)</span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">Akumulasi Durasi Kerja Proyek (Days)</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">Diurutkan Days Terlama</span>
                </div>

                <div className="w-full">
                  <svg viewBox="0 0 540 180" className="w-full h-auto select-none font-sans">
                    <line x1="45" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="45" y1="80" x2="520" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="45" y1="140" x2="520" y2="140" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x="35" y="24" fontSize="9" fill="#94a3b8" textAnchor="end">17 Days</text>
                    <text x="35" y="84" fontSize="9" fill="#94a3b8" textAnchor="end">9 Days</text>
                    <text x="35" y="144" fontSize="9" fill="#94a3b8" textAnchor="end">0 Days</text>

                    {/* Curve Downwards */}
                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="60,35 130,95 200,135 270,135 340,135 410,135 480,135" />
                    <circle cx="60" cy="35" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                    <text x="60" y="27" fontSize="9.5" fill="#047857" fontWeight="bold" textAnchor="middle">14d</text>

                    <circle cx="130" cy="95" r="4" fill="#10b981" stroke="#fff" strokeWidth="2" />
                    <text x="130" y="87" fontSize="9.5" fill="#047857" fontWeight="bold" textAnchor="middle">6d</text>

                    <circle cx="200" cy="135" r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="270" cy="135" r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="340" cy="135" r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="410" cy="135" r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="480" cy="135" r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />

                    {/* Project Labels */}
                    <text x="60" y="162" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">GT WASH</text>
                    <text x="130" y="162" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">MEETING</text>
                    <text x="200" y="162" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">TOKOKANG..</text>
                    <text x="270" y="162" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">TOKOMOTO</text>
                    <text x="340" y="162" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">CLEANING..</text>
                    <text x="410" y="162" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">META ADS</text>
                    <text x="480" y="162" fontSize="9" fill="#334155" fontWeight="bold" textAnchor="middle">Bersih B..</text>
                  </svg>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-700">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">#1 GT WASH: 14 Days (100%)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">#2 MEETING: 6 Days (75%)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">#3 TOKOKANGCUCI: 1 Days (100%)</span>
                </div>
              </div>

              {/* Grafik 3: Tren Disiplin Presensi */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Grafik 3: Tren Disiplin Presensi</span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">Fluktuasi Tepat Waktu, Terlambat &amp; Izin</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">Tepat vs Telat vs Izin</span>
                </div>

                <div className="w-full">
                  <svg viewBox="0 0 540 160" className="w-full h-auto select-none font-sans">
                    <line x1="30" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="30" y1="75" x2="520" y2="75" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="30" y1="130" x2="520" y2="130" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x="22" y="24" fontSize="9" fill="#94a3b8" textAnchor="end">3</text>
                    <text x="22" y="79" fontSize="9" fill="#94a3b8" textAnchor="end">2</text>
                    <text x="22" y="134" fontSize="9" fill="#94a3b8" textAnchor="end">0</text>

                    {/* Dates X */}
                    {['02', '03', '04', '05', '06', '09', '10'].map((d, i) => (
                      <text key={i} x={60 + i * 65} y="150" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold">{d}</text>
                    ))}

                    {/* Punctual Line (Green) */}
                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" points="60,75 125,75 190,75 255,75 320,75 385,75 450,75" />
                    <circle cx="60" cy="75" r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="125" cy="75" r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="190" cy="75" r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="255" cy="75" r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="320" cy="75" r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="385" cy="75" r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="450" cy="75" r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />

                    {/* Late Line (Red at 0) */}
                    <polyline fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" points="60,130 125,130 190,130 255,130 320,130 385,130 450,130" />
                  </svg>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="text-emerald-700">Tepat: 7</span>
                    <span className="text-rose-600">Telat: 0</span>
                    <span className="text-amber-600">Izin: 0</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Toleransi: 15m</span>
                </div>
              </div>

              {/* Grafik 4: Realisasi Jam Kerja & Lembur */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Grafik 4: Realisasi Jam Kerja &amp; Lembur</span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">Jam Bersih, Lembur &amp; Keterlambatan</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700">Satuan Jam Bulat</span>
                </div>

                <div className="w-full">
                  <svg viewBox="0 0 540 160" className="w-full h-auto select-none font-sans">
                    <line x1="30" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="30" y1="75" x2="520" y2="75" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="30" y1="130" x2="520" y2="130" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x="22" y="24" fontSize="9" fill="#94a3b8" textAnchor="end">10 Jam</text>
                    <text x="22" y="79" fontSize="9" fill="#94a3b8" textAnchor="end">5 Jam</text>
                    <text x="22" y="134" fontSize="9" fill="#94a3b8" textAnchor="end">0 Jam</text>

                    {['02', '03', '04', '05', '06', '09', '10'].map((d, i) => (
                      <text key={i} x={60 + i * 65} y="150" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold">{d}</text>
                    ))}

                    {/* Regular Hours Line at 8h */}
                    <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" points="60,45 125,45 190,45 255,45 320,45 385,45 450,45" />
                    <circle cx="60" cy="45" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="125" cy="45" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="190" cy="45" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="255" cy="45" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="320" cy="45" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="385" cy="45" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="450" cy="45" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />

                    {/* Overtime Line at 0 */}
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" points="60,130 125,130 190,130 255,130 320,130 385,130 450,130" />
                  </svg>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="text-indigo-700">Bersih: 48 Jam</span>
                    <span className="text-amber-700">Lembur: 0 Jam</span>
                    <span className="text-rose-600">Telat: 0x</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Bulat 1 Jam</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. FITUR LENGKAP ARSITEKTUR DEVELOPER PROFESIONAL */}
      <section id="fitur-utama" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Modular Capabilities</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Arsitektur Aplikasi Kinerja Modern &amp; Mandiri
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Didesain bersih untuk keandalan eksekusi proyek tim, perhitungan akuntabilitas presensi, hingga evaluasi berbasis AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Penjadwalan Multi-Hari &amp; Revisi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dukungan cabang program bertingkat, penundaan jadwal tanpa kehilangan histori kerja, dan pencatatan revisi dengan tanggal target di kalender.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Presensi Jam Genap &amp; Lembur</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clock In / Out terverifikasi kamera &amp; GPS. Perhitungan jam bersih dipotong istirahat dan lembur bulat genap per jam tanpa pecahan koma.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Bank Ide to Calendar</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Catat ide dan brief dalam bentuk teks, jadwalkan ke kalender dengan satu klik, dan akses kembali teks arahan lengkapnya dari detail kalender.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">4 Line Chart Dinamis SVG</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Visualisasi tren beban tahunan, peringkat durasi hari pengerjaan (Days), kepatuhan presensi, dan jam lembur terverifikasi.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Gemini AI Project Assistant</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chatbot AI terintegrasi pada laporan kerja untuk konsultasi kendala dan evaluasi tugas terfilter khusus menurut ID Owner Anda.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Presentation className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Ekspor Multi-Format (PDF, XLS, PPT)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cetak PDF profesional, ekspor lembar kerja Excel (.xlsx), serta unduh presentasi PowerPoint full-designed (.pptx) siap tayang.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FOOTER CLEAN */}
      <footer className="mt-auto py-10 bg-white border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-slate-800">JadwalPro Platform 2026</span>
        </div>
        <p className="max-w-md mx-auto text-slate-500 text-[11px]">
          Mendukung profesional membuktikan efisiensi, akuntabilitas, dan nilai tambah kerja nyata melalui data konkret.
        </p>
      </footer>
    </div>
  );
}