import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import * as XLSX from "xlsx";
import { 
  Loader2, Trash2, Plus, Globe, PlayCircle, Activity, CheckCircle2, 
  AlertTriangle, X, Play, Video, Camera, ExternalLink, Copy, Check, 
  RefreshCw, Power, Clock, Database, FileSpreadsheet, UploadCloud,
  ChevronLeft, ChevronRight, CheckSquare, ShieldAlert, ArrowRight
} from "lucide-react";

type PlatformType = "all" | "playstore" | "youtube" | "instagram" | "tiktok" | "survei";

interface TargetItem {
  id: string;
  platform: string;
  target_id: string;
  is_active: boolean;
  cron_time: string;
}

interface ScraperLogItem {
  id: string;
  platform: string;
  target_id: string;
  status: string;
  comments_count: number;
  execution_time_sec: number;
  error_message: string | null;
  created_at: string | null;
}

interface QueueProgressItem {
  targetId: string;
  platform: string;
  url: string;
  status: "waiting" | "processing" | "success" | "failed";
  count: number;
  error?: string;
  duration?: number;
}

interface DetectedColumnItem {
  name: string;
  score: number;
  count: number;
  preview: string[];
  colIndex: number;
}

interface SurveyBatchStatus {
  batchIndex: number;
  totalBatches: number;
  savedCount: number;
  status: "waiting" | "processing" | "success" | "failed";
  duration?: number;
  error?: string;
}

export function JobScheduler() {
  const navigate = useNavigate();
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [logs, setLogs] = useState<ScraperLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsMeta, setLogsMeta] = useState({ page: 1, size: 10, total: 0, total_pages: 1 });
  const [targetPage, setTargetPage] = useState(1);
  const targetPageSize = 5;

  const [activeTab, setActiveTab] = useState<PlatformType>("all");
  const [formPlatform, setFormPlatform] = useState<string>("playstore");
  const [targetInput, setTargetInput] = useState("");
  const [adding, setAdding] = useState(false);

  const [toast, setToast] = useState<{type: "success" | "error" | null, message: string}>({ type: null, message: "" });
  const [targetToDelete, setTargetToDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueProgressItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [currentStepName, setCurrentStepName] = useState("");
  const [totalNewComments, setTotalNewComments] = useState(0);

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelSheetName, setExcelSheetName] = useState<string>("");
  const [detectedColumns, setDetectedColumns] = useState<DetectedColumnItem[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [extractedComments, setExtractedComments] = useState<string[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelParseError, setExcelParseError] = useState<string | null>(null);
  const [isImportingSurvey, setIsImportingSurvey] = useState(false);
  const [surveyPreviewPage, setSurveyPreviewPage] = useState(1);
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [surveyProgressModalOpen, setSurveyProgressModalOpen] = useState(false);
  const [surveyBatchStatuses, setSurveyBatchStatuses] = useState<SurveyBatchStatus[]>([]);
  const [surveyCurrentBatchIndex, setSurveyCurrentBatchIndex] = useState(1);
  const [surveyTotalBatches, setSurveyTotalBatches] = useState(1);
  const [surveyTotalSavedComments, setSurveyTotalSavedComments] = useState(0);
  const [surveyImportFinished, setSurveyImportFinished] = useState(false);
  const [surveyImportError, setSurveyImportError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "all" || activeTab === "survei") {
      setFormPlatform("playstore");
    } else {
      setFormPlatform(activeTab);
    }
    setTargetPage(1);
  }, [activeTab]);

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
      setTargets(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    setLoadingLogs(true);
    try {
      const response = await apiClient.get(`/api/scraper/logs?page=${page}&size=10`);
      setLogs(response.data.data || []);
      if (response.data.meta) {
        setLogsMeta(response.data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    const checkRoleAndLoad = async () => {
      try {
        const response = await apiClient.get("/api/auth/me");
        const role = response.data?.data?.role || "VIEWER";
        setCurrentUserRole(role);
        if (role === "ADMIN") {
          fetchTargets();
          fetchLogs(1);
        }
      } catch (err) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload.role || "VIEWER";
            setCurrentUserRole(role);
            if (role === "ADMIN") {
              fetchTargets();
              fetchLogs(1);
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

  const sanitizeUrl = (raw: string): string => {
    let clean = raw.trim();
    if (clean.includes("play.google.com/store/apps/details?id=")) {
      const parts = clean.split("id=");
      if (parts[1]) {
        clean = parts[1].split("&")[0];
      }
    } else if (clean.includes("youtu.be/")) {
      const parts = clean.split("youtu.be/");
      if (parts[1]) {
        const id = parts[1].split("?")[0];
        clean = `https://www.youtube.com/watch?v=${id}`;
      }
    } else if (clean.includes("youtube.com/watch")) {
      const urlObj = new URL(clean);
      const v = urlObj.searchParams.get("v");
      if (v) {
        clean = `https://www.youtube.com/watch?v=${v}`;
      }
    } else if (clean.includes("instagram.com/p/") || clean.includes("instagram.com/reel/")) {
      clean = clean.split("?")[0];
      if (!clean.endsWith("/")) {
        clean += "/";
      }
    } else if (clean.includes("tiktok.com/")) {
      clean = clean.split("?")[0];
    }
    return clean;
  };

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = sanitizeUrl(targetInput);
    if (!cleanId) return;

    setAdding(true);
    try {
      await apiClient.post("/api/targets", {
        platform: formPlatform,
        target_id: cleanId,
        cron_time: "02:00"
      });
      setTargetInput("");
      showToast("success", "Sumber data baru berhasil didaftarkan ke sistem.");
      await fetchTargets();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Gagal menambahkan sumber data baru.");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await apiClient.patch(`/api/targets/${id}/toggle`);
      setTargets(prev => prev.map(t => t.id === id ? { ...t, is_active: res.data.is_active } : t));
      showToast("success", res.data.message || "Status target diperbarui.");
    } catch (err) {
      showToast("error", "Gagal memperbarui status keaktifan target.");
    }
  };

  const confirmDelete = async () => {
    if (!targetToDelete) return;
    const id = targetToDelete;
    setTargetToDelete(null);
    
    try {
      await apiClient.delete(`/api/targets/${id}`);
      showToast("success", "Sumber data berhasil dihapus dari sistem.");
      await fetchTargets();
    } catch (err) {
      showToast("error", "Gagal menghapus sumber data.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runSequentialQueue = async (itemsToRun: TargetItem[]) => {
    if (itemsToRun.length === 0) {
      showToast("error", "Tidak ada target aktif yang dipilih untuk ditarik.");
      return;
    }

    const initialQueue: QueueProgressItem[] = itemsToRun.map(t => ({
      targetId: t.id,
      platform: t.platform,
      url: t.target_id,
      status: "waiting",
      count: 0
    }));

    setQueueItems(initialQueue);
    setCurrentQueueIndex(0);
    setTotalNewComments(0);
    setQueueModalOpen(true);
    setIsProcessingQueue(true);

    let collectedSum = 0;

    for (let i = 0; i < itemsToRun.length; i++) {
      setCurrentQueueIndex(i);
      const target = itemsToRun[i];

      setQueueItems(prev => prev.map((q, idx) => idx === i ? { ...q, status: "processing" } : q));
      setCurrentStepName("Menghubungi server crawler & mengunduh komentar...");

      const startTime = performance.now();

      try {
        await new Promise(r => setTimeout(r, 400));
        setCurrentStepName("Menganalisis sentimen, emosi & klaster topik AI...");

        const response = await apiClient.post("/api/scrape", {
          source: target.platform,
          target_id: target.target_id,
          limit: 50
        });

        const duration = Math.round((performance.now() - startTime) / 100) / 10;
        const count = response.data.count || (response.data.data ? response.data.data.length : 0);
        collectedSum += count;
        setTotalNewComments(collectedSum);

        setQueueItems(prev => prev.map((q, idx) => idx === i ? { 
          ...q, 
          status: "success", 
          count, 
          duration 
        } : q));
      } catch (err: any) {
        const duration = Math.round((performance.now() - startTime) / 100) / 10;
        const errMsg = err.response?.data?.detail || err.message || "Gagal memproses data target";

        setQueueItems(prev => prev.map((q, idx) => idx === i ? { 
          ...q, 
          status: "failed", 
          error: errMsg, 
          duration 
        } : q));
      }

      if (i < itemsToRun.length - 1) {
        setCurrentStepName("Jeda stabilisasi antar antrean...");
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    setIsProcessingQueue(false);
    setCurrentStepName("Seluruh rangkaian antrean telah selesai diproses.");
    await fetchLogs(1);
  };

  const handleStartQueue = () => {
    let candidateTargets = targets.filter(t => t.is_active);
    if (activeTab !== "all") {
      candidateTargets = candidateTargets.filter(t => t.platform.toLowerCase() === activeTab);
    }
    runSequentialQueue(candidateTargets);
  };

  const handleRunSingle = (target: TargetItem) => {
    runSequentialQueue([target]);
  };

  const detectCommentColumnFromWorkbook = (workbook: XLSX.WorkBook) => {
    let bestSheet = "";
    let bestRows: any[][] = [];
    let maxRows = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      if (rows.length > maxRows) {
        maxRows = rows.length;
        bestRows = rows;
        bestSheet = sheetName;
      }
    }

    if (bestRows.length < 2) {
      throw new Error("Berkas Excel tidak memiliki baris data yang memadai.");
    }

    setExcelSheetName(bestSheet);

    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, bestRows.length); i++) {
      const candidateRow = bestRows[i];
      if (Array.isArray(candidateRow) && candidateRow.filter(c => typeof c === "string" && c.trim().length > 0).length >= 2) {
        headerRowIndex = i;
        break;
      }
    }

    const headers: string[] = (bestRows[headerRowIndex] || []).map(h => String(h || "").trim());
    const dataRows = bestRows.slice(headerRowIndex + 1);

    const highKeywords = ["saran", "masukan", "komentar", "opini", "kritik", "feedback", "keluhan", "kendala", "evaluasi", "catatan"];
    const mediumKeywords = ["tuliskan", "harapan", "alasan", "masalah", "jelaskan", "penjelasan", "uraikan", "rekomendasi", "pendapat"];
    const penaltyKeywords = ["id", "ip address", "date", "time", "email", "timestamp", "scale", "rating", "prodi", "upbjj", "skor", "telepon", "gender", "usia", "fakultas", "semester", "angkatan", "nik", "nim", "status", "nama"];

    const candidates: DetectedColumnItem[] = [];

    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
      const header = headers[colIdx];
      if (!header) continue;
      const lowerHeader = header.toLowerCase();

      let score = 0;

      for (const kw of highKeywords) {
        if (lowerHeader.includes(kw)) {
          score += 15;
          break;
        }
      }

      for (const kw of mediumKeywords) {
        if (lowerHeader.includes(kw)) {
          score += 8;
          break;
        }
      }

      for (const kw of penaltyKeywords) {
        if (lowerHeader.startsWith(kw) || lowerHeader === kw) {
          score -= 30;
          break;
        }
      }

      const colValues: string[] = [];
      let numericCount = 0;
      let totalChars = 0;

      for (const row of dataRows) {
        if (!row) continue;
        const cellVal = row[colIdx];
        if (cellVal !== undefined && cellVal !== null) {
          const strVal = String(cellVal).trim();
          if (strVal.length > 0) {
            colValues.push(strVal);
            totalChars += strVal.length;
            if (!isNaN(Number(strVal)) && strVal.length <= 2) {
              numericCount++;
            }
          }
        }
      }

      if (colValues.length === 0) continue;

      const numRatio = numericCount / colValues.length;
      if (numRatio > 0.5) {
        score -= 50;
      }

      const avgLen = totalChars / colValues.length;
      if (avgLen >= 15) {
        score += 20;
      } else if (avgLen >= 8) {
        score += 8;
      }

      const multiWordCount = colValues.filter(v => v.includes(" ") && v.length >= 10).length;
      if (multiWordCount / colValues.length > 0.3) {
        score += 15;
      }

      if (score > 5) {
        const preview = colValues.slice(0, 5);
        candidates.push({
          name: header,
          score,
          count: colValues.length,
          preview,
          colIndex: colIdx
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      throw new Error("Tidak ditemukan kolom masukan/komentar teks pada berkas Excel ini. Pastikan berkas memiliki kolom berisi saran, kritik, atau evaluasi.");
    }

    setDetectedColumns(candidates);
    const chosen = candidates[0];
    setSelectedColumn(chosen.name);

    const commentsForChosen: string[] = [];
    for (const row of dataRows) {
      if (!row) continue;
      const val = row[chosen.colIndex];
      if (val !== undefined && val !== null) {
        const s = String(val).trim();
        if (s.length >= 3 && isNaN(Number(s))) {
          commentsForChosen.push(s);
        }
      }
    }
    setExtractedComments(commentsForChosen);
  };

  const processExcelFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const errMsg = `Ukuran berkas (${sizeMb} MB) melebihi batas maksimal 20 MB. Silakan pilih berkas yang lebih ringkas.`;
      showToast("error", errMsg);
      setExcelParseError(errMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setExcelFile(file);
    setExcelParseError(null);
    setIsParsingExcel(true);
    setSurveyPreviewPage(1);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array" });
        detectCommentColumnFromWorkbook(wb);
      } catch (err: any) {
        setExcelParseError(err.message || "Gagal memproses berkas Excel.");
        setDetectedColumns([]);
        setSelectedColumn("");
        setExtractedComments([]);
      } finally {
        setIsParsingExcel(false);
      }
    };
    reader.onerror = () => {
      setExcelParseError("Gagal membaca berkas dari memori peramban.");
      setIsParsingExcel(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleDropExcel = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingExcel(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleSelectColumnChange = (columnName: string) => {
    setSelectedColumn(columnName);
    const found = detectedColumns.find(c => c.name === columnName);
    if (!found || !excelFile) return;

    setSurveyPreviewPage(1);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array" });
        const sheet = wb.Sheets[excelSheetName || wb.SheetNames[0]];
        if (!sheet) return;
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        const comments: string[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          const val = row[found.colIndex];
          if (val !== undefined && val !== null) {
            const s = String(val).trim();
            if (s.length >= 3 && isNaN(Number(s))) {
              comments.push(s);
            }
          }
        }
        setExtractedComments(comments);
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(excelFile);
  };

  const handleResetSurvey = () => {
    setExcelFile(null);
    setExcelSheetName("");
    setDetectedColumns([]);
    setSelectedColumn("");
    setExtractedComments([]);
    setExcelParseError(null);
    setSurveyPreviewPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseSurveyModal = () => {
    setSurveyProgressModalOpen(false);
    if (surveyImportFinished) {
      handleResetSurvey();
    }
  };

  const handleSaveSurvey = async () => {
    if (!excelFile || extractedComments.length === 0) return;

    const chunkSize = 30;
    const chunks: string[][] = [];
    for (let i = 0; i < extractedComments.length; i += chunkSize) {
      chunks.push(extractedComments.slice(i, i + chunkSize));
    }

    const totalBatches = chunks.length;
    const initialStatuses: SurveyBatchStatus[] = chunks.map((_, idx) => ({
      batchIndex: idx + 1,
      totalBatches,
      savedCount: 0,
      status: "waiting"
    }));

    setSurveyBatchStatuses(initialStatuses);
    setSurveyCurrentBatchIndex(1);
    setSurveyTotalBatches(totalBatches);
    setSurveyTotalSavedComments(0);
    setSurveyImportFinished(false);
    setSurveyImportError(null);
    setSurveyProgressModalOpen(true);
    setIsImportingSurvey(true);

    let cumulativeSaved = 0;

    for (let i = 0; i < totalBatches; i++) {
      const batchNum = i + 1;
      const isFinal = (batchNum === totalBatches);
      const batchComments = chunks[i];

      setSurveyCurrentBatchIndex(batchNum);
      setSurveyBatchStatuses(prev => prev.map(b => b.batchIndex === batchNum ? { ...b, status: "processing" } : b));

      const startTime = performance.now();

      try {
        const response = await apiClient.post("/api/survey/import", {
          filename: excelFile.name,
          column_name: selectedColumn,
          comments: batchComments,
          batch_index: batchNum,
          total_batches: totalBatches,
          is_final_batch: isFinal,
          total_survey_comments: extractedComments.length
        });

        const duration = Math.round((performance.now() - startTime) / 100) / 10;
        const savedInBatch = response.data.saved_count !== undefined ? response.data.saved_count : batchComments.length;
        cumulativeSaved += savedInBatch;
        setSurveyTotalSavedComments(cumulativeSaved);

        setSurveyBatchStatuses(prev => prev.map(b => b.batchIndex === batchNum ? {
          ...b,
          status: "success",
          savedCount: savedInBatch,
          duration
        } : b));
      } catch (err: any) {
        const duration = Math.round((performance.now() - startTime) / 100) / 10;
        const errMsg = err.response?.data?.detail || err.message || "Gagal memproses batch komentar";
        setSurveyBatchStatuses(prev => prev.map(b => b.batchIndex === batchNum ? {
          ...b,
          status: "failed",
          error: errMsg,
          duration
        } : b));
        setSurveyImportError(errMsg);
      }

      if (i < totalBatches - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    setIsImportingSurvey(false);
    setSurveyImportFinished(true);
    await fetchLogs(1);
  };

  const filteredTargets = activeTab === "all" 
    ? targets 
    : targets.filter(t => t.platform.toLowerCase() === activeTab);

  const totalTargetPages = Math.ceil(filteredTargets.length / targetPageSize) || 1;
  const paginatedTargets = filteredTargets.slice((targetPage - 1) * targetPageSize, targetPage * targetPageSize);

  const getPlatformCount = (p: string) => {
    if (p === "all") return targets.length;
    return targets.filter(t => t.platform.toLowerCase() === p).length;
  };

  const renderPlatformBadge = (platformName: string) => {
    const p = platformName.toLowerCase();
    if (p === "playstore") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#003f7a]/10 text-[#003f7a] border border-[#003f7a]/20">
          <Play size={12} strokeWidth={3} />
          Play Store
        </span>
      );
    } else if (p === "youtube") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
          <Video size={12} strokeWidth={3} />
          YouTube
        </span>
      );
    } else if (p === "instagram" || p === "apify") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
          <Camera size={12} strokeWidth={3} />
          Instagram
        </span>
      );
    } else if (p === "tiktok") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-900 border border-slate-300">
          <Video size={12} strokeWidth={3} />
          TikTok
        </span>
      );
    } else if (p === "survei") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
          <FileSpreadsheet size={12} strokeWidth={3} />
          Survei
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700">
        <Globe size={12} strokeWidth={3} />
        {platformName}
      </span>
    );
  };

  const getTargetUrlLink = (platform: string, targetId: string): string | null => {
    const p = platform.toLowerCase();
    if (targetId.startsWith("http://") || targetId.startsWith("https://")) {
      return targetId;
    }
    if (p === "playstore") {
      return `https://play.google.com/store/apps/details?id=${targetId}`;
    }
    return null;
  };

  const getPlaceholderText = () => {
    if (formPlatform === "playstore") return "Masukkan App ID, contoh: id.ac.ut.sia atau tautan Google Play";
    if (formPlatform === "youtube") return "Masukkan tautan video YouTube, contoh: https://www.youtube.com/watch?v=...";
    if (formPlatform === "instagram") return "Masukkan tautan postingan Instagram, contoh: https://www.instagram.com/p/.../";
    if (formPlatform === "tiktok") return "Masukkan tautan video TikTok, contoh: https://www.tiktok.com/@.../video/...";
    return "Masukkan tautan atau identitas target data...";
  };

  const getHelperGuidance = () => {
    if (formPlatform === "playstore") return "ID Paket aplikasi resmi Universitas Terbuka di Google Play Store.";
    if (formPlatform === "youtube") return "URL video YouTube publik seputar kegiatan akademik, tutorial, atau wisuda UT.";
    if (formPlatform === "instagram") return "URL postingan atau reels resmi akun media sosial Universitas Terbuka.";
    if (formPlatform === "tiktok") return "URL video TikTok resmi atau opini masyarakat mengenai UT.";
    return "Tautan target digital publik yang akan dihimpun opininya secara berkala.";
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
            Menu penarikan data digital dan impor survei kepuasan dikunci ketat untuk wewenang <strong className="text-slate-900">ADMIN</strong>. Akun Anda saat ini tercatat dengan wewenang <strong className="text-primary">{currentUserRole || "VIEWER"}</strong> yang bersifat hanya-baca.
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
    <div className="space-y-8 relative pb-16">
      
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
            <p className="text-slate-600 font-medium mb-8 leading-relaxed">
              Sistem tidak akan lagi menarik opini publik dari target ini secara terjadwal maupun manual. Apakah Anda yakin ingin menghapus sumber data ini?
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

      {queueModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#001f3f]/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 max-w-2xl w-full border-4 border-[#003f7a] shadow-[10px_10px_0px_0px_#003f7a] animate-slide-up flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between pb-6 border-b-2 border-slate-100">
              <div className="flex items-center gap-4">
                <div className="bg-[#fecb00] text-[#003f7a] p-3 rounded-2xl shadow-sm">
                  {isProcessingQueue ? (
                    <Activity size={28} className="animate-pulse" strokeWidth={2.5} />
                  ) : (
                    <CheckCircle2 size={28} strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-extrabold text-slate-900">
                    {isProcessingQueue ? "Memproses Penarikan Data" : "Penarikan Data Selesai"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {isProcessingQueue 
                      ? `Sedang memproses antrean ${currentQueueIndex + 1} dari ${queueItems.length}` 
                      : `Total ${queueItems.length} target telah selesai dieksekusi`}
                  </p>
                </div>
              </div>

              {!isProcessingQueue && (
                <button 
                  onClick={() => setQueueModalOpen(false)}
                  className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="py-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-600">
                <span>Progres Antrean Cerdas</span>
                <span>{Math.round(((currentQueueIndex + (isProcessingQueue ? 0.5 : 1)) / queueItems.length) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-[#003f7a] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.round(((currentQueueIndex + (isProcessingQueue ? 0.5 : 1)) / queueItems.length) * 100))}%` }}
                ></div>
              </div>
              {isProcessingQueue && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#003f7a] pt-1">
                  <Loader2 size={14} className="animate-spin" />
                  <span>{currentStepName}</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 my-2 max-h-64 border-y-2 border-slate-100 py-4">
              {queueItems.map((item, idx) => (
                <div 
                  key={`q-item-${idx}`}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                    item.status === "processing"
                      ? "border-[#003f7a] bg-[#003f7a]/5 shadow-sm"
                      : item.status === "success"
                      ? "border-emerald-200 bg-emerald-50/60"
                      : item.status === "failed"
                      ? "border-rose-200 bg-rose-50/60"
                      : "border-slate-100 bg-slate-50/50 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {item.status === "processing" && <Loader2 size={20} className="animate-spin text-[#003f7a]" />}
                      {item.status === "success" && <CheckCircle2 size={20} className="text-emerald-600" strokeWidth={2.5} />}
                      {item.status === "failed" && <AlertTriangle size={20} className="text-rose-600" strokeWidth={2.5} />}
                      {item.status === "waiting" && <Clock size={20} className="text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {renderPlatformBadge(item.platform)}
                        <span className="text-xs font-bold text-slate-800 truncate block max-w-xs">{item.url}</span>
                      </div>
                      {item.error && (
                        <p className="text-[11px] font-semibold text-rose-600 mt-1 truncate">{item.error}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {item.status === "success" && (
                      <span className="inline-block text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                        +{item.count} opini ({item.duration}s)
                      </span>
                    )}
                    {item.status === "failed" && (
                      <span className="inline-block text-xs font-extrabold text-rose-800 bg-rose-100 px-3 py-1 rounded-full">
                        Kendala Teknis
                      </span>
                    )}
                    {item.status === "processing" && (
                      <span className="inline-block text-xs font-extrabold text-[#003f7a] bg-[#fecb00] px-3 py-1 rounded-full animate-pulse">
                        Memproses...
                      </span>
                    )}
                    {item.status === "waiting" && (
                      <span className="text-xs font-semibold text-slate-400">
                        Antre
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-bold text-slate-600">
                Hasil: <span className="text-emerald-700 font-black">+{totalNewComments}</span> opini baru ditambahkan.
              </div>
              <button
                onClick={() => setQueueModalOpen(false)}
                disabled={isProcessingQueue}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#003f7a] text-white font-extrabold text-sm rounded-full hover:shadow-[4px_4px_0px_0px_#fecb00] active:scale-95 transition-all disabled:opacity-40"
              >
                {isProcessingQueue ? "Sedang Bekerja..." : "Tutup Ringkasan"}
              </button>
            </div>

          </div>
        </div>
      )}

      {surveyProgressModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#001f3f]/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 max-w-2xl w-full border-4 border-[#003f7a] shadow-[10px_10px_0px_0px_#003f7a] animate-slide-up flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between pb-6 border-b-2 border-slate-100">
              <div className="flex items-center gap-4">
                <div className="bg-[#fecb00] text-[#003f7a] p-3 rounded-2xl shadow-sm">
                  {isImportingSurvey ? (
                    <Loader2 size={28} className="animate-spin" strokeWidth={2.5} />
                  ) : (
                    <CheckCircle2 size={28} strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-extrabold text-slate-900">
                    {isImportingSurvey ? "Menyimpan Data Komentar Survei" : "Impor Survei Selesai"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {isImportingSurvey 
                      ? `Sedang memproses batch ${surveyCurrentBatchIndex} dari ${surveyTotalBatches}` 
                      : `Total ${surveyTotalSavedComments} komentar baru berhasil disimpan ke database`}
                  </p>
                </div>
              </div>

              {!isImportingSurvey && (
                <button 
                  onClick={handleCloseSurveyModal}
                  className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="py-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-600">
                <span>Progres Antrean Batch</span>
                <span>{Math.round(((surveyCurrentBatchIndex - (isImportingSurvey ? 0.5 : 0)) / surveyTotalBatches) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-[#003f7a] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.round(((surveyCurrentBatchIndex - (isImportingSurvey ? 0.5 : 0)) / surveyTotalBatches) * 100))}%` }}
                ></div>
              </div>
              {isImportingSurvey && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#003f7a] pt-1">
                  <Activity size={14} className="animate-pulse" />
                  <span>Menganalisis sentimen, emosi, topik, dan penalaran via Super-Smart Local NLP...</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 my-2 max-h-64 border-y-2 border-slate-100 py-4">
              {surveyBatchStatuses.map((item) => (
                <div 
                  key={`survey-b-${item.batchIndex}`}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                    item.status === "processing"
                      ? "border-[#003f7a] bg-[#003f7a]/5 shadow-sm"
                      : item.status === "success"
                      ? "border-emerald-200 bg-emerald-50/60"
                      : item.status === "failed"
                      ? "border-rose-200 bg-rose-50/60"
                      : "border-slate-100 bg-slate-50/50 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {item.status === "processing" && <Loader2 size={20} className="animate-spin text-[#003f7a]" />}
                      {item.status === "success" && <CheckCircle2 size={20} className="text-emerald-600" strokeWidth={2.5} />}
                      {item.status === "failed" && <AlertTriangle size={20} className="text-rose-600" strokeWidth={2.5} />}
                      {item.status === "waiting" && <Clock size={20} className="text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800">Batch {item.batchIndex} dari {item.totalBatches}</span>
                        <span className="text-[11px] text-slate-500 font-medium font-mono">({excelFile?.name})</span>
                      </div>
                      {item.error && (
                        <p className="text-[11px] font-semibold text-rose-600 mt-1 truncate">{item.error}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {item.status === "success" && (
                      <span className="inline-block text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                        +{item.savedCount} komentar ({item.duration}s)
                      </span>
                    )}
                    {item.status === "failed" && (
                      <span className="inline-block text-xs font-extrabold text-rose-800 bg-rose-100 px-3 py-1 rounded-full">
                        Gagal
                      </span>
                    )}
                    {item.status === "processing" && (
                      <span className="inline-block text-xs font-extrabold text-[#003f7a] bg-[#fecb00] px-3 py-1 rounded-full animate-pulse">
                        Menyimpan...
                      </span>
                    )}
                    {item.status === "waiting" && (
                      <span className="text-xs font-semibold text-slate-400">
                        Menunggu
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {surveyImportError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Terjadi kendala pada sebagian data: {surveyImportError}</span>
              </div>
            )}

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-bold text-slate-600">
                Tersimpan: <span className="text-emerald-700 font-black">+{surveyTotalSavedComments}</span> komentar baru ke database.
              </div>
              <button
                onClick={handleCloseSurveyModal}
                disabled={isImportingSurvey}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#003f7a] text-white font-extrabold text-sm rounded-full hover:shadow-[4px_4px_0px_0px_#fecb00] active:scale-95 transition-all disabled:opacity-40"
              >
                {isImportingSurvey ? "Sedang Menyimpan..." : "Tutup & Lihat Riwayat"}
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-[#1a1c1d] tracking-tight">Penarikan Data</h2>
          <p className="text-slate-500 mt-2 font-medium">Himpun opini publik dan ulasan mahasiswa secara terarah dari berbagai kanal digital.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b-2 border-slate-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm transition-all whitespace-nowrap active:scale-95 ${
            activeTab === "all"
              ? "bg-[#003f7a] text-white shadow-[3px_3px_0px_0px_#fecb00]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Globe size={18} strokeWidth={2.5} />
          <span>Semua Sumber</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === "all" ? "bg-[#fecb00] text-[#003f7a]" : "bg-slate-200 text-slate-700"}`}>
            {getPlatformCount("all")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("playstore")}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm transition-all whitespace-nowrap active:scale-95 ${
            activeTab === "playstore"
              ? "bg-[#003f7a] text-white shadow-[3px_3px_0px_0px_#fecb00]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Play size={18} strokeWidth={2.5} />
          <span>Google Play</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === "playstore" ? "bg-[#fecb00] text-[#003f7a]" : "bg-slate-200 text-slate-700"}`}>
            {getPlatformCount("playstore")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("youtube")}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm transition-all whitespace-nowrap active:scale-95 ${
            activeTab === "youtube"
              ? "bg-rose-700 text-white shadow-[3px_3px_0px_0px_#fecb00]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Video size={18} strokeWidth={2.5} />
          <span>YouTube</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === "youtube" ? "bg-[#fecb00] text-[#003f7a]" : "bg-slate-200 text-slate-700"}`}>
            {getPlatformCount("youtube")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("instagram")}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm transition-all whitespace-nowrap active:scale-95 ${
            activeTab === "instagram"
              ? "bg-fuchsia-700 text-white shadow-[3px_3px_0px_0px_#fecb00]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Camera size={18} strokeWidth={2.5} />
          <span>Instagram</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === "instagram" ? "bg-[#fecb00] text-[#003f7a]" : "bg-slate-200 text-slate-700"}`}>
            {getPlatformCount("instagram") + getPlatformCount("apify")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("tiktok")}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm transition-all whitespace-nowrap active:scale-95 ${
            activeTab === "tiktok"
              ? "bg-slate-950 text-white shadow-[3px_3px_0px_0px_#fecb00]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Video size={18} strokeWidth={2.5} />
          <span>TikTok</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === "tiktok" ? "bg-[#fecb00] text-[#003f7a]" : "bg-slate-200 text-slate-700"}`}>
            {getPlatformCount("tiktok")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("survei")}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm transition-all whitespace-nowrap active:scale-95 ${
            activeTab === "survei"
              ? "bg-indigo-900 text-white shadow-[3px_3px_0px_0px_#fecb00]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileSpreadsheet size={18} strokeWidth={2.5} />
          <span>Survei Kepuasan</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === "survei" ? "bg-[#fecb00] text-[#003f7a]" : "bg-indigo-100 text-indigo-800"}`}>
            Excel
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="col-span-1 lg:col-span-8 space-y-6">
          
          {activeTab === "survei" ? (
            <div className="space-y-6">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!excelFile && (
                <div className="space-y-4">
                  {excelParseError && (
                    <div className="bg-rose-50/95 border-2 border-rose-300 rounded-[2rem] p-5 md:p-6 flex items-start justify-between gap-4 shadow-sm">
                      <div className="flex items-start gap-3.5">
                        <div className="bg-rose-100 text-rose-700 p-2.5 rounded-2xl shrink-0">
                          <AlertTriangle size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className="text-sm font-headline font-extrabold text-slate-900 mb-0.5">Berkas Ditolak</h4>
                          <p className="text-xs text-rose-600 font-semibold leading-relaxed">{excelParseError}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setExcelParseError(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all shrink-0"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingExcel(true); }}
                    onDragLeave={() => setIsDraggingExcel(false)}
                    onDrop={handleDropExcel}
                    onClick={() => fileInputRef.current?.click()}
                    className={`bg-white/90 backdrop-blur-md border-3 border-dashed rounded-[2.5rem] p-10 md:p-14 text-center cursor-pointer transition-all ${
                      isDraggingExcel 
                        ? "border-[#003f7a] bg-[#003f7a]/5 scale-[1.01] shadow-[8px_8px_0px_0px_#fecb00]" 
                        : "border-slate-300 hover:border-[#003f7a] hover:bg-slate-50/80 shadow-[4px_4px_0px_0px_rgba(0,63,122,0.05)]"
                    }`}
                  >
                    <div className="w-20 h-20 mx-auto mb-6 bg-indigo-50 text-indigo-700 border-2 border-indigo-200 rounded-3xl flex items-center justify-center shadow-sm">
                      <UploadCloud size={40} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-headline font-extrabold text-slate-900 mb-2">
                      Unggah Berkas Excel Survei Kepuasan
                    </h3>
                    <p className="text-sm font-medium text-slate-500 max-w-md mx-auto mb-2 leading-relaxed">
                      Seret dan lepas berkas survei Anda ke area ini, atau klik untuk memilih berkas dari perangkat Anda.
                    </p>
                    <p className="text-xs font-bold text-[#003f7a] bg-indigo-50 border border-indigo-100 rounded-full py-1 px-4 max-w-xs mx-auto mb-6">
                      Batas ukuran maksimal 20 MB per berkas (.xlsx / .xls)
                    </p>
                    
                    <div className="inline-flex items-center gap-2 bg-[#003f7a] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-[3px_3px_0px_0px_#fecb00] active:scale-95 transition-all">
                      <FileSpreadsheet size={18} strokeWidth={2.5} />
                      <span>Pilih Berkas Excel (.xlsx / .xls)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-xl mx-auto mt-10 text-left">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-extrabold text-slate-800 block mb-1">Multi-Format Fleksibel</span>
                        <span className="text-[11px] text-slate-500 font-medium">Mendukung .xlsx modern maupun .xls biner BIFF8.</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-extrabold text-slate-800 block mb-1">Deteksi Kolom Cerdas</span>
                        <span className="text-[11px] text-slate-500 font-medium">Otomatis mengenali kolom saran, masukan & keluhan.</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-extrabold text-slate-800 block mb-1">Privasi Zero-Storage</span>
                        <span className="text-[11px] text-slate-500 font-medium">Diparsing di memori peramban tanpa simpan di server.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {excelFile && isParsingExcel && (
                <div className="bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-[2.5rem] p-12 text-center shadow-sm">
                  <Loader2 size={44} className="animate-spin text-[#003f7a] mx-auto mb-4" />
                  <h4 className="text-xl font-headline font-extrabold text-slate-900 mb-1">Memindai dan Memetakan Kolom Berkas...</h4>
                  <p className="text-xs text-slate-500 font-medium">Menganalisis header kolom dan sampel teks masukan secara otomatis. Untuk berkas besar hingga 20 MB, proses ini membutuhkan beberapa detik.</p>
                </div>
              )}

              {excelFile && !isParsingExcel && excelParseError && (
                <div className="bg-white/90 backdrop-blur-md border-2 border-rose-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-rose-100 text-rose-700 p-3 rounded-2xl shrink-0">
                      <AlertTriangle size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-xl font-headline font-extrabold text-slate-900 mb-1">Peringatan Deteksi Kolom</h4>
                      <p className="text-xs text-rose-600 font-semibold leading-relaxed">{excelParseError}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleResetSurvey}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all"
                    >
                      Pilih Berkas Lain
                    </button>
                  </div>
                </div>
              )}

              {excelFile && !isParsingExcel && !excelParseError && detectedColumns.length > 0 && (
                <div className="space-y-6">
                  
                  <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,63,122,0.05)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="bg-indigo-100 text-indigo-700 p-3 rounded-2xl shrink-0">
                          <FileSpreadsheet size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 break-all">{excelFile.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                            <span>{(excelFile.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[11px] text-slate-700">Sheet: {excelSheetName}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleResetSurvey}
                        disabled={isImportingSurvey}
                        className="self-start sm:self-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all active:scale-95 disabled:opacity-40"
                      >
                        Ganti Berkas
                      </button>
                    </div>

                    <div className="pt-6 space-y-4">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                          Kolom Masukan / Saran Terdeteksi
                        </label>
                        {detectedColumns.length === 1 ? (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
                              <span className="text-xs font-bold text-emerald-950">{selectedColumn}</span>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full shrink-0">
                              Otomatis
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <select
                              value={selectedColumn}
                              onChange={(e) => handleSelectColumnChange(e.target.value)}
                              disabled={isImportingSurvey}
                              className="w-full text-xs font-bold text-slate-800 border-2 border-slate-200 rounded-2xl px-4 py-3.5 bg-slate-50 hover:bg-white focus:bg-white focus:border-[#003f7a] outline-none transition-all cursor-pointer"
                            >
                              {detectedColumns.map((col, idx) => (
                                <option key={`col-opt-${idx}`} value={col.name}>
                                  {col.name} ({col.count} baris masukan, skor kecocokan: {col.score})
                                </option>
                              ))}
                            </select>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Sistem mendeteksi {detectedColumns.length} kolom saran potensial. Anda dapat beralih kolom melalui menu pilihan di atas.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                          <CheckSquare size={16} className="text-indigo-600" />
                          <span>Total Komentar Valid:</span>
                        </div>
                        <span className="text-xs font-black bg-indigo-600 text-white px-3 py-1 rounded-full shadow-sm">
                          {extractedComments.length} Komentar
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,63,122,0.05)]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-headline font-bold text-slate-900">Pratinjau Komentar Responden</h4>
                        <p className="text-xs text-slate-500 font-medium">Menampilkan masukan asli sebelum proses penyimpanan dan inferensi sentimen.</p>
                      </div>
                      <span className="text-xs font-extrabold text-slate-500">
                        {extractedComments.length > 0 && `Komentar ${(surveyPreviewPage - 1) * 5 + 1} - ${Math.min(surveyPreviewPage * 5, extractedComments.length)} dari ${extractedComments.length}`}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {extractedComments
                        .slice((surveyPreviewPage - 1) * 5, surveyPreviewPage * 5)
                        .map((commentText, cIdx) => {
                          const absoluteIndex = (surveyPreviewPage - 1) * 5 + cIdx + 1;
                          return (
                            <div key={`prev-comment-${absoluteIndex}`} className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors flex items-start gap-3.5">
                              <span className="text-[11px] font-mono font-bold text-[#003f7a] bg-[#003f7a]/10 px-2 py-0.5 rounded-md shrink-0">
                                #{absoluteIndex}
                              </span>
                              <p className="text-xs font-medium text-slate-800 leading-relaxed break-words flex-1">
                                {commentText}
                              </p>
                            </div>
                          );
                        })}
                    </div>

                    {extractedComments.length > 5 && (
                      <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-100">
                        <button
                          onClick={() => setSurveyPreviewPage(p => Math.max(1, p - 1))}
                          disabled={surveyPreviewPage <= 1}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 active:scale-95 transition-all"
                        >
                          <ChevronLeft size={14} />
                          <span>Sebelumnya</span>
                        </button>
                        <span className="text-xs font-extrabold text-slate-600">
                          Halaman {surveyPreviewPage} dari {Math.ceil(extractedComments.length / 5)}
                        </span>
                        <button
                          onClick={() => setSurveyPreviewPage(p => Math.min(Math.ceil(extractedComments.length / 5), p + 1))}
                          disabled={surveyPreviewPage >= Math.ceil(extractedComments.length / 5)}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 active:scale-95 transition-all"
                        >
                          <span>Berikutnya</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs font-semibold text-slate-500 text-center sm:text-left">
                      Konfirmasi untuk menyimpan data komentar ke database. Klik Batal untuk membatalkan tanpa menyimpan apapun.
                    </p>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={handleResetSurvey}
                        disabled={isImportingSurvey}
                        className="flex-1 sm:flex-initial px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl active:scale-95 transition-all disabled:opacity-40"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveSurvey}
                        disabled={isImportingSurvey || extractedComments.length === 0}
                        className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-2 bg-[#003f7a] text-white px-8 py-3.5 rounded-2xl font-black text-xs shadow-[3px_3px_0px_0px_#fecb00] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isImportingSurvey ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Menyimpan Komentar...</span>
                          </>
                        ) : (
                          <>
                            <Check size={16} strokeWidth={3} />
                            <span>Simpan Data Komentar ({extractedComments.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <>
              <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,63,122,0.05)]">
                <h3 className="text-xl font-headline font-bold text-[#1a1c1d] mb-2 flex items-center gap-2.5">
                  <Plus size={20} className="text-[#003f7a]" strokeWidth={3} />
                  <span>Tambah Target Sumber Data {activeTab !== "all" && `(${activeTab.toUpperCase()})`}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-6">{getHelperGuidance()}</p>

                <form onSubmit={handleAddTarget} className="flex flex-col md:flex-row gap-3">
                  {activeTab === "all" && (
                    <select
                      value={formPlatform}
                      onChange={(e) => setFormPlatform(e.target.value)}
                      className="md:w-48 text-xs font-bold text-slate-700 border-2 border-slate-200 rounded-2xl px-4 py-3.5 bg-slate-50 focus:bg-white focus:border-[#003f7a] outline-none transition-all cursor-pointer"
                    >
                      <option value="playstore">Google Play Store</option>
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  )}
                  
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder={getPlaceholderText()}
                    className="flex-1 text-xs font-semibold text-[#1a1c1d] border-2 border-slate-200 rounded-2xl px-5 py-3.5 bg-slate-50 hover:bg-white focus:bg-white focus:border-[#003f7a] outline-none transition-all placeholder:text-slate-400"
                  />
                  
                  <button
                    type="submit"
                    disabled={adding || !targetInput.trim()}
                    className="inline-flex justify-center items-center gap-2 bg-[#003f7a] text-white px-7 py-3.5 rounded-2xl font-bold text-xs hover:shadow-[3px_3px_0px_0px_#fecb00] active:scale-95 transition-all disabled:opacity-50 shrink-0"
                  >
                    {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                    Tambah Target
                  </button>
                </form>
              </div>

              <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,63,122,0.05)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#003f7a]/10 text-[#003f7a] p-2.5 rounded-2xl">
                      <Globe size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-headline font-bold text-[#1a1c1d]">Daftar Target Terdaftar</h3>
                      <p className="text-xs text-slate-500 font-medium">Menampilkan {filteredTargets.length} target aktif untuk dianalisis.</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchTargets}
                    className="p-2.5 rounded-full text-slate-500 hover:text-[#003f7a] hover:bg-slate-100 transition-colors"
                    title="Segarkan data target"
                  >
                    <RefreshCw size={18} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="overflow-x-auto border-2 border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f9f9fa] text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-100">
                      <tr>
                        <th className="p-4 pl-5">Platform</th>
                        <th className="p-4">Identitas / Tautan Target</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4">Jadwal</th>
                        <th className="p-4 pr-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                      {loading ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                          <tr key={`skel-target-${idx}`}>
                            <td className="p-4 pl-5"><div className="h-4 w-20 bg-slate-200 rounded-full animate-pulse"></div></td>
                            <td className="p-4"><div className="h-4 w-48 bg-slate-200 rounded-full animate-pulse"></div></td>
                            <td className="p-4"><div className="h-4 w-12 mx-auto bg-slate-200 rounded-full animate-pulse"></div></td>
                            <td className="p-4"><div className="h-4 w-16 bg-slate-200 rounded-full animate-pulse"></div></td>
                            <td className="p-4 pr-5 text-right"><div className="h-8 w-16 ml-auto bg-slate-200 rounded-full animate-pulse"></div></td>
                          </tr>
                        ))
                      ) : filteredTargets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-slate-400 font-bold text-sm">
                            Belum ada target yang didaftarkan pada kategori ini.
                          </td>
                        </tr>
                      ) : (
                        paginatedTargets.map((t) => {
                          const externalUrl = getTargetUrlLink(t.platform, t.target_id);
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-4 pl-5">
                                {renderPlatformBadge(t.platform)}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 max-w-xs md:max-w-sm">
                                  <span className="font-mono text-xs text-slate-800 truncate bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                    {t.target_id}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(t.target_id, t.id)}
                                    className="p-1 rounded text-slate-400 hover:text-[#003f7a] transition-colors"
                                    title="Salin Target ID"
                                  >
                                    {copiedId === t.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                  </button>
                                  {externalUrl && (
                                    <a
                                      href={externalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded text-slate-400 hover:text-[#003f7a] transition-colors"
                                      title="Buka Tautan Asli"
                                    >
                                      <ExternalLink size={14} />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleToggleActive(t.id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                                    t.is_active 
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200" 
                                      : "bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200"
                                  }`}
                                  title={t.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                                >
                                  <Power size={11} strokeWidth={3} />
                                  {t.is_active ? "Aktif" : "Mati"}
                                </button>
                              </td>
                              <td className="p-4 text-slate-500 font-medium">
                                {t.cron_time} WIB
                              </td>
                              <td className="p-4 pr-5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleRunSingle(t)}
                                    disabled={isProcessingQueue}
                                    className="p-2 rounded-xl bg-[#003f7a]/10 text-[#003f7a] hover:bg-[#003f7a] hover:text-white transition-colors"
                                    title="Tarik data target ini sekarang"
                                  >
                                    <Play size={14} strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={() => setTargetToDelete(t.id)}
                                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                                    title="Hapus target"
                                  >
                                    <Trash2 size={14} strokeWidth={2.5} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredTargets.length > targetPageSize && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">
                      Menampilkan {(targetPage - 1) * targetPageSize + 1} - {Math.min(targetPage * targetPageSize, filteredTargets.length)} dari {filteredTargets.length} target
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTargetPage(p => Math.max(1, p - 1))}
                        disabled={targetPage === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 active:scale-95 transition-all"
                      >
                        <ChevronLeft size={14} />
                        <span>Sebelumnya</span>
                      </button>
                      <span className="px-3 py-1 text-xs font-black bg-slate-100 text-[#003f7a] rounded-lg">
                        {targetPage} / {totalTargetPages}
                      </span>
                      <button
                        onClick={() => setTargetPage(p => Math.min(totalTargetPages, p + 1))}
                        disabled={targetPage === totalTargetPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 active:scale-95 transition-all"
                      >
                        <span>Berikutnya</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,63,122,0.05)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#fecb00]/20 text-[#003f7a] p-2.5 rounded-2xl">
                  <Database size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-[#1a1c1d]">Riwayat Penarikan Data</h3>
                  <p className="text-xs text-slate-500 font-medium">Log rekam jejak eksekusi mesin penarikan opini publik.</p>
                </div>
              </div>
              <button
                onClick={() => fetchLogs(logsMeta.page)}
                disabled={loadingLogs}
                className="p-2.5 rounded-full text-slate-500 hover:text-[#003f7a] hover:bg-slate-100 transition-colors"
                title="Segarkan riwayat"
              >
                <RefreshCw size={18} className={loadingLogs ? "animate-spin" : ""} strokeWidth={2.5} />
              </button>
            </div>

            <div className="overflow-x-auto border-2 border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f9f9fa] text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-100">
                  <tr>
                    <th className="p-4 pl-5">Waktu Eksekusi</th>
                    <th className="p-4">Platform</th>
                    <th className="p-4">Target Sumber</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Hasil Opini</th>
                    <th className="p-4 pr-5 text-right">Durasi</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                  {loadingLogs ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={`skel-log-${idx}`}>
                        <td className="p-4 pl-5"><div className="h-4 w-28 bg-slate-200 rounded-full animate-pulse"></div></td>
                        <td className="p-4"><div className="h-4 w-16 bg-slate-200 rounded-full animate-pulse"></div></td>
                        <td className="p-4"><div className="h-4 w-36 bg-slate-200 rounded-full animate-pulse"></div></td>
                        <td className="p-4"><div className="h-4 w-14 mx-auto bg-slate-200 rounded-full animate-pulse"></div></td>
                        <td className="p-4"><div className="h-4 w-16 mx-auto bg-slate-200 rounded-full animate-pulse"></div></td>
                        <td className="p-4 pr-5 text-right"><div className="h-4 w-12 ml-auto bg-slate-200 rounded-full animate-pulse"></div></td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 font-bold text-sm">
                        Belum ada riwayat penarikan data yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const dateFormatted = log.created_at 
                        ? new Date(log.created_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "-";

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 pl-5 text-slate-500 font-medium whitespace-nowrap">
                            {dateFormatted}
                          </td>
                          <td className="p-4">
                            {renderPlatformBadge(log.platform)}
                          </td>
                          <td className="p-4 max-w-xs">
                            <span className="font-mono text-xs text-slate-800 truncate block">
                              {log.target_id}
                            </span>
                            {log.error_message && (
                              <span className="text-[11px] text-rose-500 font-medium truncate block mt-0.5">
                                {log.error_message}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {log.status === "BERHASIL" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Berhasil
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                Gagal
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center font-bold">
                            <span className="text-emerald-700">+{log.comments_count}</span>
                          </td>
                          <td className="p-4 pr-5 text-right font-mono text-slate-500 text-xs">
                            {log.execution_time_sec}s
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {logsMeta.total_pages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  Menampilkan {(logsMeta.page - 1) * logsMeta.size + 1} - {Math.min(logsMeta.page * logsMeta.size, logsMeta.total)} dari {logsMeta.total} riwayat
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchLogs(logsMeta.page - 1)}
                    disabled={logsMeta.page <= 1 || loadingLogs}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    <ChevronLeft size={14} />
                    <span>Sebelumnya</span>
                  </button>
                  <span className="px-3 py-1 text-xs font-black bg-slate-100 text-[#003f7a] rounded-lg">
                    {logsMeta.page} / {logsMeta.total_pages}
                  </span>
                  <button
                    onClick={() => fetchLogs(logsMeta.page + 1)}
                    disabled={logsMeta.page >= logsMeta.total_pages || loadingLogs}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="col-span-1 lg:col-span-4 space-y-6">
          
          {activeTab === "survei" ? (
            <div className="bg-indigo-950 rounded-[2rem] p-8 text-white shadow-[6px_6px_0px_0px_#fecb00] border-2 border-indigo-900">
              <div className="bg-[#fecb00] text-[#003f7a] p-3.5 rounded-2xl inline-block mb-6 shadow-sm">
                <FileSpreadsheet size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-headline font-black mb-3">Impor Survei Kepuasan</h3>
              <p className="text-white/80 text-xs font-medium leading-relaxed mb-6">
                Ekstrak dan analisis masukan mahasiswa serta mitra kerja sama dari berkas survei Excel secara instan dan aman.
              </p>
              
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                  <span className="font-bold text-white text-xs block mb-0.5">Memori Peramban (Zero Storage)</span>
                  <span className="text-[11px] text-white/70">Berkas tidak disimpan di server, menjamin keamanan privasi responden.</span>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                  <span className="font-bold text-white text-xs block mb-0.5">Deteksi Kolom Cerdas</span>
                  <span className="text-[11px] text-white/70">Memisahkan komentar opini dari skala Likert angka 1-5 secara presisi.</span>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                  <span className="font-bold text-white text-xs block mb-0.5">Rekam Riwayat Otomatis</span>
                  <span className="text-[11px] text-white/70">Nama berkas asli tercatat pada tabel riwayat penarikan data.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#003f7a] rounded-[2rem] p-8 text-white shadow-[6px_6px_0px_0px_#fecb00] border-2 border-[#003f7a]">
              <div className="bg-[#fecb00] text-[#003f7a] p-3.5 rounded-2xl inline-block mb-6 shadow-sm">
                <PlayCircle size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-headline font-black mb-3">Tarik Data Sekarang</h3>
              <p className="text-white/80 text-xs font-medium leading-relaxed mb-8">
                Jalankan mesin crawler otomatis untuk menghimpun opini publik dari {filteredTargets.filter(t => t.is_active).length} target aktif pada kategori {activeTab === "all" ? "Semua Sumber" : activeTab.toUpperCase()} secara berurutan tanpa jeda manual.
              </p>
              
              <button
                onClick={handleStartQueue}
                disabled={isProcessingQueue || filteredTargets.filter(t => t.is_active).length === 0}
                className="w-full flex justify-center items-center gap-3 bg-[#fecb00] text-[#003f7a] px-6 py-4 rounded-full font-black text-sm hover:bg-white active:scale-95 transition-all disabled:opacity-40 shadow-sm"
              >
                {isProcessingQueue ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Sedang Mengumpulkan...</span>
                  </>
                ) : (
                  <>
                    <Activity size={20} strokeWidth={2.5} />
                    <span>Mulai Pengumpulan Data</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Informasi Engine Penarikan</h4>
            <div className="space-y-3 text-xs text-slate-600 font-medium leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">Antrean Cerdas (Anti-Bentrok)</span>
                Sistem menarik target secara berurutan dan mengisolasi kegagalan agar URL yang valid tetap sukses tersimpan.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">Jadwal Auto-Pilot</span>
                Mesin cron berjalan setiap hari pukul 02:00 WIB untuk memperbarui persepsi publik secara otomatis.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
