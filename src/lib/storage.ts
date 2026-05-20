import fs from 'fs/promises';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { ChabeelLocation } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'locations.json');

// Synchronous initialization at module load (safe for one-time setup)
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

if (!existsSync(DATA_FILE)) {
  writeFileSync(DATA_FILE, JSON.stringify([]));
}

export async function getLocations(): Promise<ChabeelLocation[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading locations:', error);
    return [];
  }
}

// Simple in-memory lock to prevent race conditions during file updates
let writeLock = Promise.resolve();

export async function saveLocation(location: ChabeelLocation): Promise<void> {
  // Chain the operations to ensure they happen sequentially
  // Use catch to ensure that a previous failed write doesn't block future writes
  writeLock = writeLock.catch(() => {}).then(async () => {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      const locations: ChabeelLocation[] = JSON.parse(data);
      locations.push(location);
      await fs.writeFile(DATA_FILE, JSON.stringify(locations, null, 2));
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  });

  return writeLock;
}

export async function deleteLocation(id: string): Promise<void> {
  writeLock = writeLock.catch(() => {}).then(async () => {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      const locations: ChabeelLocation[] = JSON.parse(data);
      const filteredLocations = locations.filter(loc => loc.id !== id);
      await fs.writeFile(DATA_FILE, JSON.stringify(filteredLocations, null, 2));
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  });

  return writeLock;
}
