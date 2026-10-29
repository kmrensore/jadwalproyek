import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Project, ScheduleEntry, UserProfile } from './types';

// ============================================================================
// MODUL DATA LAYER & AUTH (src/db.ts — Terintegrasi Supabase + localStorage)
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_KEYS = {
  PROJECTS: 'jadwalpro_projects_v1',
  ENTRIES: 'jadwalpro_entries_v1',
  INITIALIZED: 'jadwalpro_init_v1',
  SESSION: 'jadwalpro_session_v1',
};

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Redesign Website Utama',
    color: '#6366f1',
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'proj-2',
    name: 'Integrasi Mobile App v2',
    color: '#10b981',
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
    createdAt: '2026-10-01T08:05:00.000Z',
  },
  {
    id: 'proj-3',
    name: 'Kampanye Q4 & Marketing',
    color: '#f59e0b',
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
    ownerId: 'owner-demo-1',
    ownerName: 'Tim Utama',
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
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  },
};

export const db = {
  // --- 1. FUNGSI AUTHENTICATION (SIGN UP, SIGN IN, SESSION, SIGN OUT) ---
  getSavedSession(): UserProfile | null {
    const raw = safeStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const meta = data.user.user_metadata || {};
        const profile: UserProfile = {
          id: data.user.id,
          fullName: meta.full_name || data.user.email?.split('@')[0] || 'User',
          phone: meta.phone || '-',
          email: data.user.email || '',
        };
        safeStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(profile));
        return profile;
      }
    }
    return this.getSavedSession();
  },

  async signUp(payload: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<{ user?: UserProfile; error?: string }> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.fullName.trim();
    const cleanPhone = payload.phone.trim();

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: payload.password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
          },
        },
      });

      if (error || !data.user) {
        return { error: error?.message || 'Gagal mendaftar ke Supabase Auth' };
      }

      const profile: UserProfile = {
        id: data.user.id,
        fullName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
      };

      // Simpan juga ke tabel public.profiles di Supabase
      await supabase.from('profiles').upsert({
        id: profile.id,
        full_name: profile.fullName,
        phone: profile.phone,
        email: profile.email,
      });

      safeStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(profile));
      return { user: profile };
    }

    // Fallback jika dijalankan lokal tanpa Supabase
    const localProfile: UserProfile = {
      id: 'owner-' + Date.now().toString(36),
      fullName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
    };
    safeStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(localProfile));
    return { user: localProfile };
  },

  async signIn(
    email: string,
    password: string
  ): Promise<{ user?: UserProfile; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.user) {
        return { error: error?.message || 'Email atau password tidak sesuai' };
      }

      const meta = data.user.user_metadata || {};
      const profile: UserProfile = {
        id: data.user.id,
        fullName: meta.full_name || data.user.email?.split('@')[0] || 'User',
        phone: meta.phone || '-',
        email: data.user.email || cleanEmail,
      };

      safeStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(profile));
      return { user: profile };
    }

    // Fallback lokal
    const fallbackProfile: UserProfile = {
      id: 'owner-local',
      fullName: cleanEmail.split('@')[0] || 'User',
      phone: '-',
      email: cleanEmail,
    };
    safeStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(fallbackProfile));
    return { user: fallbackProfile };
  },

  async signOut(): Promise<void> {
    safeStorage.removeItem(STORAGE_KEYS.SESSION);
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  // --- 2. FUNGSI INISIALISASI & SINKRONISASI SUPABASE ---
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

  async fetchFromSupabase(): Promise<{ projects: Project[]; entries: ScheduleEntry[] } | null> {
    if (!supabase) return null;
    try {
      const [{ data: projData, error: projErr }, { data: entData, error: entErr }] =
        await Promise.all([
          supabase
            .from('projects')
            .select('id, name, color, ownerId:owner_id, ownerName:owner_name, createdAt:created_at')
            .order('created_at', { ascending: true }),
          supabase
            .from('schedule_entries')
            .select(
              'id, date:entry_date, title, projectId:project_id, status, notes, ownerId:owner_id, ownerName:owner_name, ownerPhone:owner_phone, ownerEmail:owner_email, createdAt:created_at, updatedAt:updated_at'
            )
            .order('entry_date', { ascending: true })
            .order('created_at', { ascending: true }),
        ]);

      if (projErr || entErr) {
        console.error('Supabase fetch error:', projErr || entErr);
        return null;
      }

      const projects = (projData as Project[]) || [];
      const entries = (entData as ScheduleEntry[]) || [];
      safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      return { projects, entries };
    } catch (err) {
      console.error('Supabase connection error:', err);
      return null;
    }
  },

  resetToSeed(): { projects: Project[]; entries: ScheduleEntry[] } {
    safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
    safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(SEED_ENTRIES));
    safeStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    return { projects: [...SEED_PROJECTS], entries: [...SEED_ENTRIES] };
  },

  // --- 3. FUNGSI CRUD PROYEK (OTOMATIS MENYIMPAN OWNER_ID) ---
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

  createProject(name: string, color: string, owner?: UserProfile | null): Project[] {
    const activeOwner = owner || this.getSavedSession();
    const current = this.getProjects();
    const newProj: Project = {
      id: 'proj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      color,
      ownerId: activeOwner?.id || 'owner-default',
      ownerName: activeOwner?.fullName || 'User',
      createdAt: new Date().toISOString(),
    };
    const updated = [...current, newProj];
    this.saveProjects(updated);

    if (supabase) {
      supabase
        .from('projects')
        .insert({
          id: newProj.id,
          name: newProj.name,
          color: newProj.color,
          owner_id: newProj.ownerId,
          owner_name: newProj.ownerName,
        })
        .then(({ error }) => {
          if (error) console.error('Supabase insert project error:', error);
        });
    }

    return updated;
  },

  updateProject(id: string, name: string, color: string): Project[] {
    const current = this.getProjects();
    const updated = current.map((p) =>
      p.id === id ? { ...p, name: name.trim(), color } : p
    );
    this.saveProjects(updated);

    if (supabase) {
      supabase
        .from('projects')
        .update({ name: name.trim(), color })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase update project error:', error);
        });
    }

    return updated;
  },

  deleteProject(id: string): { projects: Project[]; entries: ScheduleEntry[] } {
    const projects = this.getProjects().filter((p) => p.id !== id);
    const entries = this.getEntries().map((e) =>
      e.projectId === id ? { ...e, projectId: null, updatedAt: new Date().toISOString() } : e
    );
    this.saveProjects(projects);
    this.saveEntries(entries);

    if (supabase) {
      supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase delete project error:', error);
        });
    }

    return { projects, entries };
  },

  // --- 4. FUNGSI CRUD CATATAN JADWAL (OTOMATIS MENYIMPAN OWNER_ID) ---
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

  createEntry(
    payload: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>,
    owner?: UserProfile | null
  ): ScheduleEntry[] {
    const activeOwner = owner || this.getSavedSession();
    const current = this.getEntries();
    const now = new Date().toISOString();
    const newEntry: ScheduleEntry = {
      ...payload,
      id: 'ent-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      ownerId: payload.ownerId || activeOwner?.id || 'owner-default',
      ownerName: payload.ownerName || activeOwner?.fullName || 'User',
      ownerPhone: payload.ownerPhone || activeOwner?.phone || '',
      ownerEmail: payload.ownerEmail || activeOwner?.email || '',
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...current, newEntry];
    this.saveEntries(updated);

    if (supabase) {
      supabase
        .from('schedule_entries')
        .insert({
          id: newEntry.id,
          entry_date: newEntry.date,
          title: newEntry.title,
          project_id: newEntry.projectId,
          status: newEntry.status,
          notes: newEntry.notes,
          owner_id: newEntry.ownerId,
          owner_name: newEntry.ownerName,
          owner_phone: newEntry.ownerPhone,
          owner_email: newEntry.ownerEmail,
        })
        .then(({ error }) => {
          if (error) console.error('Supabase insert entry error:', error);
        });
    }

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

    if (supabase) {
      const dbUpdate: Record<string, unknown> = {};
      if (payload.date !== undefined) dbUpdate.entry_date = payload.date;
      if (payload.title !== undefined) dbUpdate.title = payload.title;
      if (payload.projectId !== undefined) dbUpdate.project_id = payload.projectId;
      if (payload.status !== undefined) dbUpdate.status = payload.status;
      if (payload.notes !== undefined) dbUpdate.notes = payload.notes;

      supabase
        .from('schedule_entries')
        .update(dbUpdate)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase update entry error:', error);
        });
    }

    return updated;
  },

  deleteEntry(id: string): ScheduleEntry[] {
    const updated = this.getEntries().filter((e) => e.id !== id);
    this.saveEntries(updated);

    if (supabase) {
      supabase
        .from('schedule_entries')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase delete entry error:', error);
        });
    }

    return updated;
  },
};