import { getLocations, saveLocation, deleteLocation } from '@/lib/storage';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'locations.json');

describe('Storage', () => {
  beforeEach(async () => {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  });

  it('should save and retrieve locations', async () => {
    const loc = {
      id: '1',
      name: 'Test',
      lat: 30,
      lng: 76,
      locationName: 'Test Loc',
      durationDays: 1,
      createdAt: new Date().toISOString()
    };
    await saveLocation(loc);
    const locations = await getLocations();
    expect(locations).toHaveLength(1);
    expect(locations[0].name).toBe('Test');
  });

  it('should delete a location', async () => {
    const loc = {
      id: '1',
      name: 'Test',
      lat: 30,
      lng: 76,
      locationName: 'Test Loc',
      durationDays: 1,
      createdAt: new Date().toISOString()
    };
    await saveLocation(loc);
    await deleteLocation('1');
    const locations = await getLocations();
    expect(locations).toHaveLength(0);
  });
});
