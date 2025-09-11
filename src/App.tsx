import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ContainerDetail from "./pages/ContainerDetail";
import Layout from "./components/Layout";
import ContainerTracking from "./pages/ContainerTracking";
import ApprovalQueue from "./pages/ApprovalQueue";
import MaritimeDashboard from "./pages/MaritimeDashboard";
import AdminPanel from "./pages/AdminPanel";
import DatosApi from "./pages/DatosApi";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/maritime-dashboard" element={<MaritimeDashboard />} />
            <Route path="/container/:containerId" element={<ContainerDetail />} />
            <Route path="/container-tracking" element={<ContainerTracking />} />
            <Route path="/approval-queue" element={<ApprovalQueue />} />
            <Route path="/admin" element={<AdminPanel />} />
              <Route path="/datos-api" element={<DatosApi />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;