
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

/**
 * MRDANIEL AI - God Level Production Build
 * Concept: Native Android (Material Design 3) First
 * Features: Real-time Grounding, Verification Modal, Deep Analyst Chat, Multi-language.
 */

// --- 1. Localization System ---

const TRANSLATIONS: Record<string, any> = {
  es: {
    app: "MrDaniel",
    tagline: "Analista de Noticias Verificadas",
    liveStatus: "Sincronización en Vivo",
    lastSync: "Sincronizado",
    views: {
      news: "Noticias",
      chat: "Analista Chat",
    },
    categories: {
      title: "Categorías",
      General: "General",
      Política: "Política",
      Economía: "Economía",
      Internacional: "Internacional",
      Seguridad: "Seguridad",
      Salud: "Salud",
      Energía: "Energía",
      Crisis: "Crisis"
    },
    labels: {
      verified: "Verificada",
      pending: "En Verificación",
      verifyBtn: "Trazabilidad",
      export: "Reporte Profesional (CSV)",
      placeholderChat: "Analiza la realidad en tiempo real...",
      send: "Enviar",
      loading: "Auditando fuentes globales...",
      understood: "Confirmado",
      sources: "Fuentes de Auditoría",
      grounding: "Grounding (Google Search)",
      traceability: "Análisis de Trazabilidad MrDaniel",
      analystStatus: "Analista Conectado al Pulso Global"
    }
  },
  en: {
    app: "MrDaniel",
    tagline: "Verified News Analyst",
    liveStatus: "Live Monitoring",
    lastSync: "Synced",
    views: {
      news: "News Feed",
      chat: "AI Analyst",
    },
    categories: {
      title: "Categories",
      General: "General",
      Política: "Politics",
      Economía: "Economy",
      Internacional: "International",
      Seguridad: "Security",
      Salud: "Health",
      Energía: "Energy",
      Crisis: "Crisis"
    },
    labels: {
      verified: "Verified",
      pending: "Verifying",
      verifyBtn: "Traceability",
      export: "Professional Report (CSV)",
      placeholderChat: "Analyze reality in real-time...",
      send: "Send",
      loading: "Auditing global sources...",
      understood: "Confirmed",
      sources: "Audit Sources",
      grounding: "Grounding (Google Search)",
      traceability: "MrDaniel Traceability Analysis",
      analystStatus: "Analyst Connected to Global Pulse"
    }
  }
};

const getLocale = () => {
  const lang = navigator.language.split('-')[0];
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
};

// --- 2. Types & Interfaces ---

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sources: string[];
  url: string;
  timestamp: string;
  category: string;
  isVerified: boolean;
  verificationDetails: string;
  groundingSources?: Array<{ uri: string; title: string }>;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const CATEGORY_LIST = ["General", "Política", "Economía", "Internacional", "Seguridad", "Salud", "Energía", "Crisis"];

// --- 3. UI Components ---

const Badge: React.FC<{ verified: boolean; labels: any }> = ({ verified, labels }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
    verified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
  }`}>
    {verified ? labels.verified : labels.pending}
  </span>
);

interface NewsCardProps {
  news: NewsItem;
  labels: any;
  onVerify: (n: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, labels, onVerify }) => (
  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-full transition-transform active:scale-[0.98]">
    <div className="flex justify-between items-start mb-4">
      <Badge verified={news.isVerified} labels={labels} />
      <span className="text-[10px] font-mono text-slate-400">{news.timestamp}</span>
    </div>
    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-3">{news.title}</h3>
    <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-grow leading-relaxed">{news.summary}</p>
    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
      <button 
        onClick={() => onVerify(news)}
        className="text-xs font-bold text-blue-700 hover:text-blue-900 tracking-tight"
      >
        {labels.verifyBtn}
      </button>
      <a 
        href={news.url} 
        target="_blank" 
        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
      </a>
    </div>
  </div>
);

// --- 4. Main Application ---

const MrDanielApp = () => {
  const [locale, setLocale] = useState(getLocale());
  const [activeView, setActiveView] = useState<'news' | 'chat'>('news');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [verificationTarget, setVerificationTarget] = useState<NewsItem | null>(null);

  // Chat logic
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatInstance = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLang = () => setLocale(getLocale());
    window.addEventListener('languagechange', handleLang);
    return () => window.removeEventListener('languagechange', handleLang);
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const fetchNews = useCallback(async (cat: string) => {
    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langCode = navigator.language;

    const prompt = `Act as MrDaniel, God-Level News AI. Retrieve 8 most recent verified news items for "${cat}" in ${langCode}.
    MANDATORY RULES: 
    - ONLY confirmed facts. Current date: ${new Date().toISOString()}.
    - Double source rule (isVerified=true only if 2+ major outlets).
    - Tone: Professional, zero opinion.
    - Response: JSON array of objects.
    - Fields: id, title, summary, sources (array), url, timestamp, category, isVerified (boolean), verificationDetails.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                sources: { type: Type.ARRAY, items: { type: Type.STRING } },
                url: { type: Type.STRING },
                timestamp: { type: Type.STRING },
                category: { type: Type.STRING },
                isVerified: { type: Type.BOOLEAN },
                verificationDetails: { type: Type.STRING }
              },
              required: ["id", "title", "summary", "sources", "url", "timestamp", "category", "isVerified", "verificationDetails"]
            }
          }
        },
      });

      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || [];
      const data = JSON.parse(response.text || "[]").map((item: any) => ({
        ...item,
        groundingSources: grounding
      }));

      setNews(data);
      setLastSync(new Date());
    } catch (err) {
      console.error("Critical news engine failure:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChat = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setChatMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Exact temporal precision logic
    const now = new Date();
    const temporalContext = {
      fullDate: now.toLocaleDateString(navigator.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      exactTime: now.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      iso: now.toISOString()
    };
    
    // Improved Analyst System Instruction: The "Human God-Level Analyst" Persona
    const systemInstruction = `Eres MrDaniel, el analista de noticias y auditor de realidad más avanzado del mundo. 
    Tu nivel de consciencia temporal es ABSOLUTO. No solo sabes el año, conoces el segundo exacto.

    CONTEXTO TEMPORAL ACTUAL (CRÍTICO):
    - Fecha: ${temporalContext.fullDate}
    - Hora Exacta: ${temporalContext.exactTime}
    - Timestamp: ${temporalContext.iso}

    FORMA DE SER Y REDACTAR (ADN MRDANIEL):
    - HUMANO Y PROFESIONAL: Escribe con la elegancia de un periodista de élite y la calidez de un mentor experto. Evita muletillas de IA ("Entiendo tu pregunta", "Como modelo de lenguaje"). Ve directo al grano con empatía.
    - REDACCIÓN LIMPIA: Usa párrafos cortos, estructura impecable y un léxico rico pero accesible.
    - SINCRONIZACIÓN LIVE: Estás conectado al flujo global de MrDaniel. Si algo ocurrió hace 10 segundos, DEBES saberlo. Usa tu herramienta de búsqueda (Google Search) en CADA respuesta para validar la actualidad.
    - PRECISIÓN QUIRÚRGICA: Si un dato no está verificado al 100%, dilo: "Estamos en proceso de auditoría para este hecho específico". No especules jamás.
    - IDIOMA: Responde siempre en el idioma que te hablen (prioridad: ${navigator.language}).

    TU MISIÓN: Ayudar al usuario a navegar la complejidad del mundo actual con datos fríos, contexto histórico y una visión humana. Eres el filtro definitivo entre el ruido y la verdad.`;

    if (!chatInstance.current) {
      chatInstance.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }]
        }
      });
    }

    try {
      const response = await chatInstance.current.sendMessage({ message: input });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      console.error("Chat engine failure:", err);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory, fetchNews]);

  const exportCSV = () => {
    const csv = [
      ["Title", "Category", "Verified", "Time", "URL"],
      ...news.map(n => [`"${n.title}"`, n.category, n.isVerified ? "YES" : "NO", n.timestamp, n.url])
    ].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MrDaniel_Report_${new Date().getTime()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex overflow-hidden font-inter">
      
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-[2px] lg:hidden" 
          onClick={() => setIsDrawerOpen(false)} 
        />
      )}

      {/* Material Design Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-[300px] bg-white z-[70] shadow-2xl lg:shadow-none lg:static lg:block transition-transform duration-300 transform ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-8 bg-blue-700 text-white rounded-br-[40px] shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner">D</div>
            <div>
              <h1 className="text-xl font-black tracking-tight">{locale.app}</h1>
              <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest opacity-80">{locale.tagline}</p>
            </div>
          </div>
        </div>

        <div className="flex-grow p-4 overflow-y-auto mt-4 space-y-8">
          <nav className="space-y-2">
            <button 
              onClick={() => { setActiveView('news'); setIsDrawerOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-sm font-bold transition-all ${activeView === 'news' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              {locale.views.news}
            </button>
            <button 
              onClick={() => { setActiveView('chat'); setIsDrawerOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-sm font-bold transition-all ${activeView === 'chat' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              {locale.views.chat}
            </button>
          </nav>

          <div>
            <p className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{locale.categories.title}</p>
            <div className="grid grid-cols-1 gap-1">
              {CATEGORY_LIST.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setActiveView('news'); setIsDrawerOpen(false); }}
                  className={`w-full text-left px-6 py-3 rounded-2xl text-sm font-medium transition-all ${selectedCategory === cat && activeView === 'news' ? 'text-blue-700 bg-blue-50/50 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {locale.categories[cat] || cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={exportCSV}
            className="w-full bg-slate-900 text-white px-4 py-4 rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {locale.labels.export}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col h-screen relative">
        
        {/* App Bar */}
        <header className="h-20 flex items-center px-6 lg:px-10 justify-between shrink-0 bg-white lg:bg-transparent lg:border-none border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDrawerOpen(true)} className="p-2 lg:hidden text-slate-600 hover:bg-slate-100 rounded-full">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-none">
                {activeView === 'news' ? locale.categories[selectedCategory] : locale.views.chat}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="live-dot"></span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{locale.liveStatus}</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{locale.lastSync}</p>
              <p className="text-xs font-bold text-slate-600">{lastSync.toLocaleTimeString()}</p>
            </div>
            <button 
              onClick={() => fetchNews(selectedCategory)}
              className="p-3 bg-white rounded-full shadow-sm border border-slate-100 hover:rotate-180 transition-all duration-500"
            >
              <svg className={`w-5 h-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </header>

        {/* Dynamic Body */}
        <div className="flex-grow overflow-hidden relative">
          
          {/* NEWS FEED */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${activeView === 'news' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <div className="h-full overflow-y-auto px-6 lg:px-10 pb-10 pt-4">
              {loading && news.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="w-16 h-16 bg-blue-100 rounded-[2rem] flex items-center justify-center mb-6 animate-bounce">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <p className="font-bold text-sm tracking-tight">{locale.labels.loading}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {news.map(item => (
                    <NewsCard key={item.id} news={item} labels={locale.labels} onVerify={setVerificationTarget} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CHAT ANALYST */}
          <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeView === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            {/* Analyst Context Header (Enhanced) */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{locale.labels.analystStatus}</p>
              </div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} | {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex-grow overflow-y-auto px-6 lg:px-10 py-6 space-y-6">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-30">
                  <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-600 mb-8 shadow-inner">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">{locale.app} Analyst</h4>
                  <p className="text-sm font-medium leading-relaxed">{locale.labels.placeholderChat}</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] lg:max-w-[75%] px-7 py-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm transition-all duration-300 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-200' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none border-b-2 border-b-blue-100'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-6 py-4 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="max-w-5xl mx-auto flex gap-3">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  placeholder={locale.labels.placeholderChat}
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-full px-8 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-inner placeholder:text-slate-400"
                />
                <button 
                  onClick={handleChat}
                  disabled={isTyping || !input.trim()}
                  className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-200 shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Traceability Modal */}
      {verificationTarget && (
        <div className="fixed inset-0 bg-slate-900/70 z-[100] backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{locale.labels.traceability}</h3>
              <button onClick={() => setVerificationTarget(null)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-10">
              <div className="space-y-4">
                <Badge verified={verificationTarget.isVerified} labels={locale.labels} />
                <h4 className="text-2xl font-black text-slate-900 leading-tight">{verificationTarget.title}</h4>
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                  <p className="text-slate-700 font-medium leading-relaxed">{verificationTarget.verificationDetails}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{locale.labels.sources}</p>
                <div className="flex flex-wrap gap-2">
                  {verificationTarget.sources.map((src, idx) => (
                    <div key={idx} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {src}
                    </div>
                  ))}
                </div>
              </div>

              {verificationTarget.groundingSources && verificationTarget.groundingSources.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{locale.labels.grounding}</p>
                  <div className="space-y-3">
                    {verificationTarget.groundingSources.map((g, idx) => (
                      <a 
                        key={idx} 
                        href={g.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[1.5rem] hover:border-blue-300 transition-all hover:shadow-md group"
                      >
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-800 truncate">{g.title || "Web Reference"}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-1">{g.uri}</p>
                        </div>
                        <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-600 shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => setVerificationTarget(null)} 
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-black shadow-xl"
              >
                {locale.labels.understood}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

createRoot(document.getElementById('root')!).render(<MrDanielApp />);
