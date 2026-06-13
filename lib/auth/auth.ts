import { supabase } from '@/lib/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

export type UserProfile = Database['public']['Tables']['users']['Row'];

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('permission', permission);

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return !!data && data.length > 0;
  } catch (error) {
    console.error('Error in hasPermission:', error);
    return false;
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function generateStudentId(): Promise<string> {
  // YY + 6 random digits (e.g., 26182734)
  const year = new Date().getFullYear().toString().slice(2);
  const randomDigits = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `${year}${randomDigits}`;
}

export function generateRollNumber(): string {
  // Random 6 digit roll number
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
}

export function generateCommunityToken(): string {
  // Random alphanumeric token (20 characters)
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateFingerprintId(): string {
  // Simple fingerprint based on browser info
  const navigator = globalThis.navigator;
  const platform = navigator?.platform || 'unknown';
  const language = navigator?.language || 'unknown';
  const timestamp = Date.now().toString();

  return Buffer.from(`${platform}-${language}-${timestamp}`).toString('base64');
}
