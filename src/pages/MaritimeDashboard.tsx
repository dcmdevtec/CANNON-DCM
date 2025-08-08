import GlobalContainerMap from "@/components/GlobalContainerMap";

const MaritimeDashboard = () => {
  return (
    <div className="h-[calc(100vh-8rem)] w-full">
      <h1 className="text-2xl font-bold mb-4">Mapa Marítimo en Tiempo Real</h1>
      <div className="relative h-full w-full rounded-lg border overflow-hidden z-0">
        <GlobalContainerMap />
      </div>
    </div>
  );
};

export default MaritimeDashboard;