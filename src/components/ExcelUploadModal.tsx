import React, { useState, useRef, useMemo } from "react";
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
import { Upload, FileSpreadsheet, Download, X, CheckCircle, AlertCircle, ChevronLeft, Table } from "lucide-react";
import { toast } from "sonner";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming shadcn table components are available

// Helper to format dates correctly for Supabase (YYYY-MM-DD)
const formatDate = (dateObj: { y: number; m: number; d: number } | null) => {
  if (!dateObj) return null;
  const { y, m, d } = dateObj;
  // Pad month and day with a leading zero if they are single-digit
  const month = String(m).padStart(2, "0");
  const day = String(d).padStart(2, "0");
  return `${y}-${month}-${day}`;
};

// Define types for clarity
type ExcelRow = { [key: string]: any };
type ValidationError = {
  rowIndex: number;
  column: string;
  message: string;
  value?: any;
};
type UploadResult = {
  rowIndex: number;
  status: 'success' | 'error';
  message?: string;
  data?: ExcelRow;
};

type Step = 'upload' | 'preview' | 'validation' | 'result';

const ExcelUploadModal = ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generalError, setGeneralError] = useState<string | null>(null); // For general errors not tied to validation

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setFileName(null);
    setExcelData([]);
    setValidationErrors([]);
    setUploadResults([]);
    setLoading(false);
    setProgress(0);
    setGeneralError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setGeneralError("Por favor seleccione un archivo.");
      return;
    }

    // Validate file type (only Excel)
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setGeneralError("Tipo de archivo no soportado. Por favor, suba un archivo Excel (.xlsx o .xls).");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setGeneralError(null);
    setLoading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

      // Filter out empty rows
      const filteredRows = rows.filter(row =>
        Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '')
      );

      if (filteredRows.length === 0) {
        setGeneralError("El archivo Excel está vacío o no contiene datos válidos.");
        setLoading(false);
        return;
      }

      setExcelData(filteredRows);
      setStep('preview');
    } catch (err: any) {
      console.error("Error al leer el archivo Excel:", err);
      setGeneralError(err.message || "Error procesando el archivo Excel.");
    } finally {
      setLoading(false);
    }
  };

  const validateData = (data: ExcelRow[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    data.forEach((row, index) => {
      const rowIndex = index + 2; // +1 for 0-indexed array, +1 for header row in Excel

      // Required fields check
      const numContenedor = row["# Contenedor"] || row["CONTENEDOR"] || row["NUM_CONTENEDOR"];
      if (!numContenedor) {
        errors.push({ rowIndex, column: "NUM_CONTENEDOR", message: "Número de contenedor es obligatorio." });
      }

      // Date format check (assuming dates are parsed by XLSX.SSF.parse_date_code)
      const dateFields = ["Llegada a B/quilla", "ETD", "ETA"];
      dateFields.forEach(field => {
        const rawDate = row[field];
        if (rawDate !== undefined && rawDate !== null && typeof rawDate !== 'number') {
          errors.push({ rowIndex, column: field, message: `Formato de fecha inválido para '${field}'. Se espera un número de serie de fecha de Excel.`, value: rawDate });
        }
      });

      // Example: Check if 'dias_transito' is a number
      const diasTransito = row["Dias de transito"] || row["DIAS_TRANSITO"];
      if (diasTransito !== undefined && diasTransito !== null && isNaN(Number(diasTransito))) {
        errors.push({ rowIndex, column: "DIAS_TRANSITO", message: "Días de tránsito debe ser un número.", value: diasTransito });
      }
    });
    return errors;
  };

  const handlePreviewConfirm = () => {
    const errors = validateData(excelData);
    setValidationErrors(errors);
    setStep('validation');
  };

  const handleUpload = async () => {
    setLoading(true);
    setGeneralError(null);
    setProgress(0);
    const results: UploadResult[] = [];

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      const rowIndex = i + 2; // Excel row number

      try {
        const numContenedor = row["# Contenedor"] || row["CONTENEDOR"] || row["NUM_CONTENEDOR"];

        if (!numContenedor) {
          results.push({ rowIndex, status: 'error', message: "Número de contenedor es obligatorio.", data: row });
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
          throw new Error(`Error al insertar en cnn_factura_tracking: ${facturaError.message}`);
        }

        // Verify container existence
        const { data: existingContainer, error: selectError } = await supabase
          .from('cnn_container_tracking')
          .select('id')
          .eq('container_number', record.num_contenedor)
          .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means "no rows found"
          throw new Error(`Error al verificar contenedor existente: ${selectError.message}`);
        }

        // Insert container if not exists
        if (!existingContainer) {
          const { error: containerError } = await supabase
            .from('cnn_container_tracking')
            .insert([{ container_number: record.num_contenedor }]);

          if (containerError) {
            throw new Error(`Error al insertar en cnn_container_tracking: ${containerError.message}`);
          }
        }
        results.push({ rowIndex, status: 'success', data: row });

      } catch (err: any) {
        console.error(`Error procesando fila ${rowIndex}:`, err);
        results.push({ rowIndex, status: 'error', message: err.message || "Error desconocido", data: row });
      }
      setProgress(Math.round(((i + 1) / excelData.length) * 100));
    }

    setUploadResults(results);
    setStep('result');
    setLoading(false);

    const successfulUploads = results.filter(r => r.status === 'success').length;
    if (successfulUploads > 0) {
      toast.success(`Carga completada: ${successfulUploads} filas procesadas exitosamente.`);
      if (onSuccess) onSuccess();
    } else {
      toast.error("Carga completada: No se pudo procesar ninguna fila exitosamente.");
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

  const previewHeaders = useMemo(() => {
    if (excelData.length === 0) return [];
    return Object.keys(excelData[0]);
  }, [excelData]);

  const totalRows = excelData.length;
  const successCount = uploadResults.filter(r => r.status === 'success').length;
  const errorCount = uploadResults.filter(r => r.status === 'error').length;

  const renderContent = () => {
    switch (step) {
      case 'upload':
        return (
          <>
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
                  <p className="text-xs text-center text-gray-500">Cargando archivo... {progress}%</p>
                </div>
              )}
              {generalError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{generalError}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-xs flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  Plantilla
                </Button>
                <Button variant="ghost" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
              </div>
            </div>
          </>
        );

      case 'preview':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Previsualización de Datos</DialogTitle>
              <DialogDescription>
                Revise las primeras filas de su archivo Excel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="max-h-[300px] overflow-auto border rounded-md">
                <ShadcnTable>
                  <TableHeader>
                    <TableRow>
                      {previewHeaders.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excelData.slice(0, 5).map((row, rowIndex) => ( // Show first 5 rows
                      <TableRow key={rowIndex}>
                        {previewHeaders.map((header, colIndex) => (
                          <TableCell key={colIndex} className="text-xs">
                            {String(row[header] || '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {excelData.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={previewHeaders.length} className="text-center text-gray-500 text-xs">
                          ... {excelData.length - 5} filas más
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </ShadcnTable>
              </div>
              <div className="flex justify-between items-center mt-2">
                <Button variant="outline" onClick={() => setStep('upload')} disabled={loading}>
                  <ChevronLeft className="h-4 w-4 mr-2" /> Volver
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleClose} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button onClick={handlePreviewConfirm} disabled={loading}>
                    Continuar a Validación
                  </Button>
                </div>
              </div>
            </div>
          </>
        );

      case 'validation':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Validación de Datos</DialogTitle>
              <DialogDescription>
                Se encontraron {validationErrors.length} errores en {totalRows} filas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {validationErrors.length > 0 ? (
                <div className="max-h-[300px] overflow-auto border rounded-md p-2 bg-red-50">
                  <p className="text-sm font-medium text-red-700 mb-2">Errores encontrados:</p>
                  {validationErrors.map((err, index) => (
                    <div key={index} className="flex items-start gap-2 text-red-600 text-xs mb-1">
                      <AlertCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                      <span>
                        Fila {err.rowIndex}, Columna '{err.column}': {err.message} {err.value !== undefined && `(Valor: "${String(err.value).substring(0, 50)}${String(err.value).length > 50 ? '...' : ''}")`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <span>¡Todos los datos son válidos!</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <Button variant="outline" onClick={() => setStep('preview')} disabled={loading}>
                  <ChevronLeft className="h-4 w-4 mr-2" /> Volver
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleClose} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpload} disabled={loading}>
                    {loading ? 'Subiendo...' : 'Confirmar y Subir'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        );

      case 'result':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Resultados de la Carga</DialogTitle>
              <DialogDescription>
                Se procesaron {totalRows} filas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {loading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-gray-500">Procesando... {progress}%</p>
                </div>
              )}
              <div className="flex justify-around text-center">
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-lg font-bold">{successCount}</span>
                  <span className="text-sm text-gray-600">Éxitos</span>
                </div>
                <div className="flex flex-col items-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  <span className="text-lg font-bold">{errorCount}</span>
                  <span className="text-sm text-gray-600">Errores</span>
                </div>
              </div>

              {successCount > 0 && (
                <div className="max-h-[200px] overflow-auto border rounded-md p-2 bg-green-50">
                  <p className="text-sm font-medium text-green-700 mb-2">Detalles de cargas exitosas:</p>
                  {uploadResults.filter(r => r.status === 'success').map((res, index) => (
                    <div key={index} className="flex items-start gap-2 text-green-600 text-xs mb-1">
                      <CheckCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                      <span>
                        Fila {res.rowIndex}: Contenedor '{res.data?.["# Contenedor"] || res.data?.["CONTENEDOR"] || res.data?.["NUM_CONTENEDOR"]}' cargado exitosamente.
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {errorCount > 0 && (
                <div className="max-h-[200px] overflow-auto border rounded-md p-2 bg-red-50">
                  <p className="text-sm font-medium text-red-700 mb-2">Detalles de errores:</p>
                  {uploadResults.filter(r => r.status === 'error').map((res, index) => (
                    <div key={index} className="flex items-start gap-2 text-red-600 text-xs mb-1">
                      <AlertCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                      <span>
                        Fila {res.rowIndex}: {res.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end items-center mt-2">
                <Button onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUploadModal;
