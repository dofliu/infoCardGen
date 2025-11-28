
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

export interface HistoryItem {
  id: string;
  timestamp: number;
  title: string;
  style: InfographicStyle;
  mode: 'layout' | 'image';
  data: InfographicData | null;
  fullImageUrl: string | null;
  // Context to restore inputs
  inputText: string;
  inputUrl: string;
  selectedStyle: InfographicStyle;
  aspectRatio: InfographicAspectRatio;
  customStylePrompt: string;
  customColor: string;
  brandConfig?: BrandConfig;
}

export type SocialPlatform = 'instagram' | 'linkedin' | 'twitter' | 'facebook';
