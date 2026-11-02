import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { EntryStatus, Project, ScheduleEntry, UserProfile, AttendanceRecord, AttendanceType } from './types';

// ============================================================================
// MODUL DATA LAYER (src/db.ts — Jadwal, Proyek, Absensi, & Supabase)
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_KEYS = {
  PROJECTS: 'jadwalpro_projects_v3',
  ENTRIES: 'jadwalpro_entries_v3',
  ATTENDANCE: 'jadwalpro_attendance_v3',
  INITIALIZED: 'jadwalpro_init_v3',
  SESSION: 'jadwalpro_session_v3',
};

// Data seed kosong murni agar akun baru tidak tercemar data demo
export const SEED_PROJECTS: Project[] = [];
export const SEED_ENTRIES: ScheduleEntry[] = [];
export const SEED_ATTENDANCE: AttendanceRecord[] = [];

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
      // ignore
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const db = {
  // --- 1. SESI LOGIN & AUTHENTICATION (AUTO-LOGIN PERMANEN) ---
  saveSession(profile: UserProfile): void {
    safeStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(profile));
    safeStorage.setItem('jadwalpro_current_user', JSON.stringify(profile));
  },

  getSavedSession(): UserProfile | null {
    const raw = safeStorage.getItem(STORAGE_KEYS.SESSION) || safeStorage.getItem('jadwalpro_current_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const localSession = this.getSavedSession();

    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const profile: UserProfile = {
            id: session.user.id,
            fullName: meta.full_name || session.user.email?.split('@')[0] || 'User',
            phone: meta.phone || '-',
            email: session.user.email || '',
          };
          this.saveSession(profile);
          return profile;
        }
      } catch (e) {
        console.warn('Supabase getSession failed, using local session', e);
      }
    }
    return localSession;
  },

  onAuthStateChange(callback: (user: UserProfile | null) => void): (() => void) | undefined {
    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const profile: UserProfile = {
          id: session.user.id,
          fullName: meta.full_name || session.user.email?.split('@')[0] || 'User',
          phone: meta.phone || '-',
          email: session.user.email || '',
        };
        this.saveSession(profile);
        callback(profile);
      } else if (event === 'SIGNED_OUT') {
        safeStorage.removeItem(STORAGE_KEYS.SESSION);
        safeStorage.removeItem('jadwalpro_current_user');
        callback(null);
      }
    });
    return () => subscription.unsubscribe();
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
          data: { full_name: cleanName, phone: cleanPhone },
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

      await supabase.from('profiles').upsert(
        {
          owner_id: profile.id,
          full_name: profile.fullName,
          phone: profile.phone,
          email: profile.email,
        },
        { onConflict: 'owner_id' }
      );

      this.saveSession(profile);
      return { user: profile };
    }

    const localProfile: UserProfile = {
      id: 'owner-' + Date.now().toString(36),
      fullName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
    };
    this.saveSession(localProfile);
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

      await supabase.from('profiles').upsert(
        {
          owner_id: profile.id,
          full_name: profile.fullName,
          phone: profile.phone,
          email: profile.email,
        },
        { onConflict: 'owner_id' }
      );

      this.saveSession(profile);
      return { user: profile };
    }

    const fallbackProfile: UserProfile = {
      id: 'owner-local',
      fullName: cleanEmail.split('@')[0] || 'User',
      phone: '-',
      email: cleanEmail,
    };
    this.saveSession(fallbackProfile);
    return { user: fallbackProfile };
  },

  async signOut(): Promise<void> {
    safeStorage.removeItem(STORAGE_KEYS.SESSION);
    safeStorage.removeItem('jadwalpro_current_user');
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
  },

  // --- 2. INISIALISASI & SINKRONISASI DATA ---
  init(): { projects: Project[]; entries: ScheduleEntry[]; attendance: AttendanceRecord[] } {
    const session = this.getSavedSession();
    if (session && session.id !== 'owner-demo-1') {
      const p = this.getProjects().filter((item) => item.ownerId === session.id);
      const e = this.getEntries().filter((item) => item.ownerId === session.id);
      const a = this.getAttendance().filter((item) => item.ownerId === session.id);
      return { projects: p, entries: e, attendance: a };
    }

    return {
      projects: this.getProjects(),
      entries: this.getEntries(),
      attendance: this.getAttendance(),
    };
  },

  async fetchFromSupabase(userId?: string): Promise<{
    projects: Project[];
    entries: ScheduleEntry[];
    attendance: AttendanceRecord[];
  } | null> {
    if (!supabase) return null;
    try {
      const session = this.getSavedSession();
      const currentUserId = userId || session?.id;

      let projQuery = supabase
        .from('projects')
        .select('id, name, color, ownerId:owner_id, ownerName:owner_name, createdAt:created_at')
        .order('created_at', { ascending: true });

      let entQuery = supabase
        .from('schedule_entries')
        .select(
          'id, date:entry_date, title, projectId:project_id, status, notes, ownerId:owner_id, ownerName:owner_name, ownerPhone:owner_phone, ownerEmail:owner_email, createdAt:created_at, updatedAt:updated_at'
        )
        .order('entry_date', { ascending: true })
        .order('created_at', { ascending: true });

      let attQuery = supabase
        .from('attendance')
        .select(
          'id, ownerId:owner_id, ownerName:owner_name, date:entry_date, type, checkInTime:check_in_time, checkOutTime:check_out_time, workDurationHours:work_duration_hours, notes, createdAt:created_at, updatedAt:updated_at'
        )
        .order('entry_date', { ascending: false });

      if (currentUserId && currentUserId !== 'owner-demo-1') {
        projQuery = projQuery.eq('owner_id', currentUserId);
        entQuery = entQuery.eq('owner_id', currentUserId);
        attQuery = attQuery.eq('owner_id', currentUserId);
      }

      const [
        { data: projData, error: projErr },
        { data: entData, error: entErr },
        { data: attData, error: attErr },
      ] = await Promise.all([projQuery, entQuery, attQuery]);

      if (projErr || entErr) {
        console.error('Supabase fetch error:', projErr || entErr || attErr);
        return null;
      }

      const projects = (projData as Project[]) || [];
      const entries = (entData as ScheduleEntry[]) || [];
      const attendance = (attData as AttendanceRecord[]) || [];

      safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      safeStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));

      return { projects, entries, attendance };
    } catch (err) {
      console.error('Supabase connection error:', err);
      return null;
    }
  },

  // --- 3. OPERASI PROYEK ---
  getProjects(): Project[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveProjects(projects: Project[]): void {
    safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  createProject(name: string, color: string, owner?: UserProfile | null): Project[] {
    const activeOwner = owner || this.getSavedSession();
    const newProj: Project = {
      id: 'proj-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      color,
      ownerId: activeOwner?.id || 'owner-demo-1',
      ownerName: activeOwner?.fullName || 'User',
      createdAt: new Date().toISOString(),
    };
    const updated = [...this.getProjects(), newProj];
    this.saveProjects(updated);

    if (supabase) {
      supabase.from('projects').insert({
        id: newProj.id,
        name: newProj.name,
        color: newProj.color,
        owner_id: newProj.ownerId,
        owner_name: newProj.ownerName,
        created_at: newProj.createdAt,
      }).then(({ error }) => {
        if (error) console.error('Supabase insert project error:', error);
      });
    }

    return updated;
  },

  updateProject(id: string, name: string, color: string): Project[] {
    const updated = this.getProjects().map((p) =>
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
    const updatedProjects = this.getProjects().filter((p) => p.id !== id);
    const updatedEntries = this.getEntries().map((e) =>
      e.projectId === id ? { ...e, projectId: null, updatedAt: new Date().toISOString() } : e
    );

    this.saveProjects(updatedProjects);
    this.saveEntries(updatedEntries);

    if (supabase) {
      supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase delete project error:', error);
        });
    }

    return { projects: updatedProjects, entries: updatedEntries };
  },

  // --- 4. OPERASI CATATAN JADWAL ---
  getEntries(): ScheduleEntry[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveEntries(entries: ScheduleEntry[]): void {
    safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  },

  createEntry(
    payload: {
      date: string;
      title: string;
      projectId: string | null;
      status: EntryStatus;
      notes: string;
    },
    owner?: UserProfile | null
  ): ScheduleEntry[] {
    const activeOwner = owner || this.getSavedSession();
    const now = new Date().toISOString();
    const newEntry: ScheduleEntry = {
      id: 'ent-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      date: payload.date,
      title: payload.title.trim(),
      projectId: payload.projectId,
      status: payload.status,
      notes: payload.notes.trim(),
      ownerId: activeOwner?.id || 'owner-demo-1',
      ownerName: activeOwner?.fullName || 'User',
      ownerPhone: activeOwner?.phone || '',
      ownerEmail: activeOwner?.email || '',
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...this.getEntries(), newEntry];
    this.saveEntries(updated);

    if (supabase) {
      supabase.from('schedule_entries').insert({
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
        created_at: newEntry.createdAt,
        updated_at: newEntry.updatedAt,
      }).then(({ error }) => {
        if (error) console.error('Supabase insert entry error:', error);
      });
    }

    return updated;
  },

  updateEntry(
    id: string,
    payload: Partial<
      Omit<ScheduleEntry, 'id' | 'createdAt' | 'ownerId' | 'ownerName' | 'ownerPhone' | 'ownerEmail'>
    >
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

  // --- 5. OPERASI KEHADIRAN (CLOCK IN & CLOCK OUT TERSIMPAN KE CLOUD) ---
  getAttendance(): AttendanceRecord[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveAttendance(records: AttendanceRecord[]): void {
    safeStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  async recordAttendance(
    payload: {
      date: string;
      type: AttendanceType;
      checkInTime?: string | null;
      checkOutTime?: string | null;
      notes?: string;
    },
    owner?: UserProfile | null
  ): Promise<AttendanceRecord[]> {
    const activeOwner = owner || this.getSavedSession();
    const ownerId = activeOwner?.id || 'owner-demo-1';
    const ownerName = activeOwner?.fullName || 'User';

    const records = this.getAttendance();
    const existingIndex = records.findIndex(
      (r) => r.ownerId === ownerId && r.date === payload.date
    );

    let duration = 0;
    const inTime = payload.checkInTime !== undefined ? payload.checkInTime : (existingIndex >= 0 ? records[existingIndex].checkInTime : null);
    const outTime = payload.checkOutTime !== undefined ? payload.checkOutTime : (existingIndex >= 0 ? records[existingIndex].checkOutTime : null);

    if (inTime && outTime) {
      const [hIn, mIn] = inTime.split(':').map(Number);
      const [hOut, mOut] = outTime.split(':').map(Number);
      const diffMinutes = (hOut * 60 + mOut) - (hIn * 60 + mIn);
      duration = Math.max(0, Math.round((diffMinutes / 60) * 10) / 10);
    }

    const now = new Date().toISOString();
    let updatedItem: AttendanceRecord;
    let updatedList: AttendanceRecord[];

    if (existingIndex >= 0) {
      updatedItem = {
        ...records[existingIndex],
        type: payload.type,
        checkInTime: inTime,
        checkOutTime: outTime,
        workDurationHours: payload.type === 'hadir' ? duration : 0,
        notes: payload.notes !== undefined ? payload.notes : records[existingIndex].notes,
        updatedAt: now,
      };
      updatedList = [...records];
      updatedList[existingIndex] = updatedItem;
    } else {
      updatedItem = {
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        ownerId,
        ownerName,
        date: payload.date,
        type: payload.type,
        checkInTime: inTime,
        checkOutTime: outTime,
        workDurationHours: payload.type === 'hadir' ? duration : 0,
        notes: payload.notes || (payload.type === 'hadir' ? 'Check-in hadir harian.' : ''),
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [...records, updatedItem];
    }

    this.saveAttendance(updatedList);

    // Simpan ke Supabase: saat Clock In (masuk) maupun Clock Out (keluar)
    if (supabase) {
      const dbPayload = {
        id: updatedItem.id,
        owner_id: updatedItem.ownerId,
        owner_name: updatedItem.ownerName,
        entry_date: updatedItem.date,
        type: updatedItem.type,
        check_in_time: updatedItem.checkInTime,
        check_out_time: updatedItem.checkOutTime,
        work_duration_hours: updatedItem.workDurationHours,
        notes: updatedItem.notes,
        updated_at: now,
      };

      try {
        const { error: upsertErr } = await supabase
          .from('attendance')
          .upsert(dbPayload, { onConflict: 'owner_id,entry_date' });

        if (upsertErr) {
          console.warn('Upsert on conflict (owner_id, entry_date) failed, retrying on conflict id:', upsertErr.message);
          await supabase.from('attendance').upsert(dbPayload, { onConflict: 'id' });
        }
      } catch (err) {
        console.error('Supabase attendance save error:', err);
      }
    }

    return updatedList;
  },

  deleteAttendance(id: string): AttendanceRecord[] {
    const updated = this.getAttendance().filter((a) => a.id !== id);
    this.saveAttendance(updated);

    if (supabase) {
      supabase.from('attendance').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete attendance error:', error);
      });
    }

    return updated;
  },
};