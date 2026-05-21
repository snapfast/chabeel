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

const createChabeelIcon = () => {
  return L.divIcon({
    className: 'custom-chabeel-icon',
    html: `<div class="relative flex items-end justify-center group w-[60px] h-[60px]">
      <span class="material-symbols-outlined text-error text-[60px] leading-none drop-shadow-md group-hover:scale-110 transition-transform" style="font-variation-settings: 'FILL' 1; display: block;">location_on</span>
    </div>`,
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -55]
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
  onDelete?: (id: string) => void;
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
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

export default function Map({ locations, onMapClick, onDelete }: MapProps) {
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
    const getIPLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.latitude && data.longitude) {
          const newPos: [number, number] = [data.latitude, data.longitude];
          setCenter(newPos);
          // Set userLocation to show the approximate "nearby" area
          setUserLocation(newPos);
        }
      } catch (error) {
        console.error('IP Geolocation failed:', error);
      }
    };

    // Attempt initial geolocation once on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setCenter(newPos);
          setUserLocation(newPos);
        },
        async (error) => {
          console.log('Initial geolocation failed or denied:', error.message);
          await getIPLocation();
        },
        { timeout: 5000 }
      );
    } else {
      getIPLocation();
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

        {locations.map((loc) => {
          let startDate: Date;
          if (loc.startDate) {
            const [y, m, d] = loc.startDate.split('-').map(Number);
            // Use UTC to avoid local timezone issues
            startDate = new Date(Date.UTC(y, m - 1, d));
          } else {
            startDate = new Date(loc.createdAt);
          }

          if (isNaN(startDate.getTime())) {
            startDate = new Date(loc.createdAt);
          }

          const endDate = new Date(startDate);
          if (loc.durationDays) {
            endDate.setUTCDate(startDate.getUTCDate() + loc.durationDays);
          }

          const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            timeZone: 'UTC'
          };

          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={createChabeelIcon()}
            >
              <Popup>
                <div className="p-2 min-w-[240px]">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        {loc.status === 'active' && (
                          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-label-sm text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span> Active
                          </span>
                        )}
                        {loc.status === 'upcoming' && (
                          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-[10px]">
                            <span className="material-symbols-outlined text-[12px]">schedule</span> Upcoming
                          </span>
                        )}
                        {loc.status === 'ended' && (
                          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-[10px]">
                            Ended
                          </span>
                        )}
                        <h3 className="font-bold text-lg text-on-surface leading-tight">{loc.name}</h3>
                      </div>
                    </div>

                    {loc.locationName && (
                      <div className="flex items-start gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] mt-0.5">location_on</span>
                        <span className="text-xs leading-relaxed">{loc.locationName}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-2 rounded-lg border border-outline-variant/10">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider">Start Date</p>
                        <p className="text-xs font-medium text-on-surface">{startDate.toLocaleDateString('en-US', options)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider">End Date</p>
                        <p className="text-xs font-medium text-on-surface">{endDate.toLocaleDateString('en-US', options)}</p>
                      </div>
                    </div>

                    {loc.description && (
                      <div className="mt-1">
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider mb-1">Description</p>
                        <p className="text-xs text-on-surface-variant bg-surface-container-lowest p-2 rounded-md border border-outline-variant/5 whitespace-pre-wrap">{loc.description}</p>
                      </div>
                    )}

                    <div className="mt-2 text-[10px] text-outline border-t border-outline-variant/20 pt-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between opacity-60 italic">
                        <span>Public • Crowd Sourced</span>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(loc.id)}
                            className="text-error font-bold hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker position={userLocation} icon={UserLocationIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        <MapEvents onMapClick={onMapClick} />
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
