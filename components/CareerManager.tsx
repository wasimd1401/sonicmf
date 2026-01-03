
import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, Target, Loader2, Award, TrendingUp, Calendar, DollarSign, CheckCircle, ChevronRight, Layout, User, FileDown, Upload, Music, X, MessageSquare, Send, ArrowLeft, BarChart2, PieChart as PieChartIcon, Activity, AlertTriangle, Instagram, Youtube, UserPlus, Twitter, Clock, Hash, Smartphone, Camera } from 'lucide-react';
import { generateCareerRoadmap, CareerChatSession, generateSocialMediaCampaign } from '../services/geminiService';
import { CareerRoadmap, ChatMessage, ArtistProfile, SocialStats, SocialCampaignStrategy } from '../types';
import { jsPDF } from "jspdf";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface CareerManagerProps {
  language?: 'en' | 'es';
  onRoadmapGenerated?: (roadmap: CareerRoadmap, metadata?: { stats: SocialStats, goal: string, genre: string, socialStrategy?: SocialCampaignStrategy }) => void;
  artistProfile?: ArtistProfile;
  onBack?: () => void;
}

const CareerManager: React.FC<CareerManagerProps> = ({ language = 'en', onRoadmapGenerated, artistProfile, onBack }) => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'performance' | 'social'>('strategy');
  
  // Initialize Stats
  const initialStats: SocialStats = artistProfile?.socialStats || {
      instagram: '',
      tiktok: '',
      spotify: '',
      youtube: ''
  };

  const [inputs, setInputs] = useState({
    name: artistProfile?.name || '',
    genre: artistProfile?.genre || '',
    goal: artistProfile?.goal || '',
  });

  const [socialStats, setSocialStats] = useState<SocialStats>(initialStats);
  
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(artistProfile?.roadmap || null);
  const [activePhase, setActivePhase] = useState<number>(0);

  // Social Campaign State
  const [socialStrategy, setSocialStrategy] = useState<SocialCampaignStrategy | null>(artistProfile?.socialStrategy || null);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatSessionRef = useRef<CareerChatSession | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (roadmap && !chatSessionRef.current) {
          chatSessionRef.current = new CareerChatSession(roadmap, language as 'en'|'es');
      }
  }, [roadmap, language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const t = {
    en: {
      title: artistProfile ? `Strategy: ${artistProfile.name}` : "Add New Talent",
      subtitle: artistProfile ? "Execute the plan. dominate the market." : "Input artist data to generate a data-driven launch strategy.",
      tabs: { strategy: "Strategic Roadmap", performance: "Performance Analytics", social: "Social Ops" },
      perfTitle: "Live Campaign Data",
      decision: "Executive Decision",
      budget: "Budget Utilization",
      growth: "Audience Growth",
      generate: "Analyze & Build Strategy",
      thinking: "Analyzing Social Data & Market Fit...",
      back: "Back to Roster",
      upload: "Upload MP3/WAV (Optional)",
      chatPlaceholder: "Ask about visual style, tour strategy, or budget details...",
      socialTitle: "Social Intelligence Audit",
      audioTitle: "Audio Intelligence (Optional)",
      goalTitle: "Strategic Goals",
      profileTitle: "Artist Profile",
      genCampaign: "Generate Campaign",
      campaignThinking: "Designing Rollout...",
      pillars: "Content Pillars",
      posts: "Scheduled Posts"
    },
    es: {
      title: artistProfile ? `Estrategia: ${artistProfile.name}` : "Añadir Nuevo Talento",
      subtitle: artistProfile ? "Ejecuta el plan. Domina el mercado." : "Ingresa datos del artista para generar una estrategia.",
      tabs: { strategy: "Mapa Estratégico", performance: "Analítica de Rendimiento", social: "Ops Sociales" },
      perfTitle: "Datos de Campaña en Vivo",
      decision: "Decisión Ejecutiva",
      budget: "Utilización de Presupuesto",
      growth: "Crecimiento de Audiencia",
      generate: "Analizar y Construir",
      thinking: "Analizando Datos Sociales...",
      back: "Volver al Roster",
      upload: "Subir MP3/WAV (Opcional)",
      chatPlaceholder: "Pregunta sobre estilo visual, estrategia de tour...",
      socialTitle: "Auditoría de Inteligencia Social",
      audioTitle: "Inteligencia de Audio (Opcional)",
      goalTitle: "Metas Estratégicas",
      profileTitle: "Perfil de Artista",
      genCampaign: "Generar Campaña",
      campaignThinking: "Diseñando Lanzamiento...",
      pillars: "Pilares de Contenido",
      posts: "Posts Programados"
    }
  };
  const text = t[language];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files);
          setFiles(prev => [...prev, ...newFiles].slice(0, 5)); 
      }
  };

  const removeFile = (idx: number) => {
      setFiles(files.filter((_, i) => i !== idx));
  };

  const processFiles = async (): Promise<{base64: string, mimeType: string, name: string}[]> => {
      const processed = await Promise.all(files.map(file => {
          return new Promise<{base64: string, mimeType: string, name: string}>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve({
                  base64: (reader.result as string).split(',')[1],
                  mimeType: file.type,
                  name: file.name
              });
              reader.onerror = reject;
              reader.readAsDataURL(file);
          });
      }));
      return processed;
  };

  const handleGenerate = async () => {
    if (!inputs.name || !inputs.goal) return;
    setIsLoading(true);
    setChatMessages([]);
    chatSessionRef.current = null;
    try {
      const audioData = await processFiles();
      const result = await generateCareerRoadmap(
        inputs.name,
        inputs.genre,
        inputs.goal,
        socialStats, // Pass specific object instead of status string
        audioData,
        language as 'en' | 'es'
      );
      setRoadmap(result);
      if (onRoadmapGenerated) {
        onRoadmapGenerated(result, {
            stats: socialStats,
            goal: inputs.goal,
            genre: inputs.genre,
            socialStrategy: socialStrategy || undefined
        });
      }
      chatSessionRef.current = new CareerChatSession(result, language as 'en' | 'es');
    } catch (e) {
      console.error(e);
      alert("Failed to generate roadmap.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCampaign = async () => {
      if (!inputs.name || !inputs.genre || !inputs.goal) return;
      setIsGeneratingCampaign(true);
      try {
          const strategy = await generateSocialMediaCampaign(
              inputs.name,
              inputs.genre,
              inputs.goal,
              socialStats,
              language as 'en' | 'es'
          );
          setSocialStrategy(strategy);
          
          // Allow parent to save this state
          if (onRoadmapGenerated && roadmap) {
              onRoadmapGenerated(roadmap, {
                  stats: socialStats,
                  goal: inputs.goal,
                  genre: inputs.genre,
                  socialStrategy: strategy
              });
          }
      } catch (e) {
          console.error(e);
          alert("Failed to generate campaign.");
      } finally {
          setIsGeneratingCampaign(false);
      }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatSessionRef.current) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatting(true);
    
    try {
        const response = await chatSessionRef.current.sendMessage(userMsg);
        setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
        console.error(error);
    } finally {
        setIsChatting(false);
    }
  };

  if (roadmap) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-20">
        
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-md sticky top-24 z-30">
            <div className="flex items-center gap-4">
                <button onClick={onBack || (() => setRoadmap(null))} className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-white leading-none">{roadmap.artistName}</h2>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">{roadmap.archetype}</p>
                </div>
            </div>
            
            <div className="flex bg-neutral-900 rounded-xl p-1 border border-white/10">
                <button 
                    onClick={() => setActiveTab('strategy')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'strategy' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                >
                    <Briefcase size={14} /> {text.tabs.strategy}
                </button>
                <button 
                    onClick={() => setActiveTab('performance')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'performance' ? 'bg-emerald-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                >
                    <BarChart2 size={14} /> {text.tabs.performance}
                </button>
                <button 
                    onClick={() => setActiveTab('social')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'social' ? 'bg-pink-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                >
                    <Smartphone size={14} /> {text.tabs.social}
                </button>
            </div>
        </div>

        {/* --- STRATEGY TAB --- */}
        {activeTab === 'strategy' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* Left Column: Roadmap Details */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Mission Card */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-black border border-blue-500/20 rounded-[2rem] p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <Target size={100} />
                        </div>
                        <h4 className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-4">Core Mission</h4>
                        <p className="text-xl text-white font-medium leading-relaxed italic">"{roadmap.missionStatement}"</p>
                    </div>

                    {/* Phase Navigator */}
                    <div className="space-y-4">
                        <div className="flex bg-neutral-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto">
                            {roadmap.phases.map((phase, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActivePhase(idx)}
                                    className={`flex-1 py-4 px-4 rounded-lg font-bold text-sm transition-all flex flex-col items-center gap-1 min-w-[120px] ${activePhase === idx ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    <span className="text-[10px] uppercase opacity-70 tracking-widest">Phase {idx + 1}</span>
                                    {phase.title}
                                </button>
                            ))}
                        </div>

                        {/* Active Phase Tasks */}
                        <div className="bg-neutral-900 border border-white/10 rounded-[2rem] p-8">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-1">{roadmap.phases[activePhase].title}</h3>
                                    <p className="text-blue-400 text-sm font-bold flex items-center gap-2"><Calendar size={14}/> {roadmap.phases[activePhase].duration}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Focus</span>
                                    <span className="text-lg text-white font-bold">{roadmap.phases[activePhase].focus}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {roadmap.phases[activePhase].tasks.map((task, i) => (
                                    <div key={i} className="flex gap-4 group items-start">
                                        <div className="flex-shrink-0 w-20 pt-1">
                                            <div className="bg-neutral-800 text-neutral-400 text-[10px] font-bold px-2 py-1 rounded-lg text-center border border-white/5">
                                                {task.week}
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all">
                                            <h4 className="text-white font-bold mb-1 flex items-center gap-2 text-sm">
                                                <CheckCircle size={14} className="text-blue-500" />
                                                {task.action}
                                            </h4>
                                            <p className="text-xs text-neutral-400 leading-relaxed">{task.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Chat & KPIs */}
                <div className="space-y-6">
                    {/* KPIs */}
                    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Award size={16} className="text-yellow-500"/> 90-Day KPIs</h4>
                        <div className="space-y-3">
                            {roadmap.kpis.map((k, i) => (
                                <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                    <span className="text-xs text-neutral-400 font-bold">{k.metric}</span>
                                    <span className="text-sm text-white font-black">{k.target}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Interface */}
                    <div className="bg-neutral-900 border border-white/10 rounded-[2rem] p-6 flex flex-col h-[500px]">
                        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                            <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400">
                                <MessageSquare size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white">Strategy Assistant</h3>
                                <p className="text-[10px] text-neutral-500">AI Manager</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pr-2">
                            {chatMessages.length === 0 && (
                                <div className="text-center py-10 text-neutral-600 italic text-xs">
                                    "Ask me about the budget, release timing, or social strategy."
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                                        : 'bg-neutral-800 text-neutral-300 rounded-tl-sm border border-white/10'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="flex gap-2">
                            <input 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="Type a question..."
                                className="flex-1 bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none transition-colors"
                                disabled={isChatting}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={isChatting || !chatInput.trim()}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isChatting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- PERFORMANCE TAB --- */}
        {activeTab === 'performance' && artistProfile?.campaignData && (
            <div className="space-y-8 animate-fade-in">
                
                {/* Executive Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 bg-gradient-to-r from-emerald-900/20 to-black border border-emerald-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <TrendingUp size={120} />
                        </div>
                        <h3 className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Activity size={14} className="animate-pulse" /> {text.perfTitle}
                        </h3>
                        <div className="flex items-end gap-4 mb-6">
                            <h2 className="text-5xl font-black text-white tracking-tighter">
                                {artistProfile.campaignData.chartData[artistProfile.campaignData.chartData.length-1].listeners.toLocaleString()}
                            </h2>
                            <span className="text-emerald-400 font-bold mb-2 text-sm">+12.5% this week</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Engagement Rate</div>
                                <div className="text-white font-bold">{artistProfile.campaignData.engagementRate}%</div>
                            </div>
                            <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Top Platform</div>
                                <div className="text-white font-bold">{artistProfile.campaignData.topPlatform}</div>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-[2.5rem] p-6 border flex flex-col justify-center relative overflow-hidden ${
                        artistProfile.campaignData.decisionUrgency === 'High' 
                        ? 'bg-red-900/20 border-red-500/50' 
                        : 'bg-neutral-900 border-white/10'
                    }`}>
                        {artistProfile.campaignData.decisionUrgency === 'High' && (
                            <div className="absolute top-4 right-4 text-red-500 animate-pulse">
                                <AlertTriangle size={24} />
                            </div>
                        )}
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70 text-white">{text.decision}</h4>
                        <p className="text-sm font-bold text-white leading-relaxed mb-4">
                            "{artistProfile.campaignData.nextDecision}"
                        </p>
                        <button className="bg-white text-black py-3 rounded-xl font-bold text-xs hover:scale-105 transition-transform w-full">
                            Execute Action
                        </button>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Growth Chart */}
                    <div className="bg-neutral-900/50 border border-white/10 rounded-[2rem] p-8 h-[400px]">
                        <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-500"/> {text.growth}
                        </h4>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={artistProfile.campaignData.chartData}>
                                <defs>
                                    <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="month" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="listeners" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorListeners)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Budget & Revenue */}
                    <div className="bg-neutral-900/50 border border-white/10 rounded-[2rem] p-8 h-[400px]">
                        <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                            <DollarSign size={18} className="text-emerald-500"/> {text.budget}
                        </h4>
                        <div className="flex gap-8 h-[85%]">
                            {/* Simple Budget Bar Visual */}
                            <div className="w-16 bg-neutral-800 rounded-full relative overflow-hidden">
                                <div 
                                    className="absolute bottom-0 left-0 right-0 bg-emerald-500 transition-all duration-1000"
                                    style={{ height: `${(artistProfile.campaignData.budgetSpent / artistProfile.campaignData.budgetTotal) * 100}%` }}
                                ></div>
                                <div className="absolute inset-0 flex flex-col justify-end items-center pb-4 pointer-events-none">
                                    <span className="text-[10px] font-black text-black bg-white/80 px-1 rounded">
                                        {Math.round((artistProfile.campaignData.budgetSpent / artistProfile.campaignData.budgetTotal) * 100)}%
                                    </span>
                                </div>
                            </div>
                            
                            {/* Revenue Chart */}
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={artistProfile.campaignData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="month" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                                        />
                                        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Fallback for no data */}
        {activeTab === 'performance' && !artistProfile?.campaignData && (
            <div className="text-center py-20 bg-neutral-900/50 rounded-[2rem] border border-white/10 border-dashed">
                <BarChart2 size={48} className="mx-auto text-neutral-600 mb-4" />
                <h3 className="text-xl font-bold text-white">No Campaign Data Active</h3>
                <p className="text-neutral-500">Start executing the strategy to gather metrics.</p>
            </div>
        )}

        {/* --- SOCIAL OPS TAB --- */}
        {activeTab === 'social' && (
            <div className="animate-fade-in space-y-8">
                
                {/* Generate CTA */}
                {!socialStrategy ? (
                    <div className="text-center py-20 bg-neutral-900/50 rounded-[2rem] border border-white/10">
                        <Smartphone size={48} className="mx-auto text-pink-500 mb-6" />
                        <h3 className="text-3xl font-black text-white mb-2">Social Ops Center</h3>
                        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                            Generate a full content calendar, content pillars, and hashtag strategy tailored to your current stats.
                        </p>
                        <button 
                            onClick={handleGenerateCampaign}
                            disabled={isGeneratingCampaign}
                            className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mx-auto"
                        >
                            {isGeneratingCampaign ? <Loader2 className="animate-spin" /> : <TrendingUp size={20} />}
                            {isGeneratingCampaign ? text.campaignThinking : text.genCampaign}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Theme Header */}
                        <div className="bg-gradient-to-r from-pink-900/40 to-black border border-pink-500/20 rounded-[2rem] p-8 text-center">
                            <h4 className="text-pink-500 text-[10px] font-black uppercase tracking-widest mb-2">Active Campaign Theme</h4>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter">"{socialStrategy.campaignTheme}"</h2>
                        </div>

                        {/* Content Pillars */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Layout size={20} className="text-pink-500"/> {text.pillars}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {socialStrategy.contentPillars.map((pillar, i) => (
                                    <div key={i} className="bg-neutral-900/50 border border-white/10 p-6 rounded-2xl hover:border-pink-500/30 transition-colors">
                                        <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center text-pink-500 mb-4 font-bold border border-pink-500/20">
                                            {i + 1}
                                        </div>
                                        <h4 className="text-lg font-bold text-white mb-2">{pillar.title}</h4>
                                        <p className="text-xs text-neutral-400 leading-relaxed">{pillar.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scheduled Posts */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar size={20} className="text-pink-500"/> {text.posts}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {socialStrategy.posts.map((post, i) => (
                                    <div key={i} className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden hover:border-pink-500/20 transition-all group">
                                        {/* Header */}
                                        <div className="p-4 flex items-center justify-between border-b border-white/5 bg-neutral-900/30">
                                            <div className={`p-2 rounded-lg ${
                                                post.platform === 'TikTok' ? 'bg-black text-white border border-white/20' :
                                                post.platform === 'Instagram' ? 'bg-gradient-to-tr from-yellow-500 to-purple-600 text-white' :
                                                'bg-blue-400 text-white'
                                            }`}>
                                                {post.platform === 'TikTok' && <Music size={14} />}
                                                {post.platform === 'Instagram' && <Camera size={14} />}
                                                {post.platform === 'Twitter' && <Twitter size={14} />}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 bg-black px-2 py-1 rounded border border-white/5">
                                                <Clock size={10} /> {post.bestTime}
                                            </div>
                                        </div>
                                        
                                        {/* Body */}
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Visual Concept</div>
                                                <p className="text-sm text-neutral-300 italic group-hover:text-white transition-colors">{post.visualConcept}</p>
                                            </div>
                                            
                                            <div className="bg-neutral-900/50 p-3 rounded-xl border border-white/5">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-pink-500 mb-1">Caption</div>
                                                <p className="text-xs text-white font-medium">{post.caption}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-1 pt-2">
                                                {post.hashtags.map((tag, idx) => (
                                                    <span key={idx} className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                            <button 
                                onClick={handleGenerateCampaign}
                                disabled={isGeneratingCampaign}
                                className="text-xs font-bold text-neutral-500 hover:text-white flex items-center gap-2 transition-colors"
                            >
                                <Loader2 size={12} className={isGeneratingCampaign ? "animate-spin" : ""} /> Regenerate Campaign
                            </button>
                        </div>
                    </>
                )}
            </div>
        )}

      </div>
    );
  }

  // --- Initial Input Form (Create New) ---
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-10 animate-fade-in-up">
      <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors">
              <ArrowLeft size={16} /> {text.back}
          </button>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-white tracking-tighter">{text.title}</h2>
        <p className="text-neutral-400 text-lg">{text.subtitle}</p>
      </div>

      <div className="bg-neutral-900/50 border border-white/10 p-10 rounded-[2.5rem] space-y-10 shadow-2xl backdrop-blur-sm">
         
         {/* Section 1: Artist Profile */}
         <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
               <User className="text-blue-500" /> {text.profileTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Artist Name</label>
                   <input 
                      value={inputs.name}
                      onChange={(e) => setInputs({...inputs, name: e.target.value})}
                      className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors"
                      placeholder="e.g. The Weeknd"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Genre</label>
                   <input 
                      value={inputs.genre}
                      onChange={(e) => setInputs({...inputs, genre: e.target.value})}
                      className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors"
                      placeholder="e.g. Synth-Pop"
                   />
                </div>
            </div>
         </div>

         {/* Section 2: Social Audit */}
         <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
               <Activity className="text-pink-500" /> {text.socialTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Instagram size={14} /> Instagram Followers
                   </label>
                   <input 
                      value={socialStats.instagram}
                      onChange={(e) => setSocialStats({...socialStats, instagram: e.target.value})}
                      className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-pink-500 outline-none transition-colors"
                      placeholder="e.g. 12.5k"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Music size={14} /> TikTok Followers
                   </label>
                   <input 
                      value={socialStats.tiktok}
                      onChange={(e) => setSocialStats({...socialStats, tiktok: e.target.value})}
                      className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-pink-500 outline-none transition-colors"
                      placeholder="e.g. 450k"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <UserPlus size={14} /> Spotify Monthly Listeners
                   </label>
                   <input 
                      value={socialStats.spotify}
                      onChange={(e) => setSocialStats({...socialStats, spotify: e.target.value})}
                      className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-green-500 outline-none transition-colors"
                      placeholder="e.g. 8,200"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Youtube size={14} /> YouTube Subscribers
                   </label>
                   <input 
                      value={socialStats.youtube}
                      onChange={(e) => setSocialStats({...socialStats, youtube: e.target.value})}
                      className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-red-500 outline-none transition-colors"
                      placeholder="e.g. 1,000"
                   />
                </div>
            </div>
         </div>

         {/* Section 3: Goals */}
         <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
               <Target className="text-yellow-500" /> {text.goalTitle}
            </h3>
            <div className="space-y-2">
               <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Ultimate Goal</label>
               <input 
                  value={inputs.goal}
                  onChange={(e) => setInputs({...inputs, goal: e.target.value})}
                  className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors"
                  placeholder="e.g. Get signed by a Major Label or Reach 100k streams"
               />
            </div>
         </div>

         {/* Section 4: Audio (Optional) */}
         <div className="space-y-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
               <Upload className="text-neutral-500" /> {text.audioTitle}
            </h3>
             <div onClick={() => document.getElementById('manager-upload')?.click()} className="border-2 border-dashed border-neutral-800 bg-black/20 hover:bg-black/40 hover:border-blue-500/50 rounded-xl p-6 text-center cursor-pointer transition-all">
                 <input type="file" id="manager-upload" multiple accept="audio/*" className="hidden" onChange={handleFileSelect} />
                 <Music className="mx-auto text-neutral-500 mb-2" size={24} />
                 <p className="text-sm text-neutral-400 font-bold">{text.upload}</p>
                 <p className="text-xs text-neutral-600 mt-1">AI will analyze hit potential (Not Required)</p>
             </div>
             {files.length > 0 && (
                 <div className="grid grid-cols-1 gap-2 mt-2">
                     {files.map((f, i) => (
                         <div key={i} className="flex justify-between items-center bg-blue-900/10 border border-blue-500/20 px-4 py-2 rounded-lg">
                             <div className="flex items-center gap-3 overflow-hidden">
                                 <Music size={14} className="text-blue-500 shrink-0" />
                                 <span className="text-xs text-white truncate">{f.name}</span>
                             </div>
                             <button onClick={() => removeFile(i)} className="text-neutral-500 hover:text-white"><X size={14}/></button>
                         </div>
                     ))}
                 </div>
             )}
         </div>

         <button 
            onClick={handleGenerate}
            disabled={isLoading || !inputs.name}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
         >
            {isLoading ? <Loader2 className="animate-spin" /> : <TrendingUp size={20} />}
            {isLoading ? text.thinking : text.generate}
         </button>
      </div>
    </div>
  );
};

export default CareerManager;
