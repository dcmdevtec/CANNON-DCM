import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload, RefreshCw, Eye } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { parseISO, differenceInDays, format, differenceInHours } from 'date-fns';
import { DateRange } from "react-day-picker";
import TransitProgressBar from "@/components/TransitProgressBar";
import axios from "axios"; // Import axios for making HTTP requests
import ExcelUploadModal from "@/components/ExcelUploadModal";
import { toast } from "sonner";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);
  const [titleFilter, setTitleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const navigate = useNavigate();

  const requestSort = (key: string) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const fetchData = async () => {
    setLoading(true);

    // Primero obtenemos los datos de la vista
    const { data: viewData, error: viewError } = await supabase
      .from("cnn_container_factura_view")
      .select("*");

    if (viewError) {
      console.error("Error fetching contenedores:", viewError);
      setFacturas([]);
      setLoading(false);
      return;
    }

    // Luego obtenemos el último evento de cada contenedor
    const { data: eventsData, error: eventsError } = await supabase
      .from("cnn_container_tracking")
      .select(`
        container_number,
        cnn_container_events(created_at)
      `);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
    }

    // Crear un mapa de num_contenedor -> último created_at
    const lastEventMap = new Map();
    if (eventsData) {
      eventsData.forEach((item: any) => {
        const containerNum = item.container_number;
        const events = item.cnn_container_events;
        if (events && events.length > 0) {
          // Encontrar el evento más reciente
          const latestEvent = events.reduce((latest: any, current: any) => {
            return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
          });
          lastEventMap.set(containerNum, latestEvent.created_at);
        }
      });
    }

    // Combinar los datos
    const enrichedData = viewData.map((row: any) => ({
      ...row,
      last_event_created_at: lastEventMap.get(row.num_contenedor) || null
    }));

    const sortedData = enrichedData.sort((a, b) => {
      if (a.contrato < b.contrato) return -1;
      if (a.contrato > b.contrato) return 1;
      const seqA = parseInt(a.contenedor?.split(' ')[0] || '0');
      const seqB = parseInt(b.contenedor?.split(' ')[0] || '0');
      return seqA - seqB;
    });

    setFacturas(sortedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mapeo de estado real a categoría de filtro
  function getTabCategory(row: any): 'En Tránsito' | 'En Puerto' | 'Entregado' | 'Otros' {
    if (row.entregado) return 'Entregado';
    const estado = row.estado || '';
    const normalized = estado.toLowerCase();
    if (
      normalized.includes('tránsito') ||
      normalized.includes('transito') ||
      normalized.includes('en transito') ||
      normalized.includes('en tránsito') ||
      normalized.includes('export') ||
      normalized.includes('cy') ||
      normalized.includes('vacío al exportador') ||
      normalized.includes('empty to shipper') ||
      normalized.includes('recibido para exportación')
    ) return 'En Tránsito';
    if (
      normalized.includes('puerto') ||
      normalized.includes('port') ||
      normalized.includes('llegó a puerto') ||
      normalized.includes('arrived at port') ||
      normalized.includes('descargado') ||
      normalized.includes('discharged')
    ) return 'En Puerto';
    return 'Otros';
  }

  // Paginación
  const ROWS_PER_PAGE = 20;
  const [page, setPage] = useState(1);
  const filteredFacturas = useMemo(() => {
    setPage(1); // Reinicia a la página 1 si cambian los filtros

    const lowerSearch = search.trim().toLowerCase();

    const items = facturas.filter(f => {
      // Tab filter
      const tabCat = getTabCategory(f);
      const inTab = activeTab === 'Todos' || tabCat === activeTab;
      if (!inTab) return false;

      // General search
      if (lowerSearch) {
        const inSearch =
          (f.num_contenedor || "").toLowerCase().includes(lowerSearch) ||
          (f.contrato || "").toLowerCase().includes(lowerSearch) ||
          (f.proveedor || "").toLowerCase().includes(lowerSearch) ||
          (f.titulo || "").toLowerCase().includes(lowerSearch) ||
          (f.estado || "").toLowerCase().includes(lowerSearch);
        if (!inSearch) return false;
      }

      // Advanced filters for 'Todos' tab
      if (activeTab === 'Todos') {
        if (titleFilter && !(f.titulo || "").toLowerCase().includes(titleFilter.toLowerCase())) {
          return false;
        }
        if (statusFilter && !(f.estado || "").toLowerCase().includes(statusFilter.toLowerCase())) {
          return false;
        }
        if (dateRange?.from) {
          const from = dateRange.from;
          const to = dateRange.to || from;

          const etd = f.etd ? parseISO(f.etd) : null;
          const eta = f.eta ? parseISO(f.eta) : null;

          const etdInRange = etd && etd >= from && etd <= to;
          const etaInRange = eta && eta >= from && eta <= to;

          if (!(etdInRange || etaInRange)) {
            return false;
          }
        }
      }

      return true;
    });

    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return items;
  }, [facturas, activeTab, search, sortConfig, titleFilter, statusFilter, dateRange]);

  const totalPages = Math.ceil(filteredFacturas.length / ROWS_PER_PAGE) || 1;
  const paginatedFacturas = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filteredFacturas.slice(start, start + ROWS_PER_PAGE);
  }, [filteredFacturas, page]);

  const counts = useMemo(() => ({
    'En Tránsito': facturas.filter(f => getTabCategory(f) === 'En Tránsito').length,
    'En Puerto': facturas.filter(f => getTabCategory(f) === 'En Puerto').length,
    'Entregado': facturas.filter(f => getTabCategory(f) === 'Entregado').length,
    'Todos': facturas.length
  }), [facturas]);

  // Lógica de colores por contrato: alterna blanco y gris claro cada vez que cambia el contrato
  // Asigna un color pastel único a cada contrato, agrupando visualmente los iguales
  const contractColorMap = useMemo(() => {
    const map = new Map();
    const colorPalette = [
      "bg-[#e3f2fd]", // azul claro
      "bg-[#e8f5e9]", // verde claro
      "bg-[#fffde7]", // amarillo claro
      "bg-[#fce4ec]", // rosa claro
      "bg-[#f3e5f5]", // lila claro
      "bg-[#f9fbe7]", // lima claro
      "bg-[#e0f7fa]", // celeste claro
      "bg-[#fbe9e7]", // naranja claro
    ];
    const contractToColor = new Map();
    let colorIndex = 0;
    filteredFacturas.forEach(factura => {
      const contractKey = String(factura.contrato || '').trim();
      if (!contractToColor.has(contractKey)) {
        contractToColor.set(contractKey, colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
      }
      // Usar num_contenedor como clave única
      map.set(factura.num_contenedor, contractToColor.get(contractKey));
    });
    return map;
  }, [filteredFacturas]);

  const estados = ['En Tránsito', 'En Puerto', 'Entregado'];

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽';
  };

  // Función solo para navegar al detalle
  const handleViewDetail = (containerNumber: string) => {
    navigate(`/container-detail/${containerNumber}`);
  };

  // Función para actualizar tracking con cooldown de 24h
  const handleUpdateTracking = async (containerNumber: string, lastUpdate: string | null) => {
    if (lastUpdate) {
      const hoursDiff = differenceInHours(new Date(), parseISO(lastUpdate));
      if (hoursDiff < 24) {
        toast.error(`Debe esperar 24 horas para actualizar nuevamente. Última actualización hace ${Math.floor(hoursDiff)} horas.`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await axios.post("https://n8n.dcmsystem.co/webhook/cannon-container-tracking", {
        container_number: containerNumber,
        source: "dcm-production",
        client_reference: "DCM-2025-001"
      }, {
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": "dcm_webhook_secret_2024",
        },
      });
      console.log("Response from N8N webhook:", response.data);
      toast.success("Actualización solicitada correctamente");
      // Opcional: recargar datos para ver si cambió algo inmediatamente (aunque suele ser asíncrono)
      // fetchData(); 
    } catch (error) {
      console.error("Error sending container number to N8N:", error);
      toast.error("Error al solicitar actualización");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#f6f7fa]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Seguimiento de Contenedores</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Subir Excel
          </Button>
          <input
            type="text"
            className="border rounded px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
            placeholder="Buscar por contenedor, contrato, etc..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
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
      </div>
      {activeTab === 'Todos' && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-md border">
          <input
            type="text"
            placeholder="Filtrar por título..."
            className="border rounded px-3 py-2 w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
            value={titleFilter}
            onChange={e => setTitleFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filtrar por estado..."
            className="border rounded px-3 py-2 w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
          />
          <Button variant="outline" onClick={() => {
            setTitleFilter('');
            setStatusFilter('');
            setDateRange(undefined);
          }}>Limpiar filtros</Button>
        </div>
      )}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-[#f6f7fa]">
            <TableRow>
              <TableHead className="w-[40px]"><input type="checkbox" /></TableHead>
              <TableHead className="text-[#6b7280] font-bold">
                <button onClick={() => requestSort('titulo')}>TÍTULO{getSortIndicator('titulo')}</button>
              </TableHead>
              <TableHead className="text-[#6b7280] font-bold">PROVEEDOR</TableHead>
              <TableHead className="text-[#6b7280] font-bold">CONTRATO</TableHead>
              <TableHead className="text-[#6b7280] font-bold">DESPACHO</TableHead>
              <TableHead className="text-[#6b7280] font-bold">CONTENEDOR</TableHead>
              <TableHead className="text-[#6b7280] font-bold">
                <button onClick={() => requestSort('etd')}>ETD{getSortIndicator('etd')}</button>
              </TableHead>
              <TableHead className="text-[#6b7280] font-bold">
                <button onClick={() => requestSort('eta')}>ETA{getSortIndicator('eta')}</button>
              </TableHead>
              <TableHead className="text-[#6b7280] font-bold">LLEGADA A BARRANQUILLA</TableHead>
              <TableHead className="text-[#6b7280] font-bold">FACTURA</TableHead>
              <TableHead className="text-[#6b7280] font-bold">NAVIERA</TableHead>
              <TableHead className="text-[#6b7280] font-bold">
                <button onClick={() => requestSort('estado')}>ESTADO{getSortIndicator('estado')}</button>
              </TableHead>
              <TableHead className="text-[#6b7280] font-bold">ACCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center">
                  <div className="flex justify-center items-center">
                    <div className="loader border-t-4 border-blue-500 rounded-full w-8 h-8 animate-spin"></div>
                    <span className="ml-2 text-blue-500">Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedFacturas.map((row) => {
                const { progress, elapsed, total, isError } = calculateProgress(row.etd, row.eta);

                // Calcular si el botón debe estar deshabilitado
                const lastUpdate = row.last_event_created_at;
                let isUpdateDisabled = false;
                let tooltipText = "Actualizar Tracking";
                let hoursRemaining = 0;

                if (lastUpdate) {
                  const hoursDiff = differenceInHours(new Date(), parseISO(lastUpdate));
                  hoursRemaining = 24 - hoursDiff;
                  isUpdateDisabled = hoursDiff < 24;

                  if (isUpdateDisabled) {
                    tooltipText = `Debe esperar ${Math.ceil(hoursRemaining)} horas para actualizar`;
                  }
                }

                return (
                  <TableRow key={row.num_contenedor} className={contractColorMap.get(row.num_contenedor)}>
                    <TableCell><input type="checkbox" /></TableCell>
                    <TableCell>{row.titulo}</TableCell>
                    <TableCell>{row.proveedor}</TableCell>
                    <TableCell>{row.contrato}</TableCell>
                    <TableCell>{row.despacho}</TableCell>
                    <TableCell>
                      <div
                        className="font-medium text-[#222] cursor-pointer hover:underline"
                        onClick={() => handleViewDetail(row.num_contenedor)}
                      >
                        {row.num_contenedor}
                      </div>
                      <div className="text-xs text-[#6b7280]">{row.contenedor}</div>
                    </TableCell>
                    <TableCell>{formatDate(row.etd)}</TableCell>
                    <TableCell>{formatDate(row.eta)}</TableCell>
                    <TableCell>
                      {!isError && <TransitProgressBar progress={progress} elapsedDays={elapsed} totalDays={total} />}
                    </TableCell>
                    <TableCell>{row.factura}</TableCell>
                    <TableCell>{row.naviera}</TableCell>
                    <TableCell>
                      {row.entregado ? 'Entregado' : translateStatus(row.estado)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          title="Ver detalle"
                          onClick={() => handleViewDetail(row.num_contenedor)}
                          className="hover:bg-gray-100 rounded-full p-1"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          title={tooltipText}
                          onClick={() => handleUpdateTracking(row.num_contenedor, row.last_event_created_at)}
                          disabled={isUpdateDisabled}
                          className={`rounded-full p-1 ${isUpdateDisabled
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-gray-100 cursor-pointer'
                            }`}
                        >
                          <RefreshCw className={`h-4 w-4 ${isUpdateDisabled ? 'text-gray-400' : 'text-green-600'
                            } ${loading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {/* Paginación */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          className="px-3 py-1 rounded border bg-white disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >Anterior</button>
        <span className="font-semibold">Página {page} de {totalPages}</span>
        <button
          className="px-3 py-1 rounded border bg-white disabled:opacity-50"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >Siguiente</button>
      </div>
      <ExcelUploadModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default ContainerTracking;