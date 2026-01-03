
import React, { useState, useCallback } from 'react';
import { Upload, Music, AlertCircle, Link as LinkIcon, Globe, Loader2, MessageSquare, Zap } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File, mode: 'auto' | 'personalized') => void;
  language?: 'en' | 'es';
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, language = 'en' }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Staging state before selecting mode
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  
  // URL state
  const [url, setUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // Translations
  const t = {
    en: {
      uploadFile: "Upload File",
      fromUrl: "From URL",
      dropHot: "Drop it like it's hot",
      uploadAudio: "Upload Audio File",
      dragDrop: "Drag and drop MP3 or WAV here, or click to browse.",
      enterLink: "Enter Direct Link",
      pasteLink: "Paste a direct link to an MP3 or WAV file.",
      fetching: "Extracting...",
      analyze: "Analyze Track",
      urlNote: "Must be a direct file link. Server must allow CORS.",
      validError: "Invalid file type. Please upload MP3 or WAV.",
      sizeError: "File too large. Max 100MB."
    },
    es: {
      uploadFile: "Subir Archivo",
      fromUrl: "Desde URL",
      dropHot: "Suéltalo aquí",
      uploadAudio: "Subir Audio",
      dragDrop: "Arrastra MP3 o WAV aquí, o clic para buscar.",
      enterLink: "Enlace Directo",
      pasteLink: "Pega un enlace directo a MP3 o WAV.",
      fetching: "Extrayendo...",
      analyze: "Analizar Pista",
      urlNote: "Debe ser enlace directo con acceso CORS.",
      validError: "Archivo inválido. Sube MP3 o WAV.",
      sizeError: "Archivo muy grande. Max 100MB."
    }
  };

  const text = t[language];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndStageFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError(text.validError);
      return;
    }
    // Limit set to 100MB to prevent 413 Payload Too Large errors
    if (file.size > 100 * 1024 * 1024) {
      setError(text.sizeError);
      return;
    }
    setError(null);
    setStagedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndStageFile(e.dataTransfer.files[0]);
    }
  }, [text]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndStageFile(e.target.files[0]);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) return;
    
    setIsLoadingUrl(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch audio from URL");
      }
      
      const blob = await response.blob();
      if (!blob.type.startsWith('audio/')) {
        throw new Error("The URL does not point to a valid audio file.");
      }
      
      const filename = url.split('/').pop() || "downloaded_audio";
      const file = new File([blob], filename, { type: blob.type });
      
      validateAndStageFile(file);
    } catch (err) {
      setError("Error loading audio. Check CORS permissions and file type.");
    } finally {
      setIsLoadingUrl(false);
    }
  };

  if (stagedFile) {
      return (
          <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in-up">
              <div className="text-center space-y-2">
                  <div className="text-4xl">💿</div>
                  <h3 className="text-white text-xl font-bold">{stagedFile.name}</h3>
                  <button onClick={() => setStagedFile(null)} className="text-xs text-red-400 font-bold hover:underline">Change File</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => onFileSelect(stagedFile, 'auto')}
                    className="bg-neutral-900 border border-white/10 hover:border-purple-500/50 p-6 rounded-2xl text-left group transition-all"
                  >
                      <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                          <Zap size={20} />
                      </div>
                      <div className="font-bold text-white text-lg mb-1">Quick Scan</div>
                      <div className="text-neutral-500 text-xs leading-relaxed">Raw, brutal, and instant analysis. Good for a quick check-up.</div>
                  </button>

                  <button 
                    onClick={() => onFileSelect(stagedFile, 'personalized')}
                    className="bg-neutral-900 border border-white/10 hover:border-fuchsia-500/50 p-6 rounded-2xl text-left group transition-all"
                  >
                      <div className="w-10 h-10 bg-fuchsia-500/10 text-fuchsia-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-fuchsia-500 group-hover:text-white transition-colors">
                          <MessageSquare size={20} />
                      </div>
                      <div className="font-bold text-white text-lg mb-1">The Sit-Down</div>
                      <div className="text-neutral-500 text-xs leading-relaxed">Tell the producer your vision first. Get tailored strategy feedback.</div>
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Tabs */}
      <div className="flex bg-neutral-900/50 p-1.5 rounded-2xl mb-8 w-full border border-white/5 backdrop-blur-sm">
        <button
          onClick={() => { setActiveTab('upload'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-neutral-800 text-white shadow-lg border border-white/10' : 'text-neutral-500 hover:text-white'}`}
        >
          <Upload size={18} />
          {text.uploadFile}
        </button>
        <button
          onClick={() => { setActiveTab('url'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'url' ? 'bg-neutral-800 text-white shadow-lg border border-white/10' : 'text-neutral-500 hover:text-white'}`}
        >
          <LinkIcon size={18} />
          {text.fromUrl}
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div 
          className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-12 transition-all duration-300 ease-out
            ${isDragging 
              ? 'border-purple-500 bg-purple-500/10 scale-[1.02] shadow-[0_0_40px_rgba(168,85,247,0.2)]' 
              : 'border-neutral-800 bg-neutral-900/30 hover:border-purple-500/50 hover:bg-neutral-900/50'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input 
            type="file" 
            id="fileInput" 
            className="hidden" 
            accept="audio/*"
            onChange={handleFileInput}
          />
          
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className={`p-5 rounded-full transition-colors ${isDragging ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-purple-500'}`}>
              <Upload size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {isDragging ? text.dropHot : text.uploadAudio}
              </h3>
              <p className="text-neutral-400 text-sm font-medium">
                {text.dragDrop}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl p-10 backdrop-blur-sm">
           <div className="flex flex-col space-y-6">
             <div className="text-center">
               <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto text-purple-400 mb-4 border border-purple-500/20">
                 <Globe size={28} />
               </div>
               <h3 className="text-2xl font-bold text-white tracking-tight">{text.enterLink}</h3>
               <p className="text-neutral-400 text-sm mt-2">{text.pasteLink}</p>
             </div>
             
             <div className="relative group">
               <input 
                 type="text" 
                 value={url}
                 onChange={(e) => setUrl(e.target.value)}
                 placeholder="https://example.com/song.mp3"
                 className="w-full bg-black border border-neutral-700 text-white rounded-xl px-5 py-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-neutral-600 transition-all font-mono text-sm"
               />
             </div>

             <button
               onClick={handleUrlSubmit}
               disabled={isLoadingUrl || !url}
               className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]
                 ${isLoadingUrl || !url 
                   ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                   : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-900/30'}`}
             >
               {isLoadingUrl ? (
                 <>
                   <Loader2 size={20} className="animate-spin" />
                   {text.fetching}
                 </>
               ) : (
                 <>
                   <Music size={20} />
                   {text.analyze}
                 </>
               )}
             </button>
             
             <p className="text-[10px] uppercase tracking-widest text-neutral-600 text-center">
               {text.urlNote}
             </p>
           </div>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center justify-center space-x-3 text-red-400 bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-xl text-sm font-medium animate-pulse">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
