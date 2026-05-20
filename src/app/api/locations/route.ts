import { NextResponse } from 'next/server';
import { getLocations, saveLocation } from '@/lib/storage';
import { ChabeelLocation, CreateChabeelInput } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const locations = await getLocations();
    return NextResponse.json(locations);
  } catch (error) {
    console.error('API Error (GET):', error);
    return NextResponse.json({ error: 'Failed to fetch locations from upstream' }, { status: 502 });
  }
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
      locationName: body.locationName,
      durationDays: body.durationDays,
      createdAt: new Date().toISOString(),
    };

    await saveLocation(newLocation);
    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error('API Error (POST):', error);
    return NextResponse.json({ error: 'Failed to save location to upstream' }, { status: 502 });
  }
}
