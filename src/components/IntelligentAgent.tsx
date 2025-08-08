import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CannonAIChat from "./CannonAIChat";

const IntelligentAgent = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Análisis del Agente Inteligente
            </CardTitle>
            <Lightbulb className="h-5 w-5 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Haz clic para ver las recomendaciones de Cannon AI.</p>
              <ul className="list-disc pl-5 space-y-1 mt-2 text-xs">
                <li>Riesgo de retraso detectado.</li>
                <li>Acción recomendada disponible.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Análisis y Recomendaciones</DialogTitle>
        </DialogHeader>
        <CannonAIChat />
      </DialogContent>
    </Dialog>
  );
};

export default IntelligentAgent;