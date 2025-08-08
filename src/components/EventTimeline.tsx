import { Ship, Anchor, MapPin, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ContainerEvent } from '@/data/containerEvents';

const getEventIcon = (eventType: string) => {
  const lowerCaseType = eventType.toLowerCase();
  if (lowerCaseType.includes('loaded')) return <Ship className="h-5 w-5 text-white" />;
  if (lowerCaseType.includes('discharged')) return <Anchor className="h-5 w-5 text-white" />;
  if (lowerCaseType.includes('shipper') || lowerCaseType.includes('received')) return <ArrowRight className="h-5 w-5 text-white" />;
  return <CheckCircle className="h-5 w-5 text-white" />;
};

const EventTimeline = ({ events }: { events: ContainerEvent[] }) => {
  const sortedEvents = [...events].sort((a, b) => new Date(b.event_datetime).getTime() - new Date(a.event_datetime).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Eventos Detallado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-9 top-0 h-full w-0.5 bg-gray-200" />

          {sortedEvents.map((event) => (
            <div key={event.id} className="relative mb-8 flex items-start">
              <div className="absolute left-0 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                {getEventIcon(event.event_type)}
              </div>
              <div className="ml-12 w-full">
                <p className="font-semibold text-base">{event.event_description}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1.5 h-4 w-4" />
                    {format(new Date(event.event_datetime), "d 'de' MMMM, yyyy", { locale: es })}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-1.5 h-4 w-4" />
                    {event.location}
                  </div>
                  {event.vessel_name && (
                    <div className="flex items-center">
                      <Ship className="mr-1.5 h-4 w-4" />
                      {event.vessel_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventTimeline;