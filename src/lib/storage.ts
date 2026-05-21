import { ChabeelLocation } from '@/types';

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbyOhkO-K9w-ErN47ZSYSfYqohMTU0VMi6ytTZKI_9lGprRKORxQ8zRDNXns7vM9dHS15g/exec';

export async function getLocations(): Promise<ChabeelLocation[]> {
  try {
    const response = await fetch(BACKEND_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error reading locations from backend:', error);
    return [];
  }
}

export async function saveLocation(location: ChabeelLocation): Promise<void> {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(location),
    });

    if (!response.ok) {
      throw new Error(`Failed to save location: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error saving location to backend:', error);
    throw error;
  }
}

export async function checkInLocation(id: string): Promise<void> {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'checkin', id }),
    });

    if (!response.ok) {
      throw new Error(`Failed to check in: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error checking in to location on backend:', error);
    throw error;
  }
}

export async function deleteLocation(id: string): Promise<void> {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'delete', id }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete location: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting location from backend:', error);
    throw error;
  }
}
