import { NextRequest, NextResponse } from 'next/server';
import { sendPayment as sendPaymentSync } from '@/lib/backend/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount } = body;

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: 'Name and amount are required' },
        { status: 400 }
      );
    }

    const result = sendPaymentSync(name, amount);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send payment' },
      { status: 500 }
    );
  }
}