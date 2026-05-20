import { NextResponse } from 'next/server';
import { getLocations, saveLocation } from '@/lib/storage';
import { ChabeelLocation, CreateChabeelInput } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const locations = await getLocations();
  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  try {
    const body: CreateChabeelInput = await request.json();

    if (!body.name || body.lat === undefined || body.lng === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validation for lat/lng
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 });
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 });
    }

    const newLocation: ChabeelLocation = {
      id: uuidv4(),
      name: body.name,
      description: body.description,
      lat,
      lng,
      createdAt: new Date().toISOString(),
    };

    await saveLocation(newLocation);
    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
