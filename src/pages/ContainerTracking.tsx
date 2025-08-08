import { useState } from "react";
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
import { mockContainers } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TransitProgressBar from "@/components/TransitProgressBar";
import { differenceInDays, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FilterButton = ({ children, count, active, onClick }: { children: React.ReactNode, count?: number, active?: boolean, onClick: () => void }) => (
  <Button variant="ghost" onClick={onClick} className={cn("h-auto py-1.5 px-3 text-sm text-muted-foreground hover:text-primary", active && "bg-gray-200 text-primary font-semibold")}>
    {children}
    {count !== undefined && <span className="ml-2 ">{count}</span>}
  </Button>
);

const ContainerTracking = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");

  const handleRowClick = (containerId: string) => {
    navigate(`/container/${containerId}`);
  };
  
  const containersWithDetails = [
    ...mockContainers,
    {
      id: "11",
      titulo: "20/1 ALGODÓN",
      proveedor: "Indo-Count",
      contrato: "SC/1130 -",
      despacho: "Despacho Julio",
      container_number: "MSBU5451885",
      bill_of_lading: "MEDUIX329112",
      llegada: "25-ago",
      contenedor_seq: "1 de 1",
      estado: "En Tránsito",
      naviera: "MSC",
      factura: "EXP/0815/25-26",
      etd: "04-jun",
      eta: "25-ago",
      dias_transito: 82,
    }
  ];

  const filteredContainers = containersWithDetails.filter(container => {
    const searchMatch = searchTerm.length === 0 ||
      container.container_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.contrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (container.bill_of_lading && container.bill_of_lading.toLowerCase().includes(searchTerm.toLowerCase()));

    const filterMatch = activeFilter === 'Todos' || container.estado === activeFilter;

    return searchMatch && filterMatch;
  });

  const enTransitoCount = containersWithDetails.filter(c => c.estado === 'En Tránsito').length;
  const enPuertoCount = containersWithDetails.filter(c => c.estado === 'En Puerto').length;
  const entregadoCount = containersWithDetails.filter(c => c.estado === 'Entregado').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Seguimiento de Contenedores</h1>
        <div className="flex items-center gap-4">
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
      </div>

      <div className="flex items-center space-x-1 border-b">
        <FilterButton active={activeFilter === 'Todos'} onClick={() => setActiveFilter('Todos')}>Todos</FilterButton>
        <FilterButton active={activeFilter === 'En Tránsito'} count={enTransitoCount} onClick={() => setActiveFilter('En Tránsito')}>En Tránsito</FilterButton>
        <FilterButton active={activeFilter === 'En Puerto'} count={enPuertoCount} onClick={() => setActiveFilter('En Puerto')}>En Puerto</FilterButton>
        <FilterButton active={activeFilter === 'Entregado'} count={entregadoCount} onClick={() => setActiveFilter('Entregado')}>Entregado</FilterButton>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox /></TableHead>
              <TableHead className="font-bold text-gray-600">TÍTULO</TableHead>
              <TableHead className="font-bold text-gray-600">PROVEEDOR</TableHead>
              <TableHead className="font-bold text-gray-600">CONTENEDOR</TableHead>
              <TableHead className="font-bold text-gray-600">ETA</TableHead>
              <TableHead className="font-bold text-gray-600">LLEGADA A BARRANQUILLA</TableHead>
              <TableHead className="font-bold text-gray-600">ESTADO</TableHead>
              <TableHead className="font-bold text-gray-600">NAVIERA</TableHead>
              <TableHead className="font-bold text-gray-600">ACCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContainers.map((container) => {
              const today = new Date();
              const etdDate = parse(`${container.etd}-2025`, 'dd-MMM-yyyy', new Date(), { locale: es });

              let progress = 0;
              let elapsedDays = 0;

              if (!isNaN(etdDate.getTime()) && container.dias_transito > 0) {
                  elapsedDays = differenceInDays(today, etdDate);
                  progress = (elapsedDays / container.dias_transito) * 100;
              }
              
              progress = Math.min(100, Math.max(0, progress));
              elapsedDays = Math.max(0, elapsedDays);

              return (
                <TableRow key={container.id} className="hover:bg-muted/50">
                  <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                  <TableCell onClick={() => handleRowClick(container.container_number)} className="cursor-pointer">{container.titulo}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.container_number)} className="cursor-pointer">{container.proveedor}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.container_number)} className="cursor-pointer">
                    <div className="font-medium text-primary hover:underline">{container.container_number}</div>
                    <div className="text-xs text-muted-foreground">{container.contenedor_seq}</div>
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(container.container_number)} className="cursor-pointer">{container.eta}</TableCell>
                  <TableCell onClick={() => handleRowClick(container.container_number)} className="cursor-pointer min-w-[150px]">
                    <TransitProgressBar 
                        progress={progress} 
                        elapsedDays={elapsedDays} 
                        totalDays={container.dias_transito} 
                    />
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(container.container_number)} className="cursor-pointer">
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
                  <TableCell onClick={() => handleRowClick(container.container_number)} className="cursor-pointer">{container.naviera}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleRowClick(container.container_number)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver detalles</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContainerTracking;