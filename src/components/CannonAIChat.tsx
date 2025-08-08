import { useTypingEffect } from "@/hooks/useTypingEffect";
import { Bot } from "lucide-react";

const CannonAIChat = () => {
  const fullText = "He detectado una alerta de congestión portuaria que afecta a este contenedor. Aquí mis recomendaciones:\n\n1. **Comunicación Proactiva:** Notificar inmediatamente al cliente final sobre el posible retraso, ofreciendo transparencia y gestionando sus expectativas.\n\n2. **Rutas Alternativas:** Estoy analizando rutas y transportistas alternativos para futuros envíos para mitigar riesgos similares. Te presentaré las opciones más viables en breve.\n\n3. **Análisis de Costos:** Evaluar el impacto financiero del retraso. Podemos renegociar tarifas con el transportista si la causa es de su responsabilidad.\n\nEstoy monitoreando activamente la situación y te informaré de cualquier novedad.";
  const typedText = useTypingEffect(fullText);

  return (
    <div className="flex items-start space-x-4 p-4">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center">
        <Bot className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-lg">Cannon AI</p>
        <div className="mt-2 p-3 bg-muted rounded-lg">
          <p className="text-sm text-foreground whitespace-pre-wrap">{typedText}</p>
        </div>
      </div>
    </div>
  );
};

export default CannonAIChat;