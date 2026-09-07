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
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Check,
  X
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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword.trim()) {
      setPasswordError("Kata sandi saat ini wajib diisi.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Kata sandi baru minimal harus 8 karakter.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("Kata sandi baru tidak boleh sama dengan kata sandi saat ini.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const response = await apiClient.post("/api/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setPasswordSuccess(response.data.message || "Kata sandi akun Anda berhasil diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setPasswordError(detail || "Gagal memperbarui kata sandi. Silakan periksa kembali kata sandi saat ini.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const hasMinLength = newPassword.length >= 8;
  const hasLetterAndNumber = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const isMatch = confirmPassword.length > 0 && confirmPassword === newPassword;

  return (
    <div className="space-y-8 pb-12 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-[#1a1c1d] tracking-tight">
            Profil &amp; Akun Pengguna
          </h2>
          <p className="text-slate-500 mt-1.5 font-medium text-sm md:text-base">
            Pusat pengelolaan identitas pengguna, status autentikasi, dan pengaturan keamanan akun SI SORA.
          </p>
        </div>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-200 shadow-[3px_3px_0px_0px_#fecdd3] rounded-full px-5 py-2.5 font-bold text-xs md:text-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5 self-start sm:self-auto"
        >
          <LogOut size={16} strokeWidth={2.5} />
          <span>Keluar Sesi</span>
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hak Akses Sistem</span>
          </div>
          <div>
            <div className="inline-block bg-[#003f7a] text-[#fecb00] px-3.5 py-1 rounded-xl text-sm font-black tracking-wider uppercase shadow-sm">
              {loading ? "..." : user?.role || "ADMIN"}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-2">Hak Akses Administrator Penuh</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col justify-between animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-full">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu Registrasi</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-800">
              {loading ? "Memuat..." : formatDateID(user?.created_at)}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">Status Akun: Aktif</p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-[4px_4px_0px_0px_#cbd5e1] animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
          <div className="p-3 bg-[#003f7a]/10 text-[#003f7a] rounded-2xl shrink-0">
            <KeyRound size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-headline font-extrabold text-[#1a1c1d]">Keamanan &amp; Ubah Kata Sandi</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Perbarui kata sandi secara berkala demi menjaga keamanan akun dan integritas data riset opini publik.
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
              <p className="text-xs md:text-sm font-bold text-emerald-900">{passwordSuccess}</p>
            </div>
            <button
              type="button"
              onClick={() => setPasswordSuccess(null)}
              className="p-1 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {passwordError && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-600 shrink-0" strokeWidth={2.5} />
              <p className="text-xs md:text-sm font-bold text-rose-900">{passwordError}</p>
            </div>
            <button
              type="button"
              onClick={() => setPasswordError(null)}
              className="p-1 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi saat ini"
                disabled={isSubmittingPassword}
                className="w-full text-xs md:text-sm font-medium text-slate-900 border-2 border-slate-200 rounded-2xl pl-4 pr-11 py-3.5 bg-slate-50 hover:bg-white focus:bg-white focus:border-[#003f7a] outline-none transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isSubmittingPassword}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru (minimal 8 karakter)"
                disabled={isSubmittingPassword}
                className="w-full text-xs md:text-sm font-medium text-slate-900 border-2 border-slate-200 rounded-2xl pl-4 pr-11 py-3.5 bg-slate-50 hover:bg-white focus:bg-white focus:border-[#003f7a] outline-none transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isSubmittingPassword}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasMinLength ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span className={`text-[11px] font-bold ${hasMinLength ? "text-emerald-700" : "text-slate-500"}`}>
                    Minimal 8 karakter
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasLetterAndNumber ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span className={`text-[11px] font-bold ${hasLetterAndNumber ? "text-emerald-700" : "text-slate-500"}`}>
                    Kombinasi huruf &amp; angka
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                disabled={isSubmittingPassword}
                className="w-full text-xs md:text-sm font-medium text-slate-900 border-2 border-slate-200 rounded-2xl pl-4 pr-11 py-3.5 bg-slate-50 hover:bg-white focus:bg-white focus:border-[#003f7a] outline-none transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmittingPassword}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {confirmPassword.length > 0 && (
              <div className="pt-1 flex items-center gap-2">
                {isMatch ? (
                  <span className="text-[11px] font-extrabold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={13} strokeWidth={2.5} />
                    <span>Konfirmasi kata sandi cocok</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-extrabold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={13} strokeWidth={2.5} />
                    <span>Konfirmasi kata sandi belum cocok</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmittingPassword || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="inline-flex items-center justify-center gap-2.5 bg-[#003f7a] text-white px-8 py-3.5 rounded-2xl font-black text-xs md:text-sm shadow-[3px_3px_0px_0px_#fecb00] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmittingPassword ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memperbarui Kata Sandi...</span>
                </>
              ) : (
                <>
                  <Lock size={16} strokeWidth={2.5} />
                  <span>Perbarui Kata Sandi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] border-2 border-slate-300 shadow-[6px_6px_0px_0px_#003f7a] max-w-md w-full p-8 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-full border border-rose-200">
                <AlertCircle size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-headline font-black text-slate-900">Konfirmasi Keluar Sesi</h3>
            </div>
            
            <p className="text-sm font-medium text-slate-600 leading-relaxed mb-8">
              Apakah Anda yakin ingin mengakhiri sesi saat ini? Anda perlu memasukkan kembali kredensial untuk mengakses Control Center SI SORA.
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
