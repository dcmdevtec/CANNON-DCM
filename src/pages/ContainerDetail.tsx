import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchContainerTrackingDetail } from '../api/fetchContainerTrackingDetail';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactCountryFlag from 'react-country-flag';
import { getName } from 'country-list';

const ContainerDetail: React.FC = () => {
  const { containerNumber } = useParams<{ containerNumber: string }>();
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="p-8 text-center">Cargando detalles del contenedor...</div>;
  }

  if (!trackingData || !trackingData.tracking) {
    return <div className="p-8 text-center">No se encontraron datos para este contenedor.</div>;
  }

  const { tracking, events } = trackingData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 space-y-6 relative grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* Timeline principal */}
        <div className="lg:col-span-5">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground font-medium">Container</span>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {tracking.container_number}
                  <Badge variant="secondary" className="ml-2">{tracking.container_type || '-'}</Badge>
                </CardTitle>
              </div>
              <div className="flex flex-col gap-2 text-right">
                <span className="text-xs text-muted-foreground font-medium">Latest move</span>
                <span className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                  {tracking.latest_move || '-'}
                </span>
                <span className="text-xs text-muted-foreground font-medium mt-2">POD ETA</span>
                <span className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                  {tracking.pod_eta_date || '-'}
                </span>
              </div>
            </CardHeader>
            {/* Eventos */}
            <CardContent>
              <div className="relative">
                {Array.isArray(events) && events.length > 0 ? (
                    (() => {
                      const sortedEvents = [...events]
                        .filter(e => e.event_date)
                        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
                      
                      // Agregar evento de destino final si tenemos ETA
                      const eventsWithETA = [...sortedEvents];
                      if (tracking?.pod_eta_date && tracking?.shipped_to) {
                        eventsWithETA.unshift({
                          id: 'eta-destination',
                          event_date: tracking.pod_eta_date,
                          location: tracking.shipped_to,
                          description: 'Estimated Time of Arrival',
                          isETA: true
                        });
                      }
                      
                      return eventsWithETA.map((event: any, idx: number, arr: any[]) => {
                        const isFirst = idx === 0;
                        const isLast = idx === arr.length - 1;
                        const isETA = event.isETA;
                        
                        // Extraer país de location
                        let countryCode = '';
                        let locationDisplay = '';
                        if (event.location) {
                          const parts = event.location.split(',');
                          const last = parts[parts.length - 1]?.trim();
                          if (last && last.length === 2) {
                            countryCode = last.toUpperCase();
                            locationDisplay = event.location.replace(/,[^,]*$/, '').trim();
                          } else {
                            locationDisplay = event.location;
                          }
                        }
                        
                        // Formato de fecha
                        const dateStr = event.event_date ? new Date(event.event_date).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        }) : '-';
                        
                        // Obtener datos del vessel desde vessel_data JSON
                        let vesselInfo = null;
                        if (event.vessel_data) {
                          try {
                            vesselInfo = JSON.parse(event.vessel_data);
                          } catch (e) {
                            vesselInfo = null;
                          }
                        }
                        
                        // Estado del evento para colores - USAR event_description
                        const description = event.event_description || event.event_type || '';
                        const isDelivered = description.toLowerCase().includes('delivered') || description.toLowerCase().includes('entregado');
                        const isInTransit = description.toLowerCase().includes('loaded') || description.toLowerCase().includes('discharged') || description.toLowerCase().includes('transshipment');
                        const isEmpty = description.toLowerCase().includes('empty');
                        const isReceived = description.toLowerCase().includes('received');
                        
                        return (
                          <div key={event.id || idx} className={`relative border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${isFirst && isETA ? 'bg-green-50/50' : isFirst ? 'bg-blue-50/50' : ''}`}>
                            {/* Línea continua del timeline - CORREGIDA */}
                            {!isLast && (
                              <div className="absolute left-[50px] top-[72px] w-0.5 h-full bg-gradient-to-b from-blue-400 to-blue-300 z-0"></div>
                            )}
                            
                            <div className="flex items-center px-6 py-5 relative z-10">
                              {/* Timeline con círculo - MEJORADO */}
                              <div className="w-20 flex justify-center">
                                <div className={`w-10 h-10 rounded-full border-3 flex items-center justify-center shadow-lg ${
                                  isETA ? 'border-green-500 bg-green-500' :
                                  isFirst ? 'border-blue-500 bg-blue-500' : 
                                  isDelivered ? 'border-green-500 bg-green-100' :
                                  isInTransit ? 'border-orange-500 bg-orange-100' :
                                  isReceived ? 'border-blue-400 bg-blue-100' :
                                  isEmpty ? 'border-gray-400 bg-gray-100' :
                                  isLast ? 'border-gray-400 bg-gray-200' :
                                  'border-blue-300 bg-white'
                                }`}>
                                  {isETA ? (
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                    </svg>
                                  ) : isFirst ? (
                                    <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                                  ) : isInTransit ? (
                                    <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                    </svg>
                                  ) : isReceived ? (
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 8.207a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                    </svg>
                                  ) : isLast ? (
                                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd"/>
                                    </svg>
                                  ) : (
                                    <div className="w-3 h-3 bg-current rounded-full"></div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Fecha - MEJORADO */}
                              <div className="w-28 pl-2">
                                <div className="font-semibold text-gray-900 text-sm">{dateStr}</div>
                                {event.event_time && (
                                  <div className="text-xs text-gray-500 mt-1">{event.event_time}</div>
                                )}
                              </div>
                              
                              {/* Ubicación - MEJORADO */}
                              <div className="w-48 pl-3">
                                <div className="flex items-center gap-3">
                                  {countryCode && (
                                    <ReactCountryFlag 
                                      countryCode={countryCode} 
                                      svg 
                                      style={{ width: '22px', height: '16px' }} 
                                      title={countryCode} 
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm">
                                      {locationDisplay || event.location || '-'}
                                    </div>
                                    {event.port && event.port !== locationDisplay && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {event.port}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Descripción - CORREGIDO */}
                              <div className="flex-1 pl-4">
                                <div className="font-medium text-gray-900 text-sm mb-1.5">
                                  {event.description || 'Sin descripción'}
                                </div>
                                {/* Badges de estado */}
                                <div className="flex gap-2">
                                  {isETA && (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
                                      Destino Final
                                    </Badge>
                                  )}
                                  {isDelivered && !isETA && (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
                                      Entregado
                                    </Badge>
                                  )}
                                  {isInTransit && !isDelivered && !isETA && (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1">
                                      En tránsito
                                    </Badge>
                                  )}
                                  {isEmpty && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-2 py-1">
                                      Vacío
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {/* Buque/Viaje - MEJORADO */}
                              <div className="w-52 pl-4">
                                {event.vessel_name ? (
                                  <div>
                                    <div className="font-medium text-blue-700 text-sm mb-0.5">
                                      {event.vessel_name}
                                    </div>
                                    {event.vessel_voyage && (
                                      <div className="text-xs text-gray-600">
                                        Viaje: {event.vessel_voyage}
                                      </div>
                                    )}
                                    {event.vessel_imo && (
                                      <div className="text-xs text-gray-500">
                                        IMO: {event.vessel_imo}
                                      </div>
                                    )}
                                  </div>
                                ) : isETA ? (
                                  <div className="text-sm text-gray-400 italic">Estimado</div>
                                ) : (
                                  <div className="text-sm text-gray-400">-</div>
                                )}
                              </div>
                              
                              {/* Instalación - MEJORADO */}
                              <div className="w-64 pl-4">
                                {event.facility_name ? (
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm mb-0.5">
                                      {event.facility_name}
                                    </div>
                                    {event.terminal && event.terminal !== event.facility_name && (
                                      <div className="text-xs text-gray-500">
                                        {event.terminal}
                                      </div>
                                    )}
                                  </div>
                                ) : isETA ? (
                                  <div className="text-sm text-gray-400 italic">Puerto de destino</div>
                                ) : (
                                  <div className="text-sm text-gray-400">-</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className="px-8 py-12 text-center text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2"/>
                      </svg>
                      <p>No hay eventos disponibles para este contenedor</p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Columna lateral con métricas y badges de estado */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de resumen de viaje */}
          <Card className="shadow-xl border-0 bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
              <CardTitle className="text-xl font-semibold">Resumen del Viaje</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Estado dinámico */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Estado:</span>
                {tracking?.current_status === 'Empty to Shipper' ? (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Vacío</Badge>
                ) : tracking?.current_status === 'In Transit' ? (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">En tránsito</Badge>
                ) : tracking?.current_status === 'Delivered' ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">Entregado</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">{tracking?.current_status || '-'}</Badge>
                )}
              </div>
              {/* País de origen y destino */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-600">Origen:</span>
                {tracking?.origin_country && (
                  <ReactCountryFlag countryCode={tracking.origin_country} svg style={{ width: '1.5em', height: '1.2em' }} title={tracking.origin_country} />
                )}
                <span className="font-medium text-gray-900">{tracking?.shipped_from || '-'}</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-600">Destino:</span>
                {tracking?.destination_country && (
                  <ReactCountryFlag countryCode={tracking.destination_country} svg style={{ width: '1.5em', height: '1.2em' }} title={tracking.destination_country} />
                )}
                <span className="font-medium text-gray-900">{tracking?.shipped_to || '-'}</span>
              </div>
              {/* Fechas clave */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ETA (Arribo estimado)</span>
                <span className="text-sm font-medium text-gray-900">{tracking?.pod_eta_date || tracking?.eta || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Primer evento</span>
                <span className="text-sm font-medium text-gray-900">{trackingData?.summary?.first_event_date || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Último evento</span>
                <span className="text-sm font-medium text-gray-900">{trackingData?.summary?.last_event_date || '-'}</span>
              </div>
              {/* Métricas */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total eventos</span>
                <span className="text-sm font-medium text-gray-900">{trackingData?.summary?.total_events || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Puertos</span>
                <span className="text-sm font-medium text-gray-900">{trackingData?.summary?.total_ports || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transbordos</span>
                <span className="text-sm font-medium text-gray-900">{trackingData?.summary?.transhipment_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Buques</span>
                <span className="text-sm font-medium text-gray-900">{trackingData?.summary?.total_vessels || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContainerDetail;
