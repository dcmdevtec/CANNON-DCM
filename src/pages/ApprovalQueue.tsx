import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type CorreoRow = {
  id: number;
  titulo?: string | null;
  hilaza?: string | null;
  proveedor?: string | null;
  contrato?: string | null;
  despacho?: string | null;
  num_contenedor?: string | null;
  llegada_bquilla?: string | null;
  contenedor?: string | null;
  estado?: string | null;
  naviera?: string | null;
  factura?: string | null;
  etd?: string | null;
  eta?: string | null;
  created_at?: string | null;
  container_info_id?: string | null;
  count?: string | null;
};

const fakeData: CorreoRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  titulo: `16/1 RIZO ${i + 1}`,
  hilaza: `HILAZA-${i % 3 + 1}`,
  proveedor: `Gurulaxmi ${((i % 4) + 1)}`,
  contrato: `EXP/PI-250500${i}`,
  despacho: 'Despacho Junio',
  num_contenedor: `${(i % 3) + 1} de 3`,
  container_info_id: ['MSMU6181134', 'TGBU5843024', 'MSMU6351035', 'FFAU2236575'][i % 4],
  estado: ['Pendiente', 'Entregado', 'En Tránsito'][i % 3],
  naviera: ['MSC', 'MAERSK', 'CMA-CGM', 'HAMBURG'][i % 4],
  factura: `F-${1000 + i}`,
  llegada_bquilla: new Date(Date.now() - i * 86400000).toISOString(),
  etd: new Date(Date.now() - (i + 30) * 86400000).toISOString(),
  eta: new Date(Date.now() + (i + 10) * 86400000).toISOString(),
  created_at: new Date().toISOString(),
}));

const columns = [
  { key: 'titulo', label: 'TÍTULO' },

  { key: 'proveedor', label: 'PROVEEDOR' },
  { key: 'contrato', label: 'CONTRATO' },
  { key: 'despacho', label: 'DESPACHO' },
  { key: 'factura', label: 'FACTURA' },
  { key: 'contenedor', label: 'CONTENEDOR' },
  { key: 'etd', label: 'ETD' },
  { key: 'eta', label: 'ETA' },
  { key: 'llegada_bquilla', label: 'LLEGADA A BARRANQUILLA' },
  { key: 'naviera', label: 'NAVIERA' },
  { key: 'estado', label: 'ESTADO' },
];

const ApprovalQueue = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<CorreoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CorreoRow | null>(null);
  const [approving, setApproving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CorreoRow | null>(null);
  const [editedData, setEditedData] = useState<Partial<CorreoRow>>({});
  const [saving, setSaving] = useState(false);
  const pageSize = 6;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cnn_correo_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cnn_correo_tracking:', error);
        setRows(fakeData);
      } else if (!data || data.length === 0) {
        setRows(fakeData);
      } else {
        console.log('Fetched data:', data);
        setRows(data as CorreoRow[]);
      }
    } catch (e) {
      console.error(e);
      setRows(fakeData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    return rows.filter(r =>
      (r.num_contenedor || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.titulo || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.hilaza || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.naviera || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.contrato || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.proveedor || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rows, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openApprovalDialog = (row: CorreoRow) => {
    setSelectedRow(row);
    setConfirmDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRow) return;
    setApproving(true);
    try {
      // 1. Update cnn_correo_tracking
      await supabase.from('cnn_correo_tracking').update({ estado: 'Aprobado' }).eq('id', selectedRow.id);

      // 2. Prepare data
      const etdDate = selectedRow.etd ? new Date(selectedRow.etd) : null;
      const etaDate = selectedRow.eta ? new Date(selectedRow.eta) : null;
      let diasTransito = null;
      if (etdDate && etaDate) {
        diasTransito = Math.ceil((etaDate.getTime() - etdDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // 3. Insert in cnn_factura_tracking
      // SWAPPED MAPPING based on user feedback
      const realContainerNumber = selectedRow.contenedor || selectedRow.container_info_id;

      if (!realContainerNumber) {
        toast({ title: 'Error', description: 'No se encontró el número de contenedor.', variant: 'destructive' });
        setConfirmDialogOpen(false);
        return;
      }

      const record = {
        titulo: selectedRow.count || selectedRow.titulo || null,
        proveedor: selectedRow.proveedor || null,
        contrato: selectedRow.contrato || null,
        despacho: selectedRow.despacho || null,
        num_contenedor: realContainerNumber, // Actual Container Number
        llegada_bquilla: selectedRow.llegada_bquilla ? new Date(selectedRow.llegada_bquilla).toISOString().split('T')[0] : null,
        contenedor: selectedRow.num_contenedor || null, // Sequence (1 de 3)
        estado: 'Aprobado',
        naviera: selectedRow.naviera || null,
        factura: selectedRow.factura || null,
        etd: etdDate ? etdDate.toISOString().split('T')[0] : null,
        eta: etaDate ? etaDate.toISOString().split('T')[0] : null,
        dias_transito: diasTransito,
        container_info_id: null,
      };

      const { error: insertError } = await supabase.from('cnn_factura_tracking').insert(record);
      if (insertError) throw insertError;

      // 4. Insert/check in cnn_container_tracking
      // Use the Real Container Number (now in record.num_contenedor)
      const containerNumber = record.num_contenedor;
      if (containerNumber) {
        const { data: existing, error: selectError } = await supabase
          .from('cnn_container_tracking')
          .select('id')
          .eq('container_number', containerNumber)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          console.error('Error checking container existence:', selectError);
        }

        if (!existing) {
          const { error: containerError } = await supabase
            .from('cnn_container_tracking')
            .insert([{ container_number: containerNumber }]);

          if (containerError) {
            console.error('Error inserting container:', containerError);
            // We don't block the flow here, but log it
          }
        }
      }

      setRows(prev => prev.filter(r => r.id !== selectedRow.id));
      toast({ title: 'Aprobado', description: 'La solicitud ha sido aprobada exitosamente' });
      setConfirmDialogOpen(false);
      setSelectedRow(null);
    } catch (e) {
      console.error('Error:', e);
      toast({ title: 'Error', description: 'Ocurrió un error', variant: 'destructive' });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (row: CorreoRow) => {
    setRows(prev => prev.filter(r => r.id !== row.id));
    try {
      await supabase.from('cnn_correo_tracking').update({ estado: 'Rechazado' }).eq('id', row.id);
    } catch (e) {
      console.error('Error updating estado:', e);
    }
  };

  const handleEdit = (row: CorreoRow) => {
    setEditingRow(row);
    // Map count to titulo if count exists, effectively merging them for the edit view
    const dataToEdit = { ...row };
    if (dataToEdit.count) {
      dataToEdit.titulo = dataToEdit.count;
    }
    setEditedData(dataToEdit);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    setSaving(true);
    try {
      // Preparar datos para actualizar
      const updateData: any = { ...editedData };

      // Si estamos actualizando el título, asegurarnos de que 'count' no interfiera
      // ya que la tabla prefiere 'count'. Lo seteamos a null para que se use 'titulo'.
      updateData.count = null;

      // Convertir fechas a formato correcto si están presentes
      if (updateData.etd) {
        updateData.etd = updateData.etd instanceof Date
          ? updateData.etd.toISOString().split('T')[0]
          : updateData.etd.split('T')[0];
      }
      if (updateData.eta) {
        updateData.eta = updateData.eta instanceof Date
          ? updateData.eta.toISOString().split('T')[0]
          : updateData.eta.split('T')[0];
      }
      if (updateData.llegada_bquilla) {
        updateData.llegada_bquilla = updateData.llegada_bquilla instanceof Date
          ? updateData.llegada_bquilla.toISOString().split('T')[0]
          : updateData.llegada_bquilla.split('T')[0];
      }

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('cnn_correo_tracking')
        .update(updateData)
        .eq('id', editingRow.id);

      if (error) throw error;

      // Actualizar el estado local
      setRows(prev => prev.map(r => r.id === editingRow.id ? { ...r, ...updateData } as CorreoRow : r));

      toast({ title: 'Actualizado', description: 'Los datos se han actualizado correctamente' });
      setEditDialogOpen(false);
      setEditingRow(null);
      setEditedData({});
    } catch (e) {
      console.error('Error updating row:', e);
      toast({ title: 'Error', description: 'Ocurrió un error al actualizar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-6 h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">Módulo de Aprobaciones</h1>
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por contenedor, contrato, etc..." className="w-full pl-9" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white h-full flex flex-col overflow-auto">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[40px]"><Checkbox /></TableHead>
              {columns.map(col => (
                <TableHead key={col.key} className="font-bold text-gray-600 text-xs uppercase whitespace-nowrap">{col.label}</TableHead>
              ))}
              <TableHead className="font-bold text-gray-600 text-xs uppercase">ACCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center py-8 text-gray-400">Cargando...</TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center py-8 text-gray-400">No hay solicitudes</TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50 text-sm">
                  <TableCell><Checkbox /></TableCell>

                  {/* TÍTULO - Muestra el campo count */}
                  <TableCell className="font-medium">{row.count || row.titulo || '-'}</TableCell>

                  {/* HILAZA */}


                  {/* PROVEEDOR */}
                  <TableCell>{row.proveedor}</TableCell>

                  {/* CONTRATO */}
                  <TableCell>{row.contrato || '-'}</TableCell>

                  {/* DESPACHO */}
                  <TableCell>{row.despacho || '-'}</TableCell>

                  {/* FACTURA */}
                  <TableCell>{row.factura || '-'}</TableCell>

                  {/* CONTENEDOR */}
                  <TableCell>
                    <div className="flex flex-col">
                      {/* Revertido a container_info_id para visualización si contenedor está vacío, pero manteniendo la lógica de inserción corregida */}
                      <span className="font-bold text-gray-900">{row.contenedor || row.container_info_id || '-'}</span>
                      <span className="text-xs text-gray-500">{row.num_contenedor}</span>
                    </div>
                  </TableCell>

                  {/* ETD */}
                  <TableCell className="whitespace-nowrap">{row.etd ? new Date(row.etd).toLocaleDateString() : '-'}</TableCell>

                  {/* ETA */}
                  <TableCell className="whitespace-nowrap">{row.eta ? new Date(row.eta).toLocaleDateString() : '-'}</TableCell>

                  {/* LLEGADA A BARRANQUILLA (Progress) */}
                  <TableCell className="w-[200px]">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Día 60 de 60</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* NAVIERA */}
                  <TableCell>{row.naviera}</TableCell>

                  {/* ESTADO */}
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${row.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      row.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                      {row.estado || 'Desconocido'}
                    </span>
                  </TableCell>

                  {/* ACCIÓN */}
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(row)}>
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Editar datos</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReject(row)}>
                            Rechazar
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Rechazar solicitud</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="default" className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs" onClick={() => openApprovalDialog(row)}>
                            Aprobar
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Aprobar solicitud</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 mt-auto sticky bottom-0">
          <div className="text-sm text-muted-foreground">Mostrando {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filtered.length)} de {filtered.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <div className="px-2">{page} / {pageCount}</div>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Siguiente</Button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Aprobación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas aprobar esta solicitud?
            </DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="grid gap-2 py-4 text-sm">
              <div><strong>Contenedor:</strong> {selectedRow.contenedor || selectedRow.container_info_id}</div>
              <div><strong>Contrato:</strong> {selectedRow.contrato}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={approving}>Cancelar</Button>
            <Button onClick={handleApprove} disabled={approving} className="bg-slate-900 text-white">
              {approving ? 'Aprobando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Datos</DialogTitle>
            <DialogDescription>
              Modifica los datos que desees actualizar
            </DialogDescription>
          </DialogHeader>
          {editingRow && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={editedData.titulo || ''}
                    onChange={(e) => setEditedData({ ...editedData, titulo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Input
                    id="proveedor"
                    value={editedData.proveedor || ''}
                    onChange={(e) => setEditedData({ ...editedData, proveedor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contrato">Contrato</Label>
                  <Input
                    id="contrato"
                    value={editedData.contrato || ''}
                    onChange={(e) => setEditedData({ ...editedData, contrato: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="despacho">Despacho</Label>
                  <Input
                    id="despacho"
                    value={editedData.despacho || ''}
                    onChange={(e) => setEditedData({ ...editedData, despacho: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num_contenedor">Número de Contenedor</Label>
                  <Input
                    id="num_contenedor"
                    value={editedData.num_contenedor || ''}
                    onChange={(e) => setEditedData({ ...editedData, num_contenedor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="container_info_id">Container Info ID</Label>
                  <Input
                    id="container_info_id"
                    value={editedData.container_info_id || ''}
                    onChange={(e) => setEditedData({ ...editedData, container_info_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="naviera">Naviera</Label>
                  <Input
                    id="naviera"
                    value={editedData.naviera || ''}
                    onChange={(e) => setEditedData({ ...editedData, naviera: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="factura">Factura</Label>
                  <Input
                    id="factura"
                    value={editedData.factura || ''}
                    onChange={(e) => setEditedData({ ...editedData, factura: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={editedData.estado || ''}
                    onChange={(e) => setEditedData({ ...editedData, estado: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="etd">ETD</Label>
                  <Input
                    id="etd"
                    type="date"
                    value={editedData.etd ? (typeof editedData.etd === 'string' ? editedData.etd.split('T')[0] : new Date(editedData.etd).toISOString().split('T')[0]) : ''}
                    onChange={(e) => setEditedData({ ...editedData, etd: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eta">ETA</Label>
                  <Input
                    id="eta"
                    type="date"
                    value={editedData.eta ? (typeof editedData.eta === 'string' ? editedData.eta.split('T')[0] : new Date(editedData.eta).toISOString().split('T')[0]) : ''}
                    onChange={(e) => setEditedData({ ...editedData, eta: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="llegada_bquilla">Llegada a Barranquilla</Label>
                  <Input
                    id="llegada_bquilla"
                    type="date"
                    value={editedData.llegada_bquilla ? (typeof editedData.llegada_bquilla === 'string' ? editedData.llegada_bquilla.split('T')[0] : new Date(editedData.llegada_bquilla).toISOString().split('T')[0]) : ''}
                    onChange={(e) => setEditedData({ ...editedData, llegada_bquilla: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditingRow(null); setEditedData({}); }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-slate-900 text-white">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalQueue;