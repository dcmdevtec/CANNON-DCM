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
import { Search, Eye, ArrowUpDown, Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  { key: "last_updated", label: "ÚLTIMA ACTUALIZACIÓN" },
];

const ContainerApiTableV2 = ({ data }: { data: any[] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "eta_final_destination", direction: "desc" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedRow, setEditedRow] = useState<any>(null);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aValue = a[key] || "";
    const bValue = b[key] || "";
    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const filtered = sortedData.filter((row) => {
    const matchesSearch =
      row.container_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.shipping_line_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || row.container_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const startEditing = (row: any) => {
    setEditingId(row.container_id);
    setEditedRow({ ...row });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedRow(null);
  };

  const saveEditing = async () => {
    if (!editedRow) return;
    try {
      // Update cnn_container_info based on container_id
      const { error } = await supabase
        .from("cnn_container_info")
        .update({
          container_status: editedRow.container_status,
          eta_final_destination: editedRow.eta_final_destination,
          shipping_line_name: editedRow.shipping_line_name,
          current_vessel_name: editedRow.current_vessel_name,
        })
        .eq("container_id", editedRow.container_id);

      if (error) throw error;

      toast.success("Contenedor actualizado correctamente");
      setEditingId(null);
      setEditedRow(null);
      // Ideally trigger a refresh here
    } catch (err: any) {
      console.error("Error updating container:", err);
      toast.error("Error al actualizar el contenedor");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editedRow) {
      setEditedRow({ ...editedRow, [field]: value });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Contenedores API</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los Estados</SelectItem>
              <SelectItem value="En Tránsito">En Tránsito</SelectItem>
              <SelectItem value="En Puerto">En Puerto</SelectItem>
              <SelectItem value="Entregado">Entregado</SelectItem>
              <SelectItem value="Retrasado">Retrasado</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Contenedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>
      <div className="rounded-md border bg-white overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="font-bold text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
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
              filtered.map((row, idx) => {
                const isEditing = editingId === row.container_id;
                return (
                  <TableRow key={idx} className="hover:bg-muted/50">
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>
                      <div className="font-medium text-primary">{row.container_id}</div>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editedRow.shipping_line_name}
                          onChange={(e) => handleInputChange("shipping_line_name", e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        row.shipping_line_name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editedRow.container_status}
                          onValueChange={(val) => handleInputChange("container_status", val)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="En Tránsito">En Tránsito</SelectItem>
                            <SelectItem value="En Puerto">En Puerto</SelectItem>
                            <SelectItem value="Entregado">Entregado</SelectItem>
                            <SelectItem value="Retrasado">Retrasado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={statusColors[row.container_status] || "bg-gray-100 text-gray-800"}
                        >
                          {row.container_status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{row.shipped_from}</TableCell>
                    <TableCell>{row.shipped_to}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editedRow.current_vessel_name}
                          onChange={(e) => handleInputChange("current_vessel_name", e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        row.current_vessel_name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedRow.eta_final_destination?.split('T')[0]}
                          onChange={(e) => handleInputChange("eta_final_destination", e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        row.eta_final_destination
                      )}
                    </TableCell>
                    <TableCell>{row.last_updated}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={saveEditing} className="text-green-600">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={cancelEditing} className="text-red-600">
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => startEditing(row)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <TooltipProvider>
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
                        </TooltipProvider>
                      </div>
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

export default ContainerApiTableV2;
