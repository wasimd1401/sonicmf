
import React, { useState, useRef, useEffect } from 'react';
import { User, Users, Plus, TrendingUp, DollarSign, Activity, ChevronRight, Briefcase, Upload, FileText, Loader2, Sparkles } from 'lucide-react';
import { ArtistProfile, CareerRoadmap, CampaignData, SocialStats } from '../types';
import CareerManager from './CareerManager';
import { generateCampaignInsights } from '../services/geminiService';

interface ManagerDashboardProps {
  language?: 'en' | 'es';
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ language = 'en' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);
  
  // PERSISTENCE & STATE INITIALIZATION
  // Load from local storage or default to empty
  const [artists, setArtists] = useState<ArtistProfile[]>(() => {
    try {
      const saved = localStorage.getItem('sonicmf_manager_roster');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load roster", e);
      return [];
    }
  });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('sonicmf_manager_roster', JSON.stringify(artists));
  }, [artists]);

  const [selectedArtist, setSelectedArtist] = useState<ArtistProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const t = {
    en: {
        title: "Empire Command",
        subtitle: "Manage your roster, track growth, and execute strategies.",
        roster: "Roster",
        totalArtists: "Total Artists",
        activeCampaigns: "Active Campaigns",
        estRevenue: "Est. Revenue (Mo)",
        addArtist: "Add Talent",
        import: "Import CSV",
        manage: "Manage Strategy",
        listeners: "Monthly Listeners",
        trend: "Trending",
        analyze: "Analyze Data",
        analyzing: "Analyzing..."
    },
    es: {
        title: "Comando del Imperio",
        subtitle: "Gestiona tu roster, sigue el crecimiento y ejecuta estrategias.",
        roster: "Roster",
        totalArtists: "Total Artistas",
        activeCampaigns: "Campañas Activas",
        estRevenue: "Ingresos Est. (Mes)",
        addArtist: "Añadir Talento",
        import: "Importar CSV",
        manage: "Gestionar",
        listeners: "Oyentes Mensuales",
        trend: "Tendencia",
        analyze: "Analizar Datos",
        analyzing: "Analizando..."
    }
  };
  const text = t[language];

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const csvText = event.target?.result as string;
          // Simple parsing logic: Assumes headers: Name, Genre, Goal, Instagram, TikTok, Spotify, YouTube
          const lines = csvText.split('\n').slice(1); // Skip header
          const newArtists: ArtistProfile[] = lines
              .filter(line => line.trim() !== '')
              .map(line => {
                  const [name, genre, goal, ig, tt, sp, yt] = line.split(',').map(s => s.trim());
                  return {
                      id: Math.random().toString(36).substr(2, 9),
                      name: name || 'Unknown Artist',
                      genre: genre || 'Pop',
                      goal: goal || 'Global Fame',
                      status: 'Imported',
                      listeners: sp || '0',
                      avatarColor: 'bg-purple-600', // Default
                      socialStats: {
                          instagram: ig || '0',
                          tiktok: tt || '0',
                          spotify: sp || '0',
                          youtube: yt || '0'
                      }
                  };
              });
          
          if (newArtists.length > 0) {
              setArtists(prev => [...prev, ...newArtists]);
              // Reset input
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const handleGenerateInsights = async (artist: ArtistProfile, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent opening the profile
      if (!artist.socialStats) return;

      setAnalyzingIds(prev => [...prev, artist.id]);
      try {
          const insights = await generateCampaignInsights(artist.name, artist.socialStats, language as 'en' | 'es');
          
          setArtists(prev => prev.map(a => 
              a.id === artist.id 
              ? { ...a, campaignData: insights, status: 'Active Analysis' } 
              : a
          ));
      } catch (error) {
          console.error("Failed to generate insights", error);
      } finally {
          setAnalyzingIds(prev => prev.filter(id => id !== artist.id));
      }
  };

  // Calculate dynamic stats
  const totalListenersCount = artists.reduce((acc, curr) => {
      let val = 0;
      const clean = curr.listeners.toLowerCase();
      if (clean.endsWith('k')) val = parseFloat(clean) * 1000;
      else if (clean.endsWith('m')) val = parseFloat(clean) * 1000000;
      else val = parseFloat(clean) || 0;
      return acc + val;
  }, 0);
  
  const displayListeners = totalListenersCount >= 1000000 
    ? `${(totalListenersCount / 1000000).toFixed(1)}M` 
    : `${(totalListenersCount / 1000).toFixed(1)}k`;

  const activeCampaignsCount = artists.filter(a => a.roadmap).length;
  const estRevenue = `$${(totalListenersCount * 0.004).toFixed(2)}`;

  const handleSaveRoadmap = (roadmap: CareerRoadmap, meta?: { stats: SocialStats, goal: string, genre: string }) => {
      if (selectedArtist) {
          const updatedArtists = artists.map(a => 
              a.id === selectedArtist.id ? { ...a, roadmap } : a
          );
          setArtists(updatedArtists);
          setSelectedArtist({ ...selectedArtist, roadmap }); // Update local view
      } else {
          // Creating New Profile from Scratch via "Add Talent"
          const newProfile: ArtistProfile = {
              id: Math.random().toString(36).substr(2, 9),
              name: roadmap.artistName,
              genre: meta?.genre || roadmap.archetype,
              goal: meta?.goal || 'Global Success',
              status: 'New Signing',
              listeners: meta?.stats?.spotify || '0',
              avatarColor: 'bg-blue-600',
              socialStats: meta?.stats, // Store stats so Insights can be generated later
              roadmap
          };
          setArtists([...artists, newProfile]);
          setSelectedArtist(newProfile); // Jump to view immediately
          setIsAdding(false);
      }
  };

  if (selectedArtist || isAdding) {
      return (
          <CareerManager 
            key={selectedArtist?.id || 'new'} 
            language={language}
            artistProfile={selectedArtist || undefined}
            onBack={() => { setSelectedArtist(null); setIsAdding(false); }}
            onRoadmapGenerated={handleSaveRoadmap}
          />
      )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in-up pb-20">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-4 bg-gradient-to-r from-blue-900/40 to-black border border-blue-500/20 rounded-[2.5rem] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Briefcase size={120} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-2">{text.title}</h2>
                    <p className="text-neutral-400 text-lg max-w-xl">{text.subtitle}</p>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                        <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">{text.totalArtists}</div>
                        <div className="text-3xl font-black text-white">{artists.length}</div>
                    </div>
                    <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-500">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                        <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">{text.activeCampaigns}</div>
                        <div className="text-3xl font-black text-white">{activeCampaignsCount}</div>
                    </div>
                    <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center text-green-500">
                        <Activity size={24} />
                    </div>
                </div>
                <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                        <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">{text.estRevenue}</div>
                        <div className="text-3xl font-black text-white">{estRevenue}</div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center text-yellow-500">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>
        </div>

        {/* Roster Grid */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <Users className="text-blue-500"/> {text.roster}
                </h3>
                <div className="flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleCsvUpload} 
                        accept=".csv" 
                        className="hidden" 
                    />
                    <button 
                        onClick={handleImportClick}
                        className="flex items-center gap-2 bg-neutral-900 text-neutral-400 border border-white/10 px-4 py-2.5 rounded-xl font-bold text-sm hover:text-white transition-colors"
                    >
                        <Upload size={16} /> {text.import}
                    </button>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors shadow-lg"
                    >
                        <Plus size={16} /> {text.addArtist}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artists.map((artist) => (
                    <div 
                        key={artist.id}
                        onClick={() => setSelectedArtist(artist)}
                        className="group bg-neutral-900/30 border border-white/5 hover:border-blue-500/50 rounded-[2rem] p-6 cursor-pointer transition-all hover:bg-black/50 hover:-translate-y-1 shadow-xl relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className={`w-16 h-16 ${artist.avatarColor} rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg`}>
                                {artist.name.charAt(0)}
                            </div>
                            <div className={`px-3 py-1 bg-black/40 rounded-full text-[10px] font-bold border border-white/5 uppercase tracking-wide ${artist.roadmap ? 'text-green-400' : 'text-neutral-400'}`}>
                                {artist.status}
                            </div>
                        </div>
                        
                        <div className="space-y-1 mb-6">
                            <h4 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">{artist.name}</h4>
                            <p className="text-sm text-neutral-500 font-medium">{artist.genre}</p>
                        </div>

                        <div className="bg-black/20 rounded-xl p-4 flex items-center justify-between border border-white/5">
                            <div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">{text.listeners}</div>
                                <div className="text-white font-bold">{artist.listeners}</div>
                            </div>
                            <TrendingUp size={20} className="text-green-500" />
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-500 group-hover:translate-x-2 transition-transform">
                                {artist.roadmap ? 'View Strategy' : 'Create Strategy'} <ChevronRight size={14} />
                            </div>
                            
                            {/* Insight Generator Button if data missing but stats present */}
                            {artist.socialStats && !artist.campaignData && (
                                <button 
                                    onClick={(e) => handleGenerateInsights(artist, e)}
                                    className="bg-neutral-800 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                                    title="Generate AI Insights"
                                >
                                    {analyzingIds.includes(artist.id) ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={16} />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                
                {/* Empty State / Add New Card */}
                <div 
                    onClick={() => setIsAdding(true)}
                    className="border-2 border-dashed border-neutral-800 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:border-blue-500/30 hover:bg-blue-500/5 transition-all min-h-[300px]"
                >
                    <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-600 mb-2">
                        <Plus size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white mb-1">{text.addArtist}</h4>
                        <p className="text-xs text-neutral-500">Scout or add existing talent</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
  );
};

export default ManagerDashboard;
