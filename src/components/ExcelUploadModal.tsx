import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";

// Helper to format dates correctly for Supabase (YYYY-MM-DD)
const formatDate = (dateObj: { y: number; m: number; d: number } | null) => {
  if (!dateObj) return null;
  const { y, m, d } = dateObj;
  // Pad month and day with a leading zero if they are single-digit
  const month = String(m).padStart(2, '0');
  const day = String(d).padStart(2, '0');
  return `${y}-${month}-${day}`;
};


const ExcelUploadModal = ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("Archivo seleccionado:", file);
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      console.log("Filas extraídas del Excel:", rows);
      
      let insertedCount = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const numContenedor = row["# Contenedor"] || row["CONTENEDOR"] || row["NUM_CONTENEDOR"];
        
        if (!numContenedor) {
          console.warn(`Fila ${i + 1} omitida: El número de contenedor es obligatorio.`);
          continue; // Skip row if container number is missing
        }

        // 1. Map Excel columns to the database record
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
        console.log(`Procesando registro ${i + 1}:`, record);

        // 2. Insert into cnn_factura_tracking
        const { error: facturaError } = await supabase.from("cnn_factura_tracking").insert([record]);
        if (facturaError) {
          console.error("Error al insertar en cnn_factura_tracking:", facturaError);
          throw new Error(`Error en la fila ${i + 1}: ${facturaError.message}`);
        }

        // 3. Check if container exists in cnn_container_tracking
        const { data: existingContainer, error: selectError } = await supabase
          .from('cnn_container_tracking')
          .select('id')
          .eq('container_number', record.num_contenedor)
          .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
          console.error('Error al verificar contenedor existente:', selectError);
          throw new Error(`Error verificando contenedor en la fila ${i + 1}: ${selectError.message}`);
        }
        
        // 4. If container does not exist, insert it into cnn_container_tracking
        if (!existingContainer) {
          const { error: containerError } = await supabase
            .from('cnn_container_tracking')
            .insert([{ container_number: record.num_contenedor }]);
          if (containerError) {
            console.error('Error al insertar en cnn_container_tracking:', containerError);
            throw new Error(`Error insertando nuevo contenedor en la fila ${i + 1}: ${containerError.message}`);
          }
           console.log(`Nuevo contenedor ${record.num_contenedor} insertado en cnn_container_tracking.`);
        }
        
        insertedCount++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      setSuccess(true);
      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error("Error en handleFileChange:", err);
      setError(err.message || "Error procesando el archivo");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-4">Subir Excel de Tracking</h2>
        <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={loading} />
        {loading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="text-xs mt-2">Procesando: {progress}%</div>
          </div>
        )}
        {error && <div className="text-red-600 mt-4">{error}</div>}
        {success && <div className="text-green-600 mt-4">¡Archivo procesado y datos guardados!</div>}
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadModal;
