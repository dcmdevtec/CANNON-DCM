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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const statusColors: Record<string, string> = {
  "En Tránsito": "bg-green-100 text-green-800",
  "En Puerto": "bg-yellow-100 text-yellow-800",
  "Entregado": "bg-teal-100 text-teal-800",
  "Retrasado": "bg-red-100 text-red-800",
};

const columns = [
  { key: "container_id", label: "CONTENEDOR" },
  { key: "shipping_line_name", label: "NAVIERA" },
  { key: "container_status", label: "ESTADO" },
  { key: "shipped_from", label: "ORIGEN" },
  { key: "shipped_to", label: "DESTINO" },
  { key: "current_vessel_name", label: "BARCO" },
  { key: "eta_final_destination", label: "ETA" },
];

const ContainerApiTableV2 = ({ data }: { data: any[] }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = data.filter(
    (row) =>
      row.container_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.shipping_line_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Contenedores API</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Contenedor o Naviera..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
        </div>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
              {columns.map((col) => (
                <TableHead key={col.key} className="font-bold text-gray-600">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="font-bold text-gray-600">ACCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center py-4 text-gray-400">
                  No hay datos para mostrar
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-muted/50">
                  <TableCell><Checkbox /></TableCell>
                  <TableCell>
                    <div className="font-medium text-primary hover:underline cursor-pointer">{row.container_id}</div>
                  </TableCell>
                  <TableCell>{row.shipping_line_name}</TableCell>
                  <TableCell>
                    <Badge
                      className={statusColors[row.container_status] || "bg-gray-100 text-gray-800"}
                    >
                      {row.container_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.shipped_from}</TableCell>
                  <TableCell>{row.shipped_to}</TableCell>
                  <TableCell>{row.current_vessel_name}</TableCell>
                  <TableCell>{row.eta_final_destination}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver detalles</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContainerApiTableV2;
