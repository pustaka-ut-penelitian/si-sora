import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { Loader2, PieChart as PieIcon, BarChart3, Sparkles, Database, DownloadCloud, Activity, Info, TrendingUp, Smartphone, Smile, Frown, Meh, RefreshCw, Trash2, History, X } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LabelList, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import ReactMarkdown from "react-markdown";
import logoImage from "../assets/logo.png";
import utLogo from "../assets/logo ut.png";

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [topics, setTopics] = useState<any>([]);
  const [trendData, setTrendData] = useState<any>([]);
  const [platformData, setPlatformData] = useState<any>([]);
  
  const [insight, setInsight] = useState<string>("");
  const [insightDate, setInsightDate] = useState<string>("");
  const [insightHistory, setInsightHistory] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [wordCloud, setWordCloud] = useState<{image: string, sentiment: string} | null>(null);
  const [activeWordCloudTab, setActiveWordCloudTab] = useState<"all" | "positif" | "negatif" | "netral">("all");
  const [wordCloudCache, setWordCloudCache] = useState<Record<string, {image: string, sentiment: string}>>({});
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [loadingWordCloud, setLoadingWordCloud] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchInsightHistory = async (page = 1) => {
    try {
      const res = await apiClient.get(`/api/stats/insight/history?page=${page}&size=5`);
      setInsightHistory(res.data.data.items);
      setHistoryPage(res.data.data.page);
      setHistoryTotalPages(res.data.data.total_pages);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInsight = async () => {
    setLoadingInsight(true);
    try {
      const insightRes = await apiClient.get("/api/stats/insight/current");
      setInsight(insightRes.data.data.insight_text);
      setInsightDate(insightRes.data.data.created_at);
      fetchInsightHistory();
    } catch (err) {
      setInsight("Tidak dapat memuat rangkuman AI saat ini.");
    } finally {
      setLoadingInsight(false);
    }
  };

  const fetchWordCloud = async (targetSentiment: "all" | "positif" | "negatif" | "netral" = activeWordCloudTab) => {
    setLoadingWordCloud(true);
    try {
      const layout = window.innerWidth < 768 ? "mobile" : "desktop";
      const wcRes = await apiClient.get(`/api/stats/wordcloud?sentiment=${targetSentiment}&layout=${layout}`);
      setWordCloud(wcRes.data.data);
      setWordCloudCache(prev => ({ ...prev, [targetSentiment]: wcRes.data.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWordCloud(false);
    }
  };

  const handleTabChange = (tab: "all" | "positif" | "negatif" | "netral") => {
    setActiveWordCloudTab(tab);
    if (wordCloudCache[tab]) {
      setWordCloud(wordCloudCache[tab]);
    } else {
      fetchWordCloud(tab);
    }
  };

  const handleForceGenerate = async () => {
    setGeneratingInsight(true);
    try {
      const insightRes = await apiClient.post("/api/stats/insight/generate");
      setInsight(insightRes.data.data.insight_text);
      setInsightDate(insightRes.data.data.created_at);
      fetchInsightHistory();
      setShowHistory(false);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingInsight(false);
    }
  };

  const handleDeleteInsight = async (id: string) => {
    try {
      await apiClient.delete(`/api/stats/insight/${id}`);
      fetchInsight();
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [overviewRes, topicsRes, trendRes, platformRes] = await Promise.all([
          apiClient.get("/api/stats/overview"),
          apiClient.get("/api/stats/topics"),
          apiClient.get("/api/stats/trend"),
          apiClient.get("/api/stats/platform")
        ]);
        setStats(overviewRes.data.data);
        setTopics(topicsRes.data.data);
        setTrendData(trendRes.data.data);
        setPlatformData(platformRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchInsight = async () => {
      setLoadingInsight(true);
      try {
        const insightRes = await apiClient.get("/api/stats/insight/current");
        setInsight(insightRes.data.data.insight_text);
        setInsightDate(insightRes.data.data.created_at);
        fetchInsightHistory();
      } catch (err) {
        setInsight("Tidak dapat memuat rangkuman AI saat ini.");
      } finally {
        setLoadingInsight(false);
      }
    };

    fetchStats();
    fetchInsight();
    fetchWordCloud();
  }, []);



  const pieData = stats ? [
    { name: 'Positif', value: stats.raw_counts.positif, fill: '#52b788' },
    { name: 'Negatif', value: stats.raw_counts.negatif, fill: '#f87171' },
    { name: 'Netral', value: stats.raw_counts.netral, fill: '#94a3b8' },
  ].filter(d => d.value > 0) : [];

  const formatDateID = (isoString?: string) => {
    if (!isoString) return "Belum Ada Data";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  const renderSentimentBadge = () => {
    if (loadingStats) {
      return (
        <div className="bg-white border-2 border-slate-200 px-5 h-[68px] rounded-2xl flex flex-col justify-center gap-2 shadow-[2px_2px_0px_0px_#cbd5e1] min-w-[240px]">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <Loader2 size={14} className="animate-spin" />
            Menganalisis...
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full w-full"></div>
        </div>
      );
    }
    
    if (!stats || stats.total_data === 0 || !stats.dominant_sentiment) {
      return (
        <div className="bg-white border-2 border-slate-200 px-5 h-[68px] rounded-2xl flex flex-col justify-center gap-2 shadow-[2px_2px_0px_0px_#cbd5e1] min-w-[240px]">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wide">
            <Info size={14} strokeWidth={2.5} />
            Belum Ada Data
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full w-full"></div>
        </div>
      );
    }

    const dominantType = stats.dominant_sentiment;
    const pctString = stats[`${dominantType}_pct`] || "0%";
    const posVal = parseInt(stats.positif_pct) || 0;
    const neuVal = parseInt(stats.netral_pct) || 0;
    const score = posVal + (neuVal * 0.5);

    let labelColor = "text-slate-700";
    let labelText = "Stabil / Netral";
    if (dominantType === 'positif') {
      labelColor = "text-emerald-600";
      labelText = "Cenderung Positif";
    } else if (dominantType === 'negatif') {
      labelColor = "text-rose-600";
      labelText = "Cenderung Negatif";
    }

    return (
      <div className="bg-white/80 backdrop-blur-md border-2 border-slate-200 px-5 h-[68px] rounded-2xl flex flex-col justify-center gap-3 shadow-[2px_2px_0px_0px_#cbd5e1] min-w-[240px] transition-transform hover:-translate-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opini Publik</span>
          <span className={`text-xs font-extrabold ${labelColor}`}>{labelText} ({pctString})</span>
        </div>
        
        <div className="relative w-full h-2.5 bg-gradient-to-r from-rose-500 via-slate-300 to-emerald-500 rounded-full border border-slate-200 shadow-inner">
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#1a1c1d] rounded-full shadow-sm transition-all duration-1000 ease-out"
            style={{ left: `calc(${score}% - 8px)` }}
          ></div>
        </div>
      </div>
    );
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize={14} 
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 shadow-[6px_6px_0px_0px_#003f7a] rounded-[2rem] p-6 md:p-8 flex flex-col w-full animate-slide-up transition-transform hover:-translate-y-1">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="bg-[#003f7a] text-white p-2.5 font-bold rounded-[1rem] shadow-sm flex items-center justify-center shrink-0">
                <img src={logoImage} alt="Logo SI SORA" className="h-6 md:h-8" />
              </div>
              <img src={utLogo} alt="Logo Universitas Terbuka" className="h-9 object-contain md:hidden" />
            </div>
            <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-[#1a1c1d] tracking-tight">
              Sistem Informasi Social Opinion Reaction Analytics
            </h1>
          </div>
          
          <div className="hidden md:flex flex-row items-center justify-end gap-3 shrink-0">
            <img src={utLogo} alt="Logo Universitas Terbuka" className="h-10 md:h-12 object-contain" />
          </div>
        </div>

        <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed w-full mb-8">
          Platform <span className="italic">intelligence</span> dan pemantauan opini publik berbasis kecerdasan buatan (AI) yang mengumpulkan, mengklasifikasikan sentimen, serta menganalisis aspirasi masyarakat terhadap Universitas Terbuka dari berbagai platform digital.
        </p>

        <div className="flex flex-col xl:flex-row xl:items-stretch justify-between gap-6 w-full">
          <div className="flex flex-wrap items-stretch gap-3">
            {renderSentimentBadge()}
            <button 
              onClick={() => navigate('/jobs')}
              className="flex items-stretch border-2 border-slate-200 w-fit h-[68px] rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_#cbd5e1] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#cbd5e1] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#cbd5e1] transition-all text-left bg-white/80 backdrop-blur-md"
            >
              <div className="bg-emerald-500 w-12 flex flex-col items-center justify-center border-r-2 border-slate-200 relative overflow-hidden shrink-0">
                <svg className="text-white w-5 h-5 absolute" style={{ animation: 'spin 4s linear infinite' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
              </div>
              <div className="px-4 h-full flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-wider">Komentar Sentimen Terakhir DItarik</span>
                <span className="text-sm font-extrabold text-slate-800 tracking-tight">
                  {loadingStats ? "Memuat..." : formatDateID(stats?.last_collected_at)}
                </span>
              </div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button 
              onClick={() => navigate('/explorer')}
              className="bg-[#003f7a] text-white border-2 border-[#003f7a] shadow-[4px_4px_0px_0px_#003f7a] rounded-full px-6 py-3.5 font-extrabold text-sm w-full sm:w-auto flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#003f7a] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#003f7a]"
            >
              <Database size={16} strokeWidth={2.5} />
              Eksplorasi Data
            </button>
            <button 
              onClick={() => navigate('/jobs')}
              className="bg-white text-[#003f7a] border-2 border-slate-300 shadow-[4px_4px_0px_0px_#cbd5e1] rounded-full px-6 py-3.5 font-extrabold text-sm w-full sm:w-auto flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#cbd5e1] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#cbd5e1]"
            >
              <DownloadCloud size={16} strokeWidth={2.5} />
              Penarikan Data
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          
          <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col transition-transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Database size={64} />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-full">
                <Activity size={18} strokeWidth={2.5} />
              </div>
              <p className="text-slate-600 font-bold uppercase tracking-wider text-xs">Total Analisis</p>
            </div>
            <div className="mt-auto relative z-10">
              <p className="text-5xl font-headline font-extrabold text-[#1a1c1d]">{loadingStats ? '-' : stats?.total_data || 0}</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Komentar & Opini Publik</p>
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col transition-transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Smile size={64} className="text-[#52b788]" />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-[#52b788]/10 text-[#52b788] rounded-full">
                <Smile size={18} strokeWidth={2.5} />
              </div>
              <p className="text-slate-600 font-bold uppercase tracking-wider text-xs">Sentimen Positif</p>
            </div>
            <div className="mt-auto relative z-10">
              <p className="text-5xl font-headline font-extrabold text-[#52b788]">{loadingStats ? '-' : stats?.positif_pct || "0%"}</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Setara dengan <span className="font-bold text-[#52b788]">{stats?.raw_counts?.positif || 0} unit</span> data</p>
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col transition-transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Frown size={64} className="text-[#f87171]" />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-[#f87171]/10 text-[#f87171] rounded-full">
                <Frown size={18} strokeWidth={2.5} />
              </div>
              <p className="text-slate-600 font-bold uppercase tracking-wider text-xs">Sentimen Negatif</p>
            </div>
            <div className="mt-auto relative z-10">
              <p className="text-5xl font-headline font-extrabold text-[#f87171]">{loadingStats ? '-' : stats?.negatif_pct || "0%"}</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Setara dengan <span className="font-bold text-[#f87171]">{stats?.raw_counts?.negatif || 0} unit</span> data</p>
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col transition-transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Meh size={64} className="text-[#94a3b8]" />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-slate-100 text-slate-500 rounded-full">
                <Meh size={18} strokeWidth={2.5} />
              </div>
              <p className="text-slate-600 font-bold uppercase tracking-wider text-xs">Sentimen Netral</p>
            </div>
            <div className="mt-auto relative z-10">
              <p className="text-5xl font-headline font-extrabold text-[#94a3b8]">{loadingStats ? '-' : stats?.netral_pct || "0%"}</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Setara dengan <span className="font-bold text-slate-500">{stats?.raw_counts?.netral || 0} unit</span> data</p>
            </div>
          </div>

        </div>

        <div className="col-span-1 lg:col-span-4 bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col h-[360px] animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-slate-50 text-[#003f7a] rounded-full">
              <PieIcon size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-headline font-bold text-[#1a1c1d]">Proporsi Sentimen</h3>
          </div>
          <div className="flex-1 min-h-0">
            {loadingStats ? (
               <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-bold text-slate-400 text-sm">Data kosong</div>
            )}
          </div>
        </div>


        <div className="col-span-1 lg:col-span-8 bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col h-[360px] animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-slate-50 text-[#003f7a] rounded-full">
              <BarChart3 size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-headline font-bold text-[#1a1c1d]">Topik Diskusi Utama</h3>
          </div>
          <div className="flex-1 min-h-0">
            {loadingStats ? (
               <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
            ) : topics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topics} layout="vertical" margin={{ top: 0, right: 32, left: 16, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    width={90}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#003f7a" radius={[0, 999, 999, 0]} barSize={20}>
                    <LabelList dataKey="count" position="right" fill="#1a1c1d" fontSize={12} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-bold text-slate-400 text-sm">Data kosong</div>
            )}
          </div>
        </div>
        
        <div className="col-span-1 lg:col-span-6 bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col h-[360px] animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-slate-50 text-[#003f7a] rounded-full">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-headline font-bold text-[#1a1c1d]">Tren Sentimen</h3>
          </div>
          <div className="flex-1 min-h-0">
            {loadingStats ? (
               <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                  <Area type="monotone" dataKey="positif" stackId="1" stroke="#52b788" fill="#52b788" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="netral" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="negatif" stackId="1" stroke="#f87171" fill="#f87171" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-bold text-slate-400 text-sm">Data kosong</div>
            )}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-6 bg-white/85 backdrop-blur-md border-2 border-slate-200 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_#cbd5e1] flex flex-col h-[360px] animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-slate-50 text-[#003f7a] rounded-full">
              <Smartphone size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-headline font-bold text-[#1a1c1d]">Sentimen per Platform</h3>
          </div>
          <div className="flex-1 min-h-0">
            {loadingStats ? (
               <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
            ) : platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} layout="vertical" margin={{ top: 0, right: 32, left: 16, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="platform" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                  <Bar dataKey="positif" stackId="a" fill="#52b788" barSize={20}>
                    <LabelList dataKey="positif" position="inside" fill="#fff" fontSize={11} fontWeight="bold" formatter={(val: any) => val > 0 ? val : ''} />
                  </Bar>
                  <Bar dataKey="netral" stackId="a" fill="#94a3b8" barSize={20}>
                    <LabelList dataKey="netral" position="inside" fill="#fff" fontSize={11} fontWeight="bold" formatter={(val: any) => val > 0 ? val : ''} />
                  </Bar>
                  <Bar dataKey="negatif" stackId="a" fill="#f87171" radius={[0, 999, 999, 0]} barSize={20}>
                    <LabelList dataKey="negatif" position="inside" fill="#fff" fontSize={11} fontWeight="bold" formatter={(val: any) => val > 0 ? val : ''} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-bold text-slate-400 text-sm">Data kosong</div>
            )}
          </div>
        </div>
        
        <div className="col-span-1 lg:col-span-12 bg-white/85 backdrop-blur-md rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-[4px_4px_0px_0px_#cbd5e1] border-2 border-slate-200 animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '300ms' }}>
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#2d68ff]/10 text-[#2d68ff] p-2.5 rounded-full">
                <PieIcon size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-headline font-bold text-[#1a1c1d]">Word Cloud</h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleTabChange("all")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeWordCloudTab === "all"
                    ? "bg-[#003f7a] text-white shadow-[2px_2px_0px_0px_#001a33] scale-105"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua Sentimen
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("positif")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeWordCloudTab === "positif"
                    ? "bg-[#52b788] text-white shadow-[2px_2px_0px_0px_#2d7a54] scale-105"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Positif
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("negatif")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeWordCloudTab === "negatif"
                    ? "bg-[#f87171] text-white shadow-[2px_2px_0px_0px_#c53030] scale-105"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                Negatif
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("netral")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeWordCloudTab === "netral"
                    ? "bg-slate-600 text-white shadow-[2px_2px_0px_0px_#334155] scale-105"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Netral
              </button>
            </div>
          </div>
          
          <div className="w-full flex items-center justify-center bg-[#f9f9fa] rounded-[1.5rem] border-2 border-dashed border-[#c2c6d3] relative overflow-hidden p-6 md:p-10 min-h-[320px]">
            {loadingWordCloud ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-slate-400">
                <Loader2 size={36} className="animate-spin text-[#2d68ff]" />
                <p className="font-bold tracking-wide uppercase text-xs">Membentuk Visualisasi Kata...</p>
              </div>
            ) : wordCloud ? (
              <div className="relative group w-full flex items-center justify-center">
                <img src={wordCloud.image} alt="Word Cloud" className="w-full h-auto object-contain drop-shadow-xl hover:scale-[1.02] transition-transform duration-500" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-5 py-2 rounded-full shadow-[2px_2px_0px_0px_#c2c6d3] border-2 border-[#c2c6d3] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <span className="text-xs font-black uppercase tracking-wider text-[#1a1c1d] flex items-center gap-2">
                    Kategori: 
                    <span className={
                      activeWordCloudTab === 'positif' ? 'text-[#52b788]' : 
                      activeWordCloudTab === 'negatif' ? 'text-[#f87171]' : 
                      activeWordCloudTab === 'netral' ? 'text-[#64748b]' :
                      'text-[#003f7a]'
                    }>
                      {activeWordCloudTab === 'all' ? 'Kombinasi Seluruh Sentimen' : `Sentimen ${activeWordCloudTab}`}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 font-bold uppercase text-xs tracking-wider">Visualisasi Tidak Tersedia</p>
            )}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-12 bg-[#003f7a]/85 backdrop-blur-md rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-sm animate-slide-up hover:-translate-y-1 transition-transform" style={{ animationDelay: '400ms' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#fecb00]/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-[#fecb00] text-[#003f7a] p-2.5 rounded-full shadow-lg shrink-0">
                <Sparkles size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-headline font-black text-white tracking-wide uppercase">Rangkuman Sentimen Publik</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-[#fecb00] font-bold text-[10px] md:text-xs uppercase tracking-wider bg-[#fecb00]/10 border border-[#fecb00]/20 px-2 py-0.5 rounded-md">Generated by AI</span>
                  {insightDate && <span className="text-white/70 text-xs font-medium">| {formatDateID(insightDate)}</span>}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pl-14 md:pl-0 shrink-0">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl transition-colors text-xs md:text-sm font-bold border-2 ${showHistory ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/90 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
              >
                <History size={16} /> Riwayat
              </button>
              <button 
                onClick={handleForceGenerate}
                disabled={generatingInsight}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-[#fecb00] border-2 border-[#fecb00] hover:bg-transparent hover:text-[#fecb00] text-[#003f7a] rounded-xl transition-colors text-xs md:text-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-y-0.5"
              >
                <RefreshCw size={16} className={generatingInsight ? "animate-spin" : ""} strokeWidth={2.5} /> 
                {generatingInsight ? "Memproses..." : "Generate Ulang"}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col-reverse xl:flex-row gap-6 relative z-10">
            <div className={`transition-all duration-300 ${showHistory ? 'xl:w-2/3' : 'w-full'}`}>
              {(loadingInsight || generatingInsight) ? (
                <div className="flex items-center gap-3 text-sm text-white/50 animate-pulse pl-14 md:pl-0">
                  <Loader2 size={18} className="animate-spin" />
                  <p className="font-medium tracking-wide">Menyusun rangkuman eksekutif mendalam...</p>
                </div>
              ) : (
                <div className="w-full animate-fade-in text-white/95 max-w-none md:pl-14 [&>h3]:text-[#fecb00] [&>h3]:font-black [&>h3]:text-lg [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:uppercase [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:space-y-2 [&>ul]:mb-6 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:space-y-2 [&>ol]:mb-6 [&>p]:leading-relaxed [&>p]:mb-4 font-medium text-[15px] md:text-base tracking-wide bg-black/10 p-6 md:p-8 rounded-2xl border border-white/5 shadow-inner">
                  <ReactMarkdown>{insight}</ReactMarkdown>
                </div>
              )}
            </div>
            
            {showHistory && (
              <div className="xl:w-1/3 bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex flex-col h-[500px] animate-fade-in shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                  <h4 className="text-white font-bold flex items-center gap-2 uppercase tracking-wider text-sm"><History size={16} className="text-[#fecb00]"/> Riwayat Generasi AI</h4>
                  <button onClick={() => setShowHistory(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar mb-4">
                  {insightHistory.length === 0 ? (
                     <p className="text-white/40 text-sm text-center py-8 font-medium">Belum ada riwayat rangkuman.</p>
                  ) : (
                    insightHistory.map((hist) => (
                      <div key={hist.id} className={`p-4 rounded-xl border-2 ${hist.created_at === insightDate ? 'bg-white/10 border-[#fecb00]/50 shadow-[0_0_15px_rgba(254,203,0,0.15)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'} transition-all relative group`}>
                         <div className="flex justify-between items-start mb-2">
                           <p className="text-white font-bold text-sm">{formatDateID(hist.created_at)}</p>
                           <button 
                             onClick={() => handleDeleteInsight(hist.id)}
                             className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-rose-400/20 rounded-md shrink-0"
                             title="Hapus Rangkuman"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                         <p className="text-white/60 text-xs line-clamp-2 font-medium mb-3 leading-relaxed">{hist.insight_text}</p>
                         {hist.created_at !== insightDate && (
                           <button
                             onClick={() => {
                               setInsight(hist.insight_text);
                               setInsightDate(hist.created_at);
                             }}
                             className="text-xs text-[#fecb00] font-bold hover:underline flex items-center gap-1"
                           >
                             Tampilkan Rangkuman Ini
                           </button>
                         )}
                         {hist.created_at === insightDate && (
                           <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-400/10 px-2 py-1 rounded w-fit">
                             Sedang Ditampilkan
                           </span>
                         )}
                      </div>
                    ))
                  )}
                </div>
                
                {historyTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0">
                    <button 
                      onClick={() => fetchInsightHistory(historyPage - 1)}
                      disabled={historyPage === 1}
                      className="text-xs font-bold text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs text-white/50 font-medium">Halaman {historyPage} / {historyTotalPages}</span>
                    <button 
                      onClick={() => fetchInsightHistory(historyPage + 1)}
                      disabled={historyPage === historyTotalPages}
                      className="text-xs font-bold text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
