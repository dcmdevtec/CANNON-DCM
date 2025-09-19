import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchContainerTrackingDetail } from '../api/fetchContainerTrackingDetail';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactCountryFlag from 'react-country-flag';
import { ArrowLeft, CheckCircle, Ship, ArrowRight, Anchor, Package, Circle, Clock, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import VesselFinderEmbed from '@/components/VesselFinderEmbed';


const ContainerDetail: React.FC = () => {
  const { containerNumber } = useParams<{ containerNumber: string }>();
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMapEventId, setActiveMapEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!containerNumber) return;
    const cleanContainerNumber = decodeURIComponent(containerNumber).trim();
    setLoading(true);
    fetchContainerTrackingDetail(cleanContainerNumber)
      .then((data) => {
        setTrackingData(data);
      })
      .finally(() => setLoading(false));
  }, [containerNumber]);

  const getImoForVessel = (metadata: any, vesselName: string): string | null => {
    if (!metadata?.processing_notes || !vesselName) {
      return null;
    }
    const notes = metadata.processing_notes;
    const regex = new RegExp(`${vesselName.trim()}\\s*\\(IMO:\\s*(\\d+)\\)`);
    const match = notes.match(regex);
    return match ? match[1] : null;
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando detalles del contenedor...</div>;
  }

  if (!trackingData || !trackingData.tracking) {
    return <div className="p-8 text-center">No se encontraron datos para este contenedor.</div>;
  }

  const { tracking, events, summary } = trackingData;

  const sortedEvents = Array.isArray(events)
    ? [...events]
        .filter(e => e.event_date)
        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
    : [];

  const eventsWithETA = [...sortedEvents];
  if (tracking?.pod_eta_date && tracking?.shipped_to) {
    eventsWithETA.unshift({
      id: 'eta-destination',
      event_date: tracking.pod_eta_date,
      location: tracking.shipped_to,
      event_description: 'Llegada Estimada a Destino Final',
      isETA: true,
    });
  }

  const getEventIcon = (event: any, isFirst: boolean, isLast: boolean) => {
    const description = (event.event_description || event.event_type || '').toLowerCase();
    const isFuture = event.isETA && new Date(event.event_date) > new Date();

    if (isFuture) return <Clock className="h-6 w-6 text-white" />;
    if (event.isETA) return <CheckCircle className="h-6 w-6 text-white" />;
    if (isFirst) return <div className="w-3 h-3 bg-white rounded-full animate-pulse" />;
    if (description.includes('loaded') || description.includes('discharged') || description.includes('transshipment')) return <Ship className="h-5 w-5 text-orange-600" />;
    if (description.includes('received')) return <Package className="h-5 w-5 text-blue-600" />;
    if (description.includes('empty')) return <Circle className="h-5 w-5 text-gray-500" />;
    if (isLast) return <ArrowRight className="h-5 w-5 text-gray-500" />;
    return <Anchor className="h-5 w-5 text-gray-600" />;
  };

  const getIconBgClass = (event: any, isFirst: boolean) => {
    const description = (event.event_description || event.event_type || '').toLowerCase();
    const isFuture = event.isETA && new Date(event.event_date) > new Date();

    if (isFuture) return 'border-blue-500 bg-blue-500 animate-pulse';
    if (event.isETA) return 'border-green-500 bg-green-500';
    if (isFirst) return 'border-blue-500 bg-blue-500';
    if (description.includes('loaded') || description.includes('discharged') || description.includes('transshipment')) return 'border-orange-500 bg-orange-100';
    if (description.includes('received')) return 'border-blue-400 bg-blue-100';
    if (description.includes('empty')) return 'border-gray-400 bg-gray-100';
    return 'border-gray-300 bg-white';
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Link to="/container-tracking" className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la lista
            </Link>
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Contenedor</span>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {tracking.container_number}
                  <Badge variant="outline">{tracking.container_type || '40\' HIGH CUBE'}</Badge>
                </h1>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-muted-foreground font-medium">Último Movimiento</span>
                <p className="font-semibold text-lg text-gray-900">{tracking.latest_move || 'Empty to Shipper'}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-muted-foreground font-medium">POD ETA</span>
                <p className="font-semibold text-lg text-gray-900">{tracking.pod_eta_date || '2025-09-24'}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-white rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle>Línea de Tiempo del Viaje</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative px-4">
                    {eventsWithETA.map((event: any, idx: number) => {
                      const eventKey = event.id || idx.toString();
                      const isMapVisible = activeMapEventId === eventKey;
                      const isFirst = idx === 0;
                      const isLast = idx === eventsWithETA.length - 1;
                      
                      let countryCode = '';
                      let locationDisplay = event.location || '';
                      if (event.location) {
                        const parts = event.location.split(',');
                        const last = parts[parts.length - 1]?.trim();
                        if (last && last.length === 2) {
                          countryCode = last.toUpperCase();
                          locationDisplay = parts.slice(0, -1).join(',').trim();
                        }
                      }
                      
                      const dateStr = event.event_date ? new Date(event.event_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                      const description = event.event_description || event.event_type || 'Evento sin descripción';
                      const hasVessel = !!event.vessel_name;
                      const vesselImo = getImoForVessel(tracking.metadata, event.vessel_name);

                      return (
                        <div key={eventKey} className="relative grid grid-cols-[4rem_1fr] pb-8">
                          {!isLast && <div className="absolute left-8 top-10 h-full w-0.5 bg-gray-200" />}
                          
                          <div className="flex justify-center pt-1">
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-md z-10 ${getIconBgClass(event, isFirst)}`}>
                              {getEventIcon(event, isFirst, isLast)}
                            </div>
                          </div>

                          <div className="pl-4">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_10rem] gap-x-4 gap-y-2">
                              <div>
                                <p className="font-semibold text-gray-800">{description}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                  {countryCode && <ReactCountryFlag countryCode={countryCode} svg style={{ width: '18px', height: '12px' }} />}
                                  <span>{locationDisplay}</span>
                                  <span className="text-gray-300">|</span>
                                  <span>{dateStr}</span>
                                </div>
                              </div>
                              <div className="text-left md:text-right">
                                <p className="font-medium text-sm text-blue-700">{event.vessel_name || '-'}</p>
                                {event.vessel_voyage && <p className="text-xs text-gray-500">Viaje: {event.vessel_voyage}</p>}
                                {hasVessel && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span tabIndex={0}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="mt-1 text-xs h-auto py-1 px-2 text-primary hover:bg-primary/10"
                                          onClick={() => setActiveMapEventId(isMapVisible ? null : eventKey)}
                                          disabled={!vesselImo}
                                        >
                                          <MapPin className="h-3 w-3 mr-1.5" />
                                          {isMapVisible ? 'Ocultar Mapa' : 'Ver Ubicación'}
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {!vesselImo && (
                                      <TooltipContent>
                                        <p>IMO no disponible para este buque.</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                            {description.toLowerCase().includes('transshipment') && <Badge variant="outline" className="mt-2">Transbordo</Badge>}
                            {description.toLowerCase().includes('en tránsito') && <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">En Tránsito</Badge>}
                            {isMapVisible && vesselImo && (
                              <div className="mt-4">
                                <VesselFinderEmbed imo={vesselImo} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="shadow-md border-0 bg-white overflow-hidden sticky top-8">
                <CardHeader className="bg-gray-800 text-white p-5">
                  <CardTitle className="text-lg font-semibold">Resumen del Viaje</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Estado:</span>
                    <Badge>{tracking?.current_status || 'Vacío'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Origen:</span>
                    <span className="font-medium text-gray-800">{tracking?.shipped_from || 'Mundra, IN'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Destino:</span>
                    <span className="font-medium text-gray-800">{tracking?.shipped_to || 'Cartagena, CO'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">ETA (Arribo estimado):</span>
                    <span className="font-medium text-gray-800">{tracking?.pod_eta_date || '2025-09-24'}</span>
                  </div>
                  <div className="border-t my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Primer evento:</span>
                    <span className="font-medium text-gray-800">{summary?.first_event_date || '2025-07-16'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Último evento:</span>
                    <span className="font-medium text-gray-800">{summary?.last_event_date || '2025-09-08'}</span>
                  </div>
                  <div className="border-t my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total eventos:</span>
                    <span className="font-medium text-gray-800">{summary?.total_events || events.length || 5}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Puertos:</span>
                    <span className="font-medium text-gray-800">{summary?.total_ports || 2}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transbordos:</span>
                    <span className="font-medium text-gray-800">{summary?.transhipment_count || 2}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Buques:</span>
                    <span className="font-medium text-gray-800">{summary?.total_vessels || 2}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ContainerDetail;