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
  Timer,
  FileSpreadsheet,
  Printer,
  CalendarCheck2,
  Coffee,
  Briefcase,
  Play,
  Square
} from 'lucide-react';
import AuthPage from './AuthPage';
import { PROJECT_COLORS } from './types';
import type { EntryStatus, Project, ScheduleEntry, UserProfile, AttendanceRecord, AttendanceType } from './types';
import { db, isSupabaseConfigured } from './db';

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

function getNowTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
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
    return { year: y || 2026, month: (m || 10) - 1 };
  }, [todayStr]);

  // Tab Navigasi Utama: 'calendar' | 'attendance' | 'report'
  const [activeMainTab, setActiveMainTab] = useState<'calendar' | 'attendance' | 'report'>('calendar');

  // State User & Auth
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    db.getSavedSession ? db.getSavedSession() : null
  );

  // State Data Jadwal, Proyek, & Absensi
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // State Navigasi Bulan (0 = Januari, 9 = Oktober)
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
  const [entryTitle, setEntryTitle] = useState<string>('');
  const [entryProjectId, setEntryProjectId] = useState<string>('');
  const [entryStatus, setEntryStatus] = useState<EntryStatus>('belum_mulai');
  const [entryNotes, setEntryNotes] = useState<string>('');
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<string | null>(null);

  // State Form Proyek
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectNameInput, setProjectNameInput] = useState<string>('');
  const [projectColorInput, setProjectColorInput] = useState<string>(PROJECT_COLORS[0].value);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  // State Absensi: Form Tambah/Pengajuan Izin, Cuti, & Koreksi
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState<boolean>(false);
  const [attDateInput, setAttDateInput] = useState<string>(todayStr);
  const [attTypeInput, setAttTypeInput] = useState<AttendanceType>('hadir');
  const [attCheckInInput, setAttCheckInInput] = useState<string>('08:30');
  const [attCheckOutInput, setAttCheckOutInput] = useState<string>('17:00');
  const [attNotesInput, setAttNotesInput] = useState<string>('');

  // State Laporan (Report) Filter
  const [reportOwnerFilter, setReportOwnerFilter] = useState<string>('MINE');

  // State UI Umum
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inisialisasi Data & Sinkronisasi Sesi
  useEffect(() => {
    const { projects: initProj, entries: initEnt } = db.init();
    setProjects(initProj);
    setEntries(initEnt);
    if (db.getAttendance) {
      setAttendance(db.getAttendance());
    }

    if (db.getCurrentUser) {
      db.getCurrentUser().then((user: UserProfile | null) => {
        if (user) setCurrentUser(user);
      });
    }

    if (db.fetchFromSupabase) {
      db.fetchFromSupabase().then((remote: any) => {
        if (remote) {
          setProjects(remote.projects);
          setEntries(remote.entries);
        }
      });
    }
  }, []);

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

  // Daftar Owner Unik untuk Filter Pekerjaan Siapa-Siapanya
  // Daftar Owner Unik (Hanya memuat akun yang sesuai, buang dummy 'owner-demo-1')
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

  // Entri Bulan Berjalan: Tampilkan murni sesuai owner_id user yang login
  const monthEntries = useMemo(() => {
    return entries.filter((e) => {
      if (!e.date.startsWith(currentMonthPrefix)) return false;
      // Jika user sudah login, jangan tampilkan data demo 'Tim Utama'
      if (currentUser && currentUser.id !== 'owner-demo-1' && e.ownerId === 'owner-demo-1') {
        return false;
      }
      if (ownerFilter === 'MINE' && currentUser) {
        return e.ownerId === currentUser.id;
      }
      if (ownerFilter !== 'ALL' && ownerFilter !== 'MINE') {
        return e.ownerId === ownerFilter;
      }
      return true;
    });
  }, [entries, currentMonthPrefix, ownerFilter, currentUser]);

  // KPI Jadwal Bulan Berjalan
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
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  }, [monthEntries, projectFilter, statusFilter, searchQuery, todayStr, projectMap]);

  const entriesByDate = useMemo(() => {
    const grouped: Record<string, ScheduleEntry[]> = {};
    filteredMonthEntries.forEach((e) => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return grouped;
  }, [filteredMonthEntries]);

  // Absensi Hari Ini untuk User yang Sedang Login
  const myTodayAttendance = useMemo(() => {
    if (!currentUser) return null;
    return (
      attendance.find(
        (a) => a.ownerId === currentUser.id && a.date === todayStr
      ) || null
    );
  }, [attendance, currentUser, todayStr]);

  // Absensi Bulan Berjalan
  const monthAttendance = useMemo(() => {
    return attendance
      .filter((a) => {
        if (!a.date.startsWith(currentMonthPrefix)) return false;
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
    const hadirCount = monthAttendance.filter((a) => a.type === 'hadir').length;
    const izinCount = monthAttendance.filter((a) => a.type === 'izin').length;
    const cutiCount = monthAttendance.filter((a) => a.type === 'cuti').length;
    const sakitCount = monthAttendance.filter((a) => a.type === 'sakit').length;

    const totalWorkHours = monthAttendance
      .filter((a) => a.type === 'hadir')
      .reduce((acc, curr) => acc + (curr.workDurationHours || 0), 0);

    const avgWorkHours = hadirCount > 0 ? (totalWorkHours / hadirCount).toFixed(1) : '0';

    return {
      totalRecords,
      hadirCount,
      izinCount,
      cutiCount,
      sakitCount,
      totalWorkHours: totalWorkHours.toFixed(1),
      avgWorkHours,
    };
  }, [monthAttendance]);

  // Data Khusus untuk Halaman Laporan (Report)
  const reportTargetOwner = useMemo(() => {
    if (!currentUser) return null;
    if (reportOwnerFilter === 'MINE') return currentUser;
    const found = uniqueOwners.find((o) => o.id === reportOwnerFilter);
    return found ? { id: found.id, fullName: found.name, email: '', phone: '', createdAt: '' } : currentUser;
  }, [reportOwnerFilter, currentUser, uniqueOwners]);

  const reportData = useMemo(() => {
    if (!reportTargetOwner) return null;
    const targetId = reportTargetOwner.id;

    const userAttendance = attendance.filter(
      (a) => a.ownerId === targetId && a.date.startsWith(currentMonthPrefix)
    );
    const totalHadir = userAttendance.filter((a) => a.type === 'hadir').length;
    const totalIzin = userAttendance.filter((a) => a.type === 'izin').length;
    const totalCuti = userAttendance.filter((a) => a.type === 'cuti').length;
    const totalSakit = userAttendance.filter((a) => a.type === 'sakit').length;
    const totalHours = userAttendance
      .filter((a) => a.type === 'hadir')
      .reduce((acc, curr) => acc + (curr.workDurationHours || 0), 0);
    const avgHours = totalHadir > 0 ? (totalHours / totalHadir).toFixed(1) : '0';

    const userEntries = entries.filter(
      (e) => e.ownerId === targetId && e.date.startsWith(currentMonthPrefix)
    );
    const totalTasks = userEntries.length;
    const finishedTasks = userEntries.filter((e) => e.status === 'selesai').length;
    const inProgressTasks = userEntries.filter((e) => e.status === 'berjalan').length;
    const pendingTasks = userEntries.filter((e) => e.status === 'belum_mulai').length;
    const overdueTasks = userEntries.filter(
      (e) => e.date < todayStr && e.status !== 'selesai'
    ).length;

    const projectBreakdown: Array<{ name: string; color: string; count: number; finished: number }> = [];
    const countByProj: Record<string, { count: number; finished: number }> = {};
    userEntries.forEach((e) => {
      const pid = e.projectId || 'none';
      if (!countByProj[pid]) countByProj[pid] = { count: 0, finished: 0 };
      countByProj[pid].count += 1;
      if (e.status === 'selesai') countByProj[pid].finished += 1;
    });

    Object.entries(countByProj).forEach(([pid, stat]) => {
      if (pid === 'none') {
        projectBreakdown.push({
          name: 'Tanpa Proyek',
          color: '#64748b',
          count: stat.count,
          finished: stat.finished,
        });
      } else {
        const p = projectMap[pid];
        projectBreakdown.push({
          name: p ? p.name : 'Proyek',
          color: p ? p.color : '#6366f1',
          count: stat.count,
          finished: stat.finished,
        });
      }
    });

    const taskScore = totalTasks > 0 ? (finishedTasks / totalTasks) * 60 : 60;
    const attendanceScore = (totalHadir / Math.max(1, totalHadir + totalIzin + totalSakit)) * 40;
    const performanceScore = Math.min(100, Math.round(taskScore + attendanceScore));

    return {
      owner: reportTargetOwner,
      userAttendance,
      userEntries,
      totalHadir,
      totalIzin,
      totalCuti,
      totalSakit,
      totalHours: totalHours.toFixed(1),
      avgHours,
      totalTasks,
      finishedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      projectBreakdown,
      performanceScore,
    };
  }, [reportTargetOwner, attendance, entries, currentMonthPrefix, todayStr, projectMap]);

  // Kalender Grid Cells
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

  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries
      .filter((e) => {
        if (e.date !== selectedDate) return false;
        if (currentUser && currentUser.id !== 'owner-demo-1') {
          return e.ownerId === currentUser.id;
        }
        return true;
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [entries, selectedDate, currentUser]);

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
      showToast(`Catatan ditambahkan (Owner: ${currentUser?.fullName || 'User'})`);
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
      showToast(`Proyek dibuat (Owner: ${currentUser?.fullName || 'User'})`);
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

  const handleQuickClockIn = () => {
    if (!currentUser) return;
    const nowTime = getNowTimeStr();
    const updated = db.recordAttendance(
      {
        date: todayStr,
        type: 'hadir',
        checkInTime: nowTime,
        notes: 'Check-in hadir harian.',
      },
      currentUser
    );
    setAttendance(updated);
    showToast(`Clock In berhasil pada pukul ${nowTime}!`);
  };

  const handleQuickClockOut = () => {
    if (!currentUser) return;
    const nowTime = getNowTimeStr();
    const updated = db.recordAttendance(
      {
        date: todayStr,
        type: 'hadir',
        checkOutTime: nowTime,
        notes: myTodayAttendance?.notes || 'Selesai jam kerja harian.',
      },
      currentUser
    );
    setAttendance(updated);
    showToast(`Clock Out berhasil pada pukul ${nowTime}!`);
  };

  const openNewAttendanceModal = () => {
    setAttDateInput(todayStr);
    setAttTypeInput('izin');
    setAttCheckInInput('08:30');
    setAttCheckOutInput('17:00');
    setAttNotesInput('');
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendanceForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated = db.recordAttendance(
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

  const handleDeleteAttendance = (id: string) => {
    const updated = db.deleteAttendance(id);
    setAttendance(updated);
    showToast('Data absensi dihapus.');
  };

  const handleResetDemoData = () => {
    const { projects: seedP, entries: seedE, attendance: seedA } = db.resetToSeed();
    setProjects(seedP);
    setEntries(seedE);
    setAttendance(seedA);
    setCurrentYear(2026);
    setCurrentMonth(9);
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

  const copyReportSummary = () => {
    if (!reportData) return;
    const lines = [
      `*LAPORAN KINERJA & PERFORMA KERJA*`,
      `Nama Owner: ${reportData.owner.fullName} (${reportData.owner.id})`,
      `Periode: ${INDONESIAN_MONTHS[currentMonth]} ${currentYear}`,
      `----------------------------------------`,
      `*1. RINGKASAN ABSENSI & KEHADIRAN*`,
      `- Total Hadir: ${reportData.totalHadir} Hari`,
      `- Izin: ${reportData.totalIzin} Hari`,
      `- Cuti: ${reportData.totalCuti} Hari`,
      `- Sakit: ${reportData.totalSakit} Hari`,
      `- Total Jam Kerja: ${reportData.totalHours} Jam (Rata-rata: ${reportData.avgHours} jam/hari)`,
      ``,
      `*2. RINGKASAN PEKERJAAN & PROYEK*`,
      `- Total Tugas: ${reportData.totalTasks}`,
      `- Selesai: ${reportData.finishedTasks} tugas (${reportData.totalTasks > 0 ? Math.round((reportData.finishedTasks / reportData.totalTasks) * 100) : 0}%)`,
      `- Sedang Berjalan: ${reportData.inProgressTasks} tugas`,
      `- Belum Mulai: ${reportData.pendingTasks} tugas`,
      `- Terlambat: ${reportData.overdueTasks} tugas`,
      `- Skor Produktivitas: ${reportData.performanceScore}/100`,
      ``,
      `*3. DAFTAR TUGAS UTAMA*`,
      ...reportData.userEntries.slice(0, 8).map((e, idx) => `${idx + 1}. [${e.status.toUpperCase()}] ${e.title} (${e.date})`),
    ];
    copyCodeToClipboard(lines.join('\n'), 'Ringkasan Laporan');
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Tampilkan AuthPage jika user belum login
  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Selamat datang, ${user.fullName}!`);
          if (db.fetchFromSupabase) {
            db.fetchFromSupabase().then((remote: any) => {
              if (remote) {
                setProjects(remote.projects);
                setEntries(remote.entries);
              }
            });
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans print:bg-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 border border-slate-700 print:hidden">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
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
                  Proyek • Absensi • Laporan
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Workspace Kinerja &amp; Jadwal Tim
              </p>
            </div>
          </div>

          {/* TAB NAVIGASI UTAMA DI HEADER */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMainTab('calendar')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Jadwal Proyek</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('attendance')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'attendance'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Absensi &amp; Kehadiran</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('report')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'report'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Laporan Kinerja</span>
            </button>
          </div>

          {/* Profil User & Tombol Aksi */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="font-bold text-slate-900 truncate max-w-[120px]">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentUser.id.slice(0, 10)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetDemoData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Reset Data Contoh Oktober 2026"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Contoh</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
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
            onClick={() => setActiveMainTab('report')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-center whitespace-nowrap ${
              activeMainTab === 'report' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Laporan
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex relative">
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR PROYEK & WIDGET QUICK CLOCK IN/OUT */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out print:hidden ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
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
                onClick={handleQuickClockIn}
                disabled={Boolean(myTodayAttendance?.checkInTime)}
                className="py-1.5 px-2 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center gap-1 shadow-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Clock In</span>
              </button>
              <button
                type="button"
                onClick={handleQuickClockOut}
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

            {projects.filter((proj) => !currentUser || currentUser.id === 'owner-demo-1' || proj.ownerId === currentUser.id).map((proj) => {
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

        {/* AREA KONTEN */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
          {/* TAB 1: KALENDER */}
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
                                  title={`${entry.title} • Owner: ${entry.ownerName}`}
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
                <section className="space-y-4">
                  {Object.keys(entriesByDate).length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <CalendarIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">
                        Belum Ada Catatan di Bulan Ini
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
                    Object.entries(entriesByDate).map(([dateStr, dayList]) => (
                      <div
                        key={dateStr}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                      >
                        <div
                          onClick={() => openDayDrawer(dateStr)}
                          className="px-4 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer bg-slate-50/70"
                        >
                          <span className="font-bold text-sm text-slate-900">
                            {formatDateFullIndo(dateStr)}
                          </span>
                          <span className="text-xs font-medium text-indigo-600 hover:underline">
                            + Tambah / Detail ({dayList.length})
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {dayList.map((entry) => {
                            const proj = entry.projectId ? projectMap[entry.projectId] : null;
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

                                    <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                      Owner: {entry.ownerName}
                                    </span>

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
                      </div>
                    ))
                  )}
                </section>
              )}
            </>
          )}

          {/* TAB 2: ABSENSI, IZIN, CUTI & JAM KERJA */}
          {activeMainTab === 'attendance' && (
            <div className="space-y-5">
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Kehadiran
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CalendarCheck2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                      {attendanceStats.hadirCount}
                    </span>
                    <span className="text-xs text-slate-500">Hari Hadir</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Izin &amp; Cuti
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Coffee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-amber-600">
                      {attendanceStats.izinCount + attendanceStats.cutiCount}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({attendanceStats.izinCount} Izin, {attendanceStats.cutiCount} Cuti)
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Jam Kerja
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Timer className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-indigo-600">
                      {attendanceStats.totalWorkHours}
                    </span>
                    <span className="text-xs text-slate-500">Jam tercatat</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rata-Rata Jam / Hari
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {attendanceStats.avgWorkHours}
                    </span>
                    <span className="text-xs text-slate-500">Jam per hari hadir</span>
                  </div>
                </div>
              </section>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 text-sm">
                    Riwayat Kehadiran ({INDONESIAN_MONTHS[currentMonth]} {currentYear})
                  </span>
                  <div className="relative">
                    <select
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
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

                <button
                  type="button"
                  onClick={openNewAttendanceModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajukan Izin / Cuti / Koreksi Jam</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Owner / Anggota</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Jam Masuk</th>
                        <th className="py-3 px-4">Jam Pulang</th>
                        <th className="py-3 px-4">Lama Kerja</th>
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
                              <td className="py-3.5 px-4 font-semibold text-indigo-700 whitespace-nowrap">
                                {rec.workDurationHours > 0 ? `${rec.workDurationHours} Jam` : '-'}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                                {rec.notes || '-'}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
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

          {/* TAB 3: LAPORAN KINERJA */}
          {activeMainTab === 'report' && reportData && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 text-sm">
                    Laporan Kinerja Periode:
                  </span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-xs">
                    {INDONESIAN_MONTHS[currentMonth]} {currentYear}
                  </span>
                  <div className="relative">
                    <select
                      value={reportOwnerFilter}
                      onChange={(e) => setReportOwnerFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
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
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyReportSummary}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks Laporan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak / PDF</span>
                  </button>
                </div>
              </div>

              {/* DOKUMEN LAPORAN */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Dokumen Kinerja Bulanan
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                      Laporan Aktivitas Pekerjaan &amp; Kehadiran
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Periode Evaluasi: {INDONESIAN_MONTHS[currentMonth]} {currentYear}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-right sm:min-w-[200px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Nama Anggota / Owner
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {reportData.owner.fullName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Owner ID: {reportData.owner.id}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                        Indeks Produktivitas &amp; Disiplin
                      </span>
                      <div className="text-3xl font-extrabold mt-1">
                        {reportData.performanceScore}%
                      </div>
                    </div>
                    <p className="text-[11px] text-indigo-100 mt-3 leading-relaxed">
                      Kombinasi rasio penyelesaian tugas tepat waktu ({reportData.finishedTasks}/{reportData.totalTasks} tugas)
                      serta rasio kehadiran efektif ({reportData.totalHadir} hari).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Total Jam Kerja Efektif
                    </span>
                    <div className="text-2xl font-bold text-slate-900">
                      {reportData.totalHours} Jam
                    </div>
                    <div className="text-xs text-slate-600">
                      Rata-rata <strong>{reportData.avgHours} jam/hari</strong> selama periode bulan ini.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Tugas Selesai Tuntas
                    </span>
                    <div className="text-2xl font-bold text-emerald-600">
                      {reportData.finishedTasks} dari {reportData.totalTasks} Tugas
                    </div>
                    <div className="text-xs text-slate-600">
                      {reportData.inProgressTasks} tugas berjalan • {reportData.overdueTasks} tugas terlambat.
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <CalendarCheck2 className="w-4 h-4 text-indigo-600" />
                    <span>1. Rincian Kehadiran &amp; Absensi</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-xs font-bold text-emerald-800">HADIR</div>
                      <div className="text-xl font-bold text-emerald-600 mt-1">
                        {reportData.totalHadir} Hari
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <div className="text-xs font-bold text-amber-800">IZIN</div>
                      <div className="text-xl font-bold text-amber-600 mt-1">
                        {reportData.totalIzin} Hari
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center">
                      <div className="text-xs font-bold text-purple-800">CUTI</div>
                      <div className="text-xl font-bold text-purple-600 mt-1">
                        {reportData.totalCuti} Hari
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                      <div className="text-xs font-bold text-rose-800">SAKIT</div>
                      <div className="text-xl font-bold text-rose-600 mt-1">
                        {reportData.totalSakit} Hari
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>2. Kontribusi Berdasarkan Proyek</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {reportData.projectBreakdown.map((pb) => (
                      <div
                        key={pb.name}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5"
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: pb.color }}
                          />
                          <span className="truncate">{pb.name}</span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {pb.finished} / {pb.count} Tugas Selesai
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              backgroundColor: pb.color,
                              width: pb.count > 0 ? `${(pb.finished / pb.count) * 100}%` : '0%',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>3. Log Rincian Tugas yang Dikerjakan ({reportData.userEntries.length})</span>
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Tanggal</th>
                          <th className="py-2.5 px-3">Proyek</th>
                          <th className="py-2.5 px-3">Judul Tugas</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.userEntries.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500">
                              Tidak ada entri tugas tercatat untuk owner ini pada bulan berjalan.
                            </td>
                          </tr>
                        ) : (
                          reportData.userEntries.map((e) => {
                            const p = e.projectId ? projectMap[e.projectId] : null;
                            return (
                              <tr key={e.id} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                                  {e.date}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {p ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border"
                                      style={{
                                        backgroundColor: `${p.color}15`,
                                        borderColor: `${p.color}40`,
                                        color: '#1e293b',
                                      }}
                                    >
                                      {p.name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Tanpa proyek</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {e.title}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_META[e.status].badgeClass}`}
                                  >
                                    {STATUS_META[e.status].label}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                                  {e.notes || '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tanda Tangan */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-600 print:pt-12">
                  <div>
                    <p>Dibuat oleh,</p>
                    <div className="h-14" />
                    <p className="font-bold text-slate-900 underline">
                      {reportData.owner.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500">Owner ID: {reportData.owner.id}</p>
                  </div>
                  <div>
                    <p>Mengetahui,</p>
                    <div className="h-14" />
                    <p className="font-bold text-slate-900 underline">Project Lead / HR</p>
                    <p className="text-[10px] text-slate-500">JadwalPro System Verification</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
                <h3 className="text-base font-bold text-slate-900">
                  Form Absensi, Izin &amp; Cuti
                </h3>
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

      {/* MODAL TAMBAH PROYEK */}
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
    </div>
  );
}