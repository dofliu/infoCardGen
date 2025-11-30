
export interface InfographicStat {
  id: string;
  value: string;
  label: string;
}

export interface InfographicSection {
  id: string;
  title: string;
  content: string;
  iconType: 'bulb' | 'chart' | 'list' | 'target' | 'warning' | 'info' | 'calendar' | 'check' | 'time';
  imagePrompt?: string; // The prompt used to generate the image
  imageUrl?: string;    // The base64 data URL of the generated image
}

export interface ChartItem {
  label: string;
  value: number;
  color?: string; // Optional hex override
}

export interface InfographicChart {
  id: string;
  title: string;
  type: 'bar' | 'pie';
  data: ChartItem[];
  description?: string;
}

export type InfographicStyle = 'professional' | 'comic' | 'digital' | 'watercolor' | 'minimalist' | 'custom';

export type InfographicLayout = 'grid' | 'timeline' | 'process' | 'comparison';

export type InfographicAspectRatio = 'vertical' | 'horizontal' | 'square';

// NEW: Image Model Selection
export type ImageModelType = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';

export interface InfographicData {
  mainTitle: string;
  subtitle: string;
  layout: InfographicLayout;
  aspectRatio?: InfographicAspectRatio; // New field
  comparisonLabels?: string[]; // [LeftLabel, RightLabel] e.g. ["Advantages", "Disadvantages"]
  sections: InfographicSection[];
  statistics: InfographicStat[];
  charts?: InfographicChart[];
  conclusion: string;
  themeColor: string;
  style: InfographicStyle;
}

export type SectionType = 'title' | 'subtitle' | 'section' | 'statistic' | 'conclusion';

export interface EditRequest {
  sectionId: string | null;
  sectionType: SectionType;
  currentContent: any;
  instruction: string;
}

export interface BrandConfig {
  isEnabled: boolean;
  footerText: string;
  brandColor: string;
  toneOfVoice: string; // e.g. "Professional Academic", "Friendly", "Strict"
}

// --- Presentation Mode Types ---

export type SlideLayout = 
  | 'title_cover'      // Big title, subtitle
  | 'section_header'   // Section divider
  | 'text_and_image'   // Standard content with image
  | 'bullet_list'      // List of points
  | 'big_number'       // Focus on a stat
  | 'quote'            // Big quote
  | 'conclusion';      // Final slide

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  content: string; // Main text or bullet points (separated by newline)
  bulletPoints?: string[]; // Optional parsed array for bullets
  imagePrompt?: string;
  imageUrl?: string;
  speakerNotes: string; // AI generated script for the speaker
  statValue?: string; // For big_number layout
}

export interface PresentationData {
  mainTitle: string;
  subtitle: string;
  slides: Slide[];
  themeColor: string;
  style: InfographicStyle;
}

// ------------------------------

export interface HistoryItem {
  id: string;
  timestamp: number;
  title: string;
  style: InfographicStyle;
  mode: 'layout' | 'image' | 'presentation';
  data: InfographicData | null;
  presentationData?: PresentationData | null; // Store presentation data
  fullImageUrl: string | null;
  // Context to restore inputs
  inputText: string;
  inputUrl: string;
  selectedStyle: InfographicStyle;
  aspectRatio: InfographicAspectRatio;
  customStylePrompt: string;
  customColor: string;
  brandConfig?: BrandConfig;
  imageModel?: ImageModelType; // Added to history
}

export type SocialPlatform = 'instagram' | 'linkedin' | 'twitter' | 'facebook';

export interface FileData {
  mimeType: string;
  data: string;
}
