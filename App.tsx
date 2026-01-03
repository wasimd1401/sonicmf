
import React, { useState, useEffect } from 'react';
import { SongAnalysis, StyleBlendAnalysis, CareerRoadmap, ComparisonResult, ProgressionReport, UserRole, SocialCampaignStrategy } from './types';
import FileUpload from './components/FileUpload';
import AnalysisResult from './components/AnalysisResult';
import StyleBlender from './components/StyleBlender';
import VocalCoach from './components/VocalCoach';
import CareerManager from './components/CareerManager'; // Used for Artist Strategy
import ManagerDashboard from './components/ManagerDashboard'; // Manager Home
import Comparator from './components/Comparator';
import ExpertChat from './components/ExpertChat';
import ContentGenerator from './components/ContentGenerator';
import WelcomeScreen from './components/WelcomeScreen'; 
import { analyzeAudio, generateStrategicQuestions } from './services/geminiService';
import { generateMasterReport } from './services/pdfGenerator';
import { Sparkles, AlertTriangle, Disc, Layers, Globe, AudioLines, Send, ArrowRight, Loader2, Headphones, Briefcase, Swords, FileDown, MessageCircle, Camera, Target, Users } from 'lucide-react';

const TrebleClef = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 8.5c0-2.5-1.5-4.5-3.5-4.5S7 6 7 8.5c0 2 1.5 3.5 3 3.5h.5c2 0 3.5 1.5 3.5 3.5S12.5 19 10.5 19c-1.5 0-2.5-1-2.5-2.5" />
    <path d="M10.5 19c-2 0-4-2-4-5s2-5 4-5h.5" /><path d="M10.5 4v15" /><path d="M10.5 4c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5c0 1.5-4 5.5-5 6.5" /><circle cx="10.5" cy="19" r="1" fill="currentColor" />
  </svg>
);

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null); 
  const [mode, setMode] = useState<string>('analyzer');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  
  // Analyzer State
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SongAnalysis | null>(null);
  
  // Global Result State
  const [styleBlendResult, setStyleBlendResult] = useState<StyleBlendAnalysis | null>(null);
  const [careerRoadmap, setCareerRoadmap] = useState<CareerRoadmap | null>(null);
  const [socialStrategy, setSocialStrategy] = useState<SocialCampaignStrategy | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | ProgressionReport | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Interview States
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<{question: string, answer: string}[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  // Theme Management
  useEffect(() => {
    if (role === 'manager') {
      document.body.style.backgroundImage = 'radial-gradient(circle at 50% 0%, #1e3a8a 0%, #000000 40%)'; // Blue theme
    } else {
      document.body.style.backgroundImage = 'radial-gradient(circle at 50% 0%, #2e1065 0%, #000000 40%)'; // Purple theme
    }
  }, [role]);

  // Handle Role Selection
  const handleRoleSelect = (selectedRole: UserRole) => {
      setRole(selectedRole);
      // Set default mode based on role
      setMode(selectedRole === 'manager' ? 'manager' : 'analyzer');
  };

  // Translations
  const t = {
    en: {
      headline: "Your Music.",
      headlineSuffix: "Unfiltered.",
      subheadline: role === 'manager' 
        ? "Analyze commercial viability, market fit, and investment risk. Make data-driven signing decisions."
        : "Get the real talk from an industry pro. No corporate fluff, just the data and strategy you need to win.",
      sitDownTitle: "The Sit-Down",
      sitDownSub: "Tell me the vision.",
      nextQ: "Next Question",
      loadingTitle: role === 'manager' ? "Scouting Talent..." : "Let me hear it...",
      errorTitle: "Something crashed.",
      tryAgain: "Try Again",
      steps: ["Analyzing Frequency Spectrum...", "Auditing the Mix Dynamics...", "Identifying Market Competitors...", "Finalizing Executive Strategy..."],
      consulting: "Consulting with the A&R Team...",
      
      // Nav Labels
      nav: {
          analyzer: "Analyzer",
          scout: "Scout",
          blender: "Blender",
          coach: "Coach",
          roster: "Roster",
          strategy: "Strategy",
          versus: "Versus",
          chat: "Team",
          visuals: "Visuals"
      },
      downloadReport: "Download Report"
    },
    es: {
      headline: "Tu Música.",
      headlineSuffix: "Sin Filtros.",
      subheadline: role === 'manager'
        ? "Analiza viabilidad comercial, ajuste de mercado y riesgo de inversión. Toma decisiones basadas en datos."
        : "Recibe la verdad de un profesional de la industria. Sin rodeos corporativos, solo los datos y la estrategia que necesitas para ganar.",
      sitDownTitle: "La Reunión",
      sitDownSub: "Cuéntame la visión.",
      nextQ: "Siguiente Pregunta",
      loadingTitle: role === 'manager' ? "Buscando Talento..." : "Déjame escuchar...",
      errorTitle: "Algo falló.",
      tryAgain: "Intentar de Nuevo",
      steps: ["Analizando Espectro de Frecuencia...", "Auditando Dinámicas de Mezcla...", "Identificando Competidores...", "Finalizando Estrategia Ejecutiva..."],
      consulting: "Consultando con el Equipo A&R...",
      
      // Nav Labels
      nav: {
          analyzer: "Analizador",
          scout: "Scout",
          blender: "Mezclador",
          coach: "Entrenador",
          roster: "Roster",
          strategy: "Estrategia",
          versus: "Batalla",
          chat: "Equipo",
          visuals: "Visuales"
      },
      downloadReport: "Descargar Reporte"
    }
  };
  
  const text = t[language];

  const performAnalysis = async (selectedFile: File, targetLang: 'en' | 'es', context?: {question: string, answer: string}[]) => {
    setLoading(true);
    setAnalysis(null);
    setError(null);
    setIsInterviewing(false);

    const steps = text.steps;
    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => { stepIndex = (stepIndex + 1) % steps.length; setLoadingStep(steps[stepIndex]); }, 4000);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          // Pass the selected role to the analysis service
          const result = await analyzeAudio(base64String, selectedFile.type, targetLang, role || 'artist', context);
          setAnalysis(result);
        } catch (err: any) { setError(err.message || "Something went wrong during the analysis."); }
        finally { clearInterval(stepInterval); setLoading(false); }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) { setLoading(false); setError("Critical failure."); clearInterval(stepInterval); }
  };

  const handleFileSelect = async (selectedFile: File, modeType: 'auto' | 'personalized') => {
    setFile(selectedFile);
    setAudioUrl(URL.createObjectURL(selectedFile));
    if (modeType === 'auto') {
      performAnalysis(selectedFile, language);
    } else {
      setLoading(true);
      setLoadingStep(text.consulting);
      try {
        const qs = await generateStrategicQuestions(language);
        if (!qs || qs.length === 0) throw new Error("No questions generated");
        setInterviewQuestions(qs);
        setIsInterviewing(true);
      } catch (e) { 
        console.warn("Interview init failed, skipping to analysis", e);
        performAnalysis(selectedFile, language); 
      } finally { 
        setLoading(false); 
      }
    }
  };

  const submitAnswer = () => {
    if (!currentAnswer.trim()) return;
    const newAnswers = [...answers, { question: interviewQuestions[currentQIdx], answer: currentAnswer }];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    if (currentQIdx < interviewQuestions.length - 1) {
      setCurrentQIdx(prev => prev + 1);
    } else if (file) {
      performAnalysis(file, language, newAnswers);
    }
  };

  const handleReset = () => {
    setFile(null); setAudioUrl(null); setAnalysis(null); setError(null);
    setIsInterviewing(false); setAnswers([]); setCurrentQIdx(0);
  };

  const handleDownloadMasterReport = () => {
    generateMasterReport({
        analysis,
        styleBlend: styleBlendResult,
        roadmap: careerRoadmap,
        comparison: comparisonResult,
        socialStrategy
    });
  };

  // Define Navigation Items based on Role
  const artistNav = [
    { id: 'analyzer', label: text.nav.analyzer, icon: Disc },
    { id: 'blender', label: text.nav.blender, icon: Layers },
    { id: 'coach', label: text.nav.coach, icon: Headphones },
    { id: 'comparator', label: text.nav.versus, icon: Swords },
    { id: 'strategy', label: text.nav.strategy, icon: Target },
    { id: 'chat', label: text.nav.chat, icon: Users },
    { id: 'visuals', label: text.nav.visuals, icon: Camera },
  ];

  const managerNav = [
    { id: 'manager', label: text.nav.roster, icon: Briefcase },
    { id: 'analyzer', label: text.nav.scout, icon: Disc }, // Scout
    { id: 'comparator', label: text.nav.versus, icon: Swords },
    { id: 'visuals', label: text.nav.visuals, icon: Camera },
    { id: 'chat', label: text.nav.chat, icon: Users },
  ];

  const navItems = role === 'manager' ? managerNav : artistNav;

  // If no role is selected, show Welcome Screen
  if (!role) {
    return <WelcomeScreen onSelectRole={handleRoleSelect} />;
  }

  const hasAnyData = analysis || styleBlendResult || careerRoadmap || comparisonResult;

  return (
    <div className="min-h-screen selection:bg-purple-500/30 font-sans">
      <nav className={`border-b backdrop-blur-xl sticky top-0 z-50 ${role === 'manager' ? 'bg-blue-950/80 border-blue-900/30' : 'bg-black/80 border-purple-900/30'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo / Home Button */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => { 
                handleReset(); 
                setMode(role === 'manager' ? 'manager' : 'analyzer'); 
            }}
          >
            <div className={`p-2 rounded-xl border ${role === 'manager' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-purple-500/10 border-purple-500/20 text-purple-500'}`}>
                <TrebleClef className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-black text-white leading-none tracking-tight">SonicMF</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${role === 'manager' ? 'text-blue-400' : 'text-purple-400'}`}>
                    {role === 'manager' ? 'Manager Pro' : 'Artist Suite'}
                </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Report Button */}
             {hasAnyData && (
                <button 
                    onClick={handleDownloadMasterReport}
                    className="hidden lg:flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-200 transition-colors mr-2"
                >
                    <FileDown size={14} /> {text.downloadReport}
                </button>
             )}

             {/* Language Toggle */}
             <div className="flex bg-neutral-900 rounded-xl p-1 border border-white/5 mr-2">
                <button onClick={() => setLanguage('en')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-white text-black' : 'text-neutral-500'}`}>EN</button>
                <button onClick={() => setLanguage('es')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === 'es' ? 'bg-white text-black' : 'text-neutral-500'}`}>ES</button>
             </div>

             {/* Desktop Navigation */}
             <div className="flex bg-neutral-900 rounded-xl p-1 border border-white/5 hidden md:flex">
                {navItems.map(item => {
                    const isActive = mode === item.id;
                    const activeClass = role === 'manager' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white';
                    return (
                        <button 
                            key={item.id}
                            onClick={() => setMode(item.id)} 
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isActive ? activeClass : 'text-neutral-500 hover:text-white'}`}
                        >
                            <item.icon size={14} /> {item.label}
                        </button>
                    )
                })}
             </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t p-4 flex justify-around z-50 overflow-x-auto ${role === 'manager' ? 'bg-blue-950 border-blue-900/30' : 'bg-black border-white/10'}`}>
         {navItems.map(item => {
             const isActive = mode === item.id;
             const activeColor = role === 'manager' ? 'text-blue-500' : 'text-purple-500';
             return (
                 <button 
                    key={item.id}
                    onClick={() => setMode(item.id)} 
                    className={`flex flex-col items-center gap-1 text-xs font-bold min-w-[60px] ${isActive ? activeColor : 'text-neutral-500'}`}
                 >
                     <item.icon size={20} />
                     {item.label}
                 </button>
             )
         })}
      </div>

      <main className="container mx-auto px-6 py-12 mb-20 md:mb-0">
        
        {/* VIEW: ANALYZER (SCOUT for Managers) */}
        {mode === 'analyzer' && (
          <>
            {!analysis && !loading && !isInterviewing && (
              <div className="max-w-3xl mx-auto text-center space-y-12 py-10">
                <div className="space-y-4">
                  <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter">{text.headline}<br/><span className={role === 'manager' ? 'text-blue-500' : 'text-purple-500'}>{text.headlineSuffix}</span></h1>
                  <p className="text-xl text-neutral-400 max-w-xl mx-auto">{text.subheadline}</p>
                </div>
                <FileUpload onFileSelect={handleFileSelect} language={language} />
              </div>
            )}

            {isInterviewing && (
              <div className="max-w-xl mx-auto py-12 space-y-10 animate-fade-in">
                 <div className="text-center space-y-2">
                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] ${role === 'manager' ? 'text-blue-500' : 'text-cyan-500'}`}>{text.sitDownTitle}</div>
                    <h2 className="text-3xl font-black text-white uppercase italic">{text.sitDownSub}</h2>
                 </div>
                 <div className="bg-neutral-900/40 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative">
                    <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black ${role === 'manager' ? 'bg-blue-600' : 'bg-cyan-600'}`}>{currentQIdx + 1}</div>
                    <p className="text-xl font-bold text-white mb-6 leading-relaxed">"{interviewQuestions[currentQIdx]}"</p>
                    <textarea 
                      autoFocus
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitAnswer())}
                      placeholder="..."
                      className={`w-full bg-black border border-neutral-800 rounded-2xl p-4 text-white outline-none min-h-[100px] resize-none ${role === 'manager' ? 'focus:border-blue-500' : 'focus:border-cyan-500'}`}
                    />
                    <div className="flex justify-between items-center mt-6">
                       <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{currentQIdx + 1} / {interviewQuestions.length}</div>
                       <button onClick={submitAnswer} className="bg-white text-black px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:scale-105 transition-all"><Send size={14}/> {text.nextQ}</button>
                    </div>
                 </div>
              </div>
            )}

            {loading && (
              <div className="max-w-md mx-auto text-center py-24 space-y-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border animate-pulse ${role === 'manager' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}>
                  <Disc size={40} className={`animate-spin-slow ${role === 'manager' ? 'text-blue-500' : 'text-purple-500'}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{text.loadingTitle}</h3>
                  <p className="text-neutral-500 font-mono text-xs uppercase tracking-[0.3em] mt-2">{loadingStep}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-lg mx-auto text-center py-20 space-y-6">
                <AlertTriangle size={64} className="text-red-500 mx-auto" />
                <h3 className="text-2xl font-black text-white">{text.errorTitle}</h3>
                <p className="text-neutral-400">{error}</p>
                <button onClick={handleReset} className="px-8 py-3 bg-neutral-800 text-white rounded-xl font-bold">{text.tryAgain}</button>
              </div>
            )}

            {analysis && audioUrl && <AnalysisResult analysis={analysis} audioUrl={audioUrl} onReset={handleReset} language={language} role={role} />}
          </>
        )}

        {/* VIEW: BLENDER (Artist Only) */}
        {mode === 'blender' && (
            <StyleBlender 
                language={language} 
                onAnalysisComplete={(res) => setStyleBlendResult(res)}
            />
        )}

        {/* VIEW: COACH (Artist Only) */}
        {mode === 'coach' && <VocalCoach language={language} />}

        {/* VIEW: MANAGER DASHBOARD (Manager Only) */}
        {mode === 'manager' && (
            <ManagerDashboard language={language} />
        )}

        {/* VIEW: STRATEGY (Artist Only - uses CareerManager) */}
        {mode === 'strategy' && (
            <CareerManager 
                language={language} 
                onRoadmapGenerated={(res, meta) => {
                    setCareerRoadmap(res);
                    if (meta?.socialStrategy) setSocialStrategy(meta.socialStrategy);
                }}
            />
        )}

        {/* VIEW: COMPARATOR (Both) */}
        {mode === 'comparator' && (
            <Comparator 
                language={language}
                onComparisonComplete={(res) => setComparisonResult(res)}
            />
        )}

        {/* VIEW: CHAT (Both) */}
        {mode === 'chat' && (
            <ExpertChat language={language} />
        )}

        {/* VIEW: VISUALS (Both) */}
        {mode === 'visuals' && (
            <ContentGenerator language={language} />
        )}
      </main>
    </div>
  );
};

export default App;
