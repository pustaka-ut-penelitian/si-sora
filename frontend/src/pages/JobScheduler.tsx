import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { Loader2, Trash2, Plus, Globe, PlayCircle, Activity, CheckCircle2, AlertTriangle, X } from "lucide-react";

export function JobScheduler() {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [platform, setPlatform] = useState("playstore");
  const [targetId, setTargetId] = useState("");
  const [adding, setAdding] = useState(false);
  const [runningManual, setRunningManual] = useState(false);

  const [toast, setToast] = useState<{type: "success" | "error" | null, message: string}>({ type: null, message: "" });
  const [targetToDelete, setTargetToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (toast.type) {
      const timer = setTimeout(() => setToast({ type: null, message: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  const fetchTargets = async () => {
    try {
      const response = await apiClient.get("/api/targets");
      setTargets(response.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    setAdding(true);
    try {
      await apiClient.post("/api/targets", {
        platform,
        target_id: targetId,
        cron_time: "02:00"
      });
      setTargetId("");
      showToast("success", "Sumber data baru berhasil ditambahkan ke jadwal otomatis.");
      fetchTargets();
    } catch (err) {
      showToast("error", "Gagal menambahkan sumber data baru. Periksa koneksi backend.");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!targetToDelete) return;
    const id = targetToDelete;
    setTargetToDelete(null);
    
    try {
      await apiClient.delete(`/api/targets/${id}`);
      showToast("success", "Sumber data berhasil dihapus dan operasi dihentikan.");
      fetchTargets();
    } catch (err) {
      showToast("error", "Gagal menghapus sumber data.");
    }
  };

  const handleManualRun = async () => {
    if (targets.length === 0) {
      showToast("error", "Belum ada sumber data aktif untuk ditarik.");
      return;
    }
    
    setRunningManual(true);
    try {
      await Promise.all(
        targets.map((t) => 
          apiClient.post("/api/scrape", {
            source: t.platform,
            target_id: t.target_id,
            limit: 50
          })
        )
      );
      showToast("success", "Penarikan data dari semua sumber berhasil diproses oleh Engine AI.");
    } catch (err) {
      showToast("error", "Sebagian atau seluruh proses penarikan data mengalami kendala teknis.");
    } finally {
      setRunningManual(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {toast.type && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-full shadow-lg border-2 ${
            toast.type === "success" 
            ? "bg-[#52b788] text-[#1a1c1d] border-[#1a1c1d]" 
            : "bg-[#f87171] text-white border-white"
          }`}>
            {toast.type === "success" ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <AlertTriangle size={24} strokeWidth={2.5} />}
            <span className="font-bold text-sm">{toast.message}</span>
            <button onClick={() => setToast({type: null, message: ""})} className="ml-4 opacity-70 hover:opacity-100">
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {targetToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1c1d]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border-4 border-[#1a1c1d] shadow-[8px_8px_0px_0px_rgba(26,28,29,1)] animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#f87171]/20 text-[#f87171] p-3 rounded-full">
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-headline font-extrabold text-[#1a1c1d]">Konfirmasi Hapus</h3>
            </div>
            <p className="text-slate-600 font-medium mb-8">
              Sistem tidak akan lagi menarik opini dari target ini secara otomatis. Apakah Anda yakin ingin menghapus sumber data ini?
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setTargetToDelete(null)}
                className="flex-1 py-4 bg-slate-100 text-[#1a1c1d] font-bold rounded-full hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 bg-[#f87171] text-white font-bold rounded-full hover:bg-[#e05252] transition-colors shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-in flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-[#1a1c1d] tracking-tight">Penarikan Data</h2>
          <p className="text-slate-500 mt-2 font-medium">Kelola sumber data dan jadwalkan penarikan opini publik secara otomatis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="col-span-1 lg:col-span-8 bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-[4px_4px_0px_0px_rgba(0,63,122,0.05)] animate-slide-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#003f7a]/10 text-[#003f7a] p-3 rounded-full">
              <Globe size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-headline font-bold text-[#1a1c1d]">Daftar Sumber Data</h3>
          </div>

          <form onSubmit={handleAddTarget} className="flex flex-col md:flex-row gap-4 mb-10 p-6 bg-[#f9f9fa] rounded-3xl border border-slate-100">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="md:w-56 text-sm font-semibold text-slate-700 border-2 border-slate-200 rounded-full px-5 py-4 bg-white focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none transition-all appearance-none cursor-pointer hover:border-[#003f7a]/50"
            >
              <option value="playstore">PlayStore (ID Aplikasi)</option>
              <option value="youtube">YouTube (ID Video)</option>
              <option value="apify">Instagram (Tautan Postingan)</option>
              <option value="tiktok">TikTok (Tautan Video)</option>
            </select>
            
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Masukkan Tautan atau ID Target..."
              className="flex-1 text-sm font-semibold text-[#1a1c1d] border-2 border-slate-200 rounded-full px-6 py-4 bg-white hover:border-[#003f7a]/50 focus:bg-white focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none transition-all"
            />
            
            <button
              type="submit"
              disabled={adding || !targetId.trim()}
              className="inline-flex justify-center items-center gap-2 bg-[#1a1c1d] text-white px-8 py-4 rounded-full font-bold hover:shadow-[4px_4px_0px_0px_rgba(0,63,122,1)] hover:-translate-y-1 active:translate-y-0 active:scale-95 active:shadow-none transition-all disabled:opacity-50"
            >
              {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
              Tambahkan
            </button>
          </form>

          <div className="overflow-hidden border-2 border-slate-100 rounded-[1.5rem]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f9f9fa] text-[11px] font-extrabold text-slate-500 uppercase tracking-widest border-b-2 border-slate-100">
                <tr>
                  <th className="p-5 pl-6">Platform</th>
                  <th className="p-5">Informasi Target</th>
                  <th className="p-5">Jadwal Harian</th>
                  <th className="p-5 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-slate-700">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={`skel-job-${idx}`} className="border-b border-slate-50">
                      <td className="p-5 pl-6"><div className="h-4 w-20 bg-slate-200 rounded-full animate-pulse-neo"></div></td>
                      <td className="p-5"><div className="h-4 w-40 bg-slate-200 rounded-full animate-pulse-neo"></div></td>
                      <td className="p-5"><div className="h-4 w-16 bg-slate-200 rounded-full animate-pulse-neo"></div></td>
                      <td className="p-5 pr-6 text-right flex justify-end"><div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse-neo"></div></td>
                    </tr>
                  ))
                ) : targets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400 font-bold text-base animate-fade-in">Belum ada sumber data yang didaftarkan.</td>
                  </tr>
                ) : (
                  targets.map((t, index) => (
                    <tr 
                      key={t.id} 
                      className="border-b border-slate-50 hover:bg-[#f9f9fa] transition-colors animate-slide-up opacity-0"
                      style={{ animationDelay: `${(index % 10) * 50}ms` }}
                    >
                      <td className="p-5 pl-6 capitalize font-extrabold text-[#1a1c1d]">{t.platform}</td>
                      <td className="p-5 font-mono text-xs font-bold bg-white border border-slate-200 rounded-md px-3 py-1.5 my-3 inline-block cursor-default text-[#003f7a] shadow-sm">{t.target_id}</td>
                      <td className="p-5 text-slate-500">Otomatis ({t.cron_time} WIB)</td>
                      <td className="p-5 pr-6 text-right">
                        <button 
                          onClick={() => setTargetToDelete(t.id)}
                          className="text-[#f87171] bg-white border border-slate-100 shadow-sm hover:bg-[#f87171] hover:border-[#f87171] hover:text-white active:scale-90 p-2.5 rounded-full transition-all"
                          title="Hapus Sumber Data"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#003f7a]/85 backdrop-blur-md rounded-[2rem] p-8 md:p-10 shadow-sm text-white flex flex-col justify-between items-start animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '100ms' }}>
            <div className="bg-[#fecb00] text-[#003f7a] p-3 rounded-full mb-6">
              <PlayCircle size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-headline font-bold mb-3">Tarik Data Sekarang</h3>
            <p className="text-white/80 text-sm font-medium leading-relaxed mb-8">
              Jalankan proses pengumpulan data dari semua sumber di atas secara langsung tanpa menunggu jadwal otomatis.
            </p>
            <button
              onClick={handleManualRun}
              disabled={runningManual}
              className="w-full flex justify-center items-center gap-3 bg-[#fecb00] text-[#003f7a] px-6 py-4 rounded-full font-extrabold text-base hover:bg-white active:scale-95 transition-all disabled:opacity-50"
            >
              {runningManual ? <Loader2 size={20} className="animate-spin" /> : <Activity size={20} strokeWidth={2.5} />}
              {runningManual ? "Sedang Mengumpulkan..." : "Mulai Pengumpulan"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
