import { Outlet } from "react-router-dom";
import Header from "./Header";
import CollapsibleSidebar from "./CollapsibleSidebar";

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <CollapsibleSidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;