import React, { useState } from 'react';
import { Image as ImageIcon, Wand2, Loader2, Download, RefreshCw, Upload, Edit3, Camera, ArrowRight } from 'lucide-react';
import { generateContentImage, editContentImage } from '../services/geminiService';
import { ImageSize } from '../types';

interface ContentGeneratorProps {
  language?: 'en' | 'es';
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ language = 'en' }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  
  // Create State
  const [createPrompt, setCreatePrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [createResult, setCreateResult] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit State
  const [editPrompt, setEditPrompt] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editResult, setEditResult] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const t = {
    en: {
        title: "Visuals Lab",
        subtitle: "Generate cover art or edit your photos with AI.",
        createTab: "Generate Art",
        editTab: "Edit Photo",
        promptLabel: "Describe your image",
        promptPlace: "A futuristic cityscape with neon purple lights, cyberpunk style...",
        editPromptPlace: "Add a retro VHS filter...",
        sizeLabel: "Resolution",
        ratioLabel: "Aspect Ratio",
        generate: "Generate Visual",
        edit: "Apply Edits",
        upload: "Upload Image",
        download: "Download",
        generating: "Dreaming...",
        editing: "Processing..."
    },
    es: {
        title: "Laboratorio Visual",
        subtitle: "Genera portadas o edita tus fotos con IA.",
        createTab: "Generar Arte",
        editTab: "Editar Foto",
        promptLabel: "Describe tu imagen",
        promptPlace: "Una ciudad futurista con luces neón moradas, estilo cyberpunk...",
        editPromptPlace: "Añade un filtro VHS retro...",
        sizeLabel: "Resolución",
        ratioLabel: "Relación de Aspecto",
        generate: "Generar Visual",
        edit: "Aplicar Cambios",
        upload: "Subir Imagen",
        download: "Descargar",
        generating: "Soñando...",
        editing: "Procesando..."
    }
  };
  const text = t[language];

  const handleCreate = async () => {
      if (!createPrompt.trim()) return;
      setIsCreating(true);
      setCreateResult(null);
      try {
          const base64 = await generateContentImage(createPrompt, size, aspectRatio);
          setCreateResult(base64);
      } catch (e) {
          console.error(e);
          alert("Failed to generate image.");
      } finally {
          setIsCreating(false);
      }
  };

  const handleEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setEditFile(file);
          const reader = new FileReader();
          reader.onload = (ev) => setEditPreview(ev.target?.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleEdit = async () => {
      if (!editFile || !editPrompt.trim()) return;
      setIsEditing(true);
      setEditResult(null);
      try {
        const base64Input = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(editFile);
        });

        const base64Output = await editContentImage(base64Input, editPrompt, editFile.type);
        setEditResult(base64Output);
      } catch (e) {
          console.error(e);
          alert("Failed to edit image.");
      } finally {
          setIsEditing(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up pb-20">
        <div className="text-center space-y-4">
             <div className="inline-flex items-center justify-center p-4 bg-orange-600/10 rounded-3xl mb-2 border border-orange-600/20">
                <Camera size={40} className="text-orange-500" />
             </div>
             <h2 className="text-5xl font-black text-white tracking-tighter">{text.title}</h2>
             <p className="text-neutral-400 text-lg">{text.subtitle}</p>
        </div>

        <div className="bg-neutral-900/50 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
                <button 
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 py-6 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'create' ? 'bg-orange-600/20 text-orange-400' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                >
                    <Wand2 size={16} /> {text.createTab}
                </button>
                <button 
                    onClick={() => setActiveTab('edit')}
                    className={`flex-1 py-6 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'edit' ? 'bg-orange-600/20 text-orange-400' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                >
                    <Edit3 size={16} /> {text.editTab}
                </button>
            </div>

            <div className="p-8">
                {activeTab === 'create' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">{text.promptLabel}</label>
                                    <textarea 
                                        value={createPrompt}
                                        onChange={(e) => setCreatePrompt(e.target.value)}
                                        placeholder={text.promptPlace}
                                        className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-orange-500 outline-none h-32 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">{text.sizeLabel}</label>
                                        <select 
                                            value={size} 
                                            onChange={(e) => setSize(e.target.value as ImageSize)}
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-orange-500"
                                        >
                                            <option value="1K">1K (Standard)</option>
                                            <option value="2K">2K (High Res)</option>
                                            <option value="4K">4K (Ultra)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">{text.ratioLabel}</label>
                                        <select 
                                            value={aspectRatio} 
                                            onChange={(e) => setAspectRatio(e.target.value)}
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-orange-500"
                                        >
                                            <option value="1:1">1:1 (Square)</option>
                                            <option value="16:9">16:9 (Landscape)</option>
                                            <option value="9:16">9:16 (Portrait)</option>
                                            <option value="4:3">4:3 (Photo)</option>
                                            <option value="3:4">3:4 (Portrait Photo)</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleCreate}
                                    disabled={isCreating || !createPrompt}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {isCreating ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
                                    {isCreating ? text.generating : text.generate}
                                </button>
                            </div>
                            
                            <div className="bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden min-h-[300px]">
                                {createResult ? (
                                    <div className="relative group w-full h-full flex items-center justify-center p-2">
                                        <img src={`data:image/png;base64,${createResult}`} alt="Generated" className="max-w-full max-h-full rounded-lg shadow-2xl" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <a 
                                                href={`data:image/png;base64,${createResult}`} 
                                                download="sonicmf-art.png"
                                                className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                                            >
                                                <Download size={18} /> {text.download}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-neutral-700">
                                        <ImageIcon size={64} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-xs uppercase tracking-widest">Preview Area</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'edit' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div onClick={() => document.getElementById('edit-upload')?.click()} className="border-2 border-dashed border-neutral-800 hover:border-orange-500/50 rounded-2xl p-8 cursor-pointer text-center hover:bg-black/40 transition-all">
                                    <input type="file" id="edit-upload" className="hidden" accept="image/*" onChange={handleEditFile} />
                                    <Upload size={32} className="mx-auto text-neutral-500 mb-2" />
                                    <p className="text-sm font-bold text-white">{text.upload}</p>
                                </div>
                                {editPreview && (
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">Edit Instruction</label>
                                        <textarea 
                                            value={editPrompt}
                                            onChange={(e) => setEditPrompt(e.target.value)}
                                            placeholder={text.editPromptPlace}
                                            className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-orange-500 outline-none h-24 resize-none"
                                        />
                                    </div>
                                )}
                                <button 
                                    onClick={handleEdit}
                                    disabled={isEditing || !editFile || !editPrompt}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {isEditing ? <Loader2 size={20} className="animate-spin" /> : <Edit3 size={20} />}
                                    {isEditing ? text.editing : text.edit}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden h-64">
                                    {editPreview ? (
                                        <img src={editPreview} alt="Original" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <div className="text-neutral-700 text-center">
                                            <Upload size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-xs uppercase tracking-widest">Original</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    <ArrowRight className="text-neutral-600 transform rotate-90 md:rotate-0" />
                                </div>
                                <div className="bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden h-64">
                                    {editResult ? (
                                        <div className="relative group w-full h-full flex items-center justify-center">
                                            <img src={`data:image/png;base64,${editResult}`} alt="Edited" className="max-w-full max-h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <a 
                                                    href={`data:image/png;base64,${editResult}`} 
                                                    download="sonicmf-edit.png"
                                                    className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                                                >
                                                    <Download size={18} /> {text.download}
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-neutral-700 text-center">
                                            <Wand2 size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-xs uppercase tracking-widest">Edited Result</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ContentGenerator;