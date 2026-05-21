import { NextResponse } from 'next/server';
import { checkInLocation } from '@/lib/storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await checkInLocation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error (CHECKIN):', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 502 });
  }
}
