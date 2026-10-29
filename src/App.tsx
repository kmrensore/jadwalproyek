import React, { useState, useEffect, useMemo } from 'react';
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
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Copy,
  Menu,
  User as UserIcon,
  LogOut,
  Users,
} from 'lucide-react';
import AuthPage from './AuthPage';
import { PROJECT_COLORS } from './types';
import type { EntryStatus, Project, ScheduleEntry, UserProfile } from './types';
import { db, isSupabaseConfigured } from './db';

// ============================================================================
// UTILITAS TANGGAL & FORMATTER
// ============================================================================

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
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

function formatDateFullIndo(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  const dayName = INDONESIAN_DAYS_FULL[dateObj.getDay()];
  const monthName = INDONESIAN_MONTHS[m - 1];
  return `${dayName}, ${d} ${monthName} ${y}`;
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

// ============================================================================
// KOMPONEN UTAMA APLIKASI
// ============================================================================

export default function App() {
  // Referensi "Hari Ini" (default ke tanggal sistem; Oktober 2026 sesuai konteks)
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const initialYearMonth = useMemo(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return { year: y || 2026, month: (m || 10) - 1 };
  }, [todayStr]);

  // State User Login (Owner Aktif)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    db.getSavedSession()
  );

  // State Data Utama
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);

  // State Navigasi Bulan (0 = Januari, 9 = Oktober)
  const [currentYear, setCurrentYear] = useState<number>(initialYearMonth.year);
  const [currentMonth, setCurrentMonth] = useState<number>(initialYearMonth.month);

  // State Filter & Tampilan Toolbar
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EntryStatus | 'OVERDUE'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL'); // 'ALL' | 'NONE' | projectId
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL'); // 'ALL' | 'MINE' | ownerId

  // State Drawer Detail Hari (Klik Tanggal)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryTitle, setEntryTitle] = useState<string>('');
  const [entryProjectId, setEntryProjectId] = useState<string>(''); // '' = Tanpa proyek
  const [entryStatus, setEntryStatus] = useState<EntryStatus>('belum_mulai');
  const [entryNotes, setEntryNotes] = useState<string>('');
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<string | null>(null);

  // State Form Proyek di Sidebar
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectNameInput, setProjectNameInput] = useState<string>('');
  const [projectColorInput, setProjectColorInput] = useState<string>(PROJECT_COLORS[0].value);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  // State Mobile Sidebar & Modal Panduan Supabase + Vercel
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [guideTab, setGuideTab] = useState<'sql' | 'db' | 'vercel'>('sql');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inisialisasi Data dari localStorage & Sinkronisasi Supabase
  useEffect(() => {
    const { projects: initProj, entries: initEnt } = db.init();
    setProjects(initProj);
    setEntries(initEnt);

    db.getCurrentUser().then((user) => {
      if (user) setCurrentUser(user);
    });

    db.fetchFromSupabase().then((remote) => {
      if (remote) {
        setProjects(remote.projects);
        setEntries(remote.entries);
      }
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleLogout = async () => {
    await db.signOut();
    setCurrentUser(null);
    setSelectedDate(null);
    showToast('Berhasil keluar dari akun');
  };

  // Daftar Owner Unik untuk Filter Pekerjaan Siapa-Siapanya
  const uniqueOwners = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    if (currentUser) {
      map.set(currentUser.id, { id: currentUser.id, name: currentUser.fullName });
    }
    projects.forEach((p) => {
      if (p.ownerId && !map.has(p.ownerId)) {
        map.set(p.ownerId, { id: p.ownerId, name: p.ownerName || 'User' });
      }
    });
    entries.forEach((e) => {
      if (e.ownerId && !map.has(e.ownerId)) {
        map.set(e.ownerId, { id: e.ownerId, name: e.ownerName || 'User' });
      }
    });
    return Array.from(map.values());
  }, [projects, entries, currentUser]);

  // Map projectId -> Project
  const projectMap = useMemo(() => {
    const map: Record<string, Project> = {};
    projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  // Prefix bulan berjalan (YYYY-MM)
  const currentMonthPrefix = useMemo(() => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  }, [currentYear, currentMonth]);

  // Semua entri pada bulan yang sedang dilihat (termasuk Filter Owner)
  const monthEntries = useMemo(() => {
    return entries.filter((e) => {
      if (!e.date.startsWith(currentMonthPrefix)) return false;
      if (ownerFilter === 'MINE' && currentUser) {
        return e.ownerId === currentUser.id;
      }
      if (ownerFilter !== 'ALL' && ownerFilter !== 'MINE') {
        return e.ownerId === ownerFilter;
      }
      return true;
    });
  }, [entries, currentMonthPrefix, ownerFilter, currentUser]);

  // KPI Bulan Berjalan (Total, Selesai, Berjalan, Terlambat)
  const kpiStats = useMemo(() => {
    const total = monthEntries.length;
    const selesai = monthEntries.filter((e) => e.status === 'selesai').length;
    const berjalan = monthEntries.filter((e) => e.status === 'berjalan').length;
    const terlambat = monthEntries.filter(
      (e) => e.date < todayStr && e.status !== 'selesai'
    ).length;
    return { total, selesai, berjalan, terlambat };
  }, [monthEntries, todayStr]);

  // Jumlah entri per proyek di bulan berjalan (untuk Sidebar Proyek)
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

  // Entri bulan berjalan yang sudah difilter (Proyek, Status, Search)
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

  // Grouping entri per tanggal untuk kalender & tampilan daftar
  const entriesByDate = useMemo(() => {
    const grouped: Record<string, ScheduleEntry[]> = {};
    filteredMonthEntries.forEach((e) => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return grouped;
  }, [filteredMonthEntries]);

  // Perhitungan sel Grid Kalender Bulanan (7 kolom, dimulai hari Senin)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
    }> = [];

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

  // Entri khusus untuk tanggal yang diklik di Drawer Detail Hari
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [entries, selectedDate]);

  // Navigasi Bulan
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
    openDayDrawer(todayStr);
  };

  // Buka Drawer Detail Hari & siapkan form catatan
  const openDayDrawer = (dateStr: string) => {
    setSelectedDate(dateStr);
    resetEntryForm(projectFilter !== 'ALL' && projectFilter !== 'NONE' ? projectFilter : '');
  };

  const resetEntryForm = (defaultProjId = '') => {
    setEditingEntryId(null);
    setEntryTitle('');
    setEntryProjectId(defaultProjId);
    setEntryStatus('belum_mulai');
    setEntryNotes('');
    setConfirmDeleteEntryId(null);
  };

  const handleStartEditEntry = (entry: ScheduleEntry) => {
    setEditingEntryId(entry.id);
    setEntryTitle(entry.title);
    setEntryProjectId(entry.projectId || '');
    setEntryStatus(entry.status);
    setEntryNotes(entry.notes);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !entryTitle.trim()) return;

    if (editingEntryId) {
      const updated = db.updateEntry(editingEntryId, {
        title: entryTitle.trim(),
        projectId: entryProjectId || null,
        status: entryStatus,
        notes: entryNotes.trim(),
      });
      setEntries(updated);
      showToast('Catatan berhasil diperbarui');
    } else {
      const updated = db.createEntry(
        {
          date: selectedDate,
          title: entryTitle.trim(),
          projectId: entryProjectId || null,
          status: entryStatus,
          notes: entryNotes.trim(),
        },
        currentUser
      );
      setEntries(updated);
      showToast(`Catatan baru ditambahkan (Owner: ${currentUser?.fullName || 'User'})`);
    }
    resetEntryForm(projectFilter !== 'ALL' && projectFilter !== 'NONE' ? projectFilter : '');
  };

  const handleQuickCycleStatus = (entry: ScheduleEntry) => {
    const order: EntryStatus[] = ['belum_mulai', 'berjalan', 'selesai'];
    const nextStatus = order[(order.indexOf(entry.status) + 1) % order.length];
    const updated = db.updateEntry(entry.id, { status: nextStatus });
    setEntries(updated);
    showToast(`Status diubah ke "${STATUS_META[nextStatus].label}"`);
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

  // Operasi CRUD Proyek di Sidebar
  const openCreateProjectModal = () => {
    setEditingProject(null);
    setProjectNameInput('');
    setProjectColorInput(PROJECT_COLORS[projects.length % PROJECT_COLORS.length].value);
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (proj: Project) => {
    setEditingProject(proj);
    setProjectNameInput(proj.name);
    setProjectColorInput(proj.color);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectNameInput.trim()) return;

    if (editingProject) {
      const updated = db.updateProject(editingProject.id, projectNameInput, projectColorInput);
      setProjects(updated);
      showToast('Proyek diperbarui');
    } else {
      const updated = db.createProject(projectNameInput, projectColorInput, currentUser);
      setProjects(updated);
      showToast(`Proyek baru ditambahkan (Owner: ${currentUser?.fullName || 'User'})`);
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
    showToast('Proyek dihapus, catatan dialihkan ke "Tanpa proyek"');
  };

  const handleResetDemoData = () => {
    const { projects: seedP, entries: seedE } = db.resetToSeed();
    setProjects(seedP);
    setEntries(seedE);
    setCurrentYear(2026);
    setCurrentMonth(9); // Oktober 2026
    setProjectFilter('ALL');
    setStatusFilter('ALL');
    setOwnerFilter('ALL');
    setSearchQuery('');
    showToast('Data contoh Oktober 2026 berhasil di-reset');
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

  // JIKA BELUM LOGIN, TAMPILKAN HALAMAN PENDAFTARAN & LOGIN (AuthPage)
  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Selamat datang, ${user.fullName}!`);
          db.fetchFromSupabase().then((remote) => {
            if (remote) {
              setProjects(remote.projects);
              setEntries(remote.entries);
            }
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 border border-slate-700">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
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
                  Owner ID Tracking
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Penjadwalan Proyek Bulanan & Catatan Harian
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge Profil User / Owner yang Sedang Login */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px]">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="font-bold text-slate-800">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  ID: {currentUser.id.slice(0, 12)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Supabase & Vercel Guide</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemoData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Kembalikan 3 proyek & 12 entri contoh Oktober 2026"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Contoh</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
              title="Keluar / Ganti Akun"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex relative">
        {/* Mobile Sidebar Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* 3. SIDEBAR PROYEK */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Info Owner Aktif di Sidebar */}
          <div className="p-3.5 m-3 mb-1 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Owner Aktif
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white text-indigo-700 font-mono text-[10px] border border-indigo-200">
                {currentUser.id.slice(0, 12)}
              </span>
            </div>
            <div className="font-bold text-xs text-slate-900 truncate">
              {currentUser.fullName}
            </div>
            <div className="text-[11px] text-slate-600 truncate">
              {currentUser.email} • {currentUser.phone}
            </div>
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
            {/* Filter: Semua Proyek */}
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

            {/* Daftar Proyek dengan Color Dot + Owner + Jumlah Entri Bulan Ini */}
            {projects.map((proj) => {
              const count = projectMonthCounts[proj.id] || 0;
              const isSelected = projectFilter === proj.id;
              const isConfirmingDelete = confirmDeleteProjectId === proj.id;

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
                        {proj.ownerName && (
                          <div className="text-[10px] text-slate-400 truncate">
                            Owner: {proj.ownerName}
                          </div>
                        )}
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
                          title="Edit proyek"
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

                  {/* Konfirmasi Hapus Proyek In-Page */}
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

            {/* Filter: Tanpa Proyek */}
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

          {/* Info Arsitektur Singkat di Footer Sidebar */}
          <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>Mode Penyimpanan</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                {isSupabaseConfigured ? 'Supabase Cloud Aktif' : 'localStorage (db.ts)'}
              </span>
            </div>
            <p className="leading-relaxed text-slate-500">
              Setiap catatan baru otomatis ditandai dengan Owner ID milik{' '}
              <strong>{currentUser.fullName}</strong>.
            </p>
          </div>
        </aside>

        {/* AREA KONTEN UTAMA (KPI + Toolbar + Kalender / Daftar) */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
          {/* 5. KPI BULAN BERJALAN */}
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
                <span className="text-xs text-slate-500">lewat tanggal & belum selesai</span>
              </div>
            </div>
          </section>

          {/* 4. TOOLBAR & NAVIGASI BULAN */}
          <section className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Navigasi Bulan & Tombol Hari Ini */}
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

            {/* Search, Filter Owner, Filter Status, dan Toggle Kalender / Daftar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Input Search Judul & Isi Catatan */}
              <div className="relative flex-1 sm:flex-initial sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tugas, catatan, owner..."
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

              {/* Dropdown Filter Owner ID */}
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="ALL">Semua Owner (Tim)</option>
                  <option value="MINE">Pekerjaan Saya ({currentUser.fullName})</option>
                  {uniqueOwners
                    .filter((o) => o.id !== currentUser.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        Owner: {o.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Dropdown Filter Status */}
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

              {/* Toggle Tampilan Kalender / Daftar */}
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

          {/* Indikator Filter Aktif */}
          {(projectFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            ownerFilter !== 'ALL' ||
            searchQuery.trim() !== '') && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Filter Aktif:</span>
                {projectFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-full bg-white border border-indigo-200 font-medium">
                    Proyek:{' '}
                    {projectFilter === 'NONE'
                      ? 'Tanpa proyek'
                      : projectMap[projectFilter]?.name || 'Proyek'}
                  </span>
                )}
                {ownerFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-full bg-white border border-indigo-200 font-medium">
                    Owner:{' '}
                    {ownerFilter === 'MINE'
                      ? currentUser.fullName
                      : uniqueOwners.find((o) => o.id === ownerFilter)?.name || ownerFilter}
                  </span>
                )}
                {statusFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-full bg-white border border-indigo-200 font-medium">
                    Status:{' '}
                    {statusFilter === 'OVERDUE'
                      ? 'Terlambat'
                      : STATUS_META[statusFilter].label}
                  </span>
                )}
                {searchQuery.trim() !== '' && (
                  <span className="px-2 py-0.5 rounded-full bg-white border border-indigo-200 font-medium">
                    Pencarian: &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setProjectFilter('ALL');
                  setStatusFilter('ALL');
                  setOwnerFilter('ALL');
                  setSearchQuery('');
                }}
                className="font-semibold text-indigo-700 hover:underline"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* 1. KALENDER BULANAN (GRID 7 KOLOM) ATAU TAMPILAN DAFTAR */}
          {viewMode === 'calendar' ? (
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Header 7 Kolom Hari */}
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

              {/* Grid Sel Tanggal */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
                {calendarCells.map((cell) => {
                  const dayEntries = entriesByDate[cell.dateStr] || [];
                  const visibleEntries = dayEntries.slice(0, 3);
                  const remainingCount = dayEntries.length - visibleEntries.length;
                  const isToday = cell.dateStr === todayStr;
                  const isSelected = cell.dateStr === selectedDate;

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
                      {/* Baris Nomor Tanggal */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`inline-flex items-center justify-center text-xs sm:text-sm font-semibold w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-colors ${
                            isToday
                              ? 'bg-indigo-600 text-white font-bold shadow-sm'
                              : cell.isCurrentMonth
                              ? 'text-slate-700 group-hover:bg-slate-100'
                              : 'text-slate-400'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {isToday && (
                          <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            Hari Ini
                          </span>
                        )}
                      </div>

                      {/* Daftar Chip Proyek (Maks 3, sisanya "+N lagi") */}
                      <div className="space-y-1 flex-1">
                        {visibleEntries.map((entry) => {
                          const proj = entry.projectId ? projectMap[entry.projectId] : null;
                          const chipColor = proj ? proj.color : '#64748b';
                          const isOverdue =
                            entry.date < todayStr && entry.status !== 'selesai';

                          return (
                            <div
                              key={entry.id}
                              className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[11px] font-medium truncate border transition-transform group-hover:translate-x-0.5"
                              style={{
                                backgroundColor: `${chipColor}15`,
                                borderColor: `${chipColor}40`,
                                color: '#1e293b',
                              }}
                              title={`${entry.title} • Owner: ${entry.ownerName || 'Tim'} (${STATUS_META[entry.status].label})`}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: chipColor }}
                              />
                              <span
                                className={`truncate flex-1 ${
                                  entry.status === 'selesai'
                                    ? 'line-through text-slate-400'
                                    : ''
                                }`}
                              >
                                {entry.title}
                              </span>
                              {entry.ownerName && (
                                <span className="hidden md:inline-block text-[9px] font-semibold px-1 rounded bg-white/80 text-slate-600 shrink-0">
                                  {entry.ownerName.split(' ')[0]}
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
            /* TAMPILAN DAFTAR (AGENDA PER TANGGAL) */
            <section className="space-y-4">
              {Object.keys(entriesByDate).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Belum Ada Catatan di Bulan Ini
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Tidak ditemukan jadwal atau catatan yang cocok dengan filter saat ini. Klik
                    tombol di bawah untuk menambahkan catatan baru.
                  </p>
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
                Object.entries(entriesByDate).map(([dateStr, dayList]) => {
                  const isToday = dateStr === todayStr;
                  return (
                    <div
                      key={dateStr}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                    >
                      <div
                        onClick={() => openDayDrawer(dateStr)}
                        className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer ${
                          isToday ? 'bg-indigo-50/70' : 'bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {formatDateFullIndo(dateStr)}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-indigo-600 hover:underline">
                          + Tambah / Detail ({dayList.length})
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {dayList.map((entry) => {
                          const proj = entry.projectId ? projectMap[entry.projectId] : null;
                          const isOverdue =
                            entry.date < todayStr && entry.status !== 'selesai';

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
                                      style={{
                                        backgroundColor: proj ? proj.color : '#64748b',
                                      }}
                                    />
                                    {proj ? proj.name : 'Tanpa proyek'}
                                  </span>

                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <UserIcon className="w-3 h-3" />
                                    <span>
                                      {entry.ownerName || 'Tim'} (
                                      {(entry.ownerId || 'owner').slice(0, 10)})
                                    </span>
                                  </span>

                                  <h4
                                    className={`font-semibold text-sm text-slate-900 ${
                                      entry.status === 'selesai'
                                        ? 'line-through text-slate-400'
                                        : ''
                                    }`}
                                  >
                                    {entry.title}
                                  </h4>

                                  {isOverdue && (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                      Terlambat
                                    </span>
                                  )}
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
                                  title="Klik untuk mengganti status cepat"
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
                    </div>
                  );
                })
              )}
            </section>
          )}
        </main>
      </div>

      {/* =====================================================================
          2. KLIK TANGGAL -> PANEL DETAIL HARI
          Drawer dari kanan di desktop, Bottom Sheet di mobile
         ===================================================================== */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex justify-end items-end sm:items-stretch">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setSelectedDate(null)}
          />

          {/* Panel Konten: Bottom Sheet di Mobile (`rounded-t-3xl max-h-[88vh]`), Drawer Kanan di Desktop (`sm:w-[440px] sm:h-full`) */}
          <div className="relative z-10 w-full sm:w-[440px] max-h-[88vh] sm:max-h-none sm:h-full bg-white rounded-t-3xl sm:rounded-none shadow-2xl border-t sm:border-t-0 sm:border-l border-slate-200 flex flex-col overflow-hidden">
            {/* Drag Handle Mobile */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Header Drawer */}
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

            {/* Body Drawer: Daftar Catatan Hari Itu + Form Tambah/Edit */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Daftar Catatan pada Tanggal Tersebut */}
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
                    Belum ada catatan di tanggal ini. Isi formulir di bawah untuk menambahkan
                    jadwal proyek.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDateEntries.map((entry) => {
                      const proj = entry.projectId ? projectMap[entry.projectId] : null;
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
                                  entry.status === 'selesai'
                                    ? 'line-through text-slate-400'
                                    : ''
                                }`}
                              >
                                {entry.title}
                              </h5>

                              {/* Badge Owner ID pada Kartu Catatan */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                  <UserIcon className="w-3 h-3 text-indigo-600" />
                                  <span>{entry.ownerName || 'Tim'}</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px]">
                                  owner_id: {(entry.ownerId || 'owner-default').slice(0, 12)}
                                </span>
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
                              <span className="text-rose-700 font-medium">
                                Hapus catatan ini?
                              </span>
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
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Owner: {currentUser.fullName}
                  </span>
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
                    placeholder="Contoh: Review wireframe bersama tim..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proyek
                    </label>
                    <select
                      value={entryProjectId}
                      onChange={(e) => setEntryProjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">Tanpa proyek</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status
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

      {/* =====================================================================
          MODAL TAMBAH / EDIT PROYEK BESERTA WARNANYA
         ===================================================================== */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setIsProjectModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProject ? 'Edit Proyek' : 'Tambah Proyek Baru'}
              </h3>
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
                  Nama Proyek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  placeholder="Contoh: Peluncuran Aplikasi iOS..."
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

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {editingProject ? 'Simpan Proyek' : 'Buat Proyek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL PANDUAN LENGKAP: SUPABASE SQL + DB.TS + DEPLOY VERCEL
         ===================================================================== */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            onClick={() => setIsGuideOpen(false)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Panduan Migrasi Production: Supabase + Vercel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Semua operasi data diisolasi dalam modul db.ts agar komponen UI tidak perlu diubah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-3 border-b border-slate-200 flex gap-2 bg-white">
              <button
                type="button"
                onClick={() => setGuideTab('sql')}
                className={`px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                  guideTab === 'sql'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Skema SQL Supabase (Profiles & Owner ID)
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('db')}
                className={`px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                  guideTab === 'db'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Implementasi db.ts (Supabase)
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('vercel')}
                className={`px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                  guideTab === 'vercel'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Langkah Deploy ke Vercel
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
              {guideTab === 'sql' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-600">
                      Jalankan query ini di <strong>SQL Editor Supabase</strong>:
                    </p>
                    <button
                      type="button"
                      onClick={() => copyCodeToClipboard(SUPABASE_SQL_SNIPPET, 'Skema SQL')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin SQL</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
                    {SUPABASE_SQL_SNIPPET}
                  </pre>
                </div>
              )}

              {guideTab === 'db' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-600">
                      Contoh pemanggilan Supabase Auth &amp; Owner ID di <code>src/db.ts</code>:
                    </p>
                    <button
                      type="button"
                      onClick={() => copyCodeToClipboard(SUPABASE_DB_TS_SNIPPET, 'Kode db.ts')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin db.ts</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
                    {SUPABASE_DB_TS_SNIPPET}
                  </pre>
                </div>
              )}

              {guideTab === 'vercel' && (
                <div className="space-y-4 text-slate-700 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-2.5 font-medium">
                    <li>
                      Pastikan <strong>Confirm email</strong> sudah dimatikan di Supabase Dashboard
                      (<strong>Authentication → Providers → Email</strong>).
                    </li>
                    <li>
                      Push perubahan terbaru ke GitHub:{' '}
                      <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        git add . &amp;&amp; git commit -m "Add Auth &amp; Owner ID" &amp;&amp; git push
                      </code>
                    </li>
                    <li>
                      Pastikan Environment Variables <code>VITE_SUPABASE_URL</code> dan{' '}
                      <code>VITE_SUPABASE_ANON_KEY</code> sudah terpasang di Vercel.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SUPABASE_SQL_SNIPPET = `create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.projects
  add column if not exists owner_id text not null default 'owner-default',
  add column if not exists owner_name text not null default 'User';

alter table public.schedule_entries
  add column if not exists owner_id text not null default 'owner-default',
  add column if not exists owner_name text not null default 'User',
  add column if not exists owner_phone text not null default '',
  add column if not exists owner_email text not null default '';`;

const SUPABASE_DB_TS_SNIPPET = `// Contoh signUp dengan metadata Nama & No. Telepon di src/db.ts
const { data, error } = await supabase.auth.signUp({
  email: cleanEmail,
  password: payload.password,
  options: {
    data: { full_name: cleanName, phone: cleanPhone },
  },
});`;