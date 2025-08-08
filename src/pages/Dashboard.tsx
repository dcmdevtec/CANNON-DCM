import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Info } from "lucide-react";

// Mock data inspired by the screenshot
const oceanJourneyData = [
  { name: 'Adelantado', value: 0 },
  { name: 'A Tiempo', value: 307 },
  { name: 'Retrasado', value: 104 },
  { name: 'Otros', value: 1067 },
];

const podContainersData = [
  { name: 'Llegado', value: 6215 },
  { name: 'Descargado', value: 5652 },
  { name: 'Salida Puerta', value: 4911 },
  { name: 'Retorno Vacío', value: 4751 },
];

const DashboardStatCard = ({ title, value, subStats, valueColor = 'text-gray-900' }: { title: string, value: string, subStats: { label: string, value: string }[], valueColor?: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
      <div className="mt-2 space-y-1 text-xs text-gray-500">
        {subStats.map(stat => (
          <div key={stat.label} className="flex justify-between">
            <span>{stat.label}</span>
            <span className="font-medium text-gray-700">{stat.value}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de Control</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Resumen</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DashboardStatCard 
            title="Total Rastreados"
            value="8,592"
            subStats={[
              { label: 'Activos', value: '7,919' },
              { label: 'Inactivos/Archivados', value: '220' },
              { label: 'Con Errores', value: '453' },
            ]}
          />
          <DashboardStatCard 
            title="Total Activos"
            value="7,919"
            valueColor="text-green-600"
            subStats={[
              { label: 'Viaje TBC', value: '207' },
              { label: 'Viaje en Progreso', value: '1,497' },
              { label: 'Llegado a POD', value: '6,215' },
            ]}
          />
          <DashboardStatCard 
            title="Con Errores"
            value="453"
            valueColor="text-red-600"
            subStats={[
              { label: 'Datos de transportista faltantes', value: '285' },
              { label: 'Error desconocido', value: '92' },
              { label: 'Entrada inválida', value: '76' },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              Viaje Oceánico en Progreso: 1,497
              <Info className="h-4 w-4 ml-2 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={oceanJourneyData} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} />
                <Bar dataKey="value" barSize={30} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="value" position="top" style={{ fill: '#374151', fontSize: '12px' }} />
                  {oceanJourneyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Retrasado' ? '#ef4444' : (entry.value === 0 ? '#e5e7eb' : '#6b7280')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              Contenedores en POD: 6,215
              <Info className="h-4 w-4 ml-2 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={podContainersData} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} />
                <Bar dataKey="value" fill="#374151" barSize={30} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="value" position="top" style={{ fill: '#374151', fontSize: '12px' }} />
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