import { useState, useEffect } from 'react';
import ContainerMap from './ContainerMap';
import { Skeleton } from './ui/skeleton';
import type { VesselInfo } from '@/data/containerEvents';

interface ClientOnlyMapProps {
  position: [number, number];
  vesselInfo: VesselInfo;
}

const ClientOnlyMap = (props: ClientOnlyMapProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Skeleton className="h-full w-full" />;
  }

  return <ContainerMap {...props} />;
};

export default ClientOnlyMap;