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
import { Search, Upload } from 'lucide-react';
import ExcelUploadModal from '@/components/ExcelUploadModal';

type CorreoRow = {
  id: number;
  titulo?: string | null;
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
};

const fakeData: CorreoRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  titulo: `16/1 RIZO ${i + 1}`,
  proveedor: `Gurulaxmi ${((i % 4) + 1)}`,
  num_contenedor: ['MSMU6181134', 'TGBU5843024', 'MSMU6351035', 'FFAU2236575'][i % 4],
  estado: ['Pendiente', 'Revisar', 'Urgente'][i % 3],
  naviera: ['MSC', 'MAERSK', 'CMA-CGM', 'HAMBURG'][i % 4],
  factura: `F-${1000 + i}`,
  llegada_bquilla: new Date(Date.now() - i * 86400000).toISOString(),
  etd: new Date(Date.now() - (i + 2) * 86400000).toISOString(),
  created_at: new Date().toISOString(),
}));

const columns = [
  { key: 'num_contenedor', label: 'CONTENEDOR' },
  { key: 'contrato', label: 'CONTRATO' },
  { key: 'titulo', label: 'TÍTULO' },
  { key: 'naviera', label: 'NAVIERA' },
  { key: 'etd', label: 'ETD' },
  { key: 'estado', label: 'ESTADO' },
  { key: 'proveedor', label: 'PROVEEDOR' },
  { key: 'llegada_bquilla', label: 'LLEGADA' },
];

const ApprovalQueue = () => {
  const [rows, setRows] = useState<CorreoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      (r.naviera || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rows, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleApprove = async (row: CorreoRow) => {
    // Local optimistic update: remove row or mark approved
    setRows(prev => prev.filter(r => r.id !== row.id));
    // Optionally persist decision to a real approvals table if exists
    try {
      await supabase.from('cnn_correo_tracking').update({ estado: 'Aprobado' }).eq('id', row.id);
    } catch (e) {
      console.error('Error updating estado:', e);
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

  return (
    <div className="space-y-4 p-6 h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Módulo de Aprobaciones</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Subir Excel
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por contenedor, título o naviera..." className="w-72 pl-9" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white h-full flex flex-col">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox /></TableHead>
              {columns.map(col => (
                <TableHead key={col.key} className="font-bold text-gray-600">{col.label}</TableHead>
              ))}
              <TableHead className="font-bold text-gray-600">ACCIÓN</TableHead>
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
                <TableRow key={row.id} className="hover:bg-muted/50">
                  <TableCell><Checkbox /></TableCell>
                  <TableCell><div className="font-medium text-primary">{row.num_contenedor || '-'}</div></TableCell>
                  <TableCell>{row.titulo}</TableCell>
                  <TableCell>{row.naviera}</TableCell>
                  <TableCell>{row.etd ? new Date(row.etd).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Badge className={row.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                      {row.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.proveedor}</TableCell>
                  <TableCell>{row.llegada_bquilla ? new Date(row.llegada_bquilla).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => handleReject(row)}>Rechazar</Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Marcar como rechazado</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" onClick={() => handleApprove(row)}>Aprobar</Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Aprobar y procesar</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
          <div className="text-sm text-muted-foreground">Mostrando {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filtered.length)} de {filtered.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <div className="px-2">{page} / {pageCount}</div>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Siguiente</Button>
          </div>
        </div>
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

export default ApprovalQueue;