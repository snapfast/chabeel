'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { ChabeelLocation } from '@/types';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const createChabeelIcon = (status: 'active' | 'upcoming' | 'ended' = 'active') => {
  const colorClass = status === 'active' ? 'text-primary' : status === 'upcoming' ? 'text-outline' : 'text-outline-variant';
  const pingEffect = status === 'active' ? '<div class="absolute inset-0 bg-secondary-container opacity-20 rounded-full animate-ping"></div>' : '';

  return L.divIcon({
    className: 'custom-chabeel-icon',
    html: `<div class="relative flex items-center justify-center group">
      <span class="material-symbols-outlined ${colorClass} text-[40px] drop-shadow-md group-hover:scale-110 transition-transform" style="font-variation-settings: 'FILL' 1;">location_on</span>
      ${pingEffect}
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35]
  });
};

const UserLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-4 h-4 bg-primary-container rounded-full animate-ping opacity-75"></div>
    <div class="relative w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm"></div>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapProps {
  locations: ChabeelLocation[];
  onMapClick: (lat: number, lng: number) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  onDelete?: (id: string) => void;
}

function MapEvents({ onMapClick, onBoundsChange }: { onMapClick: (lat: number, lng: number) => void, onBoundsChange?: (bounds: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    moveend() {
      if (onBoundsChange) {
        onBoundsChange(map.getBounds());
      }
    },
    zoomend() {
      if (onBoundsChange) {
        onBoundsChange(map.getBounds());
      }
    }
  });

  useEffect(() => {
    if (onBoundsChange) {
      onBoundsChange(map.getBounds());
    }
  }, []);

  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Map({ locations, onMapClick, onBoundsChange, onDelete }: MapProps) {
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
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={createChabeelIcon(loc.status)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex flex-col gap-1">
                  {loc.status === 'active' && (
                    <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-label-sm text-[10px] mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span> Active
                    </span>
                  )}
                  {loc.status === 'upcoming' && (
                    <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-[10px] mb-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span> Starts in 2h
                    </span>
                  )}
                  {loc.status === 'ended' && (
                    <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-[10px] mb-1">
                      Ended
                    </span>
                  )}
                  <h3 className="font-bold text-lg text-on-surface">{loc.name}</h3>
                  {loc.description && <p className="text-sm mt-1 text-on-surface-variant">{loc.description}</p>}
                  <div className="mt-2 text-[10px] text-outline border-t border-outline-variant/20 pt-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span>Added: {new Date(loc.createdAt).toLocaleDateString()}</span>
                    </div>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(loc.id)}
                        className="text-error font-bold hover:underline self-end"
                      >
                        Delete Chabeel
                      </button>
                    )}
                  </div>
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

        <MapEvents onMapClick={onMapClick} onBoundsChange={onBoundsChange} />
        <MapUpdater center={center} />
      </MapContainer>

      {/* Locate Me Button Overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          findMe();
        }}
        className="absolute bottom-6 left-6 z-[1000] bg-surface p-3 rounded-full shadow-lg border border-outline-variant/30 hover:bg-surface-container-low transition-colors text-primary"
        title="Find my location"
        aria-label="Locate Me"
      >
        <span className="material-symbols-outlined">my_location</span>
      </button>
    </div>
  );
}
