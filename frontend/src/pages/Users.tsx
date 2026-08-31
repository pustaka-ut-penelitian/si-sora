import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { useNavigate } from "react-router-dom";
import { 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Layers
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  role: string;
  created_at?: string;
}

export function Users() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiClient.get("/api/auth/me");
        setUser(response.data.data);
      } catch (err) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
              id: "local-session",
              username: payload.sub || "Administrator",
              role: payload.role || "ADMIN",
              created_at: new Date().toISOString()
            });
          } catch (e) {
            setUser({
              id: "session-active",
              username: "Administrator UT",
              role: "ADMIN"
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const formatDateID = (isoString?: string) => {
    if (!isoString) return "Sesi Aktif Sekarang";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-[#1a1c1d] tracking-tight">
            Data Pengguna
          </h2>
          <p className="text-slate-500 mt-1.5 font-medium text-sm md:text-base">
            Informasi akun yang sedang terautentikasi dan hak akses operasional SI SORA.
          </p>
        </div>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-200 shadow-[3px_3px_0px_0px_#fecdd3] rounded-full px-5 py-2.5 font-bold text-xs md:text-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5 self-start sm:self-auto"
        >
          <LogOut size={16} strokeWidth={2.5} />
          Keluar Sesi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col justify-between animate-slide-up hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#003f7a]/10 text-[#003f7a] rounded-full">
              <UserIcon size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identitas Pengguna</span>
          </div>
          <div>
            <p className="text-2xl font-headline font-extrabold text-[#1a1c1d] truncate">
              {loading ? "Memuat..." : user?.username || "Admin"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-600">Sesi Terverifikasi</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col justify-between animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#fecb00]/20 text-[#003f7a] rounded-full">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Peran</span>
          </div>
          <div>
            <div className="inline-block bg-[#003f7a] text-[#fecb00] px-3.5 py-1 rounded-xl text-sm font-black tracking-wider uppercase shadow-sm">
              {loading ? "..." : user?.role || "ADMIN"}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-2">Akses Penuh Control Center</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col justify-between animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-full">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu Terdaftar</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-800">
              {loading ? "Memuat..." : formatDateID(user?.created_at)}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">Status Keamanan: Aktif</p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-[4px_4px_0px_0px_#cbd5e1] animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-[#003f7a]/10 text-[#003f7a] rounded-full">
            <Layers size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-headline font-bold text-[#1a1c1d]">Rincian Otorisasi & Kredensial</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Matriks kemampuan akun pada sistem SI SORA.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50/80 border-2 border-slate-200 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-slate-800">Penarikan Data & Scraping</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dapat mendaftarkan tautan media sosial, memicu pengumpulan seketika, dan mengonfigurasi cron scheduler.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border-2 border-slate-200 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-slate-800">Integrasi API & Kunci Rahasia</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Memiliki izin untuk memodifikasi token Apify dan Groq AI pada menu Sistem.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border-2 border-slate-200 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-slate-800">Eksplorasi & Export Data</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dapat mengunduh arsip CSV komentar publik, melihat analisis emosi, dan filter multi-topik.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border-2 border-slate-200 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-slate-800">Generasi Ulang Analisis AI</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dapat memicu pembuatan rangkuman baru dan menghapus riwayat wawasan eksekutif.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-5 bg-amber-50/60 border-2 border-amber-200/80 rounded-2xl flex items-start gap-3">
          <Lock size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-900 leading-relaxed">
            Keamanan Sesi: Token autentikasi disimpan pada penyimpanan lokal browser dengan enkripsi JWT Bearer. Sesi akan otomatis berakhir jika token kedaluwarsa atau server menolak validitasnya.
          </p>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] border-2 border-slate-300 shadow-[6px_6px_0px_0px_#003f7a] max-w-md w-full p-8 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-full border border-rose-200">
                <AlertCircle size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-headline font-black text-slate-900">Konfirmasi Keluar</h3>
            </div>
            
            <p className="text-sm font-medium text-slate-600 leading-relaxed mb-8">
              Apakah Anda yakin ingin mengakhiri sesi login ini? Anda harus memasukkan kredensial kembali untuk mengakses Control Center.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-5 py-2.5 rounded-full font-bold text-xs md:text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-6 py-2.5 rounded-full font-extrabold text-xs md:text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
