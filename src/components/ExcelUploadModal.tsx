import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";

const ExcelUploadModal = ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      let inserted = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // Mapear columnas del Excel a la tabla
        const record = {
          titulo: row["Título"] || row["TITULO"],
          proveedor: row["Proveedor"] || row["PROVEEDOR"],
          contrato: row["Contrato"] || row["CONTRATO"],
          despacho: row["Despacho"] || row["DESPACHO"],
          num_contenedor: row["# Contenedor"] || row["CONTENEDOR"] || row["NUM_CONTENEDOR"],
          llegada_bquilla: row["Llegada a B/quilla"] ? XLSX.SSF.parse_date_code(row["Llegada a B/quilla"]) : null,
          contenedor: row["contenedor"] || row["CONTENEDOR_SEQ"],
          estado: row["Estado"] || row["ESTADO"],
          naviera: row["NAVIERA"],
          factura: row["FACTURA"],
          etd: row["ETD"] ? XLSX.SSF.parse_date_code(row["ETD"]) : null,
          eta: row["ETA"] ? XLSX.SSF.parse_date_code(row["ETA"]) : null,
          dias_transito: row["Dias de transito"] || row["DIAS_TRANSITO"],
        };
        // Convertir fechas a formato YYYY-MM-DD
        if (record.llegada_bquilla) record.llegada_bquilla = `${record.llegada_bquilla.y}-${record.llegada_bquilla.m}-${record.llegada_bquilla.d}`;
        if (record.etd) record.etd = `${record.etd.y}-${record.etd.m}-${record.etd.d}`;
        if (record.eta) record.eta = `${record.eta.y}-${record.eta.m}-${record.eta.d}`;
        const { error } = await supabase.from("cnn_factura_tracking").insert([record]);
        if (error) throw error;
        inserted++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
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
