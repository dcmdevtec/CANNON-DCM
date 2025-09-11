import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Ship as ShipIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import IntelligentAgent from "@/components/IntelligentAgent";
import ClientOnlyMap from "@/components/ClientOnlyMap";
import EventTimeline from "@/components/EventTimeline";
import VesselDetailPanel from "@/components/VesselDetailPanel";
import { supabase } from "@/integrations/supabase/client";


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

const VesselInfoCard = ({ vesselInfo }: { vesselInfo: any }) => (
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
        <span className="font-semibold">{vesselInfo.last_vessel_name || vesselInfo.current_vessel_name || vesselInfo.name || vesselInfo.name_ais || "-"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">IMO:</span>
        <span className="font-semibold">{vesselInfo.imo || vesselInfo.last_voyage_number || vesselInfo.current_voyage_number || "-"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tipo:</span>
        <span className="font-semibold">{vesselInfo.type || vesselInfo.type_specific || vesselInfo.container_type || "-"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Conocimiento de Embarque:</span>
        <span className="font-semibold">{vesselInfo.bill_of_lading || "-"}</span>
      </div>
    </CardContent>
  </Card>
);


const ContainerDetail = () => {
  const { containerId } = useParams();
  const [selectedVessel, setSelectedVessel] = useState<any | null>(null);
  const [container, setContainer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContainer = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_tracking_contenedor_completo')
        .select('*')
        .eq('num_contenedor', containerId)
        .single();
      setContainer(data);
      setLoading(false);
    };
    fetchContainer();
  }, [containerId]);

  if (loading) {
    return <div>Cargando...</div>;
  }

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

  const handleVesselClick = (vesselInfo: any) => {
    // Consulta la tabla cnn_vessel_position por el IMO y muestra los datos traducidos
    const fetchVessel = async () => {
      const { data, error } = await supabase
        .from('cnn_vessel_position')
        .select('*')
        .eq('imo', vesselInfo.imo)
        .single();
      if (data) {
        setSelectedVessel({
          nombre_buque: data.name || '-',
          tipo_buque: data.type || data.type_specific || '-',
          imo: data.imo || '-',
          mmsi: data.mmsi || '-',
          destino: data.destination || '-',
          eta: data.eta_UTC ? data.eta_UTC.split('T')[0] : '-',
          velocidad: data.speed ? data.speed.toString() + ' nudos' : '-',
          rumbo: data.course ? data.course.toString() + '°' : '-',
          calado: data.draught_max ? data.draught_max.toString() + ' m' : '-',
          estado_navegacion: data.navigation_status || '-',
          ultimo_reporte: data.last_position_UTC ? data.last_position_UTC.split('T')[0] : '-',
          puerto_origen: data.home_port || '-',
          tonelaje_bruto: data.gross_tonnage ? data.gross_tonnage.toString() : '-',
          peso_muerto: data.deadweight ? data.deadweight.toString() : '-',
          construido: data.year_built || '-',
          dimensiones: data.length && data.breadth ? `${data.length} / ${data.breadth} m` : '-',
          imagen: '/vessel.jpg', // Si tienes una URL real, cámbiala aquí
        });
      } else {
        setSelectedVessel(null);
      }
    };
    fetchVessel();
  };

  const handleClosePanel = () => {
    setSelectedVessel(null);
  };

  return (
    <div className="space-y-6 relative">
      <div>
        <Link to="/container-tracking" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Link>
        <h1 className="text-2xl font-bold mt-2">Contenedor No: {container.container_id}</h1>
      </div>

      <div className="flex flex-wrap gap-4">
        <InfoCard title="Conocimiento de Embarque" value={container.bill_of_lading || "-"} />
        <InfoCard title="Transportista" value={container.shipping_line_name || container.naviera || "-"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="h-64 relative z-0">
            <CardContent className="h-full p-0">
              {/* Proyecta la ubicación del buque usando las coordenadas de la vista */}
              <ClientOnlyMap 
                position={container.lat && container.lon ? [container.lat, container.lon] : [0, 0]}
                vesselInfo={container}
                onVesselClick={handleVesselClick}
              />
            </CardContent>
          </Card>
          <VesselInfoCard vesselInfo={container} />
          <IntelligentAgent />
        </div>
        <div className="lg:col-span-2">
          {!selectedVessel ? (
            <EventTimeline
              events={[
                container.atd_last_location && {
                  id: "1",
                  event_type: 'Salida Origen',
                  event_description: `Salida de origen: ${container.shipped_from_terminal || container.shipped_from || '-'}`,
                  event_datetime: container.atd_last_location,
                  location: container.shipped_from_terminal || container.shipped_from || '-',
                  vessel_name: container.last_vessel_name || container.current_vessel_name || '-'
                },
                container.eta_final_destination && {
                  id: "2",
                  event_type: 'Llegada Destino',
                  event_description: `Llegada a destino: ${container.shipped_to_terminal || container.shipped_to || '-'}`,
                  event_datetime: container.eta_final_destination,
                  location: container.shipped_to_terminal || container.shipped_to || '-',
                  vessel_name: container.last_vessel_name || container.current_vessel_name || '-'
                },
                container.last_location && {
                  id: "3",
                  event_type: 'Última Ubicación',
                  event_description: `Última ubicación: ${container.last_location_terminal || container.last_location || '-'}`,
                  event_datetime: container.timestamp_of_last_location,
                  location: container.last_location_terminal || container.last_location || '-',
                  vessel_name: container.last_vessel_name || container.current_vessel_name || '-'
                }
              ].filter(Boolean)}
            />
          ) : null}
        </div>
      </div>
      {selectedVessel && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-[400px] max-h-[90vh] overflow-y-auto">
            <VesselDetailPanel vesselInfo={selectedVessel} onClose={handleClosePanel} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainerDetail;