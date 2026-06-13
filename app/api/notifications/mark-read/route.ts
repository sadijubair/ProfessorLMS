import { NextRequest, NextResponse } from 'next/server';

import { requireStudent } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { markNotificationAsRead } from '@/services/notification.service';

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireStudent();
    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const { data: notification } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('id', notificationId)
      .eq('user_id', session.userId)
      .maybeSingle();

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const result = await markNotificationAsRead(notificationId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification mark-read error:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((error as Error).message === 'Student account required') {
      return NextResponse.json({ error: 'Student account required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
