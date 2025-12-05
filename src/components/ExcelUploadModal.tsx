import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Download, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Helper to format dates correctly for Supabase (YYYY-MM-DD)
const formatDate = (dateObj: { y: number; m: number; d: number } | null) => {
  if (!dateObj) return null;
  const { y, m, d } = dateObj;
  // Pad month and day with a leading zero if they are single-digit
  const month = String(m).padStart(2, "0");
  const day = String(d).padStart(2, "0");
  return `${y}-${month}-${day}`;
};

const ExcelUploadModal = ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError(null);
      setSuccess(false);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Por favor seleccione un archivo.");
      return;
    }

    // Validate file type (only Excel)
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Tipo de archivo no soportado. Por favor, suba un archivo Excel (.xlsx o .xls).");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      let insertedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const numContenedor = row["# Contenedor"] || row["CONTENEDOR"] || row["NUM_CONTENEDOR"];

        if (!numContenedor) {
          console.warn(`Fila ${i + 1} omitida: El número de contenedor es obligatorio.`);
          continue;
        }

        const record = {
          titulo: row["Título"] || row["TITULO"],
          proveedor: row["Proveedor"] || row["PROVEEDOR"],
          contrato: row["Contrato"] || row["CONTRATO"],
          despacho: row["Despacho"] || row["DESPACHO"],
          num_contenedor: numContenedor,
          llegada_bquilla: formatDate(row["Llegada a B/quilla"] ? XLSX.SSF.parse_date_code(row["Llegada a B/quilla"]) : null),
          contenedor: row["contenedor"] || row["CONTENEDOR_SEQ"],
          estado: row["Estado"] || row["ESTADO"],
          naviera: row["NAVIERA"],
          factura: row["FACTURA"],
          etd: formatDate(row["ETD"] ? XLSX.SSF.parse_date_code(row["ETD"]) : null),
          eta: formatDate(row["ETA"] ? XLSX.SSF.parse_date_code(row["ETA"]) : null),
          dias_transito: row["Dias de transito"] || row["DIAS_TRANSITO"],
        };

        // Insert into cnn_factura_tracking
        const { error: facturaError } = await supabase.from("cnn_factura_tracking").insert([record]);
        if (facturaError) {
          console.error("Error al insertar en cnn_factura_tracking:", facturaError);
          // Don't throw immediately, try to continue or log error
        }

        // Verify container existence
        const { data: existingContainer, error: selectError } = await supabase
          .from('cnn_container_tracking')
          .select('id')
          .eq('container_number', record.num_contenedor)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          console.error('Error al verificar contenedor existente:', selectError);
        }

        // Insert container if not exists
        if (!existingContainer) {
          const { error: containerError } = await supabase
            .from('cnn_container_tracking')
            .insert([{ container_number: record.num_contenedor }]);

          if (containerError) {
            console.error('Error al insertar en cnn_container_tracking:', containerError);
          }
        }

        insertedCount++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      setSuccess(true);
      toast.success("Archivo procesado correctamente");
      if (onSuccess) onSuccess();

      // Reset after a delay
      setTimeout(() => {
        onClose();
        setFileName(null);
        setSuccess(false);
        setProgress(0);
      }, 2000);

    } catch (err: any) {
      console.error("Error en handleFileChange:", err);
      setError(err.message || "Error procesando el archivo");
      toast.error("Error procesando el archivo");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/template.xlsx';
    link.download = 'template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Excel de Tracking</DialogTitle>
          <DialogDescription>
            Seleccione un archivo Excel (.xlsx) para actualizar el seguimiento de contenedores.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${fileName ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={loading}
            />

            {fileName ? (
              <div className="flex flex-col items-center text-blue-600">
                <FileSpreadsheet className="h-10 w-10 mb-2" />
                <span className="font-medium text-sm break-all">{fileName}</span>
                <span className="text-xs text-gray-500 mt-1">Clic para cambiar</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <Upload className="h-10 w-10 mb-2" />
                <span className="font-medium text-sm">Haga clic para seleccionar archivo</span>
                <span className="text-xs mt-1">Soporta .xlsx, .xls</span>
              </div>
            )}
          </div>

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-gray-500">Procesando... {progress}%</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
              <CheckCircle className="h-4 w-4" />
              <span>¡Carga completada exitosamente!</span>
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-xs flex items-center gap-1">
              <Download className="h-3 w-3" />
              Plantilla
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={!fileName || loading}>
                {loading ? 'Subiendo...' : 'Subir Archivo'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUploadModal;
