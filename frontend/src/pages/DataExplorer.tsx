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
  SlidersHorizontal,
  FileSpreadsheet,
  AlertTriangle,
  Edit3,
  Lock,
  CheckCircle2,
  Check,
  Loader2
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
  is_edited?: boolean;
}

const STANDARD_UT_TOPICS = [
  "Bahan Ajar & Modul",
  "Biaya Pendidikan",
  "Sistem & Aplikasi",
  "Ujian & Penilaian",
  "Registrasi & Admisi",
  "Layanan Akademik",
  "Fleksibilitas Kuliah",
  "Kualitas Pendidikan"
];

export function DataExplorer() {
  const [data, setData] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(15);
  const [total, setTotal] = useState(0);
  
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("");
  const [filterEmotion, setFilterEmotion] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);

  const [editingComment, setEditingComment] = useState<CommentItem | null>(null);
  const [editSentiment, setEditSentiment] = useState<string>("POSITIF");
  const [editEmotion, setEditEmotion] = useState<string>("senang");
  const [editPlatform, setEditPlatform] = useState<string>("playstore");
  const [editAuthor, setEditAuthor] = useState<string>("");
  const [editPostedAt, setEditPostedAt] = useState<string>("");
  const [editTopicTags, setEditTopicTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [editAiReasoning, setEditAiReasoning] = useState<string>("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [editSuccessToast, setEditSuccessToast] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"all" | "date_range">("all");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await apiClient.get("/api/auth/me");
        setCurrentUserRole(response.data?.data?.role || "VIEWER");
      } catch (err) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserRole(payload.role || "VIEWER");
          } catch (e) {
            setCurrentUserRole("VIEWER");
          }
        }
      }
    };
    checkUserRole();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedComment || isExportModalOpen || editingComment) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedComment, isExportModalOpen, editingComment]);

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
      if (filterStartDate) params.append("start_date", filterStartDate);
      if (filterEndDate) params.append("end_date", filterEndDate);

      const response = await apiClient.get(`/api/comments?${params.toString()}`);
      setData(response.data.data);
      setTotal(response.data.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch, filterPlatform, filterSentiment, filterEmotion, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setFilterPlatform("");
    setFilterSentiment("");
    setFilterEmotion("");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm || filterPlatform || filterSentiment || filterEmotion || filterStartDate || filterEndDate);

  const handleExecuteExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filterPlatform) params.append("platform", filterPlatform);
      if (filterSentiment) params.append("sentiment", filterSentiment);
      if (filterEmotion) params.append("emotion", filterEmotion);

      if (exportScope === "date_range") {
        if (exportStartDate) params.append("start_date", exportStartDate);
        if (exportEndDate) params.append("end_date", exportEndDate);
      } else {
        if (filterStartDate) params.append("start_date", filterStartDate);
        if (filterEndDate) params.append("end_date", filterEndDate);
      }

      const response = await apiClient.get(`/api/comments/export/excel?${params.toString()}`, {
        responseType: "blob"
      });

      const blob = new Blob([response.data], { type: "application/vnd.ms-excel" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const todayStr = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `sisora_komentar_maks1000_${todayStr}.xls`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const toInputDateTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  const handleOpenEdit = (comment: CommentItem) => {
    setEditingComment(comment);
    setEditSentiment((comment.sentiment || "POSITIF").toUpperCase());
    setEditEmotion(comment.emotion || "netral");
    setEditPlatform(comment.platform || "playstore");
    setEditAuthor(comment.author_name || "");
    setEditPostedAt(toInputDateTime(comment.posted_at));
    setEditTopicTags(comment.topic_tags ? [...comment.topic_tags] : []);
    setCustomTagInput("");
    setEditAiReasoning(comment.ai_reasoning || "");
    setEditError(null);
  };

  const handleToggleTopicTag = (tag: string) => {
    if (editTopicTags.includes(tag)) {
      setEditTopicTags(editTopicTags.filter(t => t !== tag));
    } else {
      setEditTopicTags([...editTopicTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim().replace(/^#+/, "");
    if (!trimmed) return;
    if (!editTopicTags.includes(trimmed)) {
      setEditTopicTags([...editTopicTags, trimmed]);
    }
    setCustomTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTopicTags(editTopicTags.filter(t => t !== tagToRemove));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment) return;
    setIsSubmittingEdit(true);
    setEditError(null);
    try {
      const payload = {
        sentiment: editSentiment,
        emotion: editEmotion,
        topic_tags: editTopicTags,
        ai_reasoning: editAiReasoning,
        platform: editPlatform,
        author_name: editAuthor,
        posted_at: editPostedAt ? new Date(editPostedAt).toISOString() : undefined
      };
      const res = await apiClient.patch(`/api/comments/${editingComment.id}`, payload);
      const updated = res.data?.data;
      if (updated) {
        setData(prev => prev.map(item => item.id === editingComment.id ? { ...item, ...updated } : item));
        if (selectedComment && selectedComment.id === editingComment.id) {
          setSelectedComment(prev => prev ? { ...prev, ...updated } : null);
        }
      }
      setEditingComment(null);
      setEditSuccessToast("Perubahan data & anotasi komentar berhasil disimpan.");
      setTimeout(() => setEditSuccessToast(null), 4000);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || "Gagal menyimpan perubahan. Pastikan Anda memiliki hak akses Administrator.");
    } finally {
      setIsSubmittingEdit(false);
    }
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
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsExportModalOpen(true)}
            disabled={total === 0 || loading}
            className="flex items-center gap-2.5 bg-[#fecb00] hover:bg-[#ebd500] text-[#003f7a] border-2 border-[#003f7a] shadow-[4px_4px_0px_0px_#003f7a] px-6 py-3 rounded-full font-extrabold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#003f7a] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileSpreadsheet size={18} strokeWidth={2.5} />
            Ekspor Excel ({total > 1000 ? "Maks 1.000" : `${total} Data`})
          </button>
        </div>
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
              placeholder="Cari kata kunci di semua kolom (komentar, pengirim, platform, topik, emosi, penalaran)..."
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
                <option value="survei">Survei</option>
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

            <div className="flex items-center gap-2 bg-white/80 border-2 border-slate-200 rounded-full px-4 py-2 focus-within:border-[#003f7a]">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
                className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
                title="Tanggal Mulai"
              />
              <span className="text-slate-300 font-bold">-</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
                className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
                title="Tanggal Akhir"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 border-2 border-rose-200 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
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
                        {item.is_edited && (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300 shadow-xs"
                            title="Anotasi data telah disunting manual oleh Administrator"
                          >
                            <Edit3 size={10} strokeWidth={2.5} />
                            Diedit
                          </span>
                        )}
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
                      <div className="flex items-center justify-end gap-1.5">
                        {currentUserRole === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                            className="p-2 text-[#003f7a] hover:bg-[#003f7a]/10 border border-[#003f7a]/30 hover:border-[#003f7a] rounded-full transition-all active:scale-95 shadow-xs"
                            title="Ubah Data & Anotasi (Admin)"
                          >
                            <Edit3 size={17} strokeWidth={2.5} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComment(item);
                          }}
                          className="p-2 text-slate-400 hover:text-[#003f7a] hover:bg-[#003f7a]/10 rounded-full transition-colors"
                          title="Lihat Detail & Penalaran AI"
                        >
                          <Eye size={18} strokeWidth={2.5} />
                        </button>
                      </div>
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
          className="fixed inset-0 w-screen h-screen z-[9999] bg-[#001428]/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in"
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-headline font-black text-[#1a1c1d]">Detail Inspeksi AI</h3>
                    {selectedComment.is_edited ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Edit3 size={10} strokeWidth={2.5} />
                        Diedit Manual
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#003f7a]/10 text-[#003f7a] border border-[#003f7a]/20 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={10} strokeWidth={2.5} />
                        Asli Sistem
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
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
                className="px-6 py-2.5 bg-[#003f7a] text-white rounded-full font-bold text-xs md:text-sm shadow-sm hover:bg-[#002f5c] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isExportModalOpen && createPortal(
        <div className="fixed inset-0 w-screen h-screen z-[9999] bg-[#001428]/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border-2 border-[#003f7a] rounded-[2rem] p-6 sm:p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_#003f7a] space-y-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#fecb00] text-[#003f7a] border-2 border-[#003f7a] rounded-2xl shadow-[2px_2px_0px_0px_#003f7a]">
                  <FileSpreadsheet size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-extrabold text-[#1a1c1d]">
                    Ekspor Data ke Excel
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    Format Microsoft Excel (.xls / SpreadsheetML)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-900 text-xs font-semibold flex gap-3 items-start shadow-[3px_3px_0px_0px_#f59e0b]">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" strokeWidth={2.5} />
              <div className="space-y-1">
                <p className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px]">
                  Batas Maksimal 1.000 Komentar
                </p>
                <p className="leading-relaxed text-slate-700">
                  Sistem membatasi unduhan hingga <strong>maksimal 1.000 komentar terbaru</strong> (baik untuk opsi Semua Data maupun Rentang Tanggal) demi menjaga performa serverless di production.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Pilih Cakupan Data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportScope("all")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    exportScope === "all"
                      ? "border-[#003f7a] bg-[#003f7a]/5 shadow-[3px_3px_0px_0px_#003f7a]"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <p className="text-sm font-extrabold text-[#003f7a]">Semua Data</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Maksimal 1.000 data terbaru sesuai filter aktif saat ini.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope("date_range")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    exportScope === "date_range"
                      ? "border-[#003f7a] bg-[#003f7a]/5 shadow-[3px_3px_0px_0px_#003f7a]"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <p className="text-sm font-extrabold text-[#003f7a]">Rentang Tanggal</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Pilih tanggal mulai & selesai komentar.
                  </p>
                </button>
              </div>
            </div>

            {exportScope === "date_range" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-700 border-2 border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-[#003f7a]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-700 border-2 border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-[#003f7a]/20 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
                className="px-5 py-2.5 border-2 border-slate-200 hover:bg-slate-100 text-slate-700 rounded-full font-bold text-xs md:text-sm transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteExportExcel}
                disabled={isExporting}
                className="flex items-center gap-2 bg-[#fecb00] hover:bg-[#ebd500] text-[#003f7a] border-2 border-[#003f7a] shadow-[3px_3px_0px_0px_#003f7a] px-6 py-2.5 rounded-full font-extrabold text-xs md:text-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#003f7a] border-t-transparent rounded-full animate-spin"></span>
                    Menyiapkan Excel...
                  </>
                ) : (
                  <>
                    <Download size={16} strokeWidth={2.5} />
                    Unduh File Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingComment && typeof document !== "undefined" && createPortal(
        <div 
          onClick={() => !isSubmittingEdit && setEditingComment(null)}
          className="fixed inset-0 w-screen h-screen z-[9999] bg-[#001428]/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-white/95 backdrop-blur-2xl rounded-[2rem] border-2 border-[#003f7a] shadow-[8px_8px_0px_0px_#001428,0_25px_50px_-12px_rgba(0,0,0,0.35)] p-6 sm:p-8 flex flex-col max-h-[90vh] animate-slide-up"
          >
            <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-slate-100 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#003f7a] text-white rounded-2xl shadow-[3px_3px_0px_0px_#001428]">
                  <Edit3 size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-headline font-black text-[#1a1c1d]">
                      Edit Data & Anotasi
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#fecb00] text-[#003f7a] font-black text-[10px] border border-[#003f7a] uppercase tracking-wider">
                      Khusus Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold tracking-tight mt-0.5">
                    ID Entitas: {editingComment.id}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => !isSubmittingEdit && setEditingComment(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors active:scale-95 cursor-pointer"
                title="Tutup Modal"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2.5 shadow-[2px_2px_0px_0px_#f43f5e] shrink-0">
                <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
              <div className="p-4 rounded-2xl bg-slate-100/80 border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Lock size={14} className="text-slate-400" /> Teks Komentar Publik (Terkunci)
                  </label>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-600 border border-slate-300">
                    Hanya Baca (Audit Trail)
                  </span>
                </div>
                <textarea
                  value={editingComment.text_content}
                  readOnly
                  disabled
                  rows={3}
                  className="w-full text-xs md:text-sm font-semibold text-slate-600 bg-white/70 border border-slate-200 rounded-xl p-3 outline-none cursor-not-allowed resize-none opacity-80"
                />
                <p className="text-[11px] font-semibold text-slate-400">
                  Teks komentar asli dilindungi dari perubahan apa pun demi menjaga integritas dan keaslian data audit riset.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                    Platform Sumber Opini
                  </label>
                  <div className="relative">
                    <select
                      value={editPlatform}
                      onChange={(e) => setEditPlatform(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none cursor-pointer appearance-none"
                    >
                      <option value="playstore">PlayStore</option>
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="survei">Survei</option>
                      <option value="dashboard">Uji Manual</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                    Nama Penulis / Pengirim
                  </label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    placeholder="Contoh: anon, @mahasiswa_ut"
                    className="w-full text-xs font-bold text-slate-800 border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                    Klasifikasi Sentimen
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditSentiment("POSITIF")}
                      className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        editSentiment === "POSITIF"
                          ? "bg-[#52b788] text-white border-[#1e5238] shadow-[2px_2px_0px_0px_#1e5238]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-[#52b788]"
                      }`}
                    >
                      <Smile size={14} strokeWidth={3} />
                      Positif
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditSentiment("NEGATIF")}
                      className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        editSentiment === "NEGATIF"
                          ? "bg-[#f87171] text-white border-[#991b1b] shadow-[2px_2px_0px_0px_#991b1b]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-[#f87171]"
                      }`}
                    >
                      <Frown size={14} strokeWidth={3} />
                      Negatif
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditSentiment("NETRAL")}
                      className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        editSentiment === "NETRAL"
                          ? "bg-slate-700 text-white border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <Meh size={14} strokeWidth={3} />
                      Netral
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                    Karakter Emosi
                  </label>
                  <div className="relative">
                    <select
                      value={editEmotion}
                      onChange={(e) => setEditEmotion(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none cursor-pointer appearance-none capitalize"
                    >
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
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Waktu & Tanggal Komentar
                </label>
                <input
                  type="datetime-local"
                  value={editPostedAt}
                  onChange={(e) => setEditPostedAt(e.target.value)}
                  className="w-full sm:w-72 text-xs font-bold text-slate-800 border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Tag size={14} /> Tag Topik Terpetakan
                  </label>
                  <span className="text-[11px] font-bold text-slate-400">
                    {editTopicTags.length} tag terpilih
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl min-h-[50px] items-center">
                  {editTopicTags.length === 0 ? (
                    <span className="text-xs text-slate-400 font-medium">Belum ada tag dipilih. Klik rekomendasi di bawah atau ketik tag baru.</span>
                  ) : (
                    editTopicTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 bg-[#003f7a] text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilihan Standar Topik UT (Klik untuk Tambah/Hapus):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {STANDARD_UT_TOPICS.map((topic) => {
                      const isSelected = editTopicTags.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => handleToggleTopicTag(topic)}
                          className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? "bg-[#003f7a]/10 border-[#003f7a] text-[#003f7a] font-extrabold"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Tambah tag kustom lainnya..."
                    className="flex-1 text-xs font-bold text-slate-800 border-2 border-slate-200 rounded-xl px-4 py-2 bg-white focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border-2 border-slate-200 transition-colors cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#003f7a]" /> Penalaran AI (AI Reasoning)
                </label>
                <textarea
                  rows={3}
                  value={editAiReasoning}
                  onChange={(e) => setEditAiReasoning(e.target.value)}
                  placeholder="Tuliskan justifikasi anotasi sentimen dan emosi..."
                  className="w-full text-xs md:text-sm font-medium text-slate-800 border-2 border-slate-200 rounded-xl p-3.5 bg-white focus:ring-4 focus:ring-[#003f7a]/10 focus:border-[#003f7a] outline-none leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => !isSubmittingEdit && setEditingComment(null)}
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 border-2 border-slate-200 hover:bg-slate-100 text-slate-700 rounded-full font-bold text-xs md:text-sm transition-all cursor-pointer disabled:opacity-40"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex items-center gap-2 bg-[#003f7a] hover:bg-[#002f5c] text-white border-2 border-[#001428] shadow-[3px_3px_0px_0px_#001428] px-6 py-2.5 rounded-full font-black text-xs md:text-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={3} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {editSuccessToast && (
        <div className="fixed bottom-8 right-8 z-[1000] flex items-center gap-3 bg-[#52b788] text-white px-5 py-3.5 rounded-2xl border-2 border-[#1e5238] shadow-[4px_4px_0px_0px_#1e5238] animate-slide-up">
          <CheckCircle2 size={20} strokeWidth={2.5} />
          <span className="text-sm font-bold">{editSuccessToast}</span>
          <button 
            type="button"
            onClick={() => setEditSuccessToast(null)} 
            className="ml-2 text-white/80 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
