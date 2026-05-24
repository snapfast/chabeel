import { NextResponse } from 'next/server';
import { getLocations, saveLocation } from '@/lib/storage';
import { ChabeelLocation } from '@/types';
import { calculateStatus } from '@/lib/utils';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

// Define validation schema for input
const createChabeelSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).max(100, { message: 'Name is too long' }),
  description: z.string().max(1000, { message: 'Description is too long' }).optional(),
  lat: z.preprocess((val) => {
    if (typeof val === 'string') return Number(val);
    return val;
  }, z.number({
    required_error: 'Missing required fields',
    invalid_type_error: 'Invalid latitude'
  }).min(-90, { message: 'Invalid latitude' }).max(90, { message: 'Invalid latitude' })),
  lng: z.preprocess((val) => {
    if (typeof val === 'string') return Number(val);
    return val;
  }, z.number({
    required_error: 'Missing required fields',
    invalid_type_error: 'Invalid longitude'
  }).min(-180, { message: 'Invalid longitude' }).max(180, { message: 'Invalid longitude' })),
  locationName: z.string().max(200, { message: 'Location name is too long' }).optional(),
  durationDays: z.preprocess((val) => {
    if (typeof val === 'string') return Number(val);
    return val;
  }, z.number({ invalid_type_error: 'Duration must be a number' }).int({ message: 'Duration must be an integer' }).positive({ message: 'Duration must be a positive integer' }).optional()),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format (YYYY-MM-DD)' }).optional(),
  operatingHours: z.string().max(100, { message: 'Operating hours text is too long' }).optional(),
  contactName: z.string().max(100, { message: 'Contact name is too long' }).optional(),
  contactPhone: z.string().max(20, { message: 'Contact phone is too long' }).optional(),
  serviceType: z.string().max(50, { message: 'Service type is too long' }).optional(),
  source: z.string().max(50).optional(),
});

export async function GET() {
  try {
    const locations = await getLocations();
    const locationsWithStatus = locations.map(loc => ({
      ...loc,
      status: calculateStatus(loc)
    }));
    return NextResponse.json(locationsWithStatus);
  } catch (error) {
    console.error('API Error (GET):', error);
    return NextResponse.json({ error: 'Failed to fetch locations from upstream' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Safety check for null body
    if (body === null || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    // Explicitly check for required fields to match previous behavior and tests
    if (body.name === undefined || body.lat === undefined || body.lng === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for empty name
    if (typeof body.name === 'string' && body.name.trim() === '') {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate input using Zod
    const validation = createChabeelSchema.safeParse(body);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      let errorMessage = firstIssue.message;

      // Handle custom messages if needed
      if (firstIssue.code === 'invalid_type' && firstIssue.received === 'undefined') {
        errorMessage = 'Missing required fields';
      } else if (errorMessage.includes('received NaN')) {
          if (firstIssue.path.includes('lat')) errorMessage = 'Invalid latitude';
          if (firstIssue.path.includes('lng')) errorMessage = 'Invalid longitude';
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const validatedData = validation.data;

    const newLocation: ChabeelLocation = {
      id: randomUUID(),
      name: validatedData.name,
      description: validatedData.description,
      lat: validatedData.lat,
      lng: validatedData.lng,
      locationName: validatedData.locationName,
      durationDays: validatedData.durationDays,
      startDate: validatedData.startDate,
      operatingHours: validatedData.operatingHours,
      contactName: validatedData.contactName,
      contactPhone: validatedData.contactPhone,
      serviceType: validatedData.serviceType,
      source: validatedData.source || 'web',
      isVerified: false,
      verificationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveLocation(newLocation);
    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error('API Error (POST):', error);
    return NextResponse.json({ error: 'Failed to save location to upstream' }, { status: 502 });
  }
}
