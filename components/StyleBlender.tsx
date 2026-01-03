
import React, { useState } from 'react';
import { Plus, X, Upload, Link as LinkIcon, Wand2, Loader2, Music4, ArrowRight, Layers, Sliders } from 'lucide-react';
import { ReferenceTrack, StyleBlendAnalysis } from '../types';
import { analyzeStyleBlend } from '../services/geminiService';

interface StyleBlenderProps {
  language?: 'en' | 'es';
  onAnalysisComplete?: (result: StyleBlendAnalysis) => void;
}

const StyleBlender: React.FC<StyleBlenderProps> = ({ language = 'en', onAnalysisComplete }) => {
  const [references, setReferences] = useState<ReferenceTrack[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<StyleBlendAnalysis | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Translations
  const t = {
      en: {
          title: "SonicFusion Engine",
          desc: "Upload up to 3 different tracks. The engine will extract their DNA and synthesize a high-fidelity production recipe to fuse them into a new genre.",
          track: "Track",
          upload: "Upload",
          link: "Link",
          addRef: "Add Reference Track",
          pasteUrl: "Paste audio URL...",
          cancel: "Cancel",
          add: "Add",
          execute: "Execute Fusion",
          synthesizing: "Synthesizing...",
          result: "Synthesis Result",
          targetBpm: "Target BPM",
          targetKey: "Target Key",
          ingredients: "Ingredients",
          role: "Role",
          extract: "Extract",
          protocol: "Production Protocol",
          tip: "Pro Tip"
      },
      es: {
          title: "Motor SonicFusion",
          desc: "Sube hasta 3 pistas. El motor extraerá su ADN y sintetizará una receta de producción para fusionarlas en un nuevo género.",
          track: "Pista",
          upload: "Subir",
          link: "Enlace",
          addRef: "Añadir Pista Ref",
          pasteUrl: "Pegar URL de audio...",
          cancel: "Cancelar",
          add: "Añadir",
          execute: "Ejecutar Fusión",
          synthesizing: "Sintetizando...",
          result: "Resultado de Síntesis",
          targetBpm: "BPM Objetivo",
          targetKey: "Tono Objetivo",
          ingredients: "Ingredientes",
          role: "Rol",
          extract: "Extraer",
          protocol: "Protocolo de Producción",
          tip: "Consejo Pro"
      }
  };
  const text = t[language];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (references.length >= 3) return;
      const file = e.target.files[0];
      const newRef: ReferenceTrack = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: 'file',
        data: file,
        mimeType: file.type
      };
      setReferences([...references, newRef]);
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    if (references.length >= 3) return;
    const newRef: ReferenceTrack = {
      id: Math.random().toString(36).substr(2, 9),
      name: urlInput.split('/').pop() || 'URL Track',
      type: 'url',
      data: urlInput,
    };
    setReferences([...references, newRef]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const removeReference = (id: string) => {
    setReferences(references.filter(r => r.id !== id));
  };

  const processFile = async (ref: ReferenceTrack): Promise<{ base64: string, mimeType: string, name: string }> => {
    if (ref.type === 'file') {
      const file = ref.data as File;
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          base64: (reader.result as string).split(',')[1],
          mimeType: file.type,
          name: ref.name
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      const response = await fetch(ref.data as string);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          base64: (reader.result as string).split(',')[1],
          mimeType: blob.type,
          name: ref.name
        });
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  };

  const handleBlend = async () => {
    if (references.length === 0) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const processedBuffers = await Promise.all(references.map(processFile));
      const analysis = await analyzeStyleBlend(processedBuffers, language as 'en' | 'es');
      setResult(analysis);
      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }
    } catch (error) {
      console.error("Blend failed", error);
      alert("Failed to analyze blend.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-fade-in-up pb-20">
      
      {/* Header */}
      <div className="text-center space-y-6">
        <h2 className="text-5xl font-black text-white tracking-tighter">
          Sonic<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-fuchsia-500">Fusion</span> Engine
        </h2>
        <p className="text-neutral-400 max-w-2xl mx-auto text-lg leading-relaxed">{text.desc}</p>
      </div>

      {/* Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Existing Cards */}
        {references.map((ref, idx) => (
          <div key={ref.id} className="bg-neutral-900/50 border border-white/10 rounded-3xl p-8 relative group hover:border-purple-500/50 hover:bg-neutral-900 transition-all shadow-xl">
            <button 
              onClick={() => removeReference(ref.id)}
              className="absolute top-4 right-4 p-2 bg-black hover:bg-red-500 hover:text-white rounded-full text-neutral-500 transition-colors border border-white/5"
            >
              <X size={16} />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-900 to-black rounded-2xl flex items-center justify-center text-purple-400 mb-6 border border-white/5 shadow-inner">
              <Music4 size={32} />
            </div>
            <h3 className="text-white font-bold truncate mb-1 text-lg">{text.track} 0{idx + 1}</h3>
            <p className="text-xs text-neutral-500 truncate font-mono uppercase tracking-widest">{ref.name}</p>
          </div>
        ))}

        {/* Add Button */}
        {references.length < 3 && (
          <div className="bg-black/30 border-2 border-dashed border-neutral-800 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 hover:bg-neutral-900/30 hover:border-purple-500/50 transition-all group">
            {!showUrlInput ? (
              <>
                 <div className="flex gap-4">
                    <div className="relative overflow-hidden">
                       <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                       <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-transform group-hover:scale-105 shadow-lg shadow-purple-900/20">
                         <Upload size={18} /> {text.upload}
                       </button>
                    </div>
                    <button 
                      onClick={() => setShowUrlInput(true)}
                      className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-transform group-hover:scale-105"
                    >
                      <LinkIcon size={18} /> {text.link}
                    </button>
                 </div>
                 <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">{text.addRef}</p>
              </>
            ) : (
              <div className="w-full space-y-3">
                 <input 
                   type="text" 
                   value={urlInput}
                   onChange={(e) => setUrlInput(e.target.value)}
                   placeholder={text.pasteUrl}
                   className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                 />
                 <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowUrlInput(false)} className="text-xs text-neutral-500 hover:text-white font-bold uppercase">{text.cancel}</button>
                    <button onClick={handleUrlAdd} className="text-xs bg-purple-600 px-4 py-2 rounded-lg text-white hover:bg-purple-500 font-bold uppercase">{text.add}</button>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={handleBlend}
          disabled={references.length === 0 || isAnalyzing}
          className={`px-10 py-5 rounded-full font-black text-xl shadow-[0_0_40px_rgba(147,51,234,0.3)] flex items-center gap-4 transition-all transform hover:scale-105
            ${references.length === 0 
              ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800' 
              : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-[0_0_60px_rgba(147,51,234,0.5)]'
            }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              {text.synthesizing}
            </>
          ) : (
            <>
              <Wand2 size={24} />
              {text.execute}
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-12 animate-fade-in border-t border-white/5 pt-12">
          
          {/* Concept Header */}
          <div className="bg-neutral-900/50 border border-white/5 rounded-[2rem] p-12 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
             <h3 className="text-xs uppercase tracking-[0.3em] text-purple-400 mb-4 font-bold relative z-10">{text.result}</h3>
             <h2 className="text-5xl md:text-6xl font-black text-white mb-8 relative z-10 tracking-tight">{result.synthesisConcept}</h2>
             <div className="flex justify-center gap-4 md:gap-8 relative z-10">
                <div className="bg-black/50 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                   <span className="text-neutral-500 text-[10px] uppercase block font-black tracking-widest mb-1">{text.targetBpm}</span>
                   <span className="text-2xl font-black text-white">{result.suggestedBpm}</span>
                </div>
                <div className="bg-black/50 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                   <span className="text-neutral-500 text-[10px] uppercase block font-black tracking-widest mb-1">{text.targetKey}</span>
                   <span className="text-2xl font-black text-white">{result.suggestedKey}</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left: Source Breakdown */}
             <div className="lg:col-span-1 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-wide">
                   <Layers className="text-fuchsia-500" />
                   {text.ingredients}
                </h3>
                {result.sourceBreakdowns.map((item, idx) => (
                  <div key={idx} className="bg-black/40 border border-neutral-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-colors">
                     <div className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-2">
                        {text.track} {idx + 1}
                     </div>
                     <div className="text-white font-bold text-lg mb-3">{item.trackName}</div>
                     <div className="text-sm text-neutral-400 font-medium">
                        {text.role}: <span className="text-white">{item.roleInMix}</span>
                     </div>
                     <div className="mt-4 pt-4 border-t border-white/5">
                        <span className="text-neutral-500 block text-[10px] uppercase tracking-widest mb-1 font-bold">{text.extract}</span>
                        <p className="text-sm text-neutral-200 italic">"{item.keyElementToExtract}"</p>
                     </div>
                  </div>
                ))}
             </div>

             {/* Right: The Recipe */}
             <div className="lg:col-span-2">
                <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-wide mb-6">
                   <Sliders className="text-purple-500" />
                   {text.protocol}
                </h3>
                <div className="space-y-4">
                   {result.productionRecipe.map((step, idx) => (
                      <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 flex gap-6 hover:bg-neutral-900/50 transition-colors group">
                         <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-800 text-purple-500 flex items-center justify-center font-black text-xl border border-white/5 group-hover:border-purple-500/30 group-hover:text-purple-400 transition-all">
                            {idx + 1}
                         </div>
                         <div className="space-y-3 flex-1">
                            <h4 className="text-lg font-bold text-white group-hover:text-purple-200 transition-colors">{step.title}</h4>
                            <p className="text-neutral-400 leading-relaxed text-sm">{step.instruction}</p>
                            <div className="bg-purple-900/10 border border-purple-500/10 rounded-xl p-4 flex items-start gap-3">
                               <Wand2 size={16} className="text-purple-400 mt-0.5 shrink-0" />
                               <p className="text-xs text-purple-200 font-medium leading-relaxed"><span className="uppercase font-black text-purple-400 tracking-wider">{text.tip}:</span> {step.technicalTip}</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default StyleBlender;
