import React, { useState } from 'react';
import ContainerApiViewer from '../components/ContainerApiViewer';
import ContainerApiTableV2 from '../components/ContainerApiTableV2';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';



const DatosApi: React.FC = () => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [tab, setTab] = useState('consultar');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">Datos API - Consulta de Contenedores</h1>
      <div className="max-w-6xl mx-auto">
        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="consultar">Consultar Datos</TabsTrigger>
            <TabsTrigger value="ver">Ver Datos</TabsTrigger>
          </TabsList>
          <TabsContent value="consultar">
            <ContainerApiViewer onTableUpdate={setTableData} />
          </TabsContent>
          <TabsContent value="ver">
            <ContainerApiTableV2 data={tableData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DatosApi;
