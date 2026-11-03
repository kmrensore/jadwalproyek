import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_WORK_POLICY } from './types';
import type {
  EntryStatus,
  Project,
  ProjectProgram,
  ScheduleEntry,
  UserProfile,
  AttendanceRecord,
  AttendanceType,
  WorkShiftCategory,
  AIPerformanceRecord,
  WorkPolicy,
  ReminderItem,
} from './types';

// ============================================================================
// MODUL DATA LAYER (src/db.ts — Jadwal, Proyek, Cabang Program, Absensi, Performa AI & Supabase)
// ============================================================================

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  'https://GANTI_DENGAN_URL_SUPABASE_LU.supabase.co'; // <--- TEMPELKAN URL SUPABASE LU DI SINI

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  'GANTI_DENGAN_ANON_KEY_SUPABASE_LU'; // <--- TEMPELKAN ANON KEY ASLI LU DI SINI

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('GANTI_DENGAN')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_KEYS = {
  PROJECTS: 'jadwalpro_projects_v3',
  ENTRIES: 'jadwalpro_entries_v3',
  ATTENDANCE: 'jadwalpro_attendance_v3',
  INITIALIZED: 'jadwalpro_init_v3',
  SESSION: 'jadwalpro_session_v3',
  AI_PERFORMANCES: 'jadwalpro_ai_perf_v3',
  WORK_POLICY: 'jadwalpro_work_policy_v3',
  REMINDERS: 'jadwalpro_reminders_v3',
};

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
  // --- 1. SESI LOGIN & AUTHENTICATION ---
  saveSession(profile: UserProfile): void {
    safeStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(profile));
    safeStorage.setItem('jadwalpro_current_user', JSON.stringify(profile));
  },

  getSavedSession(): UserProfile | null {
    const raw =
      safeStorage.getItem(STORAGE_KEYS.SESSION) ||
      safeStorage.getItem('jadwalpro_current_user');
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
        .select('id, name, color, ownerId:owner_id, ownerName:owner_name, programs, createdAt:created_at')
        .order('created_at', { ascending: true });

      let entQuery = supabase
        .from('schedule_entries')
        .select(
          'id, date:entry_date, title, projectId:project_id, programId:program_id, status, notes, ownerId:owner_id, ownerName:owner_name, ownerPhone:owner_phone, ownerEmail:owner_email, createdAt:created_at, updatedAt:updated_at'
        )
        .order('entry_date', { ascending: true })
        .order('created_at', { ascending: true });

      let attQuery = supabase
        .from('attendance')
        .select(
          'id, ownerId:owner_id, ownerName:owner_name, date:entry_date, type, checkInTime:check_in_time, checkOutTime:check_out_time, workDurationHours:work_duration_hours, regularWorkHours:regular_work_hours, overtimeHours:overtime_hours, shiftCategory:shift_category, shiftNotes:shift_notes, checkInPhoto:check_in_photo, checkInLocation:check_in_location, checkOutPhoto:check_out_photo, checkOutLocation:check_out_location, notes, createdAt:created_at, updatedAt:updated_at'
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

      const projects = ((projData as any[]) || []).map((p) => ({
        ...p,
        programs: Array.isArray(p.programs) ? p.programs : [],
      })) as Project[];

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

  // --- 3. CRUD PROYEK & CABANG PROGRAM ---
  getProjects(): Project[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list)
        ? list.map((p) => ({ ...p, programs: Array.isArray(p.programs) ? p.programs : [] }))
        : [];
    } catch {
      return [];
    }
  },

  saveProjects(projects: Project[]): void {
    safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  createProject(
    name: string,
    color: string,
    programs: ProjectProgram[] = [],
    owner?: UserProfile | null
  ): Project[] {
    const activeOwner = owner || this.getSavedSession();
    const newProj: Project = {
      id: 'proj-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      color,
      programs: programs || [],
      ownerId: activeOwner?.id || 'owner-demo-1',
      ownerName: activeOwner?.fullName || 'User',
      createdAt: new Date().toISOString(),
    };
    const updated = [...this.getProjects(), newProj];
    this.saveProjects(updated);

    if (supabase) {
      supabase
        .from('projects')
        .insert({
          id: newProj.id,
          name: newProj.name,
          color: newProj.color,
          programs: newProj.programs,
          owner_id: newProj.ownerId,
          owner_name: newProj.ownerName,
          created_at: newProj.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error('Supabase insert project error:', error);
        });
    }

    return updated;
  },

  updateProject(
    id: string,
    name: string,
    color: string,
    programs?: ProjectProgram[]
  ): Project[] {
    const updated = this.getProjects().map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        name: name.trim(),
        color,
        programs: programs !== undefined ? programs : p.programs || [],
      };
    });
    this.saveProjects(updated);

    if (supabase) {
      const target = updated.find((p) => p.id === id);
      supabase
        .from('projects')
        .update({
          name: name.trim(),
          color,
          programs: target?.programs || [],
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase update project error:', error);
        });
    }

    return updated;
  },

  addProgramToProject(projectId: string, programName: string): Project[] {
    const newProg: ProjectProgram = {
      id: 'prog-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      name: programName.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = this.getProjects().map((p) => {
      if (p.id !== projectId) return p;
      const currentProgs = p.programs || [];
      return { ...p, programs: [...currentProgs, newProg] };
    });
    this.saveProjects(updated);

    if (supabase) {
      const target = updated.find((p) => p.id === projectId);
      supabase
        .from('projects')
        .update({ programs: target?.programs || [] })
        .eq('id', projectId)
        .then(({ error }) => {
          if (error) console.error('Supabase add program error:', error);
        });
    }

    return updated;
  },

  removeProgramFromProject(projectId: string, programId: string): Project[] {
    const updated = this.getProjects().map((p) => {
      if (p.id !== projectId) return p;
      const filtered = (p.programs || []).filter((prog) => prog.id !== programId);
      return { ...p, programs: filtered };
    });
    this.saveProjects(updated);

    const updatedEntries = this.getEntries().map((e) =>
      e.projectId === projectId && e.programId === programId
        ? { ...e, programId: null, updatedAt: new Date().toISOString() }
        : e
    );
    this.saveEntries(updatedEntries);

    if (supabase) {
      const target = updated.find((p) => p.id === projectId);
      supabase
        .from('projects')
        .update({ programs: target?.programs || [] })
        .eq('id', projectId)
        .then(({ error }) => {
          if (error) console.error('Supabase remove program error:', error);
        });
    }

    return updated;
  },

  deleteProject(id: string): { projects: Project[]; entries: ScheduleEntry[] } {
    const updatedProjects = this.getProjects().filter((p) => p.id !== id);
    const updatedEntries = this.getEntries().map((e) =>
      e.projectId === id
        ? { ...e, projectId: null, programId: null, updatedAt: new Date().toISOString() }
        : e
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

  // --- 4. OPERASI CATATAN JADWAL & TUGAS ---
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
      programId?: string | null;
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
      programId: payload.programId || null,
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
      supabase
        .from('schedule_entries')
        .insert({
          id: newEntry.id,
          entry_date: newEntry.date,
          title: newEntry.title,
          project_id: newEntry.projectId,
          program_id: newEntry.programId,
          status: newEntry.status,
          notes: newEntry.notes,
          owner_id: newEntry.ownerId,
          owner_name: newEntry.ownerName,
          owner_phone: newEntry.ownerPhone,
          owner_email: newEntry.ownerEmail,
          created_at: newEntry.createdAt,
          updated_at: newEntry.updatedAt,
        })
        .then(({ error }) => {
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
      if (payload.programId !== undefined) dbUpdate.program_id = payload.programId;
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

  // --- 5. OPERASI TOLAK UKUR KERJA & KEHADIRAN ---
  getWorkPolicy(): WorkPolicy {
    const raw = safeStorage.getItem(STORAGE_KEYS.WORK_POLICY);
    if (!raw) return { ...DEFAULT_WORK_POLICY };
    try {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_WORK_POLICY, ...parsed };
    } catch {
      return { ...DEFAULT_WORK_POLICY };
    }
  },

  saveWorkPolicy(policy: WorkPolicy): WorkPolicy {
    safeStorage.setItem(STORAGE_KEYS.WORK_POLICY, JSON.stringify(policy));
    return policy;
  },

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
      shiftCategory?: WorkShiftCategory;
      shiftNotes?: string;
      checkInPhoto?: string | null;
      checkInLocation?: string | null;
      checkOutPhoto?: string | null;
      checkOutLocation?: string | null;
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

    const policy = this.getWorkPolicy();
    const stdIn = policy.standardCheckInTime || '08:00';
    const stdOut = policy.standardCheckOutTime || '17:00';
    const breakHours = policy.breakDurationHours !== undefined ? policy.breakDurationHours : 1.0;
    const thresholdMin = policy.earlyOvertimeThresholdMinutes || 60;
    const lateTolMin = policy.lateToleranceMinutes || 15;

    const inTime =
      payload.checkInTime !== undefined
        ? payload.checkInTime
        : existingIndex >= 0
        ? records[existingIndex].checkInTime
        : null;
    const outTime =
      payload.checkOutTime !== undefined
        ? payload.checkOutTime
        : existingIndex >= 0
        ? records[existingIndex].checkOutTime
        : null;

    let isLate = false;
    let earlyOvertimeHours = 0;
    let lateOvertimeHours = 0;
    let effectiveInMinutes = 0;
    let effectiveOutMinutes = 0;

    const [stdInH, stdInM] = stdIn.split(':').map(Number);
    const stdInTotalMin = stdInH * 60 + stdInM;

    const [stdOutH, stdOutM] = stdOut.split(':').map(Number);
    const stdOutTotalMin = stdOutH * 60 + stdOutM;

    // Evaluasi Jam Masuk & Early Overtime
    if (inTime) {
      const [hIn, mIn] = inTime.split(':').map(Number);
      const actInMin = hIn * 60 + mIn;

      if (actInMin > stdInTotalMin + lateTolMin) {
        isLate = true;
        effectiveInMinutes = actInMin;
      } else if (stdInTotalMin - actInMin > thresholdMin) {
        effectiveInMinutes = actInMin;
        earlyOvertimeHours = (stdInTotalMin - actInMin) / 60;
      } else {
        effectiveInMinutes = stdInTotalMin;
      }
    }

    // Evaluasi Jam Keluar & Late Overtime
    if (outTime) {
      const [hOut, mOut] = outTime.split(':').map(Number);
      const actOutMin = hOut * 60 + mOut;
      effectiveOutMinutes = actOutMin;

      if (actOutMin > stdOutTotalMin + 30) {
        lateOvertimeHours = (actOutMin - stdOutTotalMin) / 60;
      }
    }

    let workDurationHours = 0;
    let overtimeHours = 0;
    let regularWorkHours = 0;

    if (inTime && outTime && effectiveOutMinutes > effectiveInMinutes) {
      const grossMinutes = effectiveOutMinutes - effectiveInMinutes;
      const grossHours = Math.max(0, grossMinutes / 60);

      const netHours = grossHours > breakHours ? grossHours - breakHours : grossHours;
      workDurationHours = Math.round(netHours * 10) / 10;

      const totalOvertime = Math.round((earlyOvertimeHours + lateOvertimeHours) * 10) / 10;
      overtimeHours = Math.min(workDurationHours, totalOvertime);
      regularWorkHours = Math.max(0, Math.round((workDurationHours - overtimeHours) * 10) / 10);
    }

    let autoShiftCategory: WorkShiftCategory = 'normal';
    if (earlyOvertimeHours > 0 && lateOvertimeHours > 0) {
      autoShiftCategory = 'lembur_penuh';
    } else if (earlyOvertimeHours > 0) {
      autoShiftCategory = 'lembur_awal';
    } else if (lateOvertimeHours > 0) {
      autoShiftCategory = 'lembur_akhir';
    }

    const shiftCategory: WorkShiftCategory =
      payload.shiftCategory ||
      (existingIndex >= 0 && records[existingIndex].shiftCategory) ||
      autoShiftCategory;

    const shiftNotes =
      payload.shiftNotes !== undefined
        ? payload.shiftNotes
        : existingIndex >= 0
        ? records[existingIndex].shiftNotes
        : autoShiftCategory !== 'normal'
        ? `Lembur terdeteksi (${overtimeHours > 0 ? `${overtimeHours} Jam` : ''})`
        : 'Shift kerja normal';

    const checkInPhoto =
      payload.checkInPhoto !== undefined
        ? payload.checkInPhoto
        : existingIndex >= 0
        ? records[existingIndex].checkInPhoto
        : null;

    const checkInLocation =
      payload.checkInLocation !== undefined
        ? payload.checkInLocation
        : existingIndex >= 0
        ? records[existingIndex].checkInLocation
        : null;

    const checkOutPhoto =
      payload.checkOutPhoto !== undefined
        ? payload.checkOutPhoto
        : existingIndex >= 0
        ? records[existingIndex].checkOutPhoto
        : null;

    const checkOutLocation =
      payload.checkOutLocation !== undefined
        ? payload.checkOutLocation
        : existingIndex >= 0
        ? records[existingIndex].checkOutLocation
        : null;

    const now = new Date().toISOString();
    let updatedItem: AttendanceRecord;
    let updatedList: AttendanceRecord[];

    if (existingIndex >= 0) {
      updatedItem = {
        ...records[existingIndex],
        type: payload.type,
        checkInTime: inTime,
        checkOutTime: outTime,
        workDurationHours: payload.type === 'hadir' ? workDurationHours : 0,
        regularWorkHours: payload.type === 'hadir' ? regularWorkHours : 0,
        overtimeHours: payload.type === 'hadir' ? overtimeHours : 0,
        shiftCategory,
        shiftNotes,
        isLate: payload.type === 'hadir' ? isLate : false,
        checkInPhoto,
        checkInLocation,
        checkOutPhoto,
        checkOutLocation,
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
        workDurationHours: payload.type === 'hadir' ? workDurationHours : 0,
        regularWorkHours: payload.type === 'hadir' ? regularWorkHours : 0,
        overtimeHours: payload.type === 'hadir' ? overtimeHours : 0,
        shiftCategory,
        shiftNotes,
        isLate: payload.type === 'hadir' ? isLate : false,
        checkInPhoto,
        checkInLocation,
        checkOutPhoto,
        checkOutLocation,
        notes: payload.notes || (payload.type === 'hadir' ? 'Check-in hadir harian.' : ''),
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [...records, updatedItem];
    }

    this.saveAttendance(updatedList);

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
        regular_work_hours: updatedItem.regularWorkHours,
        overtime_hours: updatedItem.overtimeHours,
        shift_category: updatedItem.shiftCategory,
        shift_notes: updatedItem.shiftNotes,
        check_in_location: updatedItem.checkInLocation,
        check_out_location: updatedItem.checkOutLocation,
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
      supabase
        .from('attendance')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase delete attendance error:', error);
        });
    }

    return updated;
  },

  // --- 6. OPERASI JADWAL PENGINGAT (REMINDERS & ALARMS) ---
  getReminders(): ReminderItem[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  saveReminders(reminders: ReminderItem[]): void {
    safeStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  },

  createReminder(
    payload: Omit<ReminderItem, 'id' | 'createdAt' | 'ownerId' | 'ownerName'>,
    owner?: UserProfile | null
  ): ReminderItem[] {
    const activeOwner = owner || this.getSavedSession();
    const newRem: ReminderItem = {
      id: 'rem-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
      ownerId: activeOwner?.id || 'owner-demo-1',
      ownerName: activeOwner?.fullName || 'User',
      title: payload.title.trim(),
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      notifyBeforeMinutes: payload.notifyBeforeMinutes || 0,
      notes: payload.notes?.trim() || '',
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      isTriggered: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newRem, ...this.getReminders()];
    this.saveReminders(updated);

    if (supabase) {
      supabase.from('reminders').insert({
        id: newRem.id,
        owner_id: newRem.ownerId,
        owner_name: newRem.ownerName,
        title: newRem.title,
        reminder_date: newRem.date,
        start_time: newRem.startTime,
        end_time: newRem.endTime,
        notify_before_minutes: newRem.notifyBeforeMinutes,
        notes: newRem.notes,
        is_active: newRem.isActive,
        created_at: newRem.createdAt,
      }).then(({ error }) => {
        if (error) console.warn('Supabase insert reminder notice:', error.message);
      });
    }

    return updated;
  },

  updateReminder(
    id: string,
    payload: Partial<Omit<ReminderItem, 'id' | 'createdAt' | 'ownerId' | 'ownerName'>>
  ): ReminderItem[] {
    const updated = this.getReminders().map((r) =>
      r.id === id ? { ...r, ...payload } : r
    );
    this.saveReminders(updated);

    if (supabase) {
      supabase
        .from('reminders')
        .update(payload)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Supabase update reminder notice:', error.message);
        });
    }

    return updated;
  },

  deleteReminder(id: string): ReminderItem[] {
    const updated = this.getReminders().filter((r) => r.id !== id);
    this.saveReminders(updated);

    if (supabase) {
      supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Supabase delete reminder notice:', error.message);
        });
    }

    return updated;
  },

  toggleReminderActive(id: string): ReminderItem[] {
    const current = this.getReminders();
    const updated = current.map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    );
    this.saveReminders(updated);
    return updated;
  },

  // --- 7. OPERASI EVALUASI PERFORMA AI & SARAN TERPADU ---
  getAIPerformances(): AIPerformanceRecord[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.AI_PERFORMANCES);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  saveAIPerformances(records: AIPerformanceRecord[]): void {
    safeStorage.setItem(STORAGE_KEYS.AI_PERFORMANCES, JSON.stringify(records));
  },

  addAIPerformance(record: AIPerformanceRecord): AIPerformanceRecord[] {
    const current = this.getAIPerformances();
    const updated = [record, ...current];
    this.saveAIPerformances(updated);

    if (supabase) {
      supabase
        .from('ai_performance')
        .insert({
          id: record.id,
          owner_id: record.ownerId,
          owner_name: record.ownerName,
          image_url: record.imageUrl,
          image_name: record.imageName,
          score: record.score,
          summary: record.summary,
          strengths: record.strengths,
          improvements: record.improvements,
          recommendations: record.recommendations,
          analyzed_date_range: record.analyzedDateRange,
          created_at: record.createdAt,
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase ai_performance insert notice:', error.message);
        });
    }

    return updated;
  },

  deleteAIPerformance(id: string): AIPerformanceRecord[] {
    const updated = this.getAIPerformances().filter((r) => r.id !== id);
    this.saveAIPerformances(updated);

    if (supabase) {
      supabase
        .from('ai_performance')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Supabase ai_performance delete notice:', error.message);
        });
    }

    return updated;
  },
};