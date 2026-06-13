import { NextResponse } from 'next/server';

import { requireStudent } from '@/lib/auth/server';
import { getStudentAnalytics } from '@/services/analytics.service';

export async function GET() {
  try {
    const { session } = await requireStudent();
    const analytics = await getStudentAnalytics(session.userId);
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Student analytics error:', error);
    return NextResponse.json({ error: 'Unable to load analytics' }, { status: 500 });
  }
}
