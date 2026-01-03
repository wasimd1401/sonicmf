
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { 
  SongAnalysis, 
  CareerRoadmap, 
  RealityCheckAnalysis, 
  EnhancedLyricsResponse, 
  LyricQuestion, 
  ManagerStrategy, 
  ProgressionReport, 
  StyleBlendAnalysis, 
  ReferenceTrack,
  SunoPromptData,
  ImageSize,
  ComparisonResult,
  UserRole,
  SocialStats,
  CampaignData,
  SocialCampaignStrategy,
  RhymeResult
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_SMART = 'gemini-3-pro-preview';
const MODEL_IMAGE_EDIT = 'gemini-2.5-flash-image'; // For Editing
const MODEL_IMAGE_GEN = 'gemini-3-pro-image-preview'; // For High Quality Gen
const MODEL_VIDEO = 'veo-3.1-fast-generate-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';
// gemini-2.5-flash-native-audio-preview-09-2025 is typically for Live API. Using TTS for GenerateContent audio.
const MODEL_AUDIO_NATIVE = 'gemini-2.5-flash-preview-tts';

function getLangInstruction(lang: 'en' | 'es'): string {
  return lang === 'es' ? "Responde en Español." : "Respond in English.";
}

export const analyzeAudio = async (
  base64Audio: string, 
  mimeType: string, 
  lang: 'en' | 'es',
  role: UserRole = 'artist',
  context?: {question: string, answer: string}[]
): Promise<SongAnalysis> => {
  const contextStr = context ? `\nContext from artist interview:\n${context.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n')}` : '';
  
  const roleInstruction = role === 'manager' 
    ? `You are an expert A&R Executive at a major label. 
       Your goal is to evaluate the COMMERCIAL VIABILITY and MARKET FIT of this track. 
       Focus less on technical mix nuances and more on the product's sellability, audience, and placement potential.
       Be brutal about "Signability".`
    : `You are a world-class Music Producer and Engineer. 
       Your goal is to help the artist make the best record possible.
       Focus on emotional impact, technical mix quality, sound design, and artistic expression.`;

  const prompt = `
    ${getLangInstruction(lang)}
    ${roleInstruction}
    
    Analyze this audio track in extreme detail.
    ${contextStr}
    
    Provide a JSON output matching the following structure:
    - basic info (bpm, key, genre, moods)
    - structure (sections)
    - feedback (strengths, improvements, scores)
    - vocal analysis
    - mixing/mastering data
    - electronic production details: 
      IMPORTANT: Treat this as "Sound Design & Production Elements" for ANY genre. 
      If Acoustic: Analyze guitar tones, piano timbre, room ambience. 
      If Electronic: Analyze synths, bass design, drum samples.
      For each element, provide a specific technical recipe/advice.
    - promotion/marketing data. 
      IMPORTANT: In the 'promotion' object:
      1. You MUST generate 'socialCampaign'. Create 3 unique posts (TikTok, Instagram, Twitter) with Caption, Visual Description, Hashtags, and Best Time.
      2. You MUST generate 'merchandiseStrategy'. Create 3-5 unique merchandise ideas tailored to the artist's genre and vibe (e.g. specialized streetwear for hip hop, vinyl for indie, etc). Provide name, description, estimated pricePoint, and whyItFits.
    - deep detailed analysis text
    
    ${role === 'manager' ? '- managerInsights: { targetAudience, commercialViabilityScore (0-100), marketPosition, similarArtists (array of strings) }' : ''}
    
    Be critical, precise, and industry-standard.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_SMART, // Gemini 3 Pro for deep reasoning
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Audio } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      // Rely on model inference for detailed schema to avoid massive token usage on definition
      // But we can enforce key structure if needed. For now, implicit schema works well with Gemini 1.5 Pro/Flash
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            trackTitle: { type: Type.STRING },
            artist: { type: Type.STRING },
            bpm: { type: Type.STRING },
            musicalKey: { type: Type.STRING },
            genre: { type: Type.STRING },
            genreConfidence: { type: Type.NUMBER },
            moods: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        label: { type: Type.STRING },
                        confidence: { type: Type.NUMBER }
                    }
                }
            },
            overallArc: { type: Type.STRING },
            detailedAnalysis: { type: Type.STRING },
            structure: {
                type: Type.OBJECT,
                properties: {
                    intro: { type: Type.STRING },
                    verse: { type: Type.STRING },
                    chorus: { type: Type.STRING },
                    bridge: { type: Type.STRING },
                    outro: { type: Type.STRING },
                }
            },
            feedback: {
                type: Type.OBJECT,
                properties: {
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    improvements: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                critique: { type: Type.STRING },
                                suggestion: { type: Type.STRING }
                            }
                        }
                    },
                    industryScore: { type: Type.NUMBER },
                    productionScore: { type: Type.NUMBER },
                    lyricsScore: { type: Type.NUMBER },
                    industryComparison: { type: Type.STRING }
                }
            },
            vocalAnalysis: {
                type: Type.OBJECT,
                properties: {
                    performanceStyle: { type: Type.STRING },
                    overallCritique: { type: Type.STRING },
                    technicalFeedback: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                label: { type: Type.STRING },
                                score: { type: Type.NUMBER },
                                feedback: { type: Type.STRING }
                            }
                        }
                    },
                    practiceFocus: { type: Type.STRING },
                    coachExercise: { type: Type.STRING }
                }
            },
            mixingMastering: {
                type: Type.OBJECT,
                properties: {
                    lufsTarget: { type: Type.STRING },
                    stereoImage: { type: Type.STRING },
                    frequencyBalance: { type: Type.STRING },
                    dynamicRangeScore: { type: Type.NUMBER },
                    eqSuggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                element: { type: Type.STRING },
                                frequency: { type: Type.STRING },
                                action: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            }
                        }
                    },
                    masteringChain: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                module: { type: Type.STRING },
                                description: { type: Type.STRING }
                            }
                        }
                    },
                    timeBasedEffects: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING },
                                pluginSuggestion: { type: Type.STRING },
                                setting: { type: Type.STRING },
                                application: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            }
                        }
                    }
                }
            },
            electronicProduction: {
                type: Type.OBJECT,
                properties: {
                    isElectronic: { type: Type.BOOLEAN },
                    soundDesignScore: { type: Type.NUMBER },
                    layeringScore: { type: Type.NUMBER },
                    productionAdvice: { type: Type.STRING },
                    elements: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                type: { type: Type.STRING },
                                timbre: { type: Type.STRING },
                                rating: { type: Type.NUMBER },
                                advice: { type: Type.STRING }
                            }
                        }
                    }
                }
            },
            promotion: {
                type: Type.OBJECT,
                properties: {
                    consultantAdvice: { type: Type.STRING },
                    recommendedDistributors: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                costModel: { type: Type.STRING },
                                bestFor: { type: Type.STRING }
                            }
                        }
                    },
                    playlistTargets: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                platform: { type: Type.STRING },
                                playlistName: { type: Type.STRING },
                                type: { type: Type.STRING },
                                whyItFits: { type: Type.STRING }
                            }
                        }
                    },
                    marketingTimeline: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                day: { type: Type.STRING },
                                action: { type: Type.STRING },
                                details: { type: Type.STRING }
                            }
                        }
                    },
                    socialCampaign: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                platform: { type: Type.STRING, enum: ["TikTok", "Instagram", "Twitter"] },
                                caption: { type: Type.STRING },
                                visualConcept: { type: Type.STRING },
                                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                bestTime: { type: Type.STRING }
                            },
                            required: ["platform", "caption", "visualConcept", "hashtags", "bestTime"]
                        }
                    },
                    merchandiseStrategy: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                pricePoint: { type: Type.STRING },
                                whyItFits: { type: Type.STRING }
                            },
                            required: ["name", "description", "pricePoint", "whyItFits"]
                        }
                    }
                }
            },
            energyProfile: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        section: { type: Type.STRING },
                        energyLevel: { type: Type.NUMBER }
                    }
                }
            },
            productionMoments: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        sectionIndex: { type: Type.NUMBER }
                    }
                }
            },
            managerInsights: {
                type: Type.OBJECT,
                properties: {
                    targetAudience: { type: Type.STRING },
                    commercialViabilityScore: { type: Type.NUMBER },
                    marketPosition: { type: Type.STRING },
                    similarArtists: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            },
            lyrics: { type: Type.STRING },
            aiGenerationPrompt: { type: Type.STRING }
        },
        required: ["bpm", "musicalKey", "genre", "genreConfidence", "moods", "overallArc", "detailedAnalysis", "feedback", "vocalAnalysis", "mixingMastering", "electronicProduction", "promotion", "structure", "lyrics", "energyProfile"]
      }
    }
  });

  if (!response.text) throw new Error("Analysis failed");
  return JSON.parse(response.text) as SongAnalysis;
};

export const generateAudioPreview = async (elementName: string, advice: string, genre: string): Promise<string> => {
    // Step 1: Generate the script using a text model
    // The TTS model cannot 'roleplay' or create content from instructions, it only reads text.
    // So we use a creative text model first to write the explanation and onomatopoeia.
    const scriptPrompt = `
        You are a music producer demonstrating a sound design technique: "${advice}" on a "${elementName}" in the genre "${genre}".
        Write a short, expressive script (max 30 words) explaining what this technique does. 
        Then, include a phonetically written sound effect (onomatopoeia) mimicking the "Before" and "After" sound.
        
        Example Output: 
        "By cutting the low mids on the snare, we remove the mud. Listen: *Puff Puff* becomes *Crack Crack*."
        
        Output ONLY the text to be spoken.
    `;

    const textResponse = await ai.models.generateContent({
        model: MODEL_FAST, // gemini-3-flash-preview
        contents: { parts: [{ text: scriptPrompt }] }
    });

    const script = textResponse.text || `Applying ${advice} to the ${elementName}. Here is how it sounds.`;

    // Step 2: Convert the script to audio using the TTS model
    const response = await ai.models.generateContent({
        model: MODEL_TTS, // gemini-2.5-flash-preview-tts
        contents: { parts: [{ text: script }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' } // Kore is good for instructional tone
                }
            }
        }
    });

    // Extract audio from response (inlineData)
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("Audio generation failed");
    
    return audioData;
};

export const generateStrategicQuestions = async (lang: 'en' | 'es'): Promise<string[]> => {
  const prompt = `
    ${getLangInstruction(lang)}
    You are an expert A&R manager interviewing an artist before analyzing their demo.
    Generate 3 deep, strategic questions to ask the artist to understand their vision, intent, and market goals.
    Return ONLY a JSON array of strings. Example: ["Question 1", "Question 2", "Question 3"]
  `;

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate questions");
  return JSON.parse(response.text);
};

export const generateSocialMediaCampaign = async (
  artistName: string,
  genre: string,
  goal: string,
  stats: SocialStats,
  lang: 'en' | 'es'
): Promise<SocialCampaignStrategy> => {
  const prompt = `
    ${getLangInstruction(lang)}
    Role: Senior Social Media Strategist for top-tier music artists.
    Artist: ${artistName}
    Genre: ${genre}
    Goal: ${goal}
    Current Stats: IG: ${stats.instagram}, TikTok: ${stats.tiktok}, Spotify: ${stats.spotify}.

    Create a high-impact "Social Media Rollout Campaign".
    
    1. Define 3 Core Content Pillars (e.g., "Behind the Scenes", "Fan Interaction", "Lifestyle").
    2. Create 6 distinct, actionable posts tailored to the artist's genre and stats.
       - If TikTok count is high, focus on trends/viral sounds.
       - If Instagram is high, focus on aesthetic/reels.
       - If numbers are low, focus on community building and consistency.
    3. Define a Campaign Theme (e.g. "The Dark Era", "Summer Vibes").
    
    Return JSON matching the SocialCampaignStrategy schema.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_SMART,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          campaignTheme: { type: Type.STRING },
          contentPillars: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            }
          },
          posts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING, enum: ["TikTok", "Instagram", "Twitter"] },
                caption: { type: Type.STRING },
                visualConcept: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                bestTime: { type: Type.STRING }
              },
              required: ["platform", "caption", "visualConcept", "hashtags", "bestTime"]
            }
          },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["campaignTheme", "contentPillars", "posts", "hashtags"]
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate campaign");
  return JSON.parse(response.text) as SocialCampaignStrategy;
};

export const generateCareerRoadmap = async (
  name: string,
  genre: string,
  goal: string,
  stats: SocialStats | string, // Can be object or legacy string
  tracks: {base64: string, mimeType: string, name: string}[] = [],
  language: 'en' | 'es' = 'en'
): Promise<CareerRoadmap> => {
  const statsStr = typeof stats === 'string' ? stats : JSON.stringify(stats);
  
  const prompt = `
    ${getLangInstruction(language)}
    You are a legendary Artist Manager. 
    Artist: "${name}", Genre: "${genre}", Goal: "${goal}".
    
    Social Media / Market Data: ${statsStr}
    
    Based on the social stats provided, assess their "Reality Gap".
    If they have high TikTok but low Spotify, focus the strategy on conversion.
    If they have 0 stats, focus on "Zero to One" audience building.

    ${tracks.length > 0 ? `I have provided ${tracks.length} demo tracks. Listen to them to gauge production quality, but prioritize the MARKET DATA for the business strategy.
    ` : 'Create a strategic 30-60-90 Day Career Roadmap based on the data provided.'}

    Return JSON matching the CareerRoadmap schema.
  `;

  const parts: any[] = [{ text: prompt }];
  tracks.forEach((t, i) => {
      parts.push({ inlineData: { mimeType: t.mimeType, data: t.base64 } });
      parts.push({ text: `Track ${i+1}: ${t.name}` });
  });

  const response = await ai.models.generateContent({
    model: MODEL_SMART,
    contents: { parts },
    config: {
      thinkingConfig: { thinkingBudget: 16384 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          artistName: { type: Type.STRING },
          archetype: { type: Type.STRING },
          missionStatement: { type: Type.STRING },
          phases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                duration: { type: Type.STRING },
                focus: { type: Type.STRING },
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      week: { type: Type.STRING },
                      action: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["week", "action", "description"]
                  }
                }
              },
              required: ["title", "duration", "focus", "tasks"]
            }
          },
          kpis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                metric: { type: Type.STRING },
                target: { type: Type.STRING }
              },
              required: ["metric", "target"]
            }
          },
          budgetStrategy: { type: Type.STRING },
          trackStrategies: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      trackName: { type: Type.STRING },
                      suitabilityScore: { type: Type.NUMBER },
                      role: { type: Type.STRING },
                      reasoning: { type: Type.STRING },
                      platformFocus: { type: Type.STRING },
                      actionPlan: { type: Type.STRING }
                  }
              }
          }
        },
        required: ["artistName", "archetype", "missionStatement", "phases", "kpis", "budgetStrategy"]
      }
    }
  });

  if (!response.text) throw new Error("No roadmap generated");
  return JSON.parse(response.text) as CareerRoadmap;
};

export const generateCampaignInsights = async (
  artistName: string,
  stats: SocialStats,
  lang: 'en' | 'es'
): Promise<CampaignData> => {
  const prompt = `
    ${getLangInstruction(lang)}
    Role: Music Industry Data Analyst.
    Artist: ${artistName}
    Current Social Stats: 
    - Instagram: ${stats.instagram}
    - TikTok: ${stats.tiktok}
    - Spotify: ${stats.spotify}
    - YouTube: ${stats.youtube}

    Task:
    1. Analyze these metrics to determine the artist's current career stage (e.g. "Undiscovered", "Viral", "Established").
    2. Generate a hypothetical 6-month growth history (chart data) leading up to these current numbers. Use realistic trajectories.
    3. Determine the "Next Executive Decision" based on platform strengths/weaknesses (e.g. "TikTok is strong but Spotify conversion is low -> Run Canvas campaign").
    4. Estimate budget utilization and engagement rate based on the "stage".

    Return JSON matching the CampaignData structure.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_SMART,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chartData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                listeners: { type: Type.NUMBER },
                revenue: { type: Type.NUMBER }
              },
              required: ["month", "listeners", "revenue"]
            }
          },
          budgetSpent: { type: Type.NUMBER },
          budgetTotal: { type: Type.NUMBER },
          engagementRate: { type: Type.NUMBER },
          topPlatform: { type: Type.STRING },
          nextDecision: { type: Type.STRING },
          decisionUrgency: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
        },
        required: ["chartData", "budgetSpent", "budgetTotal", "engagementRate", "topPlatform", "nextDecision", "decisionUrgency"]
      }
    }
  });
  
  if (!response.text) throw new Error("Failed to generate campaign insights");
  return JSON.parse(response.text) as CampaignData;
};

export const generateContentImage = async (prompt: string, size: ImageSize = '1K', aspectRatio: string = "1:1"): Promise<string> => {
    const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-pro-image-preview for high quality generation
    const response = await aiClient.models.generateContent({
        model: MODEL_IMAGE_GEN,
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio,
                imageSize: size
            }
        }
    });
    
    // Find image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No image generated");
};

export const editContentImage = async (base64Image: string, prompt: string, mimeType: string = 'image/png'): Promise<string> => {
    const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-2.5-flash-image for editing
    // Note: This model does not support responseMimeType or imageConfig for editing in the same way,
    // we send text + image and get image back.
    const response = await aiClient.models.generateContent({
        model: MODEL_IMAGE_EDIT,
        contents: {
            parts: [
                { inlineData: { mimeType: mimeType, data: base64Image } },
                { text: `Edit this image: ${prompt}` }
            ]
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("Image edit failed");
};

export const generateRealityCheck = async (
    artistName: string, 
    rawInfo: string, 
    links: string[], 
    evidenceImages: {base64: string, mimeType: string}[], 
    lang: 'en' | 'es'
): Promise<RealityCheckAnalysis> => {
    const prompt = `
        ${getLangInstruction(lang)}
        Perform a brutal 'Reality Check' audit on this artist.
        Name: ${artistName}
        Self-Reported Status: ${rawInfo}
        Links: ${links.join(', ')}
        
        ${evidenceImages.length > 0 ? "I have attached screenshots of their social media/Spotify metrics. Analyze these images to verify their status and find opportunities/issues." : ""}
        
        Based on the text info AND the provided visual evidence (if any), build a COMPREHENSIVE growth strategy.
        1. Assess current status brutally.
        2. Identify gaps in branding/visuals based on the images.
        3. Create a short-term and long-term plan.
        
        Return JSON with: currentStatus (level, summary, estimatedMonthlyListeners, perception), gapAnalysis (area, observation, fix), growthStrategy, playlistActionPlan.
    `;

    const parts: any[] = [{ text: prompt }];
    evidenceImages.forEach(img => {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
    });

    const response = await ai.models.generateContent({
        model: MODEL_SMART,
        contents: { parts },
        config: { responseMimeType: "application/json" }
    });

    if (!response.text) throw new Error("Audit failed");
    return JSON.parse(response.text) as RealityCheckAnalysis;
};

export const generateLyricQuestions = async (lyrics: string, genre: string, lang: 'en' | 'es', focus: string = 'General Improvement'): Promise<string[]> => {
    const prompt = `
        ${getLangInstruction(lang)}
        Analyze these lyrics (Genre: ${genre}). Focus Mode: "${focus}".
        Lyrics: "${lyrics.substring(0, 1000)}..."
        
        Ask 3 probing questions to help the songwriter improve the lyrics specifically regarding "${focus}".
        Examples for different modes:
        - Narrative: "What is the inciting incident?"
        - Flow: "Are there too many syllables in line 4?"
        - Punchlines: "Can we make the ending twist sharper?"
        
        Return JSON array of strings.
    `;
    
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    
    if (!response.text) return ["What is the core emotion?", "Who is the audience?", "What is the climax?"];
    return JSON.parse(response.text);
};

export const enhanceLyrics = async (lyrics: string, history: LyricQuestion[], lang: 'en' | 'es', focus: string = 'General'): Promise<EnhancedLyricsResponse> => {
    const prompt = `
        ${getLangInstruction(lang)}
        Original Lyrics: "${lyrics}"
        Context from Q&A: ${JSON.stringify(history)}
        Creative Focus Mode: "${focus}"
        
        Task:
        ${focus === 'Complete Structure' 
          ? 'GENERATE A FULL SONG. Take the input lyrics as a seed/theme and write a complete song structure (Intro, Verse 1, Chorus, Verse 2, Bridge, Chorus, Outro) the way you best see fit for the genre. You have full creative liberty to add lines and sections.' 
          : 'Rewrite/Polish the lyrics based on the answers and the specific focus mode.'}
        
        If focus is 'Flow', ensure syllables match a consistent rhythm.
        If focus is 'Story', ensure narrative arc and character depth.
        If focus is 'Punchlines', add witty metaphors and wordplay.
        
        Return JSON: { lyrics: string, critique: string }
    `;
    
    const response = await ai.models.generateContent({
        model: MODEL_SMART,
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    lyrics: { type: Type.STRING },
                    critique: { type: Type.STRING }
                }
            }
        }
    });
    
    if (!response.text) throw new Error("Lyric enhancement failed");
    return JSON.parse(response.text);
};

export const findRhymes = async (word: string, genre: string, lang: 'en' | 'es'): Promise<RhymeResult> => {
    const prompt = `
        ${getLangInstruction(lang)}
        Role: Expert Lyricist in genre: ${genre}.
        Target Word: "${word}"
        
        Provide a list of rhymes and synonyms suitable for songwriting in this genre.
        1. Perfect Rhymes (Multi-syllabic preferred if appropriate for genre)
        2. Near/Slant Rhymes (Crucial for modern songwriting)
        3. Thematic Synonyms (Words with similar meaning that fit the genre vibe)
        
        Return JSON matching RhymeResult.
    `;
    
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    perfectRhymes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    nearRhymes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });

    if (!response.text) throw new Error("Rhyme lookup failed");
    return JSON.parse(response.text) as RhymeResult;
};

export const analyzeStyleBlend = async (tracks: {base64: string, mimeType: string, name: string}[], lang: 'en' | 'es'): Promise<StyleBlendAnalysis> => {
    const prompt = `
        ${getLangInstruction(lang)}
        Analyze these ${tracks.length} audio tracks.
        Identify the key elements of each (DNA) and create a "Production Recipe" to fuse them into a new cohesive style.
        Return JSON: { synthesisConcept, sourceBreakdowns: [{trackName, keyElementToExtract, roleInMix}], productionRecipe: [{title, instruction, technicalTip}], suggestedBpm, suggestedKey }
    `;
    
    const parts: any[] = [{ text: prompt }];
    tracks.forEach(t => {
        parts.push({ inlineData: { mimeType: t.mimeType, data: t.base64 } });
    });

    const response = await ai.models.generateContent({
        model: MODEL_SMART, // Need smart model for multimodal reasoning across multiple tracks
        contents: { parts },
        config: { responseMimeType: "application/json" }
    });
    
    if (!response.text) throw new Error("Blend analysis failed");
    return JSON.parse(response.text);
};

export const generateSunoPrompt = async (
    concept: string, 
    base64Ref: string | undefined, 
    mimeType: string | undefined, 
    customLyrics: string | undefined
): Promise<SunoPromptData> => {
    const prompt = `
        Create a Suno.ai / MusicFX prompt and song structure.
        Concept: ${concept}
        ${customLyrics ? `Lyrics provided: "${customLyrics}"` : "Generate lyrics based on concept."}
        ${base64Ref ? "Audio reference provided - analyze its vibe for the prompt." : ""}
        
        Return JSON: { title, tags, lyrics, musicFXPrompt }
    `;
    
    const parts: any[] = [{ text: prompt }];
    if (base64Ref && mimeType) {
        parts.push({ inlineData: { mimeType, data: base64Ref } });
    }

    const response = await ai.models.generateContent({
        model: MODEL_SMART,
        contents: { parts },
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    tags: { type: Type.STRING },
                    lyrics: { type: Type.STRING },
                    musicFXPrompt: { type: Type.STRING }
                }
            }
        }
    });
    
    if (!response.text) throw new Error("Prompt generation failed");
    return JSON.parse(response.text);
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
    const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await aiClient.models.generateContent({
        model: MODEL_TTS,
        contents: { parts: [{ text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName }
                }
            }
        }
    });
    
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("TTS failed");
    return audioData;
};

export const compareTracks = async (
  analysisA: SongAnalysis, 
  analysisB: SongAnalysis, 
  mode: 'evolution' | 'versus',
  lang: 'en' | 'es'
): Promise<ProgressionReport | ComparisonResult> => {
  const prompt = `
      ${getLangInstruction(lang)}
      COMPARE MODE: ${mode.toUpperCase()}

      Track A (Reference/V1): ${JSON.stringify(analysisA).substring(0, 3000)}
      Track B (Challenger/V2): ${JSON.stringify(analysisB).substring(0, 3000)}

      ${mode === 'evolution' ? 
        `This is a PROGRESSION report. Track B is a newer version of Track A.
         Identify what improved (mixing, vocals, arrangement) and what regressed.
         Return JSON matching 'ProgressionReport' structure: { winner: 'B' (if improved), growthScore (0-100), summary, improvements: [{area, before, after, verdict}], nextSteps, categories: [{name, scoreA, scoreB, notes}], keyDifference, recommendation }` 
        : 
        `This is a VERSUS BATTLE. Two different tracks competing.
         Who wins? Which has better commercial potential, mix quality, and writing?
         Return JSON matching 'ComparisonResult' structure: { winner: 'A'|'B'|'Tie', summary, categories: [{name, scoreA, scoreB, notes}], keyDifference, recommendation }`
      }
  `;

  const response = await ai.models.generateContent({
      model: MODEL_SMART,
      contents: prompt,
      config: { responseMimeType: "application/json" }
  });

  if (!response.text) throw new Error("Comparison failed");
  return JSON.parse(response.text);
};

export const generateProgressionReport = async (
    oldAnalysis: SongAnalysis, 
    newAnalysis: SongAnalysis, 
    lang: 'en' | 'es'
): Promise<ProgressionReport> => {
    // Legacy wrapper for existing calls, rerouting to new function
    return compareTracks(oldAnalysis, newAnalysis, 'evolution', lang) as Promise<ProgressionReport>;
};

export class AnalysisChatSession {
    private chat: Chat;
    
    constructor(analysis: SongAnalysis, lang: 'en' | 'es') {
        const systemInstruction = `
            ${getLangInstruction(lang)}
            You are SonicMF, an expert AI music producer assistant.
            Context (The current track analysis):
            ${JSON.stringify(analysis).substring(0, 10000)}
            
            Answer the user's questions about the mix, arrangement, or strategy based on this data.
            Be short, concise, and helpful.
        `;
        
        this.chat = ai.chats.create({
            model: MODEL_FAST,
            config: { systemInstruction }
        });
    }
    
    async sendMessage(text: string): Promise<string> {
        const result = this.chat.sendMessage({ message: text });
        return (await result).text || "";
    }
}

export class CareerChatSession {
    private chat: Chat;
    
    constructor(roadmap: CareerRoadmap, lang: 'en' | 'es') {
        const systemInstruction = `
            ${getLangInstruction(lang)}
            You are a legendary Artist Manager.
            Context (The Artist's Roadmap):
            ${JSON.stringify(roadmap).substring(0, 15000)}
            
            The user will ask follow-up questions about this strategy.
            Answer strategically, focusing on growth, marketing, and brand building.
            Be direct and actionable.
        `;
        
        this.chat = ai.chats.create({
            model: MODEL_FAST,
            config: { systemInstruction }
        });
    }
    
    async sendMessage(text: string): Promise<string> {
        const result = await this.chat.sendMessage({ message: text });
        return result.text || "";
    }
}

export class ExpertChatSession {
    private chat: Chat;

    constructor(lang: 'en' | 'es', persona: 'producer' | 'manager' = 'producer') {
        const producerInstruction = `
            ${getLangInstruction(lang)}
            You are SonicMF's Resident Expert - a world-class Music Producer, Mixing Engineer, and Songwriter.
            You have deep technical knowledge of DAWs (Ableton, FL Studio, Logic), mixing techniques (EQ, Compression, Saturation), music theory, and synthesis.
            
            Your goal is to guide the user through any music production challenge.
            - If they ask about lyrics, help with rhyme schemes and metaphors.
            - If they ask about mixing, give specific frequency ranges to cut/boost.
            - If they ask about production, suggest arrangement ideas or sound design tips.
            
            Be cool, professional, and encouraging. Use technical terms but explain them simply.
        `;

        const managerInstruction = `
            ${getLangInstruction(lang)}
            You are SonicMF's Artist Manager & A&R Executive.
            You are shrewd, strategic, and focused on growth, numbers, and brand.
            
            Your goal is to maximize the artist's career potential.
            - If they ask about releases, give a rollout strategy (singles, waterfalls).
            - If they ask about marketing, suggest TikTok trends, playlist pitching, and brand aesthetics.
            - If they ask about business, explain splits, royalties, and contracts simply.
            
            Tone: Professional, ambitious, no-nonsense, but supportive.
        `;

        this.chat = ai.chats.create({
            model: MODEL_FAST,
            config: { systemInstruction: persona === 'manager' ? managerInstruction : producerInstruction }
        });
    }

    async sendMessage(text: string): Promise<string> {
        const result = await this.chat.sendMessage({ message: text });
        return result.text || "";
    }
}
