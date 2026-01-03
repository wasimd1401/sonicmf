
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Activity, Zap, Headphones, StopCircle, Volume2, Music, MessageSquare, RefreshCw } from 'lucide-react';

interface VocalCoachProps {
  language?: 'en' | 'es';
}

const VocalCoach: React.FC<VocalCoachProps> = ({ language = 'en' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); 
  const [userVolume, setUserVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [coachMode, setCoachMode] = useState<'Singing' | 'Rapping'>('Singing');
  const [isSwitching, setIsSwitching] = useState(false);

  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // Translations
  const t = {
      en: {
          perfLab: "Performance Lab",
          title: "Performance Coach",
          singing: "Singing",
          rap: "Rap Flow",
          start: "Start Session",
          end: "End Session",
          directive: "Coach Directive",
          headphones: "Headphones Recommended",
          rapInstr: "Cypher will listen to your cadence and timing. Drop a verse to get analyzed.",
          singInstr: "Aria will evaluate your pitch and breath control. Sing a phrase to begin."
      },
      es: {
          perfLab: "Laboratorio de Rendimiento",
          title: "Entrenador en Vivo",
          singing: "Canto",
          rap: "Rap Flow",
          start: "Iniciar Sesión",
          end: "Terminar Sesión",
          directive: "Directiva del Coach",
          headphones: "Auriculares Recomendados",
          rapInstr: "Cypher escuchará tu cadencia y ritmo. Tira un verso para ser analizado.",
          singInstr: "Aria evaluará tu afinación y control de aire. Canta una frase para comenzar."
      }
  };
  const text = t[language];

  // Listener for mode presets from the Analysis page
  useEffect(() => {
    const handlePreset = (e: any) => {
        const mode = e.detail;
        if (mode.includes('Rap')) setCoachMode('Rapping');
        else setCoachMode('Singing');
    };
    window.addEventListener('setCoachMode', handlePreset);
    return () => window.removeEventListener('setCoachMode', handlePreset);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsSpeaking(false);
    setUserVolume(0);
    
    // Stop all media tracks
    streamRef.current?.getTracks().forEach(t => t.stop());
    
    // Disconnect nodes
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    
    // Stop scheduled audio
    scheduledSourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    scheduledSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    
    // Close contexts
    inputContextRef.current?.close();
    outputContextRef.current?.close();
    
    inputContextRef.current = null;
    outputContextRef.current = null;
    sessionPromiseRef.current = null;
  }, []);

  const connect = async (forcedMode?: 'Singing' | 'Rapping') => {
    const modeToUse = forcedMode || coachMode;
    setError(null);
    try {
      // Initialize Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Force resume mainly for Chrome autoplay policies
      await inputContextRef.current.resume();
      await outputContextRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
          } 
      });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Localized Prompts
      const rapPrompt = language === 'es' 
        ? `Eres "Cypher", un coach de rap. Escucha el flow del usuario.
           Responde SOLO con audio corto y directo.
           Si el usuario rapea, analiza su tiempo y rimas.
           Si hay silencio, anímalo a empezar.`
        : `You are "Cypher", a rap flow coach. Listen to the user's delivery.
           Response MUST be audio only. Keep feedback short and punchy.
           If they rap, analyze their pocket and rhymes.
           If silence, encourage them to drop a beat or start spitting.`;

      const singPrompt = language === 'es'
        ? `Eres "Aria", una instructora de canto.
           Responde SOLO con audio.
           Escucha la afinación. Si desafinan, corrígelos amablemente.
           Pídeles que canten una nota si hay silencio.`
        : `You are "Aria", a vocal coach.
           Response MUST be audio only.
           Listen for pitch accuracy. If they are flat, guide them back.
           Ask them to sing a scale if they are quiet.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: modeToUse === 'Rapping' ? 'Fenrir' : 'Puck' } },
          },
          systemInstruction: modeToUse === 'Rapping' ? rapPrompt : singPrompt,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsSwitching(false);
            setupAudioInput(stream);
          },
          onmessage: (message: LiveServerMessage) => {
            handleServerMessage(message);
          },
          onclose: () => {
            if (!isSwitching) setIsConnected(false);
          },
          onerror: (e) => {
            console.error(e);
            setError("Connection disrupted.");
            disconnect();
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Setup failed", err);
      setError("Microphone access denied or error.");
      disconnect();
    }
  };

  const setupAudioInput = (stream: MediaStream) => {
    if (!inputContextRef.current || !sessionPromiseRef.current) return;

    const source = inputContextRef.current.createMediaStreamSource(stream);
    // Lower buffer size (2048) for better latency
    const processor = inputContextRef.current.createScriptProcessor(2048, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      setUserVolume(Math.sqrt(sum / inputData.length) * 10); 

      // Send to Gemini
      const pcmBlob = createPcmBlob(inputData);
      sessionPromiseRef.current?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(processor);
    
    // CRITICAL FIX: Connect to a mute gain node instead of direct destination.
    // This keeps the processor alive without monitoring (hearing yourself).
    const silenceNode = inputContextRef.current.createGain();
    silenceNode.gain.value = 0;
    processor.connect(silenceNode);
    silenceNode.connect(inputContextRef.current.destination);

    sourceRef.current = source;
    processorRef.current = processor;
  };

  const handleServerMessage = async (message: LiveServerMessage) => {
    // 1. Handle Interruption (User spoke over AI)
    const interrupted = message.serverContent?.interrupted;
    if (interrupted) {
        scheduledSourcesRef.current.forEach(s => {
            try { s.stop(); } catch(e) {}
        });
        scheduledSourcesRef.current = [];
        nextStartTimeRef.current = 0;
        setIsSpeaking(false);
        return;
    }

    // 2. Handle Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && outputContextRef.current) {
        setIsSpeaking(true);
        const ctx = outputContextRef.current;
        
        // Ensure context is running
        if (ctx.state === 'suspended') await ctx.resume();

        // Sync timing
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

        const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        source.start(nextStartTimeRef.current);
        scheduledSourcesRef.current.push(source);
        
        nextStartTimeRef.current += audioBuffer.duration;

        source.onended = () => {
            scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
            if (scheduledSourcesRef.current.length === 0) {
                setIsSpeaking(false);
            }
        };
    }
  };

  const handleModeToggle = async (newMode: 'Singing' | 'Rapping') => {
    if (newMode === coachMode) return;
    setCoachMode(newMode);
    
    if (isConnected) {
        setIsSwitching(true);
        const currentStream = streamRef.current;
        disconnect();
        // Brief pause to allow cleanup before reconnecting
        await new Promise(r => setTimeout(r, 200));
        connect(newMode);
    }
  };

  // --- Audio Utils ---

  function createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

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
    const dataInt16 = new Int16Array(data.buffer);
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

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col items-center justify-center relative animate-fade-in pb-10">
        <div className={`absolute inset-0 bg-gradient-to-b ${coachMode === 'Rapping' ? 'from-purple-900/20' : 'from-cyan-900/20'} via-black to-black transition-all duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}></div>

        <div className="z-10 text-center space-y-8 w-full max-w-md">
            <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-500 border text-xs font-bold uppercase tracking-widest mb-4 ${coachMode === 'Rapping' ? 'bg-purple-900/30 border-purple-500/30 text-purple-400' : 'bg-cyan-900/30 border-cyan-500/30 text-cyan-400'}`}>
                    <Activity size={14} className={isConnected ? "animate-pulse" : ""} />
                    {coachMode === 'Rapping' ? 'Flow' : 'Vocal'} {text.perfLab}
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter mb-2">{text.title}</h2>
                
                <div className="flex justify-center gap-4 mt-6">
                   <button 
                     onClick={() => handleModeToggle('Singing')}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all transform active:scale-95 ${coachMode === 'Singing' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400' : 'bg-neutral-900 text-neutral-500 border border-transparent hover:text-white'}`}
                   >
                     <Music size={14} /> {text.singing}
                   </button>
                   <button 
                     onClick={() => handleModeToggle('Rapping')}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all transform active:scale-95 ${coachMode === 'Rapping' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400' : 'bg-neutral-900 text-neutral-500 border border-transparent hover:text-white'}`}
                   >
                     <Mic size={14} /> {text.rap}
                   </button>
                </div>
            </div>

            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${coachMode === 'Rapping' ? 'border-purple-500/20' : 'border-cyan-500/20'} ${isConnected ? 'scale-100 opacity-100' : 'scale-90 opacity-50'}`}></div>
                <div 
                    className={`w-32 h-32 rounded-full blur-2xl transition-all duration-300 absolute ${isSpeaking ? (coachMode === 'Rapping' ? 'bg-purple-400 scale-125' : 'bg-cyan-400 scale-125') : (coachMode === 'Rapping' ? 'bg-purple-900/50 scale-100' : 'bg-cyan-900/50 scale-100')}`}
                    style={{ opacity: isSpeaking ? 0.8 : 0.3 }}
                ></div>
                <div 
                    className={`absolute inset-0 rounded-full border-4 transition-all duration-75`}
                    style={{ 
                        transform: `scale(${1 + userVolume * 1.5})`,
                        opacity: userVolume > 0.01 ? 0.6 : 0,
                        borderColor: coachMode === 'Rapping' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(34, 211, 238, 0.4)'
                    }}
                ></div>
                <div className={`relative w-40 h-40 bg-black rounded-full border flex items-center justify-center z-10 overflow-hidden transition-colors duration-500 ${coachMode === 'Rapping' ? 'border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)]' : 'border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]'}`}>
                    {(isConnected && !isSwitching) ? (
                        <div className="flex gap-1.5 items-center h-16">
                            {[1,2,3,4,5].map(i => (
                                <div 
                                    key={i} 
                                    className={`w-2.5 rounded-full transition-all duration-150 ${coachMode === 'Rapping' ? 'bg-purple-400' : 'bg-cyan-400'}`}
                                    style={{ 
                                        height: isSpeaking ? `${20 + Math.random() * 45}px` : '6px',
                                        opacity: isSpeaking ? 1 : 0.3
                                    }}
                                ></div>
                            ))}
                        </div>
                    ) : isSwitching ? (
                        <RefreshCw size={40} className="text-white animate-spin opacity-50" />
                    ) : (
                        <Headphones size={48} className="text-neutral-700" />
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    <Zap size={16} /> {error}
                </div>
            )}

            <div className="flex justify-center gap-6">
                {!isConnected ? (
                    <button 
                        onClick={() => connect()}
                        className="group relative px-10 py-4 bg-white text-black rounded-full font-black text-xl flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95"
                    >
                        <Mic size={24} className={`transition-colors ${coachMode === 'Rapping' ? 'group-hover:text-purple-600' : 'group-hover:text-cyan-600'}`} />
                        {text.start}
                    </button>
                ) : (
                    <button 
                        onClick={() => disconnect()}
                        className="px-10 py-4 bg-red-600 text-white rounded-full font-black text-xl flex items-center gap-3 hover:bg-red-500 transition-all shadow-lg active:scale-95"
                    >
                        <StopCircle size={24} />
                        {text.end}
                    </button>
                )}
            </div>

            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-3 flex items-center justify-center gap-2">
                    <MessageSquare size={16} className={coachMode === 'Rapping' ? 'text-purple-500' : 'text-cyan-500'}/> {text.directive}
                </h4>
                <p className="text-neutral-400 text-sm leading-relaxed">
                    {coachMode === 'Rapping' 
                        ? text.rapInstr 
                        : text.singInstr}
                </p>
                <p className="text-[10px] text-neutral-600 mt-4 uppercase tracking-[0.2em]">{text.headphones}</p>
            </div>
        </div>
    </div>
  );
};

export default VocalCoach;
