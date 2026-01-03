
import React, { useState, useRef } from 'react';
import { Sparkles, Play, Pause, Copy, Disc, Loader2, Mic2, FileAudio, PenTool, Edit3, Volume2, ExternalLink, Speaker, Music4, Settings2 } from 'lucide-react';
import { generateSunoPrompt } from '../services/geminiService';
import { generateSunoTrack } from '../services/sunoService';
import { SunoPromptData } from '../types';

const Studio: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [lyricsMode, setLyricsMode] = useState<'ai' | 'custom'>('ai');
  const [customLyrics, setCustomLyrics] = useState('');
  
  const [isEngineered, setIsEngineered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [promptData, setPromptData] = useState<SunoPromptData | null>(null);
  
  // Audio Generation State
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<{url: string, title: string} | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleEngineerPrompt = async () => {
    if (!concept.trim() && (lyricsMode === 'custom' && !customLyrics.trim())) return;

    setIsProcessing(true);
    try {
      const lyricsToSend = lyricsMode === 'custom' ? customLyrics : undefined;
      const result = await generateSunoPrompt(concept, undefined, undefined, lyricsToSend);
      setPromptData(result);
      setIsEngineered(true);
    } catch (error) {
      console.error(error);
      alert("Failed to engineer song data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!promptData) return;
    
    setIsGeneratingAudio(true);
    setGeneratedTrack(null);

    try {
        const tracks = await generateSunoTrack(
            promptData.musicFXPrompt, // Using the optimized prompt
            isInstrumental,
            promptData.lyrics,
            promptData.title
        );
        
        if (tracks && tracks.length > 0 && tracks[0].audio_url) {
            setGeneratedTrack({
                url: tracks[0].audio_url,
                title: tracks[0].title || 'Untitled'
            });
        }
    } catch (error: any) {
        console.error("Music Generation Error:", error);
        alert("Failed to generate music.");
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.pause();
    } else {
        audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const updatePromptData = (field: keyof SunoPromptData, value: string) => {
    if (!promptData) return;
    setPromptData({ ...promptData, [field]: value });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in-up pb-20">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
            <Music4 size={32} className="text-indigo-500" />
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter">
          Sonic<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Studio</span>
        </h2>
        <p className="text-neutral-400 max-w-lg mx-auto text-lg">
          Generative Music Engine. Powered by Suno & Gemini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Input & Lyrics */}
          <div className="lg:col-span-5 space-y-6">
              <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
                 <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <PenTool size={18} className="text-indigo-500"/> Songwriter
                 </h3>
                 
                 <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Vibe / Concept</label>
                        <textarea 
                            value={concept}
                            onChange={(e) => setConcept(e.target.value)}
                            placeholder="A dark trap beat with heavy 808s and aggressive flow..."
                            className="w-full bg-black/60 border border-neutral-700 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none h-24 resize-none transition-colors"
                        />
                    </div>

                    <div className="flex gap-2">
                         <button 
                            onClick={() => setLyricsMode('ai')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${lyricsMode === 'ai' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black border-neutral-800 text-neutral-500'}`}
                         >
                            AI Lyrics
                         </button>
                         <button 
                            onClick={() => setLyricsMode('custom')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${lyricsMode === 'custom' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black border-neutral-800 text-neutral-500'}`}
                         >
                            Custom
                         </button>
                    </div>

                    {lyricsMode === 'custom' && (
                        <textarea 
                            value={customLyrics}
                            onChange={(e) => setCustomLyrics(e.target.value)}
                            placeholder="Paste lyrics..."
                            className="w-full bg-black/60 border border-neutral-700 rounded-xl p-4 text-white text-xs font-mono focus:border-indigo-500 outline-none h-32 resize-none"
                        />
                    )}

                    <button
                        onClick={handleEngineerPrompt}
                        disabled={isProcessing || (!concept && !customLyrics)}
                        className="w-full bg-white hover:bg-neutral-200 text-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        Engineer Prompt
                    </button>
                 </div>
              </div>

              {promptData && (
                  <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6 h-[400px] flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                          <input 
                              value={promptData.title}
                              onChange={(e) => updatePromptData('title', e.target.value)}
                              className="bg-transparent text-white font-bold text-lg outline-none border-b border-transparent focus:border-indigo-500 placeholder-neutral-600 w-full mr-4"
                              placeholder="Untitled Song"
                          />
                          <button onClick={() => copyToClipboard(promptData.lyrics)} className="text-neutral-500 hover:text-white"><Copy size={14}/></button>
                      </div>
                      <textarea 
                          value={promptData.lyrics}
                          onChange={(e) => updatePromptData('lyrics', e.target.value)}
                          className="flex-1 w-full bg-black/40 border border-neutral-800 rounded-xl p-4 text-neutral-300 font-mono text-xs leading-relaxed outline-none resize-none focus:border-indigo-500 custom-scrollbar"
                      />
                  </div>
              )}
          </div>

          {/* RIGHT: Generator & Player */}
          <div className="lg:col-span-7 space-y-6">
              <div className="bg-gradient-to-br from-indigo-900/20 to-black border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden h-full flex flex-col">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                  <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
                      {!promptData ? (
                          <div className="text-neutral-600">
                              <Disc size={64} className="mx-auto mb-4 opacity-20" />
                              <p className="text-sm font-bold uppercase tracking-widest">Awaiting Prompt Engineering</p>
                          </div>
                      ) : (
                          <div className="w-full max-w-md space-y-8 animate-fade-in">
                              
                              {/* Prompt Preview */}
                              <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-left">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Optimized Generation Prompt</span>
                                      <button onClick={() => copyToClipboard(promptData.musicFXPrompt)} className="text-neutral-500 hover:text-white"><Copy size={12}/></button>
                                  </div>
                                  <p className="text-xs text-neutral-300 font-mono leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-help">
                                      {promptData.musicFXPrompt}
                                  </p>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center justify-center gap-4">
                                  <button 
                                      onClick={() => setIsInstrumental(!isInstrumental)}
                                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${isInstrumental ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black border-neutral-700 text-neutral-400'}`}
                                  >
                                      <Settings2 size={14} /> Instrumental
                                  </button>
                                  <div className="text-xs text-neutral-500 font-mono bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                                      Model: v3.5
                                  </div>
                              </div>

                              <button 
                                  onClick={handleGenerateMusic}
                                  disabled={isGeneratingAudio}
                                  className="w-full bg-white hover:bg-neutral-200 text-black py-4 rounded-full font-black text-lg flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                              >
                                  {isGeneratingAudio ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} fill="currentColor" />}
                                  {isGeneratingAudio ? "Generating..." : "Generate Track"}
                              </button>
                          </div>
                      )}
                  </div>

                  {/* Audio Player Footer */}
                  {generatedTrack && (
                      <div className="mt-8 bg-neutral-900/90 border border-indigo-500/30 rounded-2xl p-4 animate-fade-in relative z-20 shadow-2xl">
                          <audio ref={audioRef} src={generatedTrack.url} onEnded={() => setIsPlaying(false)} className="hidden" />
                          
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                  <Music4 size={24} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-bold truncate">{generatedTrack.title}</h4>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Generated</span>
                                      <span className="text-[10px] text-neutral-500">Suno v3.5</span>
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                  <button 
                                      onClick={togglePlay}
                                      className="w-10 h-10 bg-white hover:bg-neutral-200 rounded-full flex items-center justify-center text-black transition-colors"
                                  >
                                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                                  </button>
                                  <a 
                                      href={generatedTrack.url} 
                                      download 
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors"
                                  >
                                      <Disc size={18} />
                                  </a>
                              </div>
                          </div>

                          {/* Visualizer Bar (Fake) */}
                          <div className="mt-4 flex items-end gap-1 h-8 opacity-50">
                              {[...Array(40)].map((_, i) => (
                                  <div 
                                      key={i} 
                                      className={`flex-1 bg-indigo-500 rounded-t-sm transition-all duration-300 ${isPlaying ? 'animate-wave-fast' : 'h-1'}`}
                                      style={{ 
                                          height: isPlaying ? `${Math.random() * 100}%` : '4px',
                                          animationDelay: `${i * 0.05}s` 
                                      }}
                                  ></div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Studio;
