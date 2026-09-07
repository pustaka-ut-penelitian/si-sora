import { useState } from "react";
import { apiClient } from "../api/client";
import { DownloadCloud, Play, Video, Camera, AlertCircle, Loader2 } from "lucide-react";

export function DataScraper() {
  const [source, setSource] = useState<"playstore" | "youtube" | "instagram" | "tiktok">("playstore");
  const [targetId, setTargetId] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim()) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await apiClient.post("/api/scrape", {
        source,
        target_id: targetId,
        limit,
      });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Gagal menghubungi mesin Scraper");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="mb-10 animate-fade-in">
        <h2 className="text-4xl font-headline font-extrabold text-slate-950 tracking-tight">Data Scraper</h2>
        <p className="text-slate-500 mt-2 font-medium">Tarik komentar mentah dari berbagai sumber media sosial Universitas Terbuka.</p>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 lg:p-10 shadow-soft max-w-4xl animate-slide-up stagger-1 opacity-0">
        <form onSubmit={handleScrape} className="space-y-8">
          
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Sumber Data</label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setSource("playstore")}
                className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all duration-300 active:scale-95 ${
                  source === "playstore"
                    ? "border-primary bg-primary/5 text-primary shadow-neo -translate-y-1"
                    : "border-slate-200 hover:border-primary/50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Play size={28} className="mb-2" strokeWidth={source === "playstore" ? 2.5 : 2} />
                <span className="text-sm font-extrabold">Google Play</span>
              </button>

              <button
                type="button"
                onClick={() => setSource("youtube")}
                className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all duration-300 active:scale-95 ${
                  source === "youtube"
                    ? "border-error bg-error/5 text-error shadow-neo -translate-y-1"
                    : "border-slate-200 hover:border-error/50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Video size={28} className="mb-2" strokeWidth={source === "youtube" ? 2.5 : 2} />
                <span className="text-sm font-extrabold">YouTube</span>
              </button>

              <button
                type="button"
                onClick={() => setSource("instagram")}
                className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all duration-300 active:scale-95 ${
                  source === "instagram"
                    ? "border-pink-500 bg-pink-500/5 text-pink-500 shadow-neo -translate-y-1"
                    : "border-slate-200 hover:border-pink-500/50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Camera size={28} className="mb-2" strokeWidth={source === "instagram" ? 2.5 : 2} />
                <span className="text-sm font-extrabold">Instagram</span>
              </button>

              <button
                type="button"
                onClick={() => setSource("tiktok")}
                className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all duration-300 active:scale-95 ${
                  source === "tiktok"
                    ? "border-slate-900 bg-slate-900/5 text-slate-900 shadow-neo -translate-y-1"
                    : "border-slate-200 hover:border-slate-900/50 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Video size={28} className="mb-2" strokeWidth={source === "tiktok" ? 2.5 : 2} />
                <span className="text-sm font-extrabold">TikTok</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="targetId" className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">
              {source === "playstore" && "App ID (contoh: id.ac.ut.sia)"}
              {source === "youtube" && "URL Video YouTube (contoh: https://www.youtube.com/watch?v=...)"}
              {source === "instagram" && "URL Postingan Instagram (contoh: https://www.instagram.com/p/...)"}
              {source === "tiktok" && "URL Video TikTok (contoh: https://www.tiktok.com/@.../video/...)"}
            </label>
            <input
              id="targetId"
              type="text"
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-body text-base font-medium text-slate-950 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-colors"
              placeholder="Masukkan ID target atau URL..."
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="limit" className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">
              Batas Tarikan Data
            </label>
            <input
              id="limit"
              type="number"
              min="5"
              max="1000"
              className="w-full md:w-48 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-body text-base font-bold text-slate-950 focus:outline-none focus:border-primary focus:bg-white transition-colors"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !targetId.trim()}
            className="flex items-center justify-center w-full md:w-auto gap-3 bg-primary text-white px-10 py-4 rounded-full font-extrabold hover:shadow-neo hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <DownloadCloud size={24} strokeWidth={2.5} />}
            {loading ? "Menjalankan Crawler..." : "Eksekusi Scraper"}
          </button>

        </form>

        {loading && (
          <div className="mt-8 border-2 border-slate-100 rounded-3xl p-6 bg-slate-50 animate-fade-in flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <div className="h-12 w-12 bg-slate-200 rounded-full animate-pulse-neo"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 bg-slate-200 rounded-full animate-pulse-neo"></div>
                <div className="h-3 w-1/2 bg-slate-200 rounded-full animate-pulse-neo"></div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-2 w-full bg-slate-200 rounded-full animate-pulse-neo"></div>
              <div className="h-2 w-full bg-slate-200 rounded-full animate-pulse-neo"></div>
              <div className="h-2 w-3/4 bg-slate-200 rounded-full animate-pulse-neo"></div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="mt-8 p-6 bg-error/10 border-2 border-error/20 rounded-3xl flex items-start gap-3 animate-fade-in">
            <AlertCircle size={24} className="text-error flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-error font-bold text-base">{error}</p>
          </div>
        )}

        {message && !loading && (
          <div className="mt-8 p-6 bg-primary/10 border-2 border-primary/20 rounded-3xl animate-fade-in">
            <p className="text-primary font-bold text-base">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
