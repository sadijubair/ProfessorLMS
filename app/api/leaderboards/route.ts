import { NextRequest, NextResponse } from 'next/server';

import { requireStudent } from '@/lib/auth/server';
import { getAggregateLeaderboard } from '@/services/exam.service';

export async function GET(request: NextRequest) {
  try {
    await requireStudent();

    const scope = request.nextUrl.searchParams.get('scope') || 'weekly';
    const courseId = request.nextUrl.searchParams.get('courseId') || undefined;

    if (!['weekly', 'monthly', 'batch'].includes(scope)) {
      return NextResponse.json({ error: 'Invalid leaderboard scope' }, { status: 400 });
    }

    const leaderboard = await getAggregateLeaderboard({
      scope: scope as 'weekly' | 'monthly' | 'batch',
      courseId,
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Aggregate leaderboard error:', error);
    return NextResponse.json({ error: 'Unable to load leaderboard' }, { status: 500 });
  }
}
