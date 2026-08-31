import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { apiClient } from "../api/client";
import { 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Sparkles, 
  MessageSquare, 
  ExternalLink, 
  Smile, 
  Frown, 
  Meh, 
  User, 
  Calendar, 
  Tag, 
  RotateCcw,
  Eye,
  SlidersHorizontal
} from "lucide-react";

interface CommentItem {
  id: string;
  text_content: string;
  platform: string;
  author_name?: string;
  source_url?: string;
  posted_at?: string;
  sentiment?: string;
  emotion?: string;
  topic_tags?: string[];
  ai_reasoning?: string;
}

export function DataExplorer() {
  const [data, setData] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(15);
  const [total, setTotal] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("");
  const [filterEmotion, setFilterEmotion] = useState("");

  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedComment) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedComment]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("size", size.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filterPlatform) params.append("platform", filterPlatform);
      if (filterSentiment) params.append("sentiment", filterSentiment);
      if (filterEmotion) params.append("emotion", filterEmotion);

      const response = await apiClient.get(`/api/comments?${params.toString()}`);
      setData(response.data.data);
      setTotal(response.data.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch, filterPlatform, filterSentiment, filterEmotion]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setFilterPlatform("");
    setFilterSentiment("");
    setFilterEmotion("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm || filterPlatform || filterSentiment || filterEmotion);

  const handleExportCsv = () => {
    if (data.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Platform,Penulis,Sentimen,Emosi,Tanggal,Komentar,Topik,Penalaran_AI,Sumber_URL\n";
    
    data.forEach(item => {
      const escape = (text?: string | null) => {
        if (!text) return '""';
        return `"${text.replace(/"/g, '""')}"`;
      };
      
      const topics = item.topic_tags ? item.topic_tags.join("; ") : "";
      
      const row = [
        item.id,
        item.platform,
        escape(item.author_name || "anon"),
        item.sentiment || "",
        item.emotion || "",
        item.posted_at || "",
        escape(item.text_content),
        escape(topics),
        escape(item.ai_reasoning || ""),
        escape(item.source_url || "")
      ].join(",");
      
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sisora_eksplorasi_p${page}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / size);

  const posCount = data.filter(d => d.sentiment?.toLowerCase() === 'positif').length;
  const negCount = data.filter(d => d.sentiment?.toLowerCase() === 'negatif').length;
  const neuCount = data.filter(d => d.sentiment?.toLowerCase() === 'netral').length;

  const formatDateID = (isoString?: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-[#1a1c1d] tracking-tight">
            Eksplorasi Data
          </h2>
          <p className="text-slate-500 mt-1.5 font-medium text-sm md:text-base">
            Pusat penelusuran, pencarian kata kunci, dan audit penalaran AI terhadap opini publik.
          </p>
        </div>
        
        <button 
          onClick={handleExportCsv}
          disabled={data.length === 0 || loading}
          className="flex items-center gap-2.5 bg-[#fecb00] hover:bg-[#ebd500] text-[#003f7a] border-2 border-[#003f7a] shadow-[4px_4px_0px_0px_#003f7a] px-6 py-3 rounded-full font-extrabold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#003f7a] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={18} strokeWidth={2.5} />
          Unduh CSV ({data.length} Baris)
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#cbd5e1] flex items-center gap-3">
          <div className="p-2.5 bg-[#003f7a]/10 text-[#003f7a] rounded-xl shrink-0">
            <MessageSquare size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Hasil</p>
            <p className="text-xl font-extrabold text-[#1a1c1d] truncate">{total}</p>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#cbd5e1] flex items-center gap-3">
          <div className="p-2.5 bg-[#52b788]/10 text-[#52b788] rounded-xl shrink-0">
            <Smile size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Positif (Halaman ini)</p>
            <p className="text-xl font-extrabold text-[#52b788] truncate">{posCount}</p>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#cbd5e1] flex items-center gap-3">
          <div className="p-2.5 bg-[#f87171]/10 text-[#f87171] rounded-xl shrink-0">
            <Frown size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Negatif (Halaman ini)</p>
            <p className="text-xl font-extrabold text-[#f87171] truncate">{negCount}</p>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#cbd5e1] flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl shrink-0">
            <Meh size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Netral (Halaman ini)</p>
            <p className="text-xl font-extrabold text-slate-600 truncate">{neuCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] space-y-4 animate-slide-up">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2.5} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik kata kunci untuk mencari isi komentar..."
              className="w-full text-sm font-semibold text-slate-800 border-2 border-slate-200 rounded-full pl-11 pr-10 py-3 bg-white/70 focus:bg-white focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap w-full md:w-auto gap-3">
            <div className="relative flex-1 sm:w-44">
              <select 
                value={filterPlatform}
                onChange={(e) => { setFilterPlatform(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold text-slate-700 border-2 border-slate-200 rounded-full px-4 py-3 bg-white/80 focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="">Semua Platform</option>
                <option value="playstore">PlayStore</option>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="dashboard">Uji Manual</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            <div className="relative flex-1 sm:w-40">
              <select 
                value={filterSentiment}
                onChange={(e) => { setFilterSentiment(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold text-slate-700 border-2 border-slate-200 rounded-full px-4 py-3 bg-white/80 focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="">Semua Sentimen</option>
                <option value="positif">Positif</option>
                <option value="negatif">Negatif</option>
                <option value="netral">Netral</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            <div className="relative flex-1 sm:w-40">
              <select 
                value={filterEmotion}
                onChange={(e) => { setFilterEmotion(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold text-slate-700 border-2 border-slate-200 rounded-full px-4 py-3 bg-white/80 focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="">Semua Emosi</option>
                <option value="marah">Marah</option>
                <option value="kecewa">Kecewa</option>
                <option value="puas">Puas</option>
                <option value="bangga">Bangga</option>
                <option value="khawatir">Khawatir</option>
                <option value="senang">Senang</option>
                <option value="netral">Netral</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 border-2 border-rose-200 rounded-full text-xs font-bold transition-all shrink-0"
                title="Reset Semua Saringan"
              >
                <RotateCcw size={14} strokeWidth={2.5} />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] shadow-[4px_4px_0px_0px_#cbd5e1] overflow-hidden flex flex-col animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b-2 border-slate-200/80">
                <th className="py-5 px-6 pl-8">Platform & Penulis</th>
                <th className="py-5 px-6 w-2/5">Kutipan Komentar Publik</th>
                <th className="py-5 px-6">Sentimen & Emosi</th>
                <th className="py-5 px-6">Topik Dominan</th>
                <th className="py-5 px-6 pr-8 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td className="py-5 px-6 pl-8"><div className="h-5 w-24 bg-slate-200 rounded-full animate-pulse"></div></td>
                    <td className="py-5 px-6">
                      <div className="space-y-2">
                        <div className="h-4 w-full max-w-md bg-slate-200 rounded-full animate-pulse"></div>
                        <div className="h-4 w-3/4 max-w-sm bg-slate-200 rounded-full animate-pulse"></div>
                      </div>
                    </td>
                    <td className="py-5 px-6"><div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse"></div></td>
                    <td className="py-5 px-6"><div className="h-6 w-28 bg-slate-200 rounded-md animate-pulse"></div></td>
                    <td className="py-5 px-6 pr-8 text-right"><div className="h-8 w-16 bg-slate-200 rounded-full ml-auto animate-pulse"></div></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                        <SlidersHorizontal size={32} />
                      </div>
                      <p className="font-extrabold text-base text-slate-700">Tidak ada data yang sesuai filter</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Coba ubah kata kunci pencarian atau bersihkan filter sentimen dan platform.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 text-xs font-bold text-[#003f7a] bg-[#003f7a]/10 hover:bg-[#003f7a]/20 px-4 py-2 rounded-full transition-colors"
                        >
                          Bersihkan Semua Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedComment(item)}
                    className="hover:bg-white/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-5 px-6 pl-8 align-top">
                      <div className="flex items-center gap-2">
                        <span className="capitalize font-black text-slate-900 text-xs px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                          {item.platform}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-semibold truncate max-w-[140px]">
                        @{item.author_name || "anon"}
                      </p>
                    </td>

                    <td className="py-5 px-6 align-top">
                      <p className="line-clamp-2 leading-relaxed text-slate-700 font-medium group-hover:text-[#003f7a] transition-colors">
                        {item.text_content}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                        {formatDateID(item.posted_at)}
                      </p>
                    </td>

                    <td className="py-5 px-6 align-top">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide ${
                          item.sentiment?.toLowerCase() === 'positif' ? 'bg-[#52b788]/15 text-[#2d7a54]' :
                          item.sentiment?.toLowerCase() === 'negatif' ? 'bg-[#f87171]/15 text-[#c53030]' :
                          'bg-slate-200/80 text-slate-700'
                        }`}>
                          {item.sentiment?.toLowerCase() === 'positif' && <Smile size={12} strokeWidth={3} />}
                          {item.sentiment?.toLowerCase() === 'negatif' && <Frown size={12} strokeWidth={3} />}
                          {item.sentiment?.toLowerCase() === 'netral' && <Meh size={12} strokeWidth={3} />}
                          {item.sentiment || 'N/A'}
                        </span>
                        
                        {item.emotion && (
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            {item.emotion}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-5 px-6 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {item.topic_tags && item.topic_tags.length > 0 ? (
                          item.topic_tags.slice(0, 3).map((t, i) => (
                            <span key={i} className="bg-white/90 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600">
                              #{t}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </div>
                    </td>

                    <td className="py-5 px-6 pr-8 align-top text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedComment(item);
                        }}
                        className="p-2 text-slate-400 hover:text-[#003f7a] hover:bg-[#003f7a]/10 rounded-full transition-colors"
                        title="Lihat Detail & Penalaran AI"
                      >
                        <Eye size={18} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 rounded-b-[2rem]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Tampilkan per halaman:</span>
            <select
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-slate-400 font-medium">
              | Menampilkan {total === 0 ? 0 : (page - 1) * size + 1} - {Math.min(page * size, total)} dari {total} entitas
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 border-2 border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <span className="text-xs font-extrabold text-slate-700 px-2" key={page}>
              Halaman {page} dari {totalPages || 1}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0 || loading}
              className="p-2 border-2 border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {selectedComment && typeof document !== "undefined" && createPortal(
        <div 
          onClick={() => setSelectedComment(null)}
          className="fixed inset-0 w-screen h-screen z-[999] bg-[#001428]/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-[2rem] border-2 border-[#003f7a] shadow-[8px_8px_0px_0px_#001428,0_25px_50px_-12px_rgba(0,0,0,0.35)] p-6 sm:p-8 md:p-10 flex flex-col max-h-[85vh] animate-slide-up"
          >
            <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-slate-100 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#003f7a] text-white rounded-2xl shadow-sm">
                  <Sparkles size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-black text-[#1a1c1d]">Detail Inspeksi AI</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    ID Entitas: {selectedComment.id.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedComment(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors active:scale-95"
                title="Tutup Modal"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
              <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-3 pb-2 border-b border-slate-200">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <User size={14} /> @{selectedComment.author_name || "anon"}
                  </span>
                  <span className="capitalize px-2.5 py-0.5 bg-white rounded-md border border-slate-200 text-[#003f7a] font-bold">
                    Platform: {selectedComment.platform}
                  </span>
                </div>
                <p className="text-sm md:text-base font-semibold text-slate-800 leading-relaxed">
                  "{selectedComment.text_content}"
                </p>
                <div className="mt-3 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} /> {formatDateID(selectedComment.posted_at)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Klasifikasi Sentimen</p>
                  <p className={`text-base font-extrabold capitalize ${
                    selectedComment.sentiment?.toLowerCase() === 'positif' ? 'text-[#52b788]' :
                    selectedComment.sentiment?.toLowerCase() === 'negatif' ? 'text-[#f87171]' :
                    'text-slate-700'
                  }`}>
                    {selectedComment.sentiment || "N/A"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Karakter Emosi</p>
                  <p className="text-base font-extrabold text-[#003f7a] capitalize">
                    {selectedComment.emotion || "Netral"}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#003f7a]/5 border-2 border-[#003f7a]/20">
                <div className="flex items-center gap-2 text-[#003f7a] font-extrabold text-xs uppercase tracking-wider mb-2">
                  <Sparkles size={16} />
                  Penalaran AI (AI Reasoning)
                </div>
                <p className="text-xs md:text-sm font-medium text-slate-700 leading-relaxed">
                  {selectedComment.ai_reasoning || "Analisis ini diproses berdasarkan pemetaan leksikon sentimen otomatis dan ekstraksi konteks opini."}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag size={14} /> Tag Topik Terpetakan
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedComment.topic_tags && selectedComment.topic_tags.length > 0 ? (
                    selectedComment.topic_tags.map((t, idx) => (
                      <span key={idx} className="bg-[#003f7a] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-slate-400">Tidak ada tag topik spesifik.</span>
                  )}
                </div>
              </div>

              {selectedComment.source_url && selectedComment.source_url !== "api" && (
                <div className="pt-2">
                  <a 
                    href={selectedComment.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#003f7a] hover:underline"
                  >
                    Buka Tautan Sumber Asli <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t-2 border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedComment(null)}
                className="px-6 py-2.5 bg-[#003f7a] text-white rounded-full font-bold text-xs md:text-sm shadow-sm hover:bg-[#002f5c] transition-all hover:scale-105 active:scale-95"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
