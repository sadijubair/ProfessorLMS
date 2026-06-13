import { supabaseAdmin } from '@/lib/db/supabase';

export type NotificationType = 
  | 'exam_reminder'
  | 'result_published'
  | 'payment_status'
  | 'enrollment'
  | 'announcement';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedEntityType?: string,
  relatedEntityId?: string
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_entity_type: relatedEntityType || null,
        related_entity_id: relatedEntityId || null,
        is_read: false,
        read_at: null,
      } as any)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getNotifications(
  userId: string,
  limit: number = 10,
  offset: number = 0
) {
  try {
    const { data, count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { success: true, data, total: count };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getUnreadCount(userId: string) {
  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return { success: true, unreadCount: count || 0 };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, error: (error as Error).message };
  }
}
