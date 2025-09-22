// Traducción de estados de tracking
const statusTranslations: Record<string, string> = {
  "Export received at CY": "Recibido para exportación en CY",
  "Empty to Shipper": "Vacío al exportador",
  "Gate out": "Salida de puerto",
  "Loaded on Vessel": "Cargado en buque",
  "Discharged": "Descargado",
  "Arrived at Port": "Llegó a puerto",
  // Agrega más traducciones según tus datos reales
};

function translateStatus(status: string | null | undefined): string {
  if (!status) return "-";
  return statusTranslations[status] || status;
}
import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { parseISO, differenceInDays, format } from 'date-fns';
import TransitProgressBar from "@/components/TransitProgressBar";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd');
  } catch (e) {
    return dateStr; // Return original if parsing fails
  }
};

const calculateProgress = (etdStr: string | null, etaStr: string | null) => {
  if (!etdStr || !etaStr) return { progress: 0, elapsed: 0, total: 0, isError: true };
  try {
    const etd = parseISO(etdStr);
    const eta = parseISO(etaStr);
    const today = new Date();

    const totalDays = differenceInDays(eta, etd);
    if (totalDays <= 0) return { progress: today >= eta ? 100 : 0, elapsed: 0, total: totalDays, isError: false };
    
    const elapsedDays = differenceInDays(today, etd);
    const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    
    return { progress, elapsed: elapsedDays, total: totalDays, isError: false };
  } catch (e) {
    return { progress: 0, elapsed: 0, total: 0, isError: true };
  }
};

const ContainerTracking = () => {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState('Todos');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("cnn_container_factura_view").select("*");
      if (error) {
        console.error("Error fetching contenedores:", error);
        setFacturas([]);
        setLoading(false);
        return;
      }
      // Ordenar igual que antes
      const sortedData = data.sort((a, b) => {
        if (a.contrato < b.contrato) return -1;
        if (a.contrato > b.contrato) return 1;
        const seqA = parseInt(a.contenedor?.split(' ')[0] || '0');
        const seqB = parseInt(b.contenedor?.split(' ')[0] || '0');
        return seqA - seqB;
      });
      setFacturas(sortedData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredFacturas = useMemo(() => {
    return facturas.filter(f => {
      const inTab = activeTab === 'Todos' || f.estado === activeTab;
      const inSearch = () => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          (f.num_contenedor || "").toLowerCase().includes(q) ||
          (f.contrato || "").toLowerCase().includes(q) ||
          (f.proveedor || "").toLowerCase().includes(q) ||
          (f.titulo || "").toLowerCase().includes(q) ||
          (f.estado || "").toLowerCase().includes(q)
        );
      };
      return inTab && inSearch();
    });
  }, [facturas, activeTab, search]);

  const counts = useMemo(() => ({
    'En Tránsito': facturas.filter(f => f.estado === 'En Tránsito').length,
    'En Puerto': facturas.filter(f => f.estado === 'En Puerto').length,
    'Entregado': facturas.filter(f => f.estado === 'Entregado').length,
    'Todos': facturas.length
  }), [facturas]);

  const contractColorMap = useMemo(() => {
    const map = new Map();
    const colorPalette = ["bg-white", "bg-gray-100"];
    let lastContract: string | null = null;
    let colorIndex = 0;
    filteredFacturas.forEach(factura => {
      if (factura.contrato !== lastContract) {
        colorIndex = (colorIndex + 1) % colorPalette.length;
        lastContract = factura.contrato;
      }
      map.set(factura.id, colorPalette[colorIndex]);
    });
    return map;
  }, [filteredFacturas]);

  const estados = ['En Tránsito', 'En Puerto', 'Entregado'];

  return (
    <div className="p-4 min-h-screen bg-[#f6f7fa]">
      <div className="flex gap-2 mb-2">
        <button
          className={`px-4 py-1 rounded-t-md border border-b-0 ${activeTab === 'Todos' ? 'bg-white font-bold text-[#222] shadow-sm' : 'bg-[#f6f7fa] text-[#222] hover:bg-white'}`}
          onClick={() => setActiveTab('Todos')}
        >
          Todos ({counts['Todos']})
        </button>
        {estados.map(e => (
          <button
            key={e}
            className={`px-4 py-1 rounded-t-md border border-b-0 ${activeTab === e ? 'bg-white font-bold text-[#222] shadow-sm' : 'bg-[#f6f7fa] text-[#222] hover:bg-white'}`}
            onClick={() => setActiveTab(e)}
          >
            {e} ({counts[e as keyof typeof counts]})
          </button>
        ))}
        <div className="flex-1"></div>
        <input
          type="text"
          className="border rounded px-3 py-1 w-72 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
          placeholder="Buscar por contenedor, contrato, etc..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-[#f6f7fa]">
            <TableRow>
              <TableHead className="w-[40px]"><input type="checkbox" /></TableHead>
              <TableHead className="text-[#6b7280] font-bold">TÍTULO</TableHead>
              <TableHead className="text-[#6b7280] font-bold">PROVEEDOR</TableHead>
              <TableHead className="text-[#6b7280] font-bold">CONTRATO</TableHead>
              <TableHead className="text-[#6b7280] font-bold">DESPACHO</TableHead>
              <TableHead className="text-[#6b7280] font-bold">CONTENEDOR</TableHead>
              <TableHead className="text-[#6b7280] font-bold">ETD</TableHead>
              <TableHead className="text-[#6b7280] font-bold">ATD</TableHead>
              <TableHead className="text-[#6b7280] font-bold">ETA</TableHead>
              <TableHead className="text-[#6b7280] font-bold">LLEGADA A BARRANQUILLA</TableHead>
              <TableHead className="text-[#6b7280] font-bold">FACTURA</TableHead>
              <TableHead className="text-[#6b7280] font-bold">NAVIERA</TableHead>
              <TableHead className="text-[#6b7280] font-bold">ESTADO</TableHead>
              <TableHead className="text-[#6b7280] font-bold">ACCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={13} className="text-center">Cargando...</TableCell></TableRow>
            ) : (
              filteredFacturas.map((row) => {
                const { progress, elapsed, total, isError } = calculateProgress(row.etd, row.eta);
                return (
                  <TableRow key={row.id} className={contractColorMap.get(row.id)}>
                    <TableCell><input type="checkbox" /></TableCell>
                    <TableCell>{row.titulo}</TableCell>
                    <TableCell>{row.proveedor}</TableCell>
                    <TableCell>{row.contrato}</TableCell>
                    <TableCell>{row.despacho}</TableCell>
                    <TableCell>
                      <div className="font-medium text-[#222]">{row.num_contenedor}</div>
                      <div className="text-xs text-[#6b7280]">{row.contenedor}</div>
                    </TableCell>
                    <TableCell>{formatDate(row.etd)}</TableCell>
                    <TableCell>{formatDate(row.atd)}</TableCell>
                    <TableCell>{formatDate(row.eta)}</TableCell>
                    <TableCell>
                      {!isError && <TransitProgressBar progress={progress} elapsedDays={elapsed} totalDays={total} />}
                    </TableCell>
                    <TableCell>{row.factura}</TableCell>
                    <TableCell>{row.naviera}</TableCell>
                    <TableCell>{translateStatus(row.estado)}</TableCell>
                    <TableCell>
                      <span className="inline-flex gap-2">
                        <button title="Ver" onClick={() => navigate(`/container-detail/${row.num_contenedor}`)} className="hover:bg-gray-100 rounded-full p-1">
                          <svg width="18" height="18" fill="none" stroke="#222" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2.05 12a9.94 9.94 0 0 1 19.9 0 9.94 9.94 0 0 1-19.9 0Z"/></svg>
                        </button>
                        <span title="Ubicación"><svg width="18" height="18" fill="none" stroke="#e11d48" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"/></svg></span>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContainerTracking;