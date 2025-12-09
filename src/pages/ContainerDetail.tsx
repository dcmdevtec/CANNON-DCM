import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
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

  // El IMO y otros datos de buque/ubicación ahora vienen directamente en el evento
  const getImoForVessel = (event: any): string | null => {

    return event.vessel_imo || null;
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando detalles del contenedor...</div>;
  }

  if (!trackingData || !trackingData.tracking) {
    return <div className="p-8 text-center">No se encontraron datos para este contenedor.</div>;
  }

  const { tracking, events, summary } = trackingData;

  // Debug: ver qué llega en events
  console.log('tra desde API:', trackingData);
  const sortedEvents = Array.isArray(events)
    ? [...events]
      .sort((a, b) => {
        if (a.event_date && b.event_date) {
          return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
        }
        if (a.event_date) return -1; // a tiene fecha, va antes
        if (b.event_date) return 1;  // b tiene fecha, va antes
        return 0;
      })
    : [];

  // Usar solo los eventos originales, sin agregar manualmente el ETA destino
  const eventsWithETA = [...sortedEvents];

  // Buscar el primer evento real (no ETA) en la línea de tiempo (que ya pasó)
  const lastPastEvent = eventsWithETA.find(e => {
    if (e.is_estimated) return false;
    if (!e.event_date) return true; // Si no hay fecha, asumimos que es pasado (o data legacy)
    return new Date(e.event_date) <= new Date();
  });

  const getEventIcon = (event: any, isFirst: boolean, isLast: boolean, entregado?: boolean, esEventoEntrega?: boolean) => {
    const description = (event.event_description || event.event_type || '').toLowerCase();
    const isFuture = event.is_estimated && new Date(event.event_date) > new Date();

    // Evento de llegada al destino y entregado: círculo verde animado, inner blanco
    if (entregado && esEventoEntrega) {
      return (
        <div
          className="w-10 h-10 rounded-full border-2 animate-pulse-green"
          style={{ backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      );
    }

    // Animación personalizada para el círculo verde de entrega
    if (typeof window !== 'undefined' && !document.getElementById('pulseGreenStyle')) {
      const style = document.createElement('style');
      style.id = 'pulseGreenStyle';
      style.innerHTML = `
    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
      70% { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    .animate-pulse-green {
      animation: pulse-green 1.4s cubic-bezier(0.4,0,0.6,1) infinite;
    }
  `;
      document.head.appendChild(style);
    }

    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const today = new Date();
    const isPastEvent = eventDate ? eventDate <= today : true;

    if (isFuture) return <Clock className="h-6 w-6 text-white" />;
    if (event.is_estimated) return <CheckCircle className="h-6 w-6 text-white" />;
    if (isFirst) return <div className="w-3 h-3 bg-white rounded-full animate-pulse" />;

    // Si es un evento pasado, usar iconos naranjas
    if (isPastEvent) {
      if (description.includes('loaded') || description.includes('discharged') || description.includes('transshipment')) {
        return <Ship className="h-5 w-5 text-orange-500" />;
      }
      if (description.includes('received')) {
        return <Package className="h-5 w-5 text-orange-500" />;
      }
      if (description.includes('empty')) {
        return <Circle className="h-5 w-5 text-orange-500" />;
      }
      if (isLast) {
        return <ArrowRight className="h-5 w-5 text-orange-500" />;
      }
      return <Anchor className="h-5 w-5 text-orange-500" />;
    }

    // Eventos no pasados mantienen sus colores originales
    if (description.includes('loaded') || description.includes('discharged') || description.includes('transshipment')) return <Ship className="h-5 w-5 text-orange-600" />;
    if (description.includes('received')) return <Package className="h-5 w-5 text-blue-600" />;
    if (description.includes('empty')) return <Circle className="h-5 w-5 text-gray-500" />;
    if (isLast) return <ArrowRight className="h-5 w-5 text-gray-500" />;
    return <Anchor className="h-5 w-5 text-gray-600" />;
  };

  const getIconBgClass = (event: any, isFirst: boolean) => {
    const description = (event.event_description || event.event_type || '').toLowerCase();
    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const today = new Date();
    const isPastEvent = eventDate ? eventDate <= today : true; // Si no hay fecha, asumimos que ya pasó
    const location = (event.location || '').toLowerCase();

    // Eventos futuros
    if (!isPastEvent && event.is_estimated) return 'border-blue-500 bg-blue-500 animate-pulse';

    // Eventos pasados
    if (isPastEvent) {
      // Eventos de transbordo y carga/descarga
      if (description.includes('loaded') || description.includes('discharged') || description.includes('transshipment')) {
        return 'border-orange-500 bg-orange-100';
      }
      // Eventos con ubicación n/a
      if (location === 'n/a' || !event.location) {
        return 'border-orange-500 bg-orange-100';
      }
      // Otros eventos pasados
      return 'border-orange-500 bg-orange-100';
    }

    // Eventos especiales
    if (event.is_estimated) return 'border-green-500 bg-green-500';
    if (isFirst) return 'border-blue-500 bg-blue-500';
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
                {(() => {
                  const lugar = lastPastEvent?.location || '-';
                  const descripcion = lastPastEvent?.event_description || lastPastEvent?.event_type || tracking.latest_move || 'Empty to Shipper';
                  return (
                    <>
                      <div className="font-bold text-lg text-gray-900 flex items-center gap-1 justify-end">
                        <MapPin className="inline-block h-5 w-5 text-blue-600 mr-1" />
                        {lugar}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-1">
                        {descripcion}
                      </div>
                    </>
                  );
                })()}
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
                      console.log('Evento:', event);
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

                      // Si es el evento ETA destino, mostrar la fecha formateada igual que los otros eventos
                      let dateStr = '-';
                      if (event.id === 'eta-destination' && tracking?.pod_eta_date) {
                        try {
                          dateStr = format(parseISO(tracking.pod_eta_date), "dd MMM yyyy", { locale: es });
                        } catch {
                          dateStr = tracking.pod_eta_date;
                        }
                      } else if (event.event_date) {
                        try {
                          dateStr = format(parseISO(event.event_date), "dd MMM yyyy", { locale: es });
                        } catch {
                          dateStr = event.event_date;
                        }
                      }
                      const description = event.event_description || event.event_type || 'Evento sin descripción';
                      const hasVessel = !!event.vessel_name;
                      const vesselImo = event.vessel_imo || null;
                      const vesselLat = event.vessel_latitude;
                      const vesselLon = event.vessel_longitude;
                      const vesselLoc = event.vessel_location;
                      const vesselFlag = event.vessel_flag;
                      const vesselVoyage = event.voyage_number;
                      // Solo permitir ubicación si el evento ya ocurrió (fecha <= hoy) y tiene IMO
                      let isFutureEvent = false;
                      if (event.event_date) {
                        const eventDate = new Date(event.event_date);
                        const today = new Date();
                        eventDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        isFutureEvent = eventDate > today;
                      }
                      // Determinar si el evento es de llegada al destino
                      const destino = (tracking?.shipped_to || '').toLowerCase().replace(/\s/g, '');
                      const loc = (event.location || '').toLowerCase().replace(/\s/g, '');
                      const esEventoEntrega = loc.includes(destino);
                      // Determinar si el contenedor fue entregado (en cualquier evento)
                      let entregado = false;
                      if (Array.isArray(events)) {
                        const eventosDestino = events.filter(ev => {
                          const l = (ev.location || '').toLowerCase().replace(/\s/g, '');
                          if (!l.includes(destino)) return false;
                          if (!ev.event_date) return false;
                          const eventDate = new Date(ev.event_date);
                          const today = new Date();
                          eventDate.setHours(0, 0, 0, 0);
                          today.setHours(0, 0, 0, 0);
                          return eventDate <= today;
                        });
                        if (eventosDestino.length > 0) {
                          entregado = true;
                        }
                      }
                      // Determinar si el evento ya pasó
                      const eventDate = event.event_date ? new Date(event.event_date) : null;
                      const today = new Date();
                      const isPastEvent = eventDate ? eventDate <= today : true; // Si no hay fecha, asumimos que ya pasó

                      // Si es evento pasado, o es llegada al destino y fue entregado, mostrarlo colorido
                      const canShowLocation = isPastEvent || (entregado && esEventoEntrega);

                      // Estilos negativos solo para eventos futuros
                      const negativeStyle = (!canShowLocation) ? 'opacity-60 grayscale' : '';
                      const negativeText = (!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-gray-400' : '';
                      const negativeIcon = (!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-gray-300' : '';
                      return (
                        <div key={eventKey} className={`relative grid grid-cols-[4rem_1fr] pb-8 ${negativeStyle}`}>
                          {!isLast && <div className={`absolute left-8 top-10 h-full w-0.5 ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'bg-gray-100' : 'bg-gray-200'}`} />}
                          <div className="flex justify-center pt-1">
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-md z-10 ${getIconBgClass(event, isFirst)} ${negativeStyle}`}>
                              <span className={negativeIcon}>{getEventIcon(event, isFirst, isLast, entregado, esEventoEntrega)}</span>
                            </div>
                          </div>
                          <div className="pl-4">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_10rem] gap-x-4 gap-y-2">
                              <div>
                                <p className={`font-semibold ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-gray-400' : 'text-gray-800'}`}>{description}</p>
                                <div className={`flex items-center gap-2 text-sm ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
                                  {countryCode && <ReactCountryFlag countryCode={countryCode} svg style={{ width: '18px', height: '12px', filter: (!canShowLocation && !(entregado && esEventoEntrega)) ? 'grayscale(1) opacity(0.6)' : undefined }} />}
                                  <span>{locationDisplay}</span>
                                  <span className="text-gray-300">|</span>
                                  <span>{dateStr}</span>
                                </div>
                              </div>
                              <div className="text-left md:text-right">
                                <p className={`font-medium text-sm ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-gray-400' : 'text-blue-700'}`}>{event.vessel_name || '-'}</p>
                                {vesselVoyage && <p className={`text-xs ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-gray-300' : 'text-gray-500'}`}>Viaje: {vesselVoyage}</p>}
                                {vesselImo && <p className={`text-xs ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-gray-300' : 'text-gray-500'}`}>IMO: {vesselImo}</p>}
                                {vesselFlag && <p className={`text-xs ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-gray-300' : 'text-gray-500'}`}>Bandera: {vesselFlag}</p>}
                                {hasVessel && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span tabIndex={0}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`mt-1 text-xs h-auto py-1 px-2 ${canShowLocation || (entregado && esEventoEntrega) ? 'text-primary hover:bg-primary/10' : 'text-gray-400 opacity-60 cursor-not-allowed'}`}
                                          onClick={() => (canShowLocation || (entregado && esEventoEntrega)) && setActiveMapEventId(isMapVisible ? null : eventKey)}
                                          disabled={!(canShowLocation || (entregado && esEventoEntrega))}
                                        >
                                          <MapPin className={`h-3 w-3 mr-1.5 ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-gray-300' : ''}`} />
                                          {(canShowLocation || (entregado && esEventoEntrega)) ? (isMapVisible ? 'Ocultar Mapa' : 'Ver Ubicación') : 'Ubicación no disponible'}
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {!(canShowLocation || (entregado && esEventoEntrega)) && (
                                      <TooltipContent>
                                        <p>
                                          {isFutureEvent
                                            ? 'El buque aún no ha llegado a este punto.'
                                            : 'IMO no disponible para este buque.'}
                                        </p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                            {description.toLowerCase().includes('transshipment') && <Badge variant="outline" className={`mt-2 ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'opacity-60 grayscale' : ''}`}>Transbordo</Badge>}
                            {description.toLowerCase().includes('en tránsito') && <Badge variant="outline" className={`mt-2 bg-blue-50 border-blue-200 ${(!canShowLocation && !(entregado && esEventoEntrega)) ? 'text-blue-200 opacity-60 grayscale' : 'text-blue-700'}`}>En Tránsito</Badge>}
                            {isMapVisible && vesselImo && (
                              <div className="mt-4">
                                <VesselFinderEmbed imo={vesselImo} />
                                {(vesselLat || vesselLon || vesselLoc) && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    {vesselLat && <>Lat: {vesselLat} </>}
                                    {vesselLon && <>Lon: {vesselLon} </>}
                                    {vesselLoc && <>Posición: {vesselLoc}</>}
                                  </div>
                                )}
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
                    {(() => {
                      // Solo marcar como entregado si hay evento de llegada al destino y la fecha del evento es hoy o anterior
                      const destino = (tracking?.shipped_to || '').toLowerCase().replace(/\s/g, '');
                      let entregado = false;
                      if (Array.isArray(events)) {
                        const eventosDestino = events.filter(ev => {
                          const loc = (ev.location || '').toLowerCase().replace(/\s/g, '');
                          if (!loc.includes(destino)) return false;
                          // Validar que la fecha del evento no sea futura
                          if (!ev.event_date) return false;
                          const eventDate = new Date(ev.event_date);
                          const today = new Date();
                          eventDate.setHours(0, 0, 0, 0);
                          today.setHours(0, 0, 0, 0);
                          return eventDate <= today;
                        });
                        if (eventosDestino.length > 0) {
                          entregado = true;
                        }
                      }
                      if (entregado) {
                        return <Badge style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}>Entregado</Badge>;
                      }
                      return <Badge>{tracking?.current_status || 'Vacío'}</Badge>;
                    })()}
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
                    <span className="font-medium text-gray-800">{lastPastEvent?.event_date || summary?.last_event_date || '2025-09-08'}</span>
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