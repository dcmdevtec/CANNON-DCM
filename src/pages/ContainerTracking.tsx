import { useEffect, useState } from "react";
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

const fetchFacturas = async () => {
  const { data, error } = await supabase.from("cnn_factura_tracking").select("*");
  if (error) return [];
  return data || [];
};

const ContainerTracking = () => {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchFacturas().then((data) => {
      setFacturas(data);
      setLoading(false);
    });
  }, []);

  // Tabs de filtro
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Todos');
  const estados = ['En Tránsito', 'En Puerto', 'Entregado'];
  const counts = {
    'En Tránsito': facturas.filter(f => f.estado === 'En Tránsito').length,
    'En Puerto': facturas.filter(f => f.estado === 'En Puerto').length,
    'Entregado': facturas.filter(f => f.estado === 'Entregado').length,
    'Todos': facturas.length
  };
  // Filtro por tab y búsqueda
  const filterByTab = (row: any) => activeTab === 'Todos' ? true : row.estado === activeTab;
  const filterBySearch = (row: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (row.num_contenedor || "").toLowerCase().includes(q) ||
      (row.contrato || "").toLowerCase().includes(q) ||
      (row.proveedor || "").toLowerCase().includes(q) ||
      (row.titulo || "").toLowerCase().includes(q) ||
      (row.estado || "").toLowerCase().includes(q)
    );
  };
  const filteredFacturas = facturas.filter(f => filterByTab(f) && filterBySearch(f));

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
            {e} ({counts[e]})
          </button>
        ))}
        <div className="flex-1"></div>
        <input
          type="text"
          className="border rounded px-3 py-1 w-72 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
          placeholder="Buscar por contenedor, contrato, proveedor, título o estado..."
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
              <TableHead className="text-[#6b7280] font-bold">ACCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFacturas.map((row) => (
              <TableRow key={row.id} className="hover:bg-[#f6f7fa]">
                <TableCell><input type="checkbox" /></TableCell>
                <TableCell>{row.titulo}</TableCell>
                <TableCell>{row.proveedor}</TableCell>
                <TableCell>{row.contrato}</TableCell>
                <TableCell>{row.despacho}</TableCell>
                <TableCell>
                  <div className="font-medium text-[#222]">{row.num_contenedor}</div>
                  <div className="text-xs text-[#6b7280]">2 de 7</div>
                </TableCell>
                <TableCell>{row.etd}</TableCell>
                <TableCell>{row.atd}</TableCell>
                <TableCell>{row.eta}</TableCell>
                <TableCell>
                  {/* Aquí irá la barra de progreso visual */}
                  <div className="flex flex-col items-center">
                    <div className="w-40 h-2 bg-gray-200 rounded-full relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full" style={{ zIndex: 2 }}></div>
                      <div className="h-2 bg-gray-300 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <span className="text-xs text-[#6b7280]">Día 0 de</span>
                  </div>
                </TableCell>
                <TableCell>{row.factura}</TableCell>
                
                <TableCell>{row.naviera}</TableCell>
                <TableCell>
                  <span className="inline-flex gap-2">
                    <button title="Ver" onClick={() => navigate(`/container-detail/${row.num_contenedor}`)} className="hover:bg-gray-100 rounded-full p-1">
                      <svg width="18" height="18" fill="none" stroke="#222" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2.05 12a9.94 9.94 0 0 1 19.9 0 9.94 9.94 0 0 1-19.9 0Z"/></svg>
                    </button>
                    <span title="Ubicación"><svg width="18" height="18" fill="none" stroke="#e11d48" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"/></svg></span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContainerTracking;

