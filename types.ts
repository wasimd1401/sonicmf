
export type UserRole = 'artist' | 'manager';

export interface EnergyPoint {
  section: string;
  energyLevel: number; // 1-10
}

export interface SongStructure {
  intro: string;
  verse: string;
  chorus: string;
  bridge: string;
  outro: string;
}

export interface Mood {
  label: string;
  confidence: number; // 0-100
}

export interface ProductionMoment {
  description: string;
  sectionIndex: number; // Index in the energyProfile array where this happens
}

export interface Improvement {
  critique: string; // e.g. "Lyrics are recycled"
  suggestion: string; // e.g. "Try using a specific metaphor about..."
}

export interface TechnicalFeedback {
  label: string; // e.g. "Pitch Accuracy", "Flow Pocket", "Articulation"
  score: number; // 1-10
  feedback: string;
}

export interface VocalAnalysis {
  performanceStyle: 'Singing' | 'Rapping' | 'Melodic Rap' | 'Spoken' | 'Mixed';
  overallCritique: string;
  technicalFeedback: TechnicalFeedback[];
  practiceFocus: string; // What to do in the Vocal Coach tab
  coachExercise: string; // Specific exercise name/description
}

export interface Feedback {
  strengths: string[];
  improvements: Improvement[]; 
  industryScore: number; // 0-100
  productionScore: number; // 1-10
  lyricsScore: number; // 1-10
  industryComparison: string;
}

// --- New Mixing & Mastering Types ---
export interface EqSuggestion {
  element: string; // e.g. "Vocals", "Kick", "Master Bus"
  frequency: string; // e.g. "300Hz"
  action: string; // e.g. "Cut 2dB"
  reason: string; // e.g. "Remove boxiness"
}

export interface MasteringChainStep {
  module: string; // e.g. "Multiband Compressor"
  description: string; // e.g. "Tame harshness in 4kHz-8kHz range"
}

export interface TimeBasedEffect {
  type: 'Reverb' | 'Delay' | 'Modulation';
  pluginSuggestion: string; // e.g. "Valhalla Vintage Verb" or generic "Plate Reverb"
  setting: string; // e.g. "1.2s Decay, 40ms Pre-delay"
  application: string; // e.g. "Apply to Lead Vocals to sit them in the mix"
  reason: string; // Genre context e.g. "Essential for the Dream Pop aesthetic"
}

export interface MixingMasteringData {
  lufsTarget: string; // e.g. "-9 LUFS"
  stereoImage: string; // Advice on width
  frequencyBalance: string; // Overview of the spectrum
  dynamicRangeScore: number; // 1-10 (1=Squashed, 10=Too Dynamic)
  eqSuggestions: EqSuggestion[];
  masteringChain: MasteringChainStep[];
  timeBasedEffects: TimeBasedEffect[]; // New detailed FX section
}

// --- New Electronic Production Types ---
export interface SoundElement {
  name: string; // "Main Saw Synth"
  type: string; // "Lead", "Bass", "Pad"
  timbre: string; // "Gritty, analog, detuned"
  rating: number; // 1-10
  advice: string; // "Layer with noise"
}

export interface ElectronicProduction {
  isElectronic: boolean;
  soundDesignScore: number; // 1-10 (Creativity/Synthesis quality)
  layeringScore: number; // 1-10 (Frequency isolation at source)
  productionAdvice: string; // General advice focusing on source quality > mastering
  elements: SoundElement[];
}

// --- New Promotion / Launch Strategy Types ---
export interface DistributionPlatform {
  name: string; // e.g. "Ditto", "DistroKid"
  description: string; // Why this fits the artist
  costModel: string; // e.g. "$19/yr unlimited"
  bestFor: string; // e.g. "Solo Artists keeping 100%"
}

export interface PlaylistSuggestion {
  platform: string; // e.g. "Spotify", "YouTube", "Apple Music"
  playlistName: string; // e.g. "Lorem Ipsum Pop", "Hyperpop Classics"
  type: string; // e.g. "Editorial", "Algorithmic", "Third-Party"
  whyItFits: string;
}

export interface TimelineEvent {
  day: string; // e.g. "Day 1", "Week 2"
  action: string; // e.g. "Post Teaser"
  details: string; // Specific advice
}

export interface SocialPost {
  platform: 'TikTok' | 'Instagram' | 'Twitter';
  caption: string;
  visualConcept: string; // Description of the video/image
  hashtags: string[];
  bestTime: string; // e.g. "Tuesday 6PM"
}

export interface MerchandiseItem {
  name: string;
  description: string;
  pricePoint: string;
  whyItFits: string;
}

export interface PromotionData {
  consultantAdvice: string; // General strategic advice based on genre"
  recommendedDistributors: DistributionPlatform[];
  playlistTargets: PlaylistSuggestion[];
  marketingTimeline: TimelineEvent[];
  socialCampaign?: SocialPost[]; // New field
  merchandiseStrategy?: MerchandiseItem[]; // New field for merch ideas
}

// --- Reality Check Types (New) ---
export interface RealityGap {
  area: string; // e.g. "Visual Branding", "Consistency"
  observation: string; // What is missing
  fix: string; // How to fix it
}

export interface RealityCheckAnalysis {
  currentStatus: {
    level: string; // e.g. "Hobbyist", "Local Buzz", "Emerging"
    summary: string; // NotebookLM style summary of where they are
    estimatedMonthlyListeners: string; // Estimate based on inputs
    perception: string; // How a stranger views them
  };
  gapAnalysis: RealityGap[];
  growthStrategy: {
    shortTerm: string; // Next 30 days
    longTerm: string; // Next 6 months
    focusArea: string; // One big thing to focus on
  };
  playlistActionPlan: {
    strategy: string; // How to pitch
    realisticTargets: string[]; // List of playlists they can actually get on
    pitchAngle: string; // What to say in the email/submission
  };
}

export interface SongAnalysis {
  trackTitle?: string;
  artist?: string;
  bpm: string;
  musicalKey: string;
  genre: string;
  genreConfidence: number;
  moods: Mood[];
  overallArc: string;
  detailedAnalysis: string;
  feedback: Feedback;
  vocalAnalysis: VocalAnalysis; 
  structure: SongStructure;
  productionMoments: ProductionMoment[];
  lyrics: string;
  energyProfile: EnergyPoint[];
  aiGenerationPrompt: string;
  mixingMastering: MixingMasteringData;
  electronicProduction: ElectronicProduction; // New section
  promotion: PromotionData;
  // Manager Specific (Optional)
  managerInsights?: {
      targetAudience: string;
      commercialViabilityScore: number;
      marketPosition: string;
      similarArtists: string[];
  };
}

export interface EnhancedLyricsResponse {
  lyrics: string;
  critique: string;
}

export interface FileState {
  file: File | null;
  base64: string | null;
  duration: number;
}

// --- Progression & Comparison Types ---

export interface ComparisonCategory {
  name: string; // e.g. "Mix Quality", "Vocal Performance", "Commercial Appeal"
  scoreA: number; // 0-100
  scoreB: number; // 0-100
  notes: string;
}

export interface ComparisonResult {
  winner: 'A' | 'B' | 'Tie';
  summary: string;
  categories: ComparisonCategory[];
  keyDifference: string; // "Track B has significantly better low-end control."
  recommendation: string; // "Release Track B."
}

export interface ProgressionReport extends ComparisonResult {
  growthScore: number; // 0-100 improvement
  improvements: {
    area: string;
    before: string;
    after: string;
    verdict: 'Fixed' | 'Improved' | 'Regressed' | 'Unchanged';
  }[];
  nextSteps: string;
}

// --- Style Blender Types ---

export interface ReferenceTrack {
  id: string;
  name: string;
  type: 'file' | 'url';
  data: File | string; // File object or URL string
  mimeType?: string; // e.g., 'audio/mpeg'
}

export interface BlendStep {
  title: string;
  instruction: string;
  technicalTip: string;
}

export interface SourceBreakdown {
  trackName: string;
  keyElementToExtract: string; // What to take from this track
  roleInMix: string; // e.g., "Rhythm Section", "Melodic Texture"
}

export interface StyleBlendAnalysis {
  synthesisConcept: string; // The "Big Idea" of the combination
  sourceBreakdowns: SourceBreakdown[];
  productionRecipe: BlendStep[];
  suggestedBpm: string;
  suggestedKey: string;
}

// --- Lyric Session Types ---

export type CoWriteStep = 'idle' | 'generating_questions' | 'answering' | 'writing_lyrics' | 'complete';

export interface LyricQuestion {
  id: number;
  question: string;
  answer: string;
}

export interface RhymeResult {
  word: string;
  perfectRhymes: string[];
  nearRhymes: string[];
  synonyms: string[];
}

// --- NEW MANAGER STRATEGY TYPES ---

export interface ManagerStrategy {
  marketingHook: string; // The "Elevator Pitch"
  targetAudience: string;
  brandArchetype: {
    name: string; // e.g. "The Rebel"
    description: string;
    colorPalette: string[]; // Hex codes
  };
  visualDirection: string; // Description for photos/videos
  contentStrategy: {
    platform: string; // TikTok, IG
    idea: string; // Specific content idea
  }[];
  rolloutPlan: {
    phase: string; // "Tease", "Launch", "Sustain"
    action: string;
  }[];
  emailPitch: string; // Template for curators
}

export interface CareerRoadmapTask {
  week: string; // "Week 1"
  action: string; // "Claim Artist Profiles"
  description: string; // "Ensure bio is consistent on Spotify, Apple, IG..."
}

export interface RoadmapPhase {
  title: string; // "Phase 1: Zero to One"
  duration: string; // "Days 1-30"
  focus: string; // "Foundation & Branding"
  tasks: CareerRoadmapTask[];
}

export interface TrackStrategy {
  trackName: string;
  suitabilityScore: number; // 1-10 for single potential
  role: 'Lead Single' | 'B-Side' | 'Album Cut' | 'Demo';
  reasoning: string;
  platformFocus: 'TikTok' | 'Spotify' | 'YouTube' | 'SoundCloud';
  actionPlan: string; // Specific advice "Post hook on tiktok with x trend"
}

export interface CareerRoadmap {
  artistName: string;
  archetype: string; // "The Digital Phantom"
  missionStatement: string;
  phases: RoadmapPhase[]; // Should be 3 phases: 30, 60, 90 days
  kpis: {
    metric: string;
    target: string;
  }[];
  budgetStrategy: string;
  trackStrategies?: TrackStrategy[]; // New field for uploaded track analysis
}

export interface CampaignData {
  chartData: {
    month: string;
    listeners: number;
    revenue: number;
  }[];
  budgetSpent: number; // e.g. 1500
  budgetTotal: number; // e.g. 5000
  engagementRate: number; // e.g. 4.5
  topPlatform: string; // e.g. "TikTok"
  nextDecision: string; // AI generated specific next move
  decisionUrgency: 'High' | 'Medium' | 'Low';
}

export interface SocialStats {
  instagram: string;
  tiktok: string;
  spotify: string;
  youtube: string;
}

export interface SocialContentPillar {
  title: string;
  description: string;
}

export interface SocialCampaignStrategy {
  campaignTheme: string;
  contentPillars: SocialContentPillar[];
  posts: SocialPost[];
  hashtags: string[];
}

export interface ArtistProfile {
  id: string;
  name: string;
  genre: string;
  goal: string;
  status: string;
  listeners: string; // Mock e.g. "12.5k"
  avatarColor: string; // Tailwind class
  socialStats?: SocialStats; // New field for detailed metrics
  roadmap?: CareerRoadmap;
  campaignData?: CampaignData; // New field for analytics
  socialStrategy?: SocialCampaignStrategy; // New field for Campaign Generator
}

// --- Chat Types ---

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type ImageSize = '1K' | '2K' | '4K';

// --- Studio / Suno Types ---

export interface SunoPromptData {
  title: string;
  tags: string;
  lyrics: string;
  musicFXPrompt: string;
}
