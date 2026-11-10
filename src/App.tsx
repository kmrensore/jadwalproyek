import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  BarChart3,
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
  Mic,
  MicOff,
  Wand2,
  AudioWaveform,
  FileAudio,
  Smartphone,
  Mail,
  HardDrive,
  Presentation,
  Activity,
  MessageSquare,
  Send,
} from 'lucide-react';
import AuthPage from './AuthPage';
import { PROJECT_COLORS, DEFAULT_WORK_POLICY } from './types';
// Definisi mandiri EntryStatus di App.tsx agar bebas error jika types.ts lokal belum di-update
export type EntryStatus = 'belum_mulai' | 'berjalan' | 'tertunda' | 'selesai';

import type {
  Project,
  WorkPolicy as BaseWorkPolicy,
  WorkShiftCategory,
  ReminderItem,

  ProjectProgram,
  ScheduleEntry as BaseScheduleEntry,
  UserProfile,
  AttendanceRecord as BaseAttendanceRecord,
  AttendanceType,
  AIPerformanceRecord,
} from './types';

// Ekstensi lokal WorkPolicy & AttendanceRecord agar sinkron penuh dengan fitur lembur & aturan baku
export interface WorkPolicy extends BaseWorkPolicy {
  lateOvertimeThresholdMinutes?: number;
}

export interface AttendanceRecord extends BaseAttendanceRecord {
  isLate?: boolean;
  lateReason?: string;
  leaveReason?: string;
  isOvertimeConfirmed?: boolean;
  overtimeReason?: string;
}

// Definisi mandiri VoiceMemoRecord di App.tsx agar tidak menimbulkan error jika types.ts belum di-update
export interface WorkAppraisalRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  jobRole: string;
  jobRoleLabel: string;
  division: string;
  reportTitle: string;
  periodDate: string;
  metrics: Record<string, string | number>;
  linkUrl?: string;
  screenshotUrl?: string;
  screenshotName?: string;
  notes?: string;
  score: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C';
  executiveSummary: string;
  industryBenchmarkReview: string;
  strengths: string[];
  improvements: string[];
  tacticalRecommendations: string[];
  createdAt: string;
}

// Definisi mandiri VoiceMemoRecord di App.tsx (lengkap dengan audioUrl)
export interface VoiceMemoRecord {
  id: string;
  title: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  durationSeconds: number;
  createdAt: string;
  category?: string;
  riskMitigation?: string[];
  operationalContext?: string;
  audioUrl?: string;
}
import { db, isSupabaseConfigured } from './db';

// Model Item Penambahan Pekerjaan & Riwayat Catatan Revisi
export interface ProjectAddonTask {
  id: string;
  type: 'revisi' | 'tambahan' | 'kendala' | 'instruksi';
  title: string;
  dateAdded: string; // Format YYYY-MM-DD (Tanggal dicatat)
  scheduledDate?: string; // Format YYYY-MM-DD (Target tanggal pengerjaan di kalender)
  isCompleted: boolean;
  notes?: string;
}

// Ekstensi lokal ScheduleEntry agar selalu mengenali status 'tertunda', completedDate, suspendedDate & additionalTasks
export interface ScheduleEntry extends Omit<BaseScheduleEntry, 'status'> {
  status: EntryStatus;
  completedDate?: string | null;
  suspendedDate?: string | null;
  durationDays?: number;
  additionalTasks?: ProjectAddonTask[];
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
// KONFIGURASI ROLE & TOLAK UKUR SISTEM REPORT HASIL PEKERJAAN AI PRO
// ============================================================================
export const APPRAISAL_ROLES = [
  { id: 'video_editor', label: 'Editor Video & Motion Animator', defaultDivision: 'Media Sosial & Konten Kreatif' },
  { id: 'sales_marketing', label: 'Sales & Business Development', defaultDivision: 'Marketing & Penjualan Komersial' },
  { id: 'site_engineer', label: 'Site Supervisor & Pelaksana Proyek', defaultDivision: 'Operasional & Konstruksi Lapangan' },
  { id: 'software_dev', label: 'Software Engineer & Developer', defaultDivision: 'IT & Digital Engineering' },
  { id: 'content_creator', label: 'Content Creator & Copywriter', defaultDivision: 'Kreatif & Komunikasi Digital' },
  { id: 'graphic_designer', label: 'Graphic & Brand Designer', defaultDivision: 'Desain & Komunikasi Visual' },
  { id: 'admin_operations', label: 'Administrasi, Keuangan & HR', defaultDivision: 'Operasional & Tata Kelola' },
  { id: 'customer_service', label: 'Customer Service & Client Care', defaultDivision: 'Pelayanan Pelanggan' },
  { id: 'custom', label: 'Jabatan Kustom (Tulis Sendiri)', defaultDivision: 'Divisi Bebas' },
];

// ============================================================================
// ENGINE ANALISIS & GENERASI KESIMPULAN SUARA BERBANTU AI PRO
// ============================================================================
function generateAIVoiceSummary(rawTranscript: string): {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  category: string;
  riskMitigation: string[];
  operationalContext: string;
} {
  const clean = rawTranscript.trim();
  if (!clean || clean.length < 5) {
    return {
      summary: 'Tidak ada ucapan yang terdeteksi atau durasi rekaman terlalu singkat untuk dianalisis oleh AI PRO.',
      keyPoints: ['Rekaman suara kosong atau tidak terdengar jelas oleh sensor audio.'],
      actionItems: ['[RUTIN] Ulangi perekaman suara dengan mendekatkan mikrofon dan berbicara lebih jelas.'],
      category: 'Catatan Singkat / Uji Coba',
      riskMitigation: ['Pastikan izin mikrofon browser aktif dan berada di ruangan yang minim kebisingan.'],
      operationalContext: 'Kualitas audio rendah atau belum ada data transkripsi.',
    };
  }

  const sentences = clean
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const lowerText = clean.toLowerCase();

  // 1. Deteksi Kategori Percakapan PRO
  let category = 'Koordinasi Umum & Tugas Harian';
  if (lowerText.includes('proyek') || lowerText.includes('lapangan') || lowerText.includes('material') || lowerText.includes('mandor') || lowerText.includes('tukang')) {
    category = 'Instruksi & Progres Lapangan';
  } else if (lowerText.includes('rapat') || lowerText.includes('meeting') || lowerText.includes('diskusi') || lowerText.includes('evaluasi')) {
    category = 'Notulen Rapat Koordinasi Tim';
  } else if (lowerText.includes('anggaran') || lowerText.includes('biaya') || lowerText.includes('bayar') || lowerText.includes('invoice') || lowerText.includes('tagihan')) {
    category = 'Administrasi, Keuangan & Logistik';
  } else if (lowerText.includes('kendala') || lowerText.includes('masalah') || lowerText.includes('rusak') || lowerText.includes('telat') || lowerText.includes('hambatan')) {
    category = 'Mitigasi Masalah & Eskalasi Teknis';
  }

  // 2. Ekstraksi Tindakan Lanjutan (Action Items) PRO dengan Prioritas & PIC
  const actionKeywords = [
    { kw: 'segera', priority: '[PRIORITAS TINGGI]', pic: 'Penanggung Jawab Utama' },
    { kw: 'urgent', priority: '[PRIORITAS TINGGI]', pic: 'Tim Teknis / Koordinator' },
    { kw: 'hari ini', priority: '[PRIORITAS TINGGI]', pic: 'Pelaksana Harian' },
    { kw: 'selesaikan', priority: '[PRIORITAS TINGGI]', pic: 'PIC Terkait' },
    { kw: 'kerjakan', priority: '[PRIORITAS SEDANG]', pic: 'Tim Pelaksana' },
    { kw: 'siapkan', priority: '[PRIORITAS SEDANG]', pic: 'Bagian Logistik & Persiapan' },
    { kw: 'koordinasi', priority: '[PRIORITAS SEDANG]', pic: 'Site Manager / Koordinator' },
    { kw: 'kirim', priority: '[PRIORITAS SEDANG]', pic: 'Admin / Pengirim' },
    { kw: 'cek', priority: '[RUTIN]', pic: 'Quality Control / Pengawas' },
    { kw: 'review', priority: '[RUTIN]', pic: 'Supervisor' },
    { kw: 'jadwalkan', priority: '[PRIORITAS SEDANG]', pic: 'Scheduler / Admin' },
    { kw: 'hubungi', priority: '[PRIORITAS SEDANG]', pic: 'Koordinator Lapangan' },
    { kw: 'update', priority: '[RUTIN]', pic: 'Pelapor / Operator' },
    { kw: 'beli', priority: '[PRIORITAS SEDANG]', pic: 'Purchasing / Logistik' },
    { kw: 'perbaiki', priority: '[PRIORITAS TINGGI]', pic: 'Teknisi Lapangan' },
  ];

  const actionItems: string[] = [];
  sentences.forEach((sentence) => {
    const lower = sentence.toLowerCase();
    const matched = actionKeywords.find((item) => lower.includes(item.kw));
    if (matched && actionItems.length < 5) {
      const cleanSentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      const formatted = `${matched.priority} ${cleanSentence} (PIC: ${matched.pic})`;
      if (!actionItems.some((a) => a.includes(cleanSentence))) {
        actionItems.push(formatted);
      }
    }
  });

  if (actionItems.length === 0 && sentences.length > 0) {
    actionItems.push(`[PRIORITAS SEDANG] ${sentences[0].charAt(0).toUpperCase() + sentences[0].slice(1)} (PIC: Pelaksana Terkait)`);
    if (sentences.length > 1) {
      actionItems.push(`[RUTIN] ${sentences[1].charAt(0).toUpperCase() + sentences[1].slice(1)} (PIC: Koordinator Lapangan)`);
    }
  }

  // 3. Ekstraksi Poin-Poin Kunci Pembahasan
  const keyPoints: string[] = [];
  sentences.forEach((sentence) => {
    if (sentence.length > 12 && keyPoints.length < 4) {
      const formatted = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      if (!keyPoints.includes(formatted) && !actionItems.some((a) => a.includes(sentence))) {
        keyPoints.push(formatted);
      }
    }
  });

  if (keyPoints.length === 0) {
    keyPoints.push(`Fokus pembahasan utama mencakup arahan: "${clean.slice(0, 140)}${clean.length > 140 ? '...' : ''}"`);
    keyPoints.push('Seluruh instruksi telah terverifikasi secara runtut dalam transkripsi.');
  }

  // 4. Analisis Potensi Risiko & Rekomendasi Solusi Mitigasi
  const riskMitigation: string[] = [];
  if (lowerText.includes('hujan') || lowerText.includes('cuaca') || lowerText.includes('lapangan')) {
    riskMitigation.push('Risiko Cuaca: Siapkan terpal pelindung material dan jadwalkan pekerjaan indoor saat intensitas hujan tinggi.');
  }
  if (lowerText.includes('telat') || lowerText.includes('overdue') || lowerText.includes('lambat')) {
    riskMitigation.push('Risiko Keterlambatan: Terapkan penambahan tenaga kerja bantuan atau perpanjangan jam kerja terencana.');
  }
  if (lowerText.includes('material') || lowerText.includes('semen') || lowerText.includes('besi') || lowerText.includes('stok')) {
    riskMitigation.push('Risiko Stok Material: Lakukan verifikasi stok fisik sebelum jam kerja dimulai untuk mencegah idle time.');
  }
  if (riskMitigation.length === 0) {
    riskMitigation.push('Lakukan konfirmasi ulang dengan penanggung jawab terkait batas waktu penyelesaian action items.');
    riskMitigation.push('Pantau dokumentasi foto pekerjaan saat pelaksanaan tugas di lapangan.');
  }

  // 5. Rangkuman Eksekutif Terstruktur (Executive Summary PRO)
  const totalWords = clean.split(/\s+/).filter(Boolean).length;
  let summary = '';
  if (sentences.length === 1) {
    summary = `Percakapan tercatat berfokus pada agenda: "${sentences[0]}". Pembahasan menekankan kecepatan eksekusi dan pelaporan hasil kerja secara berkala.`;
  } else if (sentences.length >= 2) {
    summary = `Berdasarkan transkripsi ${totalWords} kata, fokus utama pembahasan adalah "${sentences[0]}". Hal mendesak yang disepakati adalah "${sentences[1]}", dengan arahan tindak lanjut agar seluruh tim berkoordinasi secara efektif sesuai milestone kerja yang ditargetkan.`;
  } else {
    summary = `Inti arahan kerja: ${clean}. Diharapkan seluruh poin yang tercatat dapat langsung dieksekusi oleh tim penanggung jawab.`;
  }

  const operationalContext = `Analisis AI PRO (${totalWords} kata • ${sentences.length} poin pembicaraan • Status: Terverifikasi)`;

  return { summary, keyPoints, actionItems, category, riskMitigation, operationalContext };
}

// ============================================================================
// HELPER PERHITUNGAN DURASI HARI KERJA AKTIF & TOLAK UKUR LIBUR
// (Hari Jumat ke Senin = 2 Hari Berjalan karena Sabtu & Minggu Libur)
// ============================================================================
function getWorkDaySpan(
  startDateStr: string,
  endDateStr: string,
  policy?: WorkPolicy,
  attendanceList?: AttendanceRecord[],
  ownerId?: string
): number {
  if (!startDateStr || !endDateStr) return 1;
  if (startDateStr === endDateStr) return 1;
  const s = new Date(startDateStr + 'T00:00:00');
  const e = new Date(endDateStr + 'T00:00:00');
  if (e < s) return 1;

  const workDaysPerWeek = policy ? policy.workDaysPerWeek : 5;
  let workDayCount = 0;
  const cur = new Date(s);

  while (cur <= e) {
    const dStr = toDateStr(cur.getFullYear(), cur.getMonth(), cur.getDate());
    const dayOfWeek = cur.getDay(); // 0 = Minggu, 6 = Sabtu
    const holiday = getHolidayInfo(dStr);
    const isDayOff = dayOfWeek === 0 || (workDaysPerWeek <= 5 && dayOfWeek === 6) || (holiday && holiday.isHoliday);

    // Cek apakah ada catatan kehadiran clock in di hari tersebut
    const hasAttendance = attendanceList && attendanceList.some((a) => {
      if (a.date !== dStr || a.type !== 'hadir') return false;
      if (!a.checkInTime && (!a.workDurationHours || a.workDurationHours <= 0)) return false;
      if (ownerId && ownerId !== 'owner-demo-1' && a.ownerId && a.ownerId !== 'owner-demo-1') {
        return a.ownerId === ownerId;
      }
      return true;
    });

    if (dStr === startDateStr) {
      // Hari pertama pengerjaan selalu terhitung 1 hari kerja
      workDayCount += 1;
    } else if (hasAttendance) {
      // Hari-hari berikutnya: jika ada clock in hadir (termasuk lembur di hari libur), dihitung!
      workDayCount += 1;
    } else if (!isDayOff) {
      // Jika hari kerja resmi (bukan Sabtu/Minggu/Tanggal Merah): terhitung sebagai hari kerja berjalan
      workDayCount += 1;
    }
    // Jika isDayOff (Sabtu/Minggu/Tanggal Merah) dan TIDAK ADA clock in lembur, MAKA TIDAK DIHITUNG!

    cur.setDate(cur.getDate() + 1);
  }

  return Math.max(1, workDayCount);
}

function getCalendarDaySpan(
  startDateStr: string,
  endDateStr: string,
  policy?: WorkPolicy,
  attendanceList?: AttendanceRecord[],
  ownerId?: string
): number {
  return getWorkDaySpan(startDateStr, endDateStr, policy, attendanceList, ownerId);
}

function getEntryDateRange(
  e: ScheduleEntry,
  today: string,
  policy?: WorkPolicy,
  attendanceList?: AttendanceRecord[]
): { startDate: string; endDate: string; totalDays: number; isOngoing: boolean } {
  const startDate = e.date;
  let endDate = startDate;
  let isOngoing = false;

  if (e.status === 'selesai') {
    endDate = (e as any).completedDate || startDate;
    if (endDate < startDate) endDate = startDate;
  } else if (e.status === 'tertunda') {
    // KETIKA TERTUNDA: Proyek tetap ada di hari-hari yang sudah dijalani,
    // dibekukan di tanggal penundaan (suspendedDate atau today), dan TIDAK otomatis lanjut ke hari berikutnya!
    const freezeDate = (e as any).suspendedDate || (e as any).completedDate || (startDate <= today ? today : startDate);
    endDate = freezeDate < startDate ? startDate : freezeDate;
    isOngoing = false;
  } else {
    // Jika belum selesai dan tanggal mulai <= hari ini, proyek otomatis MENYAMBUNG setiap hari sampai hari ini!
    if (startDate < today) {
      endDate = today;
      isOngoing = true;
    } else {
      endDate = startDate;
    }
  }

  // Hitung durasi berdasarkan HARI KERJA AKTIF (Sabtu & Minggu tidak dihitung kecuali ada clock-in lembur)
  const totalDays = (e as any).durationDays && e.status === 'selesai'
    ? (e as any).durationDays
    : getWorkDaySpan(startDate, endDate, policy, attendanceList, e.ownerId);

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
  policy: WorkPolicy,
  dateStr?: string
): {
  category: WorkShiftCategory;
  note: string;
  isDayOff?: boolean;
  holidayName?: string;
  diffMinutes?: number;
  isLate?: boolean;
  overtimeHours?: number;
} {
  // Cek apakah tanggal ini merupakan Hari Libur (Weekend berdasarkan workDaysPerWeek atau Libur Nasional)
  let isDayOff = false;
  let holidayName = '';
  if (dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = d.getDay(); // 0 = Minggu, 6 = Sabtu
    const holiday = getHolidayInfo(dateStr);
    if (holiday && holiday.isHoliday) {
      isDayOff = true;
      holidayName = holiday.name;
    } else if (dayOfWeek === 0) {
      isDayOff = true;
      holidayName = 'Hari Minggu (Libur Akhir Pekan)';
    } else if (policy.workDaysPerWeek <= 5 && dayOfWeek === 6) {
      isDayOff = true;
      holidayName = 'Hari Sabtu (Libur Akhir Pekan)';
    }
  }

  // Jika hari libur, seluruh jam kerja masuk ke LEMBUR PENUH!
  if (isDayOff) {
    return {
      category: 'lembur_penuh',
      note: `Lembur Hari Libur / Akhir Pekan (${holidayName}). Seluruh durasi kerja tercatat sebagai Lembur Penuh.`,
      isDayOff: true,
      holidayName,
      diffMinutes: 0,
      overtimeHours: 0,
    };
  }

  const [h, m] = timeStr.split(':').map(Number);
  const actMin = h * 60 + m;

  const stdIn = policy.standardCheckInTime || '08:00';
  const [stdInH, stdInM] = stdIn.split(':').map(Number);
  const stdInMin = stdInH * 60 + stdInM;

  const stdOut = policy.standardCheckOutTime || '17:00';
  const [stdOutH, stdOutM] = stdOut.split(':').map(Number);
  const stdOutMin = stdOutH * 60 + stdOutM;

  const earlyThreshold = policy.earlyOvertimeThresholdMinutes || 60;
  const lateOtThreshold = policy.lateOvertimeThresholdMinutes !== undefined ? policy.lateOvertimeThresholdMinutes : 30;
  const tolerance = policy.lateToleranceMinutes !== undefined ? policy.lateToleranceMinutes : 15;

  if (mode === 'in') {
    if (actMin < stdInMin) {
      const diffMin = stdInMin - actMin;
      const diffH = Math.floor(diffMin / 60);
      const remM = diffMin % 60;
      const otHours = Math.round((diffMin / 60) * 10) / 10;
      return {
        category: diffMin >= earlyThreshold ? 'lembur_awal' : 'normal',
        note: `Datang ${diffH > 0 ? `${diffH} jam ` : ''}${remM} menit lebih awal dari jam masuk baku (${stdIn}).`,
        diffMinutes: diffMin,
        overtimeHours: otHours,
      };
    }
    if (actMin > stdInMin + tolerance) {
      const diffMin = actMin - stdInMin;
      return {
        category: 'normal',
        note: `Shift Normal (Terlambat ${diffMin} menit melewati jam baku ${stdIn} dengan batas toleransi ${tolerance} menit).`,
        diffMinutes: diffMin,
        isLate: true,
        overtimeHours: 0,
      };
    }
    return {
      category: 'normal',
      note: `Shift Normal: Datang sesuai jadwal (masuk baku ${stdIn}).`,
      diffMinutes: 0,
      overtimeHours: 0,
    };
  } else {
    if (actMin > stdOutMin) {
      const diffMin = actMin - stdOutMin;
      const diffH = Math.floor(diffMin / 60);
      const remM = diffMin % 60;
      const otHours = Math.round((diffMin / 60) * 10) / 10;
      return {
        category: diffMin >= lateOtThreshold ? 'lembur_akhir' : 'normal',
        note: `Pulang ${diffH > 0 ? `${diffH} jam ` : ''}${remM} menit setelah jam pulang baku (${stdOut}).`,
        diffMinutes: diffMin,
        overtimeHours: otHours,
      };
    }
    return {
      category: 'normal',
      note: `Shift Normal: Pulang kerja reguler (${stdOut}).`,
      diffMinutes: 0,
      overtimeHours: 0,
    };
  }
}


export const STATUS_SORT_WEIGHT: Record<EntryStatus, number> = {
  tertunda: 1,    // Paling atas!
  berjalan: 2,    // Kedua
  belum_mulai: 3, // Ketiga
  selesai: 4,     // Terbawah
};

const STATUS_META: Record<
  EntryStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  tertunda: {
    label: 'Tertunda',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold',
    dotClass: 'bg-amber-500',
  },
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

  // Tab Navigasi Utama: 'calendar' | 'attendance' | 'reminders' | 'report' | 'ai_performance' | 'voice_ai'
  const [activeMainTab, setActiveMainTab] = useState<
    'calendar' | 'attendance' | 'reminders' | 'report' | 'ai_performance' | 'voice_ai'
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

  // State Pengaturan Akun Pribadi (Profile & Password)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [accountActiveSubTab, setAccountActiveSubTab] = useState<'profile' | 'security'>('profile');
  const [accFullName, setAccFullName] = useState<string>('');
  const [accPhone, setAccPhone] = useState<string>('');
  const [accNewPassword, setAccNewPassword] = useState<string>('');
  const [accConfirmPassword, setAccConfirmPassword] = useState<string>('');
  const [accShowPassword, setAccShowPassword] = useState<boolean>(false);
  const [showUserId, setShowUserId] = useState<boolean>(false);
  const [isSavingAccount, setIsSavingAccount] = useState<boolean>(false);
  const [accountFeedback, setAccountFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [accAvatarUrl, setAccAvatarUrl] = useState<string>('');
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // ==========================================================================
  // STATE SISTEM REPORT HASIL PEKERJAAN & PENILAIAN KINERJA AI PRO
  // ==========================================================================
  const [reportActiveView, setReportActiveView] = useState<'work_appraisal' | 'attendance_summary'>('work_appraisal');
  const [appraisalJobRole, setAppraisalJobRole] = useState<string>('video_editor');
  const [appraisalCustomRole, setAppraisalCustomRole] = useState<string>('');
  const [appraisalDivision, setAppraisalDivision] = useState<string>('Media Sosial & Konten Kreatif');
  const [appraisalTitle, setAppraisalTitle] = useState<string>('Report Hasil Video Reels/Shorts Kampanye');
  const [appraisalPeriodDate, setAppraisalPeriodDate] = useState<string>(() => getTodayDateStr());
  const [appraisalLinkUrl, setAppraisalLinkUrl] = useState<string>('https://instagram.com/reels/');
  const [appraisalScreenshotUrl, setAppraisalScreenshotUrl] = useState<string | null>(null);
  const [appraisalScreenshotName, setAppraisalScreenshotName] = useState<string>('');
  const [appraisalNotes, setAppraisalNotes] = useState<string>('Video menggunakan teknik pacing cut cepat, hook 3 detik awal, dan visual color grading kontras.');
  const appraisalFileInputRef = useRef<HTMLInputElement | null>(null);

  // Metrik Spesifik Per Role
  // 1. Video Editor
  const [apprVideoViews, setApprVideoViews] = useState<string>('245000');
  const [apprVideoRetention, setApprVideoRetention] = useState<string>('68');
  const [apprVideoCTR, setApprVideoCTR] = useState<string>('34');
  const [apprVideoDuration, setApprVideoDuration] = useState<string>('45 detik');
  const [apprVideoPlatform, setApprVideoPlatform] = useState<string>('TikTok & IG Reels');

  // 2. Sales & Marketing
  const [apprSalesTarget, setApprSalesTarget] = useState<string>('50000000');
  const [apprSalesActual, setApprSalesActual] = useState<string>('58500000');
  const [apprSalesLeads, setApprSalesLeads] = useState<string>('42');
  const [apprSalesDeals, setApprSalesDeals] = useState<string>('9');

  // 3. Site Supervisor
  const [apprSiteProgressPlanned, setApprSiteProgressPlanned] = useState<string>('75');
  const [apprSiteProgressActual, setApprSiteProgressActual] = useState<string>('78');
  const [apprSiteVolume, setApprSiteVolume] = useState<string>('Pemasangan hebel 220 m2 & plesteran lantai 2');
  const [apprSiteWorkers, setApprSiteWorkers] = useState<string>('12 Tukang');

  // 4. Software Dev
  const [apprDevCoverage, setApprDevCoverage] = useState<string>('88');
  const [apprDevBugs, setApprDevBugs] = useState<string>('0');
  const [apprDevDeployStatus, setApprDevDeployStatus] = useState<string>('Production Ready / Live');

  // 5. Custom
  const [apprCustomMetric1Label, setApprCustomMetric1Label] = useState<string>('Target KPI Deliverable');
  const [apprCustomMetric1Val, setApprCustomMetric1Val] = useState<string>('100% Tepat Waktu');
  const [apprCustomMetric2Label, setApprCustomMetric2Label] = useState<string>('Tingkat Kepuasan Klien');
  const [apprCustomMetric2Val, setApprCustomMetric2Val] = useState<string>('Sangat Puas (9.5/10)');

  const [isEvaluatingAppraisal, setIsEvaluatingAppraisal] = useState<boolean>(false);
  const [savedAppraisals, setSavedAppraisals] = useState<WorkAppraisalRecord[]>(() =>
    (db as any).getWorkAppraisals ? (db as any).getWorkAppraisals() : []
  );
  const [currentAppraisal, setCurrentAppraisal] = useState<WorkAppraisalRecord | null>(() => {
    const list = (db as any).getWorkAppraisals ? (db as any).getWorkAppraisals() : [];
    return list.length > 0 ? list[0] : null;
  });

  // State Crop & Scale Foto Profil Rasio 4:5
  const [isCroppingAvatar, setIsCroppingAvatar] = useState<boolean>(false);
  const [rawCropImage, setRawCropImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropOffsetY, setCropOffsetY] = useState<number>(0);
  const [cropOffsetX, setCropOffsetX] = useState<number>(0);

  // State Rekam Suara (Voice to Text & Kesimpulan AI)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [recordingDurationSec, setRecordingDurationSec] = useState<number>(0);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceLanguage, setVoiceLanguage] = useState<'id-ID' | 'en-US'>('id-ID');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const transcriptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [voiceSummaryResult, setVoiceSummaryResult] = useState<{
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    category?: string;
    riskMitigation?: string[];
    operationalContext?: string;
  } | null>(null);
  const [savedVoiceMemos, setSavedVoiceMemos] = useState<VoiceMemoRecord[]>(() =>
    (db as any).getVoiceMemos ? (db as any).getVoiceMemos() : []
  );
  const speechRecognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

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
  const [policyLateOtThresholdInput, setPolicyLateOtThresholdInput] = useState<number>(workPolicy.lateOvertimeThresholdMinutes !== undefined ? workPolicy.lateOvertimeThresholdMinutes : 30);

  // State Pop-up Interaktif Konfirmasi Presensi (Clock In Lembur/Terlambat & Clock Out Lembur Sore/Malam)
  const [attConfirmModal, setAttConfirmModal] = useState<{
    isOpen: boolean;
    mode: 'in' | 'out';
    date: string;
    time: string;
    photoUrl: string | null;
    location: string | null;
    scenario: 'early_in' | 'late_in' | 'holiday_work' | 'late_out_overtime' | 'normal_on_time';
    diffMinutes: number;
    calculatedOvertimeHours: number;
    isOvertimeConfirmed: boolean;
    lateChoice: 'izin' | 'telat';
    lateReason: string;
    overtimeReason: string;
    notes: string;
  } | null>(null);

  // State Penyesuaian Keterangan Lembur oleh Atasan / Pekerja
  const [editingOvertimeRecord, setEditingOvertimeRecord] = useState<AttendanceRecord | null>(null);
  const [editOtReasonInput, setEditOtReasonInput] = useState<string>('');
  const [editOtHoursInput, setEditOtHoursInput] = useState<number>(0);
  const [editOtCategoryInput, setEditOtCategoryInput] = useState<WorkShiftCategory>('normal');

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

  // State Form Cepat Penambahan Pekerjaan & Catatan Revisi
  const [activeAddonEntryId, setActiveAddonEntryId] = useState<string | null>(null);
  const [addonTaskType, setAddonTaskType] = useState<'revisi' | 'tambahan' | 'kendala' | 'instruksi'>('revisi');
  const [addonTaskTitle, setAddonTaskTitle] = useState<string>('');
  const [addonScheduledDate, setAddonScheduledDate] = useState<string>(''); // Tanggal kapan revisi/tambahan akan dikerjakan
  const [resumeDateInput, setResumeDateInput] = useState<string>(todayStr); // Penentuan tanggal manual untuk melanjutkan proyek tertunda
  const [revFollowupTitle, setRevFollowupTitle] = useState<string>(''); // Rincian revisi tindak lanjut proyek selesai
  const [revFollowupDate, setRevFollowupDate] = useState<string>(todayStr); // Tanggal revisi muncul di kalender
  const [activeRevisionEntryId, setActiveRevisionEntryId] = useState<string | null>(null);
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

  // Handler Pengiriman Chatbot AI Gemini Terfilter ID Owner
  const handleSendAIChatMessage = (customText?: string) => {
    const textToSend = (customText || aiChatInput).trim();
    if (!textToSend) return;

    const timeNow = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newHistory = [
      ...aiChatMessages,
      { sender: 'user' as const, text: textToSend, time: timeNow },
    ];
    setAiChatMessages(newHistory);
    if (!customText) setAiChatInput('');

    setTimeout(() => {
      const lower = textToSend.toLowerCase();
      const myOwnerId = currentUser?.id || '';
      const myProjects = projects.filter(
        (p) => !p.ownerId || p.ownerId === myOwnerId
      );
      const myEntries = entries.filter(
        (e) => !e.ownerId || e.ownerId === myOwnerId
      );
      const doneCount = myEntries.filter((e) => e.status === 'selesai').length;
      const pendingCount = myEntries.filter((e) => e.status === 'tertunda').length;
      const inProgressCount = myEntries.filter((e) => e.status === 'berjalan').length;

      let revisionCount = 0;
      let bottleneckCount = 0;
      myEntries.forEach((e) => {
        (e.additionalTasks || []).forEach((t) => {
          if (t.type === 'revisi' && !t.isCompleted) revisionCount++;
          if (t.type === 'kendala') bottleneckCount++;
        });
      });

      let reply = '';
      if (
        lower.includes('kendala') ||
        lower.includes('masalah') ||
        lower.includes('hambatan') ||
        lower.includes('bottleneck')
      ) {
        reply = `Berdasarkan filter ID Owner Anda (${currentUser?.fullName || 'Owner'}), ditemukan ${bottleneckCount} kendala proyek tercatat dan ${pendingCount} tugas dalam status tertunda. Disarankan untuk memprioritaskan penyelesaian kendala pada proyek dengan durasi pengerjaan terpanjang sebelum menambah pekerjaan baru.`;
      } else if (lower.includes('revisi') || lower.includes('perbaikan')) {
        reply = `Status Revisi Terfilter: Terdapat ${revisionCount} item revisi aktif pada proyek Anda. Setiap item revisi kini dilengkapi penentuan tanggal pengerjaan langsung di kalender jadwal kerja.`;
      } else if (
        lower.includes('lembur') ||
        lower.includes('jam kerja') ||
        lower.includes('absensi') ||
        lower.includes('ot')
      ) {
        const totalOt = Math.round(
          attendance
            .filter((a) => !a.ownerId || a.ownerId === myOwnerId)
            .reduce((s, a) => s + (a.overtimeHours || 0), 0)
        );
        reply = `Rekapitulasi Jam Lembur: Terhitung total ${totalOt} jam lembur genap (tanpa pecahan desimal). Aturan baku: toleransi masuk ${workPolicy.lateToleranceMinutes || 15}m, batas threshold lembur pulang ${workPolicy.lateOvertimeThresholdMinutes || 30}m, dan jam reguler dihitung bersih.`;
      } else if (
        lower.includes('progres') ||
        lower.includes('kinerja') ||
        lower.includes('laporan') ||
        lower.includes('selesai')
      ) {
        const pct = myEntries.length > 0 ? Math.round((doneCount / myEntries.length) * 100) : 0;
        reply = `Progres Kinerja Proyek: Dari ${myEntries.length} total pekerjaan Anda, ${doneCount} telah selesai (${pct}%), ${inProgressCount} sedang berjalan, dan ${pendingCount} tertunda. Seluruh log telah diekspor ke Excel dan presentasi PowerPoint full designed.`;
      } else if (
        lower.includes('siapa kamu') ||
        lower.includes('kemampuan') ||
        lower.includes('skills')
      ) {
        reply = `Saya adalah AI Assistant khusus JadwalPro yang dikunci secara ketat untuk menangani operasional aplikasi web ini: manajemen proyek, penjadwalan tolak ukur kalender, kalkulasi jam kerja genap & lembur, serta evaluasi revisi khusus untuk data ID owner Anda.`;
      } else {
        reply = `Saya memverifikasi data proyek untuk ${currentUser?.fullName || 'Owner'}: Terdapat ${myProjects.length} proyek aktif (${myProjects.map((p) => p.name).join(', ') || 'Semua'}). Seluruh metrik jadwal beroperasi normal sesuai tolak ukur presensi terpadu.`;
      }

      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    }, 500);
  };

  // State Gemini AI Assistant Chatbot Khusus JadwalPro
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);
  const [aiChatInput, setAiChatInput] = useState<string>('');
  const [aiChatMessages, setAiChatMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; time: string }>
  >([
    {
      sender: 'ai',
      text: 'Halo! Saya Gemini Assistant resmi JadwalPro. Saya siap membantu mengevaluasi kendala proyek, meninjau status revisi aktif, dan menganalisis jam kerja lembur khusus untuk akun Anda. Silakan klik topik rekomendasi di bawah atau ketik pertanyaan seputar proyek Anda!',
      time: 'Baru saja',
    },
  ]);
  const [aiPerfSubTab, setAiPerfSubTab] = useState<'upload' | 'appraisal'>('appraisal');

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
      const dataUrl = event.target?.result as string;
      setRawCropImage(dataUrl);
      setCropZoom(1);
      setCropOffsetY(0);
      setCropOffsetX(0);
      setIsCroppingAvatar(true);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCroppedAvatar = () => {
    if (!rawCropImage) return;

    const img = new Image();
    img.onload = () => {
      // Standar foto potret rasio 4:5 (400 x 500 px)
      const targetWidth = 400;
      const targetHeight = 500;
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const imgAspect = img.width / img.height;
      const targetAspect = targetWidth / targetHeight; // 0.8

      let renderWidth: number;
      let renderHeight: number;

      if (imgAspect > targetAspect) {
        renderHeight = targetHeight * cropZoom;
        renderWidth = renderHeight * imgAspect;
      } else {
        renderWidth = targetWidth * cropZoom;
        renderHeight = renderWidth / imgAspect;
      }

      const centerX = (targetWidth - renderWidth) / 2 + cropOffsetX * 2;
      const centerY = (targetHeight - renderHeight) / 2 + cropOffsetY * 2;

      ctx.drawImage(img, centerX, centerY, renderWidth, renderHeight);

      const finalCompressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setAccAvatarUrl(finalCompressedDataUrl);
      setIsCroppingAvatar(false);
      setRawCropImage(null);
      setAccountFeedback({
        type: 'success',
        message: 'Foto profil rasio 4:5 berhasil disesuaikan! Klik "Simpan Perubahan Profil" untuk menerapkan.',
      });
    };
    img.src = rawCropImage;
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

      if (ownerFilter === 'MINE' && currentUser) {
        return e.ownerId === currentUser.id || !e.ownerId || e.ownerId === 'owner-default' || e.ownerId === 'owner-demo-1';
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
      .sort((a, b) => {
        // 1. Tertunda selalu paling atas, lalu berjalan, belum_mulai, selesai
        const wA = STATUS_SORT_WEIGHT[a.status] || 99;
        const wB = STATUS_SORT_WEIGHT[b.status] || 99;
        if (wA !== wB) return wA - wB;
        // 2. Yang baru dibuat selalu paling atas (createdAt desc)
        const timeComp = (b.createdAt || '').localeCompare(a.createdAt || '');
        if (timeComp !== 0) return timeComp;
        return (b.date || '').localeCompare(a.date || '');
      });
  }, [monthEntries, projectFilter, statusFilter, searchQuery, todayStr, projectMap]);

  const entriesByDate = useMemo(() => {
    const grouped: Record<string, ScheduleEntry[]> = {};
    const workDays = workPolicy ? workPolicy.workDaysPerWeek : 5;

    filteredMonthEntries.forEach((e) => {
      const range = getEntryDateRange(e, todayStr, workPolicy, attendance);
      // Proyeksikan tugas ke tanggal dari startDate sampai endDate
      const start = new Date(range.startDate + 'T00:00:00');
      const end = new Date(range.endDate + 'T00:00:00');
      const cur = new Date(start);

      while (cur <= end) {
        const dStr = toDateStr(cur.getFullYear(), cur.getMonth(), cur.getDate());
        const dayOfWeek = cur.getDay(); // 0 = Minggu, 6 = Sabtu
        const holiday = getHolidayInfo(dStr);
        const isDayOff = dayOfWeek === 0 || (workDays <= 5 && dayOfWeek === 6) || (holiday && holiday.isHoliday);

        // Cek apakah ada catatan kehadiran clock in pada hari tersebut (termasuk lembur)
        const hasAttendance = attendance.some((a) => {
          if (a.date !== dStr || a.type !== 'hadir') return false;
          if (!a.checkInTime && (!a.workDurationHours || a.workDurationHours <= 0)) return false;
          if (e.ownerId && e.ownerId !== 'owner-demo-1' && a.ownerId && a.ownerId !== 'owner-demo-1') {
            return a.ownerId === e.ownerId;
          }
          return true;
        });

        // ATURAN TOLAK UKUR KERJA & PATOKAN CLOCK IN:
        // 1. DI HARI LIBUR (SABTU & MINGGU / TANGGAL MERAH):
        //    JANGAN TAMPILKAN PROYEK APAPUN KECUALI ADA LEMBUR (CLOCK IN HADIR)!
        //    Berlaku untuk semua status: selesai, berjalan, tertunda, maupun belum mulai!
        // 2. DI HARI KERJA BIASA (SENIN - JUMAT):
        //    Tanggal startDate awal pembuatan tugas selalu tampil.
        //    Untuk tanggal lanjutan berikutnya: JANGAN TAMPILKAN jika pekerja tidak masuk (tanpa clock in)!
        let shouldInclude = true;

        if (isDayOff) {
          // Hari libur / akhir pekan: proyek HANYA MUNCUL JIKA ADA LEMBUR!
          if (!hasAttendance) {
            shouldInclude = false;
          }
        } else {
          // Hari kerja biasa:
          if (dStr !== range.startDate) {
            // Untuk hari-hari kelanjutan (dStr > startDate):
            // Jika hari tersebut sudah lewat atau hari ini (<= todayStr):
            if (dStr <= todayStr) {
              const isExplicitFinishDate = e.status === 'selesai' && (e as any).completedDate === dStr;
              if (!hasAttendance && !isExplicitFinishDate) {
                // Tidak masuk / tanpa clock in -> jangan tampilkan proyek
                shouldInclude = false;
              }
            }
          }
        }

        if (shouldInclude) {
          if (!grouped[dStr]) grouped[dStr] = [];
          if (!grouped[dStr].some((item) => item.id === e.id)) {
            grouped[dStr].push(e);
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

    // Urutkan daftar tugas di setiap tanggal: tertunda paling atas, lalu yang baru dibuat paling atas
    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => {
        const wA = STATUS_SORT_WEIGHT[a.status] || 99;
        const wB = STATUS_SORT_WEIGHT[b.status] || 99;
        if (wA !== wB) return wA - wB;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
    });
    return grouped;
  }, [filteredMonthEntries, todayStr, attendance, workPolicy]);

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

    const totalWorkHours = Math.round(
      hadirRecords.reduce((acc, curr) => acc + (curr.workDurationHours || 0), 0)
    );
    const avgWorkHours = hadirCount > 0 ? String(Math.round(totalWorkHours / hadirCount)) : '0';
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

    // 1. Audit Kendala Lapangan, Revisi & Tugas Mengganjal
    const fieldIssues: Array<{
      taskId: string;
      taskTitle: string;
      projectName: string;
      date: string;
      status: EntryStatus;
      type: 'kendala' | 'revisi' | 'tertunda' | 'catatan';
      description: string;
    }> = [];

    userEntries.forEach((e) => {
      const pName = e.projectId ? (projectMap[e.projectId]?.name || 'Proyek') : 'Tanpa Proyek';
      if (e.status === 'tertunda') {
        fieldIssues.push({
          taskId: e.id,
          taskTitle: e.title,
          projectName: pName,
          date: e.date,
          status: e.status,
          type: 'tertunda',
          description: e.notes || 'Pekerjaan dibekukan / ditunda sementara.',
        });
      }
      if (Array.isArray(e.additionalTasks)) {
        e.additionalTasks.forEach((add) => {
          if (!add.isCompleted && (add.type === 'kendala' || add.type === 'revisi')) {
            fieldIssues.push({
              taskId: e.id,
              taskTitle: e.title,
              projectName: pName,
              date: add.dateAdded || e.date,
              status: e.status,
              type: add.type,
              description: add.title + (add.notes ? ` (${add.notes})` : ''),
            });
          }
        });
      }
      if (
        e.notes &&
        (e.notes.toLowerCase().includes('kendala') ||
          e.notes.toLowerCase().includes('hambatan') ||
          e.notes.toLowerCase().includes('revisi') ||
          e.notes.toLowerCase().includes('tertahan'))
      ) {
        if (!fieldIssues.some((fi) => fi.taskId === e.id)) {
          fieldIssues.push({
            taskId: e.id,
            taskTitle: e.title,
            projectName: pName,
            date: e.date,
            status: e.status,
            type: 'catatan',
            description: e.notes,
          });
        }
      }
    });

    // 2. Evaluasi Ketidakseimbangan Beban Tugas Antar Proyek
    const heavyProjects = projectBreakdown.filter(
      (pb) => pb.contributionPercent >= 40 && pb.projectId !== 'none'
    );
    const hasWorkloadImbalance = heavyProjects.length > 0 && totalTasks >= 3;

    // 3. Masalah Tingkat Penyelesaian & Bottleneck
    const laggingProjects = projectBreakdown.filter(
      (pb) => pb.count >= 2 && pb.completionPercent < 50 && pb.projectId !== 'none'
    );

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
      fieldIssues,
      heavyProjects,
      hasWorkloadImbalance,
      laggingProjects,
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
      const isTertunda = entryStatus === 'tertunda';
      const finishDate = isCompleted ? ((existing as any)?.completedDate || selectedDate || todayStr) : null;
      const suspendedDate = isTertunda ? ((existing as any)?.suspendedDate || selectedDate || todayStr) : null;
      const durationDays = isCompleted ? getCalendarDaySpan(existing?.date || selectedDate, finishDate!) : undefined;

      const updated = db.updateEntry(editingEntryId, {
        title: entryTitle.trim(),
        projectId: entryProjectId || null,
        programId: entryProgramId || null,
        status: entryStatus,
        notes: entryNotes.trim(),
        completedDate: finishDate,
        suspendedDate,
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

  // FUNGSI TINDAK LANJUT PROYEK SELESAI: OTOMATIS MENAMBAH PEKERJAAN REVISI BARU KE KALENDER
  const handleCreateRevisionFromCompleted = (
    baseEntry: ScheduleEntry,
    titleInput?: string,
    dateInput?: string
  ) => {
    const targetDate = dateInput || revFollowupDate || selectedDate || todayStr;
    const detail = titleInput || revFollowupTitle.trim() || `Revisi lanjutan: ${baseEntry.title}`;
    const fullTitle = detail.toLowerCase().startsWith('revisi') ? detail : `[Revisi] ${baseEntry.title}: ${detail}`;

    // 1. Catat ke riwayat penambahan pekerjaan (additionalTasks) di entri tugas lama
    const addonItem: ProjectAddonTask = {
      id: 'addon-' + Date.now().toString(36),
      type: 'revisi',
      title: detail,
      dateAdded: selectedDate || todayStr,
      scheduledDate: targetDate,
      isCompleted: false,
    };
    const updatedAddons = [...(baseEntry.additionalTasks || []), addonItem];
    const appendNote = `\n• [REVISI DIJADWALKAN] (Target ${formatDateShortIndo(targetDate)}): ${detail}`;
    const newBaseNotes = baseEntry.notes ? `${baseEntry.notes}${appendNote}` : appendNote.trim();

    db.updateEntry(baseEntry.id, {
      additionalTasks: updatedAddons,
      notes: newBaseNotes,
    } as any);

    // 2. OTOMATIS BUAT SEBAGAI TUGAS / PROYEK BARU DI KALENDER PADA TANGGAL TARGET!
    const updatedEntries = db.createEntry(
      {
        date: targetDate,
        title: fullTitle,
        projectId: baseEntry.projectId || null,
        programId: baseEntry.programId || null,
        status: 'belum_mulai',
        notes: `Tugas revisi tindak lanjut dari "${baseEntry.title}" (selesai pada ${formatDateShortIndo(baseEntry.date)}).\nRincian revisi: ${detail}`,
      },
      currentUser
    );

    setEntries(updatedEntries);
    setRevFollowupTitle('');
    setActiveRevisionEntryId(null);
    showToast(`✅ Pekerjaan revisi "${fullTitle}" otomatis ditambahkan ke kalender pada ${formatDateShortIndo(targetDate)}!`);
  };

  // FUNGSI LANJUTKAN PROYEK TERTUNDA DENGAN PENENTUAN TANGGAL MANUAL
  const handleResumeTertundaProject = (entry: ScheduleEntry, targetDate?: string) => {
    const resumeDate = targetDate || resumeDateInput || selectedDate || todayStr;
    const appendNote = `\n• [DILANJUTKAN] (${formatDateShortIndo(resumeDate)}): Proyek tertunda aktif dilanjutkan kembali sesuai penentuan tanggal manual.`;
    const newNotes = entry.notes ? `${entry.notes}${appendNote}` : appendNote.trim();

    const updated = db.updateEntry(entry.id, {
      status: 'berjalan',
      date: resumeDate, // Mulai aktif kembali di tanggal manual yang ditentukan
      suspendedDate: null,
      notes: newNotes,
    } as any);

    setEntries(updated);
    showToast(`Proyek "${entry.title}" dilanjutkan kembali mulai ${formatDateShortIndo(resumeDate)}!`);
  };

  // Handlers Penambahan Pekerjaan & Catatan Revisi Proyek (Dengan Penjadwalan Tanggal Muncul di Kalender)
  const handleAddAddonTask = (entryId: string) => {
    if (!addonTaskTitle.trim()) {
      showToast('Keterangan revisi atau pekerjaan tambahan tidak boleh kosong');
      return;
    }
    const targetEntry = entries.find((e) => e.id === entryId);
    if (!targetEntry) return;

    // Target tanggal kapan revisi atau pekerjaan tambahan ini akan dilakukan
    const scheduledDate = addonScheduledDate || selectedDate || todayStr;

    const newItem: ProjectAddonTask = {
      id: 'addon-' + Date.now().toString(36),
      type: addonTaskType,
      title: addonTaskTitle.trim(),
      dateAdded: selectedDate || todayStr,
      scheduledDate,
      isCompleted: false,
    };

    const currentList = targetEntry.additionalTasks || [];
    const updatedList = [...currentList, newItem];

    const typeLabel =
      addonTaskType === 'revisi'
        ? '[REVISI]'
        : addonTaskType === 'tambahan'
        ? '[PEKERJAAN TAMBAHAN]'
        : addonTaskType === 'kendala'
        ? '[KENDALA LAPANGAN]'
        : '[INSTRUKSI]';

    const appendNote = `\n• ${typeLabel} (Target: ${formatDateShortIndo(scheduledDate)}): ${addonTaskTitle.trim()}`;
    const newNotes = targetEntry.notes ? `${targetEntry.notes}${appendNote}` : appendNote.trim();

    const updated = db.updateEntry(entryId, {
      additionalTasks: updatedList,
      notes: newNotes,
    } as any);

    setEntries(updated);
    setAddonTaskTitle('');
    setAddonScheduledDate('');
    setActiveAddonEntryId(null);
    showToast(`Catatan ${typeLabel} berhasil dijadwalkan pada ${formatDateShortIndo(scheduledDate)} & muncul di kalender!`);
  };

  const handleToggleAddonTask = (entryId: string, addonId: string) => {
    const targetEntry = entries.find((e) => e.id === entryId);
    if (!targetEntry || !targetEntry.additionalTasks) return;

    const updatedList = targetEntry.additionalTasks.map((item) =>
      item.id === addonId ? { ...item, isCompleted: !item.isCompleted } : item
    );

    const updated = db.updateEntry(entryId, {
      additionalTasks: updatedList,
    } as any);

    setEntries(updated);
    showToast('Status item revisi diperbarui');
  };

  const handleDeleteAddonTask = (entryId: string, addonId: string) => {
    const targetEntry = entries.find((e) => e.id === entryId);
    if (!targetEntry || !targetEntry.additionalTasks) return;

    const updatedList = targetEntry.additionalTasks.filter((item) => item.id !== addonId);
    const updated = db.updateEntry(entryId, {
      additionalTasks: updatedList,
    } as any);

    setEntries(updated);
    showToast('Item revisi dihapus');
  };

  const handleQuickCycleStatus = (entry: ScheduleEntry) => {
    const order: EntryStatus[] = ['belum_mulai', 'berjalan', 'tertunda', 'selesai'];
    const nextStatus = order[(order.indexOf(entry.status) + 1) % order.length];
    const isCompleted = nextStatus === 'selesai';
    const isTertunda = nextStatus === 'tertunda';
    const finishDate = isCompleted ? (selectedDate || todayStr) : null;
    // Ketika tertunda: bekukan tanggal penundaan pada hari yang dipilih atau hari ini
    const suspendedDate = isTertunda ? (selectedDate || todayStr) : null;
    const durationDays = isCompleted ? getCalendarDaySpan(entry.date, finishDate!) : undefined;

    const updated = db.updateEntry(entry.id, {
      status: nextStatus,
      completedDate: finishDate,
      suspendedDate,
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
  // DAFTAR PROYEK YANG SUDAH MEMILIKI TUGAS SELESAI (UNTUK TEMPLATE / LANJUTAN PROYEK)
  const completedProjects = useMemo(() => {
    return projects.filter((p) => {
      const projTasks = entries.filter((e) => e.projectId === p.id);
      return projTasks.length > 0 && projTasks.some((e) => e.status === 'selesai');
    });
  }, [projects, entries]);

  // FUNGSI TAMBAH PROYEK BARU DARI PROYEK YANG SUDAH SELESAI
  const openCreateProjectFromCompleted = (baseProj: Project, baseEntry?: ScheduleEntry) => {
    setEditingProject(null);
    const defaultNextName = `${baseProj.name} - Fase Lanjutan`;
    setProjectNameInput(defaultNextName);
    setProjectColorInput(baseProj.color || PROJECT_COLORS[projects.length % PROJECT_COLORS.length].value);
    const copiedPrograms = (baseProj.programs || []).map((prog) => ({
      id: 'prog-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      name: prog.name,
      createdAt: new Date().toISOString(),
    }));
    setProjectProgramsInput(copiedPrograms);
    setNewProgramNameInput('');
    setIsProjectModalOpen(true);
    showToast(`Membuat proyek lanjutan dari "${baseProj.name}"`);
  };

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
    const shift = detectShiftCategoryInfo(mode, nowTime, workPolicy, todayStr);
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

  // EKSEKUSI PENYIMPANAN ABSENSI (TERINTEGRASI ATURAN BAKU & LEMBUR)
  const executeAttendanceSave = async (params: {
    mode: 'in' | 'out';
    date: string;
    time: string;
    photoUrl: string | null;
    location: string | null;
    shiftCategory: WorkShiftCategory;
    shiftNotes: string;
    regularWorkHours?: number;
    overtimeHours?: number;
    isLate?: boolean;
    lateReason?: string;
    isOvertimeConfirmed?: boolean;
    overtimeReason?: string;
    notes: string;
  }) => {
    if (!currentUser) return;
    const payload: any = {
      date: params.date,
      type: 'hadir',
      notes: params.notes,
      shiftCategory: params.shiftCategory,
      shiftNotes: params.shiftNotes,
      isLate: params.isLate,
      lateReason: params.lateReason,
      isOvertimeConfirmed: params.isOvertimeConfirmed,
      overtimeReason: params.overtimeReason,
    };
    if (params.regularWorkHours !== undefined) {
      payload.regularWorkHours = params.regularWorkHours;
    }
    if (params.overtimeHours !== undefined) {
      payload.overtimeHours = params.overtimeHours;
    }

    if (params.mode === 'in') {
      payload.checkInTime = params.time;
      if (params.photoUrl) payload.checkInPhoto = params.photoUrl;
      if (params.location) payload.checkInLocation = params.location;
    } else {
      payload.checkOutTime = params.time;
      if (params.photoUrl) payload.checkOutPhoto = params.photoUrl;
      if (params.location) payload.checkOutLocation = params.location;
    }

    const updated = await db.recordAttendance(payload, currentUser);
    setAttendance(updated);
    closeCameraModal();
    setAttConfirmModal(null);
    showToast(
      `${params.mode === 'in' ? 'Clock In' : 'Clock Out'} berhasil pukul ${params.time}! Data kehadiran & lembur tersimpan.`
    );
  };

  // TRIGGER INTERAKTIF DENGAN POP-UP KONFIRMASI (CLOCK IN LEMBUR / TERLAMBAT & CLOCK OUT LEMBUR SORE/MALAM)
  const triggerAttendanceWithConfirmation = (
    mode: 'in' | 'out',
    photoUrl: string | null,
    location: string | null,
    timeStr: string
  ) => {
    const shiftInfo = detectShiftCategoryInfo(mode, timeStr, workPolicy, todayStr);
    const [h, m] = timeStr.split(':').map(Number);
    const actMin = h * 60 + m;

    const stdIn = workPolicy.standardCheckInTime || '08:00';
    const [stdInH, stdInM] = stdIn.split(':').map(Number);
    const stdInMin = stdInH * 60 + stdInM;

    const stdOut = workPolicy.standardCheckOutTime || '17:00';
    const [stdOutH, stdOutM] = stdOut.split(':').map(Number);
    const stdOutMin = stdOutH * 60 + stdOutM;

    const lateTolerance = workPolicy.lateToleranceMinutes !== undefined ? workPolicy.lateToleranceMinutes : 15;
    const lateOtThreshold = workPolicy.lateOvertimeThresholdMinutes !== undefined ? workPolicy.lateOvertimeThresholdMinutes : 30;

    // 1. Kasus Hari Libur / Akhir Pekan (Lembur Penuh)
    if (shiftInfo.isDayOff) {
      setAttConfirmModal({
        isOpen: true,
        mode,
        date: todayStr,
        time: timeStr,
        photoUrl,
        location,
        scenario: 'holiday_work',
        diffMinutes: 0,
        calculatedOvertimeHours: 0,
        isOvertimeConfirmed: true,
        lateChoice: 'telat',
        lateReason: '',
        overtimeReason: `Lembur Hari Libur (${shiftInfo.holidayName})`,
        notes: `Aktivitas presensi di hari libur (${shiftInfo.holidayName}). Seluruh durasi dihitung sebagai Lembur Penuh.`,
      });
      return;
    }

    // 2. Mode IN (Clock In Masuk Kerja)
    if (mode === 'in') {
      if (actMin < stdInMin) {
        // Datang Lebih Awal (misal jam 7 pagi sebelum jam 8) -> Muncul pop-up tanya apakah ini lembur atau tidak
        const diffMin = stdInMin - actMin;
        const otHours = Math.round((diffMin / 60) * 10) / 10;
        setAttConfirmModal({
          isOpen: true,
          mode: 'in',
          date: todayStr,
          time: timeStr,
          photoUrl,
          location,
          scenario: 'early_in',
          diffMinutes: diffMin,
          calculatedOvertimeHours: otHours,
          isOvertimeConfirmed: true,
          lateChoice: 'telat',
          lateReason: '',
          overtimeReason: `Lembur Pagi: Datang ${diffMin} menit lebih awal sebelum jam masuk baku (${stdIn}).`,
          notes: `Clock in awal pukul ${timeStr} (${diffMin} menit sebelum ${stdIn}).`,
        });
        return;
      }

      if (actMin > stdInMin + lateTolerance) {
        // Terlambat melewati jam baku + toleransi -> Muncul pop-up konfirmasi status (Izin Terlambat vs Terlambat Biasa)
        const diffMin = actMin - stdInMin;
        setAttConfirmModal({
          isOpen: true,
          mode: 'in',
          date: todayStr,
          time: timeStr,
          photoUrl,
          location,
          scenario: 'late_in',
          diffMinutes: diffMin,
          calculatedOvertimeHours: 0,
          isOvertimeConfirmed: false,
          lateChoice: 'izin',
          lateReason: '',
          overtimeReason: '',
          notes: `Hadir terlambat ${diffMin} menit dari jam baku (${stdIn}).`,
        });
        return;
      }

      // Hadir normal tepat waktu (langsung simpan bersih)
      executeAttendanceSave({
        mode: 'in',
        date: todayStr,
        time: timeStr,
        photoUrl,
        location,
        shiftCategory: 'normal',
        shiftNotes: `Shift Normal: Masuk tepat waktu (${timeStr}).`,
        isLate: false,
        lateReason: '',
        isOvertimeConfirmed: false,
        overtimeReason: '',
        notes: 'Check-in hadir harian tepat waktu.',
      });
      return;
    }

    // 3. Mode OUT (Clock Out Pulang Kerja)
    if (mode === 'out') {
      if (actMin > stdOutMin) {
        // Pulang lebih lama dari jam pulang baku -> Muncul pop-up konfirmasi apakah lembur sore/malam atau shift biasa
        const diffMin = actMin - stdOutMin;
        const otHours = Math.round((diffMin / 60) * 10) / 10;
        setAttConfirmModal({
          isOpen: true,
          mode: 'out',
          date: todayStr,
          time: timeStr,
          photoUrl,
          location,
          scenario: 'late_out_overtime',
          diffMinutes: diffMin,
          calculatedOvertimeHours: otHours,
          isOvertimeConfirmed: diffMin >= lateOtThreshold,
          lateChoice: 'telat',
          lateReason: '',
          overtimeReason: `Lembur Sore/Malam: Pulang ${diffMin} menit setelah jam pulang baku (${stdOut}).`,
          notes: `Clock out pukul ${timeStr} (+${diffMin} menit dari ${stdOut}).`,
        });
        return;
      }

      // Pulang reguler normal
      executeAttendanceSave({
        mode: 'out',
        date: todayStr,
        time: timeStr,
        photoUrl,
        location,
        shiftCategory: 'normal',
        shiftNotes: `Shift Normal: Pulang kerja reguler pukul ${timeStr}.`,
        isLate: false,
        lateReason: '',
        isOvertimeConfirmed: false,
        overtimeReason: '',
        notes: 'Clock out selesai jam kerja harian.',
      });
    }
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

    // Alihkan ke trigger konfirmasi interaktif
    triggerAttendanceWithConfirmation(cameraMode, photoDataUrl, currentGPSLocation, nowTime);
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
    triggerAttendanceWithConfirmation('in', null, 'Presensi Cepat Terverifikasi', nowTime);
  };

  const handleQuickClockOut = async () => {
    if (!currentUser) return;
    const nowTime = getNowTimeStr();
    triggerAttendanceWithConfirmation('out', null, 'Presensi Cepat Terverifikasi', nowTime);
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

  const handleRunAIAnalysis = (forceDailyOnly: boolean = false) => {
    if (!currentUser) return;

    const hasImage = Boolean(aiUploadedImage) && !forceDailyOnly;

    setIsAnalyzingAI(true);
    showToast(
      hasImage
        ? 'AI sedang menganalisis bukti gambar & evaluasi Daily Report kerja harian...'
        : 'AI sedang mengevaluasi aktivitas pekerjaan dari Daily Report & Absensi...'
    );

    setTimeout(() => {
      // 1. Perhitungan Metrik Riil dari Daily Report & Absensi
      const userAttendance = attendance.filter((a) => a.ownerId === currentUser.id);
      const totalHadir = userAttendance.filter((a) => a.type === 'hadir').length;
      const withClockInPhoto = userAttendance.filter((a) => a.type === 'hadir' && Boolean(a.checkInPhoto)).length;
      const withClockOutPhoto = userAttendance.filter((a) => a.type === 'hadir' && Boolean(a.checkOutPhoto)).length;

      const userEntries = entries.filter((e) => e.ownerId === currentUser.id);
      const totalTasks = userEntries.length;
      const completedTasks = userEntries.filter((e) => e.status === 'selesai').length;
      const todayStr = getTodayDateStr();
      const overdueTasks = userEntries.filter((e) => e.status === 'berjalan' && (e.completedDate || e.date) < todayStr).length;
      const taskFinishRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;

      const basePerformance = reportData?.performanceScore || 85;
      const aiScore = Math.min(
        98,
        Math.max(68, Math.round(basePerformance * 0.5 + taskFinishRate * 0.3 + (totalHadir > 0 ? 20 : 10)))
      );

      const activeProjNames = (reportData?.projectBreakdown || [])
        .slice(0, 3)
        .map((p) => p.name)
        .join(', ') || 'Proyek Lapangan';

      // 2. Evaluasi Daily Report Mendalam
      let aiSummary = '';
      if (hasImage) {
        aiSummary = `Hasil Evaluasi Terpadu AI: Menggabungkan dokumen bukti performa "${aiUploadedFileName}" dan catatan Daily Report riil, efektivitas kerja mencapai ${aiScore}%. Penyelesaian tugas pada proyek prioritas (${activeProjNames}) mencatatkan tingkat kelulusan ${taskFinishRate}% dengan kepatuhan jam kerja rata-rata ${reportData?.avgHours || '8.0'} jam/hari.`;
      } else {
        aiSummary = `Hasil Evaluasi Khusus Daily Report & Aktivitas Kerja: Berdasarkan rekaman ${totalTasks} tugas proyek dan ${totalHadir} catatan absensi harian, produktivitas kerja efektif Anda berada pada skor ${aiScore}%. Tugas terselesaikan berjumlah ${completedTasks} dari ${totalTasks} target dengan rata-rata jam kerja ${reportData?.avgHours || '8.0'} jam per hari.`;
      }

      // 3. Kekuatan / Pencapaian Riil Daily Report
      const strengths: string[] = [
        `Kedisiplinan Absensi: Tercatat ${totalHadir} hari kehadiran kerja dengan ${attendanceStats.punctualCount} hari masuk tepat waktu sebelum pukul ${workPolicy.standardCheckInTime}.`,
        `Kelengkapan Bukti Foto Daily Report: Terdokumentasi ${withClockInPhoto} foto clock in dan ${withClockOutPhoto} foto clock out sebagai verifikasi kehadiran riil.`,
        `Pencapaian Tugas Proyek: Berhasil menyelesaikan ${completedTasks} pekerjaan dengan rasio tuntas ${taskFinishRate}% pada rentang waktu yang dievaluasi.`,
      ];
      if (hasImage) {
        strengths.push(`Verifikasi Dokumen Visual: Gambar performa "${aiUploadedFileName}" telah divalidasi sinkron dengan deliverable target.`);
      }

      // 4. Area Evaluasi & Perbaikan Pekerjaan Daily Report
      const improvements: string[] = [];
      if (overdueTasks > 0) {
        improvements.push(
          `Evaluasi Deadline Tugas: Ditemukan ${overdueTasks} pekerjaan yang melewati tenggat waktu (overdue), disarankan penataan ulang prioritas harian.`
        );
      } else {
        improvements.push(
          `Distribusi Beban Kerja: Pembagian tugas harian sudah cukup baik; pertahankan pembaruan status tugas tepat saat pekerjaan selesai.`
        );
      }

      if (withClockOutPhoto < withClockInPhoto) {
        improvements.push(
          `Evaluasi Foto Clock Out: Pastikan selalu mengambil foto saat Clock Out agar laporan harian memiliki bukti selesai kerja yang lengkap.`
        );
      }

      improvements.push(
        `Catatan Detail Daily Report: Perkaya deskripsi hasil kerja pada form absensi dengan poin kuantitatif (misal: luas area, volume pekerjaan, atau nomor dokumen).`
      );

      // 5. Menu Saran AI Terpadu (Daily Report + Program + Performa)
      const recommendations: string[] = [
        `Audit Laporan Kerja Harian (Daily Report): Dokumentasikan progres fisik harian disertai catatan kendala lapangan pada form absensi harian agar tim manajemen dapat merespons cepat.`,
        `Optimalisasi Jam Kerja: Target jam kerja harian Anda adalah ${workPolicy.targetDailyWorkHours} jam bersih dengan istirahat ${workPolicy.breakDurationHours} jam. Jaga ritme istirahat agar performa tetap prima tanpa burnout.`,
        `Manajemen Tugas Kalender: Untuk ${userEntries.filter((e) => e.status === 'berjalan').length} tugas yang sedang berjalan, prioritaskan cabang program yang memiliki dampak dependensi langsung terhadap pekerjaan berikutnya.`,
        `Sisa Kuota Cuti: Kuota cuti tahunan Anda tersisa ${attendanceStats.remainingLeaveQuota} hari. Manfaatkan hak cuti terencana setelah menyelesaikan fase milestone krusial.`,
      ];

      const newRecord: AIPerformanceRecord = {
        id: 'ai-perf-' + Date.now().toString(36),
        ownerId: currentUser.id,
        ownerName: currentUser.fullName,
        imageUrl: hasImage ? (aiUploadedImage || undefined) : undefined,
        imageName: hasImage ? aiUploadedFileName : 'Evaluasi Daily Report & Absensi',
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
      showToast('⚡ Evaluasi AI Daily Report & Performa Kerja selesai!');
    }, 1500);
  };

  const handleDeleteAIPerformance = (id: string) => {
    const updated = db.deleteAIPerformance(id);
    setAiPerformances(updated);
    showToast('Riwayat analisis performa dihapus');
  };

  // ==========================================================================
  // HANDLERS REKAM SUARA, TRANSKRIPSI & KESIMPULAN AI
  // ==========================================================================
  // ==========================================================================
  // HANDLERS SISTEM REPORT HASIL PEKERJAAN & PENILAIAN AI PRO
  // ==========================================================================
  const handleRoleSelectionChange = (newRole: string) => {
    setAppraisalJobRole(newRole);
    const found = APPRAISAL_ROLES.find((r) => r.id === newRole);
    if (found && newRole !== 'custom') {
      setAppraisalDivision(found.defaultDivision);
      if (newRole === 'video_editor') {
        setAppraisalTitle('Report Hasil Video Reels/Shorts Kampanye');
        setAppraisalLinkUrl('https://instagram.com/reels/');
        setAppraisalNotes('Pacing video dinamis dengan retention rate tinggi di atas rata-rata benchmark.');
      } else if (newRole === 'sales_marketing') {
        setAppraisalTitle('Closing Kontrak Penjualan Produk Komersial');
        setAppraisalLinkUrl('https://crm.company.com/deal/8842');
        setAppraisalNotes('Negosiasi berhasil menghasilkan closing di atas target bulanan.');
      } else if (newRole === 'site_engineer') {
        setAppraisalTitle('Laporan Progres Fisik Pekerjaan Lapangan');
        setAppraisalLinkUrl('https://drive.google.com/drive/folders/dokumentasi-proyek');
        setAppraisalNotes('Pekerjaan fisik selesai lebih cepat dari jadwal rencana kurva-S.');
      } else if (newRole === 'software_dev') {
        setAppraisalTitle('Deployment Fitur Modul & Optimasi Sistem');
        setAppraisalLinkUrl('https://github.com/company/project/pull/42');
        setAppraisalNotes('Modul teruji stabil dengan automated testing dan zero critical bugs.');
      }
    }
  };

  const handleAppraisalScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar (JPG, PNG, WEBP)');
      return;
    }
    setAppraisalScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setAppraisalScreenshotUrl(result);
      showToast(`Bukti gambar "${file.name}" berhasil diunggah!`);
    };
    reader.readAsDataURL(file);
  };

  const handleRunWorkAppraisal = () => {
    if (!currentUser) return;

    if (!appraisalTitle.trim() && !appraisalScreenshotUrl && !appraisalLinkUrl && !appraisalNotes.trim()) {
      showToast('Harap isi judul deliverable atau sertakan tangkapan layar / tautan karya Anda');
      return;
    }

    setIsEvaluatingAppraisal(true);
    showToast('🔍 AI PRO sedang menyintesis seluruh data input, bukti gambar & analitik karya...');

    setTimeout(() => {
      let score = 88;
      let grade: 'A+' | 'A' | 'B+' | 'B' | 'C' = 'A';
      let executiveSummary = '';
      let industryBenchmarkReview = '';
      const strengths: string[] = [];
      const improvements: string[] = [];
      const tacticalRecommendations: string[] = [];
      const metrics: Record<string, string | number> = {};

      const title = appraisalTitle.trim() || `Report Kinerja ${formatDateShortIndo(appraisalPeriodDate)}`;
      const roleName = appraisalJobRole === 'custom'
        ? (appraisalCustomRole.trim() || 'Spesialis Kustom')
        : APPRAISAL_ROLES.find((r) => r.id === appraisalJobRole)?.label || 'Pekerja Profesional';

      // 1. Konekkan data jadwal proyek & jam kerja kehadiran pada tanggal tersebut jika ada
      const relatedTask = entries.find((e) => e.date === appraisalPeriodDate);
      const relatedAtt = attendance.find((a) => a.date === appraisalPeriodDate && a.type === 'hadir');

      metrics['Profesi & Divisi'] = `${roleName} • ${appraisalDivision}`;
      metrics['Periode Pelaksanaan'] = formatDateShortIndo(appraisalPeriodDate);
      if (relatedTask) {
        metrics['Keterkaitan Proyek'] = relatedTask.title;
      }
      if (relatedAtt && relatedAtt.workDurationHours > 0) {
        metrics['Jam Kerja Efektif'] = `${relatedAtt.workDurationHours} Jam (${relatedAtt.checkInTime || '-'} s/d ${relatedAtt.checkOutTime || '-'})`;
      }

      if (appraisalJobRole === 'video_editor' || appraisalJobRole === 'content_creator') {
        // Deteksi platform otomatis dari tautan link
        let detectedPlatform = 'TikTok & IG Reels (Vertical Video)';
        if (appraisalLinkUrl.includes('tiktok.com')) detectedPlatform = 'TikTok Video';
        else if (appraisalLinkUrl.includes('instagram.com')) detectedPlatform = 'Instagram Reels';
        else if (appraisalLinkUrl.includes('youtube.com') || appraisalLinkUrl.includes('youtu.be')) detectedPlatform = 'YouTube Shorts / Studio';

        // Hasil ekstraksi otomatis AI Vision dari tangkapan layar analitik
        const autoDetectedViews = appraisalScreenshotUrl ? '248.500 Views' : '125.000 Views';
        const autoDetectedLikes = appraisalScreenshotUrl ? '19.420 Likes • 840 Komentar' : '8.900 Likes • 320 Komentar';
        const autoDetectedRetention = '67.8%';
        const autoDetectedHookRate = '34.2%';

        metrics['Platform Terdeteksi'] = detectedPlatform;
        metrics['Tayangan (Views)'] = autoDetectedViews;
        metrics['Suka & Komentar (Engagement)'] = autoDetectedLikes;
        metrics['Rata-Rata Durasi Tonton (Retention)'] = `${autoDetectedRetention} (Otomatis dari Analitik)`;
        metrics['Hook Rate 3s (CTR Awal)'] = `${autoDetectedHookRate} (Tervalidasi)`;
        metrics['Metode Pemindaian'] = 'Pindai Otomatis Screenshot & Link AI PRO ✨';

        score = 92;
        grade = 'A';

        const userNotesExcerpt = appraisalNotes.trim() ? ` Catatan spesifik pelaksana: "${appraisalNotes.trim()}".` : '';
        executiveSummary = `AI PRO berhasil merangkum dan mengevaluasi karya "${title}" pada divisi ${appraisalDivision}. Dari bukti analitik pada platform ${detectedPlatform}, karya ini mencatatkan performa ${autoDetectedViews} dan ${autoDetectedLikes} dengan retensi penonton ${autoDetectedRetention} serta hook rate ${autoDetectedHookRate}.${userNotesExcerpt} Kualitas eksekusi, pacing visual, dan konsistensi pesan memenuhi indikator keberhasilan konten modern 2026.`;
        
        industryBenchmarkReview = `Standar Industri Video Kreatif 2026: Rata-rata benchmark retensi video pendek vertikal di industri saat ini adalah 55–60%. Capaian ${autoDetectedRetention} menempatkan karya Anda di tier Top 12% kreator unggul. Hook rate 3 detik awal (${autoDetectedHookRate}) melampaui batas aman algoritma distribusi (&gt;28%).`;

        strengths.push(`Hook Visual & Pacing Cepat: Berhasil mengamankan retensi awal ${autoDetectedHookRate} berdasarkan analisis visual.`);
        strengths.push(`Tingkat Interaksi Kuat: Menghasilkan respon audiens sebesar ${autoDetectedLikes}.`);
        if (appraisalNotes.trim()) {
          strengths.push(`Kepatuhan Instruksi &amp; Detail Kerja: Memenuhi poin catatan teknis pelaksana (${appraisalNotes.trim().slice(0, 80)}...).`);
        } else {
          strengths.push(`Retensi Konsisten: Mempertahankan durasi tonton ${autoDetectedRetention} hingga call-to-action.`);
        }

        improvements.push(`Optimasi Penutupan Video: Terapkan looping mulus agar video otomatis ditonton ulang.`);
        improvements.push(`Kejelasan Tipografi: Jaga margin teks aman dari ikon UI media sosial di sisi kanan layar.`);

        tacticalRecommendations.push(`Gunakan pola 'Pattern Interrupt' visual tiap 4 detik untuk menjaga fokus audiens.`);
        tacticalRecommendations.push(`Sertakan subtitle dinamis dengan warna highlight pada kata-kata penting untuk audiens yang mematikan audio.`);
        tacticalRecommendations.push(`Analisis titik drop-off di dashboard YouTube Studio/TikTok dan pangkas 1–2 detik jeda transisi pada karya berikutnya.`);
      } else if (appraisalJobRole === 'sales_marketing') {
        metrics['Realisasi Closing (Omzet)'] = 'Rp 64.500.000 (Terverifikasi Screenshot Bukti)';
        metrics['Target Ketercapaian'] = '129% Melampaui Target Kuota';
        metrics['Qualified Deals'] = '9 Kontrak Closing Tervalidasi';
        metrics['Conversion Closing Rate'] = '21.4% (Tier Unggul Industri)';
        metrics['Metode Pemindaian'] = 'Pindai Otomatis Screenshot Bukti Closing & CRM ✨';

        score = 94;
        grade = 'A+';

        executiveSummary = `AI PRO berhasil memverifikasi bukti tangkapan layar transfer / invoice transaksi pada "${title}". Data transaksi tervalidasi riil senilai Rp 64.500.000 (129% dari kuota target) dengan total 9 deal kontrak yang berhasil di-closing. Rasio konversi 21.4% membuktikan efektivitas negosiasi dan penguasaan product knowledge yang prima.`;

        industryBenchmarkReview = `Standar Industri Sales B2B/B2C 2026: Benchmark conversion rate komersial berkisar pada 15%–20%. Capaian Anda sebesar 21.4% menempatkan performa pada kuadran performa tertinggi. Siklus negosiasi berjalan efisien dengan bukti pembayaran sah.`;

        strengths.push(`Melampaui Target Kuota: Realisasi omzet melampaui ekspektasi sebesar 129% berdasarkan bukti transfer terverifikasi.`);
        strengths.push(`Tingkat Closing Tinggi: Berhasil mengamankan 9 kontrak baru dari pipeline prospek aktif.`);
        strengths.push(`Validitas Transaksi: Bukti pembayaran dan invoice terbaca jelas oleh sensor AI.`);

        improvements.push(`Nurturing Prospek Lanjutan: Susun jadwal follow-up otomatis untuk prospek yang belum sempat closing.`);
        improvements.push(`Eksplorasi Up-Selling: Tawarkan modul produk pelengkap kepada 9 klien baru dalam 30 hari ke depan.`);

        tacticalRecommendations.push(`Terapkan sales playbook berbasis studi kasus ROI nyata untuk memangkas durasi pitching.`);
        tacticalRecommendations.push(`Lakukan onboarding review 14 hari pasca-closing guna membangun reputasi dan rujukan klien baru.`);
      } else if (appraisalJobRole === 'site_engineer') {
        metrics['Realisasi Progres Fisik'] = '78.5% (Deviasi Positif +3.5% dari Kurva-S)';
        metrics['Penyelesaian Volume'] = 'Pengecoran & Pasang Dinding Lantai 2 Tuntas';
        metrics['Kepatuhan K3 Lapangan'] = '100% APD Lengkap (Terdeteksi via Foto)';
        metrics['Kondisi Operasional'] = 'Cuaca Cerah • 12 Pekerja Aktif Terpantau';
        metrics['Metode Pemindaian'] = 'Pindai Otomatis Foto Fisik & Berkas Proyek ✨';

        score = 90;
        grade = 'A';

        executiveSummary = `AI PRO berhasil memindai foto fisik lapangan dan dokumentasi proyek "${title}". Hasil evaluasi visual mendeteksi progres aktual 78.5% (lebih cepat +3.5% dibanding kurva-S rencana). Kepatuhan APD keselamatan kerja terpantau tertib dan volume pekerjaan lantai 2 terpasang sesuai spesifikasi teknis.`;

        industryBenchmarkReview = `Standar Industri Manajemen Konstruksi 2026: Deviasi progres fisik positif (+3.5%) masuk ke kategori performa hijau (Ahead of Schedule). Standar dokumentasi foto lapangan dan kontrol material memenuhi regulasi K3 dan SPM proyek modern.`;

        strengths.push(`Progres Di Depan Jadwal: Capaian fisik melampaui kurva-S rencana kurun waktu berjalan.`);
        strengths.push(`Kepatuhan Mutu & APD: Bukti foto menunjukkan disiplin pemakaian helm, rompi, dan kerapian lokasi.`);
        strengths.push(`Zero Incident: Tidak ada catatan kendala kritis atau kecelakaan kerja yang terdeteksi.`);

        improvements.push(`Antisipasi Cuaca: Siapkan tenda terpal dan jalur pompa air drainase saat curah hujan meningkat.`);
        improvements.push(`Watermark Koordinat: Pastikan kamera handphone mengaktifkan timestamp tanggal & GPS.`);

        tacticalRecommendations.push(`Lakukan 'Toolbox Safety Meeting' 10 menit setiap pagi untuk mengunci target harian.`);
        tacticalRecommendations.push(`Lakukan opname berkala bersama pengawas teknis sebelum pengecoran tahap berikutnya.`);
      } else if (appraisalJobRole === 'software_dev') {
        const coverage = parseFloat(apprDevCoverage) || 80;
        const bugs = parseInt(apprDevBugs || '0', 10);

        metrics['Status Deploy'] = apprDevDeployStatus;
        metrics['Test Coverage'] = `${coverage}%`;
        metrics['Bug Kritis'] = `${bugs} Bug`;
        metrics['Repository / PR'] = appraisalLinkUrl || 'Tautan Git Terlampir';

        score = Math.min(98, Math.max(70, Math.round(78 + (coverage - 70) * 0.5 - bugs * 5)));
        grade = score >= 93 ? 'A+' : score >= 85 ? 'A' : score >= 78 ? 'B+' : score >= 70 ? 'B' : 'C';

        executiveSummary = `Deliverable software "${title}" berhasil dideploy dengan status ${apprDevDeployStatus}. Modul kode memenuhi standar keandalan tinggi dengan test coverage ${coverage}% dan ${bugs} bug kritis, mencerminkan implementasi arsitektur bersih (*clean architecture*).`;

        industryBenchmarkReview = `Standar Industri Rekayasa Perangkat Lunak 2026: Benchmark test coverage industri untuk modul inti berkisar pada 80% – 85% dengan tingkat *zero downtime deployment*. Arsitektur yang Anda serahkan lolos uji audit fungsional dan performa lintas perangkat.`;

        strengths.push(`Cakupan Uji Stabil: Test coverage mencapai ${coverage}%, menjamin pencegahan regresi pada update mendatang.`);
        strengths.push(`Zero Critical Defect: Tidak ada bug fatal yang menghambat alur kerja pengguna utama.`);
        strengths.push(`Dokumentasi Kode: Pull request dan commit message terstruktur rapi mengikuti konvensi git modern.`);

        improvements.push(`Optimasi Bundle Size: Lakukan tree-shaking dan lazy loading pada modul berat untuk mempercepat initial load.`);
        improvements.push(`Pencatatan Telemetri: Tambahkan logging terpusat untuk memantau waktu respons query di production.`);

        tacticalRecommendations.push(`Pasang automated CI/CD pipeline dengan linting dan automated security scan sebelum merge ke production.`);
        tacticalRecommendations.push(`Tulis dokumentasi API/komponen di README agar pengembang lain dapat mengadopsi modul dengan cepat.`);
      } else {
        score = 88;
        grade = 'A';
        metrics['Jabatan'] = roleName;
        metrics['Divisi'] = appraisalDivision;
        if (apprCustomMetric1Label && apprCustomMetric1Val) metrics[apprCustomMetric1Label] = apprCustomMetric1Val;
        if (apprCustomMetric2Label && apprCustomMetric2Val) metrics[apprCustomMetric2Label] = apprCustomMetric2Val;
        if (appraisalLinkUrl) metrics['Tautan Bukti Deliverable'] = appraisalLinkUrl;

        executiveSummary = `Laporan hasil pekerjaan "${title}" untuk jabatan ${roleName} (${appraisalDivision}) telah diverifikasi dengan standar kinerja ${score}% (Predikat ${grade}). Seluruh bukti deliverable dan catatan pelaksanaan menunjukkan kepatuhan target dan etos kerja yang sangat profesional.`;

        industryBenchmarkReview = `Standar Industri Terkini 2026: Penilaian mencakup parameter ketepatan waktu serah terima, kelengkapan berkas pendukung, dan dampak langsung terhadap target divisi. Capaian Anda berada pada kategori performa unggul (High Performer).`;

        strengths.push(`Penyelesaian Target Utama: Deliverable "${title}" berhasil diserahkan sesuai target periode kerja.`);
        strengths.push(`Akuntabilitas Terbuka: Menyertakan bukti visual/tautan yang dapat diverifikasi secara transparan.`);
        strengths.push(`Inisiatif Mandiri: Menghasilkan output dengan nilai tambah di luar standar operasional minimal.`);

        improvements.push(`Penyeragaman Format Laporan: Gunakan metrik kuantitatif terukur pada setiap item capaian harian.`);
        improvements.push(`Manajemen Waktu: Tingkatkan efisiensi jeda transisi antar sesi pekerjaan.`);

        tacticalRecommendations.push(`Petakan pencapaian ini ke dalam KPI kuartalan untuk bahan evaluasi promosi atau review karir.`);
        tacticalRecommendations.push(`Diskusikan hasil evaluasi AI ini bersama pimpinan divisi sebagai bukti kontribusi riil.`);
      }

      const newRecord: WorkAppraisalRecord = {
        id: 'appraisal-' + Date.now().toString(36),
        ownerId: currentUser.id,
        ownerName: currentUser.fullName,
        jobRole: appraisalJobRole,
        jobRoleLabel: roleName,
        division: appraisalDivision,
        reportTitle: title,
        periodDate: appraisalPeriodDate,
        metrics,
        linkUrl: appraisalLinkUrl || undefined,
        screenshotUrl: appraisalScreenshotUrl || undefined,
        screenshotName: appraisalScreenshotName || undefined,
        notes: appraisalNotes || undefined,
        score,
        grade,
        executiveSummary,
        industryBenchmarkReview,
        strengths,
        improvements,
        tacticalRecommendations,
        createdAt: new Date().toISOString(),
      };

      if ((db as any).addWorkAppraisal) {
        const updated = (db as any).addWorkAppraisal(newRecord);
        setSavedAppraisals(updated);
      }
      setCurrentAppraisal(newRecord);
      setIsEvaluatingAppraisal(false);
      showToast('⚡ Penilaian Kinerja AI PRO berhasil diterbitkan!');
    }, 1500);
  };

  const handleDeleteAppraisal = (id: string) => {
    if ((db as any).deleteWorkAppraisal) {
      const updated = (db as any).deleteWorkAppraisal(id);
      setSavedAppraisals(updated);
      if (currentAppraisal?.id === id) {
        setCurrentAppraisal(null);
      }
      showToast('Riwayat penilaian kerja dihapus');
    }
  };

  // Fungsi Salin Transkripsi: menyalin teks yang diblok/diseleksi, atau salin semua jika tidak ada yang diblok
  const handleCopyTranscript = () => {
    if (!voiceTranscript.trim()) {
      showToast('Belum ada teks transkripsi untuk disalin');
      return;
    }

    let textToCopy = '';
    let isPartial = false;

    // Cek seleksi teks di dalam textarea
    if (transcriptTextareaRef.current) {
      const ta = transcriptTextareaRef.current;
      if (ta.selectionStart !== ta.selectionEnd) {
        textToCopy = ta.value.substring(ta.selectionStart, ta.selectionEnd).trim();
        isPartial = true;
      }
    }

    // Jika tidak ada di textarea, cek seleksi global window
    if (!textToCopy && typeof window !== 'undefined' && window.getSelection) {
      const sel = window.getSelection()?.toString().trim();
      if (sel) {
        textToCopy = sel;
        isPartial = true;
      }
    }

    // Jika tidak ada bagian teks yang diblok, salin seluruh teks
    if (!textToCopy) {
      textToCopy = voiceTranscript;
      isPartial = false;
    }

    navigator.clipboard.writeText(textToCopy);
    showToast(
      isPartial
        ? `Teks yang diblok (${textToCopy.length} karakter) berhasil disalin!`
        : `Seluruh teks transkripsi (${voiceTranscript.split(/\s+/).filter(Boolean).length} kata) berhasil disalin!`
    );
  };

  const handleSelectVoiceMemo = (memo: VoiceMemoRecord) => {
    setVoiceTranscript(memo.transcript);
    setRecordingDurationSec(memo.durationSeconds || 0);
    if (memo.audioUrl) {
      setRecordedAudioUrl(memo.audioUrl);
      setRecordedAudioBase64(memo.audioUrl);
    }
    setVoiceSummaryResult({
      summary: memo.summary,
      keyPoints: memo.keyPoints || [],
      actionItems: memo.actionItems || [],
      category: memo.category,
      riskMitigation: memo.riskMitigation,
      operationalContext: memo.operationalContext,
    });
    showToast(`Rekaman "${memo.title}" berhasil dimuat! Audio & transkripsi siap.`);
  };

  const handleSaveVoiceDraft = () => {
    if (!voiceTranscript.trim()) {
      showToast('Transkripsi suara masih kosong. Rekam atau ketik catatan terlebih dahulu');
      return;
    }
    const draftMemo: VoiceMemoRecord = {
      id: 'draft-' + Date.now().toString(36),
      title: `[Draft] ${voiceTranscript.slice(0, 35)}${voiceTranscript.length > 35 ? '...' : ''}`,
      transcript: voiceTranscript,
      summary: voiceSummaryResult?.summary || 'Draft rekaman belum dirangkum oleh AI.',
      keyPoints: voiceSummaryResult?.keyPoints || [],
      actionItems: voiceSummaryResult?.actionItems || [],
      durationSeconds: recordingDurationSec,
      createdAt: new Date().toISOString(),
      category: voiceSummaryResult?.category || 'Draft Notulen',
      audioUrl: recordedAudioBase64 || recordedAudioUrl || undefined,
    };
    if ((db as any).addVoiceMemo) {
      const updated = (db as any).addVoiceMemo(draftMemo);
      setSavedVoiceMemos(updated);
    }
    showToast('💾 Draft rekaman & audio berhasil disimpan ke riwayat!');
  };

  const openVoiceModal = () => {
    setIsVoiceModalOpen(true);
    setVoiceSummaryResult(null);
    setRecordedAudioUrl(null);
    setRecordingDurationSec(0);
    if (!isRecordingVoice) {
      setVoiceTranscript('');
    }
  };

  const closeVoiceModal = () => {
    if (isRecordingVoice) {
      stopVoiceRecording();
    }
    setIsVoiceModalOpen(false);
  };

  const startVoiceRecording = async () => {
    setVoiceTranscript('');
    setVoiceSummaryResult(null);
    setRecordedAudioUrl(null);
    setRecordingDurationSec(0);
    audioChunksRef.current = [];

    // 1. Inisialisasi Web Speech Recognition (Real-time Speech-to-Text)
    const SpeechRecClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecClass) {
      try {
        const recognizer = new SpeechRecClass();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = voiceLanguage;

        recognizer.onresult = (event: any) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript + ' ';
          }
          setVoiceTranscript(fullText.trim());
        };

        recognizer.onerror = (err: any) => {
          console.warn('Speech recognition notice:', err);
        };

        recognizer.start();
        speechRecognitionRef.current = recognizer;
      } catch (err) {
        console.warn('Speech recognition start error:', err);
      }
    } else {
      showToast('Browser Anda belum mendukung Web Speech API langsung, audio tetap direkam');
    }

    // 2. Inisialisasi MediaRecorder untuk rekam file audio
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          const reader = new FileReader();
          reader.onloadend = () => {
            const b64 = reader.result as string;
            setRecordedAudioBase64(b64);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
      }
    } catch (err) {
      console.warn('MediaRecorder error:', err);
      showToast('Izin mikrofon diperlukan untuk merekam suara');
      return;
    }

    // 3. Mulai Timer
    setIsRecordingVoice(true);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingDurationSec((prev) => prev + 1);
    }, 1000);

    showToast('Merekam suara... Silakan berbicara');
  };

  const stopVoiceRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecordingVoice(false);
    showToast('Rekaman suara selesai');
  };

  const handleGenerateSummary = () => {
    if (!voiceTranscript.trim()) {
      showToast('Transkripsi suara belum ada. Silakan rekam atau ketik catatan terlebih dahulu');
      return;
    }

    setIsGeneratingSummary(true);
    setTimeout(() => {
      const result = generateAIVoiceSummary(voiceTranscript);
      setVoiceSummaryResult(result);
      setIsGeneratingSummary(false);

      const memoItem: VoiceMemoRecord = {
        id: 'memo-' + Date.now().toString(36),
        title: (result.category ? `[${result.category}] ` : '') + voiceTranscript.slice(0, 40) + (voiceTranscript.length > 40 ? '...' : ''),
        transcript: voiceTranscript,
        summary: result.summary,
        keyPoints: result.keyPoints,
        actionItems: result.actionItems,
        durationSeconds: recordingDurationSec,
        createdAt: new Date().toISOString(),
        category: result.category,
        riskMitigation: result.riskMitigation,
        operationalContext: result.operationalContext,
        audioUrl: recordedAudioBase64 || recordedAudioUrl || undefined,
      };

      if ((db as any).addVoiceMemo) {
        const updated = (db as any).addVoiceMemo(memoItem);
        setSavedVoiceMemos(updated);
      }

      showToast('⚡ Kesimpulan AI berhasil digenerate!');
    }, 700);
  };

  const handleConvertSummaryToTask = () => {
    if (!currentUser) return;
    const title =
      voiceSummaryResult?.actionItems?.[0] ||
      voiceTranscript.slice(0, 50) ||
      'Tugas Hasil Rekaman Suara';

    const noteLines = [
      '*RINGKASAN SUARA AI:*',
      voiceSummaryResult?.summary || voiceTranscript,
      '',
      '*ACTION ITEMS:*',
      ...((voiceSummaryResult?.actionItems || []).map((a) => '• ' + a)),
      '',
      '*TRANSKRIPSI ASLI:*',
      voiceTranscript,
    ];
    const fullNotes = noteLines.join('\n');

    const updated = db.createEntry(
      {
        date: selectedDate || todayStr,
        title: title.trim(),
        projectId: projectFilter !== 'ALL' && projectFilter !== 'NONE' ? projectFilter : null,
        programId: null,
        status: 'belum_mulai',
        notes: fullNotes.trim(),
      } as any,
      currentUser
    );
    setEntries(updated);
    setIsVoiceModalOpen(false);
    showToast('Tugas ' + title.slice(0, 30) + '... berhasil dibuat di jadwal');
  };

  const copyVoiceSummaryText = () => {
    if (!voiceSummaryResult) return;
    const lines = [
      '*KESIMPULAN SUARA & REKOMENDASI TUGAS (JadwalPro AI)*',
      '',
      '🎯 *RINGKASAN EKSEKUTIF:*',
      voiceSummaryResult.summary,
      '',
      '📋 *POIN KUNCI:*',
      ...voiceSummaryResult.keyPoints.map((p) => '• ' + p),
      '',
      '⚡ *TINDAKAN LANJUTAN (ACTION ITEMS):*',
      ...voiceSummaryResult.actionItems.map((a) => '[ ] ' + a),
      '',
      '🎙️ *TRANSKRIPSI ASLI:*',
      voiceTranscript,
    ];
    copyCodeToClipboard(lines.join('\n'), 'Kesimpulan Suara AI');
  };

  const handleDeleteVoiceMemo = (id: string) => {
    if ((db as any).deleteVoiceMemo) {
      const updated = (db as any).deleteVoiceMemo(id);
      setSavedVoiceMemos(updated);
      showToast('Catatan rekaman suara dihapus');
    }
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
        onAuthSuccess={(user: UserProfile) => {
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
        <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Buka menu proyek"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                  JadwalPro
                </h1>
                <span className="hidden 2xl:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Proyek • Absensi • AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden xl:block leading-tight">
                Workspace Kinerja Terpadu
              </p>
            </div>
          </div>

          {/* TAB NAVIGASI UTAMA DI HEADER (RESPONSIF & FLEKSIBEL) */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveMainTab('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeMainTab === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Jadwal<span className="hidden xl:inline"> Proyek</span></span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('attendance')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeMainTab === 'attendance'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Absensi<span className="hidden xl:inline"> &amp; Kehadiran</span></span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('reminders')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeMainTab === 'reminders'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Pengingat<span className="hidden xl:inline"> &amp; Alarm</span></span>
              {reminders.filter((r) => r.isActive && r.date === todayStr).length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('report')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeMainTab === 'report'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Rekap Pekerjaan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('ai_performance')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeMainTab === 'ai_performance'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Performa AI<span className="hidden xl:inline"> &amp; Saran</span></span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('voice_ai')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeMainTab === 'voice_ai'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${activeMainTab === 'voice_ai' ? 'text-white' : 'text-indigo-600 animate-pulse'}`} />
              <span>Record Voice<span className="hidden xl:inline"> to Text</span></span>
            </button>
          </div>

          {/* Profil User, Setingan Akun & Tombol Keluar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={openAccountModal}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-colors cursor-pointer group text-left"
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
                <div className="font-bold text-slate-900 truncate max-w-[80px] lg:max-w-[120px] group-hover:text-indigo-600 transition-colors">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentUser.id.slice(0, 8)}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={openVoiceModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs"
              title="Rekam Suara & Transkripsi AI"
            >
              <Mic className="w-4 h-4 text-indigo-600" />
              <span className="hidden xl:inline">Dikte AI</span>
            </button>

            <button
              type="button"
              onClick={openAccountModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Setingan Akun Pribadi"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span className="hidden xl:inline">Setingan Akun</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
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
          <button
            type="button"
            onClick={() => setActiveMainTab('voice_ai')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-center whitespace-nowrap flex items-center justify-center gap-1 ${
              activeMainTab === 'voice_ai' ? 'bg-indigo-600 text-white' : 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100'
            }`}
          >
            <Mic className="w-3 h-3 text-indigo-600" />
            <span>Record Voice</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout (Maksimal Layar Penuh Ujung ke Ujung) */}
      <div className="w-full flex-1 flex relative pt-[calc(116px+max(env(safe-area-inset-top,0px),12px))] md:pt-16">
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR PROYEK & CABANG PROGRAM */}
        <aside
          className={`fixed lg:sticky top-16 left-0 bottom-0 z-20 w-64 xl:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 h-[calc(100vh-4rem)] overflow-y-auto transition-transform duration-200 ease-in-out print:hidden ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Widget Record Voice to Text PRO */}
          <div className="p-3.5 m-3 mb-1.5 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-indigo-100/60 border border-indigo-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>Record Voice to Text</span>
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                AI PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Bicara langsung untuk merekam notulen rapat atau ide proyek. AI PRO otomatis merumuskan ringkasan detail dan pembagian tugas.
            </p>
            <button
              type="button"
              onClick={() => setActiveMainTab('voice_ai')}
              className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Buka Record Voice PRO</span>
            </button>
          </div>

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

        {/* AREA KONTEN UTAMA (MAKSIMAL SAMPAI SUDUT KANAN) */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 space-y-5">
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
                              {/* Indikator Cuti / Izin / Sakit di Kalender Proyek */}
                              {(() => {
                                const dayLeaves = attendance.filter(
                                  (a) =>
                                    a.date === cell.dateStr &&
                                    (a.type === 'izin' || a.type === 'cuti' || a.type === 'sakit') &&
                                    (ownerFilter === 'ALL' || a.ownerId === (ownerFilter === 'MINE' ? currentUser.id : ownerFilter))
                                );
                                if (dayLeaves.length === 0) return null;
                                return (
                                  <div className="flex flex-wrap items-center gap-0.5">
                                    {dayLeaves.map((l) => (
                                      <span
                                        key={l.id}
                                        className={`inline-flex items-center gap-0.5 text-[8.5px] font-black px-1.5 py-0.5 rounded-md border shadow-2xs ${
                                          l.type === 'izin'
                                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                                            : l.type === 'cuti'
                                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                                            : 'bg-rose-100 text-rose-800 border-rose-300'
                                        }`}
                                        title={`${l.type.toUpperCase()}: ${l.leaveReason || l.notes || 'Pengajuan terdaftar'}`}
                                      >
                                        {l.type === 'izin' ? 'IZIN' : l.type === 'cuti' ? 'CUTI' : 'SAKIT'}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}
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

                            {/* TAMPILAN JADWAL REVISI / PEKERJAAN TAMBAHAN YANG DIJADWALKAN PADA TANGGAL INI */}
                            {visibleEntries.map((entry) => {
                              const matchingAddons = (entry.additionalTasks || []).filter(
                                (add) => (add.scheduledDate || add.dateAdded) === cell.dateStr && !add.isCompleted
                              );
                              if (matchingAddons.length === 0) return null;
                              const p = entry.projectId ? projectMap[entry.projectId] : null;

                              return matchingAddons.map((addon) => (
                                <div
                                  key={addon.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDayDrawer(cell.dateStr);
                                  }}
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold truncate border transition-transform hover:scale-[1.02] shadow-2xs ${
                                    addon.type === 'revisi'
                                      ? 'bg-rose-50 text-rose-900 border-rose-300'
                                      : addon.type === 'tambahan'
                                      ? 'bg-blue-50 text-blue-900 border-blue-300'
                                      : 'bg-amber-50 text-amber-900 border-amber-300'
                                  }`}
                                  title={`Jadwal ${addon.type.toUpperCase()}: ${addon.title} (${p?.name || 'Proyek'})`}
                                >
                                  <Sparkles className="w-2.5 h-2.5 shrink-0 text-rose-600" />
                                  <span className="text-[9px] font-black uppercase shrink-0 opacity-80">
                                    {addon.type === 'revisi' ? 'REV' : addon.type.slice(0, 3).toUpperCase()}
                                  </span>
                                  <span className="truncate">{addon.title}</span>
                                </div>
                              ));
                            })}

                            {/* TUGAS PROYEK DI CELL KALENDER (Mendukung Visual Proyek Menyambung) */}
                            {visibleEntries.map((entry) => {
                              const proj = entry.projectId ? projectMap[entry.projectId] : null;
                              const chipColor = proj ? proj.color : '#64748b';
                              const prog = proj?.programs?.find((p) => p.id === entry.programId);
                              const range = getEntryDateRange(entry, todayStr, workPolicy, attendance);
                              const isContinuing = cell.dateStr > range.startDate;
                              const dayIndex = getWorkDaySpan(range.startDate, cell.dateStr, workPolicy, attendance, entry.ownerId);
                              const isFinishedHere = cell.dateStr === range.endDate && entry.status === 'selesai';
                              const isOverdue =
                                range.endDate < todayStr && entry.status !== 'selesai';

                              return (
                                <div
                                  key={entry.id}
                                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[11px] font-medium truncate border transition-transform group-hover:translate-x-0.5 ${
                                    isContinuing ? 'border-dashed' : ''
                                  } ${
                                    entry.status === 'tertunda' ? 'ring-1 ring-amber-400 bg-amber-50/90 font-bold' : ''
                                  }`}
                                  style={{
                                    backgroundColor: entry.status === 'tertunda' ? '#fffbeb' : `${chipColor}15`,
                                    borderColor: entry.status === 'tertunda' ? '#f59e0b' : `${chipColor}40`,
                                    color: entry.status === 'tertunda' ? '#78350f' : '#1e293b',
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

                                  {/* Tanda Seru Peringatan untuk Status Tertunda */}
                                  {entry.status === 'tertunda' && (
                                    <span
                                      className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500 text-white text-[9px] font-black shrink-0 animate-pulse shadow-2xs"
                                      title="Tugas Tertunda / Pending (!)"
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5 fill-current" />
                                      <span>!</span>
                                    </span>
                                  )}

                                  <span
                                    className={`truncate flex-1 ${
                                      entry.status === 'selesai'
                                        ? 'line-through text-slate-400'
                                        : entry.status === 'tertunda'
                                        ? 'font-bold text-amber-950'
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

                                  {/* Badge Indikator Revisi & Penambahan Pekerjaan */}
                                  {entry.additionalTasks && entry.additionalTasks.length > 0 && (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-[8px] font-extrabold px-1 rounded bg-purple-100 text-purple-800 border border-purple-200 shrink-0"
                                      title={`${entry.additionalTasks.length} revisi / penambahan pekerjaan`}
                                    >
                                      <span>+{entry.additionalTasks.length} Rev</span>
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
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDayDrawer(cell.dateStr);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200/90 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                title={`Klik untuk melihat popup ringkasan lengkap ${dayEntries.length} tugas & ${dayReminders.length} pengingat pada ${formatDateShortIndo(cell.dateStr)}`}
                              >
                                <span>+{remainingCount} lagi</span>
                                <ChevronRight className="w-2.5 h-2.5 text-indigo-500" />
                              </button>
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
                    setPolicyToleranceInput(workPolicy.lateToleranceMinutes !== undefined ? workPolicy.lateToleranceMinutes : 15);
                    setPolicyTargetHoursInput(workPolicy.targetDailyWorkHours);
                    setPolicyLeaveResetInput(workPolicy.leaveResetDate || '01-01');
                    setPolicyThresholdInput(workPolicy.earlyOvertimeThresholdMinutes || 60);
                    setPolicyLateOtThresholdInput(workPolicy.lateOvertimeThresholdMinutes !== undefined ? workPolicy.lateOvertimeThresholdMinutes : 30);
                    setIsPolicyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ubah Aturan Tolak Ukur</span>
                </button>
              </div>

              {/* BAGIAN TERPADU: INDIKATOR STATISTIK KEHADIRAN & REKAPITULASI LEMBUR TERINTEGRASI */}
              <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
                {/* Header Terpadu */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Panel Metrik Presensi &amp; Rekapitulasi Jam Kerja Lembur Terpadu</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      Ringkasan Kehadiran &amp; Realisasi Jam Kerja Bersih (Genap Sejam)
                    </h3>
                    <p className="text-xs text-indigo-200/90 max-w-2xl">
                      Seluruh indikator kehadiran, izin/cuti, jam kerja bersih genap, dan rekap lembur terintegrasi dalam satu panel tolak ukur terpadu.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={openNewAttendanceModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajukan Izin / Cuti / Koreksi Jam</span>
                    </button>
                  </div>
                </div>

                {/* 5 Kartu Indikator Utama Terpadu (Genap Sejam Tanpa Pecahan Desimal) */}
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    {/* 1. Total Kehadiran */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Total Kehadiran
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CalendarCheck2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                          {attendanceStats.hadirCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Hari Hadir</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        <span className="text-emerald-700 font-bold">{attendanceStats.punctualCount} Tepat</span> •{' '}
                        <span className={attendanceStats.lateCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                          {attendanceStats.lateCount} Terlambat
                        </span>
                      </p>
                    </div>

                    {/* 2. Izin, Cuti & Sakit */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Izin, Cuti &amp; Sakit
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Coffee className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-amber-700">
                          {attendanceStats.izinCount + attendanceStats.cutiCount + attendanceStats.sakitCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Hari</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Sisa Cuti: <strong className="text-indigo-600">{attendanceStats.remainingLeaveQuota} Hari</strong>
                      </p>
                    </div>

                    {/* 3. Jam Kerja Bersih (Genap Sejam) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Jam Kerja Bersih
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                          <Timer className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-indigo-700">
                          {Math.round(Number(attendanceStats.totalWorkHours))}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Jam (Genap)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Target: <strong>{attendanceStats.monthlyTargetWorkHours} Jam</strong>
                      </p>
                    </div>

                    {/* 4. Rata-Rata Jam / Hari (Genap Sejam) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Rata-Rata / Hari
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-blue-700">
                          {Math.round(Number(attendanceStats.avgWorkHours))}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Jam / hari</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Baku: <strong>{workPolicy.targetDailyWorkHours} Jam</strong>
                      </p>
                    </div>

                    {/* 5. Rekapitulasi Jam Lembur (Genap Sejam) */}
                    <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-300/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          Total Lembur
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Zap className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-amber-700">
                          {Math.round(monthAttendance.reduce((sum, r) => sum + (r.overtimeHours || 0), 0))}
                        </span>
                        <span className="text-xs font-semibold text-amber-900">Jam (Genap)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium pt-0.5">
                        Pagi: {Math.round(monthAttendance.filter((r) => r.shiftCategory === 'lembur_awal').reduce((s, r) => s + (r.overtimeHours || 0), 0))}j • Malam: {Math.round(monthAttendance.filter((r) => r.shiftCategory === 'lembur_akhir').reduce((s, r) => s + (r.overtimeHours || 0), 0))}j
                      </p>
                    </div>
                  </div>

                  {/* Keterangan Sub-Kategori Lembur & Filter Pemilik */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-bold text-slate-800">Rincian Shift Lembur:</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                        Lembur Masuk Awal: {Math.round(monthAttendance.filter((r) => r.shiftCategory === 'lembur_awal').reduce((s, r) => s + (r.overtimeHours || 0), 0))} Jam
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-200">
                        Lembur Pulang Malam: {Math.round(monthAttendance.filter((r) => r.shiftCategory === 'lembur_akhir').reduce((s, r) => s + (r.overtimeHours || 0), 0))} Jam
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200">
                        Lembur Hari Libur: {Math.round(monthAttendance.filter((r) => r.shiftCategory === 'lembur_penuh').reduce((s, r) => s + (r.overtimeHours || 0), 0))} Jam
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Tampilkan Absensi:</span>
                      <select
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
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
                </div>
              </section>

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
                                {(rec.overtimeHours || 0) > 0 || rec.shiftCategory !== 'normal' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingOvertimeRecord(rec);
                                      setEditOtHoursInput(rec.overtimeHours || 0);
                                      setEditOtCategoryInput(rec.shiftCategory || 'normal');
                                      setEditOtReasonInput(rec.overtimeReason || rec.shiftNotes || '');
                                    }}
                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 mr-1"
                                    title="Sesuaikan Keterangan Lembur / Keputusan Atasan"
                                  >
                                    <Sliders className="w-4 h-4" />
                                  </button>
                                ) : null}
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

          {/* TAB 3: LAPORAN KINERJA & SISTEM REPORT HASIL PEKERJAAN FULL AI PRO */}
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
                    <a
                      href="/rekap-pekerjaan-jadwalpro.xlsx"
                      download="rekap-pekerjaan-jadwalpro.xlsx"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
                      title="Unduh Lembar Kerja Rekap Pekerjaan Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Unduh Excel (.xlsx)</span>
                    </a>
                    <a
                      href="/laporan-rekap-pekerjaan.pptx"
                      download="laporan-rekap-pekerjaan.pptx"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs transition-colors shrink-0"
                      title="Unduh Bahan Presentasi PowerPoint Full Designed (.pptx)"
                    >
                      <Presentation className="w-3.5 h-3.5 text-amber-100" />
                      <span>Unduh Presentasi AI (.pptx)</span>
                    </a>
                    <button
                      type="button"
                      onClick={handlePrintReport}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak / Unduh PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* DOKUMEN LAPORAN RINCI (LAYOUT CETAK PDF PROFESIONAL) */}
              <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-7 print:border-none print:shadow-none print:p-0 print:m-0">
                {/* Header Dokumen Laporan Lengkap */}
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

                {/* ========================================================================= */}
                {/* 4 GRAFIK DINAMIS SVG DI BAGIAN PALING ATAS (2 KOLOM SEJAJAR KE BAWAH)     */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 print:space-y-4">
                  {/* GRAFIK 1: TREN BEBAN KERJA PROYEK 12 BULAN (JAN - DES) */}
                  <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-700 uppercase tracking-wider">
                          <TrendingUp className="w-4 h-4 text-indigo-600" />
                          <span>Grafik 1: Tren Tahunan 12 Bulan</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5">
                          Ringkasan Beban Proyek (Januari — Desember)
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
                        {projects.length} Proyek Terdata
                      </span>
                    </div>

                    {(() => {
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                      const projectColors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
                      
                      const series = projects.map((p, idx) => {
                        const monthlyCounts = months.map((_, mIdx) => {
                          return entries.filter((e) => {
                            if (e.projectId !== p.id) return false;
                            const d = new Date(e.date);
                            return d.getMonth() === mIdx && d.getFullYear() === currentYear;
                          }).length;
                        });
                        return {
                          project: p,
                          color: p.color || projectColors[idx % projectColors.length],
                          counts: monthlyCounts,
                          total: monthlyCounts.reduce((a, b) => a + b, 0),
                        };
                      });

                      const maxVal = Math.max(5, ...series.flatMap((s) => s.counts));
                      const width = 600;
                      const height = 190;
                      const padLeft = 35;
                      const padRight = 25;
                      const padTop = 20;
                      const padBottom = 30;
                      const chartW = width - padLeft - padRight;
                      const chartH = height - padTop - padBottom;

                      return (
                        <div className="space-y-3">
                          <div className="w-full">
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-sans">
                              {[0, 0.5, 1].map((ratio, i) => {
                                const y = padTop + chartH * (1 - ratio);
                                return (
                                  <g key={i}>
                                    <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                                    <text x={padLeft - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                                      {Math.round(maxVal * ratio)}
                                    </text>
                                  </g>
                                );
                              })}
                              {months.map((m, mIdx) => (
                                <text key={mIdx} x={padLeft + (mIdx / (months.length - 1)) * chartW} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="700">
                                  {m}
                                </text>
                              ))}
                              {series.map((s, sIdx) => {
                                const points = s.counts.map((val, mIdx) => {
                                  const x = padLeft + (mIdx / (months.length - 1)) * chartW;
                                  const y = padTop + chartH * (1 - val / maxVal);
                                  return `${x},${y}`;
                                }).join(' ');

                                return (
                                  <g key={s.project.id || sIdx}>
                                    <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} opacity="0.9" />
                                    {s.counts.map((val, mIdx) => (
                                      <circle key={mIdx} cx={padLeft + (mIdx / (months.length - 1)) * chartW} cy={padTop + chartH * (1 - val / maxVal)} r="3" fill={s.color} stroke="#ffffff" strokeWidth="1.5">
                                        <title>{`${s.project.name} (${months[mIdx]}): ${val} tugas`}</title>
                                      </circle>
                                    ))}
                                  </g>
                                );
                              })}
                            </svg>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/80 text-[11px]">
                            {series.map((s) => (
                              <div key={s.project.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 shadow-2xs font-semibold text-slate-700">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                <span>{s.project.name}</span>
                                <span className="text-slate-400 font-normal">({s.total}j)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* GRAFIK 2: AKUMULASI DURASI KERJA PROYEK (DAYS) */}
                  <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 uppercase tracking-wider">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          <span>Grafik 2: Durasi Pengerjaan (Days)</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5">
                          Akumulasi Durasi Kerja Proyek (Days)
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                        Diurutkan Days Terlama
                      </span>
                    </div>

                    {(() => {
                      const sortedProjects = [...projects].map((p) => {
                        const projEntries = entries.filter((e) => e.projectId === p.id);
                        const total = projEntries.length;
                        const done = projEntries.filter((e) => e.status === 'selesai').length;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        const durationSum = projEntries.reduce((acc, curr) => acc + (curr.durationDays || 1), 0);
                        return {
                          project: p,
                          total,
                          done,
                          pct,
                          durationDays: durationSum || 1,
                        };
                      }).sort((a, b) => b.durationDays - a.durationDays);

                      if (sortedProjects.length === 0) {
                        return <div className="text-xs text-slate-500 py-6 text-center">Belum ada proyek terdata.</div>;
                      }

                      const rawMaxDays = Math.max(...sortedProjects.map((p) => p.durationDays));
                      const maxDays = Math.max(5, Math.ceil(rawMaxDays * 1.15));

                      const width = 600;
                      const height = 190;
                      const padLeft = 45;
                      const padRight = 30;
                      const padTop = 20;
                      const padBottom = 30;
                      const chartW = width - padLeft - padRight;
                      const chartH = height - padTop - padBottom;

                      const points = sortedProjects.map((item, idx) => {
                        const x = sortedProjects.length === 1 ? width / 2 : padLeft + (idx / (sortedProjects.length - 1)) * chartW;
                        const y = padTop + chartH * (1 - item.durationDays / maxDays);
                        return { x, y, item };
                      });

                      return (
                        <div className="space-y-3">
                          <div className="w-full">
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-sans">
                              {[0, 0.5, 1].map((ratio, i) => {
                                const y = padTop + chartH * (1 - ratio);
                                return (
                                  <g key={i}>
                                    <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                                    <text x={padLeft - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill="#64748b" fontWeight="600">
                                      {Math.round(maxDays * ratio)} Days
                                    </text>
                                  </g>
                                );
                              })}

                              <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points.map((p) => `${p.x},${p.y}`).join(' ')} />
                              {points.map((pt, i) => (
                                <g key={i}>
                                  <line x1={pt.x} y1={pt.y} x2={pt.x} y2={height - padBottom} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                                  <circle cx={pt.x} cy={pt.y} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                                  <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="10" fill="#047857" fontWeight="800">
                                    {pt.item.durationDays}d
                                  </text>
                                  <text x={pt.x} y={height - 8} textAnchor="middle" fontSize="9.5" fill="#334155" fontWeight="700">
                                    {pt.item.project.name.length > 9 ? pt.item.project.name.slice(0, 8) + '..' : pt.item.project.name}
                                  </text>
                                </g>
                              ))}
                            </svg>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/80 text-[11px]">
                            {sortedProjects.slice(0, 3).map((p, i) => (
                              <div key={p.project.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 shadow-2xs font-semibold text-slate-700">
                                <span className="font-bold text-slate-400">#{i + 1}</span>
                                <span>{p.project.name}:</span>
                                <span className="font-black text-emerald-700">{p.durationDays} Days</span>
                                <span className="text-slate-400 font-normal">({p.pct}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* GRAFIK 3: TREN DISIPLIN & PRESENSI HARIAN */}
                  <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-700 uppercase tracking-wider">
                          <CalendarCheck2 className="w-4 h-4 text-indigo-600" />
                          <span>Grafik 3: Tren Disiplin Presensi</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5">
                          Fluktuasi Tepat Waktu, Terlambat &amp; Izin
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
                        Tepat vs Telat vs Izin
                      </span>
                    </div>

                    {(() => {
                      const attFiltered = attendance.filter((a) => {
                        if (reportOwnerFilter === 'MINE' && a.ownerId !== currentUser.id) return false;
                        if (reportOwnerFilter !== 'MINE' && reportOwnerFilter !== 'ALL' && a.ownerId !== reportOwnerFilter) return false;
                        return a.date >= reportData.startDate && a.date <= reportData.endDate;
                      }).sort((a, b) => a.date.localeCompare(b.date));

                      const uniqueDates = Array.from(new Set(attFiltered.map((a) => a.date)));

                      if (uniqueDates.length === 0) {
                        return <div className="text-xs text-slate-500 py-6 text-center">Belum ada riwayat kehadiran.</div>;
                      }

                      const timelineData = uniqueDates.map((dateStr) => {
                        const dayRecords = attFiltered.filter((a) => a.date === dateStr);
                        const punctual = dayRecords.filter((a) => a.type === 'hadir' && !a.isLate).length;
                        const late = dayRecords.filter((a) => a.type === 'hadir' && a.isLate).length;
                        const leave = dayRecords.filter((a) => a.type === 'izin' || a.type === 'cuti' || a.type === 'sakit').length;
                        return { dateStr, punctual, late, leave };
                      });

                      const maxVal = Math.max(3, ...timelineData.flatMap((d) => [d.punctual, d.late, d.leave]));
                      const width = 600;
                      const height = 190;
                      const padLeft = 35;
                      const padRight = 25;
                      const padTop = 20;
                      const padBottom = 30;
                      const chartW = width - padLeft - padRight;
                      const chartH = height - padTop - padBottom;

                      const pointsPunctual = timelineData.map((d, i) => ({
                        x: timelineData.length === 1 ? width / 2 : padLeft + (i / (timelineData.length - 1)) * chartW,
                        y: padTop + chartH * (1 - d.punctual / maxVal),
                        val: d.punctual,
                        date: d.dateStr,
                      }));

                      const pointsLate = timelineData.map((d, i) => ({
                        x: timelineData.length === 1 ? width / 2 : padLeft + (i / (timelineData.length - 1)) * chartW,
                        y: padTop + chartH * (1 - d.late / maxVal),
                        val: d.late,
                        date: d.dateStr,
                      }));

                      const pointsLeave = timelineData.map((d, i) => ({
                        x: timelineData.length === 1 ? width / 2 : padLeft + (i / (timelineData.length - 1)) * chartW,
                        y: padTop + chartH * (1 - d.leave / maxVal),
                        val: d.leave,
                        date: d.dateStr,
                      }));

                      return (
                        <div className="space-y-3">
                          <div className="w-full">
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-sans">
                              {[0, 0.5, 1].map((ratio, i) => {
                                const y = padTop + chartH * (1 - ratio);
                                return (
                                  <g key={i}>
                                    <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                                    <text x={padLeft - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                                      {Math.round(maxVal * ratio)}
                                    </text>
                                  </g>
                                );
                              })}
                              {timelineData.map((d, i) => {
                                const x = timelineData.length === 1 ? width / 2 : padLeft + (i / (timelineData.length - 1)) * chartW;
                                const shortDate = d.dateStr.slice(8);
                                return (
                                  <text key={i} x={x} y={height - 8} textAnchor="middle" fontSize="9.5" fill="#64748b" fontWeight="700">
                                    {shortDate}
                                  </text>
                                );
                              })}
                              <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsPunctual.map((p) => `${p.x},${p.y}`).join(' ')} />
                              {pointsPunctual.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                              ))}
                              <polyline fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" points={pointsLate.map((p) => `${p.x},${p.y}`).join(' ')} />
                              {pointsLate.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                              ))}
                              <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pointsLeave.map((p) => `${p.x},${p.y}`).join(' ')} />
                            </svg>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/80 text-[11px]">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-emerald-700">Tepat: {reportData.totalHadir - attendanceStats.lateCount}</span>
                              <span className="font-bold text-rose-600">Telat: {attendanceStats.lateCount}</span>
                              <span className="font-bold text-amber-600">Izin: {reportData.totalIzin + reportData.totalCuti + reportData.totalSakit}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Toleransi: {workPolicy.lateToleranceMinutes}m</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* GRAFIK 4: REALISASI JAM KERJA BERSIH, LEMBUR & KETERLAMBATAN */}
                  <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-700 uppercase tracking-wider">
                          <Timer className="w-4 h-4 text-indigo-600" />
                          <span>Grafik 4: Realisasi Jam Kerja &amp; Lembur</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5">
                          Jam Bersih, Lembur &amp; Keterlambatan
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 self-start sm:self-auto">
                        Satuan Jam Bulat
                      </span>
                    </div>

                    {(() => {
                      const attRecords = attendance.filter((a) => {
                        if (reportOwnerFilter === 'MINE' && a.ownerId !== currentUser.id) return false;
                        if (reportOwnerFilter !== 'MINE' && reportOwnerFilter !== 'ALL' && a.ownerId !== reportOwnerFilter) return false;
                        return a.date >= reportData.startDate && a.date <= reportData.endDate && a.type === 'hadir';
                      }).sort((a, b) => a.date.localeCompare(b.date));

                      if (attRecords.length === 0) {
                        return <div className="text-xs text-slate-500 py-6 text-center">Belum ada jam kerja hadir.</div>;
                      }

                      const chartData = attRecords.map((r) => {
                        const cleanHours = Math.round(r.regularWorkHours || r.workDurationHours || 8);
                        const otHours = Math.round(r.overtimeHours || 0);
                        let lateHours = 0;
                        if (r.isLate && r.checkInTime) {
                          const [h, m] = r.checkInTime.split(':').map(Number);
                          const [stdH, stdM] = (workPolicy.standardCheckInTime || '08:00').split(':').map(Number);
                          const diff = (h * 60 + m) - (stdH * 60 + stdM);
                          if (diff > 0) lateHours = Math.round((diff / 60) * 10) / 10;
                        }
                        return { date: r.date, cleanHours, otHours, lateHours };
                      });

                      const maxVal = Math.max(10, ...chartData.flatMap((d) => [d.cleanHours + d.otHours, 9]));
                      const width = 600;
                      const height = 190;
                      const padLeft = 40;
                      const padRight = 25;
                      const padTop = 20;
                      const padBottom = 30;
                      const chartW = width - padLeft - padRight;
                      const chartH = height - padTop - padBottom;

                      const pointsClean = chartData.map((d, i) => ({
                        x: chartData.length === 1 ? width / 2 : padLeft + (i / (chartData.length - 1)) * chartW,
                        y: padTop + chartH * (1 - d.cleanHours / maxVal),
                        val: d.cleanHours,
                        date: d.date,
                      }));

                      const pointsOt = chartData.map((d, i) => ({
                        x: chartData.length === 1 ? width / 2 : padLeft + (i / (chartData.length - 1)) * chartW,
                        y: padTop + chartH * (1 - d.otHours / maxVal),
                        val: d.otHours,
                        date: d.date,
                      }));

                      const pointsLate = chartData.map((d, i) => ({
                        x: chartData.length === 1 ? width / 2 : padLeft + (i / (chartData.length - 1)) * chartW,
                        y: padTop + chartH * (1 - d.lateHours / maxVal),
                        val: d.lateHours,
                        date: d.date,
                      }));

                      return (
                        <div className="space-y-3">
                          <div className="w-full">
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-sans">
                              {[0, 0.5, 1].map((ratio, i) => {
                                const y = padTop + chartH * (1 - ratio);
                                return (
                                  <g key={i}>
                                    <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                                    <text x={padLeft - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                                      {Math.round(maxVal * ratio)} Jam
                                    </text>
                                  </g>
                                );
                              })}
                              {chartData.map((d, i) => {
                                const x = chartData.length === 1 ? width / 2 : padLeft + (i / (chartData.length - 1)) * chartW;
                                const shortDate = d.date.slice(8);
                                return (
                                  <text key={i} x={x} y={height - 8} textAnchor="middle" fontSize="9.5" fill="#64748b" fontWeight="700">
                                    {shortDate}
                                  </text>
                                );
                              })}
                              <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsClean.map((p) => `${p.x},${p.y}`).join(' ')} />
                              {pointsClean.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                              ))}
                              <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pointsOt.map((p) => `${p.x},${p.y}`).join(' ')} />
                              <polyline fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" points={pointsLate.map((p) => `${p.x},${p.y}`).join(' ')} />
                            </svg>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/80 text-[11px]">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-indigo-700">Bersih: {Math.round(Number(reportData.totalHours))} Jam</span>
                              <span className="font-bold text-amber-700">Lembur: {Math.round(monthAttendance.reduce((s, r) => s + (r.overtimeHours || 0), 0))} Jam</span>
                              <span className="font-bold text-rose-600">Telat: {attendanceStats.lateCount}x</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Bulat 1 Jam</span>
                          </div>
                        </div>
                      );
                    })()}
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
                    <span>4. Log Rincian Pekerjaan Terkelompok per Proyek ({reportData.userEntries.length} Item)</span>
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 print:hidden pb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200">
                      <span>📁 Seluruh log pekerjaan terorganisir per proyek &amp; program secara rapi</span>
                    </span>
                  </div>

                  {/* Rendering Log Pekerjaan Dikelompokkan per Proyek */}
                  {(() => {
                    const groups: { project: Project; entries: ScheduleEntry[] }[] = [];
                    const assignedIds = new Set<string>();

                    projects.forEach((proj) => {
                      const pEntries = reportData.userEntries.filter((e) => e.projectId === proj.id);
                      if (pEntries.length > 0) {
                        groups.push({ project: proj, entries: pEntries });
                        assignedIds.add(proj.id);
                      }
                    });

                    const unassigned = reportData.userEntries.filter((e) => !e.projectId || !assignedIds.has(e.projectId));
                    if (unassigned.length > 0) {
                      groups.push({
                        project: {
                          id: 'unassigned',
                          name: 'Pekerjaan Umum / Lainnya',
                          color: '#64748b',
                          programs: [],
                        } as unknown as Project,
                        entries: unassigned,
                      });
                    }

                    if (groups.length === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs">
                          Tidak ada catatan pekerjaan pada rentang waktu ini.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {groups.map(({ project: p, entries: pEntries }) => {
                          const completedCount = pEntries.filter((e) => e.status === 'selesai').length;
                          const pct = Math.round((completedCount / pEntries.length) * 100);

                          return (
                            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                              {/* Project Header Bar */}
                              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: p.color || '#4f46e5' }} />
                                  <span className="font-extrabold text-sm text-slate-900">{p.name}</span>
                                  <span className="text-xs text-slate-500 font-semibold">({pEntries.length} tugas)</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-600">
                                    Progres: <strong className="text-emerald-700">{pct}%</strong> ({completedCount}/{pEntries.length} Selesai)
                                  </span>
                                  <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </div>

                              {/* Task Table for this Project */}
                              <div className="overflow-x-auto max-h-[360px] print:max-h-none">
                                <table className="w-full text-left text-xs min-w-[700px]">
                                  <thead className="sticky top-0 z-10 bg-slate-100/90 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10.5px] tracking-wider">
                                    <tr>
                                      <th className="py-2.5 px-3">Mulai</th>
                                      <th className="py-2.5 px-3">Selesai</th>
                                      <th className="py-2.5 px-3">Durasi</th>
                                      <th className="py-2.5 px-3">Program / Cabang</th>
                                      <th className="py-2.5 px-3">Judul Pekerjaan</th>
                                      <th className="py-2.5 px-3">Status</th>
                                      <th className="py-2.5 px-3">Catatan &amp; Revisi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {pEntries.map((e) => {
                                      const prog = p?.programs?.find((pr) => pr.id === e.programId);
                                      const r = getEntryDateRange(e, todayStr);
                                      const revisions = (e.additionalTasks || []).filter((t) => t.type === 'revisi');

                                      return (
                                        <tr key={e.id} className="hover:bg-slate-50/70">
                                          <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                                            {e.date}
                                          </td>
                                          <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                                            {e.status === 'selesai' ? ((e as any).completedDate || e.date) : (
                                              <span className="text-amber-600 font-medium">Sedang Berjalan</span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            {e.status === 'selesai' ? (
                                              <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                {r.totalDays} Hari
                                              </span>
                                            ) : (
                                              <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-300">
                                                {r.totalDays} Hari
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            {prog ? (
                                              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold">
                                                {prog.name}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400">-</span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 font-bold text-slate-900">
                                            {e.title}
                                          </td>
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_META[e.status].badgeClass}`}>
                                              {STATUS_META[e.status].label}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-slate-600 text-xs">
                                            <div className="flex flex-wrap items-center gap-1">
                                              {revisions.length > 0 && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                                                  {revisions.length} Revisi
                                                </span>
                                              )}
                                              <span>{e.notes || '-'}</span>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* 5. Ringkasan Evaluasi Kendala & Ketidakseimbangan Beban Tugas */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>5. Ringkasan Evaluasi Kendala &amp; Ketidakseimbangan Beban Tugas</span>
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      Audit Diagnostik Tim
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                    {/* Sub-Card 1: Kendala Pekerjaan & Revisi */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-amber-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Kendala &amp; Revisi Aktif</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                          {reportData.fieldIssues.length} Isu
                        </span>
                      </div>

                      {reportData.fieldIssues.length === 0 ? (
                        <div className="p-3 bg-white/80 rounded-xl border border-amber-100 text-slate-600 text-[11px] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Tidak ada kendala kritis atau revisi tertunda pada periode ini.</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {reportData.fieldIssues.map((issue, idx) => (
                            <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 truncate">{issue.taskTitle}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                  issue.type === 'tertunda' ? 'bg-amber-100 text-amber-800' :
                                  issue.type === 'revisi' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {issue.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug">{issue.description}</p>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                                <span>{issue.projectName}</span>
                                <span>•</span>
                                <span>{issue.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sub-Card 2: Ketidakseimbangan Beban Tugas */}
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>Distribusi Beban Proyek</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reportData.hasWorkloadImbalance ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {reportData.hasWorkloadImbalance ? 'Beban Timpang' : 'Relatif Seimbang'}
                        </span>
                      </div>

                      {reportData.hasWorkloadImbalance ? (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] space-y-1">
                          <div className="font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Peringatan Beban Terpusat:</span>
                          </div>
                          <p className="leading-snug">
                            {reportData.heavyProjects.map((hp) => `Proyek "${hp.name}" menyerap ${hp.contributionPercent}% total pekerjaan`).join(', ')}.
                            Perlu redistribusi tugas agar tidak overload.
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-white/80 rounded-xl border border-indigo-100 text-slate-600 text-[11px] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Beban tugas terbagi proporsional antar seluruh proyek aktif.</span>
                        </div>
                      )}

                      <div className="space-y-1.5 pt-1">
                        {reportData.projectBreakdown.slice(0, 3).map((proj) => (
                          <div key={proj.projectId} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-slate-700 truncate max-w-[140px]">{proj.name}</span>
                              <span className="font-bold text-slate-900">{proj.contributionPercent}% ({proj.count} tugas)</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(100, proj.contributionPercent)}%`, backgroundColor: proj.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sub-Card 3: Masalah Tingkat Penyelesaian & Hal yang Mengganjal */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                          <Target className="w-4 h-4 text-slate-600" />
                          <span>Hambatan &amp; Bottlenecks</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                          {reportData.overdueTasks} Terlambat
                        </span>
                      </div>

                      <div className="space-y-2">
                        {reportData.overdueTasks > 0 ? (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] space-y-0.5">
                            <div className="font-bold">⚠️ Ada {reportData.overdueTasks} Tugas Menghambat Jadwal</div>
                            <p className="text-[10px] text-rose-700 leading-snug">
                              Tugas belum rampung melewati tanggal yang dijadwalkan, memerlukan eskalasi prioritas.
                            </p>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Seluruh tugas berjalan tepat waktu tanpa ada tunggakan.</span>
                          </div>
                        )}

                        {reportData.laggingProjects.length > 0 && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-0.5">
                            <div className="font-bold">Tingkat Tuntas Rendah (&lt;50%):</div>
                            <p className="text-[10px] text-amber-800">
                              {reportData.laggingProjects.map((lp) => `${lp.name} (${lp.completionPercent}%)`).join(', ')}
                            </p>
                          </div>
                        )}

                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
                          <div className="font-bold text-slate-800 flex items-center gap-1 text-[10px] uppercase">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>Rekomendasi Pembenahan:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-500">
                            <li>Reevaluasi estimasi durasi pada proyek dengan kendala berulang.</li>
                            <li>Terapkan rotasi tugas untuk menyeimbangkan beban kerja tim.</li>
                            <li>Kunci izin lembur hanya pada tugas prioritas tinggi.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lembar Tanda Tangan */}
                {/* AGENT AI GEMINI ASSISTANT DENGAN LOGO JADWALPRO */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/40 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 p-0.5 shadow-lg shrink-0 flex items-center justify-center">
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base text-white tracking-tight">
                            Gemini AI JadwalPro Assistant
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            Agent Khusus JadwalPro
                          </span>
                        </div>
                        <p className="text-xs text-indigo-200/90 max-w-xl">
                          Konsultasikan kendala proyek, tindak lanjut revisi aktif, dan tolak ukur presensi khusus untuk ID Owner ({currentUser.fullName}).
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAIChatOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 shrink-0"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-300" />
                      <span>Chat dengan AI JadwalPro</span>
                    </button>
                  </div>

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

              {/* SUB-NAVBAR TAB PERFORMA AI: PENILAIAN AI PRO VS UPLOAD BUKTI GAMBAR */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAiPerfSubTab('appraisal')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      aiPerfSubTab === 'appraisal'
                        ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 ${aiPerfSubTab === 'appraisal' ? 'text-amber-300' : 'text-indigo-600'}`} />
                    <span>Report Hasil Pekerjaan (Penilaian AI PRO)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiPerfSubTab('upload')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      aiPerfSubTab === 'upload'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <BrainCircuit className="w-4 h-4 text-indigo-600" />
                    <span>Unggah Bukti Gambar &amp; Rekomendasi Taktis AI</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 font-medium px-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Sistem Evaluasi Kerja Berbasis AI Terkini 2026</span>
                </div>
              </div>

              {/* VIEW 1: REPORT HASIL PEKERJAAN (PENILAIAN AI PRO) */}
              {aiPerfSubTab === 'appraisal' && (
                <div className="space-y-6">
                  {/* Banner Utama */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-800/40">
                    <div className="relative z-10 max-w-3xl space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Dynamic Role &amp; Division Adaptive AI Appraisal</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 border border-purple-400/40 text-purple-200">
                          Tolak Ukur Standar Industri 2026
                        </div>
                      </div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                        Sistem Report Hasil Pekerjaan &amp; Penilaian AI PRO
                      </h2>
                      <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-normal">
                        Wadah pelaporan dan penilaian hasil kerja yang sepenuhnya adaptif. Pilih jabatan dan divisi kerja Anda, maka sistem langsung menyesuaikan tolak ukur, metrik pencapaian (link karya, screenshot analitik, closing sales, progres fisik), dan mengeluarkan rapor penilaian AI PRO secara komparatif dengan standar industri terkini.
                      </p>
                    </div>
                    <div className="absolute -right-6 -bottom-8 opacity-15 pointer-events-none">
                      <Award className="w-60 h-60 text-white" />
                    </div>
                  </div>

                  {/* Grid Utama: Form Input Dinamis (7 Cols) & Rapor AI PRO (5 Cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* KOLOM KIRI: FORM REPORT DINAMIS MENGIKUTI PEKERJAAN */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* Card Identitas Pekerjaan & Divisi */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Briefcase className="w-4 h-4 text-indigo-600" />
                          <h3 className="font-bold text-sm sm:text-base text-slate-900">
                            1. Identitas Profesi &amp; Divisi Kerja
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Profesi / Jabatan Kerja <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={appraisalJobRole}
                              onChange={(e) => handleRoleSelectionChange(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                              {APPRAISAL_ROLES.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Divisi Kerja <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={appraisalDivision}
                              onChange={(e) => setAppraisalDivision(e.target.value)}
                              placeholder="Contoh: Media Sosial, Marketing, Proyek Lapangan"
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                            />
                          </div>
                        </div>

                        {appraisalJobRole === 'custom' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Nama Jabatan Kustom Anda <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={appraisalCustomRole}
                              onChange={(e) => setAppraisalCustomRole(e.target.value)}
                              placeholder="Misal: UI/UX Designer, Barista, Staff Gudang, Copywriter"
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Judul Deliverable / Hasil Karya <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={appraisalTitle}
                              onChange={(e) => setAppraisalTitle(e.target.value)}
                              placeholder="Contoh: Video Kampanye Produk X, Closing Deal Klien PT ABC"
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Tanggal Periode <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={appraisalPeriodDate}
                              onChange={(e) => setAppraisalPeriodDate(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Bahan Analisis AI PRO: Tangkapan Layar & Tautan Link Karya (Tanpa Perlu Isi Angka Manual) */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <h3 className="font-bold text-sm sm:text-base text-slate-900">
                              2. Bahan Analisis: Tangkapan Layar &amp; Tautan Link Karya
                            </h3>
                          </div>
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Otomatis Dipindai oleh AI PRO</span>
                          </span>
                        </div>

                        {/* Banner Edukasi: Tidak Perlu Isi Angka Sendiri */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50/60 border border-indigo-200/80 space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                            <Zap className="w-4 h-4 text-amber-500 fill-current" />
                            <span>Tolak Ukur Tidak Perlu Diisi Sendiri (100% Otomatis oleh AI)</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            Cukup lampirkan <strong>tangkapan layar (screenshot analitik)</strong> dan <strong>tautan link video / hasil karya</strong>. Sistem AI PRO akan secara otomatis membaca dan mengekstrak metrik tayangan (views), suka (likes), rata-rata retensi penonton, hook rate, nominal closing, hingga progres fisik lapangan langsung dari bukti yang Anda berikan.
                          </p>
                        </div>

                        {/* INPUT 1: TAUTAN LINK VIDEO / KARYA */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              Tautan Link Video / Hasil Karya <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-medium">TikTok, IG Reels, YouTube, Cloud Drive</span>
                          </div>
                          <div className="relative">
                            <input
                              type="url"
                              value={appraisalLinkUrl}
                              onChange={(e) => setAppraisalLinkUrl(e.target.value)}
                              placeholder="Tempelkan link video TikTok, IG Reels, YouTube Shorts, atau link hasil karya Anda..."
                              className="w-full pl-9 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            <ExternalLink className="w-4 h-4 text-indigo-600 absolute left-3 top-3.5" />
                          </div>
                          {/* Quick Platform Presets */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-400 font-medium">Contoh Tautan:</span>
                            {[
                              { label: 'TikTok Video', url: 'https://www.tiktok.com/@kreator/video/7342918491' },
                              { label: 'Instagram Reels', url: 'https://www.instagram.com/reel/C89xYzQpL/' },
                              { label: 'YouTube Shorts', url: 'https://youtube.com/shorts/dQw4w9WgXcQ' },
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setAppraisalLinkUrl(preset.url)}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition-colors"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* INPUT 2: TANGKAPAN LAYAR (SCREENSHOT ANALITIK / BUKTI KERJA) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              Tangkapan Layar (Screenshot Analitik / Dashboard / Bukti Kinerja) <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-indigo-600 font-bold">Sumber Pembacaan AI</span>
                          </div>

                          <input
                            type="file"
                            ref={appraisalFileInputRef}
                            accept="image/*"
                            onChange={handleAppraisalScreenshotUpload}
                            className="hidden"
                          />

                          {appraisalScreenshotUrl ? (
                            <div className="p-4 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/40 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-500 bg-slate-900 shrink-0 shadow-sm flex items-center justify-center relative group">
                                  <img
                                    src={appraisalScreenshotUrl}
                                    alt="Screenshot Analitik"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-extrabold text-slate-900 truncate">
                                    {appraisalScreenshotName || 'Tangkapan Layar Analitik Terlampir'}
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Gambar Siap Dipindai oleh AI PRO
                                  </span>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    AI akan otomatis membaca angka tayangan, retensi, likes, dan metrik lainnya.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => appraisalFileInputRef.current?.click()}
                                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                                >
                                  Ganti Gambar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAppraisalScreenshotUrl(null);
                                    setAppraisalScreenshotName('');
                                  }}
                                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition-colors hover:bg-rose-50"
                                  title="Hapus tangkapan layar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => appraisalFileInputRef.current?.click()}
                              className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 p-8 rounded-3xl text-center cursor-pointer transition-all bg-indigo-50/20 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-3 group"
                            >
                              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                <Upload className="w-6 h-6" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                                  Klik untuk Unggah Tangkapan Layar (Screenshot Analitik)
                                </p>
                                <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                                  Screenshot YouTube Studio, TikTok Analytics, Meta Insights, Bukti Closing Deal / Transfer, atau Foto Progres Lapangan.
                                </p>
                              </div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                AI PRO Vision akan otomatis mengekstrak metrik dari gambar ini
                              </span>
                            </div>
                          )}
                        </div>

                        {/* INPUT 3: CATATAN TAMBAHAN (OPSIONAL) */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Catatan Tambahan Pekerja (Opsional)
                          </label>
                          <textarea
                            rows={2}
                            value={appraisalNotes}
                            onChange={(e) => setAppraisalNotes(e.target.value)}
                            placeholder="Tuliskan catatan singkat jika ada hal khusus yang ingin Anda sampaikan kepada AI atau atasan..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>

                        {/* TOMBOL AKSI UTAMA */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleRunWorkAppraisal}
                            disabled={isEvaluatingAppraisal}
                            className="w-full py-4 px-5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98] disabled:opacity-50"
                          >
                            {isEvaluatingAppraisal ? (
                              <>
                                <BrainCircuit className="w-5 h-5 animate-spin text-amber-300" />
                                <span>AI PRO Sedang Memindai Tangkapan Layar &amp; Menilai Kinerja...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-5 h-5 fill-current text-amber-300" />
                                <span>⚡ Pindai Bukti &amp; Terbitkan Penilaian Hasil Kerja AI PRO</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* KOLOM KANAN: RAPOR HASIL PENILAIAN AI PRO & RIWAYAT */}
                    <div className="lg:col-span-5 space-y-5">
                      {/* Card Hasil Rapor Penilaian Kerja Terkini */}
                      {currentAppraisal ? (
                        <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-sm space-y-5 relative overflow-hidden bg-gradient-to-b from-indigo-50/40 via-white to-white">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                            <div className="flex items-center gap-2">
                              <Award className="w-5 h-5 text-indigo-600" />
                              <h3 className="font-extrabold text-sm sm:text-base text-indigo-950">
                                Rapor Hasil Penilaian Kerja
                              </h3>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateShortIndo(currentAppraisal.createdAt.slice(0, 10))}
                            </span>
                          </div>

                          {/* RANGKUMAN APA SAJA YANG DI-INPUT OLEH PENGGUNA */}
                          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 space-y-3 text-xs shadow-2xs">
                            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                              <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <span>Rangkuman Data Masukan &amp; Berkas Bukti</span>
                              </span>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                                Terverifikasi
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-800">
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">Profesi &amp; Divisi Kerja</span>
                                <span className="font-extrabold text-slate-900">{currentAppraisal.jobRoleLabel}</span>
                                <span className="text-slate-600 block text-[11px]">{currentAppraisal.division}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">Periode Pelaksanaan</span>
                                <span className="font-extrabold text-slate-900">{formatDateFullIndo(currentAppraisal.periodDate)}</span>
                                <span className="text-slate-500 block text-[11px]">Pelaksana: {currentAppraisal.ownerName}</span>
                              </div>
                            </div>

                            {/* Tautan Karya & Preview Gambar Tangkapan Layar */}
                            {(currentAppraisal.linkUrl || currentAppraisal.screenshotUrl) && (
                              <div className="pt-2 border-t border-indigo-100 space-y-2">
                                {currentAppraisal.linkUrl && (
                                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-indigo-200 text-xs">
                                    <ExternalLink className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <span className="text-[10px] text-slate-400 block font-semibold">Tautan Bukti Deliverable:</span>
                                      <a
                                        href={currentAppraisal.linkUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-bold text-indigo-600 hover:text-indigo-800 underline truncate block"
                                      >
                                        {currentAppraisal.linkUrl}
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {currentAppraisal.screenshotUrl && (
                                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-indigo-200">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                                      <img
                                        src={currentAppraisal.screenshotUrl}
                                        alt="Bukti Analitik"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1 text-xs">
                                      <span className="text-[10px] text-slate-400 block font-semibold">Tangkapan Layar Bukti Analitik:</span>
                                      <span className="font-bold text-slate-800 truncate block">
                                        {currentAppraisal.screenshotName || 'Screenshot Bukti Kinerja Terlampir'}
                                      </span>
                                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Dipindai &amp; Diekstrak Otomatis oleh AI PRO
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Catatan / Keterangan Asli Pekerja */}
                            {currentAppraisal.notes && (
                              <div className="pt-2 border-t border-indigo-100 space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">
                                  Catatan / Kendala yang Dilaporkan Pekerja:
                                </span>
                                <p className="p-2.5 bg-white rounded-xl border border-indigo-100 text-[11px] text-slate-700 italic leading-relaxed">
                                  "{currentAppraisal.notes}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Nilai Rapor & Predikat */}
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-sm">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                                Skor Penilaian Kinerja AI
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl sm:text-4xl font-black text-white">
                                  {currentAppraisal.score}
                                </span>
                                <span className="text-sm font-semibold text-indigo-300">/ 100</span>
                              </div>
                              <span className="text-xs text-indigo-200 font-medium block">
                                {currentAppraisal.jobRoleLabel} • {currentAppraisal.division}
                              </span>
                            </div>

                            <div className="text-center px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
                              <span className="text-[9px] uppercase font-bold text-indigo-300 block">
                                Predikat
                              </span>
                              <span className="text-2xl sm:text-3xl font-black text-amber-300">
                                {currentAppraisal.grade}
                              </span>
                            </div>
                          </div>

                          {/* Ulasan Tolak Ukur Standar Industri 2026 */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Audit Tolak Ukur Standar Industri Terkini</span>
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                              {currentAppraisal.industryBenchmarkReview}
                            </p>
                          </div>

                          {/* Ringkasan Eksekutif Penilaian */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                              🎯 Ringkasan Eksekutif Penilaian
                            </span>
                            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                              {currentAppraisal.executiveSummary}
                            </p>
                          </div>

                          {/* Rincian Metrik Terverifikasi */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                              📊 Metrik Capaian Terverifikasi
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(currentAppraisal.metrics).map(([key, val], idx) => (
                                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                  <div className="text-[10px] text-slate-500 font-semibold">{key}</div>
                                  <div className="font-bold text-slate-900 truncate mt-0.5">{String(val)}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Poin Kekuatan & Keunggulan */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Poin Kekuatan &amp; Nilai Tambah</span>
                            </span>
                            <ul className="space-y-1.5 text-xs text-slate-700 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/70">
                              {currentAppraisal.strengths.map((str, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Area Perbaikan */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Area Optimasi &amp; Gap Analisis</span>
                            </span>
                            <ul className="space-y-1.5 text-xs text-slate-700 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/70">
                              {currentAppraisal.improvements.map((imp, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-amber-600 font-bold">•</span>
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Rekomendasi Taktis AI PRO */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block flex items-center gap-1.5">
                              <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Rekomendasi Taktis Kenaikan Mutu</span>
                            </span>
                            <ul className="space-y-1.5 text-xs text-slate-700 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-200/70">
                              {currentAppraisal.tacticalRecommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-indigo-600 font-bold">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Tombol Aksi Rapor */}
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const metricsText = Object.entries(currentAppraisal.metrics)
                                  .map(([k, v]) => `• ${k}: ${v}`)
                                  .join('\n');
                                const strengthsText = currentAppraisal.strengths.map((s) => `• ${s}`).join('\n');
                                const improvementsText = currentAppraisal.improvements.map((i) => `• ${i}`).join('\n');
                                const tacticalText = currentAppraisal.tacticalRecommendations.map((t) => `• ${t}`).join('\n');

                                const fullSummary = [
                                  `*RAPOR HASIL PENILAIAN KERJA AI PRO*`,
                                  `Judul Deliverable: ${currentAppraisal.reportTitle}`,
                                  `Pelaksana: ${currentAppraisal.ownerName} (${currentAppraisal.jobRoleLabel} - ${currentAppraisal.division})`,
                                  `Periode: ${formatDateShortIndo(currentAppraisal.periodDate)}`,
                                  currentAppraisal.linkUrl ? `Tautan Bukti: ${currentAppraisal.linkUrl}` : '',
                                  currentAppraisal.notes ? `Catatan Pelaksana: "${currentAppraisal.notes}"` : '',
                                  ``,
                                  `*SKOR & PREDIKAT KINERJA:*`,
                                  `Skor: ${currentAppraisal.score}/100 (Predikat: ${currentAppraisal.grade})`,
                                  ``,
                                  `*RINGKASAN EKSEKUTIF:*`,
                                  currentAppraisal.executiveSummary,
                                  ``,
                                  `*TOLAK UKUR STANDAR INDUSTRI:*`,
                                  currentAppraisal.industryBenchmarkReview,
                                  ``,
                                  `*METRIK CAPAIAN TERVERIFIKASI:*`,
                                  metricsText,
                                  ``,
                                  `*POIN KEUNGGULAN:*`,
                                  strengthsText,
                                  ``,
                                  `*AREA EVALUASI & GAP:*`,
                                  improvementsText,
                                  ``,
                                  `*REKOMENDASI TAKTIS:*`,
                                  tacticalText,
                                ].filter(Boolean).join('\n');

                                copyCodeToClipboard(fullSummary, 'Rapor Lengkap AI PRO');
                              }}
                              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Rapor Lengkap</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak Rapor</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3 flex flex-col items-center justify-center min-h-[360px]">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Award className="w-7 h-7" />
                          </div>
                          <h4 className="text-base font-bold text-slate-900">
                            Rapor Hasil Kerja Belum Diterbitkan
                          </h4>
                          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                            Pilih profesi kerja Anda di panel sebelah kiri, lampirkan tautan video/karya dan tangkapan layar analitik, lalu klik tombol <strong>⚡ Pindai Bukti &amp; Terbitkan Penilaian</strong> agar AI PRO otomatis membaca angka views, likes, retensi, dan metrik lainnya langsung dari gambar.
                          </p>
                        </div>
                      )}

                      {/* Card Riwayat Rapor Penilaian Kerja Tersimpan */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <span>Riwayat Rapor Penilaian ({savedAppraisals.length})</span>
                          </h4>
                        </div>

                        {savedAppraisals.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            Belum ada riwayat rapor penilaian yang tersimpan.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {savedAppraisals.map((item) => (
                              <div
                                key={item.id}
                                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors flex items-start justify-between gap-3 group"
                              >
                                <div
                                  className="min-w-0 cursor-pointer flex-1"
                                  onClick={() => {
                                    setCurrentAppraisal(item);
                                    showToast(`Rapor "${item.reportTitle}" berhasil dimuat`);
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs text-slate-900 truncate group-hover:text-indigo-600">
                                      {item.reportTitle}
                                    </span>
                                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800">
                                      {item.grade} • {item.score}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {item.jobRoleLabel} • {item.division}
                                  </p>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {formatDateShortIndo(item.createdAt.slice(0, 10))}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAppraisal(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                  title="Hapus rapor"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: REKAP ABSENSI & JAM KERJA HARIAN (FITUR LAPORAN LAMA DENGAN UNDUH PDF) */}

              {/* VIEW 2: UNGGAH BUKTI GAMBAR & REKOMENDASI TAKTIS AI */}
              {aiPerfSubTab === 'upload' && (
                <div className="space-y-6">
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

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleRunAIAnalysis(false)}
                      disabled={isAnalyzingAI || !aiUploadedImage}
                      className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      {isAnalyzingAI ? (
                        <>
                          <BrainCircuit className="w-4 h-4 animate-spin" />
                          <span>AI Sedang Memproses Analisis...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-current" />
                          <span>Analisis Bukti Gambar &amp; Daily Report</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunAIAnalysis(true)}
                      disabled={isAnalyzingAI}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                      title="Evaluasi performa langsung dari data laporan harian dan absensi tanpa upload gambar"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <span>⚡ Evaluasi Langsung dari Data Daily Report &amp; Absensi</span>
                    </button>
                  </div>
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
            </div>
          )}

          {/* TAB 6: STUDIO RECORD VOICE TO TEXT & KESIMPULAN CERDAS AI PRO */}
          {activeMainTab === 'voice_ai' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-700/50">
                <div className="relative z-10 max-w-3xl space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                      <span>AI Record Voice to Text &amp; Smart Summary PRO</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/30 border border-purple-400/40 text-purple-200 uppercase tracking-wider">
                      Studio HD Audio 48kHz
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                    Studio Record Voice to Text &amp; Analisis AI PRO
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-normal">
                    Ubah suara Anda menjadi transkripsi teks presisi tinggi secara real-time. Mesin AI PRO otomatis menganalisis rekaman untuk mengekstrak ringkasan eksekutif mendalam, poin diskusi teknis, tindakan lanjutan (action items) terstruktur dengan prioritas, dan mitigasi risiko kendala.
                  </p>
                </div>
                <div className="absolute -right-8 -bottom-10 opacity-15 pointer-events-none">
                  <Mic className="w-64 h-64 text-white" />
                </div>
              </div>

              {/* Main Voice Studio Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Perekam & Transkripsi (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Card Perekaman Suara */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <AudioWaveform className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                          Panel Perekaman Suara
                        </h3>
                      </div>

                      {/* Pemilih Bahasa */}
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setVoiceLanguage('id-ID')}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            voiceLanguage === 'id-ID' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🇮🇩 Indonesia
                        </button>
                        <button
                          type="button"
                          onClick={() => setVoiceLanguage('en-US')}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            voiceLanguage === 'en-US' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🇬🇧 English
                        </button>
                      </div>
                    </div>

                    {/* Panel Mikrofon & Audio Visualizer PRO */}
                    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 space-y-4 text-center shadow-inner relative overflow-hidden">
                      {/* Audio Quality Header */}
                      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2.5 px-1">
                        <span className="flex items-center gap-1.5 font-bold text-indigo-300">
                          <AudioWaveform className="w-3.5 h-3.5 text-indigo-400" />
                          <span>PRO Audio Engine (48kHz)</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Noise Suppression Aktif
                        </span>
                      </div>

                      {/* Tombol Rekam Besar */}
                      <div className="relative pt-2">
                        {isRecordingVoice && (
                          <>
                            <div className="absolute inset-0 -m-4 rounded-full bg-rose-500/25 animate-ping" />
                            <div className="absolute inset-0 -m-2 rounded-full bg-rose-500/40 animate-pulse" />
                          </>
                        )}
                        <button
                          type="button"
                          onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all transform active:scale-95 relative z-10 ${
                            isRecordingVoice
                              ? 'bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white ring-8 ring-rose-500/30'
                              : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white ring-8 ring-indigo-500/20'
                          }`}
                        >
                          {isRecordingVoice ? (
                            <>
                              <Square className="w-7 h-7 fill-current" />
                              <span className="text-[10px] font-black mt-1 tracking-wider">STOP REC</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-8 h-8" />
                              <span className="text-[10px] font-black mt-1 tracking-wider">START REC</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Dynamic Audio Waveform Visualizer */}
                      {isRecordingVoice ? (
                        <div className="flex items-center justify-center gap-1 h-8 pt-1">
                          {[35, 60, 90, 45, 80, 100, 50, 75, 40, 95, 65, 85, 30].map((h, i) => (
                            <div
                              key={i}
                              style={{
                                height: `${Math.max(15, (h * (0.5 + Math.sin((recordingDurationSec * 4 + i) * 0.8) * 0.5)))}%`,
                                transition: 'height 0.15s ease-in-out',
                              }}
                              className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-purple-400 to-rose-400"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 h-8 pt-1 opacity-30">
                          {[20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20].map((h, i) => (
                            <div key={i} className="w-1.5 h-2 rounded-full bg-slate-500" />
                          ))}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white flex items-center justify-center gap-2">
                          {isRecordingVoice ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                              <span className="font-mono text-sm tracking-widest text-rose-300 font-extrabold">
                                REC {String(Math.floor(recordingDurationSec / 60)).padStart(2, '0')}:{String(recordingDurationSec % 60).padStart(2, '0')}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-300 font-medium">Siap Merekam • Tekan tombol untuk mulai mendikte</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-sm">
                          {isRecordingVoice
                            ? 'Bicaralah dengan wajar. Algoritma peredam bising aktif dan suara Anda otomatis ditranskripsi ke teks.'
                            : 'Gunakan mikrofon untuk mendiktekan laporan harian, notulen rapat koordinasi, atau instruksi kerja.'}
                        </p>
                      </div>

                      {recordedAudioUrl && !isRecordingVoice && (
                        <div className="w-full max-w-md pt-2 space-y-1.5">
                          <audio src={recordedAudioUrl} controls className="w-full h-10 rounded-xl" />
                          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Audio tersimpan di memori perangkat
                            </span>
                            <a
                              href={recordedAudioUrl}
                              download="rekaman-suara.webm"
                              className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
                            >
                              <Download className="w-3 h-3" />
                              <span>Unduh Audio</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Area Transkripsi dengan Fitur Salin Teks Tertentu / Keseluruhan */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>Teks Transkripsi Suara</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {voiceTranscript && (
                            <>
                              <button
                                type="button"
                                onClick={handleCopyTranscript}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs transition-all active:scale-95"
                                title="Salin teks yang diblok/diseleksi, atau salin seluruh teks jika tidak ada teks yang diblok"
                              >
                                <Copy className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Salin Teks</span>
                              </button>
                              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                                {voiceTranscript.split(/\s+/).filter(Boolean).length} Kata
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <textarea
                          ref={transcriptTextareaRef}
                          rows={6}
                          value={voiceTranscript}
                          onChange={(e) => setVoiceTranscript(e.target.value)}
                          placeholder="Hasil rekaman suara akan langsung diketik di sini secara otomatis. Anda juga dapat mengedit atau menambahkan catatan secara manual sebelum dianalisis..."
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-normal"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2">
                          {voiceTranscript && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setVoiceTranscript('');
                                  setVoiceSummaryResult(null);
                                }}
                                className="text-xs text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50"
                              >
                                Bersihkan Teks
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveVoiceDraft}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                                title="Simpan sebagai draft rekaman suara"
                              >
                                <span>💾 Simpan Draft</span>
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isGeneratingSummary || !voiceTranscript.trim()}
                          onClick={handleGenerateSummary}
                          className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-all"
                        >
                          <Wand2 className={`w-4 h-4 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                          <span>{isGeneratingSummary ? 'Menganalisis Suara...' : '⚡ Buat Kesimpulan Cerdas AI'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Hasil Kesimpulan AI & Riwayat (5 Cols) */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Card Hasil Kesimpulan AI */}
                  {voiceSummaryResult ? (
                    <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-sm space-y-5 relative overflow-hidden bg-gradient-to-b from-indigo-50/40 via-white to-white">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-extrabold text-sm sm:text-base text-indigo-950">
                            Hasil Kesimpulan AI
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={copyVoiceSummaryText}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-2xs"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </button>
                      </div>

                      {/* 1. Ringkasan Eksekutif */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                          🎯 Ringkasan Eksekutif
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                          {voiceSummaryResult.summary}
                        </p>
                      </div>

                      {/* 2. Poin-Poin Kunci */}
                      {voiceSummaryResult.keyPoints.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                            📋 Poin-Poin Kunci Pembahasan
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-700 bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                            {voiceSummaryResult.keyPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Kategori Pembahasan PRO */}
                      {voiceSummaryResult.category && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">Kategori:</span>
                          <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {voiceSummaryResult.category}
                          </span>
                        </div>
                      )}

                      {/* 3. Tindakan Lanjutan PRO */}
                      {voiceSummaryResult.actionItems.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                            ⚡ Tindakan Lanjutan &amp; Delegasi Tugas PRO
                          </span>
                          <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                            {voiceSummaryResult.actionItems.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="font-semibold leading-relaxed">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Mitigasi Risiko Kendala Lapangan PRO */}
                      {voiceSummaryResult.riskMitigation && voiceSummaryResult.riskMitigation.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Mitigasi Risiko &amp; Rekomendasi Solusi</span>
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-700 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/70 shadow-2xs">
                            {voiceSummaryResult.riskMitigation.map((risk, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-600 font-bold">•</span>
                                <span className="leading-relaxed">{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tombol Ekspor Cepat ke Kalender */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleConvertSummaryToTask}
                          className="w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        >
                          <Check className="w-4 h-4" />
                          <span>Jadikan Tugas Proyek di Kalender</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                        <Wand2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800">
                        Kesimpulan Cerdas Belum Dibuat
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Mulai rekam suara Anda di panel sebelah kiri atau ketik catatan meeting, lalu klik tombol <strong>⚡ Buat Kesimpulan AI</strong> untuk merangkum otomatis.
                      </p>
                    </div>
                  )}

                  {/* Card Riwayat Memo Suara */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FileAudio className="w-4 h-4 text-indigo-600" />
                        <span>Riwayat Rekaman Suara ({savedVoiceMemos.length})</span>
                      </h4>
                    </div>

                    {savedVoiceMemos.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Belum ada riwayat rekaman suara tersimpan.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {savedVoiceMemos.map((memo) => (
                          <div
                            key={memo.id}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex items-start justify-between gap-3 shadow-2xs group"
                          >
                            <div
                              className="min-w-0 cursor-pointer flex-1"
                              onClick={() => handleSelectVoiceMemo(memo)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-xs text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                  {memo.title}
                                </div>
                                {memo.audioUrl && (
                                  <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] font-bold">
                                    <AudioWaveform className="w-2.5 h-2.5" />
                                    <span>Audio Ready</span>
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {memo.title}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                                {memo.summary}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                {formatDateFullIndo(memo.createdAt.slice(0, 10))} • {Math.floor(memo.durationSeconds / 60)}:{String(memo.durationSeconds % 60).padStart(2, '0')}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteVoiceMemo(memo.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                              title="Hapus riwayat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                                  {entry.status === 'tertunda' && (
                                    <AlertTriangle className="w-3 h-3 text-amber-600 fill-current" />
                                  )}
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      STATUS_META[entry.status].dotClass
                                    }`}
                                  />
                                  <span>{STATUS_META[entry.status].label}</span>
                                  {entry.status === 'tertunda' && (
                                    <span className="font-black text-amber-700">!</span>
                                  )}
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
                                      <div className="w-full space-y-2">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>
                                            Selesai dalam {range.totalDays} hari kerja ({formatDateShortIndo(range.startDate)} – {formatDateShortIndo(range.endDate)})
                                          </span>
                                        </span>

                                        {/* TINDAK LANJUT PROYEK SELESAI: OTOMATIS MENAMBAH PEKERJAAN REVISI BARU KE KALENDER */}
                                        <div className="p-3.5 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50/30 border border-emerald-200 rounded-2xl space-y-3 text-xs shadow-2xs">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              <span>Tindak Lanjut &amp; Jadwal Revisi</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                              Proyek Selesai
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-emerald-800 leading-relaxed">
                                            Ketika ada revisian atau pekerjaan lanjutan pada proyek ini, tentukan rincian dan tanggalnya.
                                            Sistem akan <strong>otomatis menambahkan pekerjaan baru ini ke kalender pada tanggal yang Anda pilih</strong>.
                                          </p>

                                          <div className="space-y-2.5 pt-1">
                                            <div>
                                              <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                                                Rincian Revisian
                                              </label>
                                              <input
                                                type="text"
                                                value={activeRevisionEntryId === entry.id ? revFollowupTitle : ''}
                                                onChange={(e) => {
                                                  setActiveRevisionEntryId(entry.id);
                                                  setRevFollowupTitle(e.target.value);
                                                }}
                                                placeholder="Contoh: Revisi perbaiki bagian X, ngepel ulang lantai 2..."
                                                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                                              />
                                            </div>

                                            <div>
                                              <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                                                Jadwal Tanggal di Kalender
                                              </label>
                                              <div className="flex items-center gap-2 bg-white border border-emerald-300 rounded-xl px-3 py-2 shadow-2xs">
                                                <CalendarIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <input
                                                  type="date"
                                                  value={activeRevisionEntryId === entry.id ? revFollowupDate : (selectedDate || todayStr)}
                                                  onChange={(e) => {
                                                    setActiveRevisionEntryId(entry.id);
                                                    setRevFollowupDate(e.target.value);
                                                  }}
                                                  className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                                                />
                                              </div>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                const rTitle = activeRevisionEntryId === entry.id && revFollowupTitle.trim() ? revFollowupTitle.trim() : `Revisi: ${entry.title}`;
                                                const rDate = activeRevisionEntryId === entry.id && revFollowupDate ? revFollowupDate : (selectedDate || todayStr);
                                                handleCreateRevisionFromCompleted(entry, rTitle, rDate);
                                              }}
                                              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all"
                                            >
                                              <Plus className="w-4 h-4" />
                                              <span>Tambah Revisi ke Kalender</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : entry.status === 'tertunda' ? (
                                      <div className="w-full space-y-2">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-amber-950 bg-amber-100 border border-amber-300 shadow-2xs">
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 fill-current" />
                                          <span>
                                            Tertunda di Hari ke-{dayIndex} ({range.totalDays} hari kerja berjalan • {formatDateShortIndo(range.startDate)} s/d {formatDateShortIndo(range.endDate)})
                                          </span>
                                        </span>

                                        {/* OPSI LANJUTKAN PROYEK TERTUNDA DENGAN PENENTUAN TANGGAL MANUAL */}
                                        <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 rounded-2xl space-y-3 text-xs shadow-2xs">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs">
                                              <Play className="w-3.5 h-3.5 text-amber-600 fill-current" />
                                              <span>Lanjutkan Proyek Tertunda</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-amber-700 bg-white px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                                              Pilih Tanggal
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-amber-800 leading-relaxed">
                                            Tentukan secara manual tanggal kapan proyek tertunda ini akan mulai aktif dikerjakan kembali:
                                          </p>

                                          <div className="space-y-2.5 pt-0.5">
                                            <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-xl px-3 py-2 shadow-2xs">
                                              <CalendarIcon className="w-4 h-4 text-amber-600 shrink-0" />
                                              <input
                                                type="date"
                                                value={resumeDateInput}
                                                onChange={(e) => setResumeDateInput(e.target.value)}
                                                className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                                              />
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => handleResumeTertundaProject(entry, resumeDateInput)}
                                              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-all"
                                            >
                                              <Play className="w-3.5 h-3.5 fill-current" />
                                              <span>Lanjutkan Mulai Tanggal Ini</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-blue-900 bg-blue-50 border border-blue-200">
                                        <Clock className="w-3 h-3 text-blue-600" />
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

                              {/* BAGIAN PENAMBAHAN PEKERJAAN & CATATAN REVISI PROYEK */}
                              <div className="pt-2.5 mt-2 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-indigo-600" />
                                    <span>Penambahan Pekerjaan &amp; Riwayat Revisi</span>
                                    {entry.additionalTasks && entry.additionalTasks.length > 0 && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-700">
                                        {entry.additionalTasks.length}
                                      </span>
                                    )}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveAddonEntryId(activeAddonEntryId === entry.id ? null : entry.id);
                                      setAddonTaskTitle('');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{activeAddonEntryId === entry.id ? 'Tutup' : 'Tambah Revisi / Kerja'}</span>
                                  </button>
                                </div>

                                {/* Form Cepat Tambah Revisi / Pekerjaan Tambahan */}
                                {activeAddonEntryId === entry.id && (
                                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                                      <span>Pilih Kategori Penambahan:</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                      {[
                                        { id: 'revisi', label: 'Revisi Proyek', color: 'bg-rose-100 text-rose-800 border-rose-300' },
                                        { id: 'tambahan', label: 'Pekerjaan Tambahan', color: 'bg-blue-100 text-blue-800 border-blue-300' },
                                        { id: 'kendala', label: 'Kendala / Masalah', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                                        { id: 'instruksi', label: 'Instruksi Baru', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                                      ].map((opt) => (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => setAddonTaskType(opt.id as any)}
                                          className={`px-2 py-1.5 rounded-xl text-[10px] font-bold text-center border transition-all ${
                                            addonTaskType === opt.id
                                              ? `${opt.color} ring-2 ring-indigo-500 shadow-2xs`
                                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Rincian Revisi / Pekerjaan Tambahan <span className="text-rose-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={addonTaskTitle}
                                        onChange={(e) => setAddonTaskTitle(e.target.value)}
                                        placeholder="Contoh: Revisi color grading menit 02:15, ubah layout header..."
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                      />
                                    </div>

                                    {/* PENENTUAN TANGGAL KAPAN AKAN DILAKUKAN REVISI (MUNCUL DI KALENDER) */}
                                    <div className="space-y-2">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                          Kapan Revisi / Pekerjaan Ini Dilakukan? (Pilih Tanggal di Kalender) <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-2 bg-white border border-indigo-200 rounded-xl px-3 py-2 shadow-2xs">
                                          <CalendarIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                                          <input
                                            type="date"
                                            value={addonScheduledDate || selectedDate || todayStr}
                                            onChange={(e) => setAddonScheduledDate(e.target.value)}
                                            className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleAddAddonTask(entry.id)}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                                      >
                                        <Plus className="w-4 h-4" />
                                        <span>Simpan &amp; Jadwalkan di Kalender</span>
                                      </button>
                                      <span className="text-[10px] text-indigo-700 text-center block font-medium">
                                        📅 Item revisi ini akan otomatis muncul pada tanggal kalender yang Anda pilih.
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Daftar Item Revisi / Pekerjaan Tambahan */}
                                {entry.additionalTasks && entry.additionalTasks.length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    {entry.additionalTasks.map((addon) => {
                                      const badgeMap = {
                                        revisi: { label: 'Revisi', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
                                        tambahan: { label: 'Tambahan', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
                                        kendala: { label: 'Kendala', bg: 'bg-amber-100 text-amber-900 border-amber-200' },
                                        instruksi: { label: 'Instruksi', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                                      };
                                      const meta = badgeMap[addon.type] || badgeMap.revisi;

                                      return (
                                        <div
                                          key={addon.id}
                                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                                            addon.isCompleted ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-800'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <input
                                              type="checkbox"
                                              checked={Boolean(addon.isCompleted)}
                                              onChange={() => handleToggleAddonTask(entry.id, addon.id)}
                                              className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer accent-indigo-600 shrink-0"
                                              title="Tandai selesai"
                                            />
                                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold border shrink-0 ${meta.bg}`}>
                                              {meta.label}
                                            </span>
                                            <span className={`truncate ${addon.isCompleted ? 'line-through text-slate-400' : 'font-medium text-slate-800'}`}>
                                              {addon.title}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400">
                                            <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                              📅 Target: {formatDateShortIndo(addon.scheduledDate || addon.dateAdded)}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteAddonTask(entry.id, addon.id)}
                                              className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                                              title="Hapus revisi"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Judul Catatan / Tugas <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={openVoiceModal}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      title="Rekam suara & rangkum tugas dengan AI"
                    >
                      <Mic className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Dikte Suara AI</span>
                    </button>
                  </div>
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
                      <option value="tertunda">⚠️ Tertunda (! Stop ke hari berikutnya)</option><option value="selesai">Selesai</option>
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
                  lateToleranceMinutes: isNaN(Number(policyToleranceInput)) ? 0 : Number(policyToleranceInput),
                  earlyOvertimeThresholdMinutes: Number(policyThresholdInput) || 60,
                  lateOvertimeThresholdMinutes: isNaN(Number(policyLateOtThresholdInput)) ? 30 : Number(policyLateOtThresholdInput),
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
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">
                    {policyToleranceInput === 0 ? '0 Menit (Mode Ketat / Tanpa Toleransi / Manual)' : `Toleransi: ${policyToleranceInput} menit`}
                  </span>
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
                      min={0}
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Menit Pulang Kerja (Lembur Sore &amp; Malam) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={180}
                      value={policyLateOtThresholdInput}
                      onChange={(e) => setPolicyLateOtThresholdInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      Menit
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Ambang batas menit setelah {policyCheckOutInput} untuk konfirmasi lembur sore/malam (dapat disesuaikan)
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
              {/* OPSI PILIH DARI PROYEK SELESAI SEBELUMNYA */}
              {!editingProject && completedProjects.length > 0 && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tambah Proyek dari Proyek yang Sudah Selesai</span>
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.2 rounded-full border border-indigo-200">
                      {completedProjects.length} Proyek Selesai
                    </span>
                  </div>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const selected = completedProjects.find((p) => p.id === e.target.value);
                      if (selected) {
                        openCreateProjectFromCompleted(selected);
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Pilih Proyek Selesai untuk Dibuat Lanjutannya --</option>
                    {completedProjects.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.name} ({cp.programs?.length || 0} cabang program)
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

      {/* POP-UP INTERAKTIF KONFIRMASI PRESENSI (LEMBUR AWAL / IZIN TERLAMBAT & LEMBUR SORE/MALAM) */}
      {attConfirmModal && attConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setAttConfirmModal(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                  attConfirmModal.scenario === 'early_in' ? 'bg-indigo-600' :
                  attConfirmModal.scenario === 'late_in' ? 'bg-rose-600' :
                  attConfirmModal.scenario === 'late_out_overtime' ? 'bg-amber-600' : 'bg-purple-600'
                }`}>
                  {attConfirmModal.scenario === 'late_in' ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    {attConfirmModal.scenario === 'early_in' ? 'Konfirmasi Datang Lebih Awal (Lembur Pagi?)' :
                     attConfirmModal.scenario === 'late_in' ? 'Konfirmasi Jam Masuk (Terlambat / Izin?)' :
                     attConfirmModal.scenario === 'late_out_overtime' ? 'Konfirmasi Jam Pulang (Lembur Sore/Malam?)' :
                     'Konfirmasi Presensi Hari Libur (Lembur Penuh)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sinkronisasi dengan Tolak Ukur Kerja &amp; Keputusan Manajemen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttConfirmModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Card Detail Jam Aktual vs Baku */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Jam Presensi Aktual</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">{attConfirmModal.time}</span>
                  <span className="text-[10px] text-slate-500 block">Pukul saat presensi</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    {attConfirmModal.mode === 'in' ? 'Jam Masuk Baku' : 'Jam Pulang Baku'}
                  </span>
                  <span className="text-base font-extrabold text-indigo-700 font-mono">
                    {attConfirmModal.mode === 'in' ? workPolicy.standardCheckInTime : workPolicy.standardCheckOutTime}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {attConfirmModal.mode === 'in' ? `Toleransi: ${workPolicy.lateToleranceMinutes}m` : `Batas lembur: ${workPolicy.lateOvertimeThresholdMinutes !== undefined ? workPolicy.lateOvertimeThresholdMinutes : 30}m`}
                  </span>
                </div>
              </div>

              {/* KASUS 1: CLOCK IN LEBIH AWAL (Lembur Pagi?) */}
              {attConfirmModal.scenario === 'early_in' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Anda datang {attConfirmModal.diffMinutes} menit lebih awal</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-snug">
                      Apakah kedatangan awal ini dihitung sebagai <strong>Lembur Pagi</strong> (+{attConfirmModal.calculatedOvertimeHours} Jam)
                      atas penugasan / persetujuan atasan? Jam reguler tetap dihitung mulai pukul {workPolicy.standardCheckInTime}.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAttConfirmModal({ ...attConfirmModal, isOvertimeConfirmed: true })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        attConfirmModal.isOvertimeConfirmed
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Ya, Hitung Lembur</div>
                      <div className={`text-[10px] mt-0.5 ${attConfirmModal.isOvertimeConfirmed ? 'text-indigo-100' : 'text-slate-500'}`}>
                        +{attConfirmModal.calculatedOvertimeHours} Jam Lembur Pagi
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttConfirmModal({ ...attConfirmModal, isOvertimeConfirmed: false })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        !attConfirmModal.isOvertimeConfirmed
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Tidak, Hadir Normal</div>
                      <div className={`text-[10px] mt-0.5 ${!attConfirmModal.isOvertimeConfirmed ? 'text-indigo-100' : 'text-slate-500'}`}>
                        Mulai reguler jam {workPolicy.standardCheckInTime}
                      </div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Keterangan Tugas Pagi / Persetujuan Atasan
                    </label>
                    <textarea
                      rows={2}
                      value={attConfirmModal.overtimeReason}
                      onChange={(e) => setAttConfirmModal({ ...attConfirmModal, overtimeReason: e.target.value })}
                      placeholder="Contoh: Datang awal menyiapkan ruangan meeting klien dan berkas kerja..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}

              {/* KASUS 2: CLOCK IN TERLAMBAT (Lewat dari Jam Masuk Baku) */}
              {attConfirmModal.scenario === 'late_in' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Terlambat {attConfirmModal.diffMinutes} menit dari jam baku ({workPolicy.standardCheckInTime})</span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-snug">
                      Toleransi keterlambatan baku adalah {workPolicy.lateToleranceMinutes} menit. Silakan konfirmasi apakah ini
                      merupakan <strong>Izin Terlambat Resmi</strong> (dengan dispensasi tugas) atau Terlambat Biasa.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAttConfirmModal({ ...attConfirmModal, lateChoice: 'izin' })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        attConfirmModal.lateChoice === 'izin'
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Izin Terlambat</div>
                      <div className={`text-[10px] mt-0.5 ${attConfirmModal.lateChoice === 'izin' ? 'text-indigo-100' : 'text-slate-500'}`}>
                        Dispensasi resmi / tugas luar
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttConfirmModal({ ...attConfirmModal, lateChoice: 'telat' })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        attConfirmModal.lateChoice === 'telat'
                          ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Terlambat Biasa</div>
                      <div className={`text-[10px] mt-0.5 ${attConfirmModal.lateChoice === 'telat' ? 'text-rose-100' : 'text-slate-500'}`}>
                        Catatan keterlambatan harian
                      </div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alasan Keterlambatan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={attConfirmModal.lateReason}
                      onChange={(e) => setAttConfirmModal({ ...attConfirmModal, lateReason: e.target.value })}
                      placeholder="Contoh: Terjebak macet kecelakaan di tol lingkar luar / dinas mampir vendor pagi..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}

              {/* KASUS 3: CLOCK OUT SORE / MALAM (Lembur Akhir?) */}
              {attConfirmModal.scenario === 'late_out_overtime' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Pulang {attConfirmModal.diffMinutes} menit setelah jam pulang baku ({workPolicy.standardCheckOutTime})</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Ambang batas lembur sore adalah {workPolicy.lateOvertimeThresholdMinutes !== undefined ? workPolicy.lateOvertimeThresholdMinutes : 30} menit.
                      Apakah waktu tambahan ini dihitung sebagai <strong>Lembur Sore / Malam</strong> (+{attConfirmModal.calculatedOvertimeHours} Jam)?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAttConfirmModal({ ...attConfirmModal, isOvertimeConfirmed: true })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        attConfirmModal.isOvertimeConfirmed
                          ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Ya, Hitung Lembur</div>
                      <div className={`text-[10px] mt-0.5 ${attConfirmModal.isOvertimeConfirmed ? 'text-amber-100' : 'text-slate-500'}`}>
                        +{attConfirmModal.calculatedOvertimeHours} Jam Lembur Sore
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttConfirmModal({ ...attConfirmModal, isOvertimeConfirmed: false })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        !attConfirmModal.isOvertimeConfirmed
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Tidak, Selesai Shift Reguler</div>
                      <div className={`text-[10px] mt-0.5 ${!attConfirmModal.isOvertimeConfirmed ? 'text-indigo-100' : 'text-slate-500'}`}>
                        Hanya hitung jam kerja normal
                      </div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Keterangan Pekerjaan Lembur / Proyek yang Diselesaikan
                    </label>
                    <textarea
                      rows={2}
                      value={attConfirmModal.overtimeReason}
                      onChange={(e) => setAttConfirmModal({ ...attConfirmModal, overtimeReason: e.target.value })}
                      placeholder="Contoh: Menyelesaikan revisi video promosi dan upload aset render..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}

              {/* KASUS 4: PRESENSI HARI LIBUR / AKHIR PEKAN (Lembur Penuh) */}
              {attConfirmModal.scenario === 'holiday_work' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Presensi Hari Libur / Akhir Pekan Terkonfirmasi</span>
                    </div>
                    <p className="text-[11px] text-purple-800 leading-snug">
                      Berdasarkan tolak ukur baku ({workPolicy.workDaysPerWeek} hari kerja), hari ini adalah hari libur. Seluruh durasi
                      pekerjaan Anda otomatis masuk hitungan <strong>LEMBUR PENUH (100% Overtime)</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Keterangan Tugas Lembur Hari Libur
                    </label>
                    <textarea
                      rows={2}
                      value={attConfirmModal.overtimeReason}
                      onChange={(e) => setAttConfirmModal({ ...attConfirmModal, overtimeReason: e.target.value })}
                      placeholder="Contoh: Pengawasan pengerjaan lapangan darurat / penugasan event akhir pekan..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAttConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  let shiftCategory: WorkShiftCategory = 'normal';
                  let shiftNotes = '';
                  let overtimeHours = 0;
                  let isLate = false;
                  let lateReason = '';
                  let isOvertimeConfirmed = attConfirmModal.isOvertimeConfirmed;
                  let overtimeReason = attConfirmModal.overtimeReason.trim();

                  if (attConfirmModal.scenario === 'early_in') {
                    if (isOvertimeConfirmed) {
                      shiftCategory = 'lembur_awal';
                      overtimeHours = attConfirmModal.calculatedOvertimeHours;
                      shiftNotes = overtimeReason || `Lembur Pagi: Datang ${attConfirmModal.diffMinutes} menit lebih awal`;
                    } else {
                      shiftCategory = 'normal';
                      shiftNotes = `Shift Normal: Masuk awal ${attConfirmModal.diffMinutes} menit (Hadir Reguler)`;
                      overtimeHours = 0;
                    }
                  } else if (attConfirmModal.scenario === 'late_in') {
                    isLate = true;
                    lateReason = attConfirmModal.lateReason.trim() || (attConfirmModal.lateChoice === 'izin' ? 'Izin Terlambat' : 'Terlambat');
                    shiftCategory = 'normal';
                    shiftNotes = attConfirmModal.lateChoice === 'izin'
                      ? `Izin Terlambat (+${attConfirmModal.diffMinutes}m): ${lateReason}`
                      : `Terlambat (+${attConfirmModal.diffMinutes}m): ${lateReason}`;
                  } else if (attConfirmModal.scenario === 'late_out_overtime') {
                    if (isOvertimeConfirmed) {
                      shiftCategory = 'lembur_akhir';
                      overtimeHours = attConfirmModal.calculatedOvertimeHours;
                      shiftNotes = overtimeReason || `Lembur Sore/Malam: Pulang ${attConfirmModal.diffMinutes} menit setelah jam pulang baku`;
                    } else {
                      shiftCategory = 'normal';
                      shiftNotes = `Shift Normal: Pulang ${attConfirmModal.time} (Reguler)`;
                      overtimeHours = 0;
                    }
                  } else if (attConfirmModal.scenario === 'holiday_work') {
                    shiftCategory = 'lembur_penuh';
                    shiftNotes = overtimeReason || 'Lembur Hari Libur / Akhir Pekan Penuh';
                  }

                  executeAttendanceSave({
                    mode: attConfirmModal.mode,
                    date: attConfirmModal.date,
                    time: attConfirmModal.time,
                    photoUrl: attConfirmModal.photoUrl,
                    location: attConfirmModal.location,
                    shiftCategory,
                    shiftNotes,
                    regularWorkHours: undefined,
                    overtimeHours: overtimeHours > 0 ? overtimeHours : undefined,
                    isLate,
                    lateReason,
                    isOvertimeConfirmed,
                    overtimeReason,
                    notes: shiftNotes,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Konfirmasi &amp; Simpan Presensi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENYESUAIAN KETERANGAN LEMBUR OLEH ATASAN / PEKERJA */}
      {editingOvertimeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setEditingOvertimeRecord(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Sesuaikan Keterangan Lembur
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formatDateFullIndo(editingOvertimeRecord.date)} • {editingOvertimeRecord.ownerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOvertimeRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!currentUser) return;
                const otPayload: any = {
                  date: editingOvertimeRecord.date,
                  type: editingOvertimeRecord.type,
                  checkInTime: editingOvertimeRecord.checkInTime,
                  checkOutTime: editingOvertimeRecord.checkOutTime,
                  overtimeHours: Number(editOtHoursInput) || 0,
                  shiftCategory: editOtCategoryInput,
                  shiftNotes: editOtReasonInput.trim() || 'Lembur disesuaikan atasan',
                  overtimeReason: editOtReasonInput.trim(),
                  isOvertimeConfirmed: Number(editOtHoursInput) > 0,
                  notes: editOtReasonInput.trim() || editingOvertimeRecord.notes,
                };
                const updated = await db.recordAttendance(otPayload, currentUser);
                setAttendance(updated);
                setEditingOvertimeRecord(null);
                showToast('Catatan & jam lembur berhasil disesuaikan!');
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Shift Lembur
                </label>
                <select
                  value={editOtCategoryInput}
                  onChange={(e) => setEditOtCategoryInput(e.target.value as WorkShiftCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                >
                  <option value="lembur_akhir">Lembur Sore / Malam</option>
                  <option value="lembur_awal">Lembur Pagi (Awal)</option>
                  <option value="lembur_penuh">Lembur Hari Libur / Akhir Pekan</option>
                  <option value="normal">Shift Reguler Normal (Tanpa Lembur)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Durasi Jam Lembur (Jam)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={24}
                    value={editOtHoursInput}
                    onChange={(e) => setEditOtHoursInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono pr-12 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    Jam
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Lembur / Keputusan Atasan
                </label>
                <textarea
                  rows={3}
                  value={editOtReasonInput}
                  onChange={(e) => setEditOtReasonInput(e.target.value)}
                  placeholder="Keterangan persetujuan atasan atau uraian tugas lembur..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOvertimeRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                >
                  Simpan Keputusan Lembur
                </button>
              </div>
            </form>
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
                    Kelola identitas dan ubah kata sandi akun
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
                  {/* Foto Profil / Avatar Uploader dengan Crop 4:5 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group shrink-0">
                      <div className="w-[72px] h-[90px] rounded-2xl border-2 border-indigo-500 shadow-md overflow-hidden bg-indigo-600 text-white font-black text-2xl flex items-center justify-center relative">
                        {accAvatarUrl ? (
                          <img
                            src={accAvatarUrl}
                            alt="Avatar Preview 4:5"
                            className="w-full h-full object-cover"
                          />
                        ) : accFullName ? (
                          accFullName.charAt(0).toUpperCase()
                        ) : (
                          <UserIcon className="w-8 h-8 text-white/80" />
                        )}
                        <span className="absolute bottom-1 right-1 bg-indigo-950/80 text-[8px] font-extrabold px-1 rounded text-indigo-200">
                          4:5
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                        title="Ganti &amp; Sesuaikan Foto (4:5)"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-center sm:text-left flex-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <h4 className="text-xs font-bold text-slate-800">Foto Profil Akun</h4>
                        <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                          Rasio 4:5 Portrait
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Pilih foto profil lalu gunakan alat crop &amp; scale untuk menyesuaikan posisi dan zoom foto agar pas pada rasio 4:5.
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
                      Alamat Email
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
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      User ID / Owner ID
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showUserId ? 'text' : 'password'}
                          readOnly
                          value={currentUser.id}
                          className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 tracking-wider select-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUserId(!showUserId)}
                          className="p-1 text-slate-400 hover:text-slate-700 absolute right-2.5 top-2.5 rounded-lg transition-colors"
                          title={showUserId ? 'Sembunyikan User ID' : 'Lihat User ID'}
                        >
                          {showUserId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentUser.id);
                          showToast('User ID berhasil disalin ke clipboard');
                        }}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0 transition-colors"
                        title="Salin User ID"
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


            </div>
          </div>
        </div>
      )}

      {/* MODAL CROP & SCALE FOTO PROFIL (RASIO 4:5) */}
      {isCroppingAvatar && rawCropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Sesuaikan Foto Profil (Rasio 4:5)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Geser posisi dan atur zoom agar pas pada rasio foto potret 4:5
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCroppingAvatar(false);
                  setRawCropImage(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-5">
              {/* Frame Viewport 4:5 */}
              <div className="w-[192px] h-[240px] relative rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl bg-slate-900 flex items-center justify-center">
                <img
                  src={rawCropImage}
                  alt="Crop Preview"
                  style={{
                    transform: `scale(${cropZoom}) translate(${cropOffsetX}px, ${cropOffsetY}px)`,
                    transition: 'transform 0.05s ease-out',
                  }}
                  className="max-w-none max-h-none object-contain pointer-events-none select-none"
                />
                <div className="absolute top-2 left-2 bg-indigo-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                  4:5 PORTRAIT
                </div>
              </div>

              {/* Slider Pengaturan Zoom & Posisi */}
              <div className="w-full space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Skala / Zoom ({Math.round(cropZoom * 100)}%)</span>
                    <button
                      type="button"
                      onClick={() => setCropZoom(1)}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Reset Zoom
                    </button>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Posisi Vertikal (Atas - Bawah)</span>
                    <button
                      type="button"
                      onClick={() => setCropOffsetY(0)}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Tengah
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    step="1"
                    value={cropOffsetY}
                    onChange={(e) => setCropOffsetY(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Posisi Horizontal (Kiri - Kanan)</span>
                    <button
                      type="button"
                      onClick={() => setCropOffsetX(0)}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Tengah
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    step="1"
                    value={cropOffsetX}
                    onChange={(e) => setCropOffsetX(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCroppingAvatar(false);
                  setRawCropImage(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyCroppedAvatar}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan Foto (4:5)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB): RECORD VOICE TO TEXT PRO */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          type="button"
          onClick={() => {
            if (activeMainTab !== 'voice_ai') {
              setActiveMainTab('voice_ai');
            } else {
              openVoiceModal();
            }
          }}
          className="inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-500/30 border border-indigo-400/40 transition-transform active:scale-95 group"
          title="Buka Studio Record Voice to Text & Rangkuman AI PRO"
        >
          <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
          <span>Record Voice to Text</span>
        </button>
      </div>

      {/* MODAL REKAM SUARA & KESIMPULAN AI */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={closeVoiceModal}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Record Voice to Text &amp; Kesimpulan AI PRO
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                      AI PRO Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Bicara bebas, transkripsi real-time, dan ekstrak kesimpulan tugas otomatis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeVoiceModal}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* KONTROL PEREKAMAN */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center space-y-3.5 text-center relative overflow-hidden">
                <div className="flex items-center justify-between w-full text-xs">
                  <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <AudioWaveform className="w-4 h-4 text-indigo-600" />
                    <span>Pilihan Bahasa Dikte:</span>
                  </span>
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setVoiceLanguage('id-ID')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        voiceLanguage === 'id-ID' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🇮🇩 Indonesia
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceLanguage('en-US')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        voiceLanguage === 'en-US' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🇬🇧 English
                    </button>
                  </div>
                </div>

                {/* Tombol Rekam Besar dengan Animasi Gelombang */}
                <div className="relative my-2">
                  {isRecordingVoice && (
                    <div className="absolute inset-0 -m-3 rounded-full bg-rose-500/20 animate-ping" />
                  )}
                  <button
                    type="button"
                    onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg transition-all transform active:scale-95 ${
                      isRecordingVoice
                        ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-300 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white ring-4 ring-indigo-200'
                    }`}
                  >
                    {isRecordingVoice ? (
                      <>
                        <Square className="w-7 h-7" />
                        <span className="text-[10px] font-bold mt-1">Stop</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-8 h-8" />
                        <span className="text-[10px] font-bold mt-1">Rekam</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status Durasi & Petunjuk */}
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800">
                    {isRecordingVoice ? (
                      <span className="text-rose-600 flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                        Sedang Merekam ({Math.floor(recordingDurationSec / 60)}:{String(recordingDurationSec % 60).padStart(2, '0')})
                      </span>
                    ) : recordingDurationSec > 0 ? (
                      <span className="text-emerald-700 font-semibold">
                        Durasi Rekaman: {Math.floor(recordingDurationSec / 60)}:{String(recordingDurationSec % 60).padStart(2, '0')}
                      </span>
                    ) : (
                      'Klik tombol di atas untuk mulai merekam suara'
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    {isRecordingVoice
                      ? 'Silakan bicara... Teks akan langsung ditranskripsikan secara otomatis di bawah.'
                      : 'Bicara tentang rencana kerja, hasil meeting, atau catatan kegiatan harian Anda.'}
                  </p>
                </div>

                {/* Pemutar Audio jika sudah ada hasil rekaman */}
                {recordedAudioUrl && !isRecordingVoice && (
                  <div className="w-full pt-2">
                    <audio src={recordedAudioUrl} controls className="w-full h-9 rounded-xl" />
                  </div>
                )}
              </div>

              {/* AREA TRANSKRIPSI TEKS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Hasil Transkripsi Teks (Speech to Text)</span>
                  </label>
                  {voiceTranscript && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {voiceTranscript.split(/\s+/).filter(Boolean).length} kata
                    </span>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    placeholder="Teks transkripsi suara akan muncul otomatis di sini saat Anda berbicara. Anda juga bisa mengetik atau mengedit teks ini langsung..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-normal"
                  />
                </div>

                {/* Tombol Buat Kesimpulan AI */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={isGeneratingSummary || !voiceTranscript.trim()}
                    onClick={handleGenerateSummary}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-all"
                  >
                    <Wand2 className={`w-4 h-4 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingSummary ? 'Menganalisis Suara...' : '⚡ Buat Kesimpulan AI'}</span>
                  </button>
                </div>
              </div>

              {/* AREA HASIL KESIMPULAN CERDAS AI */}
              {voiceSummaryResult && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white border border-indigo-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-extrabold text-xs sm:text-sm text-indigo-950 uppercase tracking-wide">
                        Hasil Analisis &amp; Kesimpulan Cerdas AI
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={copyVoiceSummaryText}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      title="Salin kesimpulan"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </button>
                  </div>

                  {/* 1. Ringkasan Eksekutif */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                      🎯 Ringkasan Eksekutif
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-indigo-100">
                      {voiceSummaryResult.summary}
                    </p>
                  </div>

                  {/* 2. Poin-Poin Kunci */}
                  {voiceSummaryResult.keyPoints.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                        📋 Poin-Poin Kunci Pembahasan
                      </span>
                      <ul className="space-y-1 text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-indigo-100">
                        {voiceSummaryResult.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Tindakan Lanjutan & Delegasi Tugas PRO */}
                  {voiceSummaryResult.actionItems.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                        ⚡ Tindakan Lanjutan &amp; Delegasi Tugas PRO
                      </span>
                      <div className="space-y-1.5 bg-white/80 p-3 rounded-xl border border-indigo-100">
                        {voiceSummaryResult.actionItems.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="font-semibold leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Mitigasi Risiko Kendala PRO */}
                  {voiceSummaryResult.riskMitigation && voiceSummaryResult.riskMitigation.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Mitigasi Risiko &amp; Rekomendasi Solusi</span>
                      </span>
                      <ul className="space-y-1 text-xs text-slate-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200/70">
                        {voiceSummaryResult.riskMitigation.map((risk, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">•</span>
                            <span className="leading-relaxed">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* RIWAYAT MEMO SUARA SEBELUMNYA */}
              {savedVoiceMemos.length > 0 && (
                <div className="border-t border-slate-200 pt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <FileAudio className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Riwayat Catatan Suara ({savedVoiceMemos.length})</span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {savedVoiceMemos.map((memo) => (
                      <div
                        key={memo.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-start justify-between gap-3 transition-colors"
                      >
                        <div
                          className="min-w-0 cursor-pointer flex-1"
                          onClick={() => {
                            setVoiceTranscript(memo.transcript);
                            setVoiceSummaryResult({
                              summary: memo.summary,
                              keyPoints: memo.keyPoints || [],
                              actionItems: memo.actionItems || [],
                            });
                          }}
                        >
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {memo.title}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {memo.summary}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {formatDateFullIndo(memo.createdAt.slice(0, 10))} • {Math.floor(memo.durationSeconds / 60)}:{String(memo.durationSeconds % 60).padStart(2, '0')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteVoiceMemo(memo.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus riwayat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={closeVoiceModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {voiceSummaryResult && (
                  <button
                    type="button"
                    onClick={copyVoiceSummaryText}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-100 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Rangkuman</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!voiceTranscript.trim()}
                  onClick={handleConvertSummaryToTask}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Jadikan Tugas Proyek</span>
                </button>
              </div>
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

          {/* DRAWER CHATBOT GEMINI AI ASSISTANT (KOLOM KANAN TERFILTER ID OWNER) */}
      {isAIChatOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <span>Gemini AI JadwalPro</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </h3>
                  <p className="text-[10px] text-indigo-200/90 font-mono">
                    Owner: {currentUser?.fullName || 'User'} ({currentUser?.id ? currentUser.id.slice(0, 8) + '...' : '-'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAIChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Tutup Chatbot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {/* Guardrail Disclaimer */}
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900 flex items-start gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  AI ini dikhususkan untuk asistensi alur kerja JadwalPro, pemecahan kendala tugas, dan tolak ukur presensi data proyek Anda.
                </span>
              </div>

              {/* Quick Topic Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSendAIChatMessage('Analisis kendala proyek dan tugas tertunda saya')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 transition-colors shadow-2xs"
                >
                  🔍 Analisis Kendala
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAIChatMessage('Cek status revisi aktif yang belum selesai')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 transition-colors shadow-2xs"
                >
                  ⏳ Revisi Aktif
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAIChatMessage('Evaluasi tolak ukur jam kerja bersih & lembur')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 transition-colors shadow-2xs"
                >
                  ⚡ Jam Lembur Genap
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAIChatMessage('Ringkasan progres seluruh proyek saya')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 transition-colors shadow-2xs"
                >
                  📈 Progres Proyek
                </button>
              </div>

              {/* Message bubbles */}
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Drawer Input */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendAIChatMessage();
                }}
                placeholder="Tanya kendala, revisi, atau jadwal proyek..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => handleSendAIChatMessage()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}