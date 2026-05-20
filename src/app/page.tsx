'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import { ChabeelLocation } from '@/types';
import { Loader2 } from 'lucide-react';
import type { LatLngBounds } from 'leaflet';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
});

export default function Home() {
  const [locations, setLocations] = useState<ChabeelLocation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', lat: 0, lng: 0, locationName: '', durationDays: 1 });
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = useMemo(() => {
    let result: ChabeelLocation[] = locations.map((loc, i) => ({
      ...loc,
      status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'upcoming' : 'ended' as const,
      distance: (0.2 * (i + 1)).toFixed(1)
    }));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(loc =>
        loc.name.toLowerCase().includes(query) ||
        (loc.description && loc.description.toLowerCase().includes(query))
      );
    }

    if (filter === 'open') {
      result = result.filter(loc => loc.status === 'active');
    } else if (filter === 'water') {
      result = result.filter(loc =>
        (loc.description && loc.description.toLowerCase().includes('water')) ||
        (!loc.description) // Default display text includes 'Water'
      );
    } else if (filter === 'sabeel') {
      result = result.filter(loc =>
        (loc.description && loc.description.toLowerCase().includes('sabeel')) ||
        (loc.name.toLowerCase().includes('sabeel'))
      );
    }

    return result;
  }, [locations, searchQuery, filter]);

  const visibleLocations = useMemo(() => {
    if (!mapBounds) return filteredLocations;
    return filteredLocations.filter(loc => mapBounds.contains([loc.lat, loc.lng]));
  }, [filteredLocations, mapBounds]);

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
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddForm(false);
        setFormData({ name: '', description: '', lat: 0, lng: 0, locationName: '', durationDays: 1 });
        fetchLocations();
      }
    } catch (error) {
      console.error('Failed to save location', error);
    }
  };

  return (
    <main className="flex-1 relative flex overflow-hidden h-screen map-bg">
      {/* Sidebar / Overlay (List View) */}
      <aside className={`relative z-10 w-full md:w-[400px] h-full bg-surface/95 backdrop-blur-xl border-r border-outline-variant/30 flex flex-col shadow-lg transform transition-transform duration-300 ${mobileView === 'list' ? 'translate-x-0' : '-translate-x-full absolute'} md:relative md:translate-x-0`} id="sidebar">
        {/* Search/Filters Header */}
        <div className="p-sm border-b border-outline-variant/20 bg-surface">
          <div className="relative mb-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md placeholder-outline"
              placeholder="Search locations..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Quick Filters */}
          <div className="flex gap-xs overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-sm text-label-sm border transition-colors ${filter === 'all' ? 'bg-primary-container text-on-primary-container border-primary/20' : 'bg-surface-container text-on-surface-variant border-outline-variant/50 hover:bg-surface-variant'}`}
            >
              All Locations
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-sm text-label-sm border transition-colors ${filter === 'open' ? 'bg-primary-container text-on-primary-container border-primary/20' : 'bg-surface-container text-on-surface-variant border-outline-variant/50 hover:bg-surface-variant'}`}
            >
              Open Now
            </button>
            <button
              onClick={() => setFilter('water')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-sm text-label-sm border transition-colors ${filter === 'water' ? 'bg-primary-container text-on-primary-container border-primary/20' : 'bg-surface-container text-on-surface-variant border-outline-variant/50 hover:bg-surface-variant'}`}
            >
              Water
            </button>
            <button
              onClick={() => setFilter('sabeel')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-sm text-label-sm border transition-colors ${filter === 'sabeel' ? 'bg-primary-container text-on-primary-container border-primary/20' : 'bg-surface-container text-on-surface-variant border-outline-variant/50 hover:bg-surface-variant'}`}
            >
              Sabeel
            </button>
          </div>
        </div>

        {/* List of Locations */}
        <div className="flex-1 overflow-y-auto sidebar-scroll p-sm space-y-sm bg-surface-bright">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-on-surface-variant font-label-sm">Loading locations...</p>
            </div>
          ) : visibleLocations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-outline font-body-md">No locations found in this area</p>
            </div>
          ) : (
            visibleLocations.map((loc) => (
              <div key={loc.id} className={`bg-surface rounded-xl p-sm border border-outline-variant/20 shadow-sm hover:shadow-[0_10px_30px_rgba(0,119,255,0.08)] hover:border-primary/30 cursor-pointer transition-all group ${loc.status === 'ended' ? 'opacity-60 cursor-not-allowed' : loc.status === 'upcoming' ? 'opacity-80' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    {loc.status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-label-sm text-label-sm mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span> Active
                      </span>
                    )}
                    {loc.status === 'upcoming' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm mb-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span> Starts in 2h
                      </span>
                    )}
                    {loc.status === 'ended' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-label-sm mb-1">
                        Ended
                      </span>
                    )}
                    <h3 className="font-headline-md text-[18px] text-on-surface group-hover:text-primary transition-colors">{loc.name}</h3>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">{loc.distance} mi</span>
                </div>
                <p className="font-body-md text-[14px] text-on-surface-variant mb-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-outline">water_drop</span> {loc.description || 'Cold Water, Rooh Afza'}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Community Verified</span>
                  </div>
                  <button className="text-primary font-label-md text-label-md flex items-center gap-1 hover:underline">
                    Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Add Location CTA */}
        <div className="md:hidden p-sm bg-surface border-t border-outline-variant/20 pb-20">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-xs bg-primary-container text-on-primary-container font-label-md text-label-md px-4 py-3 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            Add Location
          </button>
        </div>
      </aside>

      {/* Map Area */}
      <div className="flex-1 relative">
        <Map locations={filteredLocations} onMapClick={handleMapClick} onBoundsChange={setMapBounds} />

        {/* Floating Footer for Desktop Map View */}
        <div className="hidden md:block absolute bottom-sm right-sm z-[1000]">
          <div className="bg-surface-container-lowest/80 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/30 text-outline text-[12px] flex gap-4 shadow-sm">
            <span className="">© 2024 Chabeel Foundation.</span>
            <a className="hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms</a>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Suggestive Chabeel Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Gurudwara Sector 34 Chabeel"
                className="w-full p-2 border border-outline-variant rounded-md focus:ring-2 focus:ring-primary outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Location Address</label>
              <input
                required
                type="text"
                placeholder="Address"
                className="w-full p-2 border border-outline-variant rounded-md focus:ring-2 focus:ring-primary outline-none"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Timing / Duration (Days)</label>
              <input
                required
                type="number"
                min="1"
                className="w-full p-2 border border-outline-variant rounded-md focus:ring-2 focus:ring-primary outline-none"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Description (Optional)</label>
              <textarea
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
            <button
              type="submit"
              className="w-full bg-primary text-on-primary font-bold py-3 rounded-md hover:bg-primary-container transition-all shadow-lg active:scale-[0.98]"
            >
              Save Public Location
            </button>
          </form>
        </div>
      )}

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden bg-surface/90 backdrop-blur-lg fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] border-t border-outline-variant/30">
        <button
          onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
          className={`flex flex-col items-center justify-center rounded-full px-5 py-2 scale-90 transition-all duration-200 ${mobileView === 'map' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'}`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: mobileView === 'map' ? "'FILL' 1" : "'FILL' 0" }}>map</span>
          <span className="font-label-sm text-[10px] mt-1">{mobileView === 'map' ? 'List' : 'Map'}</span>
        </button>
        <button onClick={() => setShowAddForm(true)} className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-container rounded-full">
          <span className="material-symbols-outlined text-[24px]">add_location</span>
          <span className="font-label-sm text-[10px] mt-1">Add</span>
        </button>
        <a className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-container rounded-full" href="#">
          <span className="material-symbols-outlined text-[24px]">diversity_1</span>
          <span className="font-label-sm text-[10px] mt-1">Community</span>
        </a>
      </nav>
    </main>
  );
}
