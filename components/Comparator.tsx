
import React, { useState } from 'react';
import { SongAnalysis, ComparisonResult, ProgressionReport } from '../types';
import { analyzeAudio, compareTracks } from '../services/geminiService';
import { Upload, X, Swords, Loader2, Trophy, AlertCircle, Music, History, ArrowRight } from 'lucide-react';

interface ComparatorProps {
  language?: 'en' | 'es';
  onComparisonComplete?: (result: ComparisonResult | ProgressionReport) => void;
}

const Comparator: React.FC<ComparatorProps> = ({ language = 'en', onComparisonComplete }) => {
  const [mode, setMode] = useState<'versus' | 'evolution'>('versus');
  const [trackA, setTrackA] = useState<{file: File, analysis?: SongAnalysis} | null>(null);
  const [trackB, setTrackB] = useState<{file: File, analysis?: SongAnalysis} | null>(null);
  const [result, setResult] = useState<ComparisonResult | ProgressionReport | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const t = {
    en: {
        title: "Sonic Arena",
        subtitleVersus: "A/B Test two tracks against each other to find the winner.",
        subtitleEvo: "Track evolution. Compare V1 vs V2 to measure improvement.",
        modeVersus: "Battle Mode",
        modeEvo: "Evolution Mode",
        dropA: "Reference (V1)",
        dropB: "Challenger (V2)",
        fight: "Start Battle",
        evolve: "Measure Growth",
        analyzing: "Analyzing...",
        comparing: "Running simulation...",
        winner: "Winner",
        growth: "Growth Score",
        tie: "It's a Tie",
        score: "Score",
        rec: "Recommendation",
        diff: "Key Difference",
        improvements: "Improvements",
        verdict: "Verdict",
        nextSteps: "Next Steps"
    },
    es: {
        title: "Arena Sónica",
        subtitleVersus: "Prueba A/B dos pistas para encontrar la ganadora.",
        subtitleEvo: "Evolución. Compara V1 vs V2 para medir mejoras.",
        modeVersus: "Modo Batalla",
        modeEvo: "Modo Evolución",
        dropA: "Referencia (V1)",
        dropB: "Retador (V2)",
        fight: "Iniciar Batalla",
        evolve: "Medir Crecimiento",
        analyzing: "Analizando...",
        comparing: "Corriendo simulación...",
        winner: "Ganador",
        growth: "Puntaje de Crecimiento",
        tie: "Empate",
        score: "Puntaje",
        rec: "Recomendación",
        diff: "Diferencia Clave",
        improvements: "Mejoras",
        verdict: "Veredicto",
        nextSteps: "Próximos Pasos"
    }
  };
  const text = t[language];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (side === 'A') setTrackA({ file });
          else setTrackB({ file });
          setResult(null); // Reset result on new upload
      }
  };

  const executeComparison = async () => {
      if (!trackA || !trackB) return;
      setIsProcessing(true);
      
      try {
          // 1. Analyze A if needed
          let analysisA = trackA.analysis;
          if (!analysisA) {
              setStatus(`${text.analyzing} (A)`);
              const base64 = await fileToBase64(trackA.file);
              analysisA = await analyzeAudio(base64, trackA.file.type, language as 'en'|'es');
              setTrackA(prev => prev ? { ...prev, analysis: analysisA } : null);
          }

          // 2. Analyze B if needed
          let analysisB = trackB.analysis;
          if (!analysisB) {
              setStatus(`${text.analyzing} (B)`);
              const base64 = await fileToBase64(trackB.file);
              analysisB = await analyzeAudio(base64, trackB.file.type, language as 'en'|'es');
              setTrackB(prev => prev ? { ...prev, analysis: analysisB } : null);
          }

          // 3. Compare
          if (analysisA && analysisB) {
              setStatus(text.comparing);
              const compResult = await compareTracks(analysisA, analysisB, mode, language as 'en'|'es');
              setResult(compResult);
              if (onComparisonComplete) {
                onComparisonComplete(compResult);
              }
          }

      } catch (e) {
          console.error(e);
          alert("Comparison failed.");
      } finally {
          setIsProcessing(false);
          setStatus('');
      }
  };

  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = error => reject(error);
      });
  };

  // Type Guard
  const isProgressionReport = (res: any): res is ProgressionReport => {
      return (res as ProgressionReport).growthScore !== undefined;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in-up pb-20">
        <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">{text.title}</h2>
            <div className="flex justify-center gap-4">
                <button 
                   onClick={() => { setMode('versus'); setResult(null); }}
                   className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border transition-colors ${mode === 'versus' ? 'bg-white text-black border-white' : 'bg-transparent text-neutral-500 border-neutral-800 hover:text-white'}`}
                >
                    <Swords size={16} /> {text.modeVersus}
                </button>
                <button 
                   onClick={() => { setMode('evolution'); setResult(null); }}
                   className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border transition-colors ${mode === 'evolution' ? 'bg-white text-black border-white' : 'bg-transparent text-neutral-500 border-neutral-800 hover:text-white'}`}
                >
                    <History size={16} /> {text.modeEvo}
                </button>
            </div>
            <p className="text-neutral-400 text-lg">{mode === 'versus' ? text.subtitleVersus : text.subtitleEvo}</p>
        </div>

        {/* Upload Arena */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Corner A */}
            <div className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all h-64 ${trackA ? 'border-blue-500 bg-blue-900/10' : 'border-neutral-800 bg-black/40 hover:border-blue-500/50'}`}>
                {trackA ? (
                    <>
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                            <Music size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-white text-lg truncate max-w-[200px]">{trackA.file.name}</h3>
                            <button onClick={() => { setTrackA(null); setResult(null); }} className="text-xs text-blue-400 mt-2 hover:text-white uppercase font-bold">Remove</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center cursor-pointer" onClick={() => document.getElementById('upload-a')?.click()}>
                        <input id="upload-a" type="file" className="hidden" accept="audio/*" onChange={e => handleUpload(e, 'A')} />
                        <Upload size={40} className="mx-auto mb-4 text-neutral-600" />
                        <p className="text-blue-500 font-bold uppercase tracking-widest text-sm">{text.dropA}</p>
                    </div>
                )}
            </div>

            {/* Action Badge */}
            <div className="flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black font-black text-3xl italic shadow-2xl z-10">
                    {mode === 'versus' ? 'VS' : <ArrowRight size={32} />}
                </div>
                <button 
                    onClick={executeComparison}
                    disabled={!trackA || !trackB || isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isProcessing ? <Loader2 className="animate-spin" /> : mode === 'versus' ? <Swords size={20} /> : <History size={20} />}
                    {isProcessing ? status : (mode === 'versus' ? text.fight : text.evolve)}
                </button>
            </div>

            {/* Corner B */}
            <div className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all h-64 ${trackB ? 'border-red-500 bg-red-900/10' : 'border-neutral-800 bg-black/40 hover:border-red-500/50'}`}>
                {trackB ? (
                    <>
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                            <Music size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-white text-lg truncate max-w-[200px]">{trackB.file.name}</h3>
                            <button onClick={() => { setTrackB(null); setResult(null); }} className="text-xs text-red-400 mt-2 hover:text-white uppercase font-bold">Remove</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center cursor-pointer" onClick={() => document.getElementById('upload-b')?.click()}>
                        <input id="upload-b" type="file" className="hidden" accept="audio/*" onChange={e => handleUpload(e, 'B')} />
                        <Upload size={40} className="mx-auto mb-4 text-neutral-600" />
                        <p className="text-red-500 font-bold uppercase tracking-widest text-sm">{text.dropB}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Results */}
        {result && (
            <div className="animate-fade-in space-y-8">
                
                {/* Mode Specific Header */}
                <div className={`p-8 rounded-[2rem] text-center border relative overflow-hidden ${result.winner === 'A' ? 'bg-blue-900/20 border-blue-500/30' : result.winner === 'B' ? 'bg-red-900/20 border-red-500/30' : 'bg-neutral-800 border-white/10'}`}>
                    <div className="relative z-10">
                        {isProgressionReport(result) ? (
                            <>
                                <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-2">{text.growth}</h4>
                                <div className="text-6xl font-black text-white mb-4">{result.growthScore}<span className="text-2xl text-neutral-500">/100</span></div>
                                <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">"{result.summary}"</p>
                            </>
                        ) : (
                            <>
                                <Trophy size={48} className={`mx-auto mb-4 ${result.winner === 'A' ? 'text-blue-500' : result.winner === 'B' ? 'text-red-500' : 'text-yellow-500'}`} />
                                <h3 className="text-4xl font-black text-white uppercase italic mb-2">
                                    {result.winner === 'A' ? `${text.winner}: ${trackA?.file.name}` : result.winner === 'B' ? `${text.winner}: ${trackB?.file.name}` : text.tie}
                                </h3>
                                <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">"{result.summary}"</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Evolution Specific Details */}
                {isProgressionReport(result) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-2xl">
                             <h4 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <History size={16} className="text-green-500" /> {text.improvements}
                             </h4>
                             <div className="space-y-4">
                                {result.improvements.map((imp, i) => (
                                    <div key={i} className="bg-black/40 p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-white">{imp.area}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${imp.verdict === 'Fixed' || imp.verdict === 'Improved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{imp.verdict}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-neutral-500 block mb-1">Before</span>
                                                <span className="text-neutral-300">{imp.before}</span>
                                            </div>
                                            <div>
                                                <span className="text-neutral-500 block mb-1">After</span>
                                                <span className="text-white">{imp.after}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                        <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-2xl">
                             <h4 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ArrowRight size={16} className="text-blue-500" /> {text.nextSteps}
                             </h4>
                             <p className="text-neutral-300 leading-relaxed text-sm bg-black/40 p-4 rounded-xl border border-white/5">
                                 {result.nextSteps}
                             </p>
                        </div>
                    </div>
                )}

                {/* Common Categories Table (Used for both modes) */}
                <div className="grid grid-cols-1 gap-4">
                    {result.categories.map((cat, i) => (
                        <div key={i} className="bg-neutral-900/50 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 w-full">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-white">{cat.name}</span>
                                    <span className="text-xs text-neutral-500 uppercase tracking-widest">{text.score}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-blue-500 font-black w-8 text-right">{cat.scoreA}</span>
                                    <div className="flex-1 h-3 bg-neutral-800 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-blue-600" style={{ width: `${cat.scoreA}%` }}></div>
                                        <div className="h-full bg-neutral-800 flex-1"></div>
                                        <div className="h-full bg-red-600" style={{ width: `${cat.scoreB}%` }}></div>
                                    </div>
                                    <span className="text-red-500 font-black w-8">{cat.scoreB}</span>
                                </div>
                            </div>
                            <div className="md:w-1/3 text-xs text-neutral-400 italic border-l border-white/5 pl-6">
                                "{cat.notes}"
                            </div>
                        </div>
                    ))}
                </div>

                {/* Key Insights (Versus Mode specific, but applicable generally) */}
                {!isProgressionReport(result) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl">
                             <h4 className="text-white font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <AlertCircle size={16} className="text-purple-500" /> {text.diff}
                             </h4>
                             <p className="text-neutral-300">{result.keyDifference}</p>
                        </div>
                        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl">
                             <h4 className="text-white font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <Trophy size={16} className="text-yellow-500" /> {text.rec}
                             </h4>
                             <p className="text-white font-medium">{result.recommendation}</p>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default Comparator;
