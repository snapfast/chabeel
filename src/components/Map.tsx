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

const ChabeelIcon = L.divIcon({
  className: 'custom-chabeel-icon',
  html: `<div class="relative flex items-end justify-center group w-[60px] h-[60px]">
    <span class="material-symbols-outlined text-error text-[60px] leading-none drop-shadow-md group-hover:scale-110 transition-transform" style="font-variation-settings: 'FILL' 1; display: block;" aria-hidden="true">location_on</span>
  </div>`,
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -55]
});

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

function MapEvents({
  onMapClick,
  onZoomChange,
  onCenterChange
}: {
  onMapClick: (lat: number, lng: number) => void;
  onZoomChange: (zoom: number) => void;
  onCenterChange: (center: [number, number]) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    zoomend() {
      onZoomChange(map.getZoom());
    },
    moveend() {
      const center = map.getCenter();
      onCenterChange([center.lat, center.lng]);
    }
  });

  return null;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function Map({ locations, onMapClick }: MapProps) {
  const [center, setCenter] = useState<[number, number]>([30.7333, 76.7794]); // Default to Chandigarh
  const [zoom, setZoom] = useState(13);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Leaflet icons on mount
  useEffect(() => {
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  const findMe = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newPos);
          setCenter(newPos);
          setZoom(16);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error finding location:', error);
          alert('Could not get your location. Please check browser permissions.');
          setIsLocating(false);
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
          setZoom(16);
        },
        async () => {
          // Fallback to IP location as a last resort
          await getIPLocation();
          setZoom(13); // Keep it wider for IP location as it's less accurate
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
        zoom={zoom}
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
            icon={ChabeelIcon}
            eventHandlers={{
              click: () => {
                setCenter([loc.lat, loc.lng]);
                setZoom(prev => Math.max(prev, 16));
              },
            }}
          >
            <Popup>
              <div className="p-1 min-w-[280px]">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-xl text-black leading-tight">{loc.name}</h3>
                    {loc.locationName && (
                      <div className="flex items-start gap-1 text-black">
                        <span className="material-symbols-outlined text-[16px] mt-0.5" aria-hidden="true">location_on</span>
                        <span className="text-sm leading-tight font-medium">{loc.locationName}</span>
                      </div>
                    )}
                  </div>

                  {loc.serviceType && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-2 border-black bg-white text-black text-xs font-bold uppercase tracking-tight">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">restaurant</span>
                        {loc.serviceType}
                      </span>
                      {loc.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-2 border-black bg-white text-black text-xs font-bold uppercase tracking-tight">
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">verified</span>
                          Verified
                        </span>
                      )}
                    </div>
                  )}

                  {loc.description && (
                    <p className="text-sm text-black whitespace-pre-wrap p-3 rounded-md border-2 border-black bg-white font-medium">
                      {loc.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase font-bold text-black tracking-wider mb-1">Status & Time</p>
                        <div className="flex flex-col gap-1.5">
                          {loc.status === "active" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border-2 border-black bg-white text-black text-xs font-bold uppercase w-fit">
                              <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span> Active
                            </span>
                          )}
                          {loc.status === "upcoming" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border-2 border-black bg-white text-black text-xs font-bold uppercase w-fit">
                              Upcoming
                            </span>
                          )}
                          {loc.status === "ended" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border-2 border-black bg-white text-black text-xs font-bold uppercase w-fit">
                              Ended
                            </span>
                          )}
                          <span className="text-sm font-bold text-black flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">schedule</span>
                            {loc.operatingHours || 'Not specified'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase font-bold text-black tracking-wider mb-1">Timeline</p>
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-bold text-black">
                            {loc.startDate ? new Date(loc.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "N/A"}
                          </span>
                          <span className="text-xs text-black font-bold uppercase">
                            {loc.durationDays} {loc.durationDays === 1 ? "Day" : "Days"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 border-l-2 border-black pl-4">
                      <div>
                        <p className="text-xs uppercase font-bold text-black tracking-wider mb-1">Contact</p>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-black truncate">
                            {loc.contactName || 'Anonymous'}
                          </span>
                          {loc.contactPhone && (
                            <a href={`tel:${loc.contactPhone}`} className="text-sm text-black underline font-black flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">call</span>
                              {loc.contactPhone}
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase font-bold text-black tracking-wider mb-1">Source</p>
                        <span className="text-sm font-bold text-black uppercase">
                          {loc.source || 'Community'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-black uppercase font-black tracking-tighter px-1 border-t border-black/10 pt-2">
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

        <MapEvents
          onMapClick={(lat, lng) => {
            setCenter([lat, lng]);
            setZoom(prev => Math.max(prev, 16));
            onMapClick(lat, lng);
          }}
          onZoomChange={(newZoom) => {
            setZoom((prev) => (prev !== newZoom ? newZoom : prev));
          }}
          onCenterChange={(newCenter) => {
            setCenter((prev) => {
              if (prev[0] === newCenter[0] && prev[1] === newCenter[1]) return prev;
              return newCenter;
            });
          }}
        />
        <MapUpdater center={center} zoom={zoom} />
      </MapContainer>

      {/* Locate Me Button Overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          findMe();
        }}
        disabled={isLocating}
        className="absolute bottom-6 left-6 z-[1000] bg-surface p-3 rounded-full shadow-lg border border-outline-variant/30 hover:bg-surface-container-low transition-colors text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        title="Find my location"
        aria-label={isLocating ? "Locating..." : "Locate Me"}
      >
        <span className={`material-symbols-outlined ${isLocating ? 'animate-spin' : ''}`} aria-hidden="true">
          {isLocating ? 'progress_activity' : 'my_location'}
        </span>
      </button>
    </div>
  );
}
