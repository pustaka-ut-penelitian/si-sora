import { NavLink } from "react-router-dom";
import { Home, Database, DownloadCloud, Users, Settings } from "lucide-react";

export function FloatingDock() {
  const links = [
    { to: "/", label: "Dasbor", icon: Home },
    { to: "/explorer", label: "Eksplorasi Data", icon: Database },
    { to: "/jobs", label: "Penarikan Data", icon: DownloadCloud },
    { to: "/users", label: "Pengguna", icon: Users },
    { to: "/settings", label: "Sistem", icon: Settings },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in animate-slide-up max-w-[95vw]">
      <nav className="bg-[#002b54]/95 backdrop-blur-xl border-2 border-[#004b93] shadow-[5px_5px_0px_0px_#001428,0_12px_32px_rgba(0,0,0,0.35)] rounded-full p-2 flex items-center gap-1 sm:gap-2 transition-all duration-300">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-2 rounded-full py-2.5 transition-all duration-300 ease-out select-none ${
                isActive
                  ? "bg-[#fecb00] text-[#002b54] font-extrabold px-4 sm:px-5 shadow-sm scale-100"
                  : "text-white/70 hover:text-white hover:bg-white/10 px-3 sm:px-3.5 hover:scale-105 active:scale-95"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} 
                />
                
                <span
                  className={`whitespace-nowrap text-xs md:text-sm tracking-tight transition-all duration-300 ease-in-out overflow-hidden ${
                    isActive
                      ? "max-w-[140px] opacity-100 font-extrabold"
                      : "max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:pl-0.5 font-semibold text-white"
                  }`}
                >
                  {link.label}
                </span>

                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#002b54] shrink-0 animate-pulse hidden sm:inline-block"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
