-- ============================================================================
-- SKEMA & MIGRASI LENGKAP SUPABASE SQL: JADWALPRO TERBARU (FIXED FOR PROFILES)
-- Jalankan di: Supabase Dashboard -> SQL Editor -> Klik "Run" (Tombol Hijau)
-- Script ini bersifat aman (IDEMPOTENT / IF NOT EXISTS) sehingga tidak akan menghapus data lama.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABEL PROFILES (Biodata Pengguna, Kontak & Foto Profil)
-- Menggunakan owner_id (ID Auth User) sebagai primary key
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  owner_id text primary key,
  full_name text not null default 'User',
  phone text not null default '-',
  email text not null default '',
  avatar_url text default '',
  created_at timestamptz not null default now()
);

-- Kolom tambahan jika tabel profiles sudah ada sebelumnya
alter table public.profiles add column if not exists avatar_url text default '';
alter table public.profiles add column if not exists full_name text not null default 'User';
alter table public.profiles add column if not exists phone text not null default '-';
alter table public.profiles add column if not exists email text not null default '';

-- Trigger otomatis membuat profil saat Sign Up di Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (owner_id, full_name, phone, email, avatar_url)
  values (
    new.id::text,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', '-'),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (owner_id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. TABEL PROYEK (projects) + Cabang Program JSONB
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id text primary key default ('proj-' || substr(gen_random_uuid()::text, 1, 8)),
  owner_id text not null default 'owner-default',
  owner_name text not null default 'User',
  name text not null,
  color text not null default '#6366f1',
  programs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.projects add column if not exists owner_id text not null default 'owner-default';
alter table public.projects add column if not exists owner_name text not null default 'User';
alter table public.projects add column if not exists programs jsonb not null default '[]'::jsonb;

-- ----------------------------------------------------------------------------
-- 3. TABEL TUGAS JADWAL (schedule_entries) + Proyek Menyambung & Durasi
-- ----------------------------------------------------------------------------
create table if not exists public.schedule_entries (
  id text primary key default ('ent-' || substr(gen_random_uuid()::text, 1, 8)),
  owner_id text not null default 'owner-default',
  owner_name text not null default 'User',
  owner_phone text not null default '',
  owner_email text not null default '',
  project_id text references public.projects(id) on delete set null,
  program_id text,
  entry_date date not null,
  completed_date date,
  duration_days integer default 1,
  title text not null,
  status text not null check (status in ('belum_mulai', 'berjalan', 'selesai')) default 'belum_mulai',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.schedule_entries add column if not exists owner_id text not null default 'owner-default';
alter table public.schedule_entries add column if not exists owner_name text not null default 'User';
alter table public.schedule_entries add column if not exists owner_phone text not null default '';
alter table public.schedule_entries add column if not exists owner_email text not null default '';
alter table public.schedule_entries add column if not exists program_id text;
alter table public.schedule_entries add column if not exists completed_date date;
alter table public.schedule_entries add column if not exists duration_days integer default 1;

-- ----------------------------------------------------------------------------
-- 4. TABEL ABSENSI (attendance) + Foto Watermark, Lokasi GPS & Lembur
-- ----------------------------------------------------------------------------
create table if not exists public.attendance (
  id text primary key default ('att-' || substr(gen_random_uuid()::text, 1, 8)),
  owner_id text not null default 'owner-default',
  owner_name text not null default 'User',
  entry_date date not null,
  type text not null check (type in ('hadir', 'izin', 'cuti', 'sakit')) default 'hadir',
  check_in_time text,
  check_out_time text,
  work_duration_hours numeric default 0,
  regular_work_hours numeric default 0,
  overtime_hours numeric default 0,
  shift_category text default 'normal',
  shift_notes text default '',
  check_in_photo text,
  check_in_location text,
  check_out_photo text,
  check_out_location text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_attendance_owner_date unique (owner_id, entry_date)
);

alter table public.attendance add column if not exists regular_work_hours numeric default 0;
alter table public.attendance add column if not exists overtime_hours numeric default 0;
alter table public.attendance add column if not exists shift_category text default 'normal';
alter table public.attendance add column if not exists shift_notes text default '';
alter table public.attendance add column if not exists check_in_photo text;
alter table public.attendance add column if not exists check_in_location text;
alter table public.attendance add column if not exists check_out_photo text;
alter table public.attendance add column if not exists check_out_location text;

-- ----------------------------------------------------------------------------
-- 5. TABEL PENGINGAT & ALARM ACARA (reminders)
-- ----------------------------------------------------------------------------
create table if not exists public.reminders (
  id text primary key default ('rem-' || substr(gen_random_uuid()::text, 1, 8)),
  owner_id text not null default 'owner-default',
  owner_name text not null default 'User',
  title text not null,
  reminder_date date not null,
  start_time text not null,
  end_time text not null,
  notify_before_minutes integer default 15,
  notes text not null default '',
  is_active boolean not null default true,
  is_triggered boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. TABEL EVALUASI PERFORMA AI (ai_performance)
-- ----------------------------------------------------------------------------
create table if not exists public.ai_performance (
  id text primary key default ('ai-' || substr(gen_random_uuid()::text, 1, 8)),
  owner_id text not null default 'owner-default',
  owner_name text not null default 'User',
  image_url text,
  image_name text,
  score integer default 0,
  summary text not null default '',
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  analyzed_date_range text default '',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. INDEX UNTUK PERFORMA QUERY
-- ----------------------------------------------------------------------------
create index if not exists idx_entries_date on public.schedule_entries (entry_date);
create index if not exists idx_entries_owner on public.schedule_entries (owner_id);
create index if not exists idx_attendance_date on public.attendance (entry_date);
create index if not exists idx_attendance_owner on public.attendance (owner_id);
create index if not exists idx_reminders_date on public.reminders (reminder_date);
create index if not exists idx_reminders_owner on public.reminders (owner_id);

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) - Izinkan Akses Data
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.schedule_entries enable row level security;
alter table public.attendance enable row level security;
alter table public.reminders enable row level security;
alter table public.ai_performance enable row level security;

-- Kebijakan RLS Terbuka (Mengizinkan sinkronisasi multi-device akun)
drop policy if exists "Allow all profiles access" on public.profiles;
create policy "Allow all profiles access" on public.profiles for all using (true) with check (true);

drop policy if exists "Allow access to projects" on public.projects;
create policy "Allow access to projects" on public.projects for all using (true) with check (true);

drop policy if exists "Allow access to schedule_entries" on public.schedule_entries;
create policy "Allow access to schedule_entries" on public.schedule_entries for all using (true) with check (true);

drop policy if exists "Allow access to attendance" on public.attendance;
create policy "Allow access to attendance" on public.attendance for all using (true) with check (true);

drop policy if exists "Allow access to reminders" on public.reminders;
create policy "Allow access to reminders" on public.reminders for all using (true) with check (true);

drop policy if exists "Allow access to ai_performance" on public.ai_performance;
create policy "Allow access to ai_performance" on public.ai_performance for all using (true) with check (true);
