import { useState, useEffect } from 'react';
import ContainerMap from './ContainerMap';
import { Skeleton } from './ui/skeleton';
import type { VesselInfo } from '@/data/containerEvents';

interface ClientOnlyMapProps {
  position: [number, number];
  vesselInfo: VesselInfo;
  onVesselClick: (vesselInfo: VesselInfo) => void;
}

const ClientOnlyMap = (props: ClientOnlyMapProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Skeleton className="h-full w-full" />;
  }

  // Delegar a ContainerMap, pasando todos los props
  return <ContainerMap {...props} />;
};

export default ClientOnlyMap;