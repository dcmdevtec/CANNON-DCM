import type { VesselInfo } from '@/data/containerEvents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from './ui/button';
import { Info, Map, Camera, Star, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const DetailItem = ({ label, value }: { label: string, value: string }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-semibold text-gray-800">{value}</div>
  </div>
);

const VesselParticulars = ({ vesselInfo }: { vesselInfo: VesselInfo }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-4">
    <DetailItem label="Gross Tonnage" value={vesselInfo.grossTonnage} />
    <DetailItem label="Built" value={vesselInfo.built} />
    <DetailItem label="Deadweight" value={vesselInfo.deadweight} />
    <DetailItem label="Size" value={vesselInfo.size} />
    <DetailItem label="IMO" value={vesselInfo.vessel_imo} />
    <DetailItem label="MMSI" value={vesselInfo.mmsi} />
  </div>
);

const VesselDetailPanel = ({ vesselInfo, onClose }: VesselDetailPanelProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Detalles del Buque</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="font-sans text-sm bg-white rounded-md overflow-hidden">
          <div className="p-3 bg-gray-50 border-b">
            <h3 className="font-bold text-base text-gray-800">🇺🇸 {vesselInfo.vessel_name}</h3>
            <p className="text-xs text-gray-500">{vesselInfo.vessel_type}</p>
          </div>
          <img src={vesselInfo.imageUrl} alt={vesselInfo.vessel_name} className="w-full h-auto" />
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto rounded-none">
              <TabsTrigger value="details" className="flex flex-col h-auto py-1.5"><Info className="h-4 w-4 mb-1"/>Details</TabsTrigger>
              <TabsTrigger value="track" className="flex flex-col h-auto py-1.5"><Map className="h-4 w-4 mb-1"/>Track</TabsTrigger>
              <TabsTrigger value="photo" className="flex flex-col h-auto py-1.5"><Camera className="h-4 w-4 mb-1"/>Add photo</TabsTrigger>
              <TabsTrigger value="fleet" className="flex flex-col h-auto py-1.5"><Star className="h-4 w-4 mb-1"/>Add to fleet</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="p-3">
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Destination</div>
                <div className="font-semibold text-gray-800 flex items-center">
                  <span className="mr-2 text-lg">🇺🇸</span>
                  <div>
                    <div>{vesselInfo.destination}</div>
                    <div className="font-bold text-blue-600">ETA: {vesselInfo.eta}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <DetailItem label="Speed" value={vesselInfo.speed} />
                <DetailItem label="Course" value={vesselInfo.course} />
                <DetailItem label="Draught" value={vesselInfo.draught} />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <DetailItem label="Status" value={vesselInfo.status} />
                <DetailItem label="Last report" value={vesselInfo.lastReport} />
              </div>

              <div className="border-t my-2"></div>

              <div className="text-xs text-gray-500 mb-1">Last Port</div>
              <div className="font-semibold text-gray-800 flex items-center">
                <span className="mr-2 text-lg">🇸🇪</span>
                <div>
                  <div>{vesselInfo.lastPort}</div>
                  <div className="font-normal">ATD: {vesselInfo.atd}</div>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full mt-2">
                <AccordionItem value="port-calls">
                  <AccordionTrigger>Port Calls</AccordionTrigger>
                  <AccordionContent>
                    No port call data available.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="weather">
                  <AccordionTrigger>Weather</AccordionTrigger>
                  <AccordionContent>
                    Weather data is not available.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="vessel-particulars">
                  <AccordionTrigger>Vessel Particulars</AccordionTrigger>
                  <AccordionContent>
                    <VesselParticulars vesselInfo={vesselInfo} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

interface VesselDetailPanelProps {
  vesselInfo: VesselInfo;
  onClose: () => void;
}

export default VesselDetailPanel;