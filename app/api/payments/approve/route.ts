import { NextRequest, NextResponse } from 'next/server';
import { approvePayment } from '@/services/auth.service';
import { requireAdminRole } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAdminRole(['admin', 'support', 'super_admin']);
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }

    // Approve payment
    const result = await approvePayment(paymentId, session.userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment approved successfully',
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment approval error:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((error as Error).message === 'Admin account required') {
      return NextResponse.json({ error: 'Admin account required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
