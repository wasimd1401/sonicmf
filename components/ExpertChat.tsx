
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, Music, Mic2, Sliders, Sparkles, User, Bot, Trash2, Briefcase, TrendingUp, Users } from 'lucide-react';
import { ExpertChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ExpertChatProps {
  language?: 'en' | 'es';
}

const ExpertChat: React.FC<ExpertChatProps> = ({ language = 'en' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<'producer' | 'manager'>('producer');
  const sessionRef = useRef<ExpertChatSession | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = {
    en: {
        producer: "Studio Expert",
        manager: "AI Manager",
        producerSub: "Your personal producer, engineer, and writer. Ask anything technical.",
        managerSub: "Your personal A&R and business manager. Ask about growth & strategy.",
        placeholder: "Type a message...",
        empty: "No messages yet. Start the session.",
        clear: "Clear Chat",
        suggestions: {
            producer: [
                { label: "Mixing Help", query: "How do I EQ a muddy kick drum?", icon: Sliders },
                { label: "Lyrics", query: "Give me rhymes for 'city lights'", icon: Mic2 },
                { label: "Production", query: "Tips for making a drop hit harder?", icon: Music }
            ],
            manager: [
                { label: "Marketing", query: "How do I promote my new single on TikTok?", icon: TrendingUp },
                { label: "Branding", query: "Help me define my artist brand identity.", icon: Sparkles },
                { label: "Business", query: "Explain music royalties and splits.", icon: Briefcase }
            ]
        }
    },
    es: {
        producer: "Experto de Estudio",
        manager: "Manager IA",
        producerSub: "Tu productor, ingeniero y escritor personal. Pregunta lo que sea.",
        managerSub: "Tu A&R y manager de negocios. Pregunta sobre estrategia.",
        placeholder: "Escribe un mensaje...",
        empty: "Sin mensajes. Inicia la sesión.",
        clear: "Limpiar Chat",
        suggestions: {
            producer: [
                { label: "Mezcla", query: "¿Cómo ecualizo un bombo sucio?", icon: Sliders },
                { label: "Letras", query: "Rimas para 'luz de ciudad'", icon: Mic2 },
                { label: "Producción", query: "¿Tips para un drop más fuerte?", icon: Music }
            ],
            manager: [
                { label: "Marketing", query: "¿Cómo promociono mi single en TikTok?", icon: TrendingUp },
                { label: "Marca", query: "Ayúdame a definir mi identidad de marca.", icon: Sparkles },
                { label: "Negocios", query: "Explica las regalías y porcentajes.", icon: Briefcase }
            ]
        }
    }
  };
  const text = t[language];

  useEffect(() => {
    // Initialize session on mount or persona change
    sessionRef.current = new ExpertChatSession(language as 'en' | 'es', persona);
    setMessages([]); // Clear chat on persona switch
  }, [language, persona]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend: string = input) => {
    if (!textToSend.trim() || !sessionRef.current) return;

    const userMsg = textToSend;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
        const response = await sessionRef.current.sendMessage(userMsg);
        setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClear = () => {
      setMessages([]);
      sessionRef.current = new ExpertChatSession(language as 'en' | 'es', persona);
  };

  const activeColor = persona === 'manager' ? 'text-emerald-500' : 'text-indigo-500';
  const activeBg = persona === 'manager' ? 'bg-emerald-600' : 'bg-indigo-600';
  const activeBorder = persona === 'manager' ? 'border-emerald-500' : 'border-indigo-500';

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col animate-fade-in pb-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-6">
             <div className="inline-flex bg-neutral-900 border border-white/10 p-1 rounded-2xl mb-4">
                 <button 
                    onClick={() => setPersona('producer')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${persona === 'producer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                 >
                     <Music size={16} /> {text.producer}
                 </button>
                 <button 
                    onClick={() => setPersona('manager')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${persona === 'manager' ? 'bg-emerald-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                 >
                     <Briefcase size={16} /> {text.manager}
                 </button>
             </div>
             <div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2">
                    {persona === 'producer' ? text.producer : text.manager}
                </h2>
                <p className="text-neutral-400 text-sm max-w-md mx-auto">
                    {persona === 'producer' ? text.producerSub : text.managerSub}
                </p>
             </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 bg-neutral-900/50 border rounded-[2rem] overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm relative transition-colors ${persona === 'manager' ? 'border-emerald-500/20' : 'border-indigo-500/20'}`}>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-70 space-y-8">
                        <div className={`p-4 rounded-full bg-opacity-10 ${persona === 'manager' ? 'bg-emerald-500 text-emerald-500' : 'bg-indigo-500 text-indigo-500'}`}>
                            {persona === 'manager' ? <Users size={40} /> : <Sparkles size={40} />}
                        </div>
                        <p className="text-neutral-500 font-bold text-sm">{text.empty}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
                            {(persona === 'manager' ? text.suggestions.manager : text.suggestions.producer).map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleSend(s.query)} 
                                    className={`p-4 bg-neutral-800 rounded-xl border border-white/5 hover:bg-neutral-700 transition-all text-left group hover:scale-105 ${persona === 'manager' ? 'hover:border-emerald-500/30' : 'hover:border-indigo-500/30'}`}
                                >
                                    <s.icon size={18} className={`mb-3 ${activeColor}`} />
                                    <span className="text-neutral-300 font-bold block mb-1 text-sm">{s.label}</span>
                                    <span className="text-neutral-500 text-xs leading-tight block group-hover:text-neutral-400">"{s.query}"</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                         <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-neutral-700' : activeBg}`}>
                                 {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
                             </div>
                             <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                 msg.role === 'user' 
                                 ? 'bg-neutral-800 text-white rounded-tr-sm border border-white/5' 
                                 : `bg-opacity-10 text-neutral-200 rounded-tl-sm border border-opacity-20 ${persona === 'manager' ? 'bg-emerald-900 border-emerald-500' : 'bg-indigo-900 border-indigo-500'}`
                             }`}>
                                 {msg.text}
                             </div>
                         </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="flex gap-4 max-w-[85%]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeBg}`}>
                                <Bot size={20} className="text-white" />
                            </div>
                            <div className={`p-4 rounded-2xl rounded-tl-sm border bg-opacity-10 border-opacity-20 flex items-center gap-2 ${persona === 'manager' ? 'bg-emerald-900 border-emerald-500' : 'bg-indigo-900 border-indigo-500'}`}>
                                <Loader2 size={16} className={`animate-spin ${activeColor}`} />
                                <span className={`text-xs font-bold ${activeColor}`}>Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
                <div className="flex gap-3">
                    <button 
                        onClick={handleClear}
                        className="p-3 rounded-xl bg-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 transition-colors"
                        title={text.clear}
                    >
                        <Trash2 size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder={text.placeholder}
                            className={`w-full bg-black border border-neutral-700 rounded-xl pl-4 pr-12 py-3 text-white outline-none transition-colors focus:border-opacity-50 ${activeBorder} focus:ring-1 focus:ring-opacity-50 ${persona === 'manager' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}
                            disabled={isLoading}
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
                            className={`absolute right-2 top-2 p-1.5 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${activeBg} hover:bg-opacity-80`}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ExpertChat;
