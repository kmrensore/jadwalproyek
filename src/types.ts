export type EntryStatus = 'belum_mulai' | 'berjalan' | 'selesai';
export type AttendanceType = 'hadir' | 'izin' | 'cuti' | 'sakit';

export interface UserProfile {
  id: string; // owner_id dari Supabase Auth
  fullName: string;
  phone: string;
  email: string;
  createdAt?: string;
}

// Cabang Program di dalam sebuah Proyek (contoh: Proyek 'abc' -> Program 'abc 1', 'abc 2')
export interface ProjectProgram {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  programs?: ProjectProgram[]; // Daftar cabang program yang bisa ditambah/dikurangi
  ownerId?: string;
  ownerName?: string;
  createdAt: string;
}

export interface ScheduleEntry {
  id: string;
  date: string; // Format YYYY-MM-DD
  title: string;
  projectId: string | null; // null = "Tanpa proyek"
  programId?: string | null; // null = "Tanpa cabang program spesifik"
  status: EntryStatus;
  notes: string;
  ownerId?: string; // Penanda pekerjaan milik siapa
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  ownerId: string; // ID pemilik absensi
  ownerName: string;
  date: string; // Format YYYY-MM-DD
  type: AttendanceType;
  checkInTime: string | null; // Format HH:mm (contoh: "08:15")
  checkOutTime: string | null; // Format HH:mm (contoh: "17:20")
  workDurationHours: number; // Durasi jam kerja bersih dalam desimal (contoh: 7.5)
  isLate?: boolean; // Menandai apakah clock-in melewati jam baku + toleransi
  notes: string; // Keterangan atau alasan izin/cuti/sakit
  createdAt?: string;
  updatedAt?: string;
}

// Tolak Ukur & Aturan Baku Kerja (Work Policy & Attendance Benchmarks)
export interface WorkPolicy {
  workDaysPerWeek: number; // Jumlah hari kerja per minggu (contoh: 5 atau 6)
  standardCheckInTime: string; // Jam masuk baku (contoh: "08:30")
  standardCheckOutTime: string; // Jam pulang baku (contoh: "17:00")
  breakDurationHours: number; // Durasi istirahat harian dalam jam (contoh: 1.0)
  annualLeaveQuota: number; // Jatah cuti tahunan (contoh: 12 hari/tahun)
  lateToleranceMinutes: number; // Toleransi keterlambatan menit (contoh: 15 menit)
  targetDailyWorkHours: number; // Target jam kerja bersih harian (contoh: 7.5 jam)
}

export const DEFAULT_WORK_POLICY: WorkPolicy = {
  workDaysPerWeek: 5,
  standardCheckInTime: '08:30',
  standardCheckOutTime: '17:00',
  breakDurationHours: 1.0,
  annualLeaveQuota: 12,
  lateToleranceMinutes: 15,
  targetDailyWorkHours: 7.5,
};

// Rekaman Evaluasi Performa Kerja Berbantu AI
export interface AIPerformanceRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  imageUrl?: string; // Base64 data URL gambar bukti performa
  imageName?: string;
  createdAt: string;
  score: number; // 0 - 100
  summary: string; // Kesimpulan analisis performa dari gambar & data
  strengths: string[]; // Kekuatan / pencapaian
  improvements: string[]; // Area yang perlu ditingkatkan
  recommendations: string[]; // Menu saran terpadu dari seluruh performa dan program
  analyzedDateRange?: string; // Rentang tanggal yang dievaluasi
}

export const PROJECT_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Orange', value: '#f97316' },
];