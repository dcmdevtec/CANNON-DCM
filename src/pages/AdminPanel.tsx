import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Database, ShieldCheck, BarChart3, Server, BookOpen, Settings2 } from "lucide-react";

const AdminFeatureCard = ({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const AdminPanel = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Gestiona la configuración, usuarios y mantenimiento del sistema.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminFeatureCard 
          title="Gestión de Usuarios"
          description="Añadir, editar y eliminar usuarios y sus permisos."
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <AdminFeatureCard 
          title="Fuentes de Datos"
          description="Configurar APIs externas y credenciales de acceso."
          icon={<Database className="h-4 w-4 text-muted-foreground" />}
        />
        <AdminFeatureCard 
          title="Logs de Auditoría"
          description="Revisar el historial de acciones realizadas en el sistema."
          icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
        />
        <AdminFeatureCard 
          title="Monitoreo y Performance"
          description="Visualizar el estado y uso de recursos del sistema."
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
        <AdminFeatureCard 
          title="Backup y Restauración"
          description="Crear y restaurar copias de seguridad de la base de datos."
          icon={<Server className="h-4 w-4 text-muted-foreground" />}
        />
        <AdminFeatureCard 
          title="Reglas de Negocio"
          description="Configurar las reglas para la generación de alertas automáticas."
          icon={<Settings2 className="h-4 w-4 text-muted-foreground" />}
        />
        <AdminFeatureCard 
          title="Mantenimiento de Catálogos"
          description="Gestionar navieras, puertos, proveedores y otros."
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>Este es el panel de administración. Cada una de estas secciones se puede desarrollar según tus necesidades.</p>
      </div>
    </div>
  );
};

export default AdminPanel;