import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ApprovalItem } from '@/pages/ApprovalQueue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Flag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ApprovalEditorProps {
  approvalItem: ApprovalItem;
  onApprovalUpdate: (updatedApproval: ApprovalItem) => void;
}

const keyTranslations: { [key: string]: string } = {
  subject: 'Asunto',
  summary: 'Resumen',
  bill_of_lading: 'Conocimiento de Embarque (BL)',
  container_number: 'Número de Contenedor',
};

const ApprovalEditor = ({ approvalItem, onApprovalUpdate }: ApprovalEditorProps) => {
  const [editedData, setEditedData] = useState(approvalItem.extracted_data);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');

  const handleInputChange = (key: string, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  const handleAction = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    const toastId = showLoading(status === 'approved' ? 'Procesando aprobación...' : 'Procesando rechazo...');

    try {
      const { data, error } = await supabase
        .from('email_approvals')
        .update({
          status,
          extracted_data: status === 'approved' ? editedData : approvalItem.extracted_data,
          reviewed_at: new Date().toISOString(),
          reviewer_comments: status === 'rejected' ? rejectionComment : null,
        })
        .eq('id', approvalItem.id)
        .select()
        .single();

      if (error) throw error;

      dismissToast(toastId);
      showSuccess(`Correo ${status === 'approved' ? 'aprobado' : 'rechazado'} correctamente.`);

      // Si se aprobó, iniciar el motor de tracking
      if (status === 'approved') {
        const trackingToastId = showLoading('Iniciando consulta de tracking...');
        try {
          const { error: functionError } = await supabase.functions.invoke('track-container', {
            body: {
              container_number: editedData.container_number,
              bill_of_lading: editedData.bill_of_lading,
            },
          });

          if (functionError) throw functionError;
          
          dismissToast(trackingToastId);
          showSuccess('Consulta de tracking completada y datos guardados.');

        } catch (e) {
          dismissToast(trackingToastId);
          showError('Error en el motor de tracking.');
          console.error('Error al invocar la función de tracking:', e);
        }
      }
      
      onApprovalUpdate(data as ApprovalItem);

    } catch (error) {
      dismissToast(toastId);
      showError(`Error al ${status === 'approved' ? 'aprobar' : 'rechazar'} el correo.`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>{approvalItem.subject}</CardTitle>
          <CardDescription>De: {approvalItem.sender}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
          <div className="flex flex-col">
            <Label className="mb-2">Correo Original</Label>
            <ScrollArea className="border rounded-md p-4 h-full bg-gray-50">
              <pre className="text-sm whitespace-pre-wrap font-sans">{approvalItem.body_text}</pre>
            </ScrollArea>
          </div>
          <div className="flex flex-col">
            <Label className="mb-2">Datos Extraídos (Editables)</Label>
            <ScrollArea className="border rounded-md p-4 h-full">
              <div className="space-y-4">
                {Object.entries(editedData).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center mb-1">
                      <Label htmlFor={key}>{keyTranslations[key] || key.replace(/_/g, ' ')}</Label>
                      {(!value || value === '') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Flag className="h-4 w-4 ml-2 text-orange-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Este campo requiere verificación</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <Input
                      id={key}
                      value={value || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-end">
          <div className="flex-1 pr-4">
            <Label htmlFor="rejection-comment">Comentario de Rechazo (opcional)</Label>
            <Textarea 
              id="rejection-comment"
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              placeholder="Añadir motivo del rechazo..."
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleAction('rejected')} 
              disabled={isSubmitting}
            >
              Rechazar
            </Button>
            <Button 
              onClick={() => handleAction('approved')} 
              disabled={isSubmitting}
            >
              Aprobar y Procesar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
};

export default ApprovalEditor;