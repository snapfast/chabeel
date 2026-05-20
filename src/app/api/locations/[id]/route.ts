import { NextResponse } from 'next/server';
import { deleteLocation } from '@/lib/storage';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteLocation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error (DELETE):', error);
    return NextResponse.json({ error: 'Failed to delete location from upstream' }, { status: 502 });
  }
}
