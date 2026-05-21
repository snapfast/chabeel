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
  const [formData, setFormData] = useState({ name: '', description: '', lat: 0, lng: 0, locationName: '', durationDays: 1 });

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
    return locations.map((loc, i) => ({
      ...loc,
      status: (i % 3 === 0 ? 'active' : i % 3 === 1 ? 'upcoming' : 'ended') as 'active' | 'upcoming' | 'ended',
    }));
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
        setFormData({ name: '', description: '', lat: 0, lng: 0, locationName: '', durationDays: 1 });
        fetchLocations();
      }
    } catch (error) {
      console.error('Failed to save location', error);
      alert('Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Chabeel?')) return;
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchLocations();
      }
    } catch (error) {
      console.error('Failed to delete location', error);
    }
  };

  return (
    <main className="flex-1 relative flex overflow-hidden h-screen map-bg">
      {/* Map Area */}
      <div className="flex-1 relative">
        <Map
          locations={filteredLocations}
          onMapClick={handleMapClick}
          onDelete={handleDelete}
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
        <div className="hidden md:block absolute bottom-sm right-sm z-[1000]">
          <div className="bg-surface-container-lowest/80 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/30 text-outline text-[12px] flex gap-4 shadow-sm">
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
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm font-medium text-on-surface-variant">Saving Chabeel details...</p>
              </div>
            )}
            <div>
              <label htmlFor="chabeel-name" className="block text-sm font-medium text-on-surface-variant mb-1">Suggestive Chabeel Name</label>
              <input
                id="chabeel-name"
                required
                type="text"
                placeholder="e.g. Gurudwara Sector 34 Chabeel"
                className="w-full p-2 border border-outline-variant rounded-md focus:ring-2 focus:ring-primary outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="chabeel-address" className="block text-sm font-medium text-on-surface-variant mb-1">Location Address</label>
              <input
                id="chabeel-address"
                required
                type="text"
                placeholder="Address"
                className="w-full p-2 border border-outline-variant rounded-md focus:ring-2 focus:ring-primary outline-none"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="chabeel-duration" className="block text-sm font-medium text-on-surface-variant mb-1">Timing / Duration (Days)</label>
              <input
                id="chabeel-duration"
                required
                type="number"
                min="1"
                className="w-full p-2 border border-outline-variant rounded-md focus:ring-2 focus:ring-primary outline-none"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label htmlFor="chabeel-desc" className="block text-sm font-medium text-on-surface-variant mb-1">Description (Optional)</label>
              <textarea
                id="chabeel-desc"
                placeholder="What time? Any specifics?"
                className="w-full p-2 border border-outline-variant rounded-md h-32 focus:ring-2 focus:ring-primary outline-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="bg-surface-container-low p-3 rounded-md border border-dashed border-outline-variant">
              <p className="text-[10px] text-outline uppercase font-bold mb-1">Selected Location</p>
              <p className="text-xs font-mono text-on-surface-variant">{formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}</p>
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
