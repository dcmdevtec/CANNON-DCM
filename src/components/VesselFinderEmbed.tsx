import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ship, ExternalLink } from "lucide-react";

interface VesselFinderEmbedProps {
  imo: string;
}

const VesselFinderEmbed = ({ imo }: VesselFinderEmbedProps) => {
  if (!imo) {
    return null;
  }

  const detailUrl = `https://www.vesselfinder.com/vessels/details/${imo}`;

  return (
    <Card className="shadow-md border-0 bg-white overflow-hidden">
      <CardHeader className="bg-gray-800 text-white p-5">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Ship className="h-5 w-5 mr-2" />
          Localización del Buque (VesselFinder)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Se ha encontrado información detallada para este buque en VesselFinder.
        </p>
        <Button asChild>
          <a href={detailUrl} target="_blank" rel="noopener noreferrer">
            Ver Detalles en VesselFinder
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default VesselFinderEmbed;