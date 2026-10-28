import { createClient } from '@supabase/supabase-js';
import type { Project, ScheduleEntry } from './types';

// ============================================================================
// MODUL DATA LAYER VERSI SUPABASE (src/db.supabase.ts)
// Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diisi di .env.local
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const dbSupabase = {
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, color, createdAt:created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async createProject(name: string, color: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: name.trim(), color })
      .select('id, name, color, createdAt:created_at')
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id: string, name: string, color: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ name: name.trim(), color })
      .eq('id', id)
      .select('id, name, color, createdAt:created_at')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id: string): Promise<void> {
    // ON DELETE SET NULL pada foreign key otomatis membuat catatan menjadi "Tanpa proyek"
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  async getEntries(): Promise<ScheduleEntry[]> {
    const { data, error } = await supabase
      .from('schedule_entries')
      .select(
        'id, date:entry_date, title, projectId:project_id, status, notes, createdAt:created_at, updatedAt:updated_at'
      )
      .order('entry_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async createEntry(
    payload: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ScheduleEntry> {
    const { data, error } = await supabase
      .from('schedule_entries')
      .insert({
        entry_date: payload.date,
        title: payload.title.trim(),
        project_id: payload.projectId,
        status: payload.status,
        notes: payload.notes.trim(),
      })
      .select(
        'id, date:entry_date, title, projectId:project_id, status, notes, createdAt:created_at, updatedAt:updated_at'
      )
      .single();

    if (error) throw error;
    return data;
  },

  async updateEntry(
    id: string,
    payload: Partial<Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ScheduleEntry> {
    const updateData: Record<string, unknown> = {};
    if (payload.date !== undefined) updateData.entry_date = payload.date;
    if (payload.title !== undefined) updateData.title = payload.title.trim();
    if (payload.projectId !== undefined) updateData.project_id = payload.projectId;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.notes !== undefined) updateData.notes = payload.notes.trim();

    const { data, error } = await supabase
      .from('schedule_entries')
      .update(updateData)
      .eq('id', id)
      .select(
        'id, date:entry_date, title, projectId:project_id, status, notes, createdAt:created_at, updatedAt:updated_at'
      )
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEntry(id: string): Promise<void> {
    const { error } = await supabase.from('schedule_entries').delete().eq('id', id);
    if (error) throw error;
  },
};
