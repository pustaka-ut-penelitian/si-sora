import { useState } from "react";
import { apiClient } from "../api/client";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";

import bgImage from "../assets/bg.jpg";
import logoImage from "../assets/logo.png";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex bg-background font-body">
      <div className="hidden lg:flex w-1/2 bg-slate-950 text-white flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={bgImage} alt="Background" className="w-full h-full object-cover mix-blend-overlay opacity-50" />
          <div className="absolute inset-0 bg-slate-950/70"></div>
        </div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 z-0"></div>
        
        <div className="absolute top-10 left-10 lg:top-14 lg:left-14">
          <img src={logoImage} alt="SI SORA Logo" className="h-16 lg:h-20 w-auto drop-shadow-lg" />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl lg:text-5xl font-headline font-black text-white leading-[1.1] tracking-tight">
            SI SORA<br />
            <span className="text-primary block mt-2 text-3xl lg:text-4xl opacity-90 drop-shadow-md">Opinion Reaction Analytics.</span>
          </h1>
          <p className="text-white/80 font-body text-base lg:text-lg mt-2 max-w-sm leading-relaxed font-medium">
            Mendengar dan memahami sentiment publik. Menyatukan suara masyarakat dari berbagai platform digital.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative bg-slate-50 overflow-hidden">

        <div className="absolute inset-0 z-0 lg:hidden">
          <img src={bgImage} alt="Background Mobile" className="w-full h-full object-cover mix-blend-overlay opacity-40" />
          <div className="absolute inset-0 bg-slate-950/70"></div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 hidden lg:block z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 hidden lg:block z-0 pointer-events-none"></div>

        <div className="absolute inset-0 z-0 opacity-[0.02] hidden lg:block" style={{ backgroundImage: 'radial-gradient(#0f172a 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,30,80,0.08)]">
          <div className="lg:hidden mb-8 border-b border-slate-100 pb-6">
            <img src={logoImage} alt="SI SORA Logo" className="h-10 sm:h-12 w-auto drop-shadow-md mb-4" />
            <h1 className="text-2xl font-headline font-extrabold text-slate-900 leading-tight">
              SI <span className="text-primary">SORA.</span>
            </h1>
            <p className="text-slate-500 font-body text-sm mt-1">Mendengar dan memahami sentiment publik.</p>
          </div>

          <div className="mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-headline font-bold text-slate-900 mb-2 tracking-tight">Selamat Datang</h2>
            <p className="text-slate-500 font-body text-base font-medium">Silakan masuk ke akun Anda.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-error/10 border-l-4 border-error text-error font-body font-medium rounded-r-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-2">Nama Pengguna</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                placeholder="Misal: admin_ut"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-2">Kata Sandi</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group flex items-center justify-between bg-slate-900 text-white p-4 rounded-full font-body font-semibold text-lg hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 mt-8"
            >
              <span className="pl-5">{loading ? "Memverifikasi..." : "Akses Dasbor"}</span>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 transition-colors">
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} strokeWidth={2.5} />}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
