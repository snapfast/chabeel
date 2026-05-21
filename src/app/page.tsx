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
          <div className="bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full border border-outline-variant/30 shadow-sm flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface/70 tracking-tight">Chabeel Finder</span>
            <div className="w-[1px] h-2.5 bg-outline-variant/30"></div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">Crowd Sourced</span>
            </div>
            <div className="w-[1px] h-2.5 bg-outline-variant/30"></div>
            <span className="text-[9px] text-outline font-medium">Share Food • Public</span>
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

          <form onSubmit={handleSubmit} className="space-y-3 relative">
            {isSaving && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-md">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm font-medium text-on-surface-variant">Saving Chabeel details...</p>
              </div>
            )}
            <div>
              <label htmlFor="chabeel-name" className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Chabeel Name</label>
              <input
                id="chabeel-name"
                required
                type="text"
                placeholder="e.g. Gurudwara Sector 34"
                className="w-full p-2 text-base border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30">
              <label className="block text-[9px] uppercase font-bold text-outline mb-0.5">Detected Address</label>
              <p className="text-xs text-on-surface-variant leading-tight line-clamp-2">
                {formData.locationName || 'Pinpoint location on map'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="chabeel-start-date" className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Start Date</label>
                <input
                  id="chabeel-start-date"
                  required
                  type="date"
                  className="w-full p-1.5 text-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="chabeel-duration" className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Duration</label>
                <div className="relative">
                  <input
                    id="chabeel-duration"
                    required
                    type="number"
                    min="1"
                    className="w-full p-1.5 text-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none pr-10"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-outline pointer-events-none">DAYS</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="chabeel-hours" className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Hours</label>
                <input
                  id="chabeel-hours"
                  type="text"
                  placeholder="10AM - 5PM"
                  className="w-full p-1.5 text-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="chabeel-service" className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Service</label>
                <select
                  id="chabeel-service"
                  className="w-full p-1.5 text-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white appearance-none"
                  style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")'}}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="chabeel-contact-name" className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Contact Name</label>
                <input
                  id="chabeel-contact-name"
                  type="text"
                  placeholder="Optional"
                  className="w-full p-1.5 text-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="chabeel-contact-phone" className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Phone</label>
                <input
                  id="chabeel-contact-phone"
                  type="tel"
                  placeholder="Optional"
                  className="w-full p-1.5 text-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="chabeel-desc" className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Notes</label>
              <textarea
                id="chabeel-desc"
                placeholder="Any specifics?"
                className="w-full p-2 text-sm border border-outline-variant rounded-lg h-16 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="bg-surface-container-low p-3 rounded-md border border-dashed border-outline-variant flex justify-between items-center">
              <div>
                <p className="text-[10px] text-outline uppercase font-bold mb-0.5">Coordinates</p>
                <p className="text-xs font-mono text-on-surface-variant">{formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-outline uppercase font-bold mb-0.5">Source</p>
                <p className="text-[10px] font-bold text-primary uppercase">Web App</p>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input
                id="confirm-details"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
              <label htmlFor="confirm-details" className="text-sm text-on-surface-variant">
                I confirm these details are real and accurate. This location will be public.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-primary text-on-primary font-bold py-3 rounded-md hover:bg-primary-container transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Public Location'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
