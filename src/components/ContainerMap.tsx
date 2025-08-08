import { useEffect, useRef } from 'react';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { Ship } from 'lucide-react';
import type { VesselInfo } from '@/data/containerEvents';

interface ContainerMapProps {
  position: [number, number];
  vesselInfo: VesselInfo;
  onVesselClick: (vesselInfo: VesselInfo) => void;
}

const ContainerMap = ({ position, vesselInfo, onVesselClick }: ContainerMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: position,
        zoom: 5,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && vesselInfo) {
      mapInstanceRef.current.setView(position, 5);

      const shipIconHtml = ReactDOMServer.renderToString(
        <div className="bg-primary p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-pointer">
          <Ship className="h-5 w-5 text-white" />
        </div>
      );

      const customShipIcon = L.divIcon({
        html: shipIconHtml,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      const marker = L.marker(position, { icon: customShipIcon }).addTo(mapInstanceRef.current);
      markerRef.current = marker;

      marker.on('click', () => {
        onVesselClick(vesselInfo);
      });
    }
  }, [position, vesselInfo, onVesselClick]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '100%', width: '100%', borderRadius: 'var(--radius)' }} 
    />
  );
};

export default ContainerMap;