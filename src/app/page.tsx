'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import { ChabeelLocation } from '@/types';
import { Plus, X, Search, MapPin, Loader2 } from 'lucide-react';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
});

export default function Home() {
  const [locations, setLocations] = useState<ChabeelLocation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', lat: 0, lng: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!searchQuery.trim()) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(loc =>
      loc.name.toLowerCase().includes(query) ||
      (loc.description && loc.description.toLowerCase().includes(query))
    );
  }, [locations, searchQuery]);

  const handleMapClick = (lat: number, lng: number) => {
    setFormData({ ...formData, lat, lng });
    setShowAddForm(true);
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
        setFormData({ name: '', description: '', lat: 0, lng: 0 });
        fetchLocations();
      }
    } catch (error) {
      console.error('Failed to save location', error);
    }
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <header className="bg-orange-500 text-white p-4 shadow-md flex flex-col sm:flex-row justify-between items-center z-10 gap-4">
        <div className="flex items-center gap-2">
          <MapPin size={24} />
          <h1 className="text-xl font-bold">Chabeel Finder</h1>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64 md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-orange-300" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-full leading-5 bg-orange-600 text-white placeholder-orange-200 focus:outline-none focus:bg-white focus:text-gray-900 sm:text-sm transition-all"
            placeholder="Search Chabeel locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="hidden md:block text-xs font-medium bg-orange-600 px-3 py-1 rounded-full border border-orange-400">
          Public Community Database
        </div>
      </header>

      <div className="flex-1 relative">
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-orange-500 mb-2" size={48} />
            <p className="text-gray-500 font-medium">Loading map and locations...</p>
          </div>
        ) : (
          <Map locations={filteredLocations} onMapClick={handleMapClick} />
        )}

        {/* Floating Add Button Hint */}
        {!showAddForm && !loading && (
          <div className="absolute bottom-8 right-8 z-[1000] bg-white p-4 rounded-lg shadow-xl border border-orange-200 pointer-events-none animate-bounce hidden sm:block">
            <p className="text-orange-600 font-semibold flex items-center gap-2">
              <Plus size={20} /> Click on map to add Chabeel!
            </p>
          </div>
        )}

        {/* Search Results Summary (Mobile/Compact) */}
        {searchQuery && !loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md border border-orange-100 text-sm font-medium text-orange-600">
            Found {filteredLocations.length} locations
          </div>
        )}

        {/* Add Location Sidebar/Modal */}
        {showAddForm && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white z-[1001] shadow-2xl p-6 transition-transform transform translate-x-0 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add Chabeel</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name / Location Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Gurudwara Sector 34 Chabeel"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="What time? Any specifics?"
                  className="w-full p-2 border rounded-md h-32 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-md border border-dashed border-gray-300">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Selected Location</p>
                <p className="text-xs font-mono text-gray-600">{formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}</p>
              </div>
              <button
                type="submit"
                className="w-full bg-orange-500 text-white font-bold py-3 rounded-md hover:bg-orange-600 transition-all shadow-lg active:scale-[0.98]"
              >
                Save Public Location
              </button>
            </form>
          </div>
        )}
      </div>

      <footer className="bg-white border-t p-2 text-center text-[10px] text-gray-400 z-10 flex justify-between px-4">
        <span>&copy; {new Date().getFullYear()} Chabeel Finder</span>
        <span>Community Driven &middot; Public Domain Data</span>
      </footer>
    </main>
  );
}
