import { NavLink } from "react-router-dom";
import { LayoutDashboard, Database, Settings, Menu, X, Table } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Scraper Engine", path: "/data", icon: Database },
    { name: "Data Explorer", path: "/explorer", icon: Table },
    { name: "Setting API", path: "/settings", icon: Settings },
  ];

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-on-primary rounded-md shadow-md"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-on-background/50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary text-on-primary shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-center h-20 border-b border-primary/20">
          <h1 className="text-xl font-headline font-bold">UT Sentiment</h1>
        </div>
        <nav className="mt-6 flex flex-col gap-2 px-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md font-body transition-colors ${
                  isActive
                    ? "bg-secondary text-on-background font-semibold shadow-sm"
                    : "hover:bg-primary/80 hover:bg-accent-blue"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
