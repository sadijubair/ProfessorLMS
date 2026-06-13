import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { requireStudent } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireStudent();
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID required' },
        { status: 400 }
      );
    }

    // Verify device belongs to user
    const { data: device } = await supabaseAdmin
      .from('devices')
      .select('id')
      .eq('id', deviceId)
      .eq('user_id', session.userId)
      .single();

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Deactivate device
    const { error } = await supabaseAdmin
      .from('devices')
      .update({ is_active: false })
      .eq('id', deviceId);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Device removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Device removal error:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((error as Error).message === 'Student account required') {
      return NextResponse.json({ error: 'Student account required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
