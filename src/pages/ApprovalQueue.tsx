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
  container_info_id?: string | null;
};

const fakeData: CorreoRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  titulo: `16/1 RIZO ${i + 1}`,
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
  { key: 'contenedor', label: 'CONTENEDOR' },
  { key: 'etd', label: 'ETD' },
  { key: 'eta', label: 'ETA' },
  { key: 'llegada_bquilla', label: 'LLEGADA A BARRANQUILLA' },
  { key: 'naviera', label: 'NAVIERA' },
  { key: 'estado', label: 'ESTADO' },
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
      (r.naviera || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.contrato || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.proveedor || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rows, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleApprove = async (row: CorreoRow) => {
    setRows(prev => prev.filter(r => r.id !== row.id));
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
            <Input placeholder="Buscar por contenedor, contrato, etc..." className="w-72 pl-9" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
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

                  {/* TÍTULO */}
                  <TableCell className="font-medium">{row.titulo}</TableCell>

                  {/* PROVEEDOR */}
                  <TableCell>{row.proveedor}</TableCell>

                  {/* CONTRATO */}
                  <TableCell>{row.contrato || '-'}</TableCell>

                  {/* CONTENEDOR */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{row.container_info_id || '-'}</span>
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
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReject(row)}>
                            Rechazar
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Rechazar solicitud</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="default" className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs" onClick={() => handleApprove(row)}>
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