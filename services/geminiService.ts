
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InfographicData, SectionType, InfographicStyle, InfographicSection, BrandConfig, InfographicAspectRatio, SocialPlatform, PresentationData, FileData, ImageModelType, Slide } from "../types";

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

const presentationSchema: Schema = {
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

const generateSectionImage = async (
  prompt: string, 
  style: InfographicStyle, 
  modelName: ImageModelType = 'gemini-2.5-flash-image', // Default to basic
  customStylePrompt?: string
): Promise<string | undefined> => {
  const stylePrompts = {
    professional: "flat vector illustration, corporate memphis style, clean, blue and teal tones, white background, professional business art, minimalist details, high quality",
    comic: "comic book style illustration, bold outlines, vibrant colors, pop art, dynamic action, halftone patterns, graphic novel style",
    digital: "futuristic digital art, neon glowing lines, cyberpunk aesthetic, dark background, 3d render, tech visualization, data stream visuals",
    watercolor: "watercolor painting, soft brush strokes, pastel colors, artistic, white paper texture background, dreamy, hand-painted",
    minimalist: "minimalist line art, black and white, simple shapes, negative space, iconographic style, sophisticated",
    custom: customStylePrompt ? `${customStylePrompt}, artistic visualization, high quality` : "high quality unique artistic style illustration"
  };

  const fullPrompt = `${prompt}. Style: ${stylePrompts[style]}. No text in image.`;

  const config: any = {};
  
  // Apply specific configs for the advanced model to ensure good aspect ratio
  if (modelName === 'gemini-3-pro-image-preview') {
    config.imageConfig = {
      aspectRatio: '16:9',
      imageSize: '1K'
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: fullPrompt }]
      },
      config: config
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

export { FileData };

// NEW: Generate a full single-page infographic image
export const generateFullInfographicImage = async (
  text: string, 
  style: InfographicStyle,
  files: FileData[] = [],
  url?: string,
  brandConfig?: BrandConfig,
  customStylePrompt?: string,
  aspectRatio: InfographicAspectRatio = 'vertical',
  refinementInstruction?: string // NEW: Instruction to fix the image
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

  // Map InfographicAspectRatio to API values and descriptive text
  const ratioConfig = {
    'vertical': { apiValue: '3:4', desc: 'Vertical Poster' },
    'horizontal': { apiValue: '16:9', desc: 'Horizontal Presentation Slide' },
    'square': { apiValue: '1:1', desc: 'Square Social Media Post' }
  };
  
  const currentRatio = ratioConfig[aspectRatio];

  let correctionHeader = "";
  if (refinementInstruction) {
    correctionHeader = `
    *** CRITICAL CORRECTION INSTRUCTION ***
    The user is asking to RE-GENERATE this image with the following specific correction. 
    You MUST prioritize this instruction over original content if they conflict:
    "${refinementInstruction}"
    *****************************************
    `;
  }

  const promptText = `Create a high-quality, single-page ${currentRatio.desc} infographic in Traditional Chinese (Taiwan) based on the provided content.
  
  ${correctionHeader}
  ${styleDescription}
  ${brandingInstructions}
  
  Requirements:
  - The image should look like a professional ${currentRatio.desc}.
  - Aspect Ratio Target: ${currentRatio.apiValue}.
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
          aspectRatio: currentRatio.apiValue, 
          imageSize: '2K' 
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
  toneOfVoice?: string, 
  customStylePrompt?: string,
  aspectRatio: InfographicAspectRatio = 'vertical',
  imageModel: ImageModelType = 'gemini-2.5-flash-image'
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

  let layoutHint = "";
  if (aspectRatio === 'horizontal') {
    layoutHint = "The user wants a Horizontal (Landscape) layout. Structure content to fit a wide format, potentially using more columns (e.g. 3 columns) for sections.";
  } else if (aspectRatio === 'square') {
    layoutHint = "The user wants a Square layout. Structure content to be compact and centered.";
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
     - ${layoutHint}
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
  data.aspectRatio = aspectRatio; // Store the requested ratio in data

  // 2. Generate Images in Parallel for sections that have imagePrompt
  const imagePromises = data.sections.map(async (section) => {
    if (section.imagePrompt) {
      // Pass the selected image model here
      const imageUrl = await generateSectionImage(section.imagePrompt, style, imageModel, customStylePrompt);
      return { ...section, imageUrl };
    }
    return section;
  });

  data.sections = await Promise.all(imagePromises);

  return data;
};

// NEW: Generate Presentation Data
export const generatePresentation = async (
  text: string, 
  style: InfographicStyle,
  files: FileData[] = [],
  url?: string,
  toneOfVoice?: string, 
  customStylePrompt?: string,
  imageModel: ImageModelType = 'gemini-3-pro-image-preview', // Default to high quality for presentations
  targetSlideCount: number = 10 // Default to 10
): Promise<PresentationData> => {
  let processedText = text;

  if (url) {
    const urlSummary = await summarizeUrlContent(url);
    processedText += `\n\n[External URL Content Summary (${url})]:\n${urlSummary}`;
  }

  const styleInstructions = {
    professional: "Tone: Professional, Corporate. Theme: Deep Blue/Navy.",
    comic: "Tone: Energetic, Fun. Theme: Yellow/Black.",
    digital: "Tone: Tech, Futuristic. Theme: Dark Mode Green.",
    watercolor: "Tone: Soft, Artistic. Theme: Pastel.",
    minimalist: "Tone: Concise, Clean. Theme: White/Gray.",
    custom: `Tone: Match this style: "${customStylePrompt}".`
  };
  
  // Logic to handle high slide counts (concise mode to fit in context window)
  let conciseInstruction = "";
  if (targetSlideCount > 20) {
    conciseInstruction = "IMPORTANT: Since the target slide count is high, keep the 'content' for each slide CONCISE and brief to ensure the JSON output does not get truncated. Do not write long paragraphs.";
  }

  const textPrompt = `Act as a professional Presentation Designer. 
  Create a slide deck plan based on the content provided.
  
  **Requirements:**
  1. **Language:** Traditional Chinese (Taiwan).
  2. **Structure:** Create approximately ${targetSlideCount} slides. Start with a Title Cover, end with a Conclusion.
  3. **Layouts:** Assign appropriate layouts. IMPORTANT: For complex content like tables, SOP flows, system architecture, or multi-curve graphs that are hard to format as text, USE 'diagram_image' layout. For stats use 'big_number'.
  4. **Speaker Notes:** Write a natural script for the speaker for EVERY slide.
  5. **Visuals:** For 'text_and_image', 'title_cover' OR 'diagram_image', provide an English 'imagePrompt'.
     - For 'diagram_image': The prompt must describe the chart/table/diagram in extreme detail so an AI image generator can draw it perfectly.
  6. **Style:** ${styleInstructions[style]}
  ${conciseInstruction}
  
  Content:
  ${processedText.substring(0, 10000)}
  `;

  const parts: any[] = [{ text: textPrompt }];
  files.forEach(file => {
    parts.push({
      inlineData: { mimeType: file.mimeType, data: file.data }
    });
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: presentationSchema
    },
  });

  if (!response.text) throw new Error("No response from Gemini");

  const data = JSON.parse(response.text) as PresentationData;
  data.style = style;

  // Generate Images for slides
  const slidePromises = data.slides.map(async (slide) => {
    if (slide.imagePrompt) {
      // Pass selected image model
      const imageUrl = await generateSectionImage(slide.imagePrompt, style, imageModel, customStylePrompt);
      return { ...slide, imageUrl };
    }
    return slide;
  });

  data.slides = await Promise.all(slidePromises);

  return data;
};

// NEW: Refine a specific slide in presentation mode
export const refinePresentationSlide = async (
  slide: Slide,
  instruction: string,
  style: InfographicStyle,
  imageModel: ImageModelType,
  customStylePrompt?: string
): Promise<Slide> => {
  
  // 1. Ask Gemini to update the JSON structure of the slide based on instruction
  const prompt = `
  Act as a Presentation Designer. Refine this slide based on the user's instruction.
  
  Instruction: "${instruction}"
  Current Slide JSON: ${JSON.stringify(slide)}
  Style: ${style}
  
  Rules:
  1. Return the updated Slide JSON.
  2. If the instruction implies a visual change (e.g. "change diagram to flow chart", "make the robot blue"), UPDATE the 'imagePrompt' field to reflect this new visual requirement.
  3. If the instruction implies text change, update 'title', 'content', or 'speakerNotes'.
  4. **IMPORTANT**: 'content' field MUST be a single String (if multiple points, separate by newlines). Do NOT return an Array.
  5. Keep 'id' and 'layout' unchanged unless instructed otherwise.
  6. Language: Traditional Chinese (Taiwan).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  if (!response.text) throw new Error("Refinement failed");
  const updatedSlide = JSON.parse(response.text) as Slide;

  // SAFETY: Ensure content is a string
  if (Array.isArray(updatedSlide.content)) {
    updatedSlide.content = (updatedSlide.content as any).join('\n');
  }
  updatedSlide.content = String(updatedSlide.content || '');

  // 2. Check if imagePrompt has changed. If so, regenerate the image.
  // We compare with original slide.imagePrompt
  if (updatedSlide.imagePrompt && updatedSlide.imagePrompt !== slide.imagePrompt) {
     const newImageUrl = await generateSectionImage(updatedSlide.imagePrompt, style, imageModel, customStylePrompt);
     updatedSlide.imageUrl = newImageUrl;
  } else {
    // Keep existing image if prompt didn't change
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

// NEW: Transform the entire infographic content (Translate, Summarize, Expand)
export const transformInfographic = async (
  currentData: InfographicData,
  instruction: string
): Promise<InfographicData> => {
  
  // Create a lightweight version of data to reduce token count (exclude images/base64)
  const dataForPrompt = {
    ...currentData,
    sections: currentData.sections.map(({ imageUrl, ...rest }) => rest), // Remove images
    charts: currentData.charts // Include charts
  };

  const prompt = `
  Act as an expert content editor.
  
  Goal: Transform the following JSON content based on this instruction: "${instruction}".
  
  Rules:
  1. PRESERVE the exact JSON structure (mainTitle, subtitle, sections, etc.).
  2. ONLY modify the text values (content, titles, labels) based on the instruction.
  3. Do NOT translate technical keys (id, iconType, layout, style).
  4. Ensure the output is valid JSON.
  
  Input JSON:
  ${JSON.stringify(dataForPrompt)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: infographicSchema
      }
    });

    if (!response.text) throw new Error("Transformation failed");
    
    const transformedData = JSON.parse(response.text) as InfographicData;
    
    // Merge back the images from the original data
    const mergedSections = transformedData.sections.map(newSec => {
      const originalSec = currentData.sections.find(s => s.id === newSec.id);
      return {
        ...newSec,
        imageUrl: originalSec?.imageUrl || undefined
      };
    });

    return {
      ...transformedData,
      style: currentData.style, // Preserve style
      themeColor: currentData.themeColor, // Preserve color
      sections: mergedSections
    };

  } catch (e) {
    console.error("Transformation error", e);
    throw e;
  }
};

// NEW: Generate social media captions
export const generateSocialCaption = async (
  data: InfographicData,
  platform: SocialPlatform
): Promise<string> => {
  
  // Lightweight data summary for prompt
  const summary = {
    title: data.mainTitle,
    subtitle: data.subtitle,
    keyPoints: data.sections.map(s => s.title),
    stats: data.statistics.map(s => `${s.label}: ${s.value}`),
    conclusion: data.conclusion
  };

  const platformInstructions = {
    instagram: "Write a catchy caption for Instagram. Use 10-15 relevant hashtags. Be engaging and visual. Include emojis.",
    linkedin: "Write a professional post for LinkedIn. Focus on industry insights, key takeaways, and engagement. Use a few professional hashtags.",
    twitter: "Write a thread of 3 short tweets or a single impactful tweet (max 280 chars). Focus on the hook and value.",
    facebook: "Write an engaging post for Facebook. Encourage sharing and discussion. Tone should be friendly yet informative."
  };

  const prompt = `
  Act as a social media expert.
  Write a caption for ${platform} based on this infographic data.
  
  Platform Rule: ${platformInstructions[platform]}
  Language: Traditional Chinese (Taiwan).
  
  Data:
  ${JSON.stringify(summary)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "Failed to generate caption.";
  } catch (e) {
    console.error("Caption generation failed", e);
    return "Error generating caption.";
  }
};
