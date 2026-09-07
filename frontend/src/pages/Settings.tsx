import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  KeyRound, 
  ShieldAlert, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Users, 
  UserPlus, 
  Activity, 
  Loader2, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  AlertCircle,
  X,
  ArrowRight
} from "lucide-react";
import { apiClient } from "../api/client";

interface SystemUser {
  id: string;
  username: string;
  role: string;
  created_at?: string;
}

export function Settings() {
  const navigate = useNavigate();
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<"api" | "users">("api");

  const [crawlerKey, setCrawlerKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [showCrawlerKey, setShowCrawlerKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [copiedCrawler, setCopiedCrawler] = useState(false);
  const [copiedGroq, setCopiedGroq] = useState(false);
  
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState<{
    status: "success" | "error";
    message: string;
    latency_ms?: number;
    model?: string;
  } | null>(null);

  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("VIEWER");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submittingNewUser, setSubmittingNewUser] = useState(false);

  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editRole, setEditRole] = useState("VIEWER");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [submittingEditUser, setSubmittingEditUser] = useState(false);

  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [submittingDeleteUser, setSubmittingDeleteUser] = useState(false);

  useEffect(() => {
    const checkRoleAndLoad = async () => {
      try {
        const response = await apiClient.get("/api/auth/me");
        const userData = response.data.data;
        setCurrentUserRole(userData.role);
        setCurrentUserId(userData.id);

        if (userData.role === "ADMIN") {
          loadSettings();
          loadUsers();
        }
      } catch (err) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserRole(payload.role || "VIEWER");
            setCurrentUserId(payload.sub || null);
            if (payload.role === "ADMIN") {
              loadSettings();
              loadUsers();
            }
          } catch (e) {
            setCurrentUserRole("VIEWER");
          }
        } else {
          setCurrentUserRole("VIEWER");
        }
      } finally {
        setCheckingAuth(false);
      }
    };

    checkRoleAndLoad();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get("/api/system/settings");
      if (response.data?.data) {
        setCrawlerKey(response.data.data.crawler_api_token || "");
        setGroqKey(response.data.data.groq_api_key || "");
      }
    } catch (err) {
      setSettingsError("Gagal mengambil konfigurasi sistem dari server.");
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await apiClient.get("/api/users");
      if (response.data?.data) {
        setUsersList(response.data.data);
      }
    } catch (err) {
      setUserError("Gagal memuat daftar pengguna sistem.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSavedSuccess(false);
    setSettingsError(null);

    try {
      await apiClient.post("/api/system/settings", {
        crawler_api_token: crawlerKey,
        groq_api_key: groqKey
      });
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Gagal menyimpan konfigurasi sistem.";
      setSettingsError(msg);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestGroq = async () => {
    setTestingGroq(true);
    setGroqTestResult(null);

    try {
      const response = await apiClient.post("/api/system/test-groq", {
        api_key: groqKey.trim() || undefined
      });
      setGroqTestResult(response.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Gagal melakukan uji koneksi.";
      setGroqTestResult({
        status: "error",
        message: msg
      });
    } finally {
      setTestingGroq(false);
    }
  };

  const handleCopy = (text: string, type: "crawler" | "groq") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "crawler") {
      setCopiedCrawler(true);
      setTimeout(() => setCopiedCrawler(false), 2000);
    } else {
      setCopiedGroq(true);
      setTimeout(() => setCopiedGroq(false), 2000);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim().length < 3) {
      setUserError("Nama pengguna minimal 3 karakter.");
      return;
    }
    if (newPassword.length < 8) {
      setUserError("Kata sandi pengguna minimal 8 karakter.");
      return;
    }

    setSubmittingNewUser(true);
    setUserError(null);
    setUserSuccess(null);

    try {
      const response = await apiClient.post("/api/users", {
        username: newUsername.trim(),
        password: newPassword,
        role: newRole
      });
      setUserSuccess(response.data?.message || "Pengguna baru berhasil ditambahkan.");
      setShowAddUserModal(false);
      setNewUsername("");
      setNewPassword("");
      setNewRole("VIEWER");
      loadUsers();
      setTimeout(() => setUserSuccess(null), 4000);
    } catch (err: any) {
      setUserError(err.response?.data?.detail || "Gagal menambahkan akun pengguna.");
    } finally {
      setSubmittingNewUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editPassword && editPassword.length < 8) {
      setUserError("Kata sandi baru minimal 8 karakter.");
      return;
    }

    setSubmittingEditUser(true);
    setUserError(null);
    setUserSuccess(null);

    try {
      const payload: { role?: string; password?: string } = {};
      if (editRole !== editingUser.role) {
        payload.role = editRole;
      }
      if (editPassword.trim()) {
        payload.password = editPassword;
      }

      const response = await apiClient.patch(`/api/users/${editingUser.id}`, payload);
      setUserSuccess(response.data?.message || "Data akun berhasil diperbarui.");
      setEditingUser(null);
      setEditPassword("");
      loadUsers();
      setTimeout(() => setUserSuccess(null), 4000);
    } catch (err: any) {
      setUserError(err.response?.data?.detail || "Gagal memperbarui data pengguna.");
    } finally {
      setSubmittingEditUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setSubmittingDeleteUser(true);
    setUserError(null);
    setUserSuccess(null);

    try {
      const response = await apiClient.delete(`/api/users/${deletingUser.id}`);
      setUserSuccess(response.data?.message || "Pengguna berhasil dihapus.");
      setDeletingUser(null);
      loadUsers();
      setTimeout(() => setUserSuccess(null), 4000);
    } catch (err: any) {
      setUserError(err.response?.data?.detail || "Gagal menghapus pengguna.");
    } finally {
      setSubmittingDeleteUser(false);
    }
  };

  const formatDateID = (isoString?: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-md border-2 border-slate-200 p-8 rounded-3xl shadow-[4px_4px_0px_0px_#cbd5e1]">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm font-bold text-slate-600 tracking-wide">Memverifikasi wewenang akses...</p>
        </div>
      </div>
    );
  }

  if (currentUserRole !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto pt-8 pb-16 animate-fade-in animate-slide-up">
        <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-[6px_6px_0px_0px_#003f7a] text-center">
          <div className="w-20 h-20 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShieldAlert size={40} strokeWidth={2.5} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider mb-4">
            <span>Akses Ditolak &bull; 403 Forbidden</span>
          </div>

          <h2 className="text-3xl font-headline font-extrabold text-slate-950 tracking-tight mb-3">
            Halaman Khusus Administrator
          </h2>

          <p className="text-slate-600 font-medium leading-relaxed max-w-lg mx-auto mb-8">
            Menu pengaturan sistem dan integrasi API dikunci ketat untuk wewenang <strong className="text-slate-900">ADMIN</strong>. Akun Anda saat ini tercatat dengan wewenang <strong className="text-primary">{currentUserRole || "VIEWER"}</strong> yang bersifat hanya-baca.
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-3 bg-[#003f7a] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#002b54] shadow-[3px_3px_0px_0px_#fecb00] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
            >
              <span>Kembali ke Dasbor Utama</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-slate-950 tracking-tight">
              Pusat Kendali Sistem
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#003f7a]/10 text-[#003f7a] border border-[#003f7a]/20">
              <ShieldCheck size={14} strokeWidth={2.5} />
              <span>Akses Penuh Administrator</span>
            </span>
          </div>
          <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">
            Pengaturan kredensial integrasi API, parameter sistem, dan tata kelola akun pengguna SI SORA.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-full border-2 border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab("api")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-extrabold transition-all ${
              activeTab === "api"
                ? "bg-[#003f7a] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound size={16} strokeWidth={2.5} />
            <span>Integrasi API</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-extrabold transition-all ${
              activeTab === "users"
                ? "bg-[#003f7a] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users size={16} strokeWidth={2.5} />
            <span>Manajemen Pengguna</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20">
              {usersList.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "api" && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[4px_4px_0px_0px_#cbd5e1]">
            <div className="bg-amber-50 border-2 border-amber-200/80 p-4 md:p-5 rounded-2xl flex items-start gap-3.5 mb-8">
              <ShieldAlert className="text-amber-700 shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
              <div className="text-xs md:text-sm text-amber-900 leading-relaxed font-medium">
                <strong className="font-bold">Keamanan Kredensial:</strong> Jaga kerahasiaan kunci API ini. Kredensial ini memberi mesin SI SORA otorisasi langsung ke layanan pihak ketiga untuk proses crawling dan inferensi AI.
              </div>
            </div>

            {settingsSavedSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
                <span>Konfigurasi integrasi API berhasil disimpan dan diterapkan ke sistem.</span>
              </div>
            )}

            {settingsError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-bold animate-in fade-in">
                <AlertCircle size={20} className="text-rose-600 shrink-0" strokeWidth={2.5} />
                <span>{settingsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-800">
                    Crawler API Token (Instagram &amp; TikTok)
                  </label>
                  <span className="text-xs font-semibold text-slate-400">Penyedia Layanan Eksternal</span>
                </div>
                
                <div className="relative flex items-center">
                  <input
                    type={showCrawlerKey ? "text" : "password"}
                    value={crawlerKey}
                    onChange={(e) => setCrawlerKey(e.target.value)}
                    placeholder="Masukkan token crawler eksternal..."
                    className="w-full text-sm md:text-base font-mono font-semibold text-slate-900 border-2 border-slate-200 rounded-2xl pl-5 pr-24 py-3.5 bg-white/60 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-[#003f7a] outline-none transition-all"
                  />
                  <div className="absolute right-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(crawlerKey, "crawler")}
                      title="Salin Token"
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      {copiedCrawler ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCrawlerKey(!showCrawlerKey)}
                      title={showCrawlerKey ? "Sembunyikan Token" : "Tampilkan Token"}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      {showCrawlerKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium pl-1">
                  Digunakan oleh antrean penarikan data Instagram dan TikTok untuk mengakses postingan publik.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-bold text-slate-800">
                      Groq LLM API Key
                    </label>
                    {groqKey.startsWith("gsk_") && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check size={12} strokeWidth={3} />
                        Format Valid (gsk_)
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Inference Engine (GPT-OSS-20B)</span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showGroqKey ? "text" : "password"}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_********************************"
                    className="w-full text-sm md:text-base font-mono font-semibold text-slate-900 border-2 border-slate-200 rounded-2xl pl-5 pr-24 py-3.5 bg-white/60 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-[#003f7a] outline-none transition-all"
                  />
                  <div className="absolute right-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(groqKey, "groq")}
                      title="Salin Kunci"
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      {copiedGroq ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      title={showGroqKey ? "Sembunyikan Kunci" : "Tampilkan Kunci"}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      {showGroqKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pl-1">
                  <p className="text-xs text-slate-500 font-medium">
                    Kunci akses API dari konsol Groq Cloud untuk inferensi sentimen cerdas bahasa Indonesia.
                  </p>
                  
                  <button
                    type="button"
                    onClick={handleTestGroq}
                    disabled={testingGroq || !groqKey}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 hover:bg-[#003f7a] hover:text-white border border-slate-300 transition-all disabled:opacity-50"
                  >
                    {testingGroq ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Activity size={13} strokeWidth={2.5} />
                    )}
                    <span>{testingGroq ? "Menguji Koneksi..." : "Uji Koneksi Groq AI"}</span>
                  </button>
                </div>

                {groqTestResult && (
                  <div className={`mt-3 p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in ${
                    groqTestResult.status === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {groqTestResult.status === "success" ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
                      ) : (
                        <AlertCircle size={16} className="text-rose-600 shrink-0" strokeWidth={2.5} />
                      )}
                      <span>{groqTestResult.message}</span>
                    </div>
                    {groqTestResult.latency_ms && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-950 font-black shrink-0">
                        {groqTestResult.latency_ms} ms &bull; {groqTestResult.model || "Ready"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex justify-center items-center gap-3 bg-[#003f7a] text-white px-8 py-3.5 rounded-full font-bold shadow-[3px_3px_0px_0px_#fecb00] hover:bg-[#002b54] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 size={18} className="animate-spin" /> : null}
                  <span>{savingSettings ? "Menyimpan Perubahan..." : "Simpan Konfigurasi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[4px_4px_0px_0px_#cbd5e1]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-headline font-bold text-slate-950">
                  Daftar Akun Pengguna
                </h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                  Kelola akun pengguna, wewenang akses, dan atur ulang kata sandi operasional.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserError(null);
                  setShowAddUserModal(true);
                }}
                className="inline-flex items-center gap-2 bg-[#003f7a] text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-bold shadow-[2px_2px_0px_0px_#fecb00] hover:bg-[#002b54] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all self-start sm:self-auto"
              >
                <UserPlus size={16} strokeWidth={2.5} />
                <span>Tambah Pengguna</span>
              </button>
            </div>

            {userSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
                <span>{userSuccess}</span>
              </div>
            )}

            {userError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-bold animate-in fade-in">
                <AlertCircle size={20} className="text-rose-600 shrink-0" strokeWidth={2.5} />
                <span>{userError}</span>
              </div>
            )}

            {loadingUsers ? (
              <div className="py-16 text-center">
                <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500">Memuat data pengguna...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 text-xs font-black uppercase tracking-wider border-b-2 border-slate-200">
                      <th className="py-3.5 px-4 md:px-6">Pengguna</th>
                      <th className="py-3.5 px-4">Tingkat Wewenang</th>
                      <th className="py-3.5 px-4 hidden sm:table-cell">Waktu Terdaftar</th>
                      <th className="py-3.5 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {usersList.map((u) => {
                      const isMe = u.id === currentUserId || u.username === "admin";
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 md:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#003f7a]/10 text-[#003f7a] font-extrabold flex items-center justify-center text-sm border border-[#003f7a]/20">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{u.username}</span>
                                  {isMe && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fecb00] text-[#002b54]">
                                      Akun Anda
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {u.role === "ADMIN" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#003f7a] text-white">
                                <ShieldCheck size={13} strokeWidth={2.5} />
                                <span>ADMIN</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                                <span>VIEWER</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 hidden sm:table-cell text-slate-500 font-medium text-xs">
                            {formatDateID(u.created_at)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setUserError(null);
                                  setEditingUser(u);
                                  setEditRole(u.role);
                                  setEditPassword("");
                                }}
                                title="Ubah Peran / Reset Sandi"
                                className="p-2 text-slate-600 hover:text-[#003f7a] hover:bg-slate-100 rounded-xl transition-all"
                              >
                                <Edit3 size={17} />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  setUserError(null);
                                  setDeletingUser(u);
                                }}
                                disabled={isMe}
                                title={isMe ? "Anda tidak dapat menghapus akun Anda sendiri" : "Hapus Akun Pengguna"}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_#003f7a] animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <UserPlus size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-slate-950">Tambah Pengguna Baru</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daftarkan akun operator atau pengelola SI SORA.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Pengguna (Username)
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="contoh: perpustakaan_ut"
                  className="w-full text-sm font-semibold text-slate-900 border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:border-[#003f7a] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi Akun (Min. 8 Karakter)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter..."
                    className="w-full text-sm font-semibold text-slate-900 border-2 border-slate-200 rounded-xl pl-4 pr-11 py-2.5 bg-slate-50 focus:bg-white focus:border-[#003f7a] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tingkat Wewenang (Role)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRole("VIEWER")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      newRole === "VIEWER"
                        ? "border-[#003f7a] bg-[#003f7a]/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">VIEWER</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Akses baca dasbor dan ekspor data survei.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("ADMIN")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      newRole === "ADMIN"
                        ? "border-[#003f7a] bg-[#003f7a]/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">ADMIN</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Akses penuh manajemen sistem dan konfigurasi API.
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingNewUser}
                  className="inline-flex items-center gap-2 bg-[#003f7a] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-[2px_2px_0px_0px_#fecb00] hover:bg-[#002b54] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                >
                  {submittingNewUser ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>{submittingNewUser ? "Mendaftarkan..." : "Daftarkan Pengguna"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_#003f7a] animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Edit3 size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-slate-950">Ubah Data Pengguna</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pengguna: <strong className="text-slate-900 font-bold">{editingUser.username}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tingkat Wewenang (Role)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditRole("VIEWER")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      editRole === "VIEWER"
                        ? "border-[#003f7a] bg-[#003f7a]/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">VIEWER</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Hanya dapat membaca data analitik.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole("ADMIN")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      editRole === "ADMIN"
                        ? "border-[#003f7a] bg-[#003f7a]/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">ADMIN</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Wewenang penuh administrator.
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reset Kata Sandi (Opsional)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah sandi"
                    className="w-full text-sm font-semibold text-slate-900 border-2 border-slate-200 rounded-xl pl-4 pr-11 py-2.5 bg-slate-50 focus:bg-white focus:border-[#003f7a] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700"
                  >
                    {showEditPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-1">
                  Isi minimal 8 karakter untuk mereset kata sandi akun pengguna ini.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEditUser}
                  className="inline-flex items-center gap-2 bg-[#003f7a] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-[2px_2px_0px_0px_#fecb00] hover:bg-[#002b54] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                >
                  {submittingEditUser ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>{submittingEditUser ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_#e11d48] animate-in zoom-in-95">
            <div className="w-14 h-14 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mb-5">
              <Trash2 size={28} strokeWidth={2.5} />
            </div>

            <h3 className="text-xl font-headline font-bold text-slate-950 mb-2">
              Hapus Akun Pengguna?
            </h3>

            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
              Akun <strong className="text-slate-950 font-bold">{deletingUser.username}</strong> ({deletingUser.role}) akan dihapus secara permanen dari sistem. Pengguna ini tidak akan dapat login kembali.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={submittingDeleteUser}
                className="inline-flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-[2px_2px_0px_0px_#9f1239] hover:bg-rose-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {submittingDeleteUser ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>{submittingDeleteUser ? "Menghapus..." : "Hapus Akun"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
