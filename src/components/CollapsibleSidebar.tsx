import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Anchor,
  Plus,
  ChevronLeft,
  BarChart2,
  MailCheck,
  Ship,
  Settings,
  Database,
} from "lucide-react";

const SidebarNavLink = ({ to, icon, label, isCollapsed }: { to: string, icon: React.ReactNode, label: string, isCollapsed: boolean }) => {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => cn(
        "flex items-center h-12 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors",
        isActive ? "bg-gray-700 text-white" : "",
        isCollapsed ? "w-12 justify-center" : "px-4 justify-start"
      )}
    >
      {icon}
      <span className={cn("ml-4 whitespace-nowrap", isCollapsed && "hidden")}>{label}</span>
    </NavLink>
  );
};

const CollapsibleSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={cn(
        "relative bg-[#1a222c] text-white flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
        <div
          className={cn(
            "flex items-center h-full",
            isCollapsed && "justify-center w-full"
          )}
        >
          {isCollapsed ? (
            // Logo solo cañón
            <img
              src="/lo.png"
              alt="Cañón"
              className="h-full w-auto transition-all duration-300"

            />
          ) : (
            // Logo completo
            <img
              src="/logo.png"
              alt="Cannon Logo"
              className=" w-auto transition-all duration-300"
            />
          )}
        </div>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -right-3 z-10 bg-gray-700 text-white rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform",
            isCollapsed && "rotate-180"
          )}
        />
      </button>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <SidebarNavLink
          to="/"
          icon={<LayoutDashboard className="h-6 w-6" />}
          label="Dashboard"
          isCollapsed={isCollapsed}
        />

        <SidebarNavLink
          to="/container-tracking"
          icon={<Anchor className="h-6 w-6" />}
          label="Contenedores"
          isCollapsed={isCollapsed}
        />
        <SidebarNavLink
          to="/approval-queue"
          icon={<MailCheck className="h-6 w-6" />}
          label="Aprobaciones"
          isCollapsed={isCollapsed}
        />

      </nav>

    </aside>

  );
};

export default CollapsibleSidebar;