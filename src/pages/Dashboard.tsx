import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getISOWeek, getMonth, parseISO } from 'date-fns';
import { Ship, Anchor, PackageCheck, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

// Exportar ambos gráficos como imágenes PNG
const exportCharts = async () => {
  const chart1 = document.getElementById('chart-semanal');
  const chart2 = document.getElementById('chart-mensual');
  if (chart1) {
    const canvas1 = await html2canvas(chart1);
    const link1 = document.createElement('a');
    link1.download = 'grafico_semanal.png';
    link1.href = canvas1.toDataURL();
    link1.click();
  }
  if (chart2) {
    const canvas2 = await html2canvas(chart2);
    const link2 = document.createElement('a');
    link2.download = 'grafico_mensual.png';
    link2.href = canvas2.toDataURL();
    link2.click();
  }
};

// Utilidad para limpiar opciones de filtro (sin vacíos, null, undefined, etc)
const clean = (arr: any[]) => Array.from(new Set(arr))
  .map(v => (typeof v === 'string' ? v.trim() : String(v ?? '')))
  .filter(v => typeof v === 'string' && v.length > 0 && !/^\s+$/.test(v) && v !== 'null' && v !== 'undefined' && v !== 'NaN' && v !== '')
  .map(v => v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);


const Dashboard = () => {
  // Estados para semanal
  const [semanal, setSemanal] = useState<any[]>([]);
  const [navieraS, setNavieraS] = useState('');
  const [proveedorS, setProveedorS] = useState('');
  const [puertoS, setPuertoS] = useState('');
  const [semana, setSemana] = useState('');
  const [anioS, setAnioS] = useState('');
  // Estados para mensual
  const [mensual, setMensual] = useState<any[]>([]);
  const [navieraM, setNavieraM] = useState('');
  const [proveedorM, setProveedorM] = useState('');
  const [puertoM, setPuertoM] = useState('');
  const [mes, setMes] = useState('');
  const [anioM, setAnioM] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedData, setSelectedData] = useState<any[]>([]);
  const [containerDetails, setContainerDetails] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('cnn_inventario_espacios_semanal').select('*'),
      supabase.from('cnn_llegada_contenedores_mensual').select('*'),
      supabase.from('cnn_container_factura_view').select('*')
    ]).then(([resSem, resMen, resDet]) => {
      setSemanal(resSem.data || []);
      setMensual(resMen.data || []);
      setContainerDetails(resDet.data || []);
      setLoading(false);
    });
  }, []);



  // Filtros únicos para selects
  const navierasS = useMemo(() => clean(semanal.map(x => x.naviera)), [semanal]);
  const proveedoresS = useMemo(() => clean(semanal.map(x => x.proveedor)), [semanal]);
  const puertosS = useMemo(() => clean(semanal.map(x => x.puerto)), [semanal]);
  const semanas = useMemo(() => clean(semanal.map(x => String(x.semana))), [semanal]);
  const aniosS = useMemo(() => clean(semanal.map(x => String(x.anio))), [semanal]);

  const navierasM = useMemo(() => clean(mensual.map(x => x.naviera)), [mensual]);
  const proveedoresM = useMemo(() => clean(mensual.map(x => x.proveedor)), [mensual]);
  const puertosM = useMemo(() => clean(mensual.map(x => x.puerto)), [mensual]);
  const meses = useMemo(() => clean(mensual.map(x => String(x.mes))), [mensual]);
  const aniosM = useMemo(() => clean(mensual.map(x => String(x.anio))), [mensual]);

  // Filtros globales de proveedor y naviera
  const allProveedores = useMemo(() => clean([
    ...semanal.map(x => x.proveedor),
    ...mensual.map(x => x.proveedor)
  ]), [semanal, mensual]);
  const allNavieras = useMemo(() => clean([
    ...semanal.map(x => x.naviera),
    ...mensual.map(x => x.naviera)
  ]), [semanal, mensual]);
  const [proveedorGlobal, setProveedorGlobal] = useState('');
  const [navieraGlobal, setNavieraGlobal] = useState('');


  // Filtrado y agrupación de datos por semana (sumando contenedores de semanas repetidas)
  const semanalFiltrado = useMemo(() => {
    // Filtrar primero
    const filtrados = semanal.filter(x =>
      (!navieraS || x.naviera === navieraS)
      && (!proveedorS || x.proveedor === proveedorS)
      && (!puertoS || x.puerto === puertoS)
      && (!semana || String(x.semana) === semana)
      && (!anioS || String(x.anio) === anioS)
      && (!proveedorGlobal || x.proveedor === proveedorGlobal)
      && (!navieraGlobal || x.naviera === navieraGlobal)
    );
    // Agrupar por semana y sumar espacios_usados
    const agrupado: Record<string, any> = {};
    filtrados.forEach(item => {
      const key = String(item.semana);
      if (!agrupado[key]) {
        agrupado[key] = { ...item, espacios_usados: 0 };
      }
      agrupado[key].espacios_usados += parseInt(item.espacios_usados) || 0;
    });
    // Si hay más de un registro por semana, mantener el resto de campos del primero
    return Object.values(agrupado);
  }, [semanal, navieraS, proveedorS, puertoS, semana, anioS, proveedorGlobal, navieraGlobal]);


  // Filtrado y agrupación de datos por mes (sumando total_contenedores de meses repetidos)
  const mensualFiltrado = useMemo(() => {
    const filtrados = mensual.filter(x =>
      (!navieraM || x.naviera === navieraM)
      && (!proveedorM || x.proveedor === proveedorM)
      && (!puertoM || x.puerto === puertoM)
      && (!mes || String(x.mes) === mes)
      && (!anioM || String(x.anio) === anioM)
      && (!proveedorGlobal || x.proveedor === proveedorGlobal)
      && (!navieraGlobal || x.naviera === navieraGlobal)
    );
    // Agrupar por mes y sumar total_contenedores
    const agrupado: Record<string, any> = {};
    filtrados.forEach(item => {
      const key = String(item.mes);
      if (!agrupado[key]) {
        agrupado[key] = { ...item, total_contenedores: 0 };
      }
      agrupado[key].total_contenedores += parseInt(item.total_contenedores) || 0;
    });
    return Object.values(agrupado);
  }, [mensual, navieraM, proveedorM, puertoM, mes, anioM, proveedorGlobal, navieraGlobal]);

  // Cálculos filtrados para las cards
  const totalContenedores = mensualFiltrado.reduce((acc, x) => acc + (parseInt(x.total_contenedores) || 0), 0);
  const totalContenedoresEmbarcados = semanalFiltrado.reduce((acc, x) => acc + (parseInt(x.espacios_usados) || 0), 0);
  const semanasUnicas = Array.from(new Set(semanalFiltrado.map(x => x.semana))).length;
  const mesesUnicos = Array.from(new Set(mensualFiltrado.map(x => x.mes))).length;

  // Promedio semanal de embarques para la naviera seleccionada (entero)
  let promedioSemanalNaviera = 0;
  if (navieraGlobal) {
    const semanasNaviera = semanal.filter(x => x.naviera === navieraGlobal);
    const totalNaviera = semanasNaviera.reduce((acc, x) => acc + (parseInt(x.espacios_usados) || 0), 0);
    const semanasUnicasNaviera = Array.from(new Set(semanasNaviera.map(x => x.semana))).length;
    promedioSemanalNaviera = semanasUnicasNaviera > 0 ? Math.round(totalNaviera / semanasUnicasNaviera) : 0;
  }

  const handleBarClickSemanal = (data: any) => {
    if (data && data.activePayload && data.activePayload.length) {
      const payload = data.activePayload[0].payload;
      const selectedWeek = parseInt(String(payload.semana));

      // Filtrar los datos detallados (cnn_container_factura_view) usando ETD para obtener la semana
      const details = containerDetails.filter(x => {
        if (!x.etd) return false;
        const etdDate = parseISO(x.etd);
        const week = getISOWeek(etdDate);

        return week === selectedWeek &&
          (!navieraS || x.naviera === navieraS) &&
          (!proveedorS || x.proveedor === proveedorS) &&
          (!puertoS || x.puerto === puertoS) && // Nota: puerto en view puede ser distinto, ajustar si es necesario
          (!anioS || (x.anio && String(x.anio) === anioS)) &&
          (!proveedorGlobal || x.proveedor === proveedorGlobal) &&
          (!navieraGlobal || x.naviera === navieraGlobal);
      });

      // Ordenar por secuencia si es posible
      details.sort((a, b) => {
        const seqA = parseInt((a.contenedor || '').split(' ')[0]) || 0;
        const seqB = parseInt((b.contenedor || '').split(' ')[0]) || 0;
        return seqA - seqB;
      });

      setSelectedData(details);
      setModalTitle(`Detalle Semana ${selectedWeek}`);
      setIsModalOpen(true);
    }
  };

  const handleBarClickMensual = (data: any) => {
    if (data && data.activePayload && data.activePayload.length) {
      const payload = data.activePayload[0].payload;
      const selectedMonth = parseInt(String(payload.mes));

      // Filtrar los datos detallados (cnn_container_factura_view) usando ETA para obtener el mes
      const details = containerDetails.filter(x => {
        if (!x.eta) return false;
        const etaDate = parseISO(x.eta);
        const month = getMonth(etaDate) + 1; // getMonth es 0-indexed

        return month === selectedMonth &&
          (!navieraM || x.naviera === navieraM) &&
          (!proveedorM || x.proveedor === proveedorM) &&
          (!puertoM || x.puerto === puertoM) &&
          (!anioM || (x.anio && String(x.anio) === anioM)) &&
          (!proveedorGlobal || x.proveedor === proveedorGlobal) &&
          (!navieraGlobal || x.naviera === navieraGlobal);
      });

      setSelectedData(details);
      setModalTitle(`Detalle Mes ${selectedMonth}`);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={exportCharts}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold shadow"
        >
          Exportar
        </button>
      </div>
      {/* Filtros globales de naviera y proveedor */}
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <Select value={allNavieras.includes(navieraGlobal) ? navieraGlobal : '__all__'} onValueChange={v => setNavieraGlobal(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[220px] bg-white"><SelectValue placeholder="Filtrar por naviera (global)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las navieras</SelectItem>
            {allNavieras.map(n => (typeof n === 'string' && n.length > 0 ? <SelectItem key={n} value={n}>{n}</SelectItem> : null))}
          </SelectContent>
        </Select>
        <Select value={allProveedores.includes(proveedorGlobal) ? proveedorGlobal : '__all__'} onValueChange={v => setProveedorGlobal(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[220px] bg-white"><SelectValue placeholder="Filtrar por proveedor (global)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los proveedores</SelectItem>
            {allProveedores.map(p => (typeof p === 'string' && p.length > 0 ? <SelectItem key={p} value={p}>{p}</SelectItem> : null))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Contenedores Totales" value={totalContenedores} icon={Package} />
        <StatCard title="Contenedores embarcados" value={totalContenedoresEmbarcados} icon={Package} />

        <StatCard title={navieraGlobal ? `Promedio semanal (${navieraGlobal})` : 'Promedio semanal (naviera)'} value={navieraGlobal ? promedioSemanalNaviera : '-'} icon={Package} />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-4">
        {/* Gráfico semanal */}
        <Card className="flex-1 min-w-[340px]" id="chart-semanal">
          <CardHeader className="flex flex-col items-start">
            <div className="mb-2 flex flex-wrap items-center gap-2 w-full">
              <Select value={semanas.includes(semana) ? semana : '__all__'} onValueChange={v => setSemana(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full max-w-[180px] bg-white"><SelectValue placeholder="Semana" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semana</SelectItem>
                  {semanas.map(s => (typeof s === 'string' && s.length > 0 ? <SelectItem key={s} value={s}>{s}</SelectItem> : null))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <CardTitle>Semanas de Embarque</CardTitle>
              <span title="Cantidad de contenedores embarcados en cada semana. Calculado desde el inventario semanal de espacios usados." className="text-gray-400 cursor-help text-lg">&#9432;</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={semanalFiltrado} margin={{ top: 20, right: 20, left: -10, bottom: 5 }} onClick={handleBarClickSemanal}>
                <XAxis dataKey="semana" stroke="#222" fontSize={14} tickLine={false} axisLine={false} interval={0} angle={0} dy={16} tick={{ fontSize: 14, fill: '#222', fontWeight: 500 }} />
                <YAxis stroke="#222" fontSize={14} tickLine={false} axisLine={false} label={{ value: 'Total', angle: -90, position: 'insideLeft', offset: 28, fontSize: 15, fill: '#222' }} tick={{ fontSize: 14, fill: '#222', fontWeight: 500 }} allowDecimals={false} domain={[0, 'dataMax + 1']} />
                <Bar dataKey="espacios_usados" name="Contenedores embarcados" fill="#3b82f6" radius={[4, 4, 0, 0]} className="cursor-pointer">
                  <LabelList dataKey="espacios_usados" position="top" style={{ fill: '#111', fontSize: '16px', fontWeight: 700, textShadow: '0 1px 2px #fff' }} formatter={(value: number) => value > 0 ? value : ''} />
                </Bar>
                <Legend verticalAlign="top" height={32} iconType="rect" wrapperStyle={{ fontSize: 15, color: '#222', fontWeight: 600, marginBottom: 10, paddingLeft: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          {/* Etiqueta de eje X como leyenda */}
          <div className="text-center text-base font-semibold text-gray-700 mt-2">Semana</div>
        </Card>
        {/* Gráfico mensual */}
        <Card className="flex-1 min-w-[340px]" id="chart-mensual">
          <CardHeader className="flex flex-col items-start">
            <div className="mb-2 flex flex-wrap items-center gap-2 w-full">
              <Select value={meses.includes(mes) ? mes : '__all__'} onValueChange={v => setMes(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full max-w-[180px] bg-white"><SelectValue placeholder="Meses (Llegada a B/quilla)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Meses (Llegada a B/quilla)</SelectItem>
                  {meses.map(m => (typeof m === 'string' && m.length > 0 ? <SelectItem key={m} value={m}>{m}</SelectItem> : null))}
                </SelectContent>
              </Select>
              <Select value={puertosM.includes(puertoM) ? puertoM : '__all__'} onValueChange={v => setPuertoM(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full max-w-[200px] bg-white"><SelectValue placeholder="Llegada a B/quilla" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Llegada a B/quilla</SelectItem>
                  {puertosM.map(p => (typeof p === 'string' && p.length > 0 ? <SelectItem key={p} value={p}>{p}</SelectItem> : null))}
                </SelectContent>
              </Select>
            </div>
            <CardTitle>LLEGADA CONTENEDORES</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mensualFiltrado} margin={{ top: 20, right: 20, left: -10, bottom: 5 }} onClick={handleBarClickMensual}>
                <XAxis dataKey="mes" stroke="#222" fontSize={14} tickLine={false} axisLine={false} interval={0} angle={0} dy={16} tick={{ fontSize: 14, fill: '#222', fontWeight: 500 }} />
                <YAxis stroke="#222" fontSize={14} tickLine={false} axisLine={false} label={{ value: 'Total', angle: -90, position: 'insideLeft', offset: 28, fontSize: 15, fill: '#222' }} tick={{ fontSize: 14, fill: '#222', fontWeight: 500 }} allowDecimals={false} domain={[0, 'dataMax + 1']} />
                <Bar dataKey="total_contenedores" name="Total contenedores" fill="#3b82f6" radius={[4, 4, 0, 0]} className="cursor-pointer">
                  <LabelList dataKey="total_contenedores" position="top" style={{ fill: '#111', fontSize: '16px', fontWeight: 700, textShadow: '0 1px 2px #fff' }} formatter={(value: number) => value > 0 ? value : ''} />
                </Bar>
                <Legend verticalAlign="top" height={32} iconType="rect" wrapperStyle={{ fontSize: 15, color: '#222', fontWeight: 600, marginBottom: 10, paddingLeft: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          {/* Etiqueta de eje X como leyenda */}
          <div className="text-center text-base font-semibold text-gray-700 mt-2">Mes</div>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>
              Detalle de los contenedores seleccionados.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contenedor</TableHead>
                  <TableHead>Secuencia</TableHead>
                  <TableHead>Naviera</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Puerto</TableHead>

                  {/* Columnas opcionales si existen en los datos */}
                  {selectedData.some(d => d.titulo) && <TableHead>Título</TableHead>}
                  {selectedData.some(d => d.hilaza) && <TableHead>Hilaza</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.num_contenedor || '-'}</TableCell>
                    <TableCell>{item.contenedor || '-'}</TableCell>
                    <TableCell>{item.naviera || '-'}</TableCell>
                    <TableCell>{item.proveedor || '-'}</TableCell>
                    <TableCell>{item.puerto || '-'}</TableCell>

                    {selectedData.some(d => d.titulo) && <TableCell>{item.titulo || '-'}</TableCell>}
                    {selectedData.some(d => d.hilaza) && <TableCell>{item.hilaza || '-'}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;