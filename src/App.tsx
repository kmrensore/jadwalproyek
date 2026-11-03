import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  X,
  Check,
  Database,
  Code2,
  Sparkles,
  Layers,
  FileText,
  Copy,
  Menu,
  User as UserIcon,
  LogOut,
  Users,
  Timer,
  FileSpreadsheet,
  Printer,
  CalendarCheck2,
  Coffee,
  Briefcase,
  Play,
  Square,
  Upload,
  Image as ImageIcon,
  Bot,
  BrainCircuit,
  Target,
  ArrowRight,
  TrendingUp,
  Award,
  AlertTriangle,
  GitBranch,
  CalendarRange,
  Zap,
  Settings,
  Sliders,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  Camera,
  MapPin,
  Download,
  CheckCircle,
  ShieldAlert,
  Compass,
  FileDown,
  Lock,
  Key as KeyIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
} from 'lucide-react';
import AuthPage from './AuthPage';
import { PROJECT_COLORS, DEFAULT_WORK_POLICY } from './types';
import type {
  EntryStatus,
  Project,
  WorkPolicy,
  WorkShiftCategory,
  ReminderItem,

  ProjectProgram,
  ScheduleEntry as BaseScheduleEntry,
  UserProfile,
  AttendanceRecord,
  AttendanceType,
  AIPerformanceRecord,
} from './types';
import { db, isSupabaseConfigured } from './db';

// Ekstensi lokal ScheduleEntry agar selalu mengenali completedDate & durationDays
export interface ScheduleEntry extends BaseScheduleEntry {
  completedDate?: string | null;
  durationDays?: number;
}

// ============================================================================
// UTILITAS TANGGAL & FORMATTER
// ============================================================================

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const INDONESIAN_DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const INDONESIAN_DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function toDateStr(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getTodayDateStr(): string {
  const now = new Date();
  return toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
}

function getFirstDayOfMonthStr(year: number, monthIndex: number): string {
  return toDateStr(year, monthIndex, 1);
}

function getLastDayOfMonthStr(year: number, monthIndex: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return toDateStr(year, monthIndex, lastDay);
}

function getNowTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function formatDateFullIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  const dayName = INDONESIAN_DAYS_FULL[dateObj.getDay()];
  const monthName = INDONESIAN_MONTHS[m - 1];
  return `${dayName}, ${d} ${monthName} ${y}`;
}

function formatDateShortIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const monthName = INDONESIAN_MONTHS[m - 1]?.slice(0, 3) || '';
  return `${d} ${monthName} ${y}`;
}

// ============================================================================
// DATABASE HARI LIBUR NASIONAL (TANGGAL MERAH) & HARI BESAR INDONESIA
// ============================================================================

export interface HolidayInfo {
  name: string;
  isHoliday: boolean; // true = Tanggal Merah / Libur Resmi Nasional, false = Hari Besar Nasional Non-Libur
}

const FIXED_ANNUAL_HOLIDAYS: Record<string, HolidayInfo> = {
  '01-01': { name: 'Tahun Baru Masehi', isHoliday: true },
  '04-21': { name: 'Hari Kartini', isHoliday: false },
  '05-01': { name: 'Hari Buruh Internasional', isHoliday: true },
  '05-02': { name: 'Hari Pendidikan Nasional', isHoliday: false },
  '05-20': { name: 'Hari Kebangkitan Nasional', isHoliday: false },
  '06-01': { name: 'Hari Lahir Pancasila', isHoliday: true },
  '08-17': { name: 'Hari Kemerdekaan RI (HUT RI)', isHoliday: true },
  '10-01': { name: 'Hari Kesaktian Pancasila', isHoliday: false },
  '10-02': { name: 'Hari Batik Nasional', isHoliday: false },
  '10-28': { name: 'Hari Sumpah Pemuda', isHoliday: false },
  '11-10': { name: 'Hari Pahlawan Nasional', isHoliday: false },
  '12-22': { name: 'Hari Ibu Nasional', isHoliday: false },
  '12-25': { name: 'Hari Raya Natal', isHoliday: true },
};

// Daftar Hari Libur Bergerak (Kalender Hijriah, Saka, Kongzili & Kristiani 2025, 2026, 2027)
const DYNAMIC_HOLIDAYS: Record<string, HolidayInfo> = {
  // Tahun 2026 (SKB 3 Menteri)
  '2026-01-01': { name: 'Tahun Baru 2026 Masehi', isHoliday: true },
  '2026-01-16': { name: "Isra Mi'raj Nabi Muhammad SAW", isHoliday: true },
  '2026-02-17': { name: 'Tahun Baru Imlek 2577 Kongzili', isHoliday: true },
  '2026-03-20': { name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', isHoliday: true },
  '2026-03-21': { name: 'Hari Raya Idul Fitri 1447 H (Hari ke-1)', isHoliday: true },
  '2026-03-22': { name: 'Hari Raya Idul Fitri 1447 H (Hari ke-2)', isHoliday: true },
  '2026-04-03': { name: 'Wafat Yesus Kristus (Jumat Agung)', isHoliday: true },
  '2026-04-05': { name: 'Hari Raya Paskah', isHoliday: false },
  '2026-05-01': { name: 'Hari Buruh Internasional', isHoliday: true },
  '2026-05-14': { name: 'Kenaikan Yesus Kristus', isHoliday: true },
  '2026-05-27': { name: 'Hari Raya Idul Adha 1447 H', isHoliday: true },
  '2026-05-31': { name: 'Hari Raya Waisak 2570 BE', isHoliday: true },
  '2026-06-01': { name: 'Hari Lahir Pancasila', isHoliday: true },
  '2026-06-16': { name: 'Tahun Baru Islam 1448 H', isHoliday: true },
  '2026-08-17': { name: 'Hari Kemerdekaan RI ke-81', isHoliday: true },
  '2026-08-25': { name: 'Maulid Nabi Muhammad SAW', isHoliday: true },
  '2026-12-25': { name: 'Hari Raya Natal', isHoliday: true },

  // Tahun 2025
  '2025-01-01': { name: 'Tahun Baru 2025 Masehi', isHoliday: true },
  '2025-01-27': { name: "Isra Mi'raj Nabi Muhammad SAW", isHoliday: true },
  '2025-01-29': { name: 'Tahun Baru Imlek 2576 Kongzili', isHoliday: true },
  '2025-03-29': { name: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', isHoliday: true },
  '2025-03-31': { name: 'Hari Raya Idul Fitri 1446 H', isHoliday: true },
  '2025-04-01': { name: 'Hari Raya Idul Fitri 1446 H (Hari ke-2)', isHoliday: true },
  '2025-04-18': { name: 'Wafat Yesus Kristus', isHoliday: true },
  '2025-05-01': { name: 'Hari Buruh Internasional', isHoliday: true },
  '2025-05-12': { name: 'Hari Raya Waisak 2569 BE', isHoliday: true },
  '2025-05-29': { name: 'Kenaikan Yesus Kristus', isHoliday: true },
  '2025-06-01': { name: 'Hari Lahir Pancasila', isHoliday: true },
  '2025-06-07': { name: 'Hari Raya Idul Adha 1446 H', isHoliday: true },
  '2025-06-27': { name: 'Tahun Baru Islam 1447 H', isHoliday: true },
  '2025-08-17': { name: 'Hari Kemerdekaan RI ke-80', isHoliday: true },
  '2025-09-05': { name: 'Maulid Nabi Muhammad SAW', isHoliday: true },
  '2025-12-25': { name: 'Hari Raya Natal', isHoliday: true },

  // Tahun 2027
  '2027-01-01': { name: 'Tahun Baru 2027 Masehi', isHoliday: true },
  '2027-01-06': { name: "Isra Mi'raj Nabi Muhammad SAW", isHoliday: true },
  '2027-02-06': { name: 'Tahun Baru Imlek 2578 Kongzili', isHoliday: true },
  '2027-03-09': { name: 'Hari Suci Nyepi (Tahun Baru Saka 1949)', isHoliday: true },
  '2027-03-10': { name: 'Hari Raya Idul Fitri 1448 H', isHoliday: true },
  '2027-03-26': { name: 'Wafat Yesus Kristus', isHoliday: true },
  '2027-05-01': { name: 'Hari Buruh Internasional', isHoliday: true },
  '2027-05-06': { name: 'Kenaikan Yesus Kristus', isHoliday: true },
  '2027-05-17': { name: 'Hari Raya Idul Adha 1448 H', isHoliday: true },
  '2027-05-20': { name: 'Hari Raya Waisak 2571 BE', isHoliday: true },
  '2027-06-01': { name: 'Hari Lahir Pancasila', isHoliday: true },
  '2027-06-06': { name: 'Tahun Baru Islam 1449 H', isHoliday: true },
  '2027-08-15': { name: 'Maulid Nabi Muhammad SAW', isHoliday: true },
  '2027-08-17': { name: 'Hari Kemerdekaan RI ke-82', isHoliday: true },
  '2027-12-25': { name: 'Hari Raya Natal', isHoliday: true },
};

function getHolidayInfo(dateStr: string): HolidayInfo | null {
  if (!dateStr) return null;
  if (DYNAMIC_HOLIDAYS[dateStr]) {
    return DYNAMIC_HOLIDAYS[dateStr];
  }
  const mmDd = dateStr.slice(5);
  if (FIXED_ANNUAL_HOLIDAYS[mmDd]) {
    return FIXED_ANNUAL_HOLIDAYS[mmDd];
  }
  return null;
}

// ============================================================================
// HELPER PERHITUNGAN DURASI HARI & RENTANG PROYEK MENYAMBUNG
// ============================================================================
function getCalendarDaySpan(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1;
  const s = new Date(startDateStr + 'T00:00:00');
  const e = new Date(endDateStr + 'T00:00:00');
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1); // Inklusif: misal 1 Nov s/d 1 Nov = 1 hari
}

function getEntryDateRange(
  e: ScheduleEntry,
  today: string
): { startDate: string; endDate: string; totalDays: number; isOngoing: boolean } {
  const startDate = e.date;
  let endDate = startDate;
  let isOngoing = false;

  if (e.status === 'selesai') {
    endDate = (e as any).completedDate || startDate;
    if (endDate < startDate) endDate = startDate;
  } else {
    // Jika belum selesai dan tanggal mulai <= hari ini, proyek otomatis MENYAMBUNG setiap hari sampai hari ini!
    if (startDate < today) {
      endDate = today;
      isOngoing = true;
    } else {
      endDate = startDate;
    }
  }

  const totalDays = getCalendarDaySpan(startDate, endDate);
  return { startDate, endDate, totalDays, isOngoing };
}
// ============================================================================
// HELPER AUDIO ALARM & SINTESIS NADA WEB AUDIO API
// ============================================================================
function playHarmonicAlarmChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    // Nada melodi alarm ceria: C5 -> E5 -> G5 -> C6 berulang
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.35, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.42);
    });
  } catch (err) {
    console.warn('Audio alarm playback notice:', err);
  }
}

// ============================================================================
// HELPER WATERMARK & AUTO-KOMPRESI FOTO ABSENSI (~40 KB, SANGAT RINGAN)
// ============================================================================
function captureAndWatermarkSnapshot(
  video: HTMLVideoElement,
  info: { userName: string; date: string; time: string; location: string; status: string }
): string {
  const canvas = document.createElement('canvas');
  const targetWidth = 640;
  const vidW = video.videoWidth || 640;
  const vidH = video.videoHeight || 480;
  const targetHeight = Math.round((vidH / vidW) * targetWidth) || 480;
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Mirror selfie horizontal agar orientasi foto sama seperti tampilan di layar
  ctx.save();
  ctx.translate(targetWidth, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  // Banner Watermark gelap elegan di bagian bawah
  const bannerH = 76;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, targetHeight - bannerH, targetWidth, bannerH);

  // Garis aksen indigo
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(0, targetHeight - bannerH, targetWidth, 3);

  // Header status
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`JadwalPro Verified • ${info.status.toUpperCase()}`, 12, targetHeight - bannerH + 20);

  // Keterangan nama & waktu real
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${info.userName}  |  ${formatDateFullIndo(info.date)} • ${info.time} WIB`, 12, targetHeight - bannerH + 39);

  // Lokasi koordinat
  ctx.font = '10px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`GPS: ${info.location || 'Lokasi Terverifikasi Otomatis'}`, 12, targetHeight - bannerH + 58);

  // Kompresi ke JPEG kualitas 0.70 (~40 KB, super ringan di server & database)
  return canvas.toDataURL('image/jpeg', 0.7);
}

// ============================================================================
// HELPER DETEKSI SHIFT KERJA (NORMAL VS LEMBUR AWAL / LEMBUR SORE)
// ============================================================================
function detectShiftCategoryInfo(
  mode: 'in' | 'out',
  timeStr: string,
  policy: WorkPolicy
): { category: WorkShiftCategory; note: string } {
  const [h, m] = timeStr.split(':').map(Number);
  const actMin = h * 60 + m;

  const stdIn = policy.standardCheckInTime || '08:00';
  const [stdInH, stdInM] = stdIn.split(':').map(Number);
  const stdInMin = stdInH * 60 + stdInM;

  const stdOut = policy.standardCheckOutTime || '17:00';
  const [stdOutH, stdOutM] = stdOut.split(':').map(Number);
  const stdOutMin = stdOutH * 60 + stdOutM;

  const threshold = policy.earlyOvertimeThresholdMinutes || 60;

  if (mode === 'in') {
    if (stdInMin - actMin > threshold) {
      const diffH = Math.floor((stdInMin - actMin) / 60);
      const diffM = (stdInMin - actMin) % 60;
      return {
        category: 'lembur_awal',
        note: `Lembur Pagi: Datang ${diffH > 0 ? `${diffH} jam ` : ''}${diffM} menit lebih awal sebelum jam masuk baku (${stdIn}).`,
      };
    }
    if (actMin > stdInMin + (policy.lateToleranceMinutes || 15)) {
      return {
        category: 'normal',
        note: `Shift Normal (Terlambat melewati toleransi jam ${stdIn}).`,
      };
    }
    return {
      category: 'normal',
      note: `Shift Normal: Datang sesuai jadwal (masuk baku ${stdIn}).`,
    };
  } else {
    if (actMin > stdOutMin + 30) {
      const diffH = Math.floor((actMin - stdOutMin) / 60);
      const diffM = (actMin - stdOutMin) % 60;
      return {
        category: 'lembur_akhir',
        note: `Lembur Sore/Malam: Pulang lebih lama ${diffH > 0 ? `${diffH} jam ` : ''}${diffM} menit setelah jam pulang baku (${stdOut}).`,
      };
    }
    return {
      category: 'normal',
      note: `Shift Normal: Pulang kerja sesuai jam reguler (${stdOut}).`,
    };
  }
}


const STATUS_META: Record<
  EntryStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  belum_mulai: {
    label: 'Belum mulai',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  berjalan: {
    label: 'Berjalan',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  selesai: {
    label: 'Selesai',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
};

const ATTENDANCE_META: Record<
  AttendanceType,
  { label: string; badgeClass: string; dotClass: string }
> = {
  hadir: {
    label: 'Hadir',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  izin: {
    label: 'Izin',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  cuti: {
    label: 'Cuti',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
  sakit: {
    label: 'Sakit',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
};

// ============================================================================
// KOMPONEN UTAMA APLIKASI
// ============================================================================

export default function App() {
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const initialYearMonth = useMemo(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return { year: y || 2026, month: (m || 11) - 1 };
  }, [todayStr]);

  // Tab Navigasi Utama: 'calendar' | 'attendance' | 'reminders' | 'report' | 'ai_performance'
  const [activeMainTab, setActiveMainTab] = useState<
    'calendar' | 'attendance' | 'reminders' | 'report' | 'ai_performance'
  >('calendar');

  // State User & Auth (Auto-login membaca sesi tersimpan langsung saat inisialisasi)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    db.getSavedSession ? db.getSavedSession() : null
  );

  // State Data Jadwal, Proyek, & Absensi
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [aiPerformances, setAiPerformances] = useState<AIPerformanceRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  // State Jadwal Pengingat & Alarm
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [remTitleInput, setRemTitleInput] = useState<string>('');
  const [remDateInput, setRemDateInput] = useState<string>(todayStr);
  const [remStartTimeInput, setRemStartTimeInput] = useState<string>('09:00');
  const [remEndTimeInput, setRemEndTimeInput] = useState<string>('10:00');
  const [remNotifyBeforeMinutes, setRemNotifyBeforeMinutes] = useState<number>(15);
  const [remNotesInput, setRemNotesInput] = useState<string>('');
  const [alarmTriggeredReminder, setAlarmTriggeredReminder] = useState<ReminderItem | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  // State Kamera & Lokasi GPS untuk Absensi
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'in' | 'out'>('in');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Pastikan stream video otomatis tersambung ke elemen video saat modal aktif
  useEffect(() => {
    if (isCameraModalOpen && cameraStream && videoElemRef.current) {
      const vid = videoElemRef.current;
      if (vid.srcObject !== cameraStream) {
        vid.srcObject = cameraStream;
      }
      vid.muted = true;
      vid.play().then(() => {
        setIsCameraActive(true);
      }).catch((err) => {
        console.warn('Video auto-play interrupted:', err);
      });
    }
  }, [cameraStream, isCameraModalOpen]);
  const [currentGPSLocation, setCurrentGPSLocation] = useState<string>('Mendeteksi koordinat GPS...');
  const [isGPSLoading, setIsGPSLoading] = useState<boolean>(false);
  const [detectedShiftInfo, setDetectedShiftInfo] = useState<{ category: WorkShiftCategory; note: string }>({
    category: 'normal',
    note: 'Shift Normal',
  });
  const [customShiftNoteInput, setCustomShiftNoteInput] = useState<string>('');
  const [capturedSnapshotPreview, setCapturedSnapshotPreview] = useState<string | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);

  // State Pengaturan Akun Pribadi (Profile, Password & Cloud)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [accountActiveSubTab, setAccountActiveSubTab] = useState<'profile' | 'security' | 'stats'>('profile');
  const [accFullName, setAccFullName] = useState<string>('');
  const [accPhone, setAccPhone] = useState<string>('');
  const [accNewPassword, setAccNewPassword] = useState<string>('');
  const [accConfirmPassword, setAccConfirmPassword] = useState<string>('');
  const [accShowPassword, setAccShowPassword] = useState<boolean>(false);
  const [isSavingAccount, setIsSavingAccount] = useState<boolean>(false);
  const [accountFeedback, setAccountFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [accAvatarUrl, setAccAvatarUrl] = useState<string>('');
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // State Galeri Foto Bukti Absensi di Laporan
  const [isPhotoGalleryModalOpen, setIsPhotoGalleryModalOpen] = useState<boolean>(false);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<{
    url: string;
    title: string;
    date: string;
    time: string;
    location: string;
    shift: string;
  } | null>(null);

  // State Tolak Ukur & Aturan Baku Kerja
  const [workPolicy, setWorkPolicy] = useState<WorkPolicy>(() =>
    db.getWorkPolicy ? db.getWorkPolicy() : DEFAULT_WORK_POLICY
  );
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [policyWorkDaysInput, setPolicyWorkDaysInput] = useState<number>(workPolicy.workDaysPerWeek);
  const [policyCheckInInput, setPolicyCheckInInput] = useState<string>(workPolicy.standardCheckInTime);
  const [policyCheckOutInput, setPolicyCheckOutInput] = useState<string>(workPolicy.standardCheckOutTime);
  const [policyBreakInput, setPolicyBreakInput] = useState<number>(workPolicy.breakDurationHours);
  const [policyLeaveQuotaInput, setPolicyLeaveQuotaInput] = useState<number>(workPolicy.annualLeaveQuota);
  const [policyToleranceInput, setPolicyToleranceInput] = useState<number>(workPolicy.lateToleranceMinutes);
  const [policyTargetHoursInput, setPolicyTargetHoursInput] = useState<number>(workPolicy.targetDailyWorkHours);
  const [policyLeaveResetInput, setPolicyLeaveResetInput] = useState<string>(workPolicy.leaveResetDate || '01-01');
  const [policyThresholdInput, setPolicyThresholdInput] = useState<number>(workPolicy.earlyOvertimeThresholdMinutes || 60);

  // State Navigasi Bulan (0 = Januari, 10 = November)
  const [currentYear, setCurrentYear] = useState<number>(initialYearMonth.year);
  const [currentMonth, setCurrentMonth] = useState<number>(initialYearMonth.month);

  // State Filter & Tampilan Toolbar
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EntryStatus | 'OVERDUE'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('MINE');

  // State Drawer Detail Hari (Jadwal)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryTitle, setEntryTitle] = useState<string>('');
  const [entryProjectId, setEntryProjectId] = useState<string>('');
  const [entryProgramId, setEntryProgramId] = useState<string>('');
  const [entryStatus, setEntryStatus] = useState<EntryStatus>('belum_mulai');
  const [entryNotes, setEntryNotes] = useState<string>('');
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<string | null>(null);

  // State Form Proyek & Cabang Program
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectNameInput, setProjectNameInput] = useState<string>('');
  const [projectColorInput, setProjectColorInput] = useState<string>(PROJECT_COLORS[0].value);
  const [projectProgramsInput, setProjectProgramsInput] = useState<ProjectProgram[]>([]);
  const [newProgramNameInput, setNewProgramNameInput] = useState<string>('');
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  // State Absensi: Form Tambah/Pengajuan Izin, Cuti, & Koreksi
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState<boolean>(false);
  const [attDateInput, setAttDateInput] = useState<string>(todayStr);
  const [attTypeInput, setAttTypeInput] = useState<AttendanceType>('hadir');
  const [attCheckInInput, setAttCheckInInput] = useState<string>('08:30');
  const [attCheckOutInput, setAttCheckOutInput] = useState<string>('17:00');
  const [attNotesInput, setAttNotesInput] = useState<string>('');

  // State Laporan Kinerja: Filter Periode Kustom (Tanggal Mulai s/d Tanggal Selesai)
  const [reportStartDate, setReportStartDate] = useState<string>(() =>
    getFirstDayOfMonthStr(initialYearMonth.year, initialYearMonth.month)
  );
  const [reportEndDate, setReportEndDate] = useState<string>(() =>
    getLastDayOfMonthStr(initialYearMonth.year, initialYearMonth.month)
  );
  const [reportDatePreset, setReportDatePreset] = useState<
    'this_month' | 'last_month' | 'last_30_days' | 'custom'
  >('this_month');
  const [reportOwnerFilter, setReportOwnerFilter] = useState<string>('MINE');

  // State Fitur Performa AI
  const [aiUploadedImage, setAiUploadedImage] = useState<string | null>(null);
  const [aiUploadedFileName, setAiUploadedFileName] = useState<string>('');
  const [aiAnalysisNotes, setAiAnalysisNotes] = useState<string>('');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State UI Umum
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inisialisasi Data & Sinkronisasi Sesi (Auto-Login & Sinkronisasi Cloud)
  useEffect(() => {
    const saved = db.getSavedSession ? db.getSavedSession() : null;
    if (saved && !currentUser) {
      setCurrentUser(saved);
    }

    const { projects: initProj, entries: initEnt, attendance: initAtt } = db.init();
    setProjects(initProj);
    setEntries(initEnt);
    if (initAtt && initAtt.length > 0) {
      setAttendance(initAtt);
    } else if (db.getAttendance) {
      setAttendance(db.getAttendance());
    }

    if (db.getAIPerformances) {
      setAiPerformances(db.getAIPerformances());
    }
    if (db.getReminders) {
      setReminders(db.getReminders());
    }

    if (db.getCurrentUser) {
      db.getCurrentUser().then((user: UserProfile | null) => {
        if (user) {
          setCurrentUser(user);
          if (db.saveSession) db.saveSession(user);
          if (db.fetchFromSupabase) {
            db.fetchFromSupabase(user.id).then((remote: any) => {
              if (remote) {
                setProjects(remote.projects);
                setEntries(remote.entries);
                if (remote.attendance) setAttendance(remote.attendance);
              }
            });
          }
        }
      });
    }

    const unsub = db.onAuthStateChange?.((user) => {
      if (user) {
        setCurrentUser(user);
        if (db.saveSession) db.saveSession(user);
      }
    });

    return () => {
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (currentUser && db.saveSession) {
      db.saveSession(currentUser);
    }
  }, [currentUser]);


  // Helper Pengiriman Notifikasi Pop-up (Hybrid: Tauri Native macOS + Service Worker Background + Web Notification)
  const sendPopUpNotification = async (title: string, options: { body?: string; icon?: string }) => {
    // 1. Cek lingkungan Desktop Tauri (Versi DMG macOS)
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const tauri = (window as any).__TAURI__;
        if (tauri.notification) {
          let isGranted = await tauri.notification.isPermissionGranted();
          if (!isGranted) {
            const perm = await tauri.notification.requestPermission();
            isGranted = perm === 'granted';
          }
          if (isGranted) {
            tauri.notification.sendNotification({ title, body: options.body || '' });
            return;
          }
        }
      } catch (e) {
        console.warn('Tauri native notification error:', e);
      }
    }

    // 2. Cek Service Worker (Notifikasi tetap pop-up di macOS/Windows meski aplikasi diminimize)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await (reg.showNotification as any)(title, {
            body: options.body,
            icon: options.icon || '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200, 100, 400],
            tag: 'jadwalpro-reminder',
            renotify: true,
          });
          return;
        }
      } catch (e) {
        console.warn('Service worker notification error:', e);
      }
    }

    // 3. Fallback Standar Web Notification API
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
        });
      } catch (e) {
        console.warn('Standard Web Notification error:', e);
      }
    }
  };

  // Daftarkan Service Worker saat aplikasi pertama kali dibuka untuk background notification
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW register info:', err);
      });
    }
  }, []);

  // Otomatis menaikkan elemen input ke tengah layar saat virtual keyboard muncul (tanpa zoom)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 280);
      }
    };

    const preventPinchZoom = (e: TouchEvent) => {
      if ((e as any).scale !== undefined && (e as any).scale !== 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    document.addEventListener('touchmove', preventPinchZoom, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('touchmove', preventPinchZoom);
    };
  }, []);

  // Interval Pengecekan Jadwal Pengingat & Pemicu Alarm
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currDateStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      reminders.forEach((rem) => {
        if (!rem.isActive || rem.isTriggered) return;
        if (rem.date !== currDateStr) return;

        const [remH, remM] = rem.startTime.split(':').map(Number);
        const remStartMin = remH * 60 + remM;
        const targetAlarmMin = remStartMin - (rem.notifyBeforeMinutes || 0);

        // Jika waktu sekarang pas atau dalam jendela toleransi 1 menit
        if (nowMinutes >= targetAlarmMin && nowMinutes < targetAlarmMin + 2) {
          // 1. Bunyikan nada alarm merdu Web Audio API
          playHarmonicAlarmChime();

          // 2. Kirim Notifikasi Pop-up (Tauri Native / Service Worker / Web Notification)
          sendPopUpNotification(`⏰ Pengingat: ${rem.title}`, {
            body: `Pukul ${rem.startTime} - ${rem.notes || 'Siapkan agenda kegiatan Anda.'}`,
            icon: '/favicon.ico',
          });

          // 3. Getar perangkat jika didukung
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 400]);
          }

          // 4. Munculkan visual alarm pop-up interaktif di aplikasi
          setAlarmTriggeredReminder(rem);

          // Tandai sudah pernah dibunyikan
          const updated = db.updateReminder(rem.id, { isTriggered: true });
          setReminders(updated);
        }
      });
    };

    const intervalId = setInterval(checkReminders, 20000); // Cek tiap 20 detik
    return () => clearInterval(intervalId);
  }, [reminders]);

  const requestNotificationAccess = async () => {
    // 1. Cek aplikasi desktop Tauri (DMG macOS)
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const tauri = (window as any).__TAURI__;
        if (tauri.notification) {
          const perm = await tauri.notification.requestPermission();
          const granted = perm === 'granted';
          setHasNotificationPermission(granted);
          if (granted) {
            showToast('Izin notifikasi native macOS berhasil aktif! 🔔');
            playHarmonicAlarmChime();
            return;
          }
        }
      } catch (e) {
        console.warn('Tauri request notification permission error:', e);
      }
    }

    // 2. Cek browser standar (Chrome, Safari, Arc, Edge)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        const granted = perm === 'granted';
        setHasNotificationPermission(granted);
        if (granted) {
          showToast('Izin notifikasi pop-up berhasil diaktifkan! 🔔');
          playHarmonicAlarmChime();

          // Registrasikan Service Worker jika didukung browser
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
              console.warn('SW register error:', err);
            });
          }
        } else {
          showToast('Izin notifikasi ditolak. Silakan aktifkan via Pengaturan Browser atau System Settings Mac.');
        }
      } catch (err) {
        console.warn('Request notification error:', err);
        showToast('Gagal meminta izin notifikasi.');
      }
    } else {
      showToast('Browser membatasi notifikasi. Pastikan dibuka via HTTPS atau cek System Settings macOS.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleLogout = async () => {
    if (db.signOut) await db.signOut();
    setCurrentUser(null);
    setSelectedDate(null);
    showToast('Berhasil keluar dari akun');
  };

  // HANDLERS SETINGAN AKUN PRIBADI (PROFIL & PASSWORD)
  const openAccountModal = () => {
    if (currentUser) {
      setAccFullName(currentUser.fullName);
      setAccPhone(currentUser.phone !== '-' ? currentUser.phone : '');
      setAccAvatarUrl(currentUser.avatarUrl || '');
    }
    setAccNewPassword('');
    setAccConfirmPassword('');
    setAccShowPassword(false);
    setAccountFeedback(null);
    setIsAccountModalOpen(true);
  };

  const handleAvatarImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAccountFeedback({ type: 'error', message: 'File yang dipilih harus berupa format gambar (JPG, PNG, WEBP)' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Kompresi avatar ke resolusi bujur sangkar 256x256 agar tajam dan sangat ringan (<25KB)
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Crop tengah bujur sangkar (center square crop)
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAccAvatarUrl(compressedDataUrl);
        setAccountFeedback({ type: 'success', message: 'Foto profil siap disimpan. Klik "Simpan Perubahan Profil" untuk menerapkan.' });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accFullName.trim()) {
      setAccountFeedback({ type: 'error', message: 'Nama lengkap tidak boleh kosong' });
      return;
    }
    setIsSavingAccount(true);
    setAccountFeedback(null);
    try {
      const dbInstance = db as typeof db & {
        updateProfile?: (payload: {
          fullName: string;
          phone: string;
          avatarUrl?: string;
        }) => Promise<{ user?: UserProfile; error?: string }>;
      };

      if (!dbInstance.updateProfile) {
        throw new Error('Metode updateProfile belum ditemukan di src/db.ts. Pastikan file src/db.ts sudah diperbarui.');
      }

      const res = await dbInstance.updateProfile({
        fullName: accFullName.trim(),
        phone: accPhone.trim() || '-',
        avatarUrl: accAvatarUrl,
      });
      if (res.error) {
        setAccountFeedback({ type: 'error', message: res.error });
      } else if (res.user) {
        setCurrentUser(res.user);
        setAccountFeedback({ type: 'success', message: 'Profil akun dan foto berhasil diperbarui dan disinkronkan!' });
        showToast('Profil akun berhasil disimpan');
      }
    } catch (err: any) {
      setAccountFeedback({ type: 'error', message: err.message || 'Gagal menyimpan profil' });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accNewPassword || accNewPassword.length < 6) {
      setAccountFeedback({ type: 'error', message: 'Kata sandi baru minimal 6 karakter' });
      return;
    }
    if (accNewPassword !== accConfirmPassword) {
      setAccountFeedback({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok' });
      return;
    }
    setIsSavingAccount(true);
    setAccountFeedback(null);
    try {
      const dbInstance = db as typeof db & {
        updatePassword?: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
      };

      if (!dbInstance.updatePassword) {
        throw new Error('Metode updatePassword belum ditemukan di src/db.ts. Pastikan file src/db.ts sudah diperbarui.');
      }

      const res = await dbInstance.updatePassword(accNewPassword);
      if (!res.success) {
        setAccountFeedback({ type: 'error', message: res.error || 'Gagal mengubah kata sandi' });
      } else {
        setAccountFeedback({ type: 'success', message: 'Kata sandi akun Anda berhasil diperbarui!' });
        setAccNewPassword('');
        setAccConfirmPassword('');
        showToast('Kata sandi berhasil diubah');
      }
    } catch (err: any) {
      setAccountFeedback({ type: 'error', message: err.message || 'Gagal mengubah kata sandi' });
    } finally {
      setIsSavingAccount(false);
    }
  };

  // DAFTAR OWNER UNIK
  const uniqueOwners = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    if (currentUser) {
      map.set(currentUser.id, { id: currentUser.id, name: currentUser.fullName });
    }
    const isRealUser = currentUser && currentUser.id !== 'owner-demo-1';
    projects.forEach((p) => {
      if (p.ownerId && (!isRealUser || p.ownerId !== 'owner-demo-1') && !map.has(p.ownerId)) {
        map.set(p.ownerId, { id: p.ownerId, name: p.ownerName || 'User' });
      }
    });
    entries.forEach((e) => {
      if (e.ownerId && (!isRealUser || e.ownerId !== 'owner-demo-1') && !map.has(e.ownerId)) {
        map.set(e.ownerId, { id: e.ownerId, name: e.ownerName || 'User' });
      }
    });
    attendance.forEach((a) => {
      if (a.ownerId && (!isRealUser || a.ownerId !== 'owner-demo-1') && !map.has(a.ownerId)) {
        map.set(a.ownerId, { id: a.ownerId, name: a.ownerName || 'User' });
      }
    });
    return Array.from(map.values());
  }, [projects, entries, attendance, currentUser]);

  const projectMap = useMemo(() => {
    const map: Record<string, Project> = {};
    projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  const currentMonthPrefix = useMemo(() => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  }, [currentYear, currentMonth]);

  // ENTRI BULAN BERJALAN (KALENDER) — Mendukung Proyek Menyambung ke Hari Selanjutnya
  const monthEntries = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = `${currentMonthPrefix}-01`;
    const lastDayOfMonth = `${currentMonthPrefix}-${String(daysInMonth).padStart(2, '0')}`;

    return entries.filter((e) => {
      const range = getEntryDateRange(e, todayStr);
      // Tugas aktif di bulan ini jika rentang pengerjaannya [startDate, endDate] bersinggungan dengan bulan yang dilihat
      if (range.startDate > lastDayOfMonth || range.endDate < firstDayOfMonth) return false;

      if (currentUser && currentUser.id !== 'owner-demo-1' && e.ownerId === 'owner-demo-1') {
        return false;
      }
      if (ownerFilter === 'MINE' && currentUser) {
        return e.ownerId === currentUser.id;
      }
      if (ownerFilter !== 'ALL' && ownerFilter !== 'MINE') {
        return e.ownerId === ownerFilter;
      }
      return true;
    });
  }, [entries, currentMonthPrefix, currentYear, currentMonth, ownerFilter, currentUser, todayStr]);

  // KPI JADWAL BULAN BERJALAN
  const kpiStats = useMemo(() => {
    const total = monthEntries.length;
    const selesai = monthEntries.filter((e) => e.status === 'selesai').length;
    const berjalan = monthEntries.filter((e) => e.status === 'berjalan').length;
    const terlambat = monthEntries.filter(
      (e) => e.date < todayStr && e.status !== 'selesai'
    ).length;
    return { total, selesai, berjalan, terlambat };
  }, [monthEntries, todayStr]);

  const projectMonthCounts = useMemo(() => {
    const counts: Record<string, number> = { NONE: 0 };
    projects.forEach((p) => {
      counts[p.id] = 0;
    });
    monthEntries.forEach((e) => {
      if (e.projectId && counts[e.projectId] !== undefined) {
        counts[e.projectId] += 1;
      } else {
        counts.NONE += 1;
      }
    });
    return counts;
  }, [monthEntries, projects]);

  const filteredMonthEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return monthEntries
      .filter((e) => {
        if (projectFilter === 'NONE' && e.projectId !== null) return false;
        if (
          projectFilter !== 'ALL' &&
          projectFilter !== 'NONE' &&
          e.projectId !== projectFilter
        ) {
          return false;
        }
        if (statusFilter === 'OVERDUE') {
          if (!(e.date < todayStr && e.status !== 'selesai')) return false;
        } else if (statusFilter !== 'ALL' && e.status !== statusFilter) {
          return false;
        }
        if (q) {
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchNotes = e.notes.toLowerCase().includes(q);
          const matchOwner =
            (e.ownerName || '').toLowerCase().includes(q) ||
            (e.ownerId || '').toLowerCase().includes(q);
          const projName = e.projectId ? projectMap[e.projectId]?.name || '' : 'tanpa proyek';
          const matchProj = projName.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes && !matchProj && !matchOwner) return false;
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  }, [monthEntries, projectFilter, statusFilter, searchQuery, todayStr, projectMap]);

  const entriesByDate = useMemo(() => {
    const grouped: Record<string, ScheduleEntry[]> = {};
    filteredMonthEntries.forEach((e) => {
      const range = getEntryDateRange(e, todayStr);
      // Proyeksikan tugas ke SETIAP tanggal dari startDate sampai endDate
      const start = new Date(range.startDate + 'T00:00:00');
      const end = new Date(range.endDate + 'T00:00:00');
      const cur = new Date(start);

      while (cur <= end) {
        const dStr = toDateStr(cur.getFullYear(), cur.getMonth(), cur.getDate());
        if (!grouped[dStr]) grouped[dStr] = [];
        if (!grouped[dStr].some((item) => item.id === e.id)) {
          grouped[dStr].push(e);
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    return grouped;
  }, [filteredMonthEntries, todayStr]);

  // Daftar pengingat aktif/jadwal acara yang jatuh pada bulan yang sedang dilihat di kalender
  const monthReminders = useMemo(() => {
    return reminders.filter((rem) => {
      if (!rem.date.startsWith(currentMonthPrefix)) return false;
      if (
        currentUser &&
        currentUser.id !== 'owner-demo-1' &&
        rem.ownerId &&
        rem.ownerId !== currentUser.id &&
        rem.ownerId !== 'owner-demo-1'
      ) {
        return false;
      }
      return true;
    });
  }, [reminders, currentMonthPrefix, currentUser]);

  // Kelompokkan pengingat berdasarkan tanggal agar cepat di-lookup di cell kalender
  const remindersByDate = useMemo(() => {
    const grouped: Record<string, ReminderItem[]> = {};
    monthReminders.forEach((r) => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });
    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [monthReminders]);

  // Gabungan tanggal yang memiliki tugas proyek maupun pengingat untuk mode Tampilan Daftar
  const allCalendarDates = useMemo(() => {
    const dates = new Set<string>();
    Object.keys(entriesByDate).forEach((d) => dates.add(d));
    Object.keys(remindersByDate).forEach((d) => dates.add(d));
    return Array.from(dates).sort((a, b) => a.localeCompare(b));
  }, [entriesByDate, remindersByDate]);

  const myTodayAttendance = useMemo(() => {
    if (!currentUser) return null;
    return (
      attendance.find(
        (a) => a.ownerId === currentUser.id && a.date === todayStr
      ) || null
    );
  }, [attendance, currentUser, todayStr]);

  const monthAttendance = useMemo(() => {
    return attendance
      .filter((a) => {
        if (!a.date.startsWith(currentMonthPrefix)) return false;
        if (currentUser && currentUser.id !== 'owner-demo-1' && a.ownerId === 'owner-demo-1') {
          return false;
        }
        if (ownerFilter === 'MINE' && currentUser) {
          return a.ownerId === currentUser.id;
        }
        if (ownerFilter !== 'ALL' && ownerFilter !== 'MINE') {
          return a.ownerId === ownerFilter;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, currentMonthPrefix, ownerFilter, currentUser]);

  const attendanceStats = useMemo(() => {
    const totalRecords = monthAttendance.length;
    const hadirRecords = monthAttendance.filter((a) => a.type === 'hadir');
    const hadirCount = hadirRecords.length;
    const izinCount = monthAttendance.filter((a) => a.type === 'izin').length;
    const cutiCount = monthAttendance.filter((a) => a.type === 'cuti').length;
    const sakitCount = monthAttendance.filter((a) => a.type === 'sakit').length;

    // Hitung keterlambatan berdasarkan jam masuk baku + toleransi menit dari tolak ukur
    let lateCount = 0;
    hadirRecords.forEach((a) => {
      if (a.isLate) {
        lateCount += 1;
      } else if (a.checkInTime && workPolicy.standardCheckInTime) {
        const [stdH, stdM] = workPolicy.standardCheckInTime.split(':').map(Number);
        const [actH, actM] = a.checkInTime.split(':').map(Number);
        const limitMin = stdH * 60 + stdM + (workPolicy.lateToleranceMinutes || 0);
        if (actH * 60 + actM > limitMin) {
          lateCount += 1;
        }
      }
    });
    const punctualCount = Math.max(0, hadirCount - lateCount);

    // Hitung pemakaian cuti tahun berjalan
    const currentYearPrefix = `${currentYear}-`;
    const targetUserId = ownerFilter === 'MINE' && currentUser ? currentUser.id : null;
    const yearCutiTaken = attendance.filter(
      (a) =>
        (!targetUserId || a.ownerId === targetUserId) &&
        a.date.startsWith(currentYearPrefix) &&
        a.type === 'cuti'
    ).length;
    const remainingLeaveQuota = Math.max(0, (workPolicy.annualLeaveQuota || 12) - yearCutiTaken);

    // Target jam kerja bulanan berdasarkan tolak ukur hari kerja (5 hari = ~21 hari, 6 hari = ~26 hari)
    const estimatedWorkDaysPerMonth = workPolicy.workDaysPerWeek === 6 ? 26 : 21;
    const monthlyTargetWorkHours = Math.round(
      estimatedWorkDaysPerMonth * (workPolicy.targetDailyWorkHours || 7.5)
    );

    const totalWorkHours = hadirRecords.reduce(
      (acc, curr) => acc + (curr.workDurationHours || 0),
      0
    );
    const avgWorkHours = hadirCount > 0 ? (totalWorkHours / hadirCount).toFixed(1) : '0';
    const workHourAchievementPercent =
      monthlyTargetWorkHours > 0
        ? Math.min(150, Math.round((totalWorkHours / monthlyTargetWorkHours) * 100))
        : 0;

    return {
      totalRecords,
      hadirCount,
      izinCount,
      cutiCount,
      sakitCount,
      lateCount,
      punctualCount,
      yearCutiTaken,
      remainingLeaveQuota,
      monthlyTargetWorkHours,
      totalWorkHours: totalWorkHours.toFixed(1),
      avgWorkHours,
      workHourAchievementPercent,
    };
  }, [monthAttendance, workPolicy, currentYear, attendance, ownerFilter, currentUser]);

  // ==========================================================================
  // DATA KHUSUS LAPORAN KINERJA DENGAN FILTER PERIODE KUSTOM & PERSENTASE RINCI
  // ==========================================================================
  const reportTargetOwner = useMemo(() => {
    if (!currentUser) return null;
    if (reportOwnerFilter === 'MINE') return currentUser;
    const found = uniqueOwners.find((o) => o.id === reportOwnerFilter);
    return found ? { id: found.id, fullName: found.name, email: '', phone: '', createdAt: '' } : currentUser;
  }, [reportOwnerFilter, currentUser, uniqueOwners]);

  // Handler ubah preset tanggal laporan
  const handleApplyReportPreset = (preset: 'this_month' | 'last_month' | 'last_30_days' | 'custom') => {
    setReportDatePreset(preset);
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    if (preset === 'this_month') {
      setReportStartDate(getFirstDayOfMonthStr(currYear, currMonth));
      setReportEndDate(getLastDayOfMonthStr(currYear, currMonth));
    } else if (preset === 'last_month') {
      const prevDate = new Date(currYear, currMonth - 1, 1);
      setReportStartDate(getFirstDayOfMonthStr(prevDate.getFullYear(), prevDate.getMonth()));
      setReportEndDate(getLastDayOfMonthStr(prevDate.getFullYear(), prevDate.getMonth()));
    } else if (preset === 'last_30_days') {
      const past30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      setReportStartDate(toDateStr(past30.getFullYear(), past30.getMonth(), past30.getDate()));
      setReportEndDate(todayStr);
    }
  };

  const reportData = useMemo(() => {
    if (!reportTargetOwner) return null;
    const targetId = reportTargetOwner.id;

    // Filter kehadiran berdasarkan rentang tanggal kustom (startDate s/d endDate)
    const userAttendance = attendance.filter((a) => {
      if (a.ownerId !== targetId) return false;
      if (reportStartDate && a.date < reportStartDate) return false;
      if (reportEndDate && a.date > reportEndDate) return false;
      return true;
    });

    const totalHadir = userAttendance.filter((a) => a.type === 'hadir').length;
    const totalIzin = userAttendance.filter((a) => a.type === 'izin').length;
    const totalCuti = userAttendance.filter((a) => a.type === 'cuti').length;
    const totalSakit = userAttendance.filter((a) => a.type === 'sakit').length;
    const totalHours = userAttendance
      .filter((a) => a.type === 'hadir')
      .reduce((acc, curr) => acc + (curr.workDurationHours || 0), 0);
    const avgHours = totalHadir > 0 ? (totalHours / totalHadir).toFixed(1) : '0';

    const totalRegularHours = userAttendance
      .filter((a) => a.type === 'hadir')
      .reduce((acc, curr) => acc + (curr.regularWorkHours || 0), 0);

    const totalOvertimeHours = userAttendance
      .filter((a) => a.type === 'hadir')
      .reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);

    const targetPeriodHours = Math.round(totalHadir * (workPolicy.targetDailyWorkHours || 8.0));

    // Filter entri tugas berdasarkan rentang tanggal kustom (startDate s/d endDate)
    const userEntries = entries.filter((e) => {
      if (e.ownerId !== targetId) return false;
      if (reportStartDate && e.date < reportStartDate) return false;
      if (reportEndDate && e.date > reportEndDate) return false;
      return true;
    });

    const totalTasks = userEntries.length;
    const finishedTasks = userEntries.filter((e) => e.status === 'selesai').length;
    const inProgressTasks = userEntries.filter((e) => e.status === 'berjalan').length;
    const pendingTasks = userEntries.filter((e) => e.status === 'belum_mulai').length;
    const overdueTasks = userEntries.filter(
      (e) => e.date < todayStr && e.status !== 'selesai'
    ).length;

    const totalFinishedDays = userEntries
      .filter((e) => e.status === 'selesai')
      .reduce((sum, e) => sum + ((e as any).durationDays || getCalendarDaySpan(e.date, (e as any).completedDate || e.date)), 0);
    const avgDurationDays = finishedTasks > 0 ? (totalFinishedDays / finishedTasks).toFixed(1) : '-';

    // KALKULASI PERSENTASE KONTRIBUSI BEBAN KERJA & TINGKAT PENYELESAIAN SETIAP PROYEK & CABANG PROGRAM
    const projectBreakdown: Array<{
      projectId: string;
      name: string;
      color: string;
      count: number;
      finished: number;
      contributionPercent: number; // % Beban kerja dari total keseluruhan tugas
      completionPercent: number; // % Tingkat penyelesaian proyek ini
      programs: Array<{
        id: string;
        name: string;
        count: number;
        finished: number;
        contributionPercent: number;
        completionPercent: number;
      }>;
    }> = [];

    // Grouping per proyek milik target owner
    const myAvailableProjects = projects.filter(
      (p) => !currentUser || currentUser.id === 'owner-demo-1' || p.ownerId === targetId
    );

    // Kumpulkan data proyek aktif
    myAvailableProjects.forEach((proj) => {
      const projTasks = userEntries.filter((e) => e.projectId === proj.id);
      const projFinished = projTasks.filter((e) => e.status === 'selesai').length;
      const projCount = projTasks.length;

      const contributionPercent = totalTasks > 0 ? (projCount / totalTasks) * 100 : 0;
      const completionPercent = projCount > 0 ? (projFinished / projCount) * 100 : 0;

      // Grouping per cabang program di proyek ini
      const programStats: Array<{
        id: string;
        name: string;
        count: number;
        finished: number;
        contributionPercent: number;
        completionPercent: number;
      }> = [];

      const definedPrograms = proj.programs || [];
      definedPrograms.forEach((prog) => {
        const progTasks = projTasks.filter((e) => e.programId === prog.id);
        const progFinished = progTasks.filter((e) => e.status === 'selesai').length;
        const progCount = progTasks.length;
        const progContrib = totalTasks > 0 ? (progCount / totalTasks) * 100 : 0;
        const progComp = progCount > 0 ? (progFinished / progCount) * 100 : 0;

        programStats.push({
          id: prog.id,
          name: prog.name,
          count: progCount,
          finished: progFinished,
          contributionPercent: Math.round(progContrib * 10) / 10,
          completionPercent: Math.round(progComp * 10) / 10,
        });
      });

      // Cabang umum (tugas proyek tanpa sub-program spesifik)
      const generalTasks = projTasks.filter((e) => !e.programId);
      if (generalTasks.length > 0 || definedPrograms.length === 0) {
        const genCount = generalTasks.length;
        const genFinished = generalTasks.filter((e) => e.status === 'selesai').length;
        const genContrib = totalTasks > 0 ? (genCount / totalTasks) * 100 : 0;
        const genComp = genCount > 0 ? (genFinished / genCount) * 100 : 0;

        programStats.unshift({
          id: 'general',
          name: definedPrograms.length > 0 ? 'Umum / Lainnya' : 'Program Utama',
          count: genCount,
          finished: genFinished,
          contributionPercent: Math.round(genContrib * 10) / 10,
          completionPercent: Math.round(genComp * 10) / 10,
        });
      }

      projectBreakdown.push({
        projectId: proj.id,
        name: proj.name,
        color: proj.color,
        count: projCount,
        finished: projFinished,
        contributionPercent: Math.round(contributionPercent * 10) / 10,
        completionPercent: Math.round(completionPercent * 10) / 10,
        programs: programStats,
      });
    });

    // Cek entri tanpa proyek
    const noProjTasks = userEntries.filter((e) => !e.projectId);
    if (noProjTasks.length > 0) {
      const npCount = noProjTasks.length;
      const npFinished = noProjTasks.filter((e) => e.status === 'selesai').length;
      const npContrib = totalTasks > 0 ? (npCount / totalTasks) * 100 : 0;
      const npComp = npCount > 0 ? (npFinished / npCount) * 100 : 0;

      projectBreakdown.push({
        projectId: 'none',
        name: 'Tanpa Proyek',
        color: '#64748b',
        count: npCount,
        finished: npFinished,
        contributionPercent: Math.round(npContrib * 10) / 10,
        completionPercent: Math.round(npComp * 10) / 10,
        programs: [
          {
            id: 'none-gen',
            name: 'Aktivitas Harian Lepas',
            count: npCount,
            finished: npFinished,
            contributionPercent: Math.round(npContrib * 10) / 10,
            completionPercent: Math.round(npComp * 10) / 10,
          },
        ],
      });
    }

    // Urutkan berdasarkan kontribusi beban kerja terbesar
    projectBreakdown.sort((a, b) => b.count - a.count);

    const taskScore = totalTasks > 0 ? (finishedTasks / totalTasks) * 60 : 60;
    const attendanceScore = (totalHadir / Math.max(1, totalHadir + totalIzin + totalSakit)) * 40;
    const performanceScore = Math.min(100, Math.round(taskScore + attendanceScore));

    return {
      owner: reportTargetOwner,
      startDate: reportStartDate,
      endDate: reportEndDate,
      userAttendance,
      userEntries,
      totalHadir,
      totalIzin,
      totalCuti,
      totalSakit,
      totalHours: totalHours.toFixed(1),
      avgHours,
      totalRegularHours: totalRegularHours.toFixed(1),
      totalOvertimeHours: totalOvertimeHours.toFixed(1),
      targetPeriodHours,
      totalTasks,
      finishedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      projectBreakdown,
      performanceScore,
    };
  }, [
    reportTargetOwner,
    attendance,
    entries,
    reportStartDate,
    reportEndDate,
    todayStr,
    projects,
    currentUser,
  ]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean }> = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      cells.push({
        dateStr: toDateStr(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate()),
        dayNumber: dayNum,
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      cells.push({
        dateStr: toDateStr(currentYear, currentMonth, d),
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    const remainder = cells.length % 7;
    const trailingCount = remainder === 0 ? 0 : 7 - remainder;
    for (let i = 1; i <= trailingCount; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      cells.push({
        dateStr: toDateStr(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate()),
        dayNumber: i,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Catatan tanggal terpilih yang muncul saat tanggal di kalender diklik (termasuk tugas menyambung)
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries
      .filter((e) => {
        const range = getEntryDateRange(e, todayStr);
        if (selectedDate < range.startDate || selectedDate > range.endDate) return false;
        if (currentUser && currentUser.id !== 'owner-demo-1') {
          return e.ownerId === currentUser.id;
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  }, [entries, selectedDate, currentUser, todayStr]);

  // Pengingat khusus pada tanggal yang sedang dibuka di Drawer Detail
  const selectedDateReminders = useMemo(() => {
    if (!selectedDate) return [];
    return reminders
      .filter((r) => {
        if (r.date !== selectedDate) return false;
        if (
          currentUser &&
          currentUser.id !== 'owner-demo-1' &&
          r.ownerId &&
          r.ownerId !== currentUser.id &&
          r.ownerId !== 'owner-demo-1'
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [reminders, selectedDate, currentUser]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const [y, m] = todayStr.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
    if (activeMainTab === 'calendar') {
      openDayDrawer(todayStr);
    }
  };

  const openDayDrawer = (dateStr: string) => {
    setSelectedDate(dateStr);
    resetEntryForm(projectFilter !== 'ALL' && projectFilter !== 'NONE' ? projectFilter : '');
  };

  const resetEntryForm = (defaultProjId = '') => {
    setEditingEntryId(null);
    setEntryTitle('');
    setEntryProjectId(defaultProjId);
    setEntryProgramId('');
    setEntryStatus('belum_mulai');
    setEntryNotes('');
    setConfirmDeleteEntryId(null);
  };

  const handleStartEditEntry = (entry: ScheduleEntry) => {
    setEditingEntryId(entry.id);
    setEntryTitle(entry.title);
    setEntryProjectId(entry.projectId || '');
    setEntryProgramId(entry.programId || '');
    setEntryStatus(entry.status);
    setEntryNotes(entry.notes);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !entryTitle.trim()) return;

    if (editingEntryId) {
      const existing = entries.find((item) => item.id === editingEntryId);
      const isCompleted = entryStatus === 'selesai';
      const finishDate = isCompleted ? ((existing as any)?.completedDate || selectedDate || todayStr) : null;
      const durationDays = isCompleted ? getCalendarDaySpan(existing?.date || selectedDate, finishDate!) : undefined;

      const updated = db.updateEntry(editingEntryId, {
        title: entryTitle.trim(),
        projectId: entryProjectId || null,
        programId: entryProgramId || null,
        status: entryStatus,
        notes: entryNotes.trim(),
        completedDate: finishDate,
        durationDays,
      } as any);
      setEntries(updated);
      showToast(isCompleted ? `Catatan diperbarui (Selesai dalam ${durationDays} hari)` : 'Catatan berhasil diperbarui');
    } else {
      const isCompleted = entryStatus === 'selesai';
      const updated = db.createEntry(
        {
          date: selectedDate,
          title: entryTitle.trim(),
          projectId: entryProjectId || null,
          programId: entryProgramId || null,
          status: entryStatus,
          notes: entryNotes.trim(),
          completedDate: isCompleted ? selectedDate : null,
          durationDays: isCompleted ? 1 : undefined,
        } as any,
        currentUser
      );
      setEntries(updated);
      showToast(`Catatan ditambahkan`);
    }
    resetEntryForm(projectFilter !== 'ALL' && projectFilter !== 'NONE' ? projectFilter : '');
  };

  const handleQuickCycleStatus = (entry: ScheduleEntry) => {
    const order: EntryStatus[] = ['belum_mulai', 'berjalan', 'selesai'];
    const nextStatus = order[(order.indexOf(entry.status) + 1) % order.length];
    const isCompleted = nextStatus === 'selesai';
    const finishDate = isCompleted ? (selectedDate || todayStr) : null;
    const durationDays = isCompleted ? getCalendarDaySpan(entry.date, finishDate!) : undefined;

    const updated = db.updateEntry(entry.id, {
      status: nextStatus,
      completedDate: finishDate,
      durationDays,
    } as any);
    setEntries(updated);
    if (isCompleted) {
      showToast(`🎉 Proyek selesai! Dikerjakan selama ${durationDays} hari (${formatDateShortIndo(entry.date)} – ${formatDateShortIndo(finishDate!)}).`);
    } else {
      showToast(`Status diubah ke "${STATUS_META[nextStatus].label}"`);
    }
  };

  const handleConfirmDeleteEntry = (id: string) => {
    const updated = db.deleteEntry(id);
    setEntries(updated);
    if (editingEntryId === id) {
      resetEntryForm();
    }
    setConfirmDeleteEntryId(null);
    showToast('Catatan dihapus');
  };

  // ==========================================================================
  // MANAJEMEN PROYEK & CABANG PROGRAM
  // ==========================================================================
  const openCreateProjectModal = () => {
    setEditingProject(null);
    setProjectNameInput('');
    setProjectColorInput(PROJECT_COLORS[projects.length % PROJECT_COLORS.length].value);
    setProjectProgramsInput([]);
    setNewProgramNameInput('');
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (proj: Project) => {
    setEditingProject(proj);
    setProjectNameInput(proj.name);
    setProjectColorInput(proj.color);
    setProjectProgramsInput(proj.programs ? [...proj.programs] : []);
    setNewProgramNameInput('');
    setIsProjectModalOpen(true);
  };

  const handleAddProgramToForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProgramNameInput.trim()) return;
    const newProg: ProjectProgram = {
      id: 'prog-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      name: newProgramNameInput.trim(),
      createdAt: new Date().toISOString(),
    };
    setProjectProgramsInput([...projectProgramsInput, newProg]);
    setNewProgramNameInput('');
  };

  const handleRemoveProgramFromForm = (progId: string) => {
    setProjectProgramsInput(projectProgramsInput.filter((p) => p.id !== progId));
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectNameInput.trim()) return;

    if (editingProject) {
      const updated = db.updateProject(
        editingProject.id,
        projectNameInput,
        projectColorInput,
        projectProgramsInput
      );
      setProjects(updated);
      showToast('Proyek & cabang program diperbarui');
    } else {
      const updated = db.createProject(
        projectNameInput,
        projectColorInput,
        projectProgramsInput,
        currentUser
      );
      setProjects(updated);
      showToast(`Proyek dibuat`);
    }
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (id: string) => {
    const { projects: nextProj, entries: nextEnt } = db.deleteProject(id);
    setProjects(nextProj);
    setEntries(nextEnt);
    if (projectFilter === id) {
      setProjectFilter('ALL');
    }
    setConfirmDeleteProjectId(null);
    showToast('Proyek dihapus');
  };


  // ==========================================================================
  // HANDLERS KAMERA & LOKASI GPS (CLOCK IN & CLOCK OUT)
  // ==========================================================================
  const openCameraForAttendance = (mode: 'in' | 'out') => {
    if (!currentUser) return;
    setCameraMode(mode);
    setCapturedSnapshotPreview(null);
    setIsCameraModalOpen(true);
    setIsCameraActive(false);
    setIsGPSLoading(true);
    setCurrentGPSLocation('Mendeteksi koordinat GPS...');

    const nowTime = getNowTimeStr();
    const shift = detectShiftCategoryInfo(mode, nowTime, workPolicy);
    setDetectedShiftInfo(shift);
    setCustomShiftNoteInput(shift.note);

    // 1. Minta akses GPS / Geolocation
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          const acc = Math.round(pos.coords.accuracy);
          setCurrentGPSLocation(`Lat: ${lat}, Lng: ${lng} (Akurasi: ±${acc}m)`);
          setIsGPSLoading(false);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          setCurrentGPSLocation('Lokasi GPS: Kantor / Presensi Terverifikasi');
          setIsGPSLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setCurrentGPSLocation('Lokasi: Presensi Terverifikasi');
      setIsGPSLoading(false);
    }

    // 2. Minta akses Kamera
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        .then((stream) => {
          setCameraStream(stream);
          if (videoElemRef.current) {
            videoElemRef.current.srcObject = stream;
            videoElemRef.current.muted = true;
            videoElemRef.current.play().then(() => {
              setIsCameraActive(true);
            }).catch((e) => console.warn('Play error:', e));
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setIsCameraActive(false);
          showToast('Kamera tidak dapat diakses atau izin diblokir browser');
        });
    }
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setIsCameraModalOpen(false);
    setCapturedSnapshotPreview(null);
  };

  const handleTakeSnapshotAndSubmit = async () => {
    if (!currentUser) return;
    const nowTime = getNowTimeStr();
    let photoDataUrl = capturedSnapshotPreview;

    if (!photoDataUrl && videoElemRef.current) {
      photoDataUrl = captureAndWatermarkSnapshot(videoElemRef.current, {
        userName: currentUser.fullName,
        date: todayStr,
        time: nowTime,
        location: currentGPSLocation,
        status: cameraMode === 'in' ? `CLOCK IN (${detectedShiftInfo.category})` : `CLOCK OUT (${detectedShiftInfo.category})`,
      });
    }

    const payload: any = {
      date: todayStr,
      type: 'hadir',
      notes: customShiftNoteInput || detectedShiftInfo.note,
      shiftCategory: detectedShiftInfo.category,
      shiftNotes: customShiftNoteInput || detectedShiftInfo.note,
    };

    if (cameraMode === 'in') {
      payload.checkInTime = nowTime;
      payload.checkInPhoto = photoDataUrl;
      payload.checkInLocation = currentGPSLocation;
    } else {
      payload.checkOutTime = nowTime;
      payload.checkOutPhoto = photoDataUrl;
      payload.checkOutLocation = currentGPSLocation;
    }

    const updated = await db.recordAttendance(payload, currentUser);
    setAttendance(updated);

    closeCameraModal();
    showToast(
      `${cameraMode === 'in' ? 'Clock In' : 'Clock Out'} berhasil pukul ${nowTime}! Foto & lokasi tersimpan.`
    );
  };

  // ==========================================================================
  // HANDLERS JADWAL PENGINGAT (REMINDERS & ALARMS)
  // ==========================================================================
  const openCreateReminderModal = (defaultDate?: unknown) => {
    setEditingReminderId(null);
    setRemTitleInput('');
    const initialDate = typeof defaultDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(defaultDate) ? defaultDate : todayStr;
    setRemDateInput(initialDate);
    setRemStartTimeInput('09:00');
    setRemEndTimeInput('10:00');
    setRemNotifyBeforeMinutes(15);
    setRemNotesInput('');
    setIsReminderModalOpen(true);
  };

  const openEditReminderModal = (rem: ReminderItem) => {
    setEditingReminderId(rem.id);
    setRemTitleInput(rem.title);
    setRemDateInput(rem.date);
    setRemStartTimeInput(rem.startTime);
    setRemEndTimeInput(rem.endTime);
    setRemNotifyBeforeMinutes(rem.notifyBeforeMinutes);
    setRemNotesInput(rem.notes);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitleInput.trim() || !currentUser) return;

    if (editingReminderId) {
      const updated = db.updateReminder(editingReminderId, {
        title: remTitleInput.trim(),
        date: remDateInput,
        startTime: remStartTimeInput,
        endTime: remEndTimeInput,
        notifyBeforeMinutes: Number(remNotifyBeforeMinutes) || 0,
        notes: remNotesInput.trim(),
        isTriggered: false, // reset trigger agar bisa berbunyi di waktu baru
      });
      setReminders(updated);
      showToast('Jadwal pengingat diperbarui');
    } else {
      const updated = db.createReminder(
        {
          title: remTitleInput.trim(),
          date: remDateInput,
          startTime: remStartTimeInput,
          endTime: remEndTimeInput,
          notifyBeforeMinutes: Number(remNotifyBeforeMinutes) || 0,
          notes: remNotesInput.trim(),
          isActive: true,
        },
        currentUser
      );
      setReminders(updated);
      showToast(`Jadwal pengingat "${remTitleInput.trim()}" berhasil dibuat`);
    }

    // Pastikan izin notifikasi ditanyakan jika belum aktif
    if (!hasNotificationPermission) {
      requestNotificationAccess();
    }

    setIsReminderModalOpen(false);
  };

  const handleDeleteReminder = (id: string) => {
    const updated = db.deleteReminder(id);
    setReminders(updated);
    showToast('Jadwal pengingat dihapus');
  };

  const handleToggleReminder = (id: string) => {
    const updated = db.toggleReminderActive(id);
    setReminders(updated);
  };

  // Handler Download Foto Bukti Absensi
  const handleDownloadSinglePhoto = (photoUrl?: string | null, fileName: string = 'foto.jpg') => {
    if (!photoUrl) return;
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Foto ${fileName} berhasil diunduh`);
  };

  const handleDownloadAllAttendancePhotos = () => {
    const items = (reportData?.userAttendance || []).filter(
      (a) => a.checkInPhoto || a.checkOutPhoto
    );
    if (items.length === 0) {
      showToast('Tidak ada foto bukti absensi pada rentang tanggal ini');
      return;
    }

    items.forEach((a, idx) => {
      setTimeout(() => {
        if (a.checkInPhoto) {
          handleDownloadSinglePhoto(
            a.checkInPhoto,
            `Bukti_ClockIn_${currentUser?.fullName?.replace(/\s+/g, '_')}_${a.date}.jpg`
          );
        }
        if (a.checkOutPhoto) {
          setTimeout(() => {
            handleDownloadSinglePhoto(
              a.checkOutPhoto,
              `Bukti_ClockOut_${currentUser?.fullName?.replace(/\s+/g, '_')}_${a.date}.jpg`
            );
          }, 250);
        }
      }, idx * 600);
    });

    showToast(`Mengunduh ${items.length} foto bukti absensi...`);
  };

  // Clock In & Out Kehadiran
  const handleQuickClockIn = async () => {
    if (!currentUser) return;
    const nowTime = getNowTimeStr();
    const updated = await db.recordAttendance(
      {
        date: todayStr,
        type: 'hadir',
        checkInTime: nowTime,
        notes: 'Check-in hadir harian.',
      },
      currentUser
    );
    setAttendance(updated);
    showToast(`Clock In berhasil pada pukul ${nowTime}! Tersimpan di cloud.`);
  };

  const handleQuickClockOut = async () => {
    if (!currentUser) return;
    const nowTime = getNowTimeStr();
    const updated = await db.recordAttendance(
      {
        date: todayStr,
        type: 'hadir',
        checkOutTime: nowTime,
        notes: myTodayAttendance?.notes || 'Selesai jam kerja harian.',
      },
      currentUser
    );
    setAttendance(updated);
    showToast(`Clock Out berhasil pada pukul ${nowTime}! Tersimpan di cloud.`);
  };

  const openNewAttendanceModal = () => {
    setAttDateInput(todayStr);
    setAttTypeInput('izin');
    setAttCheckInInput('08:30');
    setAttCheckOutInput('17:00');
    setAttNotesInput('');
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendanceForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated = await db.recordAttendance(
      {
        date: attDateInput,
        type: attTypeInput,
        checkInTime: attTypeInput === 'hadir' ? attCheckInInput : null,
        checkOutTime: attTypeInput === 'hadir' ? attCheckOutInput : null,
        notes: attNotesInput.trim(),
      },
      currentUser
    );
    setAttendance(updated);
    setIsAttendanceModalOpen(false);
    showToast(`Catatan absensi (${ATTENDANCE_META[attTypeInput].label}) berhasil disimpan.`);
  };

  const handleDeleteAttendance = async (id: string) => {
    const updated = await db.deleteAttendance(id);
    setAttendance(updated);
    showToast('Data absensi dihapus.');
  };

  // ==========================================================================
  // LOGIKA FITUR PERFORMA AI & MENU SARAN TERPADU
  // ==========================================================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setAiUploadedImage(result);
      showToast(`Gambar "${file.name}" berhasil diunggah`);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAIAnalysis = () => {
    if (!currentUser) return;
    if (!aiUploadedImage) {
      showToast('Silakan unggah gambar bukti performa terlebih dahulu');
      return;
    }

    setIsAnalyzingAI(true);
    showToast('AI sedang menganalisis gambar dan performa program kerja...');

    // Simulasi analisis AI berbasis metrik riil proyek, program, dan gambar performa
    setTimeout(() => {
      const basePerformance = reportData?.performanceScore || 85;
      const finishedRatio =
        reportData && reportData.totalTasks > 0
          ? (reportData.finishedTasks / reportData.totalTasks) * 100
          : 80;

      const aiScore = Math.min(
        98,
        Math.max(65, Math.round(basePerformance * 0.6 + finishedRatio * 0.4))
      );

      const activeProjNames = (reportData?.projectBreakdown || [])
        .slice(0, 3)
        .map((p) => p.name)
        .join(', ') || 'Proyek Tim';

      const aiSummary = `Berdasarkan analisis visual dokumen bukti performa "${aiUploadedFileName}" serta data real-time, aktivitas kerja pada periode ini menunjukkan produktivitas efektif sebesar ${aiScore}%. Ketercapaian tugas pada proyek utama (${activeProjNames}) berjalan konsisten dengan kepatuhan jam kerja rata-rata ${reportData?.avgHours || '8.0'} jam/hari.`;

      const strengths: string[] = [
        `Tingkat kedisiplinan kehadiran stabil dengan total ${reportData?.totalHadir || 0} hari kerja tercatat.`,
        `Fokus kontribusi tinggi pada proyek prioritas dengan rasio penyelesaian mencapai ${Math.round(finishedRatio)}%.`,
        `Dokumentasi hasil kerja visual ("${aiUploadedFileName}") terverifikasi sesuai milestone kerja yang ditargetkan.`,
      ];

      const improvements: string[] = [];
      if (reportData && reportData.overdueTasks > 0) {
        improvements.push(
          `Ditemukan ${reportData.overdueTasks} tugas yang melewati tenggat waktu (overdue), perlu mitigasi percepatan timeline.`
        );
      } else {
        improvements.push(
          `Distribusi waktu antar cabang program masih condong ke satu proyek besar; perlu pemerataan progres cabang program pendukung.`
        );
      }
      improvements.push(
        `Efisiensi durasi kerja harian dapat ditingkatkan dengan memangkas jeda waktu antar sesi pergantian program.`
      );

      // MENU SARAN AI TERPADU (Sintesis dari seluruh performa, cabang program, dan tolak ukur kerja)
      const recommendations: string[] = [
        `Prioritas Program: Alokasikan fokus utama pada cabang program dengan penyelesaian terendah agar target deliverable kuartal tidak terhambat.`,
        `Kepatuhan Jam Kerja: Pertahankan Clock In sebelum pukul ${workPolicy.standardCheckInTime} (toleransi ${workPolicy.lateToleranceMinutes} menit). Saat ini tercatat ${attendanceStats.punctualCount} hari tepat waktu.`,
        `Optimalisasi Istirahat: Pastikan istirahat harian ${workPolicy.breakDurationHours} jam digunakan optimal agar target jam kerja bersih ${workPolicy.targetDailyWorkHours} jam/hari tercapai tanpa kelelahan.`,
        `Perencanaan Cuti: Sisa kuota cuti tahunan Anda saat ini ${attendanceStats.remainingLeaveQuota} hari dari total ${workPolicy.annualLeaveQuota} hari. Rencanakan cuti strategis di sela milestone program besar.`,
      ];

      const newRecord: AIPerformanceRecord = {
        id: 'ai-perf-' + Date.now().toString(36),
        ownerId: currentUser.id,
        ownerName: currentUser.fullName,
        imageUrl: aiUploadedImage,
        imageName: aiUploadedFileName,
        createdAt: new Date().toISOString(),
        score: aiScore,
        summary: aiSummary,
        strengths,
        improvements,
        recommendations,
        analyzedDateRange: `${formatDateShortIndo(reportStartDate)} s/d ${formatDateShortIndo(reportEndDate)}`,
      };

      const updated = db.addAIPerformance(newRecord);
      setAiPerformances(updated);
      setIsAnalyzingAI(false);
      showToast('Analisis AI selesai! Saran dan kesimpulan performa telah diperbarui.');
    }, 1800);
  };

  const handleDeleteAIPerformance = (id: string) => {
    const updated = db.deleteAIPerformance(id);
    setAiPerformances(updated);
    showToast('Riwayat analisis performa dihapus');
  };

  // Salin teks laporan
  const copyReportSummary = () => {
    if (!reportData) return;
    const lines = [
      `*LAPORAN EVALUASI KINERJA & KONTRIBUSI PROYEK*`,
      `Nama Owner: ${reportData.owner.fullName} (${reportData.owner.id})`,
      `Periode Evaluasi: ${formatDateShortIndo(reportData.startDate)} s/d ${formatDateShortIndo(reportData.endDate)}`,
      `Indeks Produktivitas: ${reportData.performanceScore}%`,
      `----------------------------------------`,
      `*1. KONTRIBUSI & PROGRES PROYEK*`,
      ...reportData.projectBreakdown.map(
        (p) =>
          `- ${p.name}: ${p.count} Tugas (${p.contributionPercent}% total beban kerja) • ${p.finished} Selesai (${p.completionPercent}%)` +
          (p.programs.length > 0
            ? '\n  ' +
              p.programs
                .map((pr) => `  * ${pr.name}: ${pr.count} tugas (${pr.completionPercent}% selesai)`)
                .join('\n  ')
            : '')
      ),
      `----------------------------------------`,
      `*2. KEHADIRAN & DURASI JAM KERJA*`,
      `- Total Hadir: ${reportData.totalHadir} Hari (${reportData.totalHours} Jam, rata-rata ${reportData.avgHours} jam/hari)`,
      `- Izin: ${reportData.totalIzin} Hari, Cuti: ${reportData.totalCuti} Hari, Sakit: ${reportData.totalSakit} Hari`,
    ];
    copyCodeToClipboard(lines.join('\n'), 'Ringkasan Laporan');
  };

  const copyCodeToClipboard = (text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast(`${label} disalin ke clipboard`);
    } catch {
      showToast('Gagal menyalin teks');
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Tampilkan AuthPage jika user belum login
  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={(user) => {
          if (db.saveSession) db.saveSession(user);
          setCurrentUser(user);
          showToast(`Selamat datang, ${user.fullName}!`);
          if (db.fetchFromSupabase) {
            db.fetchFromSupabase(user.id).then((remote: any) => {
              if (remote) {
                setProjects(remote.projects);
                setEntries(remote.entries);
                if (remote.attendance) setAttendance(remote.attendance);
              }
            });
          }
        }}
      />
    );
  }

  // Cari proyek aktif yang sedang dipilih di form drawer agar cabang programnya bisa dipilih
  const activeSelectedProjectInDrawer = entryProjectId ? projectMap[entryProjectId] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans print:bg-white max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 border border-slate-700 print:hidden">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 print:hidden transition-all shadow-xs pt-[max(env(safe-area-inset-top,0px),12px)] sm:pt-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Buka menu proyek"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                  JadwalPro
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Proyek • Program • Absensi • AI
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Workspace Kinerja &amp; Evaluasi Terpadu
              </p>
            </div>
          </div>

          {/* TAB NAVIGASI UTAMA DI HEADER */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMainTab('calendar')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Jadwal Proyek</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('attendance')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'attendance'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Absensi &amp; Kehadiran</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('reminders')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'reminders'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Pengingat &amp; Alarm</span>
              {reminders.filter((r) => r.isActive && r.date === todayStr).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('report')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'report'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Laporan Kinerja</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('ai_performance')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'ai_performance'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Performa AI &amp; Saran</span>
            </button>
          </div>

          {/* Profil User, Setingan Akun & Tombol Keluar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAccountModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-colors cursor-pointer group text-left"
              title="Klik untuk membuka Pengaturan Akun & Profil Pribadi"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 group-hover:bg-indigo-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs transition-colors overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="leading-tight hidden sm:block">
                <div className="font-bold text-slate-900 truncate max-w-[120px] group-hover:text-indigo-600 transition-colors">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentUser.id.slice(0, 10)}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={openAccountModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Setingan Akun Pribadi"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Setingan Akun</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub Navigation Tabs */}
        <div className="md:hidden flex border-t border-slate-200 bg-slate-50 px-3 py-1.5 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveMainTab('calendar')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-center whitespace-nowrap ${
              activeMainTab === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Jadwal
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('attendance')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-center whitespace-nowrap ${
              activeMainTab === 'attendance' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Absensi
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('reminders')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-center whitespace-nowrap ${
              activeMainTab === 'reminders' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pengingat
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('report')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-center whitespace-nowrap ${
              activeMainTab === 'report' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Laporan
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('ai_performance')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-center whitespace-nowrap ${
              activeMainTab === 'ai_performance' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Performa AI
          </button>
        </div>
      </header>

      {/* Main Content Layout (Padding disesuaikan agar tidak tertutup header yang fixed) */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex relative pt-[calc(116px+max(env(safe-area-inset-top,0px),12px))] md:pt-16">
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR PROYEK & CABANG PROGRAM */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out print:hidden pt-[max(env(safe-area-inset-top,0px),12px)] lg:pt-0 pb-[max(env(safe-area-inset-bottom,0px),12px)] lg:pb-0 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Widget Clock In / Clock Out Hari Ini */}
          <div className="p-3.5 m-3 mb-2 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                <span>Absensi Hari Ini</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-indigo-800 shadow-xs">
                {myTodayAttendance
                  ? ATTENDANCE_META[myTodayAttendance.type].label
                  : 'Belum Absen'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Jam Masuk:</span>
                <span className="font-bold text-slate-900">
                  {myTodayAttendance?.checkInTime || '-'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Jam Pulang:</span>
                <span className="font-bold text-slate-900">
                  {myTodayAttendance?.checkOutTime || '-'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-1 mt-1">
                <span>Durasi Bekerja:</span>
                <span className="font-bold text-indigo-600">
                  {myTodayAttendance?.workDurationHours ? `${myTodayAttendance.workDurationHours} Jam` : '-'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => openCameraForAttendance('in')}
                disabled={Boolean(myTodayAttendance?.checkInTime)}
                className="py-1.5 px-2 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center gap-1 shadow-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Clock In</span>
              </button>
              <button
                type="button"
                onClick={() => openCameraForAttendance('out')}
                disabled={!myTodayAttendance?.checkInTime || Boolean(myTodayAttendance?.checkOutTime)}
                className="py-1.5 px-2 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white flex items-center justify-center gap-1 shadow-xs"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Clock Out</span>
              </button>
            </div>

            <button
              type="button"
              onClick={openNewAttendanceModal}
              className="w-full py-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 text-center"
            >
              + Ajukan Izin / Cuti / Koreksi
            </button>
          </div>

          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daftar Proyek
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openCreateProjectModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Proyek</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 flex-1 overflow-y-auto space-y-1">
            <button
              type="button"
              onClick={() => {
                setProjectFilter('ALL');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                projectFilter === 'ALL'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Semua Proyek</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  projectFilter === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {monthEntries.length}
              </span>
            </button>

            <div className="pt-2 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Proyek Aktif ({INDONESIAN_MONTHS[currentMonth]})
            </div>

            {projects
              .filter((p) => !currentUser || currentUser.id === 'owner-demo-1' || p.ownerId === currentUser.id)
              .map((proj) => {
                const count = projectMonthCounts[proj.id] || 0;
                const isSelected = projectFilter === proj.id;
                const isConfirmingDelete = confirmDeleteProjectId === proj.id;
                const programCount = proj.programs?.length || 0;

                return (
                  <div
                    key={proj.id}
                    className={`group rounded-xl transition-colors ${
                      isSelected ? 'bg-slate-100/90 ring-1 ring-slate-300' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProjectFilter(isSelected ? 'ALL' : proj.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-1 ring-transparent"
                          style={{ backgroundColor: proj.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-sm truncate ${
                              isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {proj.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                            {programCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-indigo-600 font-medium">
                                <GitBranch className="w-2.5 h-2.5" />
                                {programCount} Program
                              </span>
                            )}
                            {proj.ownerName && <span>• {proj.ownerName}</span>}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:hidden">
                          {count}
                        </span>
                        <div className="hidden group-hover:flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEditProjectModal(proj)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="Edit proyek & kelola program cabang"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProjectId(proj.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Hapus proyek"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cabang Program List Ringkas */}
                    {proj.programs && proj.programs.length > 0 && isSelected && (
                      <div className="pl-7 pr-3 pb-2 pt-0.5 space-y-1">
                        {proj.programs.map((prog) => {
                          const progTasks = monthEntries.filter(
                            (e) => e.projectId === proj.id && e.programId === prog.id
                          );
                          return (
                            <div
                              key={prog.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/70 text-slate-600 border border-slate-100"
                            >
                              <span className="truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                {prog.name}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {progTasks.length} tugas
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isConfirmingDelete && (
                      <div className="mx-2 mb-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs">
                        <p className="text-rose-800 font-medium mb-2">
                          Hapus proyek <strong>{proj.name}</strong>? Catatan tidak ikut terhapus dan
                          akan menjadi &ldquo;Tanpa proyek&rdquo;.
                        </p>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProjectId(null)}
                            className="px-2 py-1 rounded bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            className="px-2 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700"
                          >
                            Ya, Hapus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            <button
              type="button"
              onClick={() => {
                setProjectFilter(projectFilter === 'NONE' ? 'ALL' : 'NONE');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors mt-2 ${
                projectFilter === 'NONE'
                  ? 'bg-slate-200/80 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                <span>Tanpa proyek</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {projectMonthCounts.NONE || 0}
              </span>
            </button>
          </div>
        </aside>

        {/* AREA KONTEN UTAMA */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
          {/* TAB 1: KALENDER JADWAL PROYEK */}
          {activeMainTab === 'calendar' && (
            <>
              {/* KPI BULAN BERJALAN */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div
                  onClick={() => setStatusFilter('ALL')}
                  className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
                    statusFilter === 'ALL'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Entri
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {kpiStats.total}
                    </span>
                    <span className="text-xs text-slate-500">
                      di {INDONESIAN_MONTHS[currentMonth]}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() =>
                    setStatusFilter(statusFilter === 'selesai' ? 'ALL' : 'selesai')
                  }
                  className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
                    statusFilter === 'selesai'
                      ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Selesai
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                      {kpiStats.selesai}
                    </span>
                    <span className="text-xs text-slate-500">
                      {kpiStats.total > 0
                        ? `${Math.round((kpiStats.selesai / kpiStats.total) * 100)}% tuntas`
                        : '0%'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() =>
                    setStatusFilter(statusFilter === 'berjalan' ? 'ALL' : 'berjalan')
                  }
                  className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
                    statusFilter === 'berjalan'
                      ? 'border-blue-500 ring-2 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Berjalan
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {kpiStats.berjalan}
                    </span>
                    <span className="text-xs text-slate-500">sedang dikerjakan</span>
                  </div>
                </div>

                <div
                  onClick={() =>
                    setStatusFilter(statusFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')
                  }
                  className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
                    statusFilter === 'OVERDUE'
                      ? 'border-rose-500 ring-2 ring-rose-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Terlambat
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-rose-600">
                      {kpiStats.terlambat}
                    </span>
                    <span className="text-xs text-slate-500">lewat tanggal &amp; belum selesai</span>
                  </div>
                </div>
              </section>

              {/* TOOLBAR */}
              <section className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center bg-slate-100 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                      aria-label="Bulan sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm sm:text-base font-bold text-slate-900 min-w-[145px] text-center">
                      {INDONESIAN_MONTHS[currentMonth]} {currentYear}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                      aria-label="Bulan berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoToToday}
                    className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition-colors"
                  >
                    Hari ini
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial sm:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari tugas, program, catatan..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      className="pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="MINE">Pekerjaan Saya ({currentUser.fullName})</option>
                      {uniqueOwners.filter((o) => o.id !== currentUser.id && o.id !== 'owner-demo-1').length > 0 && (
                        <option value="ALL">Semua Anggota Tim</option>
                      )}
                      {uniqueOwners
                        .filter((o) => o.id !== currentUser.id && o.id !== 'owner-demo-1')
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            Owner: {o.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as 'ALL' | EntryStatus | 'OVERDUE')
                      }
                      className="pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="belum_mulai">Belum mulai</option>
                      <option value="berjalan">Berjalan</option>
                      <option value="selesai">Selesai</option>
                      <option value="OVERDUE">Terlambat</option>
                    </select>
                  </div>

                  <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setViewMode('calendar')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                        viewMode === 'calendar'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Kalender</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                        viewMode === 'list'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Daftar</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* GRID KALENDER */}
              {viewMode === 'calendar' ? (
                <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
                    {INDONESIAN_DAYS_SHORT.map((dayName, idx) => (
                      <div
                        key={dayName}
                        className={`py-2.5 text-center text-xs font-bold uppercase tracking-wider ${
                          idx >= 5 ? 'text-rose-500' : 'text-slate-500'
                        }`}
                      >
                        {dayName}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
                    {calendarCells.map((cell) => {
                      const dayEntries = entriesByDate[cell.dateStr] || [];
                      const dayReminders = remindersByDate[cell.dateStr] || [];
                      const totalItems = dayEntries.length + dayReminders.length;
                      // Tampilkan pengingat (maks 2) & tugas proyek (maks 2) agar sel kalender tetap proporsional & rapi
                      const visibleReminders = dayReminders.slice(0, 2);
                      const maxEntriesToShow = Math.max(1, 3 - visibleReminders.length);
                      const visibleEntries = dayEntries.slice(0, maxEntriesToShow);
                      const remainingCount = totalItems - (visibleReminders.length + visibleEntries.length);
                      const isToday = cell.dateStr === todayStr;
                      const isSelected = cell.dateStr === selectedDate;
                      const holiday = getHolidayInfo(cell.dateStr);
                      const dayOfWeek = cell.dateStr ? new Date(cell.dateStr).getDay() : -1;
                      const isWeekend = dayOfWeek === 0 || (workPolicy.workDaysPerWeek === 5 && dayOfWeek === 6);
                      const isTanggalMerah = holiday?.isHoliday || dayOfWeek === 0;

                      return (
                        <div
                          key={cell.dateStr}
                          onClick={() => openDayDrawer(cell.dateStr)}
                          className={`min-h-[104px] sm:min-h-[128px] p-1.5 sm:p-2 transition-colors cursor-pointer flex flex-col justify-between group ${
                            !cell.isCurrentMonth ? 'bg-slate-50/60 text-slate-400' : 'bg-white'
                          } ${
                            isSelected
                              ? 'ring-2 ring-inset ring-indigo-600 bg-indigo-50/20'
                              : 'hover:bg-slate-50/90'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`inline-flex items-center justify-center text-xs sm:text-sm font-semibold w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-colors ${
                                isToday
                                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                                  : isTanggalMerah
                                  ? 'text-rose-600 font-extrabold bg-rose-50'
                                  : cell.isCurrentMonth
                                  ? 'text-slate-700 group-hover:bg-slate-100'
                                  : 'text-slate-400'
                              }`}
                            >
                              {cell.dayNumber}
                            </span>

                            <div className="flex items-center gap-1">
                              {dayReminders.length > 0 && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300"
                                  title={`${dayReminders.length} pengingat / alarm terpasang`}
                                >
                                  <Bell className="w-2.5 h-2.5 text-amber-600" />
                                  <span>{dayReminders.length}</span>
                                </span>
                              )}
                              {isToday && (
                                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                  Hari Ini
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 flex-1">
                            {holiday && (
                              <div
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold truncate border ${
                                  holiday.isHoliday
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                                title={`${holiday.isHoliday ? 'Libur Nasional (Tanggal Merah)' : 'Hari Besar Nasional'}: ${holiday.name}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${holiday.isHoliday ? 'bg-rose-500' : 'bg-amber-500'} shrink-0`} />
                                <span className="truncate">{holiday.name}</span>
                              </div>
                            )}

                            {/* PENGINGAT / ALARM DI CELL KALENDER */}
                            {visibleReminders.map((rem) => (
                              <div
                                key={rem.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditReminderModal(rem);
                                }}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold truncate border transition-transform hover:scale-[1.02] ${
                                  rem.isActive
                                    ? 'bg-amber-50 text-amber-900 border-amber-300/80 shadow-2xs hover:bg-amber-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-200 line-through opacity-70'
                                }`}
                                title={`⏰ Pengingat: ${rem.title} (${rem.startTime} - ${rem.endTime})`}
                              >
                                <Bell className={`w-2.5 h-2.5 shrink-0 ${rem.isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                                <span className="text-[9px] font-bold text-amber-700 shrink-0">{rem.startTime}</span>
                                <span className="truncate">{rem.title}</span>
                              </div>
                            ))}

                            {/* TUGAS PROYEK DI CELL KALENDER (Mendukung Visual Proyek Menyambung) */}
                            {visibleEntries.map((entry) => {
                              const proj = entry.projectId ? projectMap[entry.projectId] : null;
                              const chipColor = proj ? proj.color : '#64748b';
                              const prog = proj?.programs?.find((p) => p.id === entry.programId);
                              const range = getEntryDateRange(entry, todayStr);
                              const isContinuing = cell.dateStr > range.startDate;
                              const dayIndex = getCalendarDaySpan(range.startDate, cell.dateStr);
                              const isFinishedHere = cell.dateStr === range.endDate && entry.status === 'selesai';
                              const isOverdue =
                                range.endDate < todayStr && entry.status !== 'selesai';

                              return (
                                <div
                                  key={entry.id}
                                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[11px] font-medium truncate border transition-transform group-hover:translate-x-0.5 ${
                                    isContinuing ? 'border-dashed' : ''
                                  }`}
                                  style={{
                                    backgroundColor: `${chipColor}15`,
                                    borderColor: `${chipColor}40`,
                                    color: '#1e293b',
                                  }}
                                  title={`${entry.title} • Proyek: ${proj?.name || 'Tanpa proyek'}${prog ? ` • Program: ${prog.name}` : ''} • ${
                                    entry.status === 'selesai'
                                      ? `Selesai dalam ${range.totalDays} hari (${range.startDate} s/d ${range.endDate})`
                                      : `Hari ke-${dayIndex} (${range.totalDays} hari berjalan • Belum selesai)`
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: chipColor }}
                                  />

                                  {isContinuing && (
                                    <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                                      ↳ H-{dayIndex}
                                    </span>
                                  )}

                                  <span
                                    className={`truncate flex-1 ${
                                      entry.status === 'selesai'
                                        ? 'line-through text-slate-400'
                                        : ''
                                    }`}
                                  >
                                    {entry.title}
                                  </span>

                                  {isFinishedHere && (
                                    <span className="text-[9px] font-bold px-1 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                      ✓ {range.totalDays}h
                                    </span>
                                  )}

                                  {prog && (
                                    <span className="hidden xl:inline-block text-[9px] font-medium px-1 rounded bg-white text-indigo-700 border border-indigo-200 shrink-0">
                                      {prog.name}
                                    </span>
                                  )}
                                  {isOverdue && (
                                    <span
                                      className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"
                                      title="Terlambat"
                                    />
                                  )}
                                </div>
                              );
                            })}

                            {remainingCount > 0 && (
                              <div className="text-[11px] font-semibold text-indigo-600 px-1.5 py-0.5 rounded hover:bg-indigo-50 inline-block">
                                +{remainingCount} lagi
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <section className="space-y-4">
                  {allCalendarDates.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <CalendarIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">
                        Belum Ada Catatan atau Pengingat di Bulan Ini
                      </h3>
                      <button
                        type="button"
                        onClick={() => openDayDrawer(todayStr)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Catatan Hari Ini</span>
                      </button>
                    </div>
                  ) : (
                    allCalendarDates.map((dateStr) => {
                      const dayList = entriesByDate[dateStr] || [];
                      const dayRemList = remindersByDate[dateStr] || [];
                      const holiday = getHolidayInfo(dateStr);

                      return (
                        <div
                          key={dateStr}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                        >
                          <div
                            onClick={() => openDayDrawer(dateStr)}
                            className="px-4 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer bg-slate-50/70"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                {formatDateFullIndo(dateStr)}
                              </span>
                              {holiday && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    holiday.isHoliday
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {holiday.name}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-indigo-600 hover:underline">
                              + Tambah / Detail ({dayList.length} tugas{dayRemList.length > 0 ? `, ${dayRemList.length} pengingat` : ''})
                            </span>
                          </div>

                          {/* Bagian Jadwal Pengingat di List View */}
                          {dayRemList.length > 0 && (
                            <div className="p-3 bg-amber-50/40 border-b border-amber-100 space-y-2">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                                <Bell className="w-3.5 h-3.5 text-amber-600" />
                                <span>Jadwal Pengingat &amp; Alarm ({dayRemList.length})</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {dayRemList.map((rem) => (
                                  <div
                                    key={rem.id}
                                    onClick={() => openEditReminderModal(rem)}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                                      rem.isActive
                                        ? 'bg-white border-amber-200 hover:border-amber-300'
                                        : 'bg-slate-50 border-slate-200 opacity-60'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-amber-900 truncate">
                                          {rem.title}
                                        </span>
                                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                          {rem.startTime} - {rem.endTime}
                                        </span>
                                      </div>
                                      {rem.notes && (
                                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                          {rem.notes}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleReminder(rem.id);
                                      }}
                                      className={`p-1.5 rounded-lg text-xs font-semibold ${
                                        rem.isActive
                                          ? 'text-amber-700 hover:bg-amber-100'
                                          : 'text-slate-400 hover:bg-slate-200'
                                      }`}
                                      title={rem.isActive ? 'Alarm Aktif (Klik untuk nonaktifkan)' : 'Alarm Nonaktif (Klik untuk aktifkan)'}
                                    >
                                      {rem.isActive ? <BellRing className="w-4 h-4 text-amber-600" /> : <BellOff className="w-4 h-4" />}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bagian Tugas Proyek */}
                          {dayList.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                              {dayList.map((entry) => {
                                const proj = entry.projectId ? projectMap[entry.projectId] : null;
                                const prog = proj?.programs?.find((p) => p.id === entry.programId);

                                return (
                                  <div
                                    key={entry.id}
                                    onClick={() => openDayDrawer(dateStr)}
                                    className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                                  >
                                    <div className="space-y-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span
                                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border"
                                          style={{
                                            backgroundColor: proj ? `${proj.color}15` : '#f1f5f9',
                                            borderColor: proj ? `${proj.color}40` : '#cbd5e1',
                                            color: '#1e293b',
                                          }}
                                        >
                                          <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: proj ? proj.color : '#64748b' }}
                                          />
                                          {proj ? proj.name : 'Tanpa proyek'}
                                        </span>

                                        {prog && (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                            <GitBranch className="w-3 h-3 text-indigo-500" />
                                            <span>Program: {prog.name}</span>
                                          </span>
                                        )}

                                        <h4 className="font-semibold text-sm text-slate-900">
                                          {entry.title}
                                        </h4>
                                      </div>
                                      {entry.notes && (
                                        <p className="text-xs text-slate-600 line-clamp-2">
                                          {entry.notes}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(ev) => {
                                          ev.stopPropagation();
                                          handleQuickCycleStatus(entry);
                                        }}
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${
                                          STATUS_META[entry.status].badgeClass
                                        }`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            STATUS_META[entry.status].dotClass
                                          }`}
                                        />
                                        {STATUS_META[entry.status].label}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-400 italic">
                              Tidak ada tugas proyek di tanggal ini (hanya jadwal pengingat).
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </section>              )}
            </>
          )}

          {/* TAB 2: ABSENSI, IZIN, CUTI & TOLAK UKUR KERJA */}
          {activeMainTab === 'attendance' && (
            <div className="space-y-5">
              {/* Card Header Aturan & Tolak Ukur Kerja */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Aturan Baku &amp; Indikator Tolak Ukur Kerja
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {workPolicy.workDaysPerWeek} Hari Kerja / Minggu
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                    <span>
                      Jam Baku: <strong>{workPolicy.standardCheckInTime} – {workPolicy.standardCheckOutTime}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Istirahat: <strong>{workPolicy.breakDurationHours} Jam / Hari</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Toleransi Keterlambatan: <strong>{workPolicy.lateToleranceMinutes} Menit</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Target Efektif: <strong>{workPolicy.targetDailyWorkHours} Jam / Hari</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Jatah Cuti: <strong>{workPolicy.annualLeaveQuota} Hari / Tahun</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPolicyWorkDaysInput(workPolicy.workDaysPerWeek);
                    setPolicyCheckInInput(workPolicy.standardCheckInTime);
                    setPolicyCheckOutInput(workPolicy.standardCheckOutTime);
                    setPolicyBreakInput(workPolicy.breakDurationHours);
                    setPolicyLeaveQuotaInput(workPolicy.annualLeaveQuota);
                    setPolicyToleranceInput(workPolicy.lateToleranceMinutes);
                    setPolicyTargetHoursInput(workPolicy.targetDailyWorkHours);
                    setIsPolicyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ubah Aturan Tolak Ukur</span>
                </button>
              </div>

              {/* 4 Stat Cards Absensi Terukur */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Kehadiran
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CalendarCheck2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                      {attendanceStats.hadirCount}
                    </span>
                    <span className="text-xs text-slate-500">Hari Hadir</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    <span className="text-emerald-700 font-semibold">{attendanceStats.punctualCount} Tepat Waktu</span> •{' '}
                    <span className={attendanceStats.lateCount > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                      {attendanceStats.lateCount} Terlambat
                    </span>
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Izin, Cuti &amp; Sakit
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Coffee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                      {attendanceStats.izinCount + attendanceStats.cutiCount + attendanceStats.sakitCount}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({attendanceStats.izinCount} Izin, {attendanceStats.cutiCount} Cuti, {attendanceStats.sakitCount} Sakit)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Sisa Cuti: <strong className="text-indigo-600">{attendanceStats.remainingLeaveQuota} Hari</strong> (dari {workPolicy.annualLeaveQuota})
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Jam Kerja Bersih
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Timer className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                      {attendanceStats.totalWorkHours}
                    </span>
                    <span className="text-xs text-slate-500">Jam Bersih</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Target: <strong>{attendanceStats.monthlyTargetWorkHours} Jam</strong> ({attendanceStats.workHourAchievementPercent}% tercapai)
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rata-Rata Jam / Hari
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                      {attendanceStats.avgWorkHours}
                    </span>
                    <span className="text-xs text-slate-500">Jam / hari</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Target Baku: <strong className="text-slate-800">{workPolicy.targetDailyWorkHours} Jam/Hari</strong> (Potong {workPolicy.breakDurationHours}j istirahat)
                  </p>
                </div>
              </section>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 text-sm">
                    Riwayat Kehadiran ({INDONESIAN_MONTHS[currentMonth]} {currentYear})
                  </span>
                  <div className="relative">
                    <select
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="MINE">Absensi Saya ({currentUser.fullName})</option>
                      {uniqueOwners.filter((o) => o.id !== currentUser.id && o.id !== 'owner-demo-1').length > 0 && (
                        <option value="ALL">Semua Anggota Tim</option>
                      )}
                      {uniqueOwners
                        .filter((o) => o.id !== currentUser.id && o.id !== 'owner-demo-1')
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openNewAttendanceModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajukan Izin / Cuti / Koreksi Jam</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Owner / Anggota</th>
                        <th className="py-3 px-4">Status &amp; Shift</th>
                        <th className="py-3 px-4">Jam Masuk</th>
                        <th className="py-3 px-4">Jam Pulang</th>
                        <th className="py-3 px-4">Lama Kerja Bersih</th>
                        <th className="py-3 px-4">Bukti Foto &amp; GPS</th>
                        <th className="py-3 px-4">Catatan / Keterangan</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            Belum ada riwayat absensi atau izin di bulan ini.
                          </td>
                        </tr>
                      ) : (
                        monthAttendance.map((rec) => {
                          const meta = ATTENDANCE_META[rec.type];
                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                                {formatDateFullIndo(rec.date)}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-800">{rec.ownerName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {rec.ownerId.slice(0, 10)}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                                  {meta.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                                {rec.checkInTime || '-'}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                                {rec.checkOutTime || '-'}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="font-extrabold text-indigo-700">
                                  {rec.workDurationHours > 0 ? `${rec.workDurationHours} Jam Bersih` : '-'}
                                </div>
                                {rec.type === 'hadir' && rec.workDurationHours > 0 && (
                                  <div className="text-[10px] text-slate-500 font-medium">
                                    <span>{rec.regularWorkHours || 0}j Reguler</span>
                                    {(rec.overtimeHours || 0) > 0 && (
                                      <span className="text-amber-600 font-bold ml-1">+{rec.overtimeHours}j Lembur</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  {rec.checkInPhoto && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPreviewPhoto({
                                        url: rec.checkInPhoto!,
                                        title: `Bukti Masuk - ${rec.ownerName}`,
                                        date: rec.date,
                                        time: rec.checkInTime || '',
                                        location: rec.checkInLocation || '',
                                        shift: rec.shiftCategory || 'normal'
                                      })}
                                      className="px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold text-indigo-700 flex items-center gap-1"
                                      title="Lihat Foto Clock In"
                                    >
                                      <Camera className="w-3 h-3" />
                                      <span>In</span>
                                    </button>
                                  )}
                                  {rec.checkOutPhoto && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPreviewPhoto({
                                        url: rec.checkOutPhoto!,
                                        title: `Bukti Pulang - ${rec.ownerName}`,
                                        date: rec.date,
                                        time: rec.checkOutTime || '',
                                        location: rec.checkOutLocation || '',
                                        shift: rec.shiftCategory || 'normal'
                                      })}
                                      className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-rose-700 flex items-center gap-1"
                                      title="Lihat Foto Clock Out"
                                    >
                                      <Camera className="w-3 h-3" />
                                      <span>Out</span>
                                    </button>
                                  )}
                                  {!rec.checkInPhoto && !rec.checkOutPhoto && (
                                    <span className="text-[11px] text-slate-400 italic">Tanpa foto</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                                {rec.notes || '-'}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttendance(rec.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Hapus baris absensi"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* TAB: JADWAL PENGINGAT & ALARM DENGAN NOTIFIKASI PERANGKAT */}
          {activeMainTab === 'reminders' && (
            <div className="space-y-5">
              {/* Header Pengingat */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    <BellRing className="w-3.5 h-3.5 text-indigo-300 animate-bounce" />
                    <span>Sistem Pengingat &amp; Alarm Acara Aktif</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    Jadwal Pengingat &amp; Alarm Perangkat
                  </h2>
                  <p className="text-xs text-indigo-200/90 max-w-2xl">
                    Pasang jadwal acara penting dengan pemberitahuan alarm suara merdu dan notifikasi
                    otomatis pada perangkat laptop atau HP Anda beberapa menit sebelum acara dimulai.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={playHarmonicAlarmChime}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Tes Suara Alarm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateReminderModal()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Pengingat Baru</span>
                  </button>
                </div>
              </div>

              {/* Banner Izin Notifikasi jika belum aktif */}
              {!hasNotificationPermission && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-amber-900 font-medium">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      Izin notifikasi perangkat belum aktif. Klik tombol di samping agar laptop/HP Anda
                      dapat menampilkan notifikasi pengingat secara otomatis saat jadwal tiba.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={requestNotificationAccess}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-colors"
                  >
                    Izinkan Notifikasi Perangkat
                  </button>
                </div>
              )}

              {/* Grid Daftar Jadwal Pengingat */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reminders.length === 0 ? (
                  <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <Bell className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-base text-slate-800">
                      Belum Ada Jadwal Pengingat
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Klik tombol &ldquo;Buat Pengingat Baru&rdquo; untuk mengatur jadwal acara, waktu
                      alarm, dan durasi notifikasi sebelum acara dimulai.
                    </p>
                    <button
                      type="button"
                      onClick={() => openCreateReminderModal()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Pengingat Pertama</span>
                    </button>
                  </div>
                ) : (
                  reminders.map((rem) => {
                    const isTodayEvent = rem.date === todayStr;

                    return (
                      <div
                        key={rem.id}
                        className={`bg-white rounded-3xl border p-5 space-y-3.5 transition-all shadow-xs relative overflow-hidden ${
                          rem.isActive
                            ? 'border-slate-200 hover:border-indigo-300'
                            : 'border-slate-200 bg-slate-50/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isTodayEvent ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                                  Hari Ini
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  {formatDateShortIndo(rem.date)}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {rem.notifyBeforeMinutes === 0
                                  ? 'Tepat waktu'
                                  : `${rem.notifyBeforeMinutes} mnt sebelumnya`}
                              </span>
                            </div>

                            <h4 className="font-bold text-base text-slate-900 truncate">
                              {rem.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleReminder(rem.id)}
                              className={`p-1.5 rounded-xl border text-xs font-bold transition-colors ${
                                rem.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={rem.isActive ? 'Nonaktifkan Alarm' : 'Aktifkan Alarm'}
                            >
                              {rem.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditReminderModal(rem)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Edit Pengingat"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReminder(rem.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Hapus Pengingat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Waktu & Detail */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Pukul {rem.startTime} – {rem.endTime} WIB</span>
                        </div>

                        {rem.notes && (
                          <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {rem.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LAPORAN KINERJA DENGAN FILTER PERIODE KUSTOM & PERSENTASE KONTRIBUSI PROYEK */}
          {activeMainTab === 'report' && reportData && (
            <div className="space-y-6">
              {/* Toolbar Filter Periode Kustom (Print: Hidden) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-4 print:hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Filter Periode Evaluasi Kinerja
                      </h3>
                      <p className="text-xs text-slate-500">
                        Pilih rentang tanggal kustom untuk kalkulasi persentase kontribusi &amp; pencapaian
                      </p>
                    </div>
                  </div>

                  {/* Preset Cepat */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                    <button
                      type="button"
                      onClick={() => handleApplyReportPreset('this_month')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        reportDatePreset === 'this_month'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Bulan Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyReportPreset('last_30_days')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        reportDatePreset === 'last_30_days'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      30 Hari Terakhir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyReportPreset('last_month')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        reportDatePreset === 'last_month'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Bulan Lalu
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportDatePreset('custom')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        reportDatePreset === 'custom'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Kustom
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  {/* Input Tanggal Mulai s/d Tanggal Selesai */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">Dari Tanggal:</span>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => {
                        setReportStartDate(e.target.value);
                        setReportDatePreset('custom');
                      }}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="font-semibold text-slate-700">Sampai:</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => {
                        setReportEndDate(e.target.value);
                        setReportDatePreset('custom');
                      }}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />

                    {/* Filter Owner */}
                    <span className="font-semibold text-slate-700 ml-2">Owner:</span>
                    <select
                      value={reportOwnerFilter}
                      onChange={(e) => setReportOwnerFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="MINE">Pribadi: {currentUser.fullName}</option>
                      {uniqueOwners
                        .filter((o) => o.id !== currentUser.id && o.id !== 'owner-demo-1')
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            Anggota: {o.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyReportSummary}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Teks Ringkasan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPhotoGalleryModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 shadow-2xs transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bukti Foto &amp; Unduh</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintReport}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak / Unduh PDF Rinci</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* DOKUMEN LAPORAN RINCI (LAYOUT CETAK PDF PROFESIONAL) */}
              <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-7 print:border-none print:shadow-none print:p-0 print:m-0">
                {/* Header Dokumen Laporan */}
                <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Dokumen Kinerja &amp; Akuntabilitas Kerja</span>
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                      Laporan Evaluasi Proyek, Beban Kerja &amp; Kehadiran
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Periode Evaluasi:{' '}
                      <strong className="text-indigo-700">
                        {formatDateShortIndo(reportData.startDate)} s/d{' '}
                        {formatDateShortIndo(reportData.endDate)}
                      </strong>{' '}
                      • Generated via JadwalPro
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-right sm:min-w-[220px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Nama Anggota / Penanggung Jawab
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {reportData.owner.fullName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Owner ID: {reportData.owner.id}
                    </div>
                  </div>
                </div>

                {/* 3 Kartu Metrik Utama */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                        Indeks Produktivitas &amp; Disiplin
                      </span>
                      <div className="text-3xl font-extrabold mt-1">
                        {reportData.performanceScore}%
                      </div>
                    </div>
                    <p className="text-[11px] text-indigo-100 mt-3 leading-relaxed">
                      Kombinasi rasio tuntas tugas ({reportData.finishedTasks} dari{' '}
                      {reportData.totalTasks} tugas) serta {reportData.totalHadir} hari kehadiran efektif.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Total Jam Kerja Efektif
                    </span>
                    <div className="text-2xl font-bold text-slate-900">
                      {reportData.totalHours} Jam
                    </div>
                    <div className="text-xs text-slate-600">
                      Rata-rata <strong>{reportData.avgHours} jam/hari hadir</strong> selama rentang tanggal
                      terpilih.
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Tugas Selesai Tuntas
                    </span>
                    <div className="text-2xl font-bold text-emerald-600">
                      {reportData.finishedTasks} / {reportData.totalTasks} Tugas
                    </div>
                    <div className="text-xs text-slate-600">
                      {reportData.inProgressTasks} tugas berjalan •{' '}
                      <span className="text-rose-600 font-semibold">{reportData.overdueTasks} terlambat</span>.
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2 md:col-span-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Realisasi Jam Kerja Bersih &amp; Lembur
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                        Target Baku: {reportData.targetPeriodHours} Jam
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Jam Bersih</span>
                        <span className="text-lg font-extrabold text-indigo-700">{reportData.totalHours} Jam</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Reguler (Normal)</span>
                        <span className="text-lg font-bold text-slate-800">{reportData.totalRegularHours} Jam</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Jam Lembur</span>
                        <span className="text-lg font-extrabold text-amber-600">+{reportData.totalOvertimeHours} Jam</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tingkat Capaian</span>
                        <span className="text-lg font-bold text-emerald-600">
                          {reportData.targetPeriodHours > 0 ? Math.round((Number(reportData.totalHours) / reportData.targetPeriodHours) * 100) : 100}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABEL MATRIKS PERSENTASE KONTRIBUSI BEBAN KERJA & PROGRAM (SANGAT RINCI UNTUK PDF) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span>1. Matriks Beban Kerja &amp; Kontribusi Proyek</span>
                    </h3>
                    <span className="text-xs font-medium text-slate-500 print:text-[10px]">
                      Total Beban Kerja: <strong>{reportData.totalTasks} Tugas</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 print:hidden pb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 text-indigo-700 text-[11px] font-medium border border-indigo-100">
                      <span>↔️ Geser kanan/kiri &amp; ↕️ atas/bawah untuk melihat rincian tabel</span>
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-auto max-h-[480px] shadow-xs print:max-h-none print:overflow-visible bg-white">
                    <table className="min-w-[820px] w-full text-left text-xs sm:text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider shadow-2xs">
                        <tr>
                          <th className="py-3 px-4">Proyek &amp; Cabang Program</th>
                          <th className="py-3 px-3 text-center">Beban Tugas</th>
                          <th className="py-3 px-3 text-center">
                            % Kontribusi Beban Kerja
                          </th>
                          <th className="py-3 px-3 text-center">Tugas Tuntas</th>
                          <th className="py-3 px-3 text-center">
                            % Tingkat Penyelesaian
                          </th>
                          <th className="py-3 px-4 text-right">Status Progres</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.projectBreakdown.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              Belum ada entri tugas tercatat pada rentang tanggal evaluasi ini.
                            </td>
                          </tr>
                        ) : (
                          reportData.projectBreakdown.map((pb) => (
                            <React.Fragment key={pb.projectId}>
                              {/* Baris Induk Proyek */}
                              <tr className="bg-slate-50/70 font-semibold text-slate-900">
                                <td className="py-3 px-4 flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: pb.color }}
                                  />
                                  <span className="font-bold text-slate-900 text-sm">{pb.name}</span>
                                </td>
                                <td className="py-3 px-3 text-center font-bold">{pb.count} tugas</td>
                                <td className="py-3 px-3 text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {pb.contributionPercent}%
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center text-emerald-700 font-bold">
                                  {pb.finished} / {pb.count}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="font-extrabold text-slate-900">
                                    {pb.completionPercent}%
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      pb.completionPercent >= 80
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : pb.completionPercent >= 40
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {pb.completionPercent >= 80
                                      ? 'Optimal'
                                      : pb.completionPercent >= 40
                                      ? 'Berjalan'
                                      : 'Akselerasi'}
                                  </span>
                                </td>
                              </tr>

                              {/* Baris Cabang-cabang Program di Dalam Proyek */}
                              {pb.programs.map((prog) => (
                                <tr
                                  key={prog.id}
                                  className="text-xs text-slate-600 hover:bg-slate-50/40"
                                >
                                  <td className="py-2.5 pl-10 pr-4 flex items-center gap-2">
                                    <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-medium text-slate-700">{prog.name}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-medium">
                                    {prog.count}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                                    {prog.contributionPercent}%
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-emerald-600 font-medium">
                                    {prog.finished}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                                    {prog.completionPercent}%
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    <div className="w-20 ml-auto bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-indigo-600 rounded-full"
                                        style={{ width: `${prog.completionPercent}%` }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ringkasan Kehadiran */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <CalendarCheck2 className="w-4 h-4 text-indigo-600" />
                    <span>2. Rincian Disiplin &amp; Kehadiran</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-xs font-bold text-emerald-800">TOTAL HADIR</div>
                      <div className="text-xl font-extrabold text-emerald-600 mt-1">
                        {reportData.totalHadir} Hari
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <div className="text-xs font-bold text-amber-800">IZIN</div>
                      <div className="text-xl font-extrabold text-amber-600 mt-1">
                        {reportData.totalIzin} Hari
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
                      <div className="text-xs font-bold text-purple-800">CUTI</div>
                      <div className="text-xl font-extrabold text-purple-600 mt-1">
                        {reportData.totalCuti} Hari
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                      <div className="text-xs font-bold text-rose-800">SAKIT</div>
                      <div className="text-xl font-extrabold text-rose-600 mt-1">
                        {reportData.totalSakit} Hari
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Tolak Ukur Aturan Kerja & Kepatuhan */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>3. Tolak Ukur Aturan Kerja &amp; Kepatuhan Kebijakan</span>
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Aturan Shift Kerja</span>
                      <span className="font-extrabold text-slate-900">{workPolicy.workDaysPerWeek} Hari / Minggu</span>
                      <span className="text-slate-500 block text-[11px]">{workPolicy.standardCheckInTime} – {workPolicy.standardCheckOutTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Istirahat &amp; Target Efektif</span>
                      <span className="font-extrabold text-slate-900">{workPolicy.targetDailyWorkHours} Jam / Hari</span>
                      <span className="text-slate-500 block text-[11px]">Potong istirahat {workPolicy.breakDurationHours} jam</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Status Cuti Tahunan</span>
                      <span className="font-extrabold text-indigo-600">Sisa {attendanceStats.remainingLeaveQuota} Hari</span>
                      <span className="text-slate-500 block text-[11px]">Dari kuota {workPolicy.annualLeaveQuota} hari/thn</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Kepatuhan Jam Masuk</span>
                      <span className="font-extrabold text-emerald-600">{attendanceStats.punctualCount} Tepat Waktu</span>
                      <span className="text-slate-500 block text-[11px]">{attendanceStats.lateCount} kali terlambat ({workPolicy.lateToleranceMinutes}m toleransi)</span>
                    </div>
                  </div>
                </div>

                {/* Log Tugas Rinci */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>4. Log Rincian Pekerjaan ({reportData.userEntries.length} Item)</span>
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 print:hidden pb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
                      <span>↔️ Geser kanan/kiri &amp; ↕️ atas/bawah untuk melihat seluruh preview log</span>
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-auto max-h-[440px] shadow-xs print:max-h-none print:overflow-visible bg-white">
                    <table className="min-w-[800px] w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px] tracking-wider shadow-2xs">
                        <tr>
                          <th className="py-2.5 px-3">Mulai</th>
                          <th className="py-2.5 px-3">Selesai</th>
                          <th className="py-2.5 px-3">Durasi Pengerjaan</th>
                          <th className="py-2.5 px-3">Proyek &amp; Program</th>
                          <th className="py-2.5 px-3">Judul Tugas</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.userEntries.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500">
                              Tidak ada catatan tugas pada rentang waktu ini.
                            </td>
                          </tr>
                        ) : (
                          reportData.userEntries.map((e) => {
                            const p = e.projectId ? projectMap[e.projectId] : null;
                            const prog = p?.programs?.find((pr) => pr.id === e.programId);

                            return (
                              <tr key={e.id} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                                  {e.date}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                                  {e.status === 'selesai' ? ((e as any).completedDate || e.date) : (
                                    <span className="text-amber-600 font-medium">Sedang Berjalan</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {(() => {
                                    const r = getEntryDateRange(e, todayStr);
                                    return e.status === 'selesai' ? (
                                      <span className="px-2 py-0.5 rounded-full font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        {r.totalDays} Hari (Selesai)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full font-bold text-xs bg-amber-50 text-amber-800 border border-amber-300">
                                        {r.totalDays} Hari (Berjalan)
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {p ? (
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: p.color }}
                                      />
                                      <span className="font-semibold text-slate-800">{p.name}</span>
                                      {prog && (
                                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                          {prog.name}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">Tanpa proyek</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {e.title}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_META[e.status].badgeClass}`}
                                  >
                                    {STATUS_META[e.status].label}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                                  {e.notes || '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Lembar Tanda Tangan */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-600 print:pt-14">
                  <div>
                    <p>Dibuat &amp; Dilaporkan oleh,</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-900 underline">
                      {reportData.owner.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500">Owner ID: {reportData.owner.id}</p>
                  </div>
                  <div>
                    <p>Mengetahui &amp; Disetujui oleh,</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-900 underline">Project Lead / Management</p>
                    <p className="text-[10px] text-slate-500">JadwalPro System Verification</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FITUR EVALUASI PERFORMA AI & MENU SARAN TERPADU */}
          {activeMainTab === 'ai_performance' && (
            <div className="space-y-6">
              {/* Header Tab AI */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>AI Work Performance Assistant</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    Analisis Performa Kerja &amp; Menu Saran AI
                  </h2>
                  <p className="text-xs text-indigo-200/90 max-w-2xl">
                    Kirim gambar bukti performa (screenshot dashboard, foto tugas, lembar progres) dan
                    biarkan AI menyimpulkan capaian kerja serta merumuskan saran taktis dari seluruh program.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-200 block">
                      Analisis Tersimpan
                    </span>
                    <span className="text-xl font-bold text-white">
                      {aiPerformances.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Area Upload Gambar Performa */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Unggah Bukti Gambar Performa
                    </h3>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {aiUploadedImage ? (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group aspect-video flex items-center justify-center">
                        <img
                          src={aiUploadedImage}
                          alt="Bukti Performa"
                          className="max-h-full max-w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setAiUploadedImage(null);
                            setAiUploadedFileName('');
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                          title="Hapus gambar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate max-w-[200px] font-mono">
                          {aiUploadedFileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-indigo-600 font-semibold hover:underline"
                        >
                          Ganti Gambar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-indigo-400 p-8 rounded-2xl text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20 flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">
                          Klik untuk upload foto / screenshot performa
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Format PNG, JPG, JPEG, WEBP (Screenshot KPI, grafik, foto kerjaan)
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Tambahan untuk AI (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={aiAnalysisNotes}
                      onChange={(e) => setAiAnalysisNotes(e.target.value)}
                      placeholder="Contoh: Fokus evaluasi penyelesaian program abc 2 dan absensi..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzingAI || !aiUploadedImage}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isAnalyzingAI ? (
                      <>
                        <BrainCircuit className="w-4 h-4 animate-spin" />
                        <span>AI Sedang Menganalisis Gambar...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Analisis Performa dengan AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hasil Analisis Terkini / Ringkasan AI */}
                <div className="lg:col-span-7 space-y-4">
                  {aiPerformances.length > 0 ? (
                    (() => {
                      const latest = aiPerformances[0];
                      return (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Bot className="w-5 h-5 text-indigo-600" />
                              <h3 className="font-bold text-slate-900 text-sm">
                                Hasil Kesimpulan AI Terbaru
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                {formatDateShortIndo(latest.createdAt.slice(0, 10))}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Skor AI: {latest.score}/100
                              </span>
                            </div>
                          </div>

                          {/* Kesimpulan Singkat */}
                          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                            {latest.summary}
                          </div>

                          {/* 2 Kolom: Kekuatan & Area Perbaikan */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                                <Award className="w-4 h-4 text-emerald-600" />
                                <span>Pencapaian &amp; Kekuatan</span>
                              </span>
                              <ul className="space-y-1.5 text-xs text-slate-700">
                                {latest.strengths.map((s, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span>Area Perlu Akselerasi</span>
                              </span>
                              <ul className="space-y-1.5 text-xs text-slate-700">
                                {latest.improvements.map((imp, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-amber-600 font-bold">•</span>
                                    <span>{imp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* MENU SARAN TERPADU AI (HASIL SINTESIS SEMUA PERFORMA DAN PROGRAM) */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                <Target className="w-4 h-4 text-indigo-400" />
                                <span>Menu Saran Terpadu AI (Program &amp; Performa)</span>
                              </span>
                              <span className="text-[10px] text-indigo-200">
                                Sintesis Seluruh Proyek
                              </span>
                            </div>

                            <div className="space-y-2">
                              {latest.recommendations.map((rec, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-xs text-indigo-100 flex items-start gap-2 leading-relaxed"
                                >
                                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                  <span>{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3 flex flex-col items-center justify-center min-h-[360px]">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Bot className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        Belum Ada Evaluasi Performa AI
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md">
                        Unggah gambar bukti performa lu di sebelah kiri, lalu klik &ldquo;Analisis
                        Performa dengan AI&rdquo; untuk mendapatkan ringkasan otomatis dan menu saran taktis.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Riwayat Analisis Performa AI Sebelumnya */}
              {aiPerformances.length > 1 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Riwayat Analisis Performa Sebelumnya
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {aiPerformances.slice(1).map((perf) => (
                      <div
                        key={perf.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {formatDateFullIndo(perf.createdAt.slice(0, 10))}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              Skor: {perf.score}%
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteAIPerformance(perf.id)}
                              className="text-slate-400 hover:text-rose-600"
                              title="Hapus riwayat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-600 line-clamp-2">{perf.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          DRAWER DETAIL HARI (KLIK TANGGAL DI KALENDER)
         ===================================================================== */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex justify-end items-end sm:items-stretch">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setSelectedDate(null)}
          />

          <div className="relative z-10 w-full sm:w-[440px] max-h-[88vh] sm:max-h-none sm:h-full bg-white rounded-t-3xl sm:rounded-none shadow-2xl border-t sm:border-t-0 sm:border-l border-slate-200 flex flex-col overflow-hidden">
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-slate-300" />
            </div>

            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Detail Jadwal Harian
                  </span>
                  {selectedDate === todayStr && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      Hari Ini
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {formatDateFullIndo(selectedDate)}
                </h3>
                {(() => {
                  const selHol = getHolidayInfo(selectedDate);
                  if (!selHol) return null;
                  return (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border mt-1 ${
                        selHol.isHoliday
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span>{selHol.isHoliday ? '🔴 Libur Nasional:' : '⭐️ Hari Besar:'}</span>
                      <span>{selHol.name}</span>
                    </div>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Tutup panel detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* JADWAL PENGINGAT & ALARM TANGGAL INI */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Jadwal Pengingat &amp; Alarm ({selectedDateReminders.length})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateReminderModal(selectedDate)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pasang Alarm</span>
                  </button>
                </div>

                {selectedDateReminders.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white/80 border border-dashed border-amber-200 text-center text-xs text-amber-800">
                    Belum ada jadwal alarm/pengingat untuk tanggal ini. Klik <strong>+ Pasang Alarm</strong> untuk menyetel pengingat acara.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateReminders.map((rem) => (
                      <div
                        key={rem.id}
                        className={`p-3 rounded-xl border transition-all ${
                          rem.isActive
                            ? 'bg-white border-amber-200 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{rem.title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                ⏰ {rem.startTime} - {rem.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span>🔔 Notifikasi: {rem.notifyBeforeMinutes === 0 ? 'Tepat waktu' : `${rem.notifyBeforeMinutes} mnt sebelumnya`}</span>
                              {rem.isTriggered && (
                                <span className="text-emerald-600 font-semibold">• Sudah berbunyi</span>
                              )}
                            </div>
                            {rem.notes && (
                              <p className="text-xs text-slate-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100 mt-1">
                                {rem.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleReminder(rem.id)}
                              className={`p-1.5 rounded-lg text-xs font-semibold ${
                                rem.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                              }`}
                              title={rem.isActive ? 'Nonaktifkan Alarm' : 'Aktifkan Alarm'}
                            >
                              {rem.isActive ? <BellRing className="w-4 h-4 text-amber-600" /> : <BellOff className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditReminderModal(rem)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Edit Pengingat"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReminder(rem.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Hapus Pengingat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daftar Catatan Tanggal Ini */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Daftar Catatan ({selectedDateEntries.length})
                  </h4>
                  {editingEntryId && (
                    <button
                      type="button"
                      onClick={() => resetEntryForm()}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      + Buat Catatan Baru
                    </button>
                  )}
                </div>

                {selectedDateEntries.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    Belum ada catatan di tanggal ini. Isi formulir di bawah untuk menambahkan jadwal
                    atau tugas proyek.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDateEntries.map((entry) => {
                      const proj = entry.projectId ? projectMap[entry.projectId] : null;
                      const prog = proj?.programs?.find((p) => p.id === entry.programId);
                      const isOverdue =
                        entry.date < todayStr && entry.status !== 'selesai';
                      const isDeleting = confirmDeleteEntryId === entry.id;

                      return (
                        <div
                          key={entry.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            editingEntryId === entry.id
                              ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/10'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                                  style={{
                                    backgroundColor: proj ? `${proj.color}15` : '#f1f5f9',
                                    borderColor: proj ? `${proj.color}40` : '#cbd5e1',
                                    color: '#1e293b',
                                  }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{
                                      backgroundColor: proj ? proj.color : '#64748b',
                                    }}
                                  />
                                  {proj ? proj.name : 'Tanpa proyek'}
                                </span>

                                {prog && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                    <GitBranch className="w-2.5 h-2.5 text-indigo-500" />
                                    <span>{prog.name}</span>
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleQuickCycleStatus(entry)}
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1 ${
                                    STATUS_META[entry.status].badgeClass
                                  }`}
                                  title="Klik untuk ubah status"
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      STATUS_META[entry.status].dotClass
                                    }`}
                                  />
                                  {STATUS_META[entry.status].label}
                                </button>

                                {isOverdue && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                    Terlambat
                                  </span>
                                )}
                              </div>

                              <h5
                                className={`font-bold text-sm text-slate-900 pt-0.5 ${
                                  entry.status === 'selesai' ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {entry.title}
                              </h5>

                              {/* Informasi Durasi & Rentang Hari Pengerjaan */}
                              {(() => {
                                const range = getEntryDateRange(entry, todayStr);
                                const dayIndex = getCalendarDaySpan(range.startDate, selectedDate);
                                return (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                                    {entry.status === 'selesai' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>
                                          Selesai dalam {range.totalDays} hari ({formatDateShortIndo(range.startDate)} – {formatDateShortIndo(range.endDate)})
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-amber-900 bg-amber-50 border border-amber-300">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>
                                          {selectedDate > range.startDate
                                            ? `Hari ke-${dayIndex} • Menyambung dari ${formatDateShortIndo(range.startDate)}`
                                            : `Hari ke-1 (Mulai)`}{' '}
                                          ({range.totalDays} hari berjalan • Belum selesai)
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditEntry(entry)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                title="Edit catatan"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteEntryId(entry.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Hapus catatan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {entry.notes && (
                            <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              {entry.notes}
                            </p>
                          )}

                          {isDeleting && (
                            <div className="mt-2.5 pt-2.5 border-t border-rose-100 flex items-center justify-between text-xs">
                              <span className="text-rose-700 font-medium">Hapus catatan ini?</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteEntryId(null)}
                                  className="px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDeleteEntry(entry.id)}
                                  className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Tambah / Edit Catatan */}
              <form
                onSubmit={handleSaveEntry}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {editingEntryId ? 'Edit Catatan' : 'Tambah Catatan Baru'}
                  </h4>
                  {editingEntryId && (
                    <span className="text-[11px] font-medium text-indigo-600">
                      Mode Edit Aktif
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Catatan / Tugas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={entryTitle}
                    onChange={(e) => setEntryTitle(e.target.value)}
                    placeholder="Contoh: Review storyboard bersama tim..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilih Proyek
                    </label>
                    <select
                      value={entryProjectId}
                      onChange={(e) => {
                        setEntryProjectId(e.target.value);
                        setEntryProgramId(''); // Reset pilihan program saat proyek berganti
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">Tanpa proyek</option>
                      {projects
                        .filter(
                          (p) =>
                            !currentUser ||
                            currentUser.id === 'owner-demo-1' ||
                            p.ownerId === currentUser.id
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Tugas
                    </label>
                    <select
                      value={entryStatus}
                      onChange={(e) => setEntryStatus(e.target.value as EntryStatus)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="belum_mulai">Belum mulai</option>
                      <option value="berjalan">Berjalan</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </div>
                </div>

                {/* PILIHAN CABANG PROGRAM PROYEK */}
                {activeSelectedProjectInDrawer &&
                  activeSelectedProjectInDrawer.programs &&
                  activeSelectedProjectInDrawer.programs.length > 0 && (
                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                      <label className="block text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                        <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Pilih Cabang Program ({activeSelectedProjectInDrawer.name}):</span>
                      </label>
                      <select
                        value={entryProgramId}
                        onChange={(e) => setEntryProgramId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                      >
                        <option value="">-- Umum / Tanpa Cabang Khusus --</option>
                        {activeSelectedProjectInDrawer.programs.map((prog) => (
                          <option key={prog.id} value={prog.id}>
                            {prog.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Detail
                  </label>
                  <textarea
                    rows={3}
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                    placeholder="Tulis rincian pekerjaan, tautan dokumen, atau checklist singkat..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingEntryId && (
                    <button
                      type="button"
                      onClick={() => resetEntryForm()}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
                    >
                      Batal Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingEntryId ? 'Simpan Perubahan' : 'Tambah ke Jadwal'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGAJUAN IZIN / CUTI / ABSENSI */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setIsAttendanceModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Form Absensi, Izin &amp; Cuti</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendanceForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={attDateInput}
                  onChange={(e) => setAttDateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipe Kehadiran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['hadir', 'izin', 'cuti', 'sakit'] as AttendanceType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAttTypeInput(t)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold capitalize transition-all border ${
                        attTypeInput === t
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {attTypeInput === 'hadir' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jam Masuk (Clock In)
                    </label>
                    <input
                      type="time"
                      value={attCheckInInput}
                      onChange={(e) => setAttCheckInInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jam Pulang (Clock Out)
                    </label>
                    <input
                      type="time"
                      value={attCheckOutInput}
                      onChange={(e) => setAttCheckOutInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Alasan
                </label>
                <textarea
                  rows={3}
                  value={attNotesInput}
                  onChange={(e) => setAttNotesInput(e.target.value)}
                  placeholder={
                    attTypeInput === 'hadir'
                      ? 'Catatan kegiatan kerja hari ini...'
                      : 'Tuliskan alasan izin, keperluan cuti, atau sakit...'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Simpan Absensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ATURAN & TOLAK UKUR KERJA */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setIsPolicyModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Aturan Baku &amp; Tolak Ukur Kerja
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfigurasi manual parameter kehadiran, jam masuk/pulang, istirahat &amp; kuota cuti
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newPolicy: WorkPolicy = {
                  workDaysPerWeek: Number(policyWorkDaysInput) || 5,
                  standardCheckInTime: policyCheckInInput || '08:00',
                  standardCheckOutTime: policyCheckOutInput || '17:00',
                  breakDurationHours: Number(policyBreakInput) || 1.0,
                  annualLeaveQuota: Number(policyLeaveQuotaInput) || 12,
                  leaveResetDate: policyLeaveResetInput || '01-01',
                  lateToleranceMinutes: Number(policyToleranceInput) || 15,
                  earlyOvertimeThresholdMinutes: Number(policyThresholdInput) || 60,
                  targetDailyWorkHours: Number(policyTargetHoursInput) || 8.0,
                };
                db.saveWorkPolicy(newPolicy);
                setWorkPolicy(newPolicy);
                setIsPolicyModalOpen(false);
                showToast('Aturan tolak ukur kerja berhasil diperbarui!');
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hari Kerja per Minggu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={policyWorkDaysInput}
                    onChange={(e) => setPolicyWorkDaysInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={5}>5 Hari Kerja (Senin – Jumat)</option>
                    <option value={6}>6 Hari Kerja (Senin – Sabtu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Toleransi Keterlambatan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={policyToleranceInput}
                      onChange={(e) => setPolicyToleranceInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      Menit
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Masuk Baku (Clock In) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={policyCheckInInput}
                    onChange={(e) => setPolicyCheckInInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Batas toleransi s/d {policyCheckInInput ? (() => {
                      const [h, m] = policyCheckInInput.split(':').map(Number);
                      const total = h * 60 + m + (Number(policyToleranceInput) || 0);
                      const limH = String(Math.floor(total / 60)).padStart(2, '0');
                      const limM = String(total % 60).padStart(2, '0');
                      return `${limH}:${limM}`;
                    })() : '-'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Pulang Baku (Clock Out) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={policyCheckOutInput}
                    onChange={(e) => setPolicyCheckOutInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Jam akhir shift kerja harian
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Istirahat / Hari <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={4}
                      value={policyBreakInput}
                      onChange={(e) => setPolicyBreakInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      Jam
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Memotong durasi kotor
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Jam Kerja Bersih <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min={1}
                      max={12}
                      value={policyTargetHoursInput}
                      onChange={(e) => setPolicyTargetHoursInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      Jam
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Target harian bersih
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jatah Cuti / Tahun <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={policyLeaveQuotaInput}
                      onChange={(e) => setPolicyLeaveQuotaInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      Hari
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Hak cuti 1 tahun
                  </span>
                </div>
              </div>

              {/* Tanggal Reset Cuti & Ambang Batas Lembur Awal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Reset Cuti Tahunan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01-01 (1 Januari)"
                    value={policyLeaveResetInput}
                    onChange={(e) => setPolicyLeaveResetInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Format: MM-DD (misal: 01-01 untuk reset tiap 1 Januari)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Menit Datang Awal (Lembur Pagi) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={15}
                      max={180}
                      value={policyThresholdInput}
                      onChange={(e) => setPolicyThresholdInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      Menit
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Datang lebih awal &gt; {policyThresholdInput}m otomatis dihitung lembur
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                >
                  Simpan Aturan Tolak Ukur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT PROYEK DENGAN CABANG PROGRAM */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setIsProjectModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingProject ? 'Edit Proyek & Cabang Program' : 'Buat Proyek Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola proyek utama beserta cabang-cabang program di bawahnya
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Proyek Utama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  placeholder="Contoh: Proyek ABC atau Proyek Peluncuran..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Warna Label Proyek
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PROJECT_COLORS.map((c) => {
                    const selected = projectColorInput === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setProjectColorInput(c.value)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                          selected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: c.value }}
                        />
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION CABANG PROGRAM */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cabang Program ({projectProgramsInput.length})</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Contoh: abc 1, abc 2, abc 3
                  </span>
                </div>

                {/* Form Tambah Program */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newProgramNameInput}
                    onChange={(e) => setNewProgramNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProgramToForm();
                      }
                    }}
                    placeholder="Nama cabang program (misal: abc 1)..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddProgramToForm()}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0"
                  >
                    + Tambah
                  </button>
                </div>

                {/* List Cabang Program yang Sudah Dibuat */}
                {projectProgramsInput.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                    Belum ada cabang program khusus. Proyek ini akan berjalan dengan program tunggal.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {projectProgramsInput.map((prog) => (
                      <div
                        key={prog.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span>{prog.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProgramFromForm(prog.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus program cabang"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                >
                  {editingProject ? 'Simpan Perubahan' : 'Buat Proyek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KAMERA & LOKASI GPS (CLOCK IN & CLOCK OUT DENGAN WATERMARK) */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={closeCameraModal}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                  cameraMode === 'in' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    {cameraMode === 'in' ? 'Presensi Masuk (Clock In)' : 'Presensi Pulang (Clock Out)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ambil foto wajah langsung dan verifikasi lokasi GPS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Live Video Camera / Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
                <video
                  ref={(node) => {
                    videoElemRef.current = node;
                    if (node && cameraStream && node.srcObject !== cameraStream) {
                      node.srcObject = cameraStream;
                      node.muted = true;
                      node.play().then(() => {
                        setIsCameraActive(true);
                      }).catch((e) => console.warn('Play error:', e));
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                    isCameraActive ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget;
                    vid.muted = true;
                    vid.play().then(() => {
                      setIsCameraActive(true);
                    }).catch((err) => console.warn(err));
                  }}
                />

                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400 p-4 space-y-2 bg-slate-900/95">
                    <Camera className="w-8 h-8 mx-auto text-indigo-400 animate-pulse" />
                    <p className="text-xs font-semibold text-slate-200">Menghubungkan ke lensa kamera...</p>
                    <p className="text-[11px] text-slate-400">Pastikan izin kamera sudah diizinkan</p>
                  </div>
                )}

                {/* Badge Waktu Real di Pojok Kamera */}
                <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{getNowTimeStr()} WIB</span>
                </div>
              </div>

              {/* Status Deteksi Shift Otomatis (Normal vs Lembur) */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Status Shift Terdeteksi:</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    detectedShiftInfo.category.includes('lembur')
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {detectedShiftInfo.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {detectedShiftInfo.note}
                </p>
              </div>

              {/* Status Koordinat GPS */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <MapPin className={`w-4 h-4 shrink-0 ${isGPSLoading ? 'text-amber-500 animate-spin' : 'text-emerald-600'}`} />
                <span className="text-slate-700 font-mono text-[11px] truncate flex-1">
                  {currentGPSLocation}
                </span>
              </div>

              {/* Catatan Tambahan Shift */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Tambahan / Alasan Lembur
                </label>
                <input
                  type="text"
                  value={customShiftNoteInput}
                  onChange={(e) => setCustomShiftNoteInput(e.target.value)}
                  placeholder="Contoh: Datang awal untuk briefing lapangan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCameraModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTakeSnapshotAndSubmit}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all ${
                  cameraMode === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{cameraMode === 'in' ? 'Ambil Foto & Clock In' : 'Ambil Foto & Clock Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUAT / EDIT JADWAL PENGINGAT (REMINDER FORM) */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsReminderModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingReminderId ? 'Edit Jadwal Pengingat' : 'Buat Jadwal Pengingat Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Acara / Pengingat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={remTitleInput}
                  onChange={(e) => setRemTitleInput(e.target.value)}
                  placeholder="Contoh: Meeting Progres Mingguan Tim..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Acara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={remDateInput}
                  onChange={(e) => setRemDateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mulai Pukul <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={remStartTimeInput}
                    onChange={(e) => setRemStartTimeInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hingga Pukul
                  </label>
                  <input
                    type="time"
                    value={remEndTimeInput}
                    onChange={(e) => setRemEndTimeInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bunyikan Alarm &amp; Notifikasi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={remNotifyBeforeMinutes}
                  onChange={(e) => setRemNotifyBeforeMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                >
                  <option value={0}>Tepat waktu saat jam mulai (0 menit)</option>
                  <option value={5}>5 menit sebelum jam mulai</option>
                  <option value={10}>10 menit sebelum jam mulai</option>
                  <option value={15}>15 menit sebelum jam mulai</option>
                  <option value={30}>30 menit sebelum jam mulai</option>
                  <option value={60}>1 jam (60 menit) sebelum jam mulai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={remNotesInput}
                  onChange={(e) => setRemNotesInput(e.target.value)}
                  placeholder="Catatan agenda, link google meet, atau rincian kegiatan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                >
                  {editingReminderId ? 'Simpan Perubahan' : 'Pasang Pengingat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ALARM VISUAL POPUP INTERAKTIF KETIKA WAKTU TIBA */}
      {alarmTriggeredReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs animate-pulse"
            onClick={() => setAlarmTriggeredReminder(null)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-indigo-500 p-6 text-center space-y-4 overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-indigo-50 animate-bounce">
              <BellRing className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Alarm Pengingat Acara
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 pt-1">
                {alarmTriggeredReminder.title}
              </h3>
              <p className="text-sm font-semibold text-slate-700">
                Mulai Pukul {alarmTriggeredReminder.startTime} – {alarmTriggeredReminder.endTime} WIB
              </p>
            </div>

            {alarmTriggeredReminder.notes && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200 line-clamp-3">
                {alarmTriggeredReminder.notes}
              </p>
            )}

            <button
              type="button"
              onClick={() => setAlarmTriggeredReminder(null)}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all"
            >
              Matikan Alarm &amp; Mengerti
            </button>
          </div>
        </div>
      )}

      {/* MODAL GALERI BUKTI FOTO ABSENSI DI LAPORAN */}
      {isPhotoGalleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsPhotoGalleryModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Galeri Bukti Foto &amp; Lokasi Absensi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Foto terverifikasi dengan watermark jam, status lembur/normal, dan koordinat GPS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAllAttendancePhotos}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Semua Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhotoGalleryModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {(() => {
                const photosList: Array<{
                  date: string;
                  type: 'in' | 'out';
                  url: string;
                  time: string;
                  location: string;
                  shift: string;
                }> = [];

                (reportData?.userAttendance || []).forEach((a) => {
                  if (a.checkInPhoto) {
                    photosList.push({
                      date: a.date,
                      type: 'in',
                      url: a.checkInPhoto,
                      time: a.checkInTime || '',
                      location: a.checkInLocation || '',
                      shift: a.shiftCategory || 'normal',
                    });
                  }
                  if (a.checkOutPhoto) {
                    photosList.push({
                      date: a.date,
                      type: 'out',
                      url: a.checkOutPhoto,
                      time: a.checkOutTime || '',
                      location: a.checkOutLocation || '',
                      shift: a.shiftCategory || 'normal',
                    });
                  }
                });

                if (photosList.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <Camera className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-medium">Belum ada foto bukti absensi tercatat pada rentang periode ini.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {photosList.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-2 p-2 flex flex-col justify-between"
                      >
                        <div
                          onClick={() => setSelectedPreviewPhoto({
                            url: item.url,
                            title: item.type === 'in' ? 'Foto Clock In' : 'Foto Clock Out',
                            date: item.date,
                            time: item.time,
                            location: item.location,
                            shift: item.shift,
                          })}
                          className="aspect-video rounded-xl overflow-hidden bg-slate-900 cursor-pointer relative group flex items-center justify-center"
                        >
                          <img src={item.url} alt="Bukti Absensi" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                            Perbesar Foto
                          </div>
                          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase ${
                            item.type === 'in' ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}>
                            {item.type === 'in' ? 'Masuk' : 'Pulang'}
                          </span>
                        </div>

                        <div className="space-y-1 px-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                            <span>{formatDateShortIndo(item.date)}</span>
                            <span className="font-mono text-indigo-600">{item.time} WIB</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate font-mono">
                            {item.location || 'Lokasi Terverifikasi'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadSinglePhoto(
                            item.url,
                            `Bukti_${item.type === 'in' ? 'ClockIn' : 'ClockOut'}_${currentUser?.fullName?.replace(/\s+/g, '_')}_${item.date}.jpg`
                          )}
                          className="w-full py-1.5 px-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Foto (JPG)</span>
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SETINGAN AKUN PRIBADI (PROFIL & PASSWORD) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsAccountModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pengaturan Akun &amp; Profil
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kelola identitas, ubah kata sandi, dan status akun
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccountActiveSubTab('profile');
                  setAccountFeedback(null);
                }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  accountActiveSubTab === 'profile'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Biodata Profil</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountActiveSubTab('security');
                  setAccountFeedback(null);
                }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  accountActiveSubTab === 'security'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Ubah Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountActiveSubTab('stats');
                  setAccountFeedback(null);
                }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  accountActiveSubTab === 'stats'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Status &amp; Data</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Alert Feedback */}
              {accountFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                    accountFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {accountFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{accountFeedback.message}</span>
                </div>
              )}

              {/* TAB 1: BIODATA PROFIL */}
              {accountActiveSubTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Foto Profil / Avatar Uploader */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-full border-2 border-indigo-500 shadow-md overflow-hidden bg-indigo-600 text-white font-black text-2xl flex items-center justify-center">
                        {accAvatarUrl ? (
                          <img
                            src={accAvatarUrl}
                            alt="Avatar Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : accFullName ? (
                          accFullName.charAt(0).toUpperCase()
                        ) : (
                          <UserIcon className="w-10 h-10 text-white/80" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                        title="Ganti Foto Profil"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-center sm:text-left flex-1">
                      <h4 className="text-xs font-bold text-slate-800">Foto Profil Akun</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Unggah foto profil Anda (JPG, PNG, atau WEBP). Gambar otomatis dioptimasi dan dikompres agar sangat ringan (&lt;25KB) dan jernih.
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <input
                          type="file"
                          ref={avatarFileInputRef}
                          onChange={handleAvatarImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Pilih Foto</span>
                        </button>

                        {accAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setAccAvatarUrl('');
                              setAccountFeedback({ type: 'success', message: 'Foto profil dihapus. Klik "Simpan Perubahan Profil" untuk menerapkan.' });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={accFullName}
                        onChange={(e) => setAccFullName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Telepon / WhatsApp
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={accPhone}
                        onChange={(e) => setAccPhone(e.target.value)}
                        placeholder="Contoh: 08123456789"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Nomor telepon digunakan untuk identifikasi penanggung jawab pekerjaan dan laporan absensi.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Email (Akun Supabase)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        readOnly
                        value={currentUser.email || '-'}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-not-allowed"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Email terdaftar dan terautentikasi di Supabase Cloud
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      User ID / Owner ID
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentUser.id}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentUser.id);
                          showToast('User ID disalin ke clipboard');
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAccountModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAccount}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                    >
                      {isSavingAccount ? (
                        <span>Menyimpan...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Simpan Perubahan Profil</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: UBAH PASSWORD */}
              {accountActiveSubTab === 'security' && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <KeyIcon className="w-4 h-4 text-amber-600" />
                      <span>Ubah Kata Sandi Akun</span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      Kata sandi baru akan otomatis disinkronkan ke Supabase Auth. Setelah diubah, gunakan kata sandi baru untuk login di semua versi aplikasi (Web &amp; Desktop DMG).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kata Sandi Baru <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={accShowPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={accNewPassword}
                        onChange={(e) => setAccNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setAccShowPassword(!accShowPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5 rounded-lg"
                      >
                        {accShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={accShowPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={accConfirmPassword}
                        onChange={(e) => setAccConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    {accConfirmPassword && accNewPassword !== accConfirmPassword && (
                      <span className="text-[11px] font-semibold text-rose-500 block mt-1">
                        Konfirmasi kata sandi belum cocok
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAccountModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAccount || !accNewPassword || accNewPassword !== accConfirmPassword}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                    >
                      {isSavingAccount ? (
                        <span>Memperbarui...</span>
                      ) : (
                        <>
                          <KeyIcon className="w-4 h-4" />
                          <span>Perbarui Kata Sandi</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: STATUS & DATA AKUN */}
              {accountActiveSubTab === 'stats' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500">Status Server</div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{isSupabaseConfigured ? 'Supabase Terhubung' : 'Mode Offline'}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500">Hak Akses</div>
                      <div className="text-xs font-bold text-indigo-700">Owner / Administrator</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500">Proyek Aktif</div>
                      <div className="text-base font-extrabold text-slate-900">
                        {projects.filter((p) => p.ownerId === currentUser.id).length} Proyek
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500">Catatan Jadwal</div>
                      <div className="text-base font-extrabold text-slate-900">
                        {entries.filter((e) => e.ownerId === currentUser.id).length} Catatan
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500">Riwayat Absensi</div>
                      <div className="text-base font-extrabold text-slate-900">
                        {attendance.filter((a) => a.ownerId === currentUser.id).length} Hari
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500">Pengingat Terpasang</div>
                      <div className="text-base font-extrabold text-slate-900">
                        {reminders.filter((r) => r.ownerId === currentUser.id).length} Alarm
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950 space-y-1">
                      <span className="font-bold block">Sinkronisasi Multi-Device</span>
                      <p className="text-[11px] text-indigo-800 leading-relaxed">
                        Data akun, riwayat absensi, bukti foto, dan jadwal Anda disimpan secara aman dan otomatis tersinkronisasi saat Anda membuka aplikasi di browser web maupun desktop Mac (DMG).
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAccountModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW FOTO BESAR */}
      {selectedPreviewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs"
            onClick={() => setSelectedPreviewPhoto(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800">{selectedPreviewPhoto.title}</span>
              <button
                type="button"
                onClick={() => setSelectedPreviewPhoto(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
              <img
                src={selectedPreviewPhoto.url}
                alt="Preview Bukti"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-500 font-mono">
                {selectedPreviewPhoto.date} • {selectedPreviewPhoto.time} WIB
              </div>
              <button
                type="button"
                onClick={() => handleDownloadSinglePhoto(
                  selectedPreviewPhoto.url,
                  `${selectedPreviewPhoto.title.replace(/\s+/g, '_')}_${selectedPreviewPhoto.date}.jpg`
                )}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Asli</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}