import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { Ship } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from './ui/skeleton';
import VesselDetailPanel from './VesselDetailPanel';
import type { VesselInfo } from '@/data/containerEvents';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type TrackingData = {
  id: string;
  latitude: number;
  longitude: number;
  vessel_name: string;
  vessel_type: string;
  vessel_imo: string;
  vessel_image_url: string;
  shipped_to: string | null;
  pod_eta_date: string | null;
  current_status: string | null;
  updated_at: string | null;
  port_of_load: string | null;
};

const mockVessels: TrackingData[] = [
  { id: 'mock-1', latitude: 34.0522, longitude: -118.2437, vessel_name: 'Mock Maersk', vessel_type: 'Container Ship', vessel_imo: '9876543', vessel_image_url: '/vessel.jpg', shipped_to: 'Port of Los Angeles', pod_eta_date: '2025-08-20', current_status: 'In Transit', updated_at: new Date().toISOString(), port_of_load: 'Port of Shanghai' },
  { id: 'mock-2', latitude: 40.7128, longitude: -74.0060, vessel_name: 'Mock MSC', vessel_type: 'Container Ship', vessel_imo: '9876544', vessel_image_url: '/vessel.jpg', shipped_to: 'Port of New York', pod_eta_date: '2025-08-22', current_status: 'In Transit', updated_at: new Date().toISOString(), port_of_load: 'Port of Rotterdam' },
  { id: 'mock-3', latitude: 4.5709, longitude: -74.2973, vessel_name: 'Mock CMA CGM', vessel_type: 'Container Ship', vessel_imo: '9876545', vessel_image_url: '/vessel.jpg', shipped_to: 'Port of Cartagena', pod_eta_date: '2025-08-18', current_status: 'At Port', updated_at: new Date().toISOString(), port_of_load: 'Port of Singapore' },
  { id: 'mock-4', latitude: 51.5072, longitude: -0.1276, vessel_name: 'Mock Hapag-Lloyd', vessel_type: 'Container Ship', vessel_imo: '9876546', vessel_image_url: '/vessel.jpg', shipped_to: 'Port of London', pod_eta_date: '2025-08-25', current_status: 'In Transit', updated_at: new Date().toISOString(), port_of_load: 'Port of Hamburg' },
];

const GlobalContainerMap = () => {
  const [isClient, setIsClient] = useState(false);
  const [trackings, setTrackings] = useState<TrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<VesselInfo | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    const fetchTrackings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('container_trackings')
        .select('id, latitude, longitude, vessel_name, vessel_type, vessel_imo, vessel_image_url, shipped_to, pod_eta_date, current_status, updated_at, port_of_load')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error("Error fetching trackings:", error);
        setTrackings(mockVessels);
      } else {
        const combined = [...(data as TrackingData[]), ...mockVessels];
        const uniqueTrackings = Array.from(new Map(combined.map(item => [item.id, item])).values());
        setTrackings(uniqueTrackings);
      }
      setLoading(false);
    };

    fetchTrackings();
  }, []);

  useEffect(() => {
    if (isClient && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    if (mapInstanceRef.current && trackings.length > 0) {
      mapInstanceRef.current.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current?.removeLayer(layer);
        }
      });

      const shipIconHtml = ReactDOMServer.renderToString(
        <div className="bg-primary p-1 rounded-full shadow-lg border border-white flex items-center justify-center cursor-pointer">
          <Ship className="h-4 w-4 text-white" />
        </div>
      );
      const customShipIcon = L.divIcon({ html: shipIconHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });

      trackings.forEach(tracking => {
        if (tracking.latitude && tracking.longitude) {
          const marker = L.marker([tracking.latitude, tracking.longitude], { icon: customShipIcon }).addTo(mapInstanceRef.current!);
          marker.on('click', () => {
            const vesselInfo: VesselInfo = {
              vessel_name: tracking.vessel_name,
              vessel_type: tracking.vessel_type,
              vessel_imo: tracking.vessel_imo,
              imageUrl: tracking.vessel_image_url || '/vessel.jpg',
              destination: tracking.shipped_to || "Desconocido",
              eta: tracking.pod_eta_date ? format(new Date(tracking.pod_eta_date), "dd MMM, yyyy", { locale: es }) : "No disponible",
              status: tracking.current_status || "En tránsito",
              speed: `${(Math.random() * 8 + 8).toFixed(1)} kn`,
              course: `${(Math.random() * 360).toFixed(1)}°`,
              draught: `${(Math.random() * 5 + 7).toFixed(1)} m`,
              lastReport: tracking.updated_at ? formatDistanceToNow(new Date(tracking.updated_at), { addSuffix: true, locale: es }) : "Reciente",
              lastPort: tracking.port_of_load || "Desconocido",
              atd: "hace 8 días (simulado)",
              grossTonnage: `${Math.floor(Math.random() * 20000 + 20000)}`,
              deadweight: `${Math.floor(Math.random() * 30000 + 30000)}`,
              built: `${Math.floor(Math.random() * 20 + 2000)}`,
              size: "200 / 31m (simulado)",
              mmsi: `${Math.floor(Math.random() * 100000000 + 600000000)}`,
              voyage_number: `NX${Math.floor(Math.random() * 900 + 100)}A`,
            };
            setSelectedVessel(vesselInfo);
          });
        }
      });
    }
  }, [isClient, trackings]);

  if (!isClient || loading) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainerRef} className="h-full w-full" />
      {selectedVessel && (
        <div className="absolute top-4 right-4 h-[calc(100%-2rem)] w-[380px] z-[1000] shadow-2xl rounded-lg">
          <VesselDetailPanel vesselInfo={selectedVessel} onClose={() => setSelectedVessel(null)} />
        </div>
      )}
    </div>
  );
};

export default GlobalContainerMap;