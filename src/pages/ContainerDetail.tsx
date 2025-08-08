import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Ship as ShipIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import IntelligentAgent from "@/components/IntelligentAgent";
import ClientOnlyMap from "@/components/ClientOnlyMap";
import { allDetailedContainerData } from "@/data/detailedMockData";
import EventTimeline from "@/components/EventTimeline";
import VesselDetailPanel from "@/components/VesselDetailPanel";
import type { VesselInfo } from "@/data/containerEvents";

const InfoCard = ({ title, value, children }: { title: string; value: string; children?: React.ReactNode }) => (
  <Card className="flex-1 min-w-[180px]">
    <CardHeader className="pb-2">
      <p className="text-sm text-muted-foreground">{title}</p>
    </CardHeader>
    <CardContent>
      <p className="text-lg font-semibold">{value}</p>
      {children}
    </CardContent>
  </Card>
);

const VesselInfoCard = ({ vesselInfo }: { vesselInfo: VesselInfo }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center text-base font-medium">
        <ShipIcon className="h-5 w-5 mr-3 text-primary" />
        Información del Buque
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Nombre:</span>
        <span className="font-semibold">{vesselInfo.vessel_name}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">IMO:</span>
        <span className="font-semibold">{vesselInfo.vessel_imo}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tipo:</span>
        <span className="font-semibold">{vesselInfo.vessel_type}</span>
      </div>
    </CardContent>
  </Card>
);

const ContainerDetail = () => {
  const { containerId } = useParams();
  const [selectedVessel, setSelectedVessel] = useState<VesselInfo | null>(null);
  
  const container = allDetailedContainerData.find(c => c.container_number === containerId);

  if (!container) {
    return (
      <div>
        <Link to="/container-tracking" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Link>
        <h1 className="text-2xl font-bold mt-2">Contenedor No: {containerId}</h1>
        <p className="mt-4">No se encontraron datos detallados para este contenedor.</p>
      </div>
    );
  }

  const handleVesselClick = (vesselInfo: VesselInfo) => {
    setSelectedVessel(vesselInfo);
  };

  const handleClosePanel = () => {
    setSelectedVessel(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/container-tracking" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Link>
        <h1 className="text-2xl font-bold mt-2">Contenedor No: {container.container_number}</h1>
      </div>

      <div className="flex flex-wrap gap-4">
        <InfoCard title="Conocimiento de Embarque" value={container.bill_of_lading} />
        <InfoCard title="Transportista" value={container.carrier} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="h-64 relative z-0">
            <CardContent className="h-full p-0">
              <ClientOnlyMap 
                position={container.current_position} 
                vesselInfo={container.vessel_info}
                onVesselClick={handleVesselClick}
              />
            </CardContent>
          </Card>
          <VesselInfoCard vesselInfo={container.vessel_info} />
          <IntelligentAgent />
        </div>
        <div className="lg:col-span-2">
          {selectedVessel ? (
            <VesselDetailPanel vesselInfo={selectedVessel} onClose={handleClosePanel} />
          ) : (
            <EventTimeline events={container.events} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ContainerDetail;