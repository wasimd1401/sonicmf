
import React, { useState, useRef } from 'react';
import { 
  Play, Pause, Mic2, Activity, Zap, Layers, Sliders, 
  MessageSquare, ChevronRight, AlertCircle, 
  Check, X, Copy, Ghost, Sparkles, Loader2, PenTool, RefreshCw,
  TrendingUp, Search, Headphones, Settings2, Image as ImageIcon, Plus, Briefcase, Globe, Users, Target, Smartphone, Instagram, Twitter, Clock, Hash, Music, ShoppingBag, Book, Feather, Speaker
} from 'lucide-react';
import { SongAnalysis, LyricQuestion, EnhancedLyricsResponse, RealityCheckAnalysis, UserRole, SocialPost, RhymeResult } from '../types';
import { generateLyricQuestions, enhanceLyrics, generateRealityCheck, findRhymes, generateAudioPreview } from '../services/geminiService';

interface AnalysisResultProps {
  analysis: SongAnalysis;
  audioUrl: string;
  onReset: () => void;
  language?: 'en' | 'es';
  role?: UserRole; // Added Role Prop
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, audioUrl, onReset, language = 'en', role = 'artist' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showProgression, setShowProgression] = useState(false); 

  // Audio Preview State
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<string | null>(null); // Changed to string for unique ID
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null); // Changed to string for unique ID
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Ghost Writer State
  const [ghostStep, setGhostStep] = useState<'idle' | 'loading_questions' | 'questions' | 'writing' | 'result'>('idle');
  const [ghostQuestions, setGhostQuestions] = useState<string[]>([]);
  const [ghostAnswers, setGhostAnswers] = useState<Record<number, string>>({});
  const [ghostFocus, setGhostFocus] = useState('Narrative & Story'); // Default Focus
  const [enhancedLyrics, setEnhancedLyrics] = useState<EnhancedLyricsResponse | null>(null);

  // Rhyme Finder State
  const [rhymeQuery, setRhymeQuery] = useState('');
  const [rhymeResult, setRhymeResult] = useState<RhymeResult | null>(null);
  const [isRhymeLoading, setIsRhymeLoading] = useState(false);

  // Reality Check State
  const [realityStep, setRealityStep] = useState<'input' | 'auditing' | 'result'>('input');
  const [realityInput, setRealityInput] = useState({ info: '', links: '' });
  const [realityImages, setRealityImages] = useState<File[]>([]);
  const [realityResult, setRealityResult] = useState<RealityCheckAnalysis | null>(null);

  const t = {
    en: {
      tabs: { overview: 'Overview', mix: 'Mix & Master', vocals: 'Vocals', design: 'Sound Design', lyrics: 'Lyrics', reality: 'Reality Check', strategy: 'Strategy' },
      managerTabs: { overview: 'Scout Report', mix: 'Market Fit', vocals: 'Talent Audit', lyrics: 'Content Potential', design: 'Production Assets', reality: 'Investment Check', strategy: 'Campaign' },
      design: { philosophyDesc: "Sound Design Philosophy", advice: "Production Advice" },
      ghost: {
        original: "Original Lyrics", copy: "Copy", title: "Ghost Writer AI",
        desc: "Select a creative direction and let the AI rewrite sections for maximum impact.",
        summon: "Summon Ghost Writer", analyzing: "Analyzing lyrical themes...",
        before: "Creative Focus", help: "Refine your intent for the AI.",
        start: "Start Writing", rewriting: "Rewriting Lyrics...",
        enhanced: "Enhanced Version", critique: "Critique",
        focuses: ["Narrative & Story", "Flow & Rhythm", "Punchlines & Wit", "Dark & Abstract", "Emotional Depth", "Complete Structure"]
      },
      toolbox: {
          title: "Wordsmith Toolbox",
          placeholder: "Enter a word to find rhymes...",
          find: "Find Rhymes",
          perfect: "Perfect Rhymes",
          near: "Slant Rhymes",
          synonyms: "Thematic Synonyms"
      },
      reality: {
        title: role === 'manager' ? "Investment Risk Audit" : "Reality Check Audit",
        desc: role === 'manager' ? "Analyze the artist's digital footprint to determine signability and growth potential." : "A brutal, data-driven audit of your artist project. Are you actually ready to market this?",
        inputLabel: "Current Status & Links",
        inputPlaceholder: "Be honest. '100 followers on IG, released 2 songs, $0 budget...'",
        evidence: "Visual Evidence (Screenshots of profiles/stats)",
        upload: "Add Screenshot",
        run: "Run Audit",
        auditing: "Auditing Digital Footprint...",
        gap: "Reality Gap",
        fix: "The Fix",
        growth: "Growth Strategy"
      },
      simulate: "Simulate Fix",
      generating: "Synthesizing...",
      playing: "Playing Preview...",
      replay: "Replay"
    },
    es: {
      tabs: { overview: 'Resumen', mix: 'Mezcla y Master', vocals: 'Vocales', design: 'Diseño Sonoro', lyrics: 'Letras', reality: 'Reality Check', strategy: 'Estrategia' },
      managerTabs: { overview: 'Reporte Scout', mix: 'Ajuste Mercado', vocals: 'Auditoría Talento', lyrics: 'Potencial Contenido', design: 'Activos de Prod.', reality: 'Chequeo Inversión', strategy: 'Campaña' },
      design: { philosophyDesc: "Filosofía de Diseño", advice: "Consejo de Producción" },
      ghost: {
        original: "Letra Original", copy: "Copiar", title: "Escritor Fantasma IA",
        desc: "Selecciona una dirección creativa y deja que la IA reescriba secciones.",
        summon: "Invocar Escritor", analyzing: "Analizando temas...",
        before: "Enfoque Creativo", help: "Refina tu intención.",
        start: "Escribir", rewriting: "Reescribiendo...",
        enhanced: "Versión Mejorada", critique: "Crítica",
        focuses: ["Narrativa", "Flow y Ritmo", "Punchlines", "Oscuro y Abstracto", "Profundidad Emocional", "Estructura Completa"]
      },
      toolbox: {
          title: "Caja de Herramientas",
          placeholder: "Ingresa palabra para rimas...",
          find: "Buscar Rimas",
          perfect: "Rimas Perfectas",
          near: "Rimas Asonantes",
          synonyms: "Sinónimos Temáticos"
      },
      reality: {
        title: role === 'manager' ? "Auditoría de Riesgo" : "Auditoría Reality Check",
        desc: role === 'manager' ? "Analiza la huella digital para determinar potencial de firma." : "Una auditoría brutal de tu proyecto. ¿Estás realmente listo para el mercado?",
        inputLabel: "Estado Actual y Enlaces",
        inputPlaceholder: "Sé honesto. '100 seguidores, 2 canciones, presupuesto $0...'",
        evidence: "Evidencia Visual (Capturas de perfiles/stats)",
        upload: "Añadir Captura",
        run: "Ejecutar Auditoría",
        auditing: "Auditando Huella Digital...",
        gap: "Brecha de Realidad",
        fix: "La Solución",
        growth: "Estrategia de Crecimiento"
      },
      simulate: "Simular Arreglo",
      generating: "Sintetizando...",
      playing: "Reproduciendo...",
      replay: "Repetir"
    }
  };

  const text = t[language as 'en' | 'es'];
  const tabsToUse = role === 'manager' ? text.managerTabs : text.tabs;

  const copyToClipboard = (str: string) => {
    navigator.clipboard.writeText(str);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  // --- AUDIO DECODING & PLAYBACK UTILS ---
  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    // Correctly handle the buffer offset and length for the view
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const playPCM = async (base64Audio: string) => {
      // Initialize or resume AudioContext
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      // Stop previous if playing
      if (sourceNodeRef.current) {
          try { sourceNodeRef.current.stop(); } catch(e) {}
      }

      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      sourceNodeRef.current = source;
  };

  const handleSimulateSound = async (elementName: string, advice: string, id: string) => {
      setIsPreviewLoading(id);
      setActivePreviewId(null);
      // Stop any existing main audio
      if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
      }

      try {
          const audioBase64 = await generateAudioPreview(elementName, advice, analysis.genre);
          setPreviewAudio(audioBase64);
          setActivePreviewId(id);
          await playPCM(audioBase64);
      } catch (error) {
          console.error("Simulation failed", error);
      } finally {
          setIsPreviewLoading(null);
      }
  };

  const handleReplayPreview = async () => {
      if (previewAudio) {
          await playPCM(previewAudio);
      }
  };

  const startGhostSession = async () => {
    if (!analysis.lyrics) return;
    setGhostStep('loading_questions');
    try {
      const qs = await generateLyricQuestions(analysis.lyrics, analysis.genre, language as 'en' | 'es', ghostFocus);
      setGhostQuestions(qs);
      setGhostStep('questions');
    } catch (e) {
      console.error(e);
      setGhostStep('idle');
    }
  };

  const submitGhostAnswers = async () => {
    if (!analysis.lyrics) return;
    setGhostStep('writing');
    const history: LyricQuestion[] = ghostQuestions.map((q, i) => ({
        id: i, question: q, answer: ghostAnswers[i] || "No answer"
    }));
    try {
        const res = await enhanceLyrics(analysis.lyrics, history, language as 'en' | 'es', ghostFocus);
        setEnhancedLyrics(res);
        setGhostStep('result');
    } catch (e) {
        console.error(e);
        setGhostStep('questions');
    }
  };

  const handleRhymeSearch = async () => {
      if (!rhymeQuery.trim()) return;
      setIsRhymeLoading(true);
      setRhymeResult(null);
      try {
          const res = await findRhymes(rhymeQuery, analysis.genre, language as 'en' | 'es');
          setRhymeResult(res);
      } catch (e) {
          console.error(e);
      } finally {
          setIsRhymeLoading(false);
      }
  };

  const handleRealityImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setRealityImages(prev => [...prev, ...Array.from(e.target.files!)]);
      }
  };

  const runRealityCheck = async () => {
      setRealityStep('auditing');
      try {
          const links = realityInput.links.split(',').map(s => s.trim()).filter(Boolean);
          
          // Process images
          const processedImages = await Promise.all(realityImages.map(async (file) => {
              return new Promise<{base64: string, mimeType: string}>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve({
                      base64: (reader.result as string).split(',')[1],
                      mimeType: file.type
                  });
                  reader.readAsDataURL(file);
              });
          }));

          const res = await generateRealityCheck(
              analysis.artist || "Unknown Artist", 
              realityInput.info, 
              links, 
              processedImages,
              language as 'en' | 'es'
          );
          setRealityResult(res);
          setRealityStep('result');
      } catch (e) {
          console.error(e);
          setRealityStep('input');
      }
  };

  // Helper component for the simulation button to reduce repetition
  const SimulationControl = ({ id, name, advice }: { id: string, name: string, advice: string }) => (
      <div className="mt-4 pt-4 border-t border-white/5">
          {activePreviewId === id && previewAudio ? (
              <div className="bg-emerald-900/20 rounded-xl p-3 flex items-center gap-3 animate-fade-in border border-emerald-500/30">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                      <Speaker size={14} className="text-white" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <div className="h-1 bg-emerald-500/30 rounded-full w-full overflow-hidden">
                          <div className="h-full bg-emerald-500 animate-wave-fast w-full"></div>
                      </div>
                  </div>
                  <button 
                      onClick={handleReplayPreview}
                      className="text-xs font-bold text-emerald-400 hover:text-white"
                  >
                      {text.replay}
                  </button>
              </div>
          ) : (
              <button 
                  onClick={() => handleSimulateSound(name, advice, id)}
                  disabled={isPreviewLoading !== null}
                  className="w-full bg-white/5 hover:bg-emerald-600/20 hover:text-emerald-400 text-neutral-400 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:border-emerald-500/50 border border-transparent"
              >
                  {isPreviewLoading === id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  {isPreviewLoading === id ? text.generating : text.simulate}
              </button>
          )}
      </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-20">
        {/* Header & Player */}
        <div className="bg-neutral-900 border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 sticky top-24 z-30 shadow-2xl backdrop-blur-md bg-opacity-90">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-2 border-white/20 ${role === 'manager' ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.5)]'}`}>
                <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1"/>}
                </button>
            </div>
            <div className="flex-1 text-center md:text-left overflow-hidden">
                <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                    {role === 'manager' && <span className="bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Scout Report</span>}
                </div>
                <h2 className="text-2xl font-black text-white truncate">{analysis.trackTitle || "Unknown Track"}</h2>
                <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-neutral-400">
                     <span className="font-bold text-neutral-300">{analysis.artist || "Unknown Artist"}</span>
                     <span>•</span>
                     <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs border border-white/10">{analysis.bpm} BPM</span>
                     <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs border border-white/10">{analysis.musicalKey}</span>
                     <span>•</span>
                     <span className={`${role === 'manager' ? 'text-blue-400' : 'text-purple-400'} font-bold`}>{analysis.genre}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={onReset} className="p-3 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                    <X size={20} />
                </button>
            </div>
            <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
            {Object.entries(tabsToUse).map(([key, label]) => {
                const isActive = activeTab === key;
                const activeColor = role === 'manager' ? 'bg-blue-600 border-blue-500' : 'bg-purple-600 border-purple-500';
                return (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${
                            isActive 
                            ? `${activeColor} text-white shadow-lg` 
                            : 'bg-neutral-900/50 border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                    >
                        {label}
                    </button>
                )
            })}
        </div>

        {/* --- TAB CONTENT --- */}
        <div className="min-h-[600px]">
            
            {/* OVERVIEW TAB */}
            {!showProgression && activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    {/* Feedback Scores */}
                    <div className="lg:col-span-2 space-y-6">
                         <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Activity className={role === 'manager' ? 'text-blue-500' : 'text-purple-500'}/> Performance Score</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ScoreCard label="Industry Ready" score={analysis.feedback.industryScore} color="text-green-500" />
                                <ScoreCard label="Production" score={analysis.feedback.productionScore} color="text-blue-500" />
                                <ScoreCard label="Songwriting" score={analysis.feedback.lyricsScore} color="text-pink-500" />
                            </div>
                         </div>
                         
                         <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4">Executive Summary</h3>
                            <p className="text-neutral-300 leading-relaxed text-lg">{analysis.detailedAnalysis}</p>
                         </div>

                         {/* Strengths & Improvements Refactored */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                            {/* Strengths Card */}
                            <div className="bg-neutral-900/50 border border-green-500/20 rounded-[2rem] p-1 relative overflow-hidden group hover:border-green-500/40 transition-all">
                                <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
                                    <Check size={120} className="text-green-500" />
                                </div>
                                <div className="bg-green-900/5 h-full rounded-[1.8rem] p-8 relative z-10 backdrop-blur-sm">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                            <Check size={28} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white tracking-tight">Strengths</h4>
                                            <div className="text-xs font-bold text-green-500 uppercase tracking-widest mt-1">Key Highlights</div>
                                        </div>
                                    </div>
                                    <ul className="space-y-4">
                                        {analysis.feedback.strengths.map((s, i) => (
                                            <li key={i} className="flex gap-4 items-start bg-black/40 p-4 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
                                                 <div className="mt-1.5 w-2 h-2 bg-green-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                                 <span className="text-sm text-neutral-200 leading-relaxed font-medium">{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Improvements Card */}
                            <div className="bg-neutral-900/50 border border-red-500/20 rounded-[2rem] p-1 relative overflow-hidden group hover:border-red-500/40 transition-all">
                                <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
                                    <Zap size={120} className="text-red-500" />
                                </div>
                                <div className="bg-red-900/5 h-full rounded-[1.8rem] p-8 relative z-10 backdrop-blur-sm">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                            <Zap size={28} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white tracking-tight">Improvements</h4>
                                            <div className="text-xs font-bold text-red-500 uppercase tracking-widest mt-1">Areas to Fix</div>
                                        </div>
                                    </div>
                                    <ul className="space-y-3">
                                        {analysis.feedback.improvements.map((imp, i) => (
                                            <li key={i} className="bg-black/40 p-5 rounded-xl border border-white/5 hover:border-red-500/30 transition-colors">
                                                <div className="text-white font-bold text-sm mb-2 flex items-start gap-2">
                                                    <span className="text-red-500 mt-1">•</span> {imp.critique}
                                                </div>
                                                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/10">
                                                    <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Recommendation</div>
                                                    <div className="text-neutral-300 text-xs leading-relaxed italic">
                                                       {imp.suggestion}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                         </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6">
                            <h4 className="text-white font-bold mb-4">Vibe Check</h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.moods.map((m, i) => (
                                    <div key={i} className="px-3 py-1 bg-neutral-800 rounded-lg text-xs font-bold text-neutral-300 border border-white/5 flex items-center gap-2">
                                        {m.label} <span className={role === 'manager' ? 'text-blue-500' : 'text-purple-500'}>{m.confidence}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6">
                             <h4 className="text-white font-bold mb-4">Structure</h4>
                             <div className="space-y-3 relative">
                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-neutral-800"></div>
                                {Object.entries(analysis.structure).map(([section, desc], i) => (
                                    <div key={i} className="relative pl-6">
                                        <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 bg-neutral-900 border-2 rounded-full z-10 ${role === 'manager' ? 'border-blue-500' : 'border-purple-500'}`}></div>
                                        <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${role === 'manager' ? 'text-blue-400' : 'text-purple-400'}`}>{section}</div>
                                        <div className="text-sm text-neutral-400">{desc}</div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MIX TAB (Artist) / MARKET FIT (Manager) */}
            {!showProgression && activeTab === 'mix' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                    {role === 'manager' ? (
                        <>
                            {/* Manager: Market Positioning */}
                            <div className="space-y-6">
                                <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8 h-full">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Globe size={20} className="text-blue-500"/> Market Positioning
                                    </h3>
                                    {analysis.managerInsights && (
                                        <div className="space-y-6">
                                            <div>
                                                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Primary Target Audience</div>
                                                <p className="text-neutral-300 leading-relaxed text-lg">{analysis.managerInsights.targetAudience}</p>
                                            </div>
                                            <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                                                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Market Niche</div>
                                                <p className="text-white font-bold">{analysis.managerInsights.marketPosition}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Manager: Competitors */}
                            <div className="space-y-6">
                                <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8 h-full">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Users size={20} className="text-blue-500"/> Competitive Landscape
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Similar Artists / Comps</div>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.managerInsights?.similarArtists?.map((artist, i) => (
                                                    <span key={i} className="px-4 py-2 bg-blue-900/20 text-blue-300 rounded-full border border-blue-500/20 text-sm font-bold">
                                                        {artist}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
                                            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Industry Comparison</div>
                                            <p className="text-white italic">"{analysis.feedback.industryComparison}"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Artist: Mixing Data */}
                            <div className="space-y-6">
                                <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8">
                                     <h3 className="text-xl font-bold text-white mb-6">Mastering Chain</h3>
                                     <div className="space-y-4">
                                        {analysis.mixingMastering.masteringChain.map((step, i) => (
                                            <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-neutral-600 font-mono font-bold text-lg">{(i + 1).toString().padStart(2, '0')}</div>
                                                    <div>
                                                        <div className="text-white font-bold">{step.module}</div>
                                                        <div className="text-neutral-400 text-sm">{step.description}</div>
                                                    </div>
                                                </div>
                                                <SimulationControl id={`master-${i}`} name={step.module} advice={step.description} />
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8">
                                     <h3 className="text-xl font-bold text-white mb-6">EQ Surgery</h3>
                                     <div className="space-y-4">
                                        {analysis.mixingMastering.eqSuggestions.map((eq, i) => (
                                            <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-purple-400">{eq.element}</span>
                                                    <span className="bg-neutral-800 px-2 py-1 rounded text-xs font-mono text-white">{eq.frequency}</span>
                                                </div>
                                                <div className="text-white text-sm font-bold mb-1">{eq.action}</div>
                                                <div className="text-neutral-500 text-xs">{eq.reason}</div>
                                                <SimulationControl id={`eq-${i}`} name={eq.element} advice={`${eq.action} at ${eq.frequency}: ${eq.reason}`} />
                                            </div>
                                        ))}
                                     </div>
                                </div>
                                <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8 mt-6">
                                     <h3 className="text-xl font-bold text-white mb-6">Effects</h3>
                                     <div className="space-y-4">
                                        {analysis.mixingMastering.timeBasedEffects?.map((fx, i) => (
                                            <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-cyan-400">{fx.type}</span>
                                                    <span className="bg-neutral-800 px-2 py-1 rounded text-xs font-mono text-white">{fx.pluginSuggestion}</span>
                                                </div>
                                                <div className="text-white text-sm font-bold mb-1">{fx.setting}</div>
                                                <div className="text-neutral-500 text-xs">{fx.application}</div>
                                                <SimulationControl id={`fx-${i}`} name={fx.type} advice={`${fx.setting} for ${fx.application}`} />
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* VOCALS TAB */}
            {!showProgression && activeTab === 'vocals' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Main Critique */}
                        <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Mic2 size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${role === 'manager' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-pink-500/10 text-pink-500 border border-pink-500/20'}`}>
                                    <Mic2 size={12} /> {analysis.vocalAnalysis.performanceStyle}
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4">Vocal Performance</h3>
                                <p className="text-neutral-300 leading-relaxed text-lg">"{analysis.vocalAnalysis.overallCritique}"</p>
                            </div>
                        </div>

                        {/* Technical Feedback Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            {analysis.vocalAnalysis.technicalFeedback.map((tech, i) => (
                                <div key={i} className="bg-black/20 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                                    <div className="w-full md:w-48 shrink-0">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-bold text-white">{tech.label}</span>
                                            <span className={`text-sm font-bold ${role === 'manager' ? 'text-blue-500' : 'text-pink-500'}`}>{tech.score}/10</span>
                                        </div>
                                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${role === 'manager' ? 'bg-blue-600' : 'bg-pink-600'}`} style={{ width: `${tech.score * 10}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 text-sm text-neutral-400 italic border-l border-white/5 pl-6">
                                        "{tech.feedback}"
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar: Coach Prescription / Development Plan */}
                    <div className="space-y-6">
                        <div className={`bg-gradient-to-b ${role === 'manager' ? 'from-blue-900/20 border-blue-500/20' : 'from-pink-900/20 border-pink-500/20'} to-black border rounded-3xl p-8`}>
                            <h4 className={`font-bold mb-6 flex items-center gap-2 ${role === 'manager' ? 'text-blue-500' : 'text-pink-500'}`}>
                                <Headphones size={20}/> {role === 'manager' ? 'Development Plan' : 'Coach Prescription'}
                            </h4>
                            
                            <div className="space-y-6">
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${role === 'manager' ? 'text-blue-500' : 'text-pink-500'}`}>Focus Area</div>
                                    <p className="text-white font-bold text-lg">{analysis.vocalAnalysis.practiceFocus}</p>
                                </div>
                                
                                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Recommended Exercise</div>
                                    <p className="text-neutral-300 text-sm">{analysis.vocalAnalysis.coachExercise}</p>
                                </div>

                                <div className={`p-4 rounded-xl ${role === 'manager' ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-pink-600/10 border border-pink-500/20'}`}>
                                    <p className={`text-xs leading-relaxed ${role === 'manager' ? 'text-blue-300' : 'text-pink-300'}`}>
                                        <span className="font-bold">Pro Tip:</span> {role === 'manager' ? 'Assign this to the artist for their next session.' : 'Switch to the Coach tab to practice this in real-time.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DESIGN TAB */}
            {!showProgression && activeTab === 'design' && analysis.electronicProduction && (
                 <div className="animate-fade-in space-y-8 pb-20">
                    <div className="bg-gradient-to-r from-emerald-900/20 to-black border border-emerald-500/20 p-10 rounded-[2rem] relative overflow-hidden">
                         <h2 className="text-3xl font-black text-white mb-4 leading-tight">"{text.design.philosophyDesc}"</h2>
                         <p className="text-neutral-400 text-sm max-w-xl leading-relaxed">{analysis.electronicProduction.productionAdvice}</p>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {analysis.electronicProduction.elements?.map((element, idx) => (
                            <div key={idx} className="bg-neutral-900/50 border border-white/5 p-6 rounded-3xl hover:border-emerald-500/30 transition-all group flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{element.type}</div>
                                            <h3 className="text-xl font-bold text-white">{element.name}</h3>
                                        </div>
                                        <div className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-neutral-400 border border-white/5">
                                            {element.rating}/10
                                        </div>
                                    </div>
                                    <p className="text-neutral-300 text-sm mb-4 italic">"{element.timbre}"</p>
                                    <div className="pt-4 border-t border-white/5">
                                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Settings2 size={12}/> Technical Recipe
                                        </div>
                                        <p className="text-xs text-neutral-300 leading-relaxed font-mono bg-black/40 p-3 rounded-lg border border-white/5 border-l-2 border-l-emerald-500 shadow-inner">
                                            {element.advice}
                                        </p>
                                    </div>
                                </div>
                                <SimulationControl id={`prod-${idx}`} name={element.name} advice={element.advice} />
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            {/* LYRICS TAB */}
            {!showProgression && activeTab === 'lyrics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-20 min-h-[600px]">
                    {/* Extracted Lyrics Panel */}
                    <div className="bg-neutral-900/50 border border-white/10 rounded-3xl flex flex-col overflow-hidden max-h-[800px]">
                        <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${role === 'manager' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                    <Mic2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">{text.ghost.original}</h3>
                                    <p className="text-[10px] text-neutral-500 font-mono">{analysis.lyrics ? analysis.lyrics.split('\n').length : 0} Lines</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => copyToClipboard(analysis.lyrics)}
                                className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <Copy size={14} /> {text.ghost.copy}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-black/20">
                            {analysis.lyrics ? (
                                <div className="font-mono text-sm leading-loose">
                                    {analysis.lyrics.split('\n').map((line, i) => (
                                        <div key={i} className="flex hover:bg-white/5 transition-colors px-6 py-1 group">
                                            <span className="text-neutral-700 w-8 text-right mr-6 select-none text-xs pt-1 font-bold group-hover:text-neutral-500">{i + 1}</span>
                                            <span className="text-neutral-300 whitespace-pre-wrap">{line}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center text-neutral-500 italic">
                                    No lyrics detected in this track.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Ghost Writer OR Content Strategy */}
                    <div className="flex flex-col gap-6">
                        {role === 'manager' ? (
                            // MANAGER VIEW: Content Strategy
                            <>
                                <div className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/20 p-8 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <Target size={80} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">Content Angles</h3>
                                    <p className="text-neutral-400 text-sm mb-6 max-w-sm">Strategic hooks derived from lyrical themes.</p>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Key Hook / Chorus</div>
                                            <p className="text-white italic text-sm">"{analysis.structure.chorus || "See Lyrics"}"</p>
                                        </div>
                                        
                                        {analysis.promotion.consultantAdvice && (
                                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Strategic Advice</div>
                                                <p className="text-neutral-300 text-sm leading-relaxed">{analysis.promotion.consultantAdvice}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-neutral-900/50 border border-white/10 p-8 rounded-3xl">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <ImageIcon size={18} className="text-blue-500"/> Visual Art Direction
                                    </h3>
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs text-neutral-300 leading-relaxed">
                                        {analysis.aiGenerationPrompt}
                                    </div>
                                </div>
                            </>
                        ) : (
                            // ARTIST VIEW: Enhanced Ghost Writer
                            <>
                                <div className="bg-gradient-to-br from-indigo-900/20 to-black border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <Ghost size={80} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">{text.ghost.title}</h3>
                                    <p className="text-neutral-400 text-sm mb-6 max-w-sm">{text.ghost.desc}</p>
                                    
                                    {ghostStep === 'idle' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 block">{text.ghost.before}</label>
                                                <select 
                                                    value={ghostFocus}
                                                    onChange={(e) => setGhostFocus(e.target.value)}
                                                    className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                                                >
                                                    {text.ghost.focuses.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                            <button 
                                                onClick={startGhostSession}
                                                className="w-full bg-white text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg shadow-white/10"
                                            >
                                                <Sparkles size={16} /> {text.ghost.summon}
                                            </button>
                                        </div>
                                    )}
                                    
                                    {ghostStep === 'loading_questions' && (
                                        <div className="flex items-center gap-3 text-indigo-400 font-bold animate-pulse">
                                            <Loader2 size={20} className="animate-spin" />
                                            {text.ghost.analyzing}
                                        </div>
                                    )}
                                </div>

                                {/* Interaction Area */}
                                {ghostStep === 'questions' && (
                                    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 animate-fade-in space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <MessageSquare size={20} className="text-indigo-500" />
                                            <h4 className="text-white font-bold">{text.ghost.before}: {ghostFocus}</h4>
                                        </div>
                                        <p className="text-xs text-neutral-500 uppercase tracking-widest">{text.ghost.help}</p>
                                        
                                        <div className="space-y-6">
                                            {ghostQuestions.map((q, i) => (
                                                <div key={i}>
                                                    <label className="block text-sm text-neutral-300 mb-2 font-medium">"{q}"</label>
                                                    <input 
                                                        value={ghostAnswers[i] || ''}
                                                        onChange={(e) => setGhostAnswers({...ghostAnswers, [i]: e.target.value})}
                                                        className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
                                                        placeholder="..."
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={submitGhostAnswers}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                                        >
                                            <PenTool size={18} /> {text.ghost.start}
                                        </button>
                                    </div>
                                )}

                                {ghostStep === 'writing' && (
                                    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-12 text-center animate-pulse">
                                        <Loader2 size={40} className="text-indigo-500 mx-auto mb-4 animate-spin" />
                                        <h4 className="text-white font-bold text-lg">{text.ghost.rewriting}</h4>
                                        <p className="text-neutral-500 text-xs mt-2">Crafting metaphors and tightening flows...</p>
                                    </div>
                                )}

                                {ghostStep === 'result' && enhancedLyrics && (
                                    <div className="bg-neutral-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden h-full animate-fade-in">
                                        <div className="p-4 bg-indigo-900/20 border-b border-indigo-500/20 flex justify-between items-center">
                                            <h4 className="text-indigo-300 font-bold text-sm flex items-center gap-2">
                                                <Sparkles size={16} /> {text.ghost.enhanced}
                                            </h4>
                                            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{ghostFocus}</span>
                                        </div>
                                        <div className="p-6 bg-black/40 border-b border-white/5">
                                            <p className="text-neutral-400 text-xs italic leading-relaxed">
                                                <span className="text-indigo-400 font-bold not-italic mr-2">{text.ghost.critique}:</span>
                                                "{enhancedLyrics.critique}"
                                            </p>
                                        </div>
                                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                            <pre className="font-mono text-sm text-white whitespace-pre-wrap leading-relaxed">
                                                {enhancedLyrics.lyrics}
                                            </pre>
                                        </div>
                                        <div className="p-4 border-t border-white/5 flex gap-2">
                                            <button 
                                                onClick={() => copyToClipboard(enhancedLyrics.lyrics)}
                                                className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-xs hover:bg-neutral-200 transition-colors"
                                            >
                                                {text.ghost.copy}
                                            </button>
                                            <button 
                                                onClick={() => setGhostStep('idle')}
                                                className="px-4 py-3 border border-white/10 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Wordsmith Toolbox */}
                                <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
                                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <Book size={16} className="text-emerald-500"/> {text.toolbox.title}
                                    </h4>
                                    <div className="flex gap-2 mb-4">
                                        <input 
                                            value={rhymeQuery}
                                            onChange={(e) => setRhymeQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleRhymeSearch()}
                                            placeholder={text.toolbox.placeholder}
                                            className="flex-1 bg-black border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                        />
                                        <button 
                                            onClick={handleRhymeSearch}
                                            disabled={isRhymeLoading}
                                            className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {isRhymeLoading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16} />}
                                        </button>
                                    </div>
                                    
                                    {rhymeResult && (
                                        <div className="space-y-4 animate-fade-in">
                                            <div>
                                                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">{text.toolbox.perfect}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {rhymeResult.perfectRhymes.map((w, i) => (
                                                        <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20">{w}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">{text.toolbox.near}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {rhymeResult.nearRhymes.map((w, i) => (
                                                        <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">{w}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-2">{text.toolbox.synonyms}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {rhymeResult.synonyms.map((w, i) => (
                                                        <span key={i} className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/20">{w}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {/* REALITY CHECK TAB */}
            {!showProgression && activeTab === 'reality' && (
                <div className="max-w-4xl mx-auto animate-fade-in">
                    <div className="text-center mb-10">
                        <h3 className="text-3xl font-black text-white uppercase italic">{text.reality.title}</h3>
                        <p className="text-neutral-400 mt-2">{text.reality.desc}</p>
                    </div>

                    {realityStep === 'input' && (
                        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 space-y-6">
                             <div>
                                 <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{text.reality.inputLabel}</label>
                                 <textarea 
                                    className="w-full bg-black border border-neutral-800 rounded-xl p-4 mt-2 text-white h-32 focus:border-red-500 outline-none"
                                    placeholder={text.reality.inputPlaceholder}
                                    value={realityInput.info}
                                    onChange={e => setRealityInput({...realityInput, info: e.target.value})}
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Social Links (Comma separated)</label>
                                 <input 
                                    className="w-full bg-black border border-neutral-800 rounded-xl p-4 mt-2 text-white focus:border-red-500 outline-none"
                                    placeholder="instagram.com/artist, spotify.com/artist..."
                                    value={realityInput.links}
                                    onChange={e => setRealityInput({...realityInput, links: e.target.value})}
                                 />
                             </div>
                             
                             <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">{text.reality.evidence}</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div 
                                        onClick={() => document.getElementById('evidence-upload')?.click()}
                                        className="bg-black border border-dashed border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-900 hover:border-red-500/50 transition-all h-24"
                                    >
                                        <input type="file" id="evidence-upload" multiple accept="image/*" className="hidden" onChange={handleRealityImageSelect} />
                                        <Plus size={20} className="text-neutral-500" />
                                        <span className="text-[10px] text-neutral-500 font-bold uppercase mt-2">{text.reality.upload}</span>
                                    </div>
                                    {realityImages.map((img, i) => (
                                        <div key={i} className="bg-neutral-900 rounded-xl border border-white/5 relative group overflow-hidden h-24">
                                            <img src={URL.createObjectURL(img)} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <button 
                                                onClick={() => setRealityImages(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute top-1 right-1 p-1 bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                             </div>

                             <button 
                                onClick={runRealityCheck}
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2"
                             >
                                <Search size={20} /> {text.reality.run}
                             </button>
                        </div>
                    )}

                    {realityStep === 'auditing' && (
                        <div className="py-20 text-center space-y-4">
                            <Loader2 size={48} className="animate-spin text-red-500 mx-auto" />
                            <h4 className="text-xl font-bold text-white animate-pulse">{text.reality.auditing}</h4>
                        </div>
                    )}

                    {realityStep === 'result' && realityResult && (
                        <div className="space-y-8">
                             {/* Status Card */}
                             <div className="bg-gradient-to-r from-red-900/20 to-black border border-red-500/20 rounded-[2rem] p-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-red-500 font-bold uppercase tracking-widest text-xs mb-1">Current Level</div>
                                        <h2 className="text-4xl font-black text-white mb-4">{realityResult.currentStatus.level}</h2>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-neutral-500 font-bold uppercase tracking-widest text-xs mb-1">Est. Monthly Listeners</div>
                                        <div className="text-2xl font-mono text-white">{realityResult.currentStatus.estimatedMonthlyListeners}</div>
                                    </div>
                                </div>
                                <p className="text-neutral-300 italic border-l-2 border-red-500 pl-4 py-1">"{realityResult.currentStatus.summary}"</p>
                             </div>

                             {/* Gaps */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {realityResult.gapAnalysis.map((gap, i) => (
                                    <div key={i} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertCircle size={18} className="text-red-500"/>
                                            <h4 className="font-bold text-white">{gap.area}</h4>
                                        </div>
                                        <p className="text-neutral-400 text-sm mb-4">{gap.observation}</p>
                                        <div className="bg-green-900/10 border border-green-500/10 p-3 rounded-lg">
                                            <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">{text.reality.fix}</div>
                                            <p className="text-green-100 text-xs">{gap.fix}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>

                             {/* Strategy */}
                             <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="text-blue-500" /> {text.reality.growth}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-black/40 p-5 rounded-2xl">
                                        <div className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-2">Short Term</div>
                                        <p className="text-sm text-neutral-300">{realityResult.growthStrategy.shortTerm}</p>
                                    </div>
                                    <div className="bg-black/40 p-5 rounded-2xl">
                                        <div className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-2">Long Term</div>
                                        <p className="text-sm text-neutral-300">{realityResult.growthStrategy.longTerm}</p>
                                    </div>
                                    <div className="bg-black/40 p-5 rounded-2xl border border-white/10">
                                        <div className="text-white font-bold text-xs uppercase tracking-widest mb-2">Focus Area</div>
                                        <p className="text-sm text-white font-bold">{realityResult.growthStrategy.focusArea}</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            )}

            {/* STRATEGY TAB (Simple View) */}
            {!showProgression && activeTab === 'strategy' && (
                <div className="animate-fade-in space-y-8">
                    
                    {/* Social Media Launch Kit */}
                    {analysis.promotion.socialCampaign && (
                        <div className="bg-gradient-to-r from-blue-900/20 to-black border border-blue-500/20 rounded-[2rem] p-8">
                            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                <Smartphone size={24} className="text-blue-500" />
                                Social Media Launch Kit
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {analysis.promotion.socialCampaign.map((post, i) => (
                                    <div key={i} className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-2 rounded-lg ${
                                                post.platform === 'TikTok' ? 'bg-pink-500/10 text-pink-500' :
                                                post.platform === 'Instagram' ? 'bg-orange-500/10 text-orange-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {post.platform === 'TikTok' && <Music size={18} />}
                                                {post.platform === 'Instagram' && <Instagram size={18} />}
                                                {post.platform === 'Twitter' && <Twitter size={18} />}
                                            </div>
                                            <div className="text-[10px] font-bold text-neutral-500 bg-black/40 px-2 py-1 rounded flex items-center gap-1">
                                                <Clock size={10} /> {post.bestTime}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Visual Concept</div>
                                                <p className="text-sm text-neutral-300 italic">{post.visualConcept}</p>
                                            </div>
                                            
                                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Caption</div>
                                                <p className="text-sm text-white font-medium">{post.caption}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-1">
                                                {post.hashtags.map((tag, idx) => (
                                                    <span key={idx} className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Merchandise Strategy */}
                    {analysis.promotion.merchandiseStrategy && (
                        <div className="bg-gradient-to-r from-yellow-900/20 to-black border border-yellow-500/20 rounded-[2rem] p-8">
                            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                <ShoppingBag size={24} className="text-yellow-500" />
                                Merch Strategy
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {analysis.promotion.merchandiseStrategy.map((item, i) => (
                                    <div key={i} className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6 hover:border-yellow-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">{item.name}</h4>
                                            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2 py-1 rounded border border-yellow-500/20">{item.pricePoint}</span>
                                        </div>
                                        <p className="text-sm text-neutral-400 mb-4 leading-relaxed">{item.description}</p>
                                        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Why it fits</div>
                                            <p className="text-xs text-neutral-300 italic">{item.whyItFits}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-bold text-white uppercase tracking-widest">Timeline</h3>
                            {analysis.promotion.marketingTimeline.map((item, i) => (
                                <div key={i} className="flex gap-4 bg-neutral-900/50 p-4 rounded-xl border border-white/5">
                                    <div className="text-blue-500 font-bold whitespace-nowrap">{item.day}</div>
                                    <div>
                                        <div className="text-white font-bold">{item.action}</div>
                                        <div className="text-neutral-500 text-xs">{item.details}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-bold text-white uppercase tracking-widest">Playlist Targets</h3>
                            {analysis.promotion.playlistTargets.map((pl, i) => (
                                <div key={i} className="bg-neutral-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                    <div>
                                        <div className="text-white font-bold">{pl.playlistName}</div>
                                        <div className="text-neutral-500 text-xs">{pl.platform} • {pl.type}</div>
                                    </div>
                                    <div className="text-[10px] text-neutral-400 bg-black/40 px-2 py-1 rounded max-w-[150px] truncate">
                                        {pl.whyItFits}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    </div>
  );
};

const ScoreCard: React.FC<{ label: string; score: number; color: string }> = ({ label, score, color }) => (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
        <span className="text-neutral-400 font-bold text-sm">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black ${color}`}>{score}</span>
            <span className="text-neutral-600 text-sm font-bold">/100</span>
        </div>
    </div>
);

export default AnalysisResult;
