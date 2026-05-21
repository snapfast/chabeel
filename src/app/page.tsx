'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import { ChabeelLocation } from '@/types';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
});

export default function Home() {
  const [locations, setLocations] = useState<ChabeelLocation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lat: 0,
    lng: 0,
    locationName: '',
    durationDays: 1,
    startDate: new Date().toISOString().split('T')[0],
    operatingHours: '',
    contactName: '',
    contactPhone: '',
    serviceType: 'Water Only',
    source: 'web'
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocations(data);
      } else {
        console.error('Expected array from /api/locations, got:', data);
        setLocations([]);
      }
    } catch (error) {
      console.error('Failed to fetch locations', error);
    }
  };

  const filteredLocations = useMemo<ChabeelLocation[]>(() => {
    return locations;
  }, [locations]);

  const handleMapClick = async (lat: number, lng: number) => {
    setFormData({ ...formData, lat, lng, locationName: 'Fetching address...' });
    setShowAddForm(true);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: {
          'User-Agent': 'ChabeelFinder/1.0'
        }
      });
      const data = await response.json();
      setFormData(prev => ({ ...prev, lat, lng, locationName: data.display_name || '' }));
    } catch (error) {
      console.error('Failed to fetch address', error);
      setFormData(prev => ({ ...prev, lat, lng, locationName: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      alert('Please confirm that the details are real.');
      return;
    }
    await saveLocation();
  };

  const saveLocation = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddForm(false);
        setIsConfirmed(false);
        setFormData({
          name: '',
          description: '',
          lat: 0,
          lng: 0,
          locationName: '',
          durationDays: 1,
          startDate: new Date().toISOString().split('T')[0],
          operatingHours: '',
          contactName: '',
          contactPhone: '',
          serviceType: 'Water Only',
          source: 'web'
        });
        fetchLocations();
      }
    } catch (error) {
      console.error('Failed to save location', error);
      alert('Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex-1 relative flex overflow-hidden h-screen map-bg">
      {/* Map Area */}
      <div className="flex-1 relative">
        <Map
          locations={filteredLocations}
          onMapClick={handleMapClick}
        />

        {/* Branding Tile */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
            <span className="text-xs font-black text-black tracking-tight">Chabeel Finder</span>
            <div className="w-[2px] h-3 bg-black"></div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
              <span className="text-xs font-black text-black uppercase tracking-tighter">Crowd Sourced</span>
            </div>
            <div className="w-[2px] h-3 bg-black"></div>
            <span className="text-xs text-black font-bold uppercase tracking-tight">Public</span>
          </div>
        </div>

        {/* Floating Footer for Desktop Map View */}
        <div className="hidden md:block absolute bottom-sm right-sm z-[1000] pointer-events-none">
          <div className="bg-surface-container-lowest/80 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/30 text-outline text-[12px] flex gap-4 shadow-sm pointer-events-auto">
            <span>Maintained by Madhup Tiwari (7888709084)</span>
          </div>
        </div>
      </div>

      {/* Add Location Overlay */}
      {showAddForm && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white z-[1001] shadow-2xl p-6 transition-transform transform translate-x-0 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-on-surface">Add Chabeel</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 hover:bg-surface-container rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative">
            {isSaving && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-md">
                <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-base font-black text-black">Saving Chabeel details...</p>
              </div>
            )}
            <div>
              <label htmlFor="chabeel-name" className="block text-sm font-black text-black uppercase tracking-wider mb-1.5">Chabeel Name</label>
              <input
                id="chabeel-name"
                required
                type="text"
                placeholder="e.g. Gurudwara Sector 34"
                className="w-full p-3 text-base border-2 border-black rounded-lg focus:ring-0 focus:border-black outline-none transition-all placeholder:text-gray-400 font-bold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border-2 border-black border-dashed">
              <label className="block text-xs uppercase font-black text-black mb-1">Detected Address</label>
              <p className="text-sm text-black font-bold leading-tight">
                {formData.locationName || 'Pinpoint location on map'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="chabeel-start-date" className="block text-sm font-black text-black uppercase tracking-wider mb-1.5">Start Date</label>
                <input
                  id="chabeel-start-date"
                  required
                  type="date"
                  className="w-full p-2.5 text-base border-2 border-black rounded-lg focus:ring-0 focus:border-black outline-none font-bold"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="chabeel-duration" className="block text-sm font-black text-black uppercase tracking-wider mb-1.5">Duration</label>
                <div className="relative">
                  <input
                    id="chabeel-duration"
                    required
                    type="number"
                    min="1"
                    className="w-full p-2.5 text-base border-2 border-black rounded-lg focus:ring-0 focus:border-black outline-none pr-12 font-bold"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-black pointer-events-none">DAYS</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="chabeel-hours" className="block text-sm font-black text-black uppercase tracking-wider mb-1.5">Hours</label>
                <input
                  id="chabeel-hours"
                  type="text"
                  placeholder="10AM - 5PM"
                  className="w-full p-2.5 text-base border-2 border-black rounded-lg focus:ring-0 focus:border-black outline-none font-bold placeholder:text-gray-400"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="chabeel-service" className="block text-sm font-black text-black uppercase tracking-wider mb-1.5">Service</label>
                <select
                  id="chabeel-service"
                  className="w-full p-2.5 text-base border-2 border-black rounded-lg focus:ring-0 focus:border-black outline-none bg-white appearance-none font-bold"
                  style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'black\' stroke-width=\'3\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem'}}
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                >
                  <option value="Water Only">Water Only</option>
                  <option value="Sweet Water">Sweet Water</option>
                  <option value="Food/Langar">Food/Langar</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="chabeel-contact-name" className="block text-sm font-black text-black uppercase tracking-wider mb-1.5">Contact Name</label>
                <input
                  id="chabeel-contact-name"
                  type="text"
                  placeholder="Optional"
                  className="w-full p-2.5 text-base border-2 border-black rounded-lg focus:ring-0 focus:border-black outline-none font-bold placeholder:text-gray-400"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="chabeel-contact-phone" className="block text-sm font-black text-black uppercase tracking-wider mb-1.5">Phone</label>
                <input
                  id="chabeel-contact-phone"
                  type="tel"
                  placeholder="Optional"
                  className="w-full p-2.5 text-base border-2 border-black rounded-lg focus:ring-0 focus:border-black outline-none font-bold placeholder:text-gray-400"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="chabeel-desc" className="block text-sm font-black text-black uppercase tracking-wider mb-1.5">Notes</label>
              <textarea
                id="chabeel-desc"
                placeholder="Any specifics?"
                className="w-full p-3 text-base border-2 border-black rounded-lg h-24 focus:ring-0 focus:border-black outline-none transition-all font-bold placeholder:text-gray-400"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="bg-white p-4 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
              <div>
                <p className="text-xs text-black uppercase font-black mb-1">Coordinates</p>
                <p className="text-sm font-black text-black">{formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-black uppercase font-black mb-1">Source</p>
                <p className="text-sm font-black text-black uppercase">Web App</p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input
                id="confirm-details"
                type="checkbox"
                required
                className="mt-1 h-5 w-5 rounded border-2 border-black text-black focus:ring-0"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
              <label htmlFor="confirm-details" className="text-sm text-black font-black leading-tight">
                I confirm these details are real and accurate. This location will be public.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-black text-white font-black py-4 rounded-md hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed text-lg uppercase tracking-widest"
            >
              {isSaving ? 'Saving...' : 'Save Public Location'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
