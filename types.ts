
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

export type InfographicStyle = 'professional' | 'comic' | 'digital' | 'watercolor' | 'minimalist';

export type InfographicLayout = 'grid' | 'timeline' | 'process' | 'comparison';

export interface InfographicData {
  mainTitle: string;
  subtitle: string;
  layout: InfographicLayout;
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
