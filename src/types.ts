export type EntryStatus = 'belum_mulai' | 'berjalan' | 'selesai';
export type AttendanceType = 'hadir' | 'izin' | 'cuti' | 'sakit';

export interface UserProfile {
  id: string; // owner_id dari Supabase Auth
  fullName: string;
  phone: string;
  email: string;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  ownerId?: string;
  ownerName?: string;
  createdAt: string;
}

export interface ScheduleEntry {
  id: string;
  date: string; // Format YYYY-MM-DD
  title: string;
  projectId: string | null; // null = "Tanpa proyek"
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
  workDurationHours: number; // Durasi jam kerja dalam desimal (contoh: 8.5)
  notes: string; // Keterangan atau alasan izin/cuti/sakit
  createdAt?: string;
  updatedAt?: string;
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