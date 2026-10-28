-- Skema SQL Supabase: JadwalPro (Penjadwalan Proyek Bulanan)
create extension if not exists "pgcrypto";

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create table public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  entry_date date not null,
  title text not null,
  status text not null check (status in ('belum_mulai', 'berjalan', 'selesai')) default 'belum_mulai',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_user on public.projects (user_id);
create index idx_entries_user_date on public.schedule_entries (user_id, entry_date);
create index idx_entries_project on public.schedule_entries (project_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_schedule_entries_updated_at
before update on public.schedule_entries
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.schedule_entries enable row level security;

create policy "Users manage own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own entries" on public.schedule_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
