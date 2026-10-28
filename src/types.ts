export type EntryStatus = 'belum_mulai' | 'berjalan' | 'selesai';

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface ScheduleEntry {
  id: string;
  date: string; // Format YYYY-MM-DD
  title: string;
  projectId: string | null; // null = "Tanpa proyek"
  status: EntryStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
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
