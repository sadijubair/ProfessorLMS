import { NextRequest, NextResponse } from 'next/server';
import { rejectPayment } from '@/services/auth.service';
import { requireAdminRole } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAdminRole(['admin', 'support', 'super_admin']);
    const { paymentId, rejectionReason } = await request.json();

    if (!paymentId || !rejectionReason) {
      return NextResponse.json(
        { error: 'Payment ID and rejection reason required' },
        { status: 400 }
      );
    }

    // Reject payment
    const result = await rejectPayment(paymentId, rejectionReason, session.userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment rejected successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment rejection error:', error);
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
