
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InfographicData, SectionType, InfographicStyle, InfographicSection, BrandConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const infographicSchema: Schema = {
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
            enum: ['bulb', 'chart', 'list', 'target', 'warning', 'info', 'calendar', 'check', 'time'],
            description: "Visual icon suggestion" 
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

// Helper to summarize URL content using Google Search Grounding
export const summarizeUrlContent = async (url: string): Promise<string> => {
  if (!url) return "";
  
  const prompt = `Please visit and summarize the detailed content of the following URL: ${url}. 
  Provide a comprehensive summary in Traditional Chinese. 
  Focus on extracting key facts, statistics, main arguments, and the overall structure of the information provided on the page.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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

const generateSectionImage = async (prompt: string, style: InfographicStyle, customStylePrompt?: string): Promise<string | undefined> => {
  const stylePrompts = {
    professional: "flat vector illustration, corporate memphis style, clean, blue and teal tones, white background, professional business art, minimalist details, high quality",
    comic: "comic book style illustration, bold outlines, vibrant colors, pop art, dynamic action, halftone patterns, graphic novel style",
    digital: "futuristic digital art, neon glowing lines, cyberpunk aesthetic, dark background, 3d render, tech visualization, data stream visuals",
    watercolor: "watercolor painting, soft brush strokes, pastel colors, artistic, white paper texture background, dreamy, hand-painted",
    minimalist: "minimalist line art, black and white, simple shapes, negative space, iconographic style, sophisticated",
    custom: customStylePrompt ? `${customStylePrompt}, artistic visualization, high quality` : "high quality unique artistic style illustration"
  };

  const fullPrompt = `${prompt}. Style: ${stylePrompts[style]}. No text in image.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }]
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (e) {
    console.error("Image generation failed", e);
    return undefined;
  }
};

export interface FileData {
  mimeType: string;
  data: string;
}

// NEW: Generate a full single-page infographic image
export const generateFullInfographicImage = async (
  text: string, 
  style: InfographicStyle,
  files: FileData[] = [],
  url?: string,
  brandConfig?: BrandConfig,
  customStylePrompt?: string
): Promise<string | undefined> => {
  
  let processedText = text;
  
  // If URL is provided, summarize it first and append to text
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

  const styleDescription = style === 'custom' && customStylePrompt 
    ? `Custom Style: "${customStylePrompt}"` 
    : `Style: ${style}`;

  const promptText = `Create a high-quality, single-page vertical infographic in Traditional Chinese (Taiwan) based on the provided content.
  
  ${styleDescription}
  ${brandingInstructions}
  
  Requirements:
  - The image should look like a professional infographic poster.
  - It must contain the Main Title and Subtitles in Traditional Chinese.
  - Include data visualization, icons, or illustrations relevant to the content.
  - The layout should be organized, easy to read, and visually striking.
  - Use the "Style" specified above.
  
  Content Notes:
  ${processedText.substring(0, 6000)}`;

  const parts: any[] = [{ text: promptText }];
  
  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: '3:4', // Vertical poster format
          imageSize: '2K' // High resolution
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;

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
  toneOfVoice?: string, // New parameter for custom tone
  customStylePrompt?: string // New parameter for Infinite Style Lab
): Promise<InfographicData> => {
  const styleInstructions = {
    professional: "Use a clean, corporate tone. Suggest deep blues, teals, or grays for hex color. Title must be impactful.",
    comic: "Use a fun, energetic tone with punchy exclamations! Suggest bright pop-art colors (yellow, red, cyan) for hex color.",
    digital: "Use a tech-focused, futuristic tone. Suggest neon greens, purples, or dark mode hex colors.",
    watercolor: "Use a soft, artistic, and flowing tone. Suggest pastel colors for hex color.",
    minimalist: "Use extremely concise, Zen-like language. Suggest monochromatic or earth tone hex colors.",
    custom: `Adopt a visual and writing style based on this description: "${customStylePrompt}". Choose a theme color that matches this style.`
  };

  const finalToneInstruction = toneOfVoice 
    ? `Adopt the following specific tone/persona: "${toneOfVoice}".` 
    : styleInstructions[style];

  let processedText = text;

  // If URL is provided, summarize it first and append to text
  if (url) {
    const urlSummary = await summarizeUrlContent(url);
    processedText += `\n\n[External URL Content Summary (${url})]:\n${urlSummary}`;
  }

  const textPrompt = `Analyze the following text (and attached files if any) and transform it into a structured infographic content plan. 
  
  **Requirements:**
  1. **Language:** Output MUST be in **Traditional Chinese (Taiwan)**.
  2. **Tone & Style:** The visual and writing style should be **"${style}"**. ${finalToneInstruction}
  3. **Structure Analysis:**
     - If content involves a direct comparison (Pros vs Cons, Before vs After), use 'comparison'.
     - If content implies a timeline/history, use 'timeline'.
     - If content implies steps/methods, use 'process'.
     - Otherwise, use 'grid'.
  4. **Charts:** Identify any numerical data suitable for visualization (e.g. market share, growth stats). Create 1-2 charts if applicable.
  5. **Visuals:** Identify key sections that need an illustration and provide a creative English 'imagePrompt' for them.
  6. **Comparison:** If layout is 'comparison', provide 'comparisonLabels' (e.g. ['Pros', 'Cons']) and split 'sections' evenly (first half Left, second half Right).
  
  Input Text Note:
  ${processedText.substring(0, 6000)}`;

  const parts: any[] = [{ text: textPrompt }];
  
  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  // 1. Generate Text Structure
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: infographicSchema,
      systemInstruction: "You are an expert information designer. Output valid JSON.",
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  const data = JSON.parse(response.text) as InfographicData;
  data.style = style;

  // 2. Generate Images in Parallel for sections that have imagePrompt
  const imagePromises = data.sections.map(async (section) => {
    if (section.imagePrompt) {
      const imageUrl = await generateSectionImage(section.imagePrompt, style, customStylePrompt);
      return { ...section, imageUrl };
    }
    return section;
  });

  data.sections = await Promise.all(imagePromises);

  return data;
};

export const refineInfographicSection = async (
  originalData: InfographicData,
  sectionType: SectionType,
  sectionId: string | null,
  instruction: string
): Promise<InfographicData> => {
  
  const newData = { ...originalData };
  let targetContext = "";
  
  if (sectionType === 'title') targetContext = `Main Title: ${newData.mainTitle}`;
  else if (sectionType === 'subtitle') targetContext = `Subtitle: ${newData.subtitle}`;
  else if (sectionType === 'conclusion') targetContext = `Conclusion: ${newData.conclusion}`;
  else if (sectionType === 'section' && sectionId) {
    const sec = newData.sections.find(s => s.id === sectionId);
    targetContext = JSON.stringify(sec);
  } else if (sectionType === 'statistic' && sectionId) {
    const stat = newData.statistics.find(s => s.id === sectionId);
    targetContext = JSON.stringify(stat);
  }

  const prompt = `Refine this infographic part (Style: ${originalData.style}). 
  Instruction: "${instruction}".
  Current Content: ${targetContext}
  Return JSON with updated fields. Keep Traditional Chinese.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  if (!response.text) throw new Error("Failed to refine content");
  
  const result = JSON.parse(response.text);

  if (sectionType === 'title') newData.mainTitle = result.result || result.mainTitle;
  else if (sectionType === 'subtitle') newData.subtitle = result.result || result.subtitle;
  else if (sectionType === 'conclusion') newData.conclusion = result.result || result.conclusion;
  else if (sectionType === 'section' && sectionId) {
    newData.sections = newData.sections.map(s => s.id === sectionId ? { ...s, ...result, imageUrl: s.imageUrl } : s);
  } else if (sectionType === 'statistic' && sectionId) {
    newData.statistics = newData.statistics.map(s => s.id === sectionId ? { ...s, ...result } : s);
  }

  return newData;
};
