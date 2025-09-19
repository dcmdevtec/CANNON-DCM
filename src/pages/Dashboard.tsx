import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { getWeek, getMonth, parseISO, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ship, Anchor, PackageCheck, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { Skeleton } from '@/components/ui/skeleton';

const getWeekNumber = (dateStr: string) => {
  try {
    return getWeek(parseISO(dateStr), { weekStartsOn: 1 });
  } catch (e) { return null; }
};

const getMonthName = (dateStr: string) => {
  try {
    const monthIndex = getMonth(parseISO(dateStr));
    return es.localize?.month(monthIndex, { width: 'abbreviated' }).toUpperCase().replace('.', '');
  } catch (e) { return null; }
};

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
  const [allData, setAllData] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('cnn_factura_tracking')
        .select('proveedor, estado, etd, llegada_bquilla');

      if (error) {
        console.error("Error fetching dashboard data:", error);
      } else {
        setAllData(data);
        const uniqueSuppliers = Array.from(new Set(data.map(item => item.proveedor).filter(Boolean)));
        setSuppliers(uniqueSuppliers);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      const supplierMatch = selectedSupplier === 'all' || item.proveedor === selectedSupplier;
      let dateMatch = true;
      if (dateRange?.from && item.etd) {
        try {
          const itemDate = parseISO(item.etd);
          dateMatch = itemDate >= startOfDay(dateRange.from);
          if (dateRange.to) {
            dateMatch = dateMatch && itemDate <= endOfDay(dateRange.to);
          }
        } catch (e) {
          dateMatch = false;
        }
      } else if (dateRange?.from) {
        dateMatch = false;
      }
      return supplierMatch && dateMatch;
    });
  }, [allData, selectedSupplier, dateRange]);

  const { cardStats, shipmentWeekData, arrivalMonthData } = useMemo(() => {
    const stats = {
      total: filteredData.length,
      transit: filteredData.filter(d => d.estado === 'En Tránsito').length,
      port: filteredData.filter(d => d.estado === 'En Puerto').length,
      delivered: filteredData.filter(d => d.estado === 'Entregado').length,
    };

    const weekCounts: { [key: number]: number } = {};
    filteredData.forEach(item => {
      if (item.etd) {
        const week = getWeekNumber(item.etd);
        if (week) weekCounts[week] = (weekCounts[week] || 0) + 1;
      }
    });
    const weeks = Object.keys(weekCounts).map(Number).sort((a, b) => a - b);
    const minWeek = weeks.length > 0 ? weeks[0] : 1;
    const maxWeek = weeks.length > 0 ? weeks[weeks.length - 1] : 52;
    const weekData = [];
    for (let i = minWeek; i <= maxWeek; i++) {
        weekData.push({ semana: `${i}`, total: weekCounts[i] || 0 });
    }

    const monthCounts: { [key: string]: number } = {};
    const monthOrder = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    filteredData.forEach(item => {
      if (item.llegada_bquilla) {
        const monthName = getMonthName(item.llegada_bquilla);
        if (monthName) monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
      }
    });
    const arrivalData = monthOrder
      .filter(month => monthCounts[month])
      .map(month => ({ mes: month, total: monthCounts[month] }));

    return { cardStats: stats, shipmentWeekData: weekData, arrivalMonthData: arrivalData };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Proveedores</SelectItem>
              {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Contenedores Totales" value={cardStats.total} icon={Package} />
          <StatCard title="En Tránsito" value={cardStats.transit} icon={Ship} />
          <StatCard title="En Puerto" value={cardStats.port} icon={Anchor} />
          <StatCard title="Entregados" value={cardStats.delivered} icon={PackageCheck} />
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Semanas de Embarque</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shipmentWeekData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="semana" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                   <LabelList dataKey="total" position="top" style={{ fill: '#374151', fontSize: '12px' }} formatter={(value: number) => value > 0 ? value : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Llegada de Contenedores</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={arrivalMonthData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="mes" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="total" position="top" style={{ fill: '#374151', fontSize: '12px' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;