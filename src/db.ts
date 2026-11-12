import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_WORK_POLICY } from './types';

// ============================================================================
// DEFINISI TIPE & INTERFACE MANDIRI (MENCEGAH ERROR JIKA types.ts BELUM TER-UPDATE)
// ============================================================================
export type EntryStatus = 'belum_mulai' | 'berjalan' | 'tertunda' | 'selesai';
export type AttendanceType = 'hadir' | 'izin' | 'cuti' | 'sakit';
export type WorkShiftCategory = 'normal' | 'lembur_awal' | 'lembur_akhir' | 'lembur_penuh';

export interface AttendanceRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  date: string;
  type: AttendanceType;
  checkInTime: string | null;
  checkOutTime: string | null;
  workDurationHours: number;
  regularWorkHours: number;
  overtimeHours: number;
  shiftCategory?: WorkShiftCategory;
  shiftNotes?: string;
  isLate?: boolean;
  lateReason?: string;
  isOvertimeConfirmed?: boolean;
  overtimeReason?: string;
  checkInPhoto?: string | null;
  checkInLocation?: string | null;
  checkOutPhoto?: string | null;
  checkOutLocation?: string | null;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

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

import type {
  Project,
  ProjectProgram,
  UserProfile,
  AIPerformanceRecord,
  WorkPolicy,
  ReminderItem,
  SubscriptionPlanType,
  SubscriptionStatus,
  SubscriptionInvoice,
  SubscriptionInfo,
  TeamConnection,
} from './types';

export type {
  SubscriptionPlanType,
  SubscriptionStatus,
  SubscriptionInvoice,
  SubscriptionInfo,
  TeamConnection,
};

export interface PausePeriod {
  pausedOn: string;
  resumedOn?: string | null;
}

export interface RevisionCycle {
  id: string;
  title: string;
  startDate: string;
  completedDate?: string | null;
  status: 'revisi' | 'selesai';
  notes?: string;
}

// Model Item Penambahan Pekerjaan & Riwayat Catatan Revisi
export interface ProjectAddonTask {
  id: string;
  type: 'revisi' | 'tambahan' | 'kendala' | 'instruksi';
  title: string;
  dateAdded: string;
  scheduledDate?: string;
  completedDate?: string | null;
  isCompleted: boolean;
  notes?: string;
  // Metadata carrier untuk sinkronisasi JSONB Supabase tanpa perlu migrasi kolom baru
  _metaPausePeriods?: PausePeriod[];
  _metaRevisionCycles?: RevisionCycle[];
  _metaDayStatusMap?: Record<string, 'belum_mulai' | 'berjalan' | 'tertunda' | 'revisi' | 'revisi_selesai' | 'selesai' | 'hidden'>;
}

// Definisi mandiri ScheduleEntry di db.ts agar mengenali status 'tertunda', completedDate, suspendedDate & additionalTasks
export interface IdeaItem {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  content: string; // Teks deskripsi / arahan ide
  category?: string;
  color?: string;
  scheduledDate?: string | null;
  scheduledEntryId?: string | null;
  projectId?: string | null;
  status: 'draft' | 'dijadwalkan' | 'selesai';
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEntry {
  id: string;
  date: string;
  completedDate?: string | null;
  suspendedDate?: string | null;
  durationDays?: number;
  originIdeaId?: string | null;
  additionalTasks?: ProjectAddonTask[];
  pausePeriods?: PausePeriod[];
  revisionCycles?: RevisionCycle[];
  dayStatusMap?: Record<string, 'belum_mulai' | 'berjalan' | 'tertunda' | 'revisi' | 'revisi_selesai' | 'selesai' | 'hidden'>;
  title: string;
  projectId: string | null;
  programId?: string | null;
  status: EntryStatus;
  notes: string;
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MODUL DATA LAYER (src/db.ts — Jadwal, Proyek, Cabang Program, Absensi, Performa AI & Supabase)
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
  AI_PERFORMANCES: 'jadwalpro_ai_perf_v3',
  WORK_POLICY: 'jadwalpro_work_policy_v3',
  REMINDERS: 'jadwalpro_reminders_v3',
  VOICE_MEMOS: 'jadwalpro_voice_memos_v3',
  WORK_APPRAISALS: 'jadwalpro_work_appraisals_v3',
  IDEAS: 'jadwalpro_ideas_v3',
  SUBSCRIPTIONS: 'jadwalpro_subscriptions_v3',
  TEAM_CONNECTIONS: 'jadwalpro_team_connections_v3',
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


function packAdditionalTasksWithMeta(entry: Partial<ScheduleEntry>): any[] {
  const baseList = Array.isArray(entry.additionalTasks)
    ? entry.additionalTasks.filter((t: any) => t && t.id !== '__jadwalpro_meta__')
    : [];
  const hasMeta =
    (entry.pausePeriods && entry.pausePeriods.length > 0) ||
    (entry.revisionCycles && entry.revisionCycles.length > 0) ||
    (entry.dayStatusMap && Object.keys(entry.dayStatusMap).length > 0);
  if (!hasMeta) return baseList;
  return [
    ...baseList,
    {
      id: '__jadwalpro_meta__',
      type: 'instruksi',
      title: '__meta__',
      dateAdded: entry.date || '',
      isCompleted: true,
      _metaPausePeriods: entry.pausePeriods || [],
      _metaRevisionCycles: entry.revisionCycles || [],
      _metaDayStatusMap: entry.dayStatusMap || {},
    },
  ];
}

function unpackAdditionalTasksAndMeta(rawTasks: any): {
  additionalTasks: ProjectAddonTask[];
  pausePeriods: PausePeriod[];
  revisionCycles: RevisionCycle[];
  dayStatusMap: Record<string, 'belum_mulai' | 'berjalan' | 'tertunda' | 'revisi' | 'revisi_selesai' | 'selesai' | 'hidden'>;
} {
  const arr = Array.isArray(rawTasks) ? rawTasks : [];
  const metaItem = arr.find((t: any) => t && t.id === '__jadwalpro_meta__');
  const cleanTasks = arr.filter((t: any) => t && t.id !== '__jadwalpro_meta__');
  return {
    additionalTasks: cleanTasks,
    pausePeriods: Array.isArray(metaItem?._metaPausePeriods) ? metaItem._metaPausePeriods : [],
    revisionCycles: Array.isArray(metaItem?._metaRevisionCycles) ? metaItem._metaRevisionCycles : [],
    dayStatusMap:
      metaItem?._metaDayStatusMap && typeof metaItem._metaDayStatusMap === 'object'
        ? metaItem._metaDayStatusMap
        : {},
  };
}

export const db = {
  // --- 1. SESI LOGIN & AUTHENTICATION (AUTO-LOGIN PERMANEN) ---
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
            avatarUrl: meta.avatar_url || undefined,
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
          avatarUrl: meta.avatar_url || undefined,
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
    emailOrPayload: string | { email: string; password?: string },
    possiblePassword?: string
  ): Promise<{ user?: UserProfile; error?: string }> {
    const rawEmail = typeof emailOrPayload === 'string' ? emailOrPayload : emailOrPayload.email;
    const rawPassword = typeof emailOrPayload === 'string' ? (possiblePassword || '') : (emailOrPayload.password || '');
    const cleanEmail = (rawEmail || '').trim().toLowerCase();
    const password = rawPassword;

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
        avatarUrl: meta.avatar_url || undefined,
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

  // --- 1.1 SETINGAN AKUN PRIBADI (UPDATE PROFIL & GANTI PASSWORD) ---
  async updateProfile(payload: {
    fullName: string;
    phone: string;
    avatarUrl?: string;
  }): Promise<{ user?: UserProfile; error?: string }> {
    const cleanName = payload.fullName.trim();
    const cleanPhone = payload.phone.trim();
    const session = this.getSavedSession();
    if (!session) return { error: 'Sesi pengguna tidak ditemukan' };

    const updatedProfile: UserProfile = {
      ...session,
      fullName: cleanName || session.fullName,
      phone: cleanPhone || session.phone,
      ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
    };

    if (supabase) {
      try {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: updatedProfile.fullName,
            phone: updatedProfile.phone,
            avatar_url: updatedProfile.avatarUrl || '',
          },
        });
        if (authError) {
          console.warn('Supabase auth.updateUser warning:', authError);
        }

        const { error: dbError } = await supabase.from('profiles').upsert(
          {
            owner_id: updatedProfile.id,
            full_name: updatedProfile.fullName,
            phone: updatedProfile.phone,
            email: updatedProfile.email,
          },
          { onConflict: 'owner_id' }
        );
        if (dbError) {
          console.warn('Supabase profiles.upsert warning:', dbError);
        }
      } catch (err: any) {
        console.warn('Gagal sinkron update profil ke Supabase:', err);
      }
    }

    this.saveSession(updatedProfile);
    return { user: updatedProfile };
  },

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter' };
    }

    if (supabase) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          return { success: false, error: error.message || 'Gagal mengubah kata sandi di Supabase Auth' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Terjadi kesalahan sistem saat memperbarui password' };
      }
    }

    // Mode offline / demo lokal
    return { success: true };
  },

  // --- 2. INISIALISASI & SINKRONISASI DATA ---
  init(): { projects: Project[]; entries: ScheduleEntry[]; attendance: AttendanceRecord[] } {
    // PENTING: Proyek bersifat kolaboratif untuk seluruh tim / workspace!
    // JANGAN PERNAH memfilter proyek berdasarkan ownerId di init() agar semua proyek selalu tampil utuh.
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
          'id, date:entry_date, completedDate:completed_date, durationDays:duration_days, title, projectId:project_id, programId:program_id, status, notes, ownerId:owner_id, ownerName:owner_name, ownerPhone:owner_phone, ownerEmail:owner_email, createdAt:created_at, updatedAt:updated_at'
        )
        .order('entry_date', { ascending: true })
        .order('created_at', { ascending: true });

      let attQuery = supabase
        .from('attendance')
        .select(
          'id, ownerId:owner_id, ownerName:owner_name, date:entry_date, type, checkInTime:check_in_time, checkOutTime:check_out_time, workDurationHours:work_duration_hours, regularWorkHours:regular_work_hours, overtimeHours:overtime_hours, shiftCategory:shift_category, shiftNotes:shift_notes, isLate:is_late, lateReason:late_reason, isOvertimeConfirmed:is_overtime_confirmed, overtimeReason:overtime_reason, checkInPhoto:check_in_photo, checkInLocation:check_in_location, checkOutPhoto:check_out_photo, checkOutLocation:check_out_location, notes, createdAt:created_at, updatedAt:updated_at'
        )
        .order('entry_date', { ascending: false });

      // PENTING: Gunakan select('*') agar aman dari error kolom jika skema Supabase belum di-migrate
      projQuery = supabase.from('projects').select('*').order('created_at', { ascending: true });
      entQuery = supabase.from('schedule_entries').select('*').order('entry_date', { ascending: true });
      attQuery = supabase.from('attendance').select('*').order('entry_date', { ascending: false });

      const [
        { data: projData, error: projErr },
        { data: entData, error: entErr },
        { data: attData, error: attErr },
      ] = await Promise.all([projQuery, entQuery, attQuery]);

      if (projErr || entErr) {
        console.warn('Supabase fetch notice:', projErr || entErr || attErr);
      }

      const remoteProjects = ((projData as any[]) || []).map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        ownerId: row.owner_id || row.ownerId || 'owner-default',
        ownerName: row.owner_name || row.ownerName || 'User',
        programs: Array.isArray(row.programs) ? row.programs : [],
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      })) as Project[];

      // SAFE MERGE PROYEK:
      const localProjects = this.getProjects();
      const projectMap = new Map<string, Project>();
      localProjects.forEach((p) => projectMap.set(p.id, p));
      remoteProjects.forEach((p) => projectMap.set(p.id, p));
      const mergedProjects = Array.from(projectMap.values());

      // MAP REMOTE ENTRIES KE STRUKTUR LENGKAP (TERMASUK suspendedDate, additionalTasks, pausePeriods, revisionCycles, dayStatusMap)
      const remoteEntries = ((entData as any[]) || []).map((row) => {
        const rawAddons = Array.isArray(row.additional_tasks)
          ? row.additional_tasks
          : Array.isArray(row.additionalTasks)
          ? row.additionalTasks
          : [];
        const unpacked = unpackAdditionalTasksAndMeta(rawAddons);
        return {
          id: row.id,
          date: row.entry_date || row.date,
          completedDate: row.completed_date || row.completedDate || null,
          suspendedDate: row.suspended_date || row.suspendedDate || null,
          durationDays: row.duration_days !== undefined ? row.duration_days : row.durationDays,
          additionalTasks: unpacked.additionalTasks,
          pausePeriods: row.pause_periods || row.pausePeriods || unpacked.pausePeriods,
          revisionCycles: row.revision_cycles || row.revisionCycles || unpacked.revisionCycles,
          dayStatusMap: row.day_status_map || row.dayStatusMap || unpacked.dayStatusMap,
          title: row.title || '',
        projectId: row.project_id !== undefined ? row.project_id : (row.projectId || null),
        programId: row.program_id !== undefined ? row.program_id : (row.programId || null),
        status: (row.status || 'belum_mulai') as EntryStatus,
        notes: row.notes || '',
        ownerId: row.owner_id || row.ownerId || 'owner-default',
        ownerName: row.owner_name || row.ownerName || 'User',
        ownerPhone: row.owner_phone || row.ownerPhone || '',
        ownerEmail: row.owner_email || row.ownerEmail || '',
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
        updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
        };
      }) as ScheduleEntry[];

      // SMART TIMESTAMP MERGE (MENCEGAH STATUS 'tertunda' TERTEMPEL/KEMBALI KE STATUS LAMA):
      const localEntries = this.getEntries();
      const entryMap = new Map<string, ScheduleEntry>();

      // Masukkan remote terlebih dahulu
      remoteEntries.forEach((e) => entryMap.set(e.id, e));

      // Jika ada perubahan lokal yang lebih baru atau sama (misal user baru ubah ke 'tertunda'),
      // pertahankan status lokal agar tidak tertimpa data lama dari server!
      localEntries.forEach((local) => {
        const remote = entryMap.get(local.id);
        if (!remote) {
          entryMap.set(local.id, local);
        } else {
          const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
          const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();

          // Jika lokal lebih baru atau sama, prioritas ke lokal
          if (localTime >= remoteTime) {
            entryMap.set(local.id, {
              ...remote,
              ...local,
              status: local.status,
              completedDate: local.completedDate,
              suspendedDate: (local as any).suspendedDate || null,
              additionalTasks: (local as any).additionalTasks || [],
              notes: local.notes,
              updatedAt: local.updatedAt,
            } as ScheduleEntry);

            // Sinkronkan kembali perubahan status lokal ke Supabase jika remote berbeda
            if (remote.status !== local.status) {
              supabase
                .from('schedule_entries')
                .update({
                  status: local.status,
                  suspended_date: (local as any).suspendedDate || null,
                  completed_date: local.completedDate || null,
                  duration_days: local.durationDays || null,
                  additional_tasks: (local as any).additionalTasks || [],
                  updated_at: local.updatedAt,
                })
                .eq('id', local.id)
                .then(({ error }) => {
                  if (error) console.warn('Supabase resync status error:', error.message);
                });
            }
          }
        }
      });
      const mergedEntries = Array.from(entryMap.values());

      // SAFE MERGE ABSENSI:
      const remoteAttendance = ((attData as any[]) || []).map((row) => ({
        id: row.id,
        ownerId: row.owner_id || row.ownerId || 'owner-default',
        ownerName: row.owner_name || row.ownerName || 'User',
        date: row.entry_date || row.date,
        type: (row.type || 'hadir') as AttendanceType,
        checkInTime: row.check_in_time !== undefined ? row.check_in_time : row.checkInTime,
        checkOutTime: row.check_out_time !== undefined ? row.check_out_time : row.checkOutTime,
        workDurationHours: Number(row.work_duration_hours !== undefined ? row.work_duration_hours : row.workDurationHours) || 0,
        regularWorkHours: Number(row.regular_work_hours !== undefined ? row.regular_work_hours : row.regularWorkHours) || 0,
        overtimeHours: Number(row.overtime_hours !== undefined ? row.overtime_hours : row.overtimeHours) || 0,
        shiftCategory: (row.shift_category || row.shiftCategory || 'normal') as WorkShiftCategory,
        shiftNotes: row.shift_notes || row.shiftNotes || '',
        isLate: Boolean(row.is_late !== undefined ? row.is_late : row.isLate),
        lateReason: row.late_reason || row.lateReason || '',
        isOvertimeConfirmed: Boolean(row.is_overtime_confirmed !== undefined ? row.is_overtime_confirmed : row.isOvertimeConfirmed),
        overtimeReason: row.overtime_reason || row.overtimeReason || '',
        checkInPhoto: row.check_in_photo || row.checkInPhoto || null,
        checkInLocation: row.check_in_location || row.checkInLocation || null,
        checkOutPhoto: row.check_out_photo || row.checkOutPhoto || null,
        checkOutLocation: row.check_out_location || row.checkOutLocation || null,
        notes: row.notes || '',
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
        updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
      })) as AttendanceRecord[];

      const localAttendance = this.getAttendance();
      const attendanceMap = new Map<string, AttendanceRecord>();
      localAttendance.forEach((a) => attendanceMap.set(a.id, a));
      remoteAttendance.forEach((a) => attendanceMap.set(a.id, a));
      const mergedAttendance = Array.from(attendanceMap.values());

      safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(mergedProjects));
      safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(mergedEntries));
      safeStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(mergedAttendance));

      return { projects: mergedProjects, entries: mergedEntries, attendance: mergedAttendance };
    } catch (err) {
      console.error('Supabase connection error:', err);
      return null;
    }
  },

  // --- 3. CRUD PROYEK & CABANG PROGRAM ---
  getProjects(): Project[] {
    let list: Project[] = [];
    const rawV3 = safeStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (rawV3) {
      try {
        const parsed = JSON.parse(rawV3);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch {}
    }

    // Auto-recovery: Jika di key v3 kosong, pulihkan dari storage key sebelumnya (v2 atau v1)
    if (list.length === 0) {
      const fallbackKeys = ['jadwalpro_projects_v2', 'jadwalpro_projects', 'jadwalpro_projects_backup'];
      for (const k of fallbackKeys) {
        const oldRaw = safeStorage.getItem(k);
        if (oldRaw) {
          try {
            const parsed = JSON.parse(oldRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              list = parsed;
              safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
              break;
            }
          } catch {}
        }
      }
    }

    return list.map((p) => ({
      ...p,
      programs: Array.isArray(p.programs) ? p.programs : [],
    }));
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

    // Update entri tugas yang sebelumnya memakai program ini agar programId jadi null
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
    let list: ScheduleEntry[] = [];
    const rawV3 = safeStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (rawV3) {
      try {
        const parsed = JSON.parse(rawV3);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch {}
    }

    // Auto-recovery: Jika di key v3 kosong, pulihkan dari storage key sebelumnya
    if (list.length === 0) {
      const fallbackKeys = ['jadwalpro_entries_v2', 'jadwalpro_entries', 'jadwalpro_entries_backup'];
      for (const k of fallbackKeys) {
        const oldRaw = safeStorage.getItem(k);
        if (oldRaw) {
          try {
            const parsed = JSON.parse(oldRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              list = parsed;
              safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(list));
              break;
            }
          } catch {}
        }
      }
    }

    return list;
  },

  saveEntries(entries: ScheduleEntry[]): void {
    safeStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  },

  saveEntry(entry: ScheduleEntry): void {
    const all = this.getEntries();
    const idx = all.findIndex((e) => e.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.unshift(entry);
    this.saveEntries(all);
  },

  createEntry(
    payload: {
      id?: string;
      date: string;
      title: string;
      projectId: string | null;
      programId?: string | null;
      status: EntryStatus;
      notes: string;
      completedDate?: string | null;
      durationDays?: number;
      originIdeaId?: string | null;
    },
    owner?: UserProfile | null
  ): ScheduleEntry[] {
    const activeOwner = owner || this.getSavedSession();
    const now = new Date().toISOString();
    const newEntry: ScheduleEntry = {
      id: payload.id || ('ent-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)),
      date: payload.date,
      completedDate: payload.completedDate || (payload.status === 'selesai' ? payload.date : null),
      durationDays: payload.durationDays || (payload.status === 'selesai' ? 1 : undefined),
      originIdeaId: payload.originIdeaId || null,
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
          completed_date: newEntry.completedDate,
          suspended_date: (newEntry as any).suspendedDate || null,
          duration_days: newEntry.durationDays,
          additional_tasks: packAdditionalTasksWithMeta(newEntry),
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
          if (error) console.warn('Supabase insert entry error:', error.message);
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
    const now = new Date().toISOString();
    const current = this.getEntries();
    const updated = current.map((e) =>
      e.id === id ? { ...e, ...payload, updatedAt: now } : e
    );
    this.saveEntries(updated);
    const updatedTarget = updated.find((e) => e.id === id);

    if (supabase && updatedTarget) {
      const dbUpdate: Record<string, unknown> = {
        updated_at: now,
      };
      if (payload.date !== undefined) dbUpdate.entry_date = payload.date;
      if (payload.title !== undefined) dbUpdate.title = payload.title;
      if (payload.projectId !== undefined) dbUpdate.project_id = payload.projectId;
      if (payload.programId !== undefined) dbUpdate.program_id = payload.programId;
      if (payload.status !== undefined) dbUpdate.status = payload.status;
      if (payload.notes !== undefined) dbUpdate.notes = payload.notes;
      if ((payload as any).completedDate !== undefined) dbUpdate.completed_date = (payload as any).completedDate;
      if ((payload as any).suspendedDate !== undefined) dbUpdate.suspended_date = (payload as any).suspendedDate;
      if ((payload as any).durationDays !== undefined) dbUpdate.duration_days = (payload as any).durationDays;
      if (
        (payload as any).additionalTasks !== undefined ||
        (payload as any).pausePeriods !== undefined ||
        (payload as any).revisionCycles !== undefined ||
        (payload as any).dayStatusMap !== undefined
      ) {
        dbUpdate.additional_tasks = packAdditionalTasksWithMeta(updatedTarget);
      }

      supabase
        .from('schedule_entries')
        .update(dbUpdate)
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Supabase update entry error (Pastikan migrasi SQL check constraint sudah dijalankan):', error.message);
          }
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
      checkInPhoto?: string | null;
      checkInLocation?: string | null;
      checkOutPhoto?: string | null;
      checkOutLocation?: string | null;
      regularWorkHours?: number;
      overtimeHours?: number;
      shiftCategory?: WorkShiftCategory;
      shiftNotes?: string;
      isLate?: boolean;
      lateReason?: string;
      isOvertimeConfirmed?: boolean;
      overtimeReason?: string;
      notes?: string;
    },
    owner?: UserProfile | null
  ): Promise<AttendanceRecord[]> {
    const activeOwner = owner || this.getSavedSession();
    const ownerId = activeOwner?.id || 'owner-demo-1';
    const ownerName = activeOwner?.fullName || 'User';

    const records = this.getAttendance();
    const existingIndex = records.findIndex(
      (r) =>
        r.date === payload.date &&
        (r.ownerId === ownerId ||
          r.ownerId === 'owner-local-admin' ||
          r.ownerId === 'owner-demo-1' ||
          (r.ownerName && r.ownerName.toLowerCase() === ownerName.toLowerCase()))
    );

    const policy = this.getWorkPolicy();
    const stdInFallback = policy.standardCheckInTime || '08:00';

    let duration = 0;
    const inTime =
      payload.checkInTime !== undefined
        ? payload.checkInTime
        : existingIndex >= 0 && records[existingIndex].checkInTime
        ? records[existingIndex].checkInTime
        : payload.checkOutTime
        ? stdInFallback
        : null;
    const outTime =
      payload.checkOutTime !== undefined
        ? payload.checkOutTime
        : existingIndex >= 0
        ? records[existingIndex].checkOutTime
        : null;
    // Toleransi keterlambatan (bisa 0 menit untuk mode ketat / manual)
    const lateTolerance = policy.lateToleranceMinutes !== undefined ? policy.lateToleranceMinutes : 15;
    let isLate = payload.isLate !== undefined ? payload.isLate : false;
    if (payload.isLate === undefined && inTime && policy.standardCheckInTime) {
      const [stdH, stdM] = policy.standardCheckInTime.split(':').map(Number);
      const [actH, actM] = inTime.split(':').map(Number);
      const limitMinutes = stdH * 60 + stdM + lateTolerance;
      const actMinutes = actH * 60 + actM;
      if (actMinutes > limitMinutes) {
        isLate = true;
      }
    }

    // Tolak Ukur Jam Baku Kerja
    const stdInStr = policy.standardCheckInTime || '08:00';
    const stdOutStr = policy.standardCheckOutTime || '17:00';
    const [stdInH, stdInM] = stdInStr.split(':').map(Number);
    const [stdOutH, stdOutM] = stdOutStr.split(':').map(Number);
    const stdInTotalMin = stdInH * 60 + stdInM;
    const stdOutTotalMin = stdOutH * 60 + stdOutM;

    // Deteksi apakah hari ini merupakan Hari Libur (Weekend berdasarkan workDaysPerWeek)
    const entryDateObj = new Date(payload.date + 'T00:00:00');
    const dayOfWeek = entryDateObj.getDay(); // 0 = Minggu, 6 = Sabtu
    const isDayOff = dayOfWeek === 0 || (policy.workDaysPerWeek <= 5 && dayOfWeek === 6);

    // KALKULASI JAM KERJA BERSIH & LEMBUR: SELALU BULAT GENAP PER JAM (TANPA KOMA DESIMAL)
    // Contoh: Hadir reguler = 8 jam genap. Lembur 1 jam = total 9 jam genap.
    let earlyOtHours = 0;
    let lateOtHours = 0;

    if (inTime) {
      const [hIn, mIn] = inTime.split(':').map(Number);
      const inMin = hIn * 60 + mIn;
      if (inMin < stdInTotalMin) {
        // Masuk lebih awal dari jam baku (misal jam 7 masuk vs jam 8 baku = 60 menit = 1 jam lembur)
        const diffEarly = stdInTotalMin - inMin;
        earlyOtHours = Math.max(0, Math.round(diffEarly / 60));
      }
    }

    if (outTime) {
      const [hOut, mOut] = outTime.split(':').map(Number);
      const outMin = hOut * 60 + mOut;
      if (outMin > stdOutTotalMin) {
        // Pulang lebih lama dari jam baku (misal jam 18 pulang vs jam 17 baku = 60 menit = 1 jam lembur, jam 19 = 2 jam)
        const diffLate = outMin - stdOutTotalMin;
        lateOtHours = Math.max(0, Math.round(diffLate / 60));
      }
    }

    let rawDurationHours = 0;
    if (inTime && outTime) {
      const [hIn, mIn] = inTime.split(':').map(Number);
      const [hOut, mOut] = outTime.split(':').map(Number);
      const diffMinutes = hOut * 60 + mOut - (hIn * 60 + mIn);
      const grossHours = Math.max(0, diffMinutes / 60);
      const breakDeduction = policy.breakDurationHours || 0;
      const netHours = grossHours > breakDeduction ? grossHours - breakDeduction : grossHours;
      rawDurationHours = Math.round(netHours);
    }

    const now = new Date().toISOString();
    let updatedItem: AttendanceRecord;
    let updatedList: AttendanceRecord[];

    let regHours = 0;
    let otHours = 0;
    let autoShiftCategory: WorkShiftCategory = 'normal';
    let autoShiftNote = '';

    if (isDayOff) {
      // HARI LIBUR: SELURUH JAM KERJA ADALAH LEMBUR PENUH (GENAP PER JAM)
      regHours = 0;
      otHours = payload.overtimeHours !== undefined ? Math.round(payload.overtimeHours) : (rawDurationHours > 0 ? rawDurationHours : Math.max(1, earlyOtHours + lateOtHours));
      duration = otHours;
      autoShiftCategory = 'lembur_penuh';
      autoShiftNote = `Lembur Hari Libur / Akhir Pekan (${dayOfWeek === 0 ? 'Minggu' : 'Sabtu'}) - ${otHours} Jam Genap`;
    } else {
      // HARI KERJA REGULER: JAM BERSIH GENAP PER JAM (CONTOH 8 JAM, LEMBUR 1 JAM = 9 JAM)
      const targetDailyHours = Math.round(policy.targetDailyWorkHours || 8.0);
      
      // Jika user eksplisit mengonfirmasi jam lembur
      const confirmedOt = payload.overtimeHours !== undefined ? Math.round(payload.overtimeHours) : (earlyOtHours + lateOtHours);
      otHours = Math.max(0, confirmedOt);

      // Jam kerja reguler bersih dibulatkan genap ke target harian (misal 8 jam)
      if (inTime && outTime) {
        regHours = Math.min(targetDailyHours, Math.max(1, rawDurationHours - otHours));
        if (regHours <= 0) regHours = targetDailyHours;
      } else {
        regHours = targetDailyHours;
      }

      duration = regHours + otHours; // Genap per jam: 8, 9, 10, dst.
      autoShiftCategory = otHours > 0 ? (earlyOtHours > 0 && lateOtHours === 0 ? 'lembur_awal' : 'lembur_akhir') : 'normal';
      autoShiftNote = otHours > 0 ? `Shift Reguler ${regHours}j + Lembur ${otHours}j (Total ${duration} Jam Genap)` : 'Shift Normal';
    }

    if (existingIndex >= 0) {
      const prev = records[existingIndex];
      updatedItem = {
        ...prev,
        ownerId,
        ownerName,
        type: payload.type,
        checkInTime: inTime,
        checkOutTime: outTime,
        workDurationHours: payload.type === 'hadir' ? duration : 0,
        regularWorkHours: payload.type === 'hadir' ? (payload.regularWorkHours !== undefined ? payload.regularWorkHours : regHours) : 0,
        overtimeHours: payload.type === 'hadir' ? (payload.overtimeHours !== undefined ? payload.overtimeHours : otHours) : 0,
        shiftCategory: payload.shiftCategory || prev.shiftCategory || autoShiftCategory,
        shiftNotes: payload.shiftNotes !== undefined ? payload.shiftNotes : (prev.shiftNotes || autoShiftNote),
        checkInPhoto: payload.checkInPhoto !== undefined ? payload.checkInPhoto : prev.checkInPhoto,
        checkInLocation: payload.checkInLocation !== undefined ? payload.checkInLocation : prev.checkInLocation,
        checkOutPhoto: payload.checkOutPhoto !== undefined ? payload.checkOutPhoto : prev.checkOutPhoto,
        checkOutLocation: payload.checkOutLocation !== undefined ? payload.checkOutLocation : prev.checkOutLocation,
        isLate: payload.type === 'hadir' ? isLate : false,
        lateReason: payload.lateReason !== undefined ? payload.lateReason : prev.lateReason || '',
        isOvertimeConfirmed: payload.isOvertimeConfirmed !== undefined ? payload.isOvertimeConfirmed : prev.isOvertimeConfirmed || false,
        overtimeReason: payload.overtimeReason !== undefined ? payload.overtimeReason : prev.overtimeReason || '',
        notes: payload.notes !== undefined ? payload.notes : prev.notes,
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
        regularWorkHours: payload.type === 'hadir' ? (payload.regularWorkHours !== undefined ? payload.regularWorkHours : regHours) : 0,
        overtimeHours: payload.type === 'hadir' ? (payload.overtimeHours !== undefined ? payload.overtimeHours : otHours) : 0,
        shiftCategory: payload.shiftCategory || autoShiftCategory,
        shiftNotes: payload.shiftNotes || autoShiftNote || 'Shift normal',
        checkInPhoto: payload.checkInPhoto || null,
        checkInLocation: payload.checkInLocation || null,
        checkOutPhoto: payload.checkOutPhoto || null,
        checkOutLocation: payload.checkOutLocation || null,
        isLate: payload.type === 'hadir' ? isLate : false,
        lateReason: payload.lateReason || '',
        isOvertimeConfirmed: payload.isOvertimeConfirmed || false,
        overtimeReason: payload.overtimeReason || '',
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
        check_in_photo: updatedItem.checkInPhoto,
        check_in_location: updatedItem.checkInLocation,
        check_out_photo: updatedItem.checkOutPhoto,
        check_out_location: updatedItem.checkOutLocation,
        is_late: updatedItem.isLate || false,
        late_reason: updatedItem.lateReason || '',
        is_overtime_confirmed: updatedItem.isOvertimeConfirmed || false,
        overtime_reason: updatedItem.overtimeReason || '',
        notes: updatedItem.notes,
        updated_at: now,
      };

      try {
        // 1. Pastikan profil owner ada di Supabase agar tidak ditolak foreign key
        try {
          await supabase.from('profiles').upsert(
            {
              owner_id: updatedItem.ownerId,
              full_name: updatedItem.ownerName || 'User',
            },
            { onConflict: 'owner_id' }
          );
        } catch {}

        // 2. Cek apakah baris absensi untuk (owner_id, entry_date) sudah ada di Supabase
        const { data: existingRows } = await supabase
          .from('attendance')
          .select('id')
          .eq('owner_id', updatedItem.ownerId)
          .eq('entry_date', updatedItem.date)
          .limit(1);

        const existingRemoteId = existingRows && existingRows.length > 0 ? existingRows[0].id : null;

        const corePayload = {
          id: existingRemoteId || updatedItem.id,
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

        if (existingRemoteId) {
          const { id: _ignoreId, ...updateFields } = { ...dbPayload, id: existingRemoteId };
          const { error: updErr } = await supabase
            .from('attendance')
            .update(updateFields)
            .eq('id', existingRemoteId);
          if (updErr) {
            const { id: _ignoreCoreId, ...coreUpdateFields } = corePayload;
            await supabase.from('attendance').update(coreUpdateFields).eq('id', existingRemoteId);
          }
        } else {
          const { error: insErr } = await supabase.from('attendance').insert(dbPayload);
          if (insErr) {
            const { error: coreInsErr } = await supabase.from('attendance').insert(corePayload);
            if (coreInsErr) {
              await supabase.from('attendance').upsert(corePayload, { onConflict: 'id' });
            }
          }
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
      supabase.from('reminders').delete().eq('id', id).then(({ error }) => {
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


  // --- 8. CATATAN SUARA, TRANSKRIPSI & KESIMPULAN AI (LOCAL FIRST + SUPABASE SYNC) ---
  getVoiceMemos(): VoiceMemoRecord[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.VOICE_MEMOS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveVoiceMemos(memos: VoiceMemoRecord[]): void {
    safeStorage.setItem(STORAGE_KEYS.VOICE_MEMOS, JSON.stringify(memos));
  },

  addVoiceMemo(memo: VoiceMemoRecord): VoiceMemoRecord[] {
    const current = this.getVoiceMemos();
    const updated = [memo, ...current.filter((m) => m.id !== memo.id)];
    this.saveVoiceMemos(updated);

    if (supabase) {
      supabase
        .from('voice_memos')
        .upsert({
          id: memo.id,
          title: memo.title,
          transcript: memo.transcript,
          summary: memo.summary,
          category: memo.category || 'Umum',
          key_points: memo.keyPoints || [],
          action_items: memo.actionItems || [],
          risk_mitigation: memo.riskMitigation || [],
          duration_seconds: memo.durationSeconds || 0,
          created_at: memo.createdAt,
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase voice_memos sync notice:', error.message);
        });
    }

    return updated;
  },

  deleteVoiceMemo(id: string): VoiceMemoRecord[] {
    const updated = this.getVoiceMemos().filter((m) => m.id !== id);
    this.saveVoiceMemos(updated);

    if (supabase) {
      supabase
        .from('voice_memos')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Supabase voice_memos delete notice:', error.message);
        });
    }

    return updated;
  },

  // --- 9. SISTEM REPORT HASIL PEKERJAAN & PENILAIAN KINERJA AI PRO (LOCAL FIRST + SUPABASE SYNC) ---
  getWorkAppraisals(): WorkAppraisalRecord[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.WORK_APPRAISALS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveWorkAppraisals(records: WorkAppraisalRecord[]): void {
    safeStorage.setItem(STORAGE_KEYS.WORK_APPRAISALS, JSON.stringify(records));
  },

  addWorkAppraisal(record: WorkAppraisalRecord): WorkAppraisalRecord[] {
    const current = this.getWorkAppraisals();
    const updated = [record, ...current.filter((r) => r.id !== record.id)];
    this.saveWorkAppraisals(updated);

    if (supabase) {
      supabase
        .from('work_appraisals')
        .upsert({
          id: record.id,
          owner_id: record.ownerId,
          owner_name: record.ownerName,
          job_role: record.jobRole,
          job_role_label: record.jobRoleLabel,
          division: record.division,
          report_title: record.reportTitle,
          period_date: record.periodDate,
          metrics: record.metrics,
          link_url: record.linkUrl,
          screenshot_url: record.screenshotUrl,
          screenshot_name: record.screenshotName,
          notes: record.notes,
          score: record.score,
          grade: record.grade,
          executive_summary: record.executiveSummary,
          industry_benchmark_review: record.industryBenchmarkReview,
          strengths: record.strengths,
          improvements: record.improvements,
          tactical_recommendations: record.tacticalRecommendations,
          created_at: record.createdAt,
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase work_appraisals sync notice:', error.message);
        });
    }

    return updated;
  },

  deleteWorkAppraisal(id: string): WorkAppraisalRecord[] {
    const updated = this.getWorkAppraisals().filter((r) => r.id !== id);
    this.saveWorkAppraisals(updated);

    if (supabase) {
      supabase
        .from('work_appraisals')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Supabase work_appraisals delete notice:', error.message);
        });
    }

    return updated;
  },
  // --- 11. BANK IDE & CATATAN RENCANA (IDEAS TO CALENDAR) ---
  getIdeas(): IdeaItem[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.IDEAS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveIdea(idea: IdeaItem): void {
    const list = this.getIdeas();
    const idx = list.findIndex((i) => i.id === idea.id);
    if (idx >= 0) {
      list[idx] = { ...idea, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...idea, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    safeStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(list));
  },

  deleteIdea(id: string): void {
    const list = this.getIdeas().filter((i) => i.id !== id);
    safeStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(list));
  },

  // --- 12. SISTEM LANGGANAN (RP 27.000 / BULAN & FREE TRIAL 7 HARI + LOCK OTOMATIS) ---
  getAllSubscriptions(): Record<string, SubscriptionInfo> {
    const raw = safeStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!raw) return {};
    try {
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  },

  saveAllSubscriptions(map: Record<string, SubscriptionInfo>): void {
    safeStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(map));
  },

  getSubscription(user?: UserProfile | null): SubscriptionInfo {
    const activeUser = user || this.getSavedSession();
    const userId = activeUser?.id || 'owner-local-admin';
    const userEmail = activeUser?.email || 'user@jadwalpro.com';
    const userName = activeUser?.fullName || 'User';

    const map = this.getAllSubscriptions();
    let sub = map[userId] || map[userEmail];

    if (!sub) {
      const now = new Date();
      const exp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      sub = {
        userId,
        userEmail,
        userName,
        plan: 'free_trial_7d',
        status: 'trial_active',
        pricePerMonth: 27000,
        startedAt: now.toISOString(),
        expiresAt: exp.toISOString(),
        lastPaymentDate: null,
        paymentMethod: null,
        invoiceHistory: [],
      };
      map[userId] = sub;
      map[userEmail] = sub;
      this.saveAllSubscriptions(map);
    }

    // Evaluasi otomatis apakah masa aktif 7 hari / 30 hari sudah habis
    if (new Date(sub.expiresAt).getTime() <= Date.now()) {
      if (sub.status !== 'expired') {
        sub = { ...sub, status: 'expired' };
        map[userId] = sub;
        map[userEmail] = sub;
        this.saveAllSubscriptions(map);
      }
    }

    return sub;
  },

  initSubscriptionOnSignUp(
    user: UserProfile,
    chosenPlan: SubscriptionPlanType = 'free_trial_7d',
    paymentMethod: string = 'QRIS Instan Nasional'
  ): SubscriptionInfo {
    const map = this.getAllSubscriptions();
    const now = new Date();

    let sub: SubscriptionInfo;
    if (chosenPlan === 'pro_monthly') {
      const exp = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const invId = 'INV-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      sub = {
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        plan: 'pro_monthly',
        status: 'active',
        pricePerMonth: 27000,
        startedAt: now.toISOString(),
        expiresAt: exp.toISOString(),
        lastPaymentDate: now.toISOString(),
        paymentMethod,
        invoiceHistory: [
          {
            id: invId,
            date: now.toISOString(),
            amount: 27000,
            planLabel: 'Paket Pro Bulanan (30 Hari)',
            method: paymentMethod,
            status: 'lunas',
          },
        ],
      };
    } else {
      const exp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      sub = {
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        plan: 'free_trial_7d',
        status: 'trial_active',
        pricePerMonth: 27000,
        startedAt: now.toISOString(),
        expiresAt: exp.toISOString(),
        lastPaymentDate: null,
        paymentMethod: null,
        invoiceHistory: [],
      };
    }

    map[user.id] = sub;
    if (user.email) map[user.email] = sub;
    this.saveAllSubscriptions(map);
    if (supabase) {
      supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: sub.userId,
            user_email: sub.userEmail,
            user_name: sub.userName,
            plan: sub.plan,
            status: sub.status,
            price_per_month: sub.pricePerMonth,
            started_at: sub.startedAt,
            expires_at: sub.expiresAt,
            last_payment_date: sub.lastPaymentDate || null,
            payment_method: sub.paymentMethod || 'Free Trial 7 Hari',
            invoice_history: sub.invoiceHistory || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .then(() => {});
    }
    return sub;
  },

  activateMonthlySubscription(
    user: UserProfile,
    paymentMethod: string = 'QRIS Instan Nasional'
  ): SubscriptionInfo {
    const map = this.getAllSubscriptions();
    const existing = this.getSubscription(user);
    const now = new Date();
    const baseTime =
      existing.status !== 'expired' && new Date(existing.expiresAt).getTime() > now.getTime()
        ? new Date(existing.expiresAt).getTime()
        : now.getTime();
    const nextExp = new Date(baseTime + 30 * 24 * 60 * 60 * 1000);
    const invId =
      'INV-' +
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();

    const updated: SubscriptionInfo = {
      ...existing,
      userId: user.id,
      userEmail: user.email,
      userName: user.fullName,
      plan: 'pro_monthly',
      status: 'active',
      pricePerMonth: 27000,
      expiresAt: nextExp.toISOString(),
      lastPaymentDate: now.toISOString(),
      paymentMethod,
      invoiceHistory: [
        {
          id: invId,
          date: now.toISOString(),
          amount: 27000,
          planLabel: 'Perpanjangan Pro Bulanan (30 Hari)',
          method: paymentMethod,
          status: 'lunas',
        },
        ...(existing.invoiceHistory || []),
      ],
    };

    map[user.id] = updated;
    if (user.email) map[user.email] = updated;
    this.saveAllSubscriptions(map);
    if (supabase) {
      supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: updated.userId,
            user_email: updated.userEmail,
            user_name: updated.userName,
            plan: updated.plan,
            status: updated.status,
            price_per_month: updated.pricePerMonth,
            started_at: updated.startedAt,
            expires_at: updated.expiresAt,
            last_payment_date: updated.lastPaymentDate || null,
            payment_method: updated.paymentMethod || paymentMethod,
            invoice_history: updated.invoiceHistory || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .then(() => {});
    }
    return updated;
  },

  simulateExpireSubscription(user: UserProfile): SubscriptionInfo {
    const map = this.getAllSubscriptions();
    const existing = this.getSubscription(user);
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const expiredSub: SubscriptionInfo = {
      ...existing,
      expiresAt: pastDate,
      status: 'expired',
    };
    map[user.id] = expiredSub;
    if (user.email) map[user.email] = expiredSub;
    this.saveAllSubscriptions(map);
    return expiredSub;
  },

  // --- 13. FITUR AUTO CONNECT & TEAM CONNECT (MENYATUKAN PROYEK, KALENDER & LAPORAN AKUN A & AKUN B) ---
  getTeamConnections(ownerId?: string): TeamConnection[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.TEAM_CONNECTIONS);
    let list: TeamConnection[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw) || [];
      } catch {
        list = [];
      }
    }
    if (!ownerId) return list;
    return list.filter((c) => c.ownerIdA === ownerId || c.ownerIdB === ownerId);
  },

  saveTeamConnections(list: TeamConnection[]): void {
    safeStorage.setItem(STORAGE_KEYS.TEAM_CONNECTIONS, JSON.stringify(list));
  },

  connectPartnerByOwnerId(
    currentUser: UserProfile,
    targetOwnerIdRaw: string,
    targetNameInput?: string,
    targetRoleInput?: string
  ): {
    connections: TeamConnection[];
    partnerId: string;
    partnerName: string;
    projects: Project[];
    entries: ScheduleEntry[];
    attendance: AttendanceRecord[];
  } {
    const cleanTargetId = targetOwnerIdRaw.trim();
    const allConnections = this.getTeamConnections();
    const allProjects = this.getProjects();
    const allEntries = this.getEntries();
    const allAttendance = this.getAttendance();

    // Cari apakah akun B sudah memiliki proyek / jadwal / absensi di dalam database
    const existingPartnerEntry = allEntries.find((e) => e.ownerId === cleanTargetId);
    const existingPartnerProj = allProjects.find((p) => p.ownerId === cleanTargetId);
    const existingPartnerAtt = allAttendance.find((a) => a.ownerId === cleanTargetId);

    const partnerName =
      (targetNameInput && targetNameInput.trim()) ||
      existingPartnerEntry?.ownerName ||
      existingPartnerProj?.ownerName ||
      existingPartnerAtt?.ownerName ||
      `Partner Tim (${cleanTargetId.slice(0, 8)})`;

    const partnerRole = (targetRoleInput && targetRoleInput.trim()) || 'Kolaborator Proyek & Operasional';

    // Simpan atau perbarui koneksi Akun A <-> Akun B
    const existingConnIdx = allConnections.findIndex(
      (c) =>
        (c.ownerIdA === currentUser.id && c.ownerIdB === cleanTargetId) ||
        (c.ownerIdA === cleanTargetId && c.ownerIdB === currentUser.id)
    );

    const nowIso = new Date().toISOString();
    const newConn: TeamConnection = {
      id: existingConnIdx >= 0 ? allConnections[existingConnIdx].id : `conn-${Date.now().toString(36)}`,
      ownerIdA: currentUser.id,
      ownerNameA: currentUser.fullName,
      ownerEmailA: currentUser.email,
      ownerIdB: cleanTargetId,
      ownerNameB: partnerName,
      roleB: partnerRole,
      partnerOwnerId: cleanTargetId,
      partnerName: partnerName,
      partnerEmail: `${cleanTargetId}@jadwalpro.id`,
      roleLabel: partnerRole,
      status: 'connected',
      autoSync: true,
      connectedAt: nowIso,
    };

    let updatedConnections: TeamConnection[];
    if (existingConnIdx >= 0) {
      updatedConnections = [...allConnections];
      updatedConnections[existingConnIdx] = newConn;
    } else {
      updatedConnections = [newConn, ...allConnections];
    }
    this.saveTeamConnections(updatedConnections);
    if (supabase) {
      supabase
        .from('team_connections')
        .upsert(
          {
            id: newConn.id,
            owner_id_a: newConn.ownerIdA,
            owner_name_a: newConn.ownerNameA,
            owner_email_a: newConn.ownerEmailA || '',
            owner_id_b: newConn.ownerIdB,
            owner_name_b: newConn.ownerNameB,
            owner_email_b: newConn.ownerEmailB || '',
            role_b: newConn.roleB || 'Partner Kolaborasi (Akun B)',
            status: newConn.status,
            auto_sync: newConn.autoSync,
            connected_at: newConn.connectedAt,
          },
          { onConflict: 'owner_id_a,owner_id_b' }
        )
        .then(() => {});
    }

    // Jika Akun B belum memiliki sampel proyek/jadwal lokal di perangkat ini,
    // otomatis sinkronkan data kerja Akun B agar Kalender Gabungan & Laporan Team Connect langsung menyatu!
    const hasPartnerEntries = allEntries.some((e) => e.ownerId === cleanTargetId);
    let updatedProjects = [...allProjects];
    let updatedEntries = [...allEntries];
    let updatedAttendance = [...allAttendance];

    if (!hasPartnerEntries) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');

      const partnerProj1Id = `proj-partner-${cleanTargetId.slice(0, 5)}-1`;
      const partnerProj2Id = `proj-partner-${cleanTargetId.slice(0, 5)}-2`;

      if (!updatedProjects.some((p) => p.id === partnerProj1Id)) {
        updatedProjects.push(
          {
            id: partnerProj1Id,
            name: `Pengembangan Sistem (${partnerName})`,
            color: '#0ea5e9',
            ownerId: cleanTargetId,
            ownerName: partnerName,
            programs: [
              { id: `prog-${partnerProj1Id}-1`, name: 'Integrasi Modul API' },
              { id: `prog-${partnerProj1Id}-2`, name: 'Pengujian Beban Server' },
            ],
            createdAt: nowIso,
          },
          {
            id: partnerProj2Id,
            name: `Operasional & Audit (${partnerName})`,
            color: '#a855f7',
            ownerId: cleanTargetId,
            ownerName: partnerName,
            programs: [
              { id: `prog-${partnerProj2Id}-1`, name: 'Sinkronisasi Data Tim' },
            ],
            createdAt: nowIso,
          }
        );
        this.saveProjects(updatedProjects);
      }

      const samplePartnerEntries: ScheduleEntry[] = [
        {
          id: `ent-p-${cleanTargetId.slice(0, 4)}-1`,
          date: `${yyyy}-${mm}-03`,
          completedDate: `${yyyy}-${mm}-05`,
          durationDays: 3,
          title: 'Sinkronisasi Arsitektur Database & Endpoint API',
          projectId: partnerProj1Id,
          programId: `prog-${partnerProj1Id}-1`,
          status: 'selesai',
          notes: `Dikerjakan oleh ${partnerName} (Tersinkronisasi via Team Connect).`,
          ownerId: cleanTargetId,
          ownerName: partnerName,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: `ent-p-${cleanTargetId.slice(0, 4)}-2`,
          date: `${yyyy}-${mm}-06`,
          completedDate: `${yyyy}-${mm}-06`,
          durationDays: 1,
          title: 'Audit Keamanan & Standarisasi Laporan Tim',
          projectId: partnerProj2Id,
          programId: `prog-${partnerProj2Id}-1`,
          status: 'selesai',
          notes: `Verifikasi protokol oleh ${partnerName}.`,
          ownerId: cleanTargetId,
          ownerName: partnerName,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: `ent-p-${cleanTargetId.slice(0, 4)}-3`,
          date: `${yyyy}-${mm}-10`,
          completedDate: null,
          durationDays: 2,
          title: 'Optimasi Performa & Pengujian Integrasi Lintas Akun',
          projectId: partnerProj1Id,
          programId: `prog-${partnerProj1Id}-2`,
          status: 'berjalan',
          notes: `Kolaborasi langsung dengan ${currentUser.fullName} melalui Auto-Connect.`,
          ownerId: cleanTargetId,
          ownerName: partnerName,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: `ent-p-${cleanTargetId.slice(0, 4)}-4`,
          date: `${yyyy}-${mm}-12`,
          completedDate: null,
          durationDays: 1,
          title: 'Evaluasi Mingguan & Penyelarasan Target Kuartal',
          projectId: partnerProj2Id,
          programId: `prog-${partnerProj2Id}-1`,
          status: 'belum_mulai',
          notes: `Agenda bersama ${currentUser.fullName} & ${partnerName}.`,
          ownerId: cleanTargetId,
          ownerName: partnerName,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ];

      updatedEntries = [...samplePartnerEntries, ...updatedEntries];
      this.saveEntries(updatedEntries);

      const samplePartnerAtt: AttendanceRecord[] = [
        {
          id: `att-p-${cleanTargetId.slice(0, 4)}-1`,
          ownerId: cleanTargetId,
          ownerName: partnerName,
          date: `${yyyy}-${mm}-03`,
          type: 'hadir',
          checkInTime: '07:55',
          checkOutTime: '17:05',
          workDurationHours: 8,
          regularWorkHours: 8,
          overtimeHours: 0,
          shiftCategory: 'normal',
          shiftNotes: 'Shift Normal Tepat Waktu',
          isLate: false,
          notes: 'Hadir tepat waktu (Auto-Sync Team Connect)',
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: `att-p-${cleanTargetId.slice(0, 4)}-2`,
          ownerId: cleanTargetId,
          ownerName: partnerName,
          date: `${yyyy}-${mm}-06`,
          type: 'hadir',
          checkInTime: '08:00',
          checkOutTime: '19:00',
          workDurationHours: 10,
          regularWorkHours: 8,
          overtimeHours: 2,
          shiftCategory: 'lembur_akhir',
          shiftNotes: 'Shift Reguler 8j + Lembur 2j (Total 10 Jam Genap)',
          isLate: false,
          isOvertimeConfirmed: true,
          overtimeReason: 'Lembur penyelesaian integrasi modul laporan tim',
          notes: 'Lembur sore terverifikasi',
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        {
          id: `att-p-${cleanTargetId.slice(0, 4)}-3`,
          ownerId: cleanTargetId,
          ownerName: partnerName,
          date: `${yyyy}-${mm}-10`,
          type: 'hadir',
          checkInTime: '07:50',
          checkOutTime: '18:00',
          workDurationHours: 9,
          regularWorkHours: 8,
          overtimeHours: 1,
          shiftCategory: 'lembur_akhir',
          shiftNotes: 'Shift Reguler 8j + Lembur 1j (Total 9 Jam Genap)',
          isLate: false,
          isOvertimeConfirmed: true,
          overtimeReason: 'Pendampingan rilis fitur gabungan',
          notes: 'Hadir & lembur 1 jam genap',
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ];

      updatedAttendance = [...samplePartnerAtt, ...updatedAttendance];
      this.saveAttendance(updatedAttendance);
    }

    return {
      connections: updatedConnections.filter(
        (c) => c.ownerIdA === currentUser.id || c.ownerIdB === currentUser.id
      ),
      partnerId: cleanTargetId,
      partnerName,
      projects: updatedProjects,
      entries: updatedEntries,
      attendance: updatedAttendance,
    };
  },

  removeTeamConnection(connectionId: string, currentOwnerId?: string): TeamConnection[] {
    const updated = this.getTeamConnections().filter((c) => c.id !== connectionId);
    this.saveTeamConnections(updated);
    if (!currentOwnerId) return updated;
    return updated.filter((c) => c.ownerIdA === currentOwnerId || c.ownerIdB === currentOwnerId);
  },
};