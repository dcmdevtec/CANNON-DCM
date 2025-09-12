import { useEffect, useState } from "react";
import ExcelUploadModal from "@/components/ExcelUploadModal";
import { fetchContainerFromJsonCargo } from "@/api/jsoncargo";
import {  fetchVesselFullData } from "@/api/jsoncargoVessel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
// import { mockContainers } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TransitProgressBar from "@/components/TransitProgressBar";
import { differenceInDays, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
// ...existing code...
const ContainerTracking = () => {
  // Función para consultar la API y guardar el buque si no existe
  const handleVesselFetch = async (container: any) => {
    let vesselName = container.last_vessel_name || container.current_vessel_name;
    if (!vesselName || container.vessel_exists) return;
    vesselName = vesselName.trim().replace(/\s+/g, " ");
    // Nuevo flujo: buscar por nombre y luego por IMO
    try {
      const vesselFullData = await fetchVesselFullData(vesselName);
      // Guardar ambos datos en la tabla de posición
      await supabase.from("cnn_vessel_position").insert([{ 
        ...vesselFullData.finder, 
        ...vesselFullData.basic 
      }]);
      // Recargar tabla para actualizar el estado
      const { data } = await supabase.from("v_tracking_contenedor_completo").select("*");
      setContainerRows(data || []);
    } catch (e) {
      // Manejar error
    }
  };
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [containerInput, setContainerInput] = useState("");
  const [navieraInput, setNavieraInput] = useState("");
  const [consulting, setConsulting] = useState(false);
  const [containerRows, setContainerRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const handleVesselFetch = async (container: any) => {
    const vesselName = container.last_vessel_name || container.current_vessel_name;
    if (!vesselName || container.vessel_exists) return;
    // Llamar API externa
    
    if (apiVessel) {
      await supabase.from("cnn_vessel_position").insert([apiVessel]);
      // Recargar tabla para actualizar el estado
      const { data } = await supabase.from("v_tracking_contenedor_completo").select("*");
      setContainerRows(data || []);
    }
  };
    async function fetchData() {
      setLoading(true);
      // Traer datos de la vista combinada
      const { data, error } = await supabase.from("v_tracking_contenedor_completo").select("*");
      if (!error && data) {
        setContainerRows(data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleRowClick = (containerId: string) => {
    navigate(`/container/${containerId}`);
  };

  // Filtros y búsqueda
  const filteredContainers = containerRows.filter(container => {
    // Solo mostrar los que existen en ambas tablas
    const existsInBoth = container.container_id_ref && container.factura_id;
    const searchMatch = searchTerm.length === 0 ||
      (container.num_contenedor && container.num_contenedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (container.proveedor && container.proveedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (container.titulo && container.titulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (container.contrato && container.contrato.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (container.bill_of_lading && container.bill_of_lading.toLowerCase().includes(searchTerm.toLowerCase()));

    const filterMatch = activeFilter === 'Todos' || container.estado === activeFilter;
    return existsInBoth && searchMatch && filterMatch;
  });

  const enTransitoCount = containerRows.filter(c => c.estado === 'En Tránsito').length;
  const enPuertoCount = containerRows.filter(c => c.estado === 'En Puerto').length;
  const entregadoCount = containerRows.filter(c => c.estado === 'Entregado').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Seguimiento de Contenedores</h1>
        <Button variant="outline" onClick={() => setExcelModalOpen(true)}>
          Subir Excel
        </Button>
      </div>
      {/* Buscador de la tabla */}
      <div className="flex items-center gap-4 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Contenedor, Proveedor, BL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
      </div>
      {/* Formulario de consulta de contenedor/ETA */}
      <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-md border">
        <Input
          placeholder="Contenedor"
          value={containerInput}
          onChange={(e) => setContainerInput(e.target.value)}
          className="w-40"
        />
        <Input
          placeholder="Naviera"
          value={navieraInput}
          onChange={(e) => setNavieraInput(e.target.value)}
          className="w-40"
        />
        <Button className="ml-2" onClick={async () => {
            setConsulting(true);
            // Limpiar y normalizar los valores
            const cleanContainerId = containerInput.trim().toUpperCase();
            const cleanNaviera = navieraInput.trim().toLowerCase();
            // Verificar si el contenedor ya existe en container_info
            const { data: existing, error } = await supabase
              .from("cnn_container_info")
              .select("*")
              .eq("container_id", cleanContainerId)
              .eq("shipping_line_name", cleanNaviera)
              .single();
            if (!error && existing) {
              // Ya existe, solo recargar la tabla
              const { data } = await supabase.from("v_tracking_contenedor_completo").select("*");
              setContainerRows(data || []);
            } else {
              // Consultar API externa y guardar
              const apiData = await fetchContainerFromJsonCargo(cleanContainerId, cleanNaviera);
              // Si hay nombre de buque, consultar y guardar datos completos
              if (apiData && apiData.current_vessel_name) {
                const vesselName = apiData.current_vessel_name.trim().replace(/\s+/g, " ");
                try {
                  const vesselFullData = await fetchVesselFullData(vesselName);
                  await supabase.from("cnn_vessel_position").insert([{ 
                    ...vesselFullData.finder, 
                    ...vesselFullData.basic 
                  }]);
                } catch (e) {
                  // Si falla la consulta del buque, continuar sin datos de buque
                }
              }
              // Guardar el contenedor
              await supabase.from("cnn_container_info").insert([{ ...apiData }]);
              // Recargar tabla
              const { data } = await supabase.from("v_tracking_contenedor_completo").select("*");
              setContainerRows(data || []);
            }
            setConsulting(false);
          }} disabled={consulting || !containerInput || !navieraInput}>
            {consulting ? "Consultando..." : "Consultar"}
        </Button>
      </div>

      <div className="flex items-center space-x-1 border-b">
        <Button variant={activeFilter === 'Todos' ? 'default' : 'outline'} onClick={() => setActiveFilter('Todos')}>Todos</Button>
        <Button variant={activeFilter === 'En Tránsito' ? 'default' : 'outline'} onClick={() => setActiveFilter('En Tránsito')}>En Tránsito ({enTransitoCount})</Button>
        <Button variant={activeFilter === 'En Puerto' ? 'default' : 'outline'} onClick={() => setActiveFilter('En Puerto')}>En Puerto ({enPuertoCount})</Button>
        <Button variant={activeFilter === 'Entregado' ? 'default' : 'outline'} onClick={() => setActiveFilter('Entregado')}>Entregado ({entregadoCount})</Button>
      </div>

      <div className="rounded-md border bg-white">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando datos...</div>
        ) : (
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox /></TableHead>
              <TableHead className="font-bold text-gray-600">TÍTULO</TableHead>
              <TableHead className="font-bold text-gray-600">PROVEEDOR</TableHead>
              <TableHead className="font-bold text-gray-600">CONTRATO</TableHead>
              <TableHead className="font-bold text-gray-600">DESPACHO</TableHead>
              <TableHead className="font-bold text-gray-600">CONTENEDOR</TableHead>
              <TableHead className="font-bold text-gray-600">ETD</TableHead>
              <TableHead className="font-bold text-gray-600">ATD</TableHead>
              <TableHead className="font-bold text-gray-600">ETA </TableHead>
              <TableHead className="font-bold text-gray-600">LLEGADA A BARRANQUILLA</TableHead>
              <TableHead className="font-bold text-gray-600">FACTURA</TableHead>
              <TableHead className="font-bold text-gray-600">ESTADO</TableHead>
              <TableHead className="font-bold text-gray-600">NAVIERA</TableHead>
              <TableHead className="font-bold text-gray-600">ACCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContainers.map((container) => {
              // Lógica para la línea deslizante: usar ETD y ETA de factura
              const etd = container.etd ? new Date(container.etd) : null;
              const eta = container.eta ? new Date(container.eta) : null;
              const diasTransito = container.dias_transito;
              const today = new Date();
              let progress = 0;
              let elapsedDays = 0;
              if (etd && eta && diasTransito > 0) {
                elapsedDays = differenceInDays(today, etd);
                progress = (elapsedDays / diasTransito) * 100;
              }
              progress = Math.min(100, Math.max(0, progress));
              elapsedDays = Math.max(0, elapsedDays);
              return (
                <TableRow key={container.factura_id} className="hover:bg-muted/50">
                  <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">{container.titulo}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">{container.proveedor}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">{container.contrato}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">{container.despacho}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">
                    <div className="font-medium text-primary hover:underline">{container.num_contenedor}</div>
                    <div className="text-xs text-muted-foreground">{container.contenedor}</div>
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">{container.etd ? new Date(container.etd).toLocaleDateString() : '-'}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">{container.atd_origin ? new Date(container.atd_origin).toLocaleDateString() : (container.etd ? new Date(container.etd).toLocaleDateString() : "-")}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">{container.eta_final_destination || container.eta || "-"}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer min-w-[150px]">
                    <TransitProgressBar 
                        progress={progress} 
                        elapsedDays={elapsedDays} 
                        totalDays={diasTransito} 
                    />
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">{container.factura}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">
                    <Badge 
                      variant={
                        container.estado === 'En Tránsito' ? 'outline' : 
                        container.estado === 'En Puerto' ? 'default' : 
                        'secondary'
                      }
                      className={cn(
                        container.estado === 'En Puerto' && 'bg-yellow-100 text-yellow-800',
                        container.estado === 'Entregado' && 'bg-green-100 text-green-800'
                      )}
                    >
                      {container.estado}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(container.num_contenedor)} className="cursor-pointer">{container.naviera}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2 items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleRowClick(container.num_contenedor)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver detalles</p>
                      </TooltipContent>
                    </Tooltip>
                    {/* Icono de ubicación solo visual, sin evento */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" disabled>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill={container.vessel_exists ? "#22c55e" : "#ef4444"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
                          </svg>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{container.vessel_exists ? "Ubicación disponible" : "Sin acción"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </div>
      {/* Modal para subir Excel */}
      <ExcelUploadModal
        open={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        onSuccess={async () => {
          // Recargar tabla al subir exitosamente
          const { data } = await supabase.from("v_tracking_contenedor_completo").select("*");
          setContainerRows(data || []);
        }}
      />
    </div>
  );
};

export default ContainerTracking;