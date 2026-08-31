import { Outlet, useLocation } from "react-router-dom";
import { FloatingDock } from "./layout/FloatingDock";
import { WebGLOrganicBackground } from "./layout/WebGLOrganicBackground";
import worldMapSvg from "../assets/world-map.svg";

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f9f9fa] text-slate-900 flex font-body relative overflow-hidden">
      <div className="fixed inset-0 z-[0] pointer-events-none flex items-center justify-center opacity-[0.23] mix-blend-multiply overflow-hidden">
        <img src={worldMapSvg} alt="World Map Background" className="w-full h-full object-cover grayscale opacity-50 md:opacity-100" />
      </div>
      <WebGLOrganicBackground />
      <div className="fixed top-0 right-0 w-[50vw] h-[50vw] bg-[#003f7a]/10 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 z-[0] pointer-events-none"></div>
      
      <main className="flex-1 flex flex-col min-h-screen max-w-[1600px] mx-auto w-full pb-32 relative z-10">
        <div 
          key={location.pathname} 
          className="flex-1 p-6 sm:p-8 lg:p-10 overflow-auto animate-fade-in animate-slide-up"
        >
          <Outlet />
        </div>
      </main>
      <FloatingDock />
    </div>
  );
}
