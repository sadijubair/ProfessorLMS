import { NextRequest, NextResponse } from 'next/server';
import { submitPayment } from '@/services/auth.service';
import { requireStudent } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireStudent();
    const { enrollmentId, amountBdt, paymentMethod, transactionId, senderMobile, screenshotUrl } =
      await request.json();

    // Validate required fields
    if (!enrollmentId || !amountBdt || !paymentMethod || !transactionId || !senderMobile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validMethods = ['bkash', 'nagad', 'rocket', 'bank_transfer'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Submit payment
    const result = await submitPayment({
      enrollmentId,
      submittedBy: session.userId,
      amountBdt,
      paymentMethod,
      transactionId,
      senderMobile,
      screenshotUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Payment submitted successfully', data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment submission error:', error);
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
