import { useState } from "react";
import { Loader2, KeyRound, ShieldAlert, CheckCircle2 } from "lucide-react";

export function Settings() {
  const [apifyKey, setApifyKey] = useState("apify_api_****************");
  const [groqKey, setGroqKey] = useState("gsk_********************");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Gagal menyimpan konfigurasi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-4xl">
      <div className="mb-10">
        <h2 className="text-4xl font-headline font-extrabold text-slate-950 tracking-tight">System Config</h2>
        <p className="text-slate-500 mt-2 font-medium">Pengaturan kredensial keamanan dan *API Keys* pihak ketiga.</p>
      </div>

      <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-8 lg:p-10 shadow-[4px_4px_0px_0px_#cbd5e1] animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 text-primary p-3 rounded-full">
            <KeyRound size={24} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-headline font-bold text-slate-950">Integrasi API</h3>
        </div>

        <div className="bg-error/10 border-2 border-error/20 p-5 rounded-2xl flex items-start gap-3 mb-8">
          <ShieldAlert className="text-error shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
          <p className="text-sm font-semibold text-error leading-relaxed">
            Perhatian: Jaga kerahasiaan kunci API ini. Kredensial ini memberi SI SORA akses langsung ke layanan pihak ketiga yang mungkin menagih biaya penggunaan.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 ml-2">Apify API Token</label>
            <input
              type="password"
              value={apifyKey}
              onChange={(e) => setApifyKey(e.target.value)}
              className="w-full text-base font-semibold text-slate-900 border-2 border-slate-200 rounded-2xl px-6 py-4 bg-white/40 focus:bg-white/80 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              placeholder="Masukkan Apify API Token"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 ml-2">Groq LLM API Key</label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              className="w-full text-base font-semibold text-slate-900 border-2 border-slate-200 rounded-2xl px-6 py-4 bg-white/40 focus:bg-white/80 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              placeholder="Masukkan Groq API Key"
            />
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center items-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-full font-bold hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
            </button>
            
            {saved && (
              <div className="flex items-center gap-2 text-primary font-bold animate-in fade-in slide-in-from-left-2">
                <CheckCircle2 size={20} strokeWidth={2.5} />
                <span>Berhasil disimpan</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
