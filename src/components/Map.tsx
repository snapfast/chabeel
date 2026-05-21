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
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0
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
          // Fallback to IP location as a last resort
          await getIPLocation();
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0
        }
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

        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={createChabeelIcon()}
          >
            <Popup>
              <div className="p-1 min-w-[220px]">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-bold text-lg text-on-surface leading-tight">{loc.name}</h3>
                    {loc.locationName && (
                      <div className="flex items-start gap-1 text-on-surface-variant opacity-80">
                        <span className="material-symbols-outlined text-[14px] mt-0.5">location_on</span>
                        <span className="text-[10px] leading-tight">{loc.locationName}</span>
                      </div>
                    )}
                  </div>

                  {loc.serviceType && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-tight">
                        <span className="material-symbols-outlined text-[12px]">restaurant</span>
                        {loc.serviceType}
                      </span>
                      {loc.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-tight">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Verified
                        </span>
                      )}
                    </div>
                  )}

                  {loc.description && (
                    <p className="text-xs text-on-surface-variant whitespace-pre-wrap line-clamp-2 bg-surface-container-lowest p-2 rounded-md border border-outline-variant/10">
                      {loc.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider mb-0.5">Status & Time</p>
                        <div className="flex flex-col gap-1">
                          {loc.status === "active" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] text-[9px] font-bold uppercase w-fit">
                              <span className="w-1 h-1 rounded-full bg-[#137333]"></span> Active
                            </span>
                          )}
                          {loc.status === "upcoming" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[9px] font-bold uppercase w-fit">
                              Upcoming
                            </span>
                          )}
                          {loc.status === "ended" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[9px] font-bold uppercase w-fit">
                              Ended
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {loc.operatingHours || 'Not specified'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider mb-0.5">Timeline</p>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[11px] font-medium text-on-surface">
                            {loc.startDate ? new Date(loc.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "N/A"}
                          </span>
                          <span className="text-[9px] text-on-surface-variant uppercase">
                            {loc.durationDays} {loc.durationDays === 1 ? "Day" : "Days"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 border-l border-outline-variant/20 pl-3">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider mb-0.5">Contact</p>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-on-surface truncate">
                            {loc.contactName || 'Anonymous'}
                          </span>
                          {loc.contactPhone && (
                            <a href={`tel:${loc.contactPhone}`} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">call</span>
                              {loc.contactPhone}
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider mb-0.5">Source</p>
                        <span className="text-[10px] font-medium text-on-surface-variant uppercase">
                          {loc.source || 'Community'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[8px] text-outline uppercase font-bold tracking-tighter opacity-50 px-1">
                    <span>Public • Crowd Sourced</span>
                    <span>{loc.id.slice(0, 8)}</span>
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
