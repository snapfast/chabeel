import { POST } from '@/app/api/locations/route';
import { NextResponse } from 'next/server';

// Mock the storage module
jest.mock('@/lib/storage', () => ({
  saveLocation: jest.fn().mockResolvedValue(undefined),
  getLocations: jest.fn().mockResolvedValue([]),
}));

describe('API Input Validation', () => {
  it('should return 400 if name is missing', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        lat: 30,
        lng: 76,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 400 if lat is missing', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        lng: 76,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 400 if lat is invalid (out of range)', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        lat: 100,
        lng: 76,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid latitude');
  });

  it('should return 400 if lat is invalid (not a number)', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        lat: 'invalid',
        lng: 76,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    // Zod returns this for NaN after preprocessing or if type mismatch
    expect(data.error).toMatch(/Invalid latitude/);
  });

  it('should return 400 if durationDays is invalid (not a number)', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        lat: 30,
        lng: 76,
        durationDays: 'invalid'
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 if durationDays is negative', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        lat: 30,
        lng: 76,
        durationDays: -1
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Duration must be a positive integer');
  });

  it('should return 400 if startDate has invalid format', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        lat: 30,
        lng: 76,
        startDate: '2023/05/20' // Should be YYYY-MM-DD
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid date format (YYYY-MM-DD)');
  });

  it('should return 400 if contactPhone is too long', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        lat: 30,
        lng: 76,
        contactPhone: '1'.repeat(21)
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Contact phone is too long');
  });

  it('should return 400 if description is too long', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        lat: 30,
        lng: 76,
        description: 'a'.repeat(1001)
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Description is too long');
  });

  it('should return 201 if all fields are valid', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Chabeel',
        lat: 30.123,
        lng: 76.456,
        description: 'Valid description',
        durationDays: 5,
        startDate: '2025-06-01',
        contactPhone: '9876543210'
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('should return 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: '{ invalid json }',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid JSON payload');
  });
});
