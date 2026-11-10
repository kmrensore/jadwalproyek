import { createClient } from '@supabase/supabase-js';
import type { Project, ScheduleEntry, UserProfile } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAuthAndDb = {
  async signUp(payload: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<{ user?: UserProfile; error?: string }> {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email.trim(),
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName.trim(),
          phone: payload.phone.trim(),
        },
      },
    });
    if (error || !data.user) {
      return { error: error?.message || 'Gagal mendaftar ke Supabase Auth' };
    }
    const profile: UserProfile = {
      id: data.user.id,
      fullName: payload.fullName.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
      createdAt: data.user.created_at,
    };
    await supabase.from('profiles').upsert({
      id: profile.id,
      full_name: profile.fullName,
      phone: profile.phone,
      email: profile.email,
    });
    return { user: profile };
  },

  async signIn(email: string, password: string): Promise<{ user?: UserProfile; error?: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) {
      return { error: error?.message || 'Email atau password salah' };
    }
    const meta = data.user.user_metadata || {};
    const profile: UserProfile = {
      id: data.user.id,
      fullName: meta.full_name || data.user.email?.split('@')[0] || 'User',
      phone: meta.phone || '-',
      email: data.user.email || email,
      createdAt: data.user.created_at,
    };
    return { user: profile };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async createProject(name: string, color: string, owner: UserProfile): Promise<void> {
    await supabase.from('projects').insert({
      name: name.trim(),
      color,
      owner_id: owner.id,
      owner_name: owner.fullName,
    });
  },

  async createEntry(
    payload: Omit<
      ScheduleEntry,
      'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'ownerName' | 'ownerPhone' | 'ownerEmail'
    >,
    owner: UserProfile
  ): Promise<void> {
    await supabase.from('schedule_entries').insert({
      entry_date: payload.date,
      title: payload.title.trim(),
      project_id: payload.projectId,
      status: payload.status,
      notes: payload.notes.trim(),
      owner_id: owner.id,
      owner_name: owner.fullName,
      owner_phone: owner.phone,
      owner_email: owner.email,
    });
  },
};
