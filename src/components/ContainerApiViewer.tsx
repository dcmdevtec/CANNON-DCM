
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchVesselPosition, saveVesselPosition, saveVesselIncident } from '@/integrations/supabase/vesselApi';
import { saveContainerInfo } from '@/integrations/supabase/api';

interface ContainerApiViewerProps {
  onTableUpdate?: (data: any[]) => void;
}

const API_BASE_URL = '/api/v1/containers';


const ContainerApiViewer: React.FC<ContainerApiViewerProps> = ({ onTableUpdate }) => {
  const apiKey = "oeFyUMWVcqNH_hL9vAmqFbTbrFMIvKKhV8g7fSfttic"; // El valor exacto de Postman

console.log("API Key:", apiKey);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingLine, setShippingLine] = useState('');
  const [containerData, setContainerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('cnn_container_info').select('*').limit(1);
        setDbStatus(error ? 'error' : 'ok');
      } catch {
        setDbStatus('error');
      }
    }
    checkConnection();
  }, []);
const url = `/api/v1/containers/${trackingNumber}?shipping_line=${shippingLine}`;
const fetchContainerData = async () => {
  setLoading(true);
  setError(null);
  setContainerData(null);
  try {
    // Validar si el contenedor ya fue consultado hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: existing, error: queryError } = await supabase
      .from('cnn_container_info')
      .select('*')
      .eq('container_id', trackingNumber)
      .gte('created_at', today.toISOString());
    if (queryError) {
      throw new Error('Error consultando la base de datos');
    }
    if (existing && existing.length > 0) {
      setError('Este contenedor ya fue consultado hoy.');
      setLoading(false);
      return;
    }
    // Si no existe, consultar la API
    console.log("URL:", url); // Debug
    console.log("API Key:", apiKey); // Debug
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "x-api-key": apiKey,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    const data = result.data;
    setContainerData(data);
    // Guardar en Supabase
    await saveContainerInfo(data);
    // Actualizar tabla local
    const newTable = [...tableData, data];
    setTableData(newTable);
    if (onTableUpdate) onTableUpdate(newTable);
  } catch (err: any) {
    setError(err.message);
    console.error("Error al obtener datos del contenedor:", err);
  } finally {
    setLoading(false);
  }
};




  return (
    <div className="p-4 max-w-2xl mx-auto bg-white rounded shadow">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-semibold">Conexión a Supabase:</span>
        {dbStatus === 'checking' && <span className="text-gray-500">Verificando...</span>}
        {dbStatus === 'ok' && <span className="text-green-600">Conectado</span>}
        {dbStatus === 'error' && <span className="text-red-600">Error de conexión</span>}
      </div>
      <h2 className="text-xl font-bold mb-4">Consulta de Contenedor (JSONCargo API)</h2>
      <div className="mb-2">
        <label className="block mb-1">Número de seguimiento:</label>
        <input
          type="text"
          value={trackingNumber}
          onChange={e => setTrackingNumber(e.target.value)}
          className="border rounded px-2 py-1 w-full"
          placeholder="Ej: MSMU8181134"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Naviera:</label>
        <input
          type="text"
          value={shippingLine}
          onChange={e => setShippingLine(e.target.value)}
          className="border rounded px-2 py-1 w-full"
          placeholder="Ej: msc, maersk, cma-cgm, evergreen, etc."
        />
      </div>
      <button
        onClick={fetchContainerData}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
      
      >
        {loading ? 'Consultando...' : 'Consultar'}
      </button>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {containerData && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Datos del Contenedor:</h3>
          <table className="min-w-full bg-gray-100 border text-xs mb-2">
            <tbody>
              {Object.entries(containerData).map(([key, value]) => (
                <tr key={key}>
                  <td className="border px-2 py-1 font-bold">{key}</td>
                  <td className="border px-2 py-1">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tableData.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-2">Tabla de Contenedores Consultados</h3>
          <table className="min-w-full bg-white border text-xs">
            <thead>
              <tr>
                {Object.keys(tableData[0]).map((key) => (
                  <th key={key} className="border px-2 py-1">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((value, i) => (
                    <td key={i} className="border px-2 py-1">{String(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContainerApiViewer;
