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
  ChevronDown,
  Camera,
  MapPin,
  Bot,
  Zap,
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

  // =========================================================================
  // STATE INTERAKTIF KURSOR: EFEK AWAN-AWAN & BLUR DINAMIS ALA DEEPMIND
  // =========================================================================
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 700, y: 350 });
  const [isHoveringHero, setIsHoveringHero] = useState<boolean>(false);

  const handleMouseMoveHero = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

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

    // Partikel-partikel bercahaya yang melayang dan berjalan perlahan di latar belakang hero
  const glowingParticles = [
    { top: '12%', left: '7%', size: 4, opacity: 0.75, duration: '14s', delay: '0s', glow: '#38bdf8' },
    { top: '18%', left: '16%', size: 3, opacity: 0.6, duration: '19s', delay: '-3s', glow: '#ffffff' },
    { top: '10%', left: '26%', size: 5, opacity: 0.8, duration: '23s', delay: '-7s', glow: '#60a5fa' },
    { top: '24%', left: '34%', size: 3, opacity: 0.55, duration: '16s', delay: '-2s', glow: '#93c5fd' },
    { top: '16%', left: '44%', size: 4, opacity: 0.7, duration: '21s', delay: '-9s', glow: '#ffffff' },
    { top: '12%', left: '56%', size: 5, opacity: 0.85, duration: '15s', delay: '-4s', glow: '#38bdf8' },
    { top: '22%', left: '66%', size: 3, opacity: 0.65, duration: '20s', delay: '-8s', glow: '#60a5fa' },
    { top: '14%', left: '76%', size: 4, opacity: 0.6, duration: '18s', delay: '-1s', glow: '#ffffff' },
    { top: '18%', left: '86%', size: 5, opacity: 0.8, duration: '22s', delay: '-5s', glow: '#38bdf8' },
    { top: '32%', left: '5%', size: 3, opacity: 0.5, duration: '17s', delay: '-6s', glow: '#93c5fd' },
    { top: '38%', left: '14%', size: 4, opacity: 0.7, duration: '24s', delay: '-11s', glow: '#ffffff' },
    { top: '34%', left: '23%', size: 3, opacity: 0.6, duration: '18s', delay: '-3s', glow: '#60a5fa' },
    { top: '44%', left: '30%', size: 4, opacity: 0.75, duration: '15s', delay: '-7s', glow: '#38bdf8' },
    { top: '36%', left: '60%', size: 5, opacity: 0.8, duration: '25s', delay: '-10s', glow: '#ffffff' },
    { top: '42%', left: '70%', size: 3, opacity: 0.55, duration: '17s', delay: '-4s', glow: '#93c5fd' },
    { top: '38%', left: '82%', size: 4, opacity: 0.7, duration: '20s', delay: '-8s', glow: '#38bdf8' },
    { top: '48%', left: '90%', size: 3, opacity: 0.45, duration: '16s', delay: '-2s', glow: '#ffffff' },
    { top: '54%', left: '9%', size: 4, opacity: 0.65, duration: '22s', delay: '-5s', glow: '#60a5fa' },
    { top: '62%', left: '17%', size: 3, opacity: 0.5, duration: '19s', delay: '-9s', glow: '#ffffff' },
    { top: '56%', left: '26%', size: 5, opacity: 0.75, duration: '26s', delay: '-12s', glow: '#38bdf8' },
    { top: '60%', left: '74%', size: 4, opacity: 0.7, duration: '18s', delay: '-6s', glow: '#60a5fa' },
    { top: '55%', left: '85%', size: 3, opacity: 0.55, duration: '23s', delay: '-11s', glow: '#ffffff' },
    { top: '68%', left: '80%', size: 4, opacity: 0.65, duration: '16s', delay: '-3s', glow: '#38bdf8' },
    { top: '72%', left: '20%', size: 3, opacity: 0.5, duration: '21s', delay: '-8s', glow: '#93c5fd' },
  ];

  return (
    // Wadah fixed inset-0 overflow-y-auto menjamin 100% halaman bisa di-scroll bebas & lancar di semua peramban
    // Wadah fixed inset-0 overflow-y-auto menjamin 100% halaman bisa di-scroll bebas & lancar di semua peramban
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[#000000] text-[#f5f5f7] flex flex-col font-sans selection:bg-[#38bdf8] selection:text-white antialiased">
      {/* =========================================================================
          LATAR BELAKANG: HITAM PEKAT PENUH (HERO BIRU BUKTI NYATA GRADASI KE HITAM)
         ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#000000]">
        {/* Latar belakang bawah 100% hitam pekat murni sesuai arahan */}
        <div className="absolute inset-0 bg-[#000000]" />
      </div>
      {/* =========================================================================
          1. FLOATING NAVBAR ALA GOOGLE DEEPMIND (FULL WIDTH FLUID RESPONSIVE)
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full px-6 sm:px-10 lg:px-16 py-3.5 bg-[#071842]/75 backdrop-blur-2xl border-b border-blue-400/20 shadow-lg shadow-[#020b20]/40 transition-all">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Brand Logo Google DeepMind Style */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2997ff] flex items-center justify-center text-white shadow-lg shadow-[#0071e3]/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-base font-semibold tracking-tight text-white font-sans">
                JadwalPro
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            </div>
          </div>

          {/* Navigation Links DeepMind Style */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-white/70">
            <a href="#kalender-section" className="hover:text-white transition-colors">Kalender Proyek</a>
            <a href="#grafik-section" className="hover:text-white transition-colors">4 Grafik Analitik</a>
            <a href="#presensi-section" className="hover:text-white transition-colors">Presensi Jam Genap</a>
            <a href="#bank-ide-section" className="hover:text-white transition-colors">Bank Ide</a>
            <a href="#ai-section" className="hover:text-white transition-colors">Asisten AI</a>
          </nav>

          {/* Right Pill Actions DeepMind Style */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openAuth(false)}
              className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => openAuth(true)}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-slate-200 transition-all shadow-md transform hover:scale-[1.02] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Mulai Sekarang</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION: PERSIS SEPERTI DEEPMIND DENGAN GRADASI BIRU ROYAL,
             WATERMARK UTUH "BUKTI KERJA" TANPA PATAH, AWAN-AWAN & PARTIKEL DATA
         ========================================================================= */}
      <section
        onMouseEnter={() => setIsHoveringHero(true)}
        onMouseLeave={() => setIsHoveringHero(false)}
        onMouseMove={handleMouseMoveHero}
        className="relative w-full min-h-screen flex flex-col justify-between pt-4 pb-8 sm:pt-12 sm:pb-14 text-center z-10 overflow-hidden bg-transparent"
      >
        {/* =====================================================================
            GRADASI RADIANT COBALT / SAPPHIRE BLUE GLOW ALA DEEPMIND
           ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* Latar Belakang Gradien Langit Biru DeepMind */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_35%,#1d5fe8_0%,#1142af_35%,#082464_65%,#000000_100%)] opacity-95" />

          {/* Efek Awan-Awan Mistis Halus Mengambang Mengikuti Kursor */}
          <div
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1), top 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute w-[650px] h-[400px] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.22),rgba(24,84,204,0.14),transparent_70%)] blur-[80px]"
          />

          <div
            style={{
              left: `${mousePos.x * 0.7 + 150}px`,
              top: `${mousePos.y * 0.7 + 80}px`,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.4s ease-out, top 0.4s ease-out',
            }}
            className="absolute w-[500px] h-[350px] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),rgba(175,82,222,0.1),transparent_70%)] blur-[90px]"
          />

          {/* Partikel Bercahaya Berjalan Perlahan di Latar Belakang */}
          <style>{`
            @keyframes slowParticleDrift {
              0% {
                transform: translate3d(0, 0, 0) scale(1);
              }
              50% {
                transform: translate3d(16px, -28px, 0) scale(1.2);
              }
              100% {
                transform: translate3d(-12px, -52px, 0) scale(0.9);
              }
            }
          `}</style>
          {glowingParticles.map((p, idx) => (
            <div
              key={idx}
              style={{
                top: p.top,
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                boxShadow: `0 0 ${p.size * 2.5}px ${p.glow}, 0 0 ${p.size * 5}px rgba(56, 189, 248, 0.45)`,
                backgroundColor: p.glow,
                animation: `slowParticleDrift ${p.duration} ease-in-out infinite alternate`,
                animationDelay: p.delay,
              }}
              className="absolute rounded-full pointer-events-none select-none"
            />
          ))}

          {/* =====================================================================
              WATERMARK "BUKTI KERJA": AWALNYA NGEBLUR, TERLIHAT & BERSINAR HANYA DI AREA KURSOR
             ===================================================================== */}
          {/* LAPISAN 1: BUKTI NYATA RAKSASA SESUAI SKETSA (AWALNYA NGEBLUR MISTIS BESAR) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <svg
              className="w-full h-full max-h-[96vh] overflow-visible"
              viewBox="0 0 1600 1000"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="initialSmokyBlur" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="16" />
                </filter>
                <linearGradient id="blurrySmokeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
                  <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.06" />
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="28%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="url(#blurrySmokeGradient)"
                filter="url(#initialSmokyBlur)"
                fontSize="360"
                fontWeight="900"
                letterSpacing="-0.05em"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="select-none"
              >
                BUKTI
              </text>
              <text
                x="50%"
                y="74%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="url(#blurrySmokeGradient)"
                filter="url(#initialSmokyBlur)"
                fontSize="360"
                fontWeight="900"
                letterSpacing="-0.05em"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="select-none"
              >
                NYATA
              </text>
            </svg>
          </div>

          {/* LAPISAN 2: BUKTI NYATA RAKSASA TERLIHAT TAJAM & BERSINAR HANYA DI AREA KURSOR */}
          <div
            style={{
              WebkitMaskImage: isHoveringHero
                ? `radial-gradient(circle 260px at ${mousePos.x}px ${mousePos.y}px, black 35%, transparent 100%)`
                : 'radial-gradient(circle 0px at 0px 0px, transparent 100%, transparent 100%)',
              maskImage: isHoveringHero
                ? `radial-gradient(circle 260px at ${mousePos.x}px ${mousePos.y}px, black 35%, transparent 100%)`
                : 'radial-gradient(circle 0px at 0px 0px, transparent 100%, transparent 100%)',
              opacity: isHoveringHero ? 1 : 0,
              transition: 'opacity 0.2s ease-out',
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10"
          >
            <svg
              className="w-full h-full max-h-[96vh] overflow-visible"
              viewBox="0 0 1600 1000"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Filter Efek Bersinar Kuat (Radiant Specular Glow) */}
                <filter id="radiantGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ffffff" floodOpacity="1" />
                  <feDropShadow dx="0" dy="0" stdDeviation="20" floodColor="#38bdf8" floodOpacity="0.95" />
                  <feDropShadow dx="0" dy="0" stdDeviation="45" floodColor="#0284c7" floodOpacity="0.85" />
                  <feDropShadow dx="0" dy="0" stdDeviation="75" floodColor="#1d4ed8" floodOpacity="0.6" />
                </filter>
              </defs>
              <text
                x="50%"
                y="28%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                filter="url(#radiantGlowFilter)"
                fontSize="360"
                fontWeight="900"
                letterSpacing="-0.05em"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="select-none"
              >
                BUKTI
              </text>
              <text
                x="50%"
                y="74%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                filter="url(#radiantGlowFilter)"
                fontSize="360"
                fontWeight="900"
                letterSpacing="-0.05em"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="select-none"
              >
                NYATA
              </text>
            </svg>
          </div>
        </div>

        {/* =====================================================================
            KONTEN UTAMA HERO: TYPOGRAFI MODERN & ELEGAN SESUAI ARAHAN PENGGUNA
           ===================================================================== */}
        <div className="relative z-10 max-w-5xl mx-auto my-auto py-6 sm:py-10 md:py-12 px-4 sm:px-6 space-y-5 sm:space-y-7">
          {/* Tag Kicker Modern Glass */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/[0.08] border border-white/20 text-[#38bdf8] text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-xl shadow-lg shadow-black/40">
            <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Arsitektur Kinerja &bull; Bukti Nyata Terukur 2026</span>
          </div>

          {/* Headline Modern Berisi Filosofi Kerja Sesuai Arahan Pengguna */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.25] sm:leading-[1.2] font-sans max-w-5xl mx-auto">
            Seorang profesional tidak sekadar{' '}
            <span className="italic font-normal text-blue-200 relative inline-block">
              &ldquo;bekerja keras&rdquo;
              <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#38bdf8]/60 rounded-full" />
            </span>
            , melainkan mampu membuktikan{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#93c5fd] via-[#ffffff] to-[#38bdf8] font-black">
              efisiensi, akuntabilitas,
            </span>{' '}
            dan nilai tambah kerjanya melalui{' '}
            <span className="font-black text-white underline decoration-[#38bdf8] decoration-wavy decoration-2 underline-offset-8">
              data konkret.
            </span>
          </h1>

          {/* Subtitle Ringkas Berkelas */}
          <div className="max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm md:text-base text-blue-100/80 font-normal leading-relaxed tracking-wide">
              Platform manajemen jadwal proyek, presensi jam bersih potong istirahat, lembur genap, dan evaluasi berbasis bukti data konkret.
            </p>
          </div>

          {/* Dua Tombol Aksi Kapsul Elegan */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-1 sm:pt-3">
            <button
              type="button"
              onClick={() => openAuth(true)}
              className="w-full sm:w-auto px-7 sm:px-8 py-3 sm:py-3.5 rounded-full bg-white text-black font-bold text-xs sm:text-sm hover:bg-slate-200 transition-all shadow-2xl shadow-black/40 transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
            >
              <span>Buka Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openAuth(false)}
              className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-xl transition-colors flex items-center justify-center"
            >
              <span>Pelajari Fitur</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            STRIP KARTU FITUR DI BAGIAN BAWAH HERO (RESPONSIF HORISONTAL SWIPE DI MOBILE)
           ===================================================================== */}
        <div className="relative z-10 w-full px-4 sm:px-8 lg:px-16 pt-4 sm:pt-8 pb-4">
          {/* Mobile Swipe Hint */}
          <div className="flex md:hidden items-center justify-center gap-1.5 text-[10px] text-blue-200/70 font-semibold mb-2">
            <span>&larr; Geser kartu fitur &rarr;</span>
          </div>
          <div className="w-full flex overflow-x-auto no-scrollbar md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 text-left pb-2 snap-x snap-mandatory">
            {/* Kartu 1: Kalender */}
            <a href="#kalender-section" className="min-w-[210px] sm:min-w-0 flex-shrink-0 md:flex-shrink p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/[0.09] via-slate-900/70 to-[#0a1b38]/80 hover:from-white/[0.14] hover:to-[#0f244c]/90 border border-slate-300/25 border-t-white/40 backdrop-blur-2xl shadow-xl shadow-black/60 transition-all group block snap-center"
            >
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span className="font-semibold text-[#38bdf8]">Fitur 01</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-white/40" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#38bdf8] transition-colors line-clamp-1">
                Kalender Proyek
              </h3>
              <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                Jadwal multi-hari &amp; durasi kerja riil tanpa libur.
              </p>
            </a>

            {/* Kartu 2: 4 Grafik */}
            <a href="#grafik-section" className="min-w-[210px] sm:min-w-0 flex-shrink-0 md:flex-shrink p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/[0.09] via-slate-900/70 to-[#0a1b38]/80 hover:from-white/[0.14] hover:to-[#0f244c]/90 border border-slate-300/25 border-t-white/40 backdrop-blur-2xl shadow-xl shadow-black/60 transition-all group block snap-center"
            >
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span className="font-semibold text-[#bf5af2]">Fitur 02</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-white/40" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#bf5af2] transition-colors line-clamp-1">
                4 Grafik Analitik
              </h3>
              <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                Grid 2x2 visualisasi tren beban &amp; disiplin presensi.
              </p>
            </a>

            {/* Kartu 3: Presensi */}
            <a href="#presensi-section" className="min-w-[210px] sm:min-w-0 flex-shrink-0 md:flex-shrink p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/[0.09] via-slate-900/70 to-[#0a1b38]/80 hover:from-white/[0.14] hover:to-[#0f244c]/90 border border-slate-300/25 border-t-white/40 backdrop-blur-2xl shadow-xl shadow-black/60 transition-all group block snap-center"
            >
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span className="font-semibold text-[#30d158]">Fitur 03</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-white/40" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#30d158] transition-colors line-clamp-1">
                Presensi &amp; Lembur
              </h3>
              <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                Jam bersih potong istirahat, lembur genap, selfie &amp; GPS.
              </p>
            </a>

            {/* Kartu 4: Bank Ide */}
            <a href="#bank-ide-section" className="min-w-[210px] sm:min-w-0 flex-shrink-0 md:flex-shrink p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/[0.09] via-slate-900/70 to-[#0a1b38]/80 hover:from-white/[0.14] hover:to-[#0f244c]/90 border border-slate-300/25 border-t-white/40 backdrop-blur-2xl shadow-xl shadow-black/60 transition-all group block snap-center"
            >
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span className="font-semibold text-[#ff9f0a]">Fitur 04</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-white/40" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#ff9f0a] transition-colors line-clamp-1">
                Bank Ide Terstruktur
              </h3>
              <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                1-Klik jadwalkan ke kalender &amp; taut balik arahan asal.
              </p>
            </a>

            {/* Kartu 5: Asisten AI & Ekspor */}
            <a
              href="#ai-section"
              className="col-span-2 md:col-span-4 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/[0.09] via-slate-900/70 to-[#0a1b38]/80 hover:from-white/[0.14] hover:to-[#0f244c]/90 border border-slate-300/25 border-t-white/40 backdrop-blur-2xl shadow-xl shadow-black/60 transition-all group block"
            >
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span className="font-semibold text-[#63e6e2]">Fitur 05 &amp; 06</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-white/40" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#63e6e2] transition-colors line-clamp-1">
                AI &amp; Ekspor Eksekutif
              </h3>
              <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                Evaluasi kinerja instan &amp; ekspor PDF, XLSX, PPTX.
              </p>
            </a>
          </div>
        </div>

        {/* Gradasi Lembut Menuju Hitam Pekat di Bawah Hero */}
        <div className="absolute bottom-0 inset-x-0 h-48 pointer-events-none bg-gradient-to-b from-transparent via-[#000000]/70 to-[#000000] z-1" />
      </section>

      {/* =========================================================================
          3. SHOWCASE FITUR LENGKAP: LATAR HITAM & KOTAK GLASS SILVER KE BIRU
         ========================================================================= */}

      {/* =====================================================================
          FITUR 01: KALENDER JADWAL PROYEK & PENANGANAN MULTI-HARI
         ===================================================================== */}
      <section id="kalender-section" className="relative z-10 py-20 px-4 sm:px-8 lg:px-16 w-full max-w-[1800px] mx-auto">
        <div className="space-y-10 text-left">
          {/* Header Fitur 01 dengan Kontras Tinggi & Badge Bercahaya */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-blue-400/25 pb-6">
            <div className="space-y-2.5 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-[#38bdf8] border border-blue-400/40 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Calendar className="w-3.5 h-3.5" />
                <span>Fitur Unggulan 01 &bull; Akuntabilitas Jadwal Nyata</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Kalender Jadwal Proyek &amp; Penanganan Multi-Hari
              </h2>
              <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed font-normal">
                Menghitung durasi hari kerja riil tanpa memasukkan hari libur nasional, memetakan cabang program proyek multi-hari, menangani riwayat revisi (<code className="text-[#38bdf8] font-mono">+1 Rev</code>), dan menandai tanggal merah otomatis.
              </p>
            </div>
            
            {/* KPI Ringkas Fitur Kalender */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-400/10 via-blue-500/15 to-slate-400/10 border-b border-slate-300/25 border border-blue-400/30 text-center">
                <span className="block text-xl font-black text-[#38bdf8]">38</span>
                <span className="text-[10px] uppercase font-bold text-blue-200">Proyek 2026</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-400/10 via-blue-500/15 to-slate-400/10 border-b border-slate-300/25 border border-blue-400/30 text-center">
                <span className="block text-xl font-black text-[#30d158]">248</span>
                <span className="text-[10px] uppercase font-bold text-blue-200">Hari Kerja</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-400/10 via-blue-500/15 to-slate-400/10 border-b border-slate-300/25 border border-blue-400/30 text-center">
                <span className="block text-xl font-black text-[#ff9f0a]">16</span>
                <span className="text-[10px] uppercase font-bold text-blue-200">Libur Nasional</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-400/10 via-blue-500/15 to-slate-400/10 border-b border-slate-300/25 border border-blue-400/30 text-center">
                <span className="block text-xl font-black text-white">0</span>
                <span className="text-[10px] uppercase font-bold text-blue-200">Jadwal Bentrok</span>
              </div>
            </div>
          </div>

          {/* Visual Kalender Proyek Full-Width Deep Royal Blue Glass Theme */}
          <div className="bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl rounded-3xl border border-blue-400/30 shadow-2xl shadow-[#020a1f]/80 overflow-hidden backdrop-blur-2xl">
            {/* Top Toolbar Kalender */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-400/10 via-blue-500/15 to-slate-400/10 border-b border-slate-300/25 border-b border-blue-400/25 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0071e3] flex items-center justify-center text-white shadow-md shadow-[#0071e3]/40">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl text-white">November 2026</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40">
                      Bulan Aktif
                    </span>
                  </div>
                  <span className="text-xs text-blue-200/80">Jadwal Operasional Terpadu &bull; Divisi Teknis, Sosmed &amp; Direksi</span>
                </div>
              </div>

              {/* Filter Tabs & Legend */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 text-[#38bdf8] border border-blue-400/30 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <span>Jadwal Proyek</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/30 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#ff9f0a]" />
                  <span>Multi-Hari (Koordinasi)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff375f]/15 text-[#ff375f] border border-[#ff375f]/30 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#ff375f]" />
                  <span>Hari Libur Nasional</span>
                </span>
              </div>
            </div>

            {/* Nama Hari */}
            <div className="overflow-x-auto w-full no-scrollbar">
              <div className="min-w-[760px] sm:min-w-full grid grid-cols-7 border-b border-slate-300/25 text-center text-xs font-black py-3 bg-slate-900/95 uppercase tracking-wider text-blue-200">
                <span>Senin</span>
                <span>Selasa</span>
                <span>Rabu</span>
                <span>Kamis</span>
                <span>Jumat</span>
                <span className="text-[#ff6b81]">Sabtu</span>
                <span className="text-[#ff6b81]">Minggu</span>
              </div>
            </div>

            {/* Grid Kalender Responsif: Preview Sebulan Penuh Proyek Aktif (November 2026) */}
            {/* Wrapper Horisontal Kalender agar rapi dan tidak nimpah-nimpah di layar HP */}
            <div className="flex sm:hidden items-center justify-between px-4 py-2.5 bg-blue-500/15 border-b border-slate-300/20 text-[11px] text-[#38bdf8] font-bold">
              <span>&larr; Geser kalender untuk melihat seluruh hari &rarr;</span>
              <span className="text-[10px] text-slate-300 font-mono">Nov 2026</span>
            </div>
            <div className="overflow-x-auto w-full no-scrollbar">
              <div className="min-w-[760px] sm:min-w-full grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-400/20 text-xs">
              {/* Baris 1: 26 Okt - 1 Nov (Awal Bulan) */}
              <div className="p-2 sm:p-3 min-h-[110px] sm:min-h-[135px] bg-black/40 text-slate-500">
                <span className="font-semibold text-slate-500">26</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Sprint Plan Awal</div>
              </div>
              <div className="p-2 sm:p-3 min-h-[110px] sm:min-h-[135px] bg-black/40 text-slate-500">
                <span className="font-semibold text-slate-500">27</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Setup Server Staging</div>
              </div>
              <div className="p-2 sm:p-3 min-h-[110px] sm:min-h-[135px] bg-black/40 text-slate-500">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-500">28</span>
                </div>
                <div className="px-2 py-1 rounded-lg bg-[#ff9f0a]/20 text-[#ff9f0a] text-[10px] font-bold border border-[#ff9f0a]/40 shadow-sm">
                  &bull; Sumpah Pemuda
                </div>
              </div>
              <div className="p-2 sm:p-3 min-h-[110px] sm:min-h-[135px] bg-black/40 text-slate-500">
                <span className="font-semibold text-slate-500">29</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Audit Keamanan API</div>
              </div>
              <div className="p-2 sm:p-3 min-h-[110px] sm:min-h-[135px] bg-black/40 text-slate-500">
                <span className="font-semibold text-slate-500">30</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Pre-launch Briefing</div>
              </div>
              <div className="p-2 sm:p-3 min-h-[110px] sm:min-h-[135px] bg-black/40 text-slate-500">
                <span className="font-semibold text-slate-500">31</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Closing Oktober</div>
              </div>
              {/* 1 November (Minggu) */}
              <div className="p-2 sm:p-3 min-h-[110px] sm:min-h-[135px] bg-[#0c162c]/50 text-[#ff6b81] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">1</span>
                  <span className="text-[9px] px-1 rounded bg-[#ff375f]/20 text-[#ff6b81] font-bold">Min</span>
                </div>
                <div className="p-1 rounded-md bg-white/[0.05] text-slate-300 text-[10px] truncate border border-white/10 font-medium">
                  &bull; Standby Ops Server
                </div>
              </div>

              {/* Baris 2: 2 - 8 November (Minggu Pertama Penuh Proyek) */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">2</div>
                <div className="p-1.5 rounded-lg bg-[#2997ff]/25 border border-[#2997ff]/50 text-white flex items-center justify-between text-[11px] shadow-sm">
                  <span className="font-bold truncate">&bull; meeting..</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#0071e3] text-white rounded">1h</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.08] text-blue-100 text-[10px] flex justify-between font-medium">
                  <span>&bull; admin ops</span>
                  <span className="text-blue-300">1h</span>
                </div>
                <span className="text-[10px] text-[#38bdf8] font-bold cursor-pointer block hover:underline">+3 jadwal lagi &gt;</span>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">3</div>
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/25 border border-[#ff9f0a]/50 text-white flex items-center justify-between text-[11px] shadow-md">
                  <span className="font-black text-[#ff9f0a] truncate">! Rapat Koordinasi Tahunan</span>
                  <span className="text-[9px] bg-[#ff9f0a] text-black font-black px-1.5 py-0.5 rounded">H-1</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#bf5af2]/20 border border-[#bf5af2]/40 text-white text-[10px] flex justify-between font-bold">
                  <span>Kolaborasi Tim</span>
                  <span className="text-[#bf5af2]">2h</span>
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">4</div>
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/20 border border-dashed border-[#ff9f0a]/50 text-[#ff9f0a] flex items-center justify-between text-[11px]">
                  <span className="truncate font-bold">&crarr; H-2 Koordinasi</span>
                  <span className="text-[9px] text-blue-200">Gedung A</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#63e6e2]/20 border border-[#63e6e2]/40 text-[#63e6e2] text-[10px] flex justify-between font-bold">
                  <span>Publikasi SOP</span>
                  <span>1h</span>
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">5</div>
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/20 border border-dashed border-[#ff9f0a]/50 text-[#ff9f0a] flex items-center justify-between text-[11px]">
                  <span className="truncate font-bold">&crarr; H-3 Koordinasi</span>
                  <span className="text-[9px] text-blue-200">Closing</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.08] text-blue-100 text-[10px] truncate font-medium">
                  &bull; Audit Sistem (1h)
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">6</div>
                <div className="p-1.5 rounded-lg bg-[#bf5af2]/25 border border-[#bf5af2]/50 text-white flex items-center justify-between text-[11px] shadow-sm">
                  <span className="truncate font-bold">&bull; Penyusunan</span>
                  <span className="text-[9px] bg-[#bf5af2] text-white font-black px-1.5 py-0.2 rounded">Konten</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.08] text-white text-[10px] flex justify-between font-bold">
                  <span>Dokumentasi Sistem</span>
                  <span className="text-[#ff375f] bg-[#ff375f]/20 px-1 rounded border border-[#ff375f]/40">+1 Rev</span>
                </div>
                <span className="text-[10px] text-[#38bdf8] font-bold cursor-pointer block hover:underline">+2 lagi &gt;</span>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0c162c]/50 text-[#ff6b81] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">7</span>
                  <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-bold">Sab</span>
                </div>
                <div className="p-1.5 rounded-md bg-white/[0.06] text-slate-200 text-[10px] truncate border border-white/10 font-bold">
                  &bull; Backup Server Bulanan
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0c162c]/50 text-[#ff6b81] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">8</span>
                  <span className="text-[9px] px-1 rounded bg-[#ff375f]/20 text-[#ff6b81] font-bold">Min</span>
                </div>
                <div className="p-1.5 rounded-md bg-white/[0.06] text-slate-200 text-[10px] truncate border border-white/10 font-bold">
                  &bull; On-Call Teknis
                </div>
              </div>

              {/* Baris 3: 9 - 15 November (Minggu Kedua Penuh Proyek) */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">9</div>
                <div className="p-1.5 rounded-lg bg-[#30d158]/20 border border-[#30d158]/40 text-[#30d158] text-[10px] flex justify-between font-bold">
                  <span className="truncate">[Revisi] Dokumentasi</span>
                  <span>1h</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#ff375f]/20 border border-[#ff375f]/40 text-[#ff375f] text-[10px] flex justify-between font-bold">
                  <span className="truncate">Briefing Senin</span>
                  <span>1h</span>
                </div>
              </div>

              {/* TANGGAL 10: HARI INI SESUAI SCREENSHOT USER */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0071e3]/30 border-2 border-[#38bdf8] space-y-1.5 relative shadow-xl shadow-[#0071e3]/40">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-[#0071e3] text-white font-black flex items-center justify-center text-xs shadow-md border border-white/40">
                    10
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#38bdf8] text-black text-[9px] font-black uppercase tracking-wider shadow-sm">
                    HARI INI
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/25 text-[#ff9f0a] text-[10px] font-bold border border-[#ff9f0a]/40 shadow-xs">
                  &bull; Hari Pahlawan Nasional
                </div>
                <div className="p-1.5 rounded-lg bg-[#30d158]/25 border border-[#30d158]/50 text-white text-[10px] font-black flex justify-between items-center shadow-xs">
                  <span className="truncate">&bull; Migrasi Server</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 bg-[#30d158] text-black rounded font-black">SERVER CLOUD</span>
                </div>
              </div>

              {/* 11 November */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">11</div>
                <div className="p-1.5 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8] text-[10px] flex justify-between font-bold">
                  <span className="truncate">&bull; Meta Ads Q4</span>
                  <span>2h</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#63e6e2]/20 border border-[#63e6e2]/40 text-[#63e6e2] text-[10px] flex justify-between font-bold">
                  <span>Review Budget Iklan</span>
                </div>
              </div>

              {/* 12 November */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">12</div>
                <div className="p-1.5 rounded-lg bg-[#30d158]/25 border border-[#30d158]/50 text-white text-[10px] flex justify-between font-bold shadow-xs">
                  <span className="truncate">&bull; Modul Pembayaran API</span>
                  <span className="text-[9px] bg-[#30d158] text-black font-black px-1 rounded">Dev</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.08] text-blue-100 text-[10px] truncate">
                  &bull; Sesi SOP Presensi Tim
                </div>
              </div>

              {/* 13 November */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">13</div>
                <div className="p-1.5 rounded-lg bg-[#bf5af2]/20 border border-[#bf5af2]/40 text-[#bf5af2] text-[10px] flex justify-between font-bold">
                  <span className="truncate">&bull; Audit Database</span>
                  <span>1h</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/20 border border-[#ff9f0a]/40 text-[#ff9f0a] text-[10px] flex justify-between font-bold">
                  <span>Retro Sprint Mingguan</span>
                </div>
              </div>

              {/* 14 November */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0c162c]/50 text-[#ff6b81] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">14</span>
                  <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-bold">Sab</span>
                </div>
                <div className="p-1.5 rounded-md bg-white/[0.06] text-slate-200 text-[10px] truncate border border-white/10 font-bold">
                  &bull; Penyelarasan Tim QC
                </div>
              </div>

              {/* 15 November */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0c162c]/50 text-[#ff6b81] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">15</span>
                  <span className="text-[9px] px-1 rounded bg-[#ff375f]/20 text-[#ff6b81] font-bold">Min</span>
                </div>
                <div className="p-1.5 rounded-md bg-white/[0.06] text-slate-200 text-[10px] truncate border border-white/10 font-medium">
                  &bull; Libur Mingguan
                </div>
              </div>

              {/* Baris 4: 16 - 22 November (Minggu Ketiga Penuh Proyek) */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">16</div>
                <div className="p-1.5 rounded-lg bg-[#38bdf8]/25 border border-[#38bdf8]/50 text-white text-[10px] flex justify-between font-bold">
                  <span className="truncate">&bull; Kickoff App V2</span>
                  <span className="text-[9px] bg-[#0071e3] px-1 rounded">2h</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.08] text-blue-100 text-[10px] truncate">
                  Briefing Desain UI/UX
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">17</div>
                <div className="p-1.5 rounded-lg bg-[#30d158]/20 border border-[#30d158]/40 text-[#30d158] text-[10px] flex justify-between font-bold">
                  <span className="truncate">&bull; SOP Presensi Mandiri</span>
                  <span>1h</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/20 border border-[#ff9f0a]/40 text-[#ff9f0a] text-[10px] truncate font-bold">
                  Uji Radius GPS 15m
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">18</div>
                <div className="p-1.5 rounded-lg bg-[#bf5af2]/25 border border-[#bf5af2]/50 text-white text-[10px] flex justify-between font-bold shadow-xs">
                  <span className="truncate">&bull; Inventaris POS</span>
                  <span className="text-[9px] bg-[#bf5af2] text-black font-black px-1 rounded">Payment</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.08] text-blue-100 text-[10px] truncate">
                  Integrasi Midtrans QRIS
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">19</div>
                <div className="p-1.5 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8] text-[10px] flex justify-between font-bold">
                  <span className="truncate">&bull; Load Testing 10k User</span>
                  <span>2h</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#63e6e2]/20 border border-[#63e6e2]/40 text-[#63e6e2] text-[10px] truncate font-bold">
                  Optimasi Query Supabase
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">20</div>
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/25 border border-[#ff9f0a]/50 text-white text-[10px] flex justify-between font-bold shadow-xs">
                  <span className="truncate">&bull; Rekap Jam Lembur</span>
                  <span className="text-[9px] bg-[#ff9f0a] text-black font-black px-1 rounded">Mid-Month</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#30d158]/20 border border-[#30d158]/40 text-[#30d158] text-[10px] truncate font-bold">
                  Approval HR Lembur Genap
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0c162c]/50 text-[#ff6b81] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">21</span>
                  <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-bold">Sab</span>
                </div>
                <div className="p-1.5 rounded-md bg-white/[0.06] text-slate-200 text-[10px] truncate border border-white/10 font-bold">
                  &bull; Maintenance Hardware Kantor
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0c162c]/50 text-[#ff6b81] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">22</span>
                  <span className="text-[9px] px-1 rounded bg-[#ff375f]/20 text-[#ff6b81] font-bold">Min</span>
                </div>
                <div className="p-1.5 rounded-md bg-white/[0.06] text-slate-200 text-[10px] truncate border border-white/10 font-medium">
                  &bull; Libur Mingguan
                </div>
              </div>

              {/* Baris 5: 23 - 29 November (Minggu Keempat Penuh Proyek) */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">23</div>
                <div className="p-1.5 rounded-lg bg-[#0071e3]/30 border border-[#38bdf8]/50 text-white text-[10px] flex justify-between font-bold">
                  <span className="truncate">&bull; Checkout Cepat V2</span>
                  <span className="text-[9px] text-[#38bdf8] font-black">#089</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.08] text-blue-100 text-[10px] truncate font-medium">
                  Implementasi Bank Ide
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">24</div>
                <div className="p-1.5 rounded-lg bg-[#ff375f]/20 border border-[#ff375f]/40 text-[#ff375f] text-[10px] flex justify-between font-bold">
                  <span className="truncate">&bull; Produksi Materi Edukasi</span>
                  <span>3h</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.08] text-blue-100 text-[10px] truncate">
                  Narasi Operasional Video
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">25</div>
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/25 text-[#ff9f0a] text-[10px] font-bold border border-[#ff9f0a]/40 shadow-xs">
                  &bull; Hari Guru Nasional
                </div>
                <div className="p-1.5 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8] text-[10px] flex justify-between font-bold">
                  <span>Webinar Edukasi AI Pro</span>
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">26</div>
                <div className="p-1.5 rounded-lg bg-[#30d158]/25 border border-[#30d158]/50 text-white text-[10px] flex justify-between font-bold shadow-xs">
                  <span className="truncate">&bull; Deploy Backend Prod</span>
                  <span className="text-[9px] bg-[#30d158] text-black font-black px-1 rounded">Prod</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.08] text-blue-100 text-[10px] truncate">
                  Verifikasi Staging Passed
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">27</div>
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/20 border border-[#ff9f0a]/40 text-[#ff9f0a] text-[10px] flex justify-between font-bold">
                  <span className="truncate">&bull; Rekap Presensi &amp; Gaji</span>
                  <span>2h</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#30d158]/20 border border-[#30d158]/40 text-[#30d158] text-[10px] truncate font-bold">
                  Pembulatan Lembur Genap
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0c162c]/50 text-[#ff6b81] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">28</span>
                  <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-bold">Sab</span>
                </div>
                <div className="p-1.5 rounded-md bg-white/[0.06] text-slate-200 text-[10px] truncate border border-white/10 font-bold">
                  &bull; Monitoring Server Prod
                </div>
              </div>

              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0c162c]/50 text-[#ff6b81] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">29</span>
                  <span className="text-[9px] px-1 rounded bg-[#ff375f]/20 text-[#ff6b81] font-bold">Min</span>
                </div>
                <div className="p-1.5 rounded-md bg-white/[0.06] text-slate-200 text-[10px] truncate border border-white/10 font-medium">
                  &bull; Libur Mingguan
                </div>
              </div>

              {/* Baris 6: 30 November (Closing Akhir Bulan Penuh) */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-[#0d1b38]/40 space-y-1.5 hover:bg-blue-600/10 transition-colors">
                <div className="font-bold text-white text-sm">30</div>
                <div className="p-1.5 rounded-lg bg-[#38bdf8]/25 border border-[#38bdf8]/50 text-white text-[10px] flex justify-between font-bold shadow-xs">
                  <span className="truncate">&bull; Closing Buku Bulanan</span>
                  <span className="text-[9px] bg-[#0071e3] text-white font-black px-1 rounded">Audit</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#30d158]/20 border border-[#30d158]/40 text-[#30d158] text-[10px] flex justify-between font-bold">
                  <span>Ekspor Laporan PDF/XLSX</span>
                </div>
              </div>

              {/* Sisa kotak Desember (1 - 6 Des) */}
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-black/40 text-slate-500 space-y-1">
                <span className="font-semibold text-slate-500">1 Des</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Sprint Q4 Closing</div>
              </div>
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-black/40 text-slate-500 space-y-1">
                <span className="font-semibold text-slate-500">2 Des</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Evaluasi Tahunan</div>
              </div>
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-black/40 text-slate-500 space-y-1">
                <span className="font-semibold text-slate-500">3 Des</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Penyusunan Roadmap</div>
              </div>
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-black/40 text-slate-500 space-y-1">
                <span className="font-semibold text-slate-500">4 Des</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Audit ISO Internal</div>
              </div>
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-black/40 text-slate-500 space-y-1">
                <span className="font-semibold text-slate-500">5 Des</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Gala Dinner Direksi</div>
              </div>
              <div className="p-2 sm:p-3 min-h-[120px] sm:min-h-[145px] bg-black/40 text-slate-500 space-y-1">
                <span className="font-semibold text-[#ff6b81]/50">6 Des</span>
                <div className="mt-1 p-1 rounded bg-white/[0.03] text-[10px] text-slate-500 truncate">Libur Akhir Pekan</div>
              </div>
            </div>

              </div>
            {/* Bottom Bar Kalender */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-400/10 via-blue-500/15 to-slate-400/10 border-b border-slate-300/25 border-t border-blue-400/25 flex flex-wrap items-center justify-between gap-4 text-xs text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
                <span className="font-semibold">Otomatis memotong 60 menit jam istirahat &amp; mengisolasi hari libur kerja</span>
              </div>
              <button
                type="button"
                onClick={() => openAuth(true)}
                className="px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#1a82f7] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#0071e3]/30 transition-all"
              >
                <span>Buka Jadwal Kalender Interaktif</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>


            </section>

      {/* =====================================================================
          FITUR 02: DASHBOARD 4 GRAFIK GARIS ANALITIK KINERJA 1 TAHUN PENUH (2026)
         ===================================================================== */}
      <section id="grafik-section" className="relative z-10 py-20 px-4 sm:px-8 lg:px-16 w-full max-w-[1800px] mx-auto">
        <div className="space-y-10 text-left">
          {/* Header Fitur 02 dengan Penekanan Data 1 Tahun Penuh */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-blue-400/25 pb-6">
            <div className="space-y-2.5 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#bf5af2]/20 text-[#bf5af2] border border-[#bf5af2]/40 text-xs font-bold uppercase tracking-wider shadow-sm">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Fitur Unggulan 02 &bull; Bukti Statistik Kinerja 1 Tahun Penuh (Jan &mdash; Des 2026)</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Dashboard 4 Grafik Garis Analitik Kinerja Tahunan
              </h2>
              <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed font-normal">
                Visualisasi berbasis grafik garis SVG 12 bulan penuh yang membuktikan beban tahunan, peringkat durasi hari pengerjaan, fluktuasi kedisiplinan presensi, hingga realisasi jam bersih vs lemur terverifikasi.
              </p>
            </div>

            {/* Filter Waktu & Kuartal */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="px-4 py-2 rounded-xl text-xs font-black bg-[#0071e3] text-white shadow-md shadow-[#0071e3]/40 border border-blue-400/50">
                &bull; Data 1 Tahun Penuh (12 Bulan)
              </span>
              <span className="px-3 py-2 rounded-xl text-xs font-bold bg-[#0c245c]/80 text-blue-200 border border-blue-400/25">
                Q1 &bull; Q2 &bull; Q3 &bull; Q4 2026
              </span>
            </div>
          </div>

          {/* GRID 2X2 EMPAT GRAFIK GARIS ANALITIK SVG 12 BULAN LENGKAP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
            {/* GRAFIK 1: TREN TAHUNAN 12 BULAN (JANUARI - DESEMBER 2026) */}
            <div className="p-4 sm:p-6 md:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-blue-400/20 pb-4">
                <div>
                  <span className="text-xs font-black text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Grafik 1 &bull; Beban Proyek Tahunan (12 Bulan)
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Ringkasan Beban Proyek (Januari &mdash; Desember 2026)
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40">
                  Total 38 Proyek
                </span>
              </div>

              {/* Visual SVG Line Chart 12 Bulan Sepanjang Tahun */}
              <div className="h-60 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 540 180">
                  <defs>
                    <linearGradient id="areaGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="areaGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ff375f" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ff375f" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines Horisontal */}
                  <line x1="45" y1="20" x2="520" y2="20" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="45" y1="65" x2="520" y2="65" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="45" y1="110" x2="520" y2="110" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="45" y1="150" x2="520" y2="150" stroke="rgba(255,255,255,0.2)" />

                  {/* Nilai Y */}
                  <text x="30" y="24" fill="#93c5fd" fontSize="11" fontWeight="bold">16</text>
                  <text x="30" y="69" fill="#93c5fd" fontSize="11" fontWeight="bold">10</text>
                  <text x="30" y="114" fill="#93c5fd" fontSize="11" fontWeight="bold">5</text>
                  <text x="30" y="154" fill="#93c5fd" fontSize="11" fontWeight="bold">0</text>

                  {/* Area Fill Gradient Garis 1 */}
                  <path
                    d="M 50 120 L 90 110 L 130 100 L 170 80 L 210 90 L 250 70 L 290 80 L 330 65 L 370 70 L 410 55 L 450 25 L 490 85 L 490 150 L 50 150 Z"
                    fill="url(#areaGradient1)"
                  />

                  {/* Garis Proyek 1: PORTAL LAYANAN & Operasional IT (Biru Muda) */}
                  <path
                    d="M 50 120 L 90 110 L 130 100 L 170 80 L 210 90 L 250 70 L 290 80 L 330 65 L 370 70 L 410 55 L 450 25 L 490 85"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Titik Puncak November */}
                  <circle cx="450" cy="25" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
                  <text x="450" y="14" fill="#38bdf8" fontSize="11" fontWeight="900" textAnchor="middle">14 Proyek</text>

                  {/* Garis Proyek 2: Meeting Strategis & Koordinasi (Rose Red) */}
                  <path
                    d="M 50 135 L 90 130 L 130 125 L 170 115 L 210 125 L 250 105 L 290 115 L 330 115 L 370 105 L 410 95 L 450 75 L 490 95"
                    fill="none"
                    stroke="#ff375f"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="450" cy="75" r="5" fill="#ff375f" stroke="#ffffff" strokeWidth="2" />

                  {/* Garis Proyek 3: Toko Apps & Retail (Emerald Green) */}
                  <path
                    d="M 50 142 L 90 138 L 130 135 L 170 125 L 210 128 L 250 118 L 290 120 L 330 110 L 370 112 L 410 100 L 450 90 L 490 120"
                    fill="none"
                    stroke="#30d158"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="450" cy="90" r="4.5" fill="#30d158" stroke="#ffffff" strokeWidth="1.5" />

                  {/* Label 12 Bulan di Sumbu X */}
                  <g fill="#bfdbfe" fontSize="10" fontWeight="bold" textAnchor="middle">
                    <text x="50" y="170">Jan</text>
                    <text x="90" y="170">Feb</text>
                    <text x="130" y="170">Mar</text>
                    <text x="170" y="170">Apr</text>
                    <text x="210" y="170">Mei</text>
                    <text x="250" y="170">Jun</text>
                    <text x="290" y="170">Jul</text>
                    <text x="330" y="170">Agu</text>
                    <text x="370" y="170">Sep</text>
                    <text x="410" y="170">Okt</text>
                    <text x="450" y="170" fill="#38bdf8" fontSize="12" fontWeight="900">Nov</text>
                    <text x="490" y="170">Des</text>
                  </g>
                </svg>
              </div>

              {/* Legend Lengkap 4 Kategori Proyek */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100 border-t border-blue-400/20">
                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 text-[#38bdf8] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                    PORTAL LAYANAN (98 Job)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ff375f]/20 text-[#ff375f] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff375f]" />
                    MEETING (48 Sesi)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#30d158]/20 text-[#30d158] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#30d158]" />
                    TOKO APPS (44 Job)
                  </span>
                </div>
                <span className="font-bold text-white text-[11px]">SLA Tahunan: 100% Selesai</span>
              </div>
            </div>

            {/* GRAFIK 2: AKUMULASI DURASI KERJA PROYEK 1 TAHUN (DAYS RANKING) */}
            <div className="p-4 sm:p-6 md:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-blue-400/20 pb-4">
                <div>
                  <span className="text-xs font-black text-[#30d158] uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    Grafik 2 &bull; Akumulasi Durasi Kerja Proyek 1 Tahun
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Peringkat Durasi Kerja Proyek (Hari Kerja Efektif)
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40">
                  Diurutkan Terlama
                </span>
              </div>

              {/* Visual SVG Line & Area Chart Durasi Proyek Tahunan */}
              <div className="h-60 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 540 180">
                  <defs>
                    <linearGradient id="areaGradientGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#30d158" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#30d158" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="50" y1="20" x2="520" y2="20" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="50" y1="65" x2="520" y2="65" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="50" y1="110" x2="520" y2="110" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="50" y1="150" x2="520" y2="150" stroke="rgba(255,255,255,0.2)" />

                  <text x="15" y="24" fill="#93c5fd" fontSize="11" fontWeight="bold">160 Days</text>
                  <text x="20" y="69" fill="#93c5fd" fontSize="11" fontWeight="bold">90 Days</text>
                  <text x="20" y="114" fill="#93c5fd" fontSize="11" fontWeight="bold">40 Days</text>
                  <text x="35" y="154" fill="#93c5fd" fontSize="11" fontWeight="bold">0</text>

                  {/* Area Fill */}
                  <path
                    d="M 70 30 L 150 75 L 230 115 L 310 128 L 390 134 L 470 138 L 470 150 L 70 150 Z"
                    fill="url(#areaGradientGreen)"
                  />

                  {/* Garis Hijau Zamrud Menghubungkan Ranking Durasi */}
                  <path
                    d="M 70 30 L 150 75 L 230 115 L 310 128 L 390 134 L 470 138"
                    fill="none"
                    stroke="#30d158"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Titik Data #1 PORTAL LAYANAN */}
                  <circle cx="70" cy="30" r="6" fill="#30d158" stroke="#ffffff" strokeWidth="2.5" />
                  <text x="70" y="16" fill="#30d158" fontSize="11" fontWeight="900" textAnchor="middle">142 Days</text>

                  {/* Titik Data #2 META ADS */}
                  <circle cx="150" cy="75" r="5" fill="#30d158" stroke="#ffffff" strokeWidth="2" />
                  <text x="150" y="62" fill="#30d158" fontSize="10" fontWeight="bold" textAnchor="middle">86 Days</text>

                  {/* Titik Data #3 MEETING */}
                  <circle cx="230" cy="115" r="4.5" fill="#30d158" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="230" y="103" fill="#30d158" fontSize="10" fontWeight="bold" textAnchor="middle">48 Days</text>

                  {/* Titik Data #4 TOKOKANG */}
                  <circle cx="310" cy="128" r="4" fill="#30d158" />
                  <text x="310" y="120" fill="#93c5fd" fontSize="9" textAnchor="middle">34d</text>

                  {/* Titik Data #5 INVENTARIS */}
                  <circle cx="390" cy="134" r="4" fill="#30d158" />
                  <text x="390" y="126" fill="#93c5fd" fontSize="9" textAnchor="middle">28d</text>

                  {/* Titik Data #6 PEMELIHARAAN */}
                  <circle cx="470" cy="138" r="4" fill="#30d158" />
                  <text x="470" y="130" fill="#93c5fd" fontSize="9" textAnchor="middle">24d</text>

                  {/* Sumbu X Nama Proyek */}
                  <g fill="#bfdbfe" fontSize="10" fontWeight="bold" textAnchor="middle">
                    <text x="70" y="170" fill="#ffffff">PORTAL LAYANAN</text>
                    <text x="150" y="170">META ADS</text>
                    <text x="230" y="170">MEETING</text>
                    <text x="310" y="170">PEMBAYARAN</text>
                    <text x="390" y="170">INVENTARIS</text>
                    <text x="470" y="170">PEMELIHARAAN</text>
                  </g>
                </svg>
              </div>

              {/* Rincian Skor & Akuntabilitas */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100 border-t border-blue-400/20">
                <div className="flex gap-4">
                  <span className="font-black text-white">#1 PORTAL LAYANAN: 142 Days (100%)</span>
                  <span className="font-bold text-[#38bdf8]">#2 META ADS: 86 Days (100%)</span>
                  <span className="font-bold text-blue-200">#3 RAKERNAS: 48 Days (96%)</span>
                </div>
                <span className="text-[#30d158] font-black">Total 362 Days Terdata</span>
              </div>
            </div>

            {/* GRAFIK 3: FLUKTUASI DISIPLIN PRESENSI 12 BULAN (JAN - DES 2026) */}
            <div className="p-4 sm:p-6 md:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-blue-400/20 pb-4">
                <div>
                  <span className="text-xs font-black text-[#63e6e2] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Grafik 3 &bull; Fluktuasi Disiplin Presensi 1 Tahun Penuh
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Tingkat Ketepatan Waktu, Keterlambatan &amp; Izin (12 Bulan)
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#63e6e2]/20 text-[#63e6e2] border border-[#63e6e2]/40">
                  Rata-rata 98.8%
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 540 180">
                  <line x1="45" y1="20" x2="520" y2="20" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="45" y1="65" x2="520" y2="65" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="45" y1="110" x2="520" y2="110" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="45" y1="150" x2="520" y2="150" stroke="rgba(255,255,255,0.2)" />

                  <text x="15" y="24" fill="#93c5fd" fontSize="11" fontWeight="bold">100%</text>
                  <text x="20" y="69" fill="#93c5fd" fontSize="11" fontWeight="bold">98%</text>
                  <text x="20" y="114" fill="#93c5fd" fontSize="11" fontWeight="bold">95%</text>
                  <text x="25" y="154" fill="#93c5fd" fontSize="11" fontWeight="bold">0%</text>

                  {/* Garis Hijau Zamrud: Tingkat Disiplin Presensi Sangat Tinggi */}
                  <path
                    d="M 50 65 L 90 65 L 130 50 L 170 70 L 210 50 L 250 65 L 290 50 L 330 25 L 370 65 L 410 50 L 450 25 L 490 50"
                    fill="none"
                    stroke="#30d158"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Puncak Agustus & November 100% Tepat Waktu */}
                  <circle cx="330" cy="25" r="5" fill="#30d158" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="450" cy="25" r="5.5" fill="#30d158" stroke="#ffffff" strokeWidth="2" />

                  {/* Garis Oranye: Keterlambatan Minimal */}
                  <path
                    d="M 50 145 L 90 145 L 130 148 L 170 142 L 210 148 L 250 145 L 290 148 L 330 150 L 370 145 L 410 148 L 450 150 L 490 148"
                    fill="none"
                    stroke="#ff9f0a"
                    strokeWidth="2"
                  />

                  {/* Sumbu X 12 Bulan */}
                  <g fill="#bfdbfe" fontSize="10" fontWeight="bold" textAnchor="middle">
                    <text x="50" y="170">Jan</text>
                    <text x="90" y="170">Feb</text>
                    <text x="130" y="170">Mar</text>
                    <text x="170" y="170">Apr</text>
                    <text x="210" y="170">Mei</text>
                    <text x="250" y="170">Jun</text>
                    <text x="290" y="170">Jul</text>
                    <text x="330" y="170">Agu</text>
                    <text x="370" y="170">Sep</text>
                    <text x="410" y="170">Okt</text>
                    <text x="450" y="170" fill="#30d158" fontWeight="900">Nov</text>
                    <text x="490" y="170">Des</text>
                  </g>
                </svg>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100 border-t border-blue-400/20">
                <div className="flex gap-4">
                  <span className="text-[#30d158] font-black">Tepat Waktu: 244 Hari (98.4%)</span>
                  <span className="text-[#ff9f0a] font-bold">Terlambat: 3x (&lt;15m)</span>
                  <span className="text-blue-200">Izin Cuti: 1 Hari</span>
                </div>
                <span className="text-white font-bold text-[11px]">Toleransi GPS: 15 Meter</span>
              </div>
            </div>

            {/* GRAFIK 4: REALISASI JAM BERSIH VS LEMBUR 1 TAHUN (JAN - DES 2026) */}
            <div className="p-4 sm:p-6 md:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-blue-400/20 pb-4">
                <div>
                  <span className="text-xs font-black text-[#ff9f0a] uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="w-4 h-4" />
                    Grafik 4 &bull; Realisasi Jam Bersih &amp; Lembur 1 Tahun
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Jam Kerja Bersih vs Jam Lembur Terbulatkan Genap
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/40">
                  Total 1,984 Jam Bersih
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 540 180">
                  <line x1="45" y1="20" x2="520" y2="20" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="45" y1="65" x2="520" y2="65" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="45" y1="110" x2="520" y2="110" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                  <line x1="45" y1="150" x2="520" y2="150" stroke="rgba(255,255,255,0.2)" />

                  <text x="15" y="24" fill="#93c5fd" fontSize="11" fontWeight="bold">180 Jam</text>
                  <text x="15" y="69" fill="#93c5fd" fontSize="11" fontWeight="bold">120 Jam</text>
                  <text x="20" y="114" fill="#93c5fd" fontSize="11" fontWeight="bold">50 Jam</text>
                  <text x="35" y="154" fill="#93c5fd" fontSize="11" fontWeight="bold">0</text>

                  {/* Garis Biru Indigo: Jam Kerja Bersih (Stabil 160-176 Jam/Bulan) */}
                  <path
                    d="M 50 40 L 90 45 L 130 38 L 170 42 L 210 40 L 250 35 L 290 38 L 330 36 L 370 40 L 410 35 L 450 32 L 490 40"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="450" cy="32" r="5.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                  <text x="450" y="20" fill="#38bdf8" fontSize="10" fontWeight="900" textAnchor="middle">176 Jam Bersih</text>

                  {/* Garis Oranye Emas: Jam Lembur Terbulatkan Genap (8 - 18 Jam/Bulan) */}
                  <path
                    d="M 50 135 L 90 132 L 130 128 L 170 125 L 210 130 L 250 122 L 290 126 L 330 120 L 370 124 L 410 115 L 450 108 L 490 125"
                    fill="none"
                    stroke="#ff9f0a"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="450" cy="108" r="5" fill="#ff9f0a" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="450" y="98" fill="#ff9f0a" fontSize="10" fontWeight="900" textAnchor="middle">18j Lembur</text>

                  {/* Sumbu X 12 Bulan */}
                  <g fill="#bfdbfe" fontSize="10" fontWeight="bold" textAnchor="middle">
                    <text x="50" y="170">Jan</text>
                    <text x="90" y="170">Feb</text>
                    <text x="130" y="170">Mar</text>
                    <text x="170" y="170">Apr</text>
                    <text x="210" y="170">Mei</text>
                    <text x="250" y="170">Jun</text>
                    <text x="290" y="170">Jul</text>
                    <text x="330" y="170">Agu</text>
                    <text x="370" y="170">Sep</text>
                    <text x="410" y="170">Okt</text>
                    <text x="450" y="170" fill="#ff9f0a" fontWeight="900">Nov</text>
                    <text x="490" y="170">Des</text>
                  </g>
                </svg>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100 border-t border-blue-400/20">
                <div className="flex gap-4">
                  <span className="text-[#38bdf8] font-black">Jam Bersih: 1,984 Jam (12 Bulan)</span>
                  <span className="text-[#ff9f0a] font-black">Lembur: 148 Jam Bulat Genap</span>
                  <span className="text-blue-200">Potongan Istirahat: 248 Jam</span>
                </div>
                <span className="font-bold text-white text-[11px]">Standar Audit ISO 2026</span>
              </div>
            </div>
          </div>

          {/* =====================================================================
              KOMPONEN BARU SANGAT MENONJOL: BUKTI REKAP LAPORAN KINERJA TAHUNAN 2026
             ===================================================================== */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl border-2 border-slate-300/40 backdrop-blur-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-400/25 pb-5">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40 uppercase tracking-wider">
                  Audit Terverifikasi &bull; Periode Januari &mdash; Desember 2026
                </span>
                <h3 className="text-2xl font-black text-white">
                  Bukti Laporan Kinerja &amp; Akuntabilitas 1 Tahun Penuh
                </h3>
                <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
                  Rangkuman kuartal Q1 s/d Q4 membuktikan efisiensi riil kerja tim dengan integritas data konkret tanpa rekayasa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuth(true)}
                  className="px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#1a82f7] text-white font-bold text-xs shadow-lg shadow-[#0071e3]/40 flex items-center gap-1.5 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh Rekap Excel (XLSX)</span>
                </button>
              </div>
            </div>

            {/* 4 Kartu KPI Metrik Tahunan Terbesar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0c245c]/90 border border-blue-400/30 text-left space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-blue-200">Total Jam Bersih Setahun</span>
                <div className="text-2xl sm:text-3xl font-black text-[#38bdf8]">1,984 Jam</div>
                <p className="text-[10px] text-blue-100 font-medium">248 Hari Kerja &times; 8 Jam (Potong 60m)</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0c245c]/90 border border-blue-400/30 text-left space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-blue-200">Total Lembur Bulat Genap</span>
                <div className="text-2xl sm:text-3xl font-black text-[#ff9f0a]">148 Jam</div>
                <p className="text-[10px] text-blue-100 font-medium">Tercatat per jam genap terverifikasi</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0c245c]/90 border border-blue-400/30 text-left space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-blue-200">Proyek Tuntas Tepat Waktu</span>
                <div className="text-2xl sm:text-3xl font-black text-[#30d158]">38 / 38</div>
                <p className="text-[10px] text-blue-100 font-medium">100% SLA Pengiriman Kinerja</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0c245c]/90 border border-blue-400/30 text-left space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-blue-200">Skor Akuntabilitas AI</span>
                <div className="text-2xl sm:text-3xl font-black text-[#bf5af2]">98.8 / 100</div>
                <p className="text-[10px] text-blue-100 font-medium">Audit AI Kategori Unggul</p>
              </div>
            </div>

            {/* Tabel Kuartal Q1 - Q4 2026 */}
            <div className="overflow-x-auto w-full rounded-2xl border border-slate-300/25 no-scrollbar">
              <table className="w-full min-w-[640px] text-left text-xs text-blue-100">
                <thead className="bg-[#0a1e4a] text-white uppercase text-[11px] font-black border-b border-blue-400/25">
                  <tr>
                    <th className="py-3 px-4">Kuartal 2026</th>
                    <th className="py-3 px-4">Periode Bulan</th>
                    <th className="py-3 px-4 text-center">Proyek Selesai</th>
                    <th className="py-3 px-4 text-center">Jam Bersih</th>
                    <th className="py-3 px-4 text-center">Jam Lembur</th>
                    <th className="py-3 px-4 text-center">Tingkat Disiplin</th>
                    <th className="py-3 px-4 text-right">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-400/15 font-medium bg-[#0c245c]/60">
                  <tr className="hover:bg-blue-600/15 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">Kuartal 1 (Q1)</td>
                    <td className="py-3.5 px-4 text-blue-200">Januari &mdash; Maret 2026</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#38bdf8]">8 Proyek</td>
                    <td className="py-3.5 px-4 text-center font-bold">488 Jam</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#ff9f0a]">32 Jam</td>
                    <td className="py-3.5 px-4 text-center text-[#30d158] font-bold">98.4%</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40">
                        Lolos Audit &bull; A
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-600/15 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">Kuartal 2 (Q2)</td>
                    <td className="py-3.5 px-4 text-blue-200">April &mdash; Juni 2026</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#38bdf8]">10 Proyek</td>
                    <td className="py-3.5 px-4 text-center font-bold">496 Jam</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#ff9f0a]">38 Jam</td>
                    <td className="py-3.5 px-4 text-center text-[#30d158] font-bold">98.6%</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40">
                        Lolos Audit &bull; A
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-600/15 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">Kuartal 3 (Q3)</td>
                    <td className="py-3.5 px-4 text-blue-200">Juli &mdash; September 2026</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#38bdf8]">9 Proyek</td>
                    <td className="py-3.5 px-4 text-center font-bold">504 Jam</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#ff9f0a]">36 Jam</td>
                    <td className="py-3.5 px-4 text-center text-[#30d158] font-bold">99.1%</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40">
                        Lolos Audit &bull; A+
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-600/15 transition-colors bg-blue-500/10">
                    <td className="py-3.5 px-4 font-black text-white">Kuartal 4 (Q4)</td>
                    <td className="py-3.5 px-4 text-blue-200">Oktober &mdash; Desember 2026</td>
                    <td className="py-3.5 px-4 text-center font-black text-[#38bdf8]">11 Proyek</td>
                    <td className="py-3.5 px-4 text-center font-black">496 Jam</td>
                    <td className="py-3.5 px-4 text-center font-black text-[#ff9f0a]">42 Jam</td>
                    <td className="py-3.5 px-4 text-center text-[#30d158] font-black">99.4%</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#30d158] text-black">
                        Lolos Sempurna &bull; A+
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>


            </section>

      {/* =====================================================================
          FITUR 03: PRESENSI JAM BERSIH & LEMBUR TERUKUR
         ===================================================================== */}
      <section id="presensi-section" className="relative z-10 py-20 px-4 sm:px-8 lg:px-16 w-full max-w-[1800px] mx-auto">
        <div className="space-y-10 text-left">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-blue-400/25 pb-6">
            <div className="space-y-2.5 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>Fitur Unggulan 03 &bull; Presensi Jam Bersih &amp; Lembur Terukur</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Presensi Jam Bersih, Lembur Bulat &amp; Validasi Biometrik
              </h2>
              <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed font-normal">
                Pencatatan jam kerja bersih memotong waktu istirahat otomatis, perhitungan jam lembur terbulatkan genap tanpa desimal manipulatif, disertai verifikasi foto selfie AI dan geolokasi GPS presisi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40">
                100% Face Match &bull; GPS Radius 15m
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kartu Absensi Hari Ini */}
            <div className="lg:col-span-1 p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-blue-400/20 pb-4">
                <span className="text-base font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#38bdf8]" />
                  Simulasi Absensi Aktif
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40">
                  Hadir Tepat Waktu
                </span>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-blue-400/15">
                  <span className="text-blue-200">Jam Masuk (Clock In):</span>
                  <span className="font-black text-white">08:00 WIB</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-blue-400/15">
                  <span className="text-blue-200">Jam Pulang (Clock Out):</span>
                  <span className="font-black text-white">17:00 WIB</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-blue-400/15">
                  <span className="text-blue-200">Potongan Istirahat:</span>
                  <span className="font-bold text-[#ff9f0a]">-60 Menit (Otomatis)</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-blue-500/15 px-3 rounded-xl border border-blue-400/30">
                  <span className="text-blue-100 font-bold">Total Jam Kerja Bersih:</span>
                  <span className="font-black text-[#30d158] text-lg">8 Jam Efektif</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  className="py-3 px-4 rounded-2xl bg-[#30d158] hover:bg-[#28b84c] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#30d158]/30 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Clock In
                </button>
                <button
                  type="button"
                  className="py-3 px-4 rounded-2xl bg-[#ff375f] hover:bg-[#e0264d] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ff375f]/30 transition-all"
                >
                  <X className="w-4 h-4" />
                  Clock Out
                </button>
              </div>
            </div>

            {/* Kartu Validasi Biometrik & Radius Geofencing */}
            <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-6">
              <span className="text-base font-black text-white flex items-center gap-2 border-b border-blue-400/20 pb-4">
                <Shield className="w-5 h-5 text-[#bf5af2]" />
                Verifikasi Bukti Kehadiran Nyata &amp; Jam Lembur Genap
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] via-[#0a1835]/70 to-[#061126]/80 border border-slate-300/20 border-t-white/30 shadow-lg border border-blue-400/25 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#63e6e2]">
                    <Camera className="w-5 h-5" />
                    <span>Verifikasi Foto Selfie AI</span>
                  </div>
                  <p className="text-xs text-blue-100/80 leading-relaxed font-normal">
                    Pengambilan foto instan saat clock in untuk membuktikan kehadiran fisik aktual tanpa titip presensi. Sistem AI mencocokkan wajah pegawai secara otomatis.
                  </p>
                  <div className="p-2.5 rounded-xl bg-[#30d158]/15 border border-[#30d158]/30 text-xs text-[#30d158] font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Face Match AI 99.4%
                    </span>
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-[#30d158] text-black rounded">Sah</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] via-[#0a1835]/70 to-[#061126]/80 border border-slate-300/20 border-t-white/30 shadow-lg border border-blue-400/25 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#ff9f0a]">
                    <MapPin className="w-5 h-5" />
                    <span>Radius Geofencing GPS</span>
                  </div>
                  <p className="text-xs text-blue-100/80 leading-relaxed font-normal">
                    Mencatat koordinat lintang-bujur dan memastikan presensi dilakukan di area kantor atau lokasi proyek aktif dalam radius toleransi 15 meter.
                  </p>
                  <div className="p-2.5 rounded-xl bg-[#30d158]/15 border border-[#30d158]/30 text-xs text-[#30d158] font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Radius 8.2m Dari Titik Kantor
                    </span>
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-[#30d158] text-black rounded">Lokasi Valid</span>
                  </div>
                </div>
              </div>

              {/* Rincian Lembur Bulat Genap */}
              <div className="p-4 rounded-2xl bg-[#ff9f0a]/15 border border-[#ff9f0a]/30 text-xs text-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="font-medium text-white">
                  <strong>Aturan Akuntabilitas Lembur:</strong> Pembulatan jam bulat genap (contoh: 1 jam 45 menit dihitung 1 jam lembur genap terverifikasi, 2 jam penuh dihitung 2 jam lembur).
                </span>
                <span className="font-black text-[#ff9f0a] px-3 py-1 rounded-full bg-[#ff9f0a]/20 border border-[#ff9f0a]/40 shrink-0">
                  Standar Akuntabel 2026
                </span>
              </div>
            </div>
          </div>
        </div>


            </section>

      {/* =====================================================================
          FITUR 04: BANK IDE & CATATAN RENCANA BERARAH BALIK KALENDER
         ===================================================================== */}
      <section id="bank-ide-section" className="relative z-10 py-20 px-4 sm:px-8 lg:px-16 w-full max-w-[1800px] mx-auto">
        <div className="space-y-10 text-left">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-blue-400/25 pb-6">
            <div className="space-y-2.5 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/40 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Fitur Unggulan 04 &bull; Sirkulasi Ide &amp; Jadwal Balik</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Bank Ide &amp; Catatan Arahan Balik Kalender
              </h2>
              <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed font-normal">
                Menyimpan ide rencana kerja dalam bentuk teks terstruktur, memindahkannya ke jadwal kalender dengan 1-klik, dan menautkan balik ke arahan ide asal saat dilihat detail kegiatannya.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/40">
                1-Click Scheduling &bull; 100% Backlink Terhubung
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daftar Ide Tersimpan */}
            <div className="p-4 sm:p-6 md:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-5">
              <span className="text-base font-black text-white flex items-center gap-2 border-b border-blue-400/20 pb-4">
                <Lightbulb className="w-5 h-5 text-[#ff9f0a]" />
                Daftar Catatan Rencana Tersimpan (Bank Ide)
              </span>

              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] via-[#0a1835]/70 to-[#061126]/80 border border-slate-300/20 border-t-white/30 shadow-lg border border-blue-400/25 space-y-2.5">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="font-bold text-sm sm:text-base text-white">Standardisasi Protokol Keamanan &amp; Single Sign-On (SSO)</h4>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-[#2997ff]/30 text-[#38bdf8] border border-[#2997ff]/40">
                      Siap Dijadwalkan
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/80 leading-relaxed font-normal">
                    Menerapkan autentikasi terpusat berbasis OAuth2 dan enkripsi data end-to-end guna meningkatkan efisiensi dan keamanan akses tim.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-blue-300 font-mono">ID: #IDE-2026-089</span>
                    <button
                      type="button"
                      onClick={() => openAuth(true)}
                      className="px-3.5 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#1a82f7] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#0071e3]/30 transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Jadwalkan ke Kalender
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] via-[#0a1835]/70 to-[#061126]/80 border border-slate-300/20 border-t-white/30 shadow-lg border border-blue-400/25 space-y-2.5">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="font-bold text-sm sm:text-base text-white">Pelatihan Internal: SOP Presensi Mandiri &amp; Lembur</h4>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-[#30d158]/30 text-[#30d158] border border-[#30d158]/40">
                      Terjadwal di Kalender
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/80 leading-relaxed font-normal">
                    Sesi pengenalan geofencing GPS dan foto selfie agar tidak ada selisih perhitungan lembur di audit akhir tahun.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#30d158] font-bold">Terjadwal: 12 Nov 2026</span>
                    <span className="text-[11px] text-[#38bdf8] font-bold">&crarr; Terhubung ke Kalender</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alur Tautan Balik Arahan Asal di Kalender */}
            <div className="p-4 sm:p-6 md:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-5">
              <span className="text-base font-black text-white flex items-center gap-2 border-b border-blue-400/20 pb-4">
                <FolderKanban className="w-5 h-5 text-[#38bdf8]" />
                Alur Tautan Balik Arahan Asal di Kalender
              </span>

              <div className="p-5 rounded-2xl bg-[#0071e3]/15 border border-[#0071e3]/30 space-y-3.5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#38bdf8]">
                  <ArrowRight className="w-4 h-4" />
                  <span>Sirkulasi Rencana ke Eksekusi Terukur</span>
                </div>
                <p className="text-xs text-blue-100/80 leading-relaxed font-normal">
                  Ketika suatu kegiatan di jadwal kalender diklik oleh tim atau pimpinan, panel detail otomatis menampilkan kartu informasi asal:
                </p>
                <div className="p-4 rounded-xl bg-black/60 border border-blue-400/30 space-y-2 text-xs shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-300 font-mono text-[10px]">Tautan Sumber Rencana:</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-[#38bdf8] text-[9px] font-bold">Terverifikasi</span>
                  </div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                    <span>Berasal dari Bank Ide: #IDE-2026-089</span>
                  </div>
                  <p className="text-blue-100/80 text-[11px] italic leading-relaxed">
                    &ldquo;Instruksi Pimpinan: Tinjau kembali arsitektur enkripsi dan integrasi SSO sebelum sesi implementasi kuartal 4.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


            </section>

      {/* =====================================================================
          FITUR 05 & 06: ASISTEN AI JADWALPRO & PUSAT EKSPOR LAPORAN
         ===================================================================== */}
      <section id="ai-section" className="relative z-10 py-20 px-4 sm:px-8 lg:px-16 w-full max-w-[1800px] mx-auto">
        <div className="space-y-10 text-left">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-blue-400/25 pb-6">
            <div className="space-y-2.5 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#bf5af2]/20 text-[#bf5af2] border border-[#bf5af2]/40 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Bot className="w-3.5 h-3.5" />
                <span>Fitur Unggulan 05 &amp; 06 &bull; Asisten AI &amp; Ekspor Eksekutif</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Evaluasi Kinerja Otomatis AI &amp; Pusat Ekspor Laporan
              </h2>
              <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed font-normal">
                Audit kinerja otomatis berbasis kecerdasan buatan Gemini JadwalPro serta fasilitas ekspor dokumen eksekutif multi-format (PDF, Excel XLSX, PPTX).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#bf5af2]/20 text-[#bf5af2] border border-[#bf5af2]/40">
                Gemini Pro 2026 &bull; PDF / XLSX / PPTX
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simulasi Dialog AI Kinerja 1 Tahun */}
            <div className="p-4 sm:p-6 md:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-blue-400/20 pb-4">
                <span className="text-base font-black text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#bf5af2]" />
                  Simulasi Dialog Evaluasi AI Kinerja 1 Tahun
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#bf5af2]/20 text-[#bf5af2] border border-[#bf5af2]/40">
                  Gemini JadwalPro
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[0.08] text-white font-medium text-right ml-4 sm:ml-10">
                  Berapa total jam bersih, lembur, dan tingkat akuntabilitas proyek sepanjang tahun 2026?
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-[#bf5af2]/15 border border-[#bf5af2]/30 text-white mr-4 space-y-2 shadow-sm">
                  <div className="flex items-center gap-1.5 font-black text-[#bf5af2] text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Laporan Evaluasi AI Tahunan 2026:</span>
                  </div>
                  <p className="leading-relaxed text-blue-100 font-normal">
                    Sepanjang tahun 2026, total jam kerja efektif tim mencapai <strong>1,984 jam bersih</strong> (248 hari kerja). Lembur bulat genap tercatat <strong>148 jam</strong> tanpa deviasi waktu liar.
                  </p>
                  <p className="leading-relaxed text-blue-100 font-normal">
                    Sebanyak <strong>38 proyek terselesaikan 100% tepat waktu</strong> dengan beban tertinggi pada proyek PORTAL LAYANAN (142 hari). Tingkat disiplin presensi mencapai <strong>98.8%</strong> dengan nilai akuntabilitas AI: <strong>A+ (Unggul)</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Ekspor Laporan Multi-Format */}
            <div className="p-4 sm:p-6 md:p-7 rounded-3xl bg-gradient-to-b from-white/[0.08] via-[#09152e]/80 to-[#07132c]/90 border border-slate-300/25 border-t-white/40 shadow-2xl shadow-black/80 backdrop-blur-2xl backdrop-blur-2xl space-y-5">
              <span className="text-base font-black text-white flex items-center gap-2 border-b border-blue-400/20 pb-4">
                <FileSpreadsheet className="w-5 h-5 text-[#30d158]" />
                Ekspor Multi-Format Siap Pakai untuk Audit &amp; Direksi
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] via-[#0a1835]/70 to-[#061126]/80 border border-slate-300/20 border-t-white/30 shadow-lg border border-blue-400/25 text-center space-y-2.5 hover:border-blue-400/50 transition-colors">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ff375f]/20 text-[#ff375f] flex items-center justify-center font-black text-base border border-[#ff375f]/30">
                    PDF
                  </div>
                  <h5 className="font-bold text-sm text-white">Laporan Eksekutif</h5>
                  <p className="text-[11px] text-blue-200">Rekap siap cetak untuk pimpinan &amp; HR</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] via-[#0a1835]/70 to-[#061126]/80 border border-slate-300/20 border-t-white/30 shadow-lg border border-blue-400/25 text-center space-y-2.5 hover:border-blue-400/50 transition-colors">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#30d158]/20 text-[#30d158] flex items-center justify-center font-black text-base border border-[#30d158]/30">
                    XLSX
                  </div>
                  <h5 className="font-bold text-sm text-white">Data Mentah Excel</h5>
                  <p className="text-[11px] text-blue-200">Formula audit lembur &amp; hari kerja riil</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] via-[#0a1835]/70 to-[#061126]/80 border border-slate-300/20 border-t-white/30 shadow-lg border border-blue-400/25 text-center space-y-2.5 hover:border-blue-400/50 transition-colors">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ff9f0a]/20 text-[#ff9f0a] flex items-center justify-center font-black text-base border border-[#ff9f0a]/30">
                    PPTX
                  </div>
                  <h5 className="font-bold text-sm text-white">Slide Presentasi</h5>
                  <p className="text-[11px] text-blue-200">Deck presentasi evaluasi tahunan direksi</p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => openAuth(true)}
                  className="w-full py-3.5 rounded-full bg-[#0071e3] hover:bg-[#1a82f7] text-sm font-bold text-white shadow-xl shadow-[#0071e3]/30 transition-all"
                >
                  Unduh Sampel Laporan Tahunan Terpadu (PDF &bull; XLSX &bull; PPTX)
                </button>
              </div>
            </div>
          </div>
        </div>


            </section>

      <footer className="relative z-10 py-12 px-4 sm:px-8 lg:px-12 border-t border-blue-400/20 bg-[#040e28]/90 backdrop-blur-xl">
        <div className="w-full max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/60">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-[#0071e3] flex items-center justify-center text-white">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-white">JadwalPro &bull; Workspace Kinerja Terpadu 2026</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#kalender-section" className="hover:text-white transition-colors">Kalender Proyek</a>
            <a href="#grafik-section" className="hover:text-white transition-colors">4 Grafik Analitik</a>
            <a href="#presensi-section" className="hover:text-white transition-colors">Presensi</a>
            <a href="#bank-ide-section" className="hover:text-white transition-colors">Bank Ide</a>
            <a href="#ai-section" className="hover:text-white transition-colors">Asisten AI</a>
          </div>

          <div>
            &copy; {new Date().getFullYear()} JadwalPro. Dilindungi Hak Cipta.
          </div>
        </div>
      </footer>

      {/* =========================================================================
          5. MODAL AUTENTIKASI: MASUK / DAFTAR BARU (MINIMALIST GLASS DESIGN)
         ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#040e28]/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b2256] rounded-3xl border border-white/[0.12] shadow-2xl p-6 sm:p-8 space-y-6 relative text-left">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 text-center pt-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#2997ff] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#0071e3]/30">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {isSignUp ? 'Daftar Akun Baru' : 'Masuk ke JadwalPro'}
              </h3>
              <p className="text-xs text-white/60">
                {isSignUp
                  ? 'Mulai pantau efisiensi proyek & presensi lembur berbasis data konkret'
                  : 'Akses workspace kinerja dan evaluasi proyek Anda'}
              </p>
            </div>

            {/* Switcher Masuk / Daftar Baru */}
            <div className="p-1 rounded-full bg-white/[0.05] border border-blue-400/20 flex text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-full transition-all ${
                  !isSignUp
                    ? 'bg-[#0071e3] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
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
                className={`flex-1 py-2 rounded-full transition-all ${
                  isSignUp
                    ? 'bg-[#0071e3] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Daftar Baru
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-[#ff375f]/15 border border-[#ff375f]/30 text-[#ff375f] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60">Nama Lengkap</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] border border-blue-400/20 text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60">Nomor WhatsApp / HP</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] border border-blue-400/20 text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60">Alamat Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] border border-blue-400/20 text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/[0.05] border border-blue-400/20 text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-white hover:bg-slate-200 text-black font-semibold text-sm shadow-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <span>{isSignUp ? 'Daftar Sekarang' : 'Masuk Sekarang'}</span>
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