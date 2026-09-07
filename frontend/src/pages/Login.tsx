import { useState } from "react";
import { apiClient } from "../api/client";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

import bgImage from "../assets/bg.jpg";
import logoImage from "../assets/logo.png";
import utLogo from "../assets/logo ut.png";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post("/api/auth/login", {
        username: trimmedUser,
        password: password,
      });
      const token = response.data.access_token;
      
      localStorage.setItem("token", token);
      navigate("/");
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(err.response?.data?.detail || "Kredensial tidak valid. Periksa kembali username dan password Anda.");
      } else if (err.response?.data?.detail) {
        const detailMsg = err.response.data.detail;
        setError(typeof detailMsg === "string" ? detailMsg : "Data login tidak valid.");
      } else {
        setError("Terjadi kesalahan sistem. Tidak dapat menghubungi server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-body overflow-hidden">
      <div 
        className="hidden lg:flex lg:w-[55%] bg-[#001f3f] text-white flex-col justify-between p-12 xl:p-16 relative select-none z-0 overflow-visible"
      >
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img src={bgImage} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#001f3f]/70"></div>
        </div>

        <div 
          className="hidden lg:block absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ right: "-2px", width: "calc(6rem + 2px)" }}
        >
          <svg
            viewBox="0 0 100 1000"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <style>{`
              @keyframes acousticSignalPulse {
                0% {
                  stroke-dashoffset: 1400;
                  opacity: 0;
                }
                15% {
                  opacity: 1;
                }
                85% {
                  opacity: 1;
                }
                100% {
                  stroke-dashoffset: -300;
                  opacity: 0;
                }
              }
              .acoustic-pulse-line {
                stroke-dasharray: 180 1400;
                animation: acousticSignalPulse 3.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              }
            `}</style>
            <path
              d="M 25,0 C 25,120 70,180 70,280 C 70,380 25,440 25,540 C 25,640 68,700 68,800 C 68,900 35,950 35,1000 L 100,1000 L 100,0 Z"
              fill="#ffffff"
            />
            <path
              d="M 25,0 C 25,120 70,180 70,280 C 70,380 25,440 25,540 C 25,640 68,700 68,800 C 68,900 35,950 35,1000"
              fill="none"
              stroke="#fecb00"
              strokeWidth="14"
              strokeOpacity="0.12"
              className="blur-sm"
            />
            <path
              d="M 25,0 C 25,120 70,180 70,280 C 70,380 25,440 25,540 C 25,640 68,700 68,800 C 68,900 35,950 35,1000"
              fill="none"
              stroke="#fecb00"
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{
                filter: "drop-shadow(0 0 8px rgba(254, 203, 0, 0.75))"
              }}
            />
            <path
              d="M 25,0 C 25,120 70,180 70,280 C 70,380 25,440 25,540 C 25,640 68,700 68,800 C 68,900 35,950 35,1000"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              className="acoustic-pulse-line"
              style={{
                filter: "drop-shadow(0 0 8px #fecb00) drop-shadow(0 0 3px #ffffff)"
              }}
            />
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="relative flex items-center gap-4 py-2 px-3">
            <div className="absolute inset-0 bg-white/[0.07] rounded-2xl blur-md pointer-events-none"></div>
            <img 
              src={logoImage} 
              alt="Logo SI SORA" 
              className="relative z-10 h-11 xl:h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
              style={{
                filter: "drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 12px rgba(254, 203, 0, 0.5))"
              }}
            />
            <div className="relative z-10 h-8 w-[2px] bg-[#fecb00]/40 rounded-full"></div>
            <img 
              src={utLogo} 
              alt="Logo Universitas Terbuka" 
              className="relative z-10 h-10 xl:h-11 w-auto object-contain transition-transform duration-300 hover:scale-105"
              style={{
                filter: "drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 12px rgba(254, 203, 0, 0.5))"
              }}
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-6 my-auto py-10">
          <div className="flex items-center gap-1.5 h-8 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 w-fit shadow-inner">
            <span className="w-1 bg-[#fecb00] rounded-full animate-[pulse_1s_ease-in-out_infinite] h-3"></span>
            <span className="w-1 bg-[#fecb00] rounded-full animate-[pulse_1.4s_ease-in-out_infinite_0.2s] h-5"></span>
            <span className="w-1 bg-[#fecb00] rounded-full animate-[pulse_1.1s_ease-in-out_infinite_0.4s] h-7"></span>
            <span className="w-1 bg-[#fecb00] rounded-full animate-[pulse_1.6s_ease-in-out_infinite_0.1s] h-4"></span>
            <span className="w-1 bg-[#fecb00] rounded-full animate-[pulse_1.3s_ease-in-out_infinite_0.3s] h-6"></span>
            <span className="w-1 bg-[#fecb00] rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.5s] h-3"></span>
          </div>

          <div>
            <h1 className="text-4xl xl:text-5xl font-headline font-black text-white tracking-tight leading-[1.08]">
              SI SORA
            </h1>
            <h2 className="text-2xl xl:text-3xl font-headline font-extrabold text-[#fecb00] mt-3 leading-snug drop-shadow-sm">
              Sistem Informasi Social Opinion Reaction Analytics
            </h2>
          </div>

          <p className="text-slate-200/90 font-body text-base xl:text-lg leading-relaxed max-w-lg font-normal">
            Mendengar dan memahami sentiment publik. Menyatukan suara masyarakat dan mahasiswa dari berbagai platform digital dalam satu analitik terintegrasi.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[40%] flex items-center justify-center p-5 sm:p-10 lg:p-8 xl:p-14 relative bg-[#001f3f] lg:bg-white overflow-hidden z-10">

        <div className="lg:hidden absolute inset-0 z-0 pointer-events-none">
          <img src={bgImage} alt="Background" className="w-full h-full object-cover mix-blend-overlay opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#001f3f]/95 via-[#002b54]/90 to-[#020617]/98"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#003f7a]/30 rounded-full blur-[90px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#fecb00]/20 rounded-full blur-[100px] pointer-events-none"></div>
        </div>

        <div className="w-full max-w-md relative z-10 bg-slate-50 border-2 border-slate-200/90 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-[6px_6px_0px_0px_#003f7a] transition-all hover:shadow-[8px_8px_0px_0px_#003f7a]">
          <div className="lg:hidden mb-5 pb-5 border-b border-slate-100">
            <div className="flex flex-col items-center justify-center pb-3 mb-3 border-b border-slate-100/80">
              <img 
                src={utLogo} 
                alt="Logo Universitas Terbuka" 
                className="h-9 w-auto object-contain" 
              />
            </div>

            <div className="text-center mb-3">
              <h1 className="text-2xl font-headline font-black text-slate-900 leading-tight">
                SI SORA
              </h1>
              <p className="text-xs font-headline font-bold text-[#003f7a] mt-0.5">
                Sistem Informasi Social Opinion Reaction Analytics
              </p>
              <p className="text-slate-500 font-body text-xs mt-1 leading-relaxed">
                Mendengar dan memahami sentiment publik.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center pt-1 pb-1">
              <div className="relative my-1 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#003f7a]/10 rounded-full blur-xl scale-150 pointer-events-none"></div>
                <img 
                  src={logoImage} 
                  alt="Logo SI SORA" 
                  className="relative z-10 h-20 w-auto object-contain drop-shadow-md" 
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl lg:text-3xl font-headline font-black text-slate-900 mb-1.5 tracking-tight">Selamat Datang</h2>
            <p className="text-slate-500 font-body text-sm lg:text-base font-medium">Silakan masuk ke akun Anda.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 font-body font-semibold text-sm rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Nama Pengguna</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 pointer-events-none">
                  <User size={19} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#003f7a] focus:shadow-[3px_3px_0px_0px_#003f7a] transition-all"
                  placeholder="Misal: admin_ut"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Kata Sandi</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 pointer-events-none">
                  <Lock size={19} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#003f7a] focus:shadow-[3px_3px_0px_0px_#003f7a] transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group flex items-center justify-between bg-[#003f7a] text-white border-2 border-[#002b54] p-4 rounded-full font-body font-bold text-lg shadow-[4px_4px_0px_0px_#fecb00] hover:shadow-[6px_6px_0px_0px_#fecb00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#fecb00] transition-all disabled:opacity-50 mt-8"
            >
              <span className="pl-4 tracking-wide">{loading ? "Memverifikasi..." : "Akses Dasbor"}</span>
              <div className="w-10 h-10 bg-[#fecb00] text-[#003f7a] rounded-full flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
