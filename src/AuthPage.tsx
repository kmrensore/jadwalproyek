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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[1400px] -right-40 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP NAVBAR LANDING PAGE */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight flex items-center gap-1">
                Jadwal<span className="text-indigo-400">Pro</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider block uppercase -mt-1">
                Workspace Kinerja Terpadu
              </span>
            </div>
          </div>

          {/* Nav Links Desktop */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-300">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur Unggulan</a>
            <a href="#kalender" className="hover:text-white transition-colors">Kalender &amp; Proyek</a>
            <a href="#presensi" className="hover:text-white transition-colors">Presensi &amp; Lembur</a>
            <a href="#bank-ide" className="hover:text-white transition-colors">Bank Ide</a>
            <a href="#laporan" className="hover:text-white transition-colors">Rekapitulasi AI</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => openAuth(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => openAuth(true)}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
            >
              Mulai Sekarang
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sistem Manajemen Proyek, Jam Kerja &amp; Akuntabilitas Terkini</span>
        </div>

        <div className="max-w-4xl mx-auto space-y-5">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Buktikan Hasil Kerja Nyata Melalui{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300">
              Data &amp; Efisiensi Konkret
            </span>
          </h1>

          {/* Quote Utama Sesuai Permintaan User */}
          <div className="max-w-3xl mx-auto p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative">
            <p className="text-sm sm:text-base text-slate-300 italic font-medium leading-relaxed">
              &ldquo;Seorang profesional tidak sekadar &lsquo;bekerja keras&rsquo;, melainkan mampu membuktikan efisiensi, akuntabilitas, dan nilai tambah kerjanya melalui data konkret.&rdquo;
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            type="button"
            onClick={() => openAuth(false)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>Masuk ke Workspace JadwalPro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#fitur"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <span>Pelajari Seluruh Fitur</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Interactive Dashboard Sneak-Peek Cards */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="p-3 sm:p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-indigo-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Presensi Akurat</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-white">Genap Sejam</div>
                <p className="text-[11px] text-slate-400">Lembur &amp; jam bersih bulat tanpa pecahan desimal</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Durasi Proyek</span>
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-white">Skala Days</div>
                <p className="text-[11px] text-slate-400">Peringkat durasi kerja proyek terlama ke tersingkat</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-amber-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Ide ke Jadwal</span>
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-white">Bank Ide</div>
                <p className="text-[11px] text-slate-400">Konversi ide ke kalender dengan tautan balik arahan</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-purple-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Ekspor Multi-Format</span>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-white">PDF • XLS • PPT</div>
                <p className="text-[11px] text-slate-400">Unduh laporan instan &amp; slide PowerPoint AI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE FITUR UTAMA APLIKASI WEB */}
      <section id="fitur" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
            Arsitektur Fitur Lengkap
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Dirancang Khusus untuk Alur Kerja Tim &amp; Profesional Modern
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Seluruh kebutuhan manajemen proyek, perhitungan presensi tolak ukur, hingga pelaporan eksekutif terintegrasi tanpa perlu aplikasi terpisah.
          </p>
        </div>

        {/* 6 Fitur Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fitur 1: Kalender & Proyek Multi-Level */}
          <div id="kalender" className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Kalender &amp; Proyek Multi-Hari</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jadwalkan pekerjaan multi-hari, kelola cabang program spesifik, tangani riwayat revisi tugas, dan bekukan status proyek tertunda tanpa kehilangan jejak durasi hari kerja riil.
            </p>
          </div>

          {/* Fitur 2: Presensi Presisi & Lembur Genap */}
          <div id="presensi" className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Presensi Terukur &amp; Jam Lembur Genap</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clock In &amp; Clock Out terintegrasi kamera bukti &amp; GPS. Perhitungan jam kerja bersih dan lembur dihitung bulat genap per jam dengan tolak ukur batas toleransi masuk dan pulang.
            </p>
          </div>

          {/* Fitur 3: Indikator Izin / Cuti di Kalender */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Indikator Izin &amp; Cuti Langsung di Kalender</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Setiap pengajuan izin, cuti tahunan, dan sakit otomatis memunculkan lencana berwarna pada sel kalender jadwal proyek, sehingga ketersediaan tim langsung terbaca secara visual.
            </p>
          </div>

          {/* Fitur 4: Bank Ide to Calendar */}
          <div id="bank-ide" className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Bank Ide &amp; Konversi ke Jadwal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tulis gagasan, catatan, atau konsep dalam bentuk teks. Pindahkan langsung ke tanggal kalender yang diinginkan, dan buka kembali teks arahan ide asal kapan saja dari kalender.
            </p>
          </div>

          {/* Fitur 5: 4 Grafik Garis Analitik */}
          <div id="laporan" className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">4 Grafik Garis Analitik Dinamis SVG</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dashboard Rekap Pekerjaan dilengkapi 4 grafik garis: Tren Beban Proyek 12 Bulan, Peringkat Durasi Days Proyek, Fluktuasi Presensi Harian, dan Realisasi Jam Kerja Bersih vs Lembur.
            </p>
          </div>

          {/* Fitur 6: Asisten AI Gemini & Ekspor PPTX */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Gemini AI Assistant &amp; Presentasi PPTX</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Konsultasi kendala jadwal dengan Gemini AI terfilter ID Owner, didukung opsi unduhan lembar kerja Excel (.xlsx) dan presentasi PowerPoint (.pptx) berdesain profesional.
            </p>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW / ALUR KERJA */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Alur Kerja Praktis</span>
            <h3 className="text-2xl font-extrabold text-white">Bagaimana JadwalPro Meningkatkan Produktivitas Anda</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">1</span>
              <h4 className="font-bold text-sm text-white">Tulis Ide &amp; Rencana Kerja</h4>
              <p className="text-xs text-slate-400">Kumpulkan brief atau catatan tugas di Bank Ide, lalu pindahkan ke kalender target dengan satu klik.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">2</span>
              <h4 className="font-bold text-sm text-white">Catat Presensi &amp; Eksekusi</h4>
              <p className="text-xs text-slate-400">Lakukan Clock In / Out harian, jalankan tugas multi-hari, dan catat revisi pekerjaan secara teratur.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">3</span>
              <h4 className="font-bold text-sm text-white">Analisis Kinerja &amp; Ekspor</h4>
              <p className="text-xs text-slate-400">Pantau 4 grafik tren, konsultasikan bottleneck dengan AI, dan unduh laporan dalam format PDF, Excel, atau PPTX.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-900 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-slate-400">JadwalPro Platform 2026</span>
        </div>
        <p className="max-w-md mx-auto">
          Mendukung profesional membuktikan efisiensi, akuntabilitas, dan nilai tambah kerja nyata melalui data konkret.
        </p>
      </footer>

      {/* =====================================================================
          MODAL AUTENTIKASI (MASUK / DAFTAR AKUN)
          - Opsi demo dan tulisan status Supabase telah dihapus sesuai instruksi
         ===================================================================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsAuthModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  <span>Workspace JadwalPro</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  {isSignUp ? 'Daftar Akun Baru' : 'Masuk ke Akun Anda'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quote Profesional */}
            <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
              &ldquo;Seorang profesional tidak sekadar bekerja keras, melainkan mampu membuktikan efisiensi, akuntabilitas, dan nilai tambah kerjanya melalui data konkret.&rdquo;
            </p>

            {/* Switcher Masuk vs Daftar */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  !isSignUp
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
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
                  isSignUp
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daftar Baru
              </button>
            </div>

            {/* Pesan Kesalahan */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nama Lengkap *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        required={isSignUp}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama lengkap Anda"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nomor WhatsApp / HP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08123456789"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Alamat Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kata Sandi (Password) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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