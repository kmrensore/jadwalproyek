import type { Project, ScheduleEntry } from './types';

// ============================================================================
// MODUL DATA LAYER (src/db.ts — Versi Default localStorage)
// - Langsung berjalan tanpa perlu database saat pertama kali `npm run dev`.
// - Saat siap migrasi ke Supabase, cukup salin isi `src/db.supabase.ts` ke file ini.
// ============================================================================

const STORAGE_KEYS = {
  PROJECTS: 'jadwalpro_projects_v1',
  ENTRIES: 'jadwalpro_entries_v1',
  INITIALIZED: 'jadwalpro_init_v1',
};

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Redesign Website Utama',
    color: '#6366f1',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'proj-2',
    name: 'Integrasi Mobile App v2',
    color: '#10b981',
    createdAt: '2026-10-01T08:05:00.000Z',
  },
  {
    id: 'proj-3',
    name: 'Kampanye Q4 & Marketing',
    color: '#f59e0b',
    createdAt: '2026-10-01T08:10:00.000Z',
  },
];

export const SEED_ENTRIES: ScheduleEntry[] = [
  {
    id: 'ent-1',
    date: '2026-10-05',
    title: 'Kickoff & Audit UI/UX Lama',
    projectId: 'proj-1',
    status: 'selesai',
    notes: 'Review heatmap pengunjung dan menyusun daftar halaman prioritas yang perlu di-redesign.',
    createdAt: '2026-10-02T09:00:00.000Z',
    updatedAt: '2026-10-05T16:00:00.000Z',
  },
  {
    id: 'ent-2',
    date: '2026-10-09',
    title: 'Setup Skema Database & Auth Supabase',
    projectId: 'proj-2',
    status: 'selesai',
    notes: 'Membuat tabel projects dan schedule_entries beserta Row Level Security (RLS) per user.',
    createdAt: '2026-10-04T10:00:00.000Z',
    updatedAt: '2026-10-09T17:30:00.000Z',
  },
  {
    id: 'ent-3',
    date: '2026-10-12',
    title: 'Riset Keyword & Kalender Konten Oktober',
    projectId: 'proj-3',
    status: 'selesai',
    notes: 'Target 15 artikel SEO dan 8 konten video pendek untuk pengenalan fitur baru.',
    createdAt: '2026-10-06T11:00:00.000Z',
    updatedAt: '2026-10-12T15:00:00.000Z',
  },
  {
    id: 'ent-4',
    date: '2026-10-15',
    title: 'Finalisasi Design System & Komponen Figma',
    projectId: 'proj-1',
    status: 'selesai',
    notes: 'Token warna, tipografi Inter, dan komponen kalender responsif sudah disetujui tim.',
    createdAt: '2026-10-10T09:00:00.000Z',
    updatedAt: '2026-10-15T18:00:00.000Z',
  },
  {
    id: 'ent-5',
    date: '2026-10-20',
    title: 'Integrasi Push Notification FCM',
    projectId: 'proj-2',
    status: 'berjalan',
    notes: 'Masih menunggu sertifikat APNs dari akun Apple Developer untuk pengujian di iOS.',
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-20T14:00:00.000Z',
  },
  {
    id: 'ent-6',
    date: '2026-10-24',
    title: 'Produksi Video Teaser Produk Q4',
    projectId: 'proj-3',
    status: 'belum_mulai',
    notes: 'Revisi storyboard dari tim kreatif belum rampung, perlu follow up hari ini.',
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-24T12:00:00.000Z',
  },
  {
    id: 'ent-7',
    date: '2026-10-28',
    title: 'Slicing Halaman Beranda & Kalender React',
    projectId: 'proj-1',
    status: 'berjalan',
    notes: 'Implementasi grid 7 kolom, drawer detail harian, dan filter proyek dinamis.',
    createdAt: '2026-10-25T09:00:00.000Z',
    updatedAt: '2026-10-28T09:30:00.000Z',
  },
  {
    id: 'ent-8',
    date: '2026-10-28',
    title: 'Uji Coba Endpoint Sinkronisasi Offline',
    projectId: 'proj-2',
    status: 'berjalan',
    notes: 'Memastikan antrean mutasi lokal tersimpan aman sebelum dikirim ke cloud.',
    createdAt: '2026-10-26T13:00:00.000Z',
    updatedAt: '2026-10-28T10:00:00.000Z',
  },
  {
    id: 'ent-9',
    date: '2026-10-28',
    title: 'Review Copywriting Landing Page Promo',
    projectId: 'proj-3',
    status: 'selesai',
    notes: 'Headline dan CTA sudah disepakati bersama tim produk dan siap tayang.',
    createdAt: '2026-10-26T15:00:00.000Z',
    updatedAt: '2026-10-28T11:00:00.000Z',
  },
  {
    id: 'ent-10',
    date: '2026-10-28',
    title: 'Evaluasi Server & Backup Mingguan',
    projectId: null,
    status: 'belum_mulai',
    notes: 'Cek penggunaan storage database dan rotasi environment variable di dashboard.',
    createdAt: '2026-10-27T08:00:00.000Z',
    updatedAt: '2026-10-27T08:00:00.000Z',
  },
  {
    id: 'ent-11',
    date: '2026-10-30',
    title: 'QA Testing Lintas Perangkat (Mobile & Desktop)',
    projectId: 'proj-1',
    status: 'belum_mulai',
    notes: 'Uji tampilan bottom sheet di layar iPhone SE dan Android serta drawer di desktop.',
    createdAt: '2026-10-27T09:00:00.000Z',
    updatedAt: '2026-10-27T09:00:00.000Z',
  },
  {
    id: 'ent-12',
    date: '2026-10-31',
    title: 'Deploy Production ke Vercel & Rilis Publik',
    projectId: 'proj-2',
    status: 'belum_mulai',
    notes: 'Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di Vercel, lalu jalankan smoke test.',
    createdAt: '2026-10-27T10:00:00.000Z',
    updatedAt: '2026-10-27T10:00:00.000Z',
  },
];

const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore storage errors
    }
  },
};

export const db = {
  init(): { projects: Project[]; entries: ScheduleEntry[] } {
    const initialized = safeStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
      safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(SEED_ENTRIES));
      safeStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return { projects: SEED_PROJECTS, entries: SEED_ENTRIES };
    }
    return {
      projects: this.getProjects(),
      entries: this.getEntries(),
    };
  },

  resetToSeed(): { projects: Project[]; entries: ScheduleEntry[] } {
    safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
    safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(SEED_ENTRIES));
    safeStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    return { projects: [...SEED_PROJECTS], entries: [...SEED_ENTRIES] };
  },

  getProjects(): Project[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) return [...SEED_PROJECTS];
    try {
      return JSON.parse(raw);
    } catch {
      return [...SEED_PROJECTS];
    }
  },

  saveProjects(projects: Project[]): void {
    safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  createProject(name: string, color: string): Project[] {
    const current = this.getProjects();
    const newProj: Project = {
      id: 'proj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      color,
      createdAt: new Date().toISOString(),
    };
    const updated = [...current, newProj];
    this.saveProjects(updated);
    return updated;
  },

  updateProject(id: string, name: string, color: string): Project[] {
    const current = this.getProjects();
    const updated = current.map((p) =>
      p.id === id ? { ...p, name: name.trim(), color } : p
    );
    this.saveProjects(updated);
    return updated;
  },

  deleteProject(id: string): { projects: Project[]; entries: ScheduleEntry[] } {
    const projects = this.getProjects().filter((p) => p.id !== id);
    const entries = this.getEntries().map((e) =>
      e.projectId === id ? { ...e, projectId: null, updatedAt: new Date().toISOString() } : e
    );
    this.saveProjects(projects);
    this.saveEntries(entries);
    return { projects, entries };
  },

  getEntries(): ScheduleEntry[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (!raw) return [...SEED_ENTRIES];
    try {
      return JSON.parse(raw);
    } catch {
      return [...SEED_ENTRIES];
    }
  },

  saveEntries(entries: ScheduleEntry[]): void {
    safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  },

  createEntry(payload: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>): ScheduleEntry[] {
    const current = this.getEntries();
    const now = new Date().toISOString();
    const newEntry: ScheduleEntry = {
      ...payload,
      id: 'ent-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...current, newEntry];
    this.saveEntries(updated);
    return updated;
  },

  updateEntry(
    id: string,
    payload: Partial<Omit<ScheduleEntry, 'id' | 'createdAt'>>
  ): ScheduleEntry[] {
    const current = this.getEntries();
    const updated = current.map((e) =>
      e.id === id ? { ...e, ...payload, updatedAt: new Date().toISOString() } : e
    );
    this.saveEntries(updated);
    return updated;
  },

  deleteEntry(id: string): ScheduleEntry[] {
    const updated = this.getEntries().filter((e) => e.id !== id);
    this.saveEntries(updated);
    return updated;
  },
};
