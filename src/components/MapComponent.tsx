import { useEffect, useRef } from 'react';
import { EventItem } from '../types';

// Declare Leaflet global type to satisfy TypeScript
declare const L: any;

interface MapComponentProps {
  events: EventItem[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  食事: '#EF4444', // Red-orange
  観光: '#10B981', // Emerald
  酒: '#F59E0B',   // Amber
  イベント: '#3B82F6', // Blue
};

export default function MapComponent({ events, selectedEventId, onSelectEvent }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center on Tokai region center (approximately between Gifu/Aichi)
    const map = L.map(mapContainerRef.current, {
      center: [35.5, 137.8],
      zoom: 8,
      scrollWheelZoom: true,
    });

    // Clean OpenStreetMap style tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    // Force map to layout correctly
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle markers update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    Object.keys(markersRef.current).forEach((key) => {
      markersRef.current[key].remove();
    });
    markersRef.current = {};

    if (events.length === 0) return;

    const group: any[] = [];

    events.forEach((event) => {
      const color = CATEGORY_COLORS[event.category] || '#6B7280';
      
      // Create custom beautiful SVG pin
      const iconHtml = `
        <div class="custom-pin-wrapper" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 36px; height: 44px;">
          <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; color: white;">
            <span style="font-size: 11px; font-weight: bold; font-family: system-ui, sans-serif;">
              ${event.category === '食事' ? '食' : event.category === '観光' ? '観' : event.category === '酒' ? '酒' : 'イ'}
            </span>
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${color}; margin-top: -1px;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -44],
      });

      // Create popup content
      const popupContent = `
        <div style="font-family: system-ui, sans-serif; max-width: 220px;">
          <img src="${event.imageUrl}" alt="${event.title}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />
          <div style="display: flex; gap: 4px; margin-bottom: 4px; align-items: center;">
            <span style="background-color: ${color}; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
              ${event.category}
            </span>
            <span style="background-color: #F3F4F6; color: #374151; font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px;">
              ${event.prefecture}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #111827; line-height: 1.4;">${event.title}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #4B5563; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">${event.description}</p>
          <div style="font-size: 11px; color: #1F2937; border-top: 1px solid #E5E7EB; padding-top: 4px; font-weight: 500;">
            📍 ${event.location.split('（')[0]}
          </div>
        </div>
      `;

      const marker = L.marker([event.lat, event.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);

      marker.on('click', () => {
        onSelectEvent(event.id);
      });

      markersRef.current[event.id] = marker;
      group.push([event.lat, event.lng]);
    });

    // Auto fit bounds to show all markers beautifully if multiple markers exist
    if (group.length > 1) {
      map.fitBounds(group, { padding: [40, 40] });
    } else if (group.length === 1) {
      map.setView(group[0], 11);
    }
  }, [events]);

  // Handle active marker selection from parent component (e.g. clicking on list item)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedEventId) return;

    const marker = markersRef.current[selectedEventId];
    if (marker) {
      map.setView(marker.getLatLng(), 13);
      marker.openPopup();
    }
  }, [selectedEventId]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" id="map-container-outer">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-10" id="leaflet-map-element" />

      {/* Floating map controls indicator */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md text-white py-1 px-3 rounded-full text-xs font-mono flex items-center gap-2 z-20 shadow-lg border border-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Leaflet Engine Active • {events.length} Pins</span>
      </div>
    </div>
  );
}
