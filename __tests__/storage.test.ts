import { getLocations, saveLocation } from '@/lib/storage';

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbyOhkO-K9w-ErN47ZSYSfYqohMTU0VMi6ytTZKI_9lGprRKORxQ8zRDNXns7vM9dHS15g/exec';

describe('Storage', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fetch locations from backend', async () => {
    const mockData = [
      { id: '1', name: 'Test Chabeel', lat: 30, lng: 76 }
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    });

    const locations = await getLocations();
    expect(global.fetch).toHaveBeenCalledWith(BACKEND_URL, { cache: 'no-store' });
    expect(locations).toEqual(mockData);
  });

  it('should save location to backend', async () => {
    const loc = {
      id: '1',
      name: 'Test',
      lat: 30,
      lng: 76,
      locationName: 'Test Loc',
      durationDays: 1,
      createdAt: new Date().toISOString()
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await saveLocation(loc);
    expect(global.fetch).toHaveBeenCalledWith(BACKEND_URL, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(loc),
    }));
  });

});
