
import { GoogleGenAI, Type } from "@google/genai";
import { InfographicData, SectionType, InfographicStyle, InfographicSection, BrandConfig, InfographicAspectRatio, SocialPlatform, PresentationData, FileData, ImageModelType, Slide, ComicData, ComicPanel } from "../types";
import { estimateCost } from "../utils/costCalculator";

// Helper to get a fresh AI client instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// CONSTANT: User-defined high quality text instruction
const HIGH_QUALITY_TEXT_PROMPT = "整張圖片都是4K高解析畫質、讓圖片可以放大400倍、請採用正確的繁體中文顯示、文字線條清楚、不模糊！";

// Schema for Infographic Data using @google/genai Type enum
const infographicSchema = {
  type: Type.OBJECT,
  properties: {
    mainTitle: { type: Type.STRING, description: "A catchy, short headline for the infographic. MUST NOT BE EMPTY." },
    subtitle: { type: Type.STRING, description: "A brief 1-2 sentence summary of the topic" },
    layout: { 
      type: Type.STRING, 
      enum: ['grid', 'timeline', 'process', 'comparison'],
      description: "Choose 'timeline' for dates/history, 'process' for steps/flows, 'comparison' for pros/cons or before/after, 'grid' for general lists."
    },
    comparisonLabels: {
      type: Type.ARRAY,
      description: "Required ONLY if layout is 'comparison'. Provide 2 labels, e.g., ['Pros', 'Cons'] or ['Before', 'After'].",
      items: { type: Type.STRING }
    },
    sections: {
      type: Type.ARRAY,
      description: "Content blocks. If layout is 'comparison', split items evenly between the two sides (first half = left side, second half = right side).",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique generic ID e.g., 'sec_1'" },
          title: { type: Type.STRING, description: "Section header" },
          content: { type: Type.STRING, description: "Concise summary text. Use bullet points (•) if multiple items." },
          iconType: { 
            type: Type.STRING, 
            description: "Visual icon suggestion. Must match available types." 
          },
          imagePrompt: {
            type: Type.STRING,
            description: "Optional. A detailed English prompt to generate an illustration for this specific section. Only add this for the most important 2-3 sections or if visual explanation is crucial. Leave empty otherwise."
          }
        },
        required: ["id", "title", "content", "iconType"]
      }
    },
    statistics: {
      type: Type.ARRAY,
      description: "3-4 key numerical stats, dates, or data points found in text",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique generic ID e.g., 'stat_1'" },
          value: { type: Type.STRING, description: "The number, date, or percentage, e.g. '2025' or '85%'" },
          label: { type: Type.STRING, description: "Short label for the stat, e.g. 'Deadline' or 'Growth'" }
        },
        required: ["id", "value", "label"]
      }
    },
    charts: {
      type: Type.ARRAY,
      description: "Identify numerical data suitable for visualization. Create 0-2 charts.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID e.g. 'chart_1'" },
          title: { type: Type.STRING, description: "Chart title" },
          type: { type: Type.STRING, enum: ['bar', 'pie'] },
          description: { type: Type.STRING, description: "Brief explanation of the chart" },
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER },
                color: { type: Type.STRING, description: "Optional hex color for this slice/bar" }
              },
              required: ["label", "value"]
            }
          }
        },
        required: ["id", "title", "type", "data"]
      }
    },
    conclusion: { type: Type.STRING, description: "A simplified footer or call to action" },
    themeColor: { type: Type.STRING, description: "A hex color code that fits the style and mood. For 'custom' style, pick a color that matches the user's description." }
  },
  required: ["mainTitle", "subtitle", "layout", "sections", "statistics", "conclusion", "themeColor"]
};

// Schema for Presentation Data
const presentationSchema = {
  type: Type.OBJECT,
  properties: {
    mainTitle: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    themeColor: { type: Type.STRING },
    slides: {
      type: Type.ARRAY,
      description: "Generate slides based on the content. Ensure a logical flow.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          layout: { 
            type: Type.STRING, 
            enum: ['title_cover', 'section_header', 'text_and_image', 'bullet_list', 'big_number', 'quote', 'diagram_image', 'conclusion'],
            description: "The visual layout template for this slide. Use 'diagram_image' for complex tables, flowcharts, curves, or SOP diagrams."
          },
          title: { type: Type.STRING, description: "Slide Headline" },
          content: { type: Type.STRING, description: "Main body text. For bullet_list, separate points with newlines." },
          speakerNotes: { type: Type.STRING, description: "A script for the speaker to say while presenting this slide." },
          imagePrompt: { type: Type.STRING, description: "English prompt for an illustration. MANDATORY for 'diagram_image'. Provide very detailed visual description for diagrams/tables." },
          statValue: { type: Type.STRING, description: "Only for big_number layout." }
        },
        required: ["id", "layout", "title", "content", "speakerNotes"]
      }
    }
  },
  required: ["mainTitle", "subtitle", "slides", "themeColor"]
};

// Schema for Comic Data
const comicSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    storySummary: { type: Type.STRING, description: "A brief summary of the comic story" },
    characterVisualBible: { 
      type: Type.STRING, 
      description: "A detailed visual description of the main characters (hair, clothes, face features) to ensure consistency across panels. e.g. 'John is a tall man with short black hair wearing a red tie and white shirt'." 
    },
    panels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          panelNumber: { type: Type.NUMBER },
          description: { type: Type.STRING, description: "What happens in this panel" },
          dialogue: { type: Type.STRING, description: "Character speech or caption. Use 'Character: Speech'" },
          cameraDetail: { type: Type.STRING, description: "Camera angle instruction e.g. Close-up, Wide shot, Low angle" },
          imagePrompt: { type: Type.STRING, description: "A detailed English prompt for drawing this specific panel. Do NOT include character details here, rely on the visual bible." }
        },
        required: ["id", "panelNumber", "description", "dialogue", "cameraDetail", "imagePrompt"]
      }
    }
  },
  required: ["title", "storySummary", "characterVisualBible", "panels"]
};

// Helper to reliably parse JSON from AI response
const parseJsonFromResponse = (text: string) => {
  try {
    // 0. Clean markdown code blocks
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 1. Try direct parse
    return JSON.parse(cleanText);
  } catch (e) {
    // 2. Try finding first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (e3) {
        // continue
      }
    }
    console.error("Failed to parse JSON", text);
    throw new Error("AI response was not valid JSON");
  }
};

// Helper to summarize URL content using Google Search Grounding
export const summarizeUrlContent = async (url: string): Promise<string> => {
  if (!url) return "";
  
  const prompt = `Please visit and summarize the detailed content of the following URL: ${url}. 
  Provide a comprehensive summary in Traditional Chinese. 
  Focus on extracting key facts, statistics, main arguments, and the overall structure of the information provided on the page.`;

  try {
    const ai = getAI();
    // Use gemini-3-flash-preview for summarization tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text || "";
  } catch (e) {
    console.error("URL summary failed", e);
    return `(Failed to retrieve content from URL: ${url}. Please ensure the URL is publicly accessible.)`;
  }
};

// Helper: Wait function for retries
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Retry operation wrapper with exponential backoff
const retryOperation = async <T>(
  operation: () => Promise<T>, 
  retries: number = 3, 
  delay: number = 1000
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    await wait(delay);
    return retryOperation(operation, retries - 1, delay * 2);
  }
};

// Helper: Concurrency Controller (Batch Processing)
const processItemsWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  const chunks = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await wait(500); 
    }
  }

  return results;
};

const generateSectionImage = async (
  prompt: string, 
  style: InfographicStyle, 
  modelName: ImageModelType = 'gemini-2.5-flash-image',
  customStylePrompt?: string,
  characterDescription?: string 
): Promise<string | undefined> => {
  const stylePrompts = {
    professional: "flat vector illustration, corporate memphis style, clean, blue and teal tones, white background, professional business art, minimalist details, high quality",
    comic: "comic book style illustration, bold outlines, vibrant colors, pop art, dynamic action, halftone patterns, graphic novel style",
    digital: "futuristic digital art, neon glowing lines, cyberpunk aesthetic, dark background, 3d render, tech visualization, data stream visuals",
    watercolor: "watercolor painting, soft brush strokes, pastel colors, artistic, white paper texture background, dreamy, hand-painted",
    minimalist: "minimalist line art, black and white, simple shapes, negative space, iconographic style, sophisticated",
    custom: customStylePrompt ? `${customStylePrompt}, artistic visualization, high quality` : "high quality unique artistic style illustration"
  };

  const isProModel = modelName === 'gemini-3-pro-image-preview';
  const textInstruction = isProModel ? `${HIGH_QUALITY_TEXT_PROMPT}` : "No text in image.";
  const characterPrefix = characterDescription ? `[Visual Bible: ${characterDescription}] ` : "";
  const fullPrompt = `${characterPrefix}${prompt}. Style: ${stylePrompts[style]}. ${textInstruction}`;

  const config: any = {};
  if (isProModel) {
    config.imageConfig = { aspectRatio: '16:9', imageSize: '1K' };
  }

  return retryOperation(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: fullPrompt }] },
      config: config
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  }, 3, 2000).catch(e => {
    console.error("Image generation failed after retries", e);
    return undefined;
  });
};

export { FileData };

// Generate a full single-page infographic image
export const generateFullInfographicImage = async (
  text: string, 
  style: InfographicStyle,
  files: FileData[] = [],
  url?: string,
  brandConfig?: BrandConfig,
  customStylePrompt?: string,
  aspectRatio: InfographicAspectRatio = 'vertical',
  refinementInstruction?: string
): Promise<{ imageUrl: string | undefined, prompt: string }> => {
  
  let processedText = text;
  if (url) {
    const urlSummary = await summarizeUrlContent(url);
    processedText += `\n\n[External URL Content Summary (${url})]:\n${urlSummary}`;
  }

  let brandingInstructions = "";
  if (brandConfig?.isEnabled) {
    brandingInstructions = `
    STRICT BRANDING REQUIREMENTS:
    1. Primary Color: You MUST use ${brandConfig.brandColor} as the dominant color for headers and accents.
    2. Tone of Voice: The text and visual mood MUST reflect a "${brandConfig.toneOfVoice}" persona.
    3. Footer Signature: You MUST explicitly include the text "${brandConfig.footerText}" at the very bottom of the image as a footer or watermark.
    `;
  }

  const styleDescription = style === 'custom' && customStylePrompt ? `Custom Style: "${customStylePrompt}"` : `Style: ${style}`;
  const ratioConfig = {
    'vertical': { apiValue: '3:4', desc: 'Vertical Poster' },
    'horizontal': { apiValue: '16:9', desc: 'Horizontal Presentation Slide' },
    'square': { apiValue: '1:1', desc: 'Square Social Media Post' }
  };
  const currentRatio = ratioConfig[aspectRatio];

  let correctionHeader = "";
  if (refinementInstruction) {
    correctionHeader = `*** CRITICAL CORRECTION INSTRUCTION *** ${refinementInstruction} *****************************************`;
  }

  const promptText = `Create a high-quality, single-page ${currentRatio.desc} infographic in Traditional Chinese (Taiwan) based on the provided content.
  ${correctionHeader}
  ${styleDescription}
  ${brandingInstructions}
  Requirements:
  - Aspects Ratio Target: ${currentRatio.apiValue}.
  - High resolution, clear text in Traditional Chinese.
  - ${HIGH_QUALITY_TEXT_PROMPT}
  Content Notes: ${processedText.substring(0, 6000)}`;

  const parts: any[] = [{ text: promptText }];
  files.forEach(file => { parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } }); });

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio: currentRatio.apiValue, imageSize: '2K' } }
    });

    let imageUrl: string | undefined = undefined;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return { imageUrl, prompt: promptText };
  } catch (e) {
    console.error("Full infographic generation failed", e);
    throw e; 
  }
};

export const generateInfographic = async (
  text: string, 
  style: InfographicStyle,
  files: FileData[] = [],
  url?: string,
  toneOfVoice?: string, 
  customStylePrompt?: string,
  aspectRatio: InfographicAspectRatio = 'vertical',
  imageModel: ImageModelType = 'gemini-2.5-flash-image'
): Promise<InfographicData> => {
  const finalToneInstruction = toneOfVoice ? `Adopt the following specific tone/persona: "${toneOfVoice}".` : "Adopt a visual style appropriate for " + style;
  let processedText = text;
  if (url) {
    const urlSummary = await summarizeUrlContent(url);
    processedText += `\n\n[External URL Content Summary (${url})]:\n${urlSummary}`;
  }

  const textPrompt = `Analyze text and files to create an infographic content plan. Language: Traditional Chinese (Taiwan). Style: ${style}. ${finalToneInstruction} Content: ${processedText.substring(0, 6000)}`;
  const parts: any[] = [{ text: textPrompt }];
  files.forEach(file => { parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } }); });

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: infographicSchema,
      systemInstruction: "You are an expert information designer. Output valid JSON.",
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  const data = parseJsonFromResponse(response.text) as InfographicData;
  data.style = style;
  data.aspectRatio = aspectRatio;
  data.promptUsed = textPrompt;

  let generatedImageCount = 0;
  data.sections = await processItemsWithConcurrency(data.sections, 3, async (section) => {
    if (section.imagePrompt) {
      generatedImageCount++;
      const imageUrl = await generateSectionImage(section.imagePrompt, style, imageModel, customStylePrompt);
      return { ...section, imageUrl };
    }
    return section;
  });

  data.costEstimate = estimateCost(textPrompt.length, response.text.length, generatedImageCount, imageModel);
  return data;
};

export const generatePresentation = async (
  text: string, 
  style: InfographicStyle,
  files: FileData[] = [],
  url?: string,
  toneOfVoice?: string, 
  customStylePrompt?: string,
  imageModel: ImageModelType = 'gemini-3-pro-image-preview',
  targetSlideCount: number = 10
): Promise<PresentationData> => {
  let processedText = text;
  if (url) {
    const urlSummary = await summarizeUrlContent(url);
    processedText += `\n\n[External URL Content Summary (${url})]:\n${urlSummary}`;
  }

  const textPrompt = `Professional Presentation Designer. Deck plan for ${targetSlideCount} slides. Language: Traditional Chinese (Taiwan). Style: ${style}. Content: ${processedText.substring(0, 10000)}`;
  const parts: any[] = [{ text: textPrompt }];
  files.forEach(file => { parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } }); });

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: presentationSchema
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  const data = parseJsonFromResponse(response.text) as PresentationData;
  data.style = style;
  data.promptUsed = textPrompt;

  let generatedImageCount = 0;
  data.slides = await processItemsWithConcurrency(data.slides, 3, async (slide) => {
    if (slide.imagePrompt) {
      generatedImageCount++;
      const imageUrl = await generateSectionImage(slide.imagePrompt, style, imageModel, customStylePrompt);
      return { ...slide, imageUrl };
    }
    return slide;
  });

  data.costEstimate = estimateCost(textPrompt.length, response.text.length, generatedImageCount, imageModel);
  return data;
};

export const refinePresentationSlide = async (
  slide: Slide,
  instruction: string,
  style: InfographicStyle,
  imageModel: ImageModelType,
  customStylePrompt?: string
): Promise<Slide> => {
  const prompt = `Refine this slide: ${instruction}. Current: ${JSON.stringify(slide)}. Style: ${style}. Language: Traditional Chinese (Taiwan).`;
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  if (!response.text) throw new Error("Refinement failed");
  let updatedSlide = parseJsonFromResponse(response.text) as Slide;
  if ((updatedSlide as any).result) updatedSlide = (updatedSlide as any).result;
  
  if (updatedSlide.imagePrompt && updatedSlide.imagePrompt !== slide.imagePrompt) {
    try {
      const newImageUrl = await generateSectionImage(updatedSlide.imagePrompt!, style, imageModel, customStylePrompt);
      updatedSlide.imageUrl = newImageUrl || slide.imageUrl;
    } catch (e) {
      updatedSlide.imageUrl = slide.imageUrl;
    }
  } else {
    updatedSlide.imageUrl = slide.imageUrl;
  }
  return updatedSlide;
};

export const refineInfographicSection = async (
  originalData: InfographicData,
  sectionType: SectionType,
  sectionId: string | null,
  instruction: string
): Promise<InfographicData> => {
  const newData = { ...originalData };
  const prompt = `Refine infographic section: ${instruction}. Return JSON. Language: Traditional Chinese.`;
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  if (!response.text) throw new Error("Failed to refine content");
  const result = parseJsonFromResponse(response.text);
  if (sectionType === 'title') newData.mainTitle = result.result || result.mainTitle;
  else if (sectionType === 'section' && sectionId) newData.sections = newData.sections.map(s => s.id === sectionId ? { ...s, ...result } : s);
  return newData;
};

export const transformInfographic = async (
  currentData: InfographicData,
  instruction: string
): Promise<InfographicData> => {
  const prompt = `Transform JSON based on instruction: ${instruction}. Keep structure. Language: Traditional Chinese. Data: ${JSON.stringify(currentData)}`;
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: infographicSchema }
  });
  if (!response.text) throw new Error("Transformation failed");
  const transformedData = parseJsonFromResponse(response.text) as InfographicData;
  return { ...transformedData, themeColor: currentData.themeColor };
};

export const generateSocialCaption = async (
  data: InfographicData,
  platform: SocialPlatform
): Promise<string> => {
  const prompt = `Write a caption for ${platform} based on infographic. Language: Traditional Chinese. Data: ${data.mainTitle}`;
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text || "Failed to generate caption.";
};

export const generateComicScript = async (
  text: string, 
  style: InfographicStyle,
  files: FileData[] = [],
  url?: string,
  customStylePrompt?: string,
  targetPanelCount: number = 4
): Promise<ComicData> => {
  const prompt = `Comic script with ${targetPanelCount} panels. Language: Traditional Chinese. Style: ${style}. Content: ${text.substring(0, 5000)}`;
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: comicSchema }
  });
  if (!response.text) throw new Error("No response from Gemini");
  const data = parseJsonFromResponse(response.text) as ComicData;
  data.style = style;
  return data;
};

export const generateComicImages = async (
  data: ComicData,
  imageModel: ImageModelType,
  customStylePrompt?: string
): Promise<ComicData> => {
  let generatedImageCount = 0;
  const updatedPanels = await processItemsWithConcurrency(data.panels, 3, async (panel) => {
    generatedImageCount++;
    const imageUrl = await generateSectionImage(panel.imagePrompt, data.style, imageModel, customStylePrompt, data.characterVisualBible);
    return { ...panel, imageUrl };
  });
  return { ...data, panels: updatedPanels };
};
