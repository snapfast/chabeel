'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { ChabeelLocation } from '@/types';
import { Locate } from 'lucide-react';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const UserLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
    <div class="relative w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapProps {
  locations: ChabeelLocation[];
  onMapClick: (lat: number, lng: number) => void;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Map({ locations, onMapClick }: MapProps) {
  const [center, setCenter] = useState<[number, number]>([30.7333, 76.7794]); // Default to Chandigarh
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const findMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newPos);
          setCenter(newPos);
        },
        (error) => {
          console.error('Error finding location:', error);
          alert('Could not get your location. Please check browser permissions.');
        }
      );
    }
  };

  useEffect(() => {
    // Attempt initial geolocation once on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setCenter(newPos);
          setUserLocation(newPos);
        },
        () => console.log('Initial geolocation failed or denied')
      );
    }
  }, []);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{loc.name}</h3>
                {loc.description && <p className="text-sm mt-1">{loc.description}</p>}
                <div className="mt-2 text-[10px] text-gray-400">
                  Added: {new Date(loc.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={userLocation} icon={UserLocationIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        <ClickHandler onMapClick={onMapClick} />
        <MapUpdater center={center} />
      </MapContainer>

      {/* Locate Me Button Overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          findMe();
        }}
        className="absolute bottom-6 left-6 z-[1000] bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors text-orange-600"
        title="Find my location"
        aria-label="Locate Me"
      >
        <Locate size={24} />
      </button>
    </div>
  );
}
