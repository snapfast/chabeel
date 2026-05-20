import { getLocations, saveLocation } from '@/lib/storage';
import fs from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'locations.json');

describe('Storage', () => {
  beforeEach(() => {
    if (existsSync(DATA_FILE)) {
      writeFileSync(DATA_FILE, JSON.stringify([]));
    }
  });

  it('should save and retrieve locations', async () => {
    const location = {
      id: '1',
      name: 'Test Chabeel',
      lat: 30.7,
      lng: 76.7,
      createdAt: new Date().toISOString(),
    };

    await saveLocation(location);
    const locations = await getLocations();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toBe('Test Chabeel');
  });
});
