
import React, { useState, useRef, useEffect } from 'react';
import { generateInfographic, refineInfographicSection, generateFullInfographicImage, transformInfographic, FileData, generateSocialCaption, generatePresentation, refinePresentationSlide, generateComicScript, generateComicImages } from './services/geminiService';
import { InfographicData, SectionType, InfographicStyle, BrandConfig, InfographicAspectRatio, HistoryItem, InfographicSection, SocialPlatform, PresentationData, ImageModelType, Slide, InfographicChart, ComicData, AICost } from './types';
import { InfographicView } from './components/InfographicView';
import { PresentationView } from './components/PresentationView';
import { ComicView } from './components/ComicView';
import { EditModal } from './components/EditModal';
import { SettingsModal } from './components/SettingsModal';
import { HistorySidebar } from './components/HistorySidebar';
import { IconPickerModal } from './components/IconPickerModal';
import { SocialMediaModal } from './components/SocialMediaModal';
import { ChartEditModal } from './components/ChartEditModal';
import { Button } from './components/Button';
import { RefreshCw, Upload, Sparkles, Palette, FileText, Download, Image as ImageIcon, LayoutTemplate, XCircle, FileType, Trash2, Link as LinkIcon, UserCircle, Pencil, RectangleVertical, RectangleHorizontal, Square, History, Save, FolderOpen, Presentation, Wand2, ChevronDown, Languages, TextSelect, Eraser, PlayCircle, Video, BookOpen, Film, LayoutGrid, Info, Code, Terminal, X } from 'lucide-react';
import * as html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { exportToPPTX, exportPresentationToPPTX } from './utils/pptExporter';

// NEW: Prompt Inspector Modal Component
const PromptModal: React.FC<{ isOpen: boolean; onClose: () => void; prompt?: string }> = ({ isOpen, onClose, prompt }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-gray-900 text-green-400 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-green-500/30 flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
        <div className="p-4 border-b border-green-500/20 flex justify-between items-center bg-black/40">
           <div className="flex items-center gap-2">
             <Terminal size={20} />
             <h3 className="font-mono font-bold tracking-tight">AI PROMPT INSPECTOR</h3>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
             <X size={20} />
           </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-green-900">
           <div className="mb-4 text-gray-500">// This is the exact prompt instruction sent to Gemini:</div>
           <pre className="whitespace-pre-wrap break-words opacity-90">{prompt || "No prompt data available."}</pre>
        </div>
        <div className="p-3 border-t border-green-500/20 bg-black/20 flex justify-end">
           <Button variant="outline" onClick={onClose} className="text-xs border-green-500/50 text-green-400 hover:bg-green-500/10">
             Close Console
           </Button>
        </div>
      </div>
    </div>
  );
};

// NEW: Cost Display Component
const CostDisplay: React.FC<{ cost?: AICost }> = ({ cost }) => {
  if (!cost) return null;
  return (
    <div className="group relative inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200 cursor-help">
      <span>💰 Est. Cost: ${cost.totalCost.toFixed(3)}</span>
      <Info size={12} className="opacity-50" />
      
      {/* Tooltip */}
      <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-gray-700">
         <h4 className="font-bold border-b pb-2 mb-2 text-gray-900">Cost Breakdown (USD)</h4>
         <div className="space-y-1 text-xs">
           <div className="flex justify-between">
             <span>Input Text:</span>
             <span>${cost.breakdown.textInput.toFixed(4)}</span>
           </div>
           <div className="flex justify-between">
             <span>Output Text:</span>
             <span>${cost.breakdown.textOutput.toFixed(4)}</span>
           </div>
           <div className="flex justify-between font-semibold text-green-700">
             <span>Images ({cost.breakdown.imageCount}):</span>
             <span>${cost.breakdown.imageGeneration.toFixed(4)}</span>
           </div>
           <div className="text-[10px] text-gray-400 mt-2">
             Model: {cost.breakdown.imageModel.replace('gemini-', '')}
           </div>
         </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<InfographicData | null>(null);
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null);
  const [comicData, setComicData] = useState<ComicData | null>(null); // NEW: Comic State
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [fullImagePrompt, setFullImagePrompt] = useState<string | null>(null); // NEW
  
  // Settings State
  const [selectedStyle, setSelectedStyle] = useState<InfographicStyle>('professional');
  const [aspectRatio, setAspectRatio] = useState<InfographicAspectRatio>('vertical');
  const [customStylePrompt, setCustomStylePrompt] = useState('');
  const [customThemeColor, setCustomThemeColor] = useState<string>('');
  const [mode, setMode] = useState<'layout' | 'image' | 'presentation' | 'comic'>('layout');
  const [imageModel, setImageModel] = useState<ImageModelType>('gemini-2.5-flash-image');
  const [targetSlideCount, setTargetSlideCount] = useState<number>(10);
  const [targetPanelCount, setTargetPanelCount] = useState<number>(4); // NEW: Comic panel count
  
  // Modals State
  const [editingSection, setEditingSection] = useState<{type: SectionType, id: string | null, content: any} | null>(null);
  const [editingIconSectionId, setEditingIconSectionId] = useState<string | null>(null);
  const [editingChart, setEditingChart] = useState<InfographicChart | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  
  // Personal Branding State
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(() => {
    try {
      const saved = localStorage.getItem('infographai_brand_config');
      return saved ? JSON.parse(saved) : {
        isEnabled: false,
        footerText: '',
        brandColor: '#4f46e5',
        toneOfVoice: ''
      };
    } catch (e) {
      return {
        isEnabled: false,
        footerText: '',
        brandColor: '#4f46e5',
        toneOfVoice: ''
      };
    }
  });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('infographai_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Files State
  const [attachedFiles, setAttachedFiles] = useState<{name: string, data: FileData}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const infographicRef = useRef<HTMLDivElement>(null);

  // Motion State
  const [isMotionEnabled, setIsMotionEnabled] = useState(true);

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('infographai_brand_config', JSON.stringify(brandConfig));
    } catch (e) {
      console.error("Failed to save brand config", e);
    }
  }, [brandConfig]);

  useEffect(() => {
    const saveHistorySafe = (items: HistoryItem[]) => {
      try {
        localStorage.setItem('infographai_history', JSON.stringify(items));
      } catch (e: any) {
        // Handle QuotaExceededError
        if (
          e.name === 'QuotaExceededError' ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          e.code === 22 ||
          e.code === 1014
        ) {
          console.warn("LocalStorage quota exceeded. Trimming oldest history item...");
          if (items.length > 0) {
            const trimmed = items.slice(0, -1);
            saveHistorySafe(trimmed);
          } else {
            console.error("Unable to save history: Storage full even with single item.");
          }
        } else {
          console.error("Failed to save history", e);
        }
      }
    };
    saveHistorySafe(history);
  }, [history]);

  const saveToHistory = (
    newData: InfographicData | null, 
    newPresData: PresentationData | null,
    newImageUrl: string | null,
    newComicData: ComicData | null
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      title: newData?.mainTitle || newPresData?.mainTitle || newComicData?.title || "Untitled Project",
      style: selectedStyle,
      mode: mode,
      data: newData,
      presentationData: newPresData,
      comicData: newComicData,
      fullImageUrl: newImageUrl,
      inputText,
      inputUrl,
      selectedStyle,
      aspectRatio,
      customStylePrompt,
      customColor: customThemeColor,
      brandConfig,
      imageModel,
      targetSlideCount,
      targetPanelCount
    };

    setHistory(prev => {
      const newHistory = [newItem, ...prev].slice(0, 5);
      return newHistory;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: {name: string, data: FileData}[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (
        file.name.endsWith('.docx') || 
        file.name.endsWith('.xlsx') || 
        file.name.endsWith('.csv') || 
        file.type === 'text/plain'
      ) {
        try {
          let extractedText = "";
          const arrayBuffer = await file.arrayBuffer();

          if (file.name.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ arrayBuffer });
            extractedText = result.value;
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
            const workbook = XLSX.read(arrayBuffer);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            extractedText = XLSX.utils.sheet_to_csv(worksheet);
          } else if (file.type === 'text/plain') {
            extractedText = await file.text();
          }

          if (extractedText) {
            setInputText(prev => prev + `\n\n--- Content from ${file.name} ---\n` + extractedText);
          }
        } catch (err) {
          console.error("Extraction failed", err);
          alert(`無法讀取檔案 ${file.name}`);
        }
      } 
      else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            newAttachments.push({
              name: file.name,
              data: {
                mimeType: file.type,
                data: base64String
              }
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
          alert("PPT 檔案建議先轉存為 PDF 後再上傳，以獲得最佳解析效果。");
      }
    }
    
    setAttachedFiles(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if ((!inputText && attachedFiles.length === 0 && !inputUrl) || isLoading) return;
    setIsLoading(true);
    setFullImageUrl(null);
    setFullImagePrompt(null);
    setData(null);
    setPresentationData(null);
    setComicData(null);

    const binaryFiles = attachedFiles.map(f => f.data);

    try {
      if (mode === 'image') {
        const result = await generateFullInfographicImage(
          inputText, 
          selectedStyle, 
          binaryFiles, 
          inputUrl,
          brandConfig,
          customStylePrompt,
          aspectRatio
        );
        if (result.imageUrl) {
          setFullImageUrl(result.imageUrl);
          setFullImagePrompt(result.prompt);
          saveToHistory(null, null, result.imageUrl, null);
        }
      } else if (mode === 'presentation') {
        const result = await generatePresentation(
          inputText, 
          selectedStyle, 
          binaryFiles, 
          inputUrl, 
          brandConfig?.isEnabled ? brandConfig.toneOfVoice : undefined, 
          customStylePrompt,
          imageModel,
          targetSlideCount
        );
        setPresentationData(result);
        saveToHistory(null, result, null, null);
      } else if (mode === 'comic') {
        // 1. Generate Script
        const scriptData = await generateComicScript(
           inputText, 
           selectedStyle,
           binaryFiles,
           inputUrl, // Pass URL explicitly
           customStylePrompt,
           targetPanelCount
        );
        // 2. Generate Images with Consistency
        const finalComic = await generateComicImages(scriptData, imageModel, customStylePrompt);
        setComicData(finalComic);
        saveToHistory(null, null, null, finalComic);
      } else {
        // Standard Layout
        const result = await generateInfographic(
          inputText, 
          selectedStyle, 
          binaryFiles, 
          inputUrl,
          brandConfig?.isEnabled ? brandConfig.toneOfVoice : undefined,
          customStylePrompt,
          aspectRatio,
          imageModel
        );
        setData(result);
        saveToHistory(result, null, null, null);
      }
    } catch (error) {
      console.error(error);
      alert("生成失敗，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditConfirm = async (instruction: string) => {
    if (!editingSection) return;
    
    if (mode === 'image' && fullImageUrl) {
      setIsLoading(true);
      setEditingSection(null);
      try {
        const result = await generateFullInfographicImage(
          inputText,
          selectedStyle,
          attachedFiles.map(f => f.data),
          inputUrl,
          brandConfig,
          customStylePrompt,
          aspectRatio,
          instruction
        );
        if (result.imageUrl) {
          setFullImageUrl(result.imageUrl);
          setFullImagePrompt(result.prompt);
          saveToHistory(null, null, result.imageUrl, null);
        }
      } catch (e) {
        alert("修改失敗，請重試。");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'presentation' && presentationData) {
      const slide = presentationData.slides.find(s => s.id === editingSection.id);
      if (slide) {
        setIsLoading(true);
        setEditingSection(null);
        try {
          const updatedSlide = await refinePresentationSlide(
            slide, 
            instruction, 
            presentationData.style, 
            imageModel, 
            customStylePrompt
          );
          
          const newSlides = presentationData.slides.map(s => s.id === slide.id ? updatedSlide : s);
          const newData = { ...presentationData, slides: newSlides };
          setPresentationData(newData);
          saveToHistory(null, newData, null, null);
        } catch (error: any) {
          console.error(error);
          alert(`修改失敗: ${error.message || 'Unknown error'}`);
        } finally {
          setIsLoading(false);
        }
      }
      return;
    }

    if (data) {
      setIsLoading(true);
      setEditingSection(null);
      try {
        const newData = await refineInfographicSection(
          data, 
          editingSection.type, 
          editingSection.id, 
          instruction
        );
        setData(newData);
        saveToHistory(newData, null, null, null);
      } catch (error) {
        console.error(error);
        alert("修改失敗，請稍後再試。");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleImageRefine = () => {
    setEditingSection({
       type: 'section', 
       id: 'full_image_refine', 
       content: 'Current Image'
    });
  };

  const handlePresentationRefine = (slideId: string, currentContent: Slide) => {
    setEditingSection({
      type: 'section', 
      id: slideId,
      content: currentContent
    });
  };

  const handleMagicTransform = async (action: 'translate' | 'remix', detail: string) => {
    if (!data) return;
    setIsLoading(true);
    let instruction = "";
    if (action === 'translate') instruction = `Translate all text to ${detail}.`;
    if (action === 'remix') instruction = detail === 'summarize' ? "Summarize the content to be more concise (50% length)." : "Expand the content with more details and explanations.";

    try {
      const newData = await transformInfographic(data, instruction);
      setData(newData);
      saveToHistory(newData, null, null, null);
    } catch (e) {
      alert("轉換失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialGenerate = async (platform: SocialPlatform) => {
    if (!data) return "";
    return await generateSocialCaption(data, platform);
  };

  const handleIconEdit = (sectionId: string) => {
    setEditingIconSectionId(sectionId);
  };

  const handleIconSelect = (newIcon: string) => {
    if (data && editingIconSectionId) {
      const newSections = data.sections.map(s => 
        s.id === editingIconSectionId ? { ...s, iconType: newIcon as any } : s
      );
      setData({ ...data, sections: newSections });
      setEditingIconSectionId(null);
    }
  };

  const handleChartEdit = (chart: InfographicChart) => {
    setEditingChart(chart);
  };

  const handleChartSave = (updatedChart: InfographicChart) => {
    if (!data) return;
    const currentCharts = data.charts || [];
    const newCharts = currentCharts.map(c => c.id === updatedChart.id ? updatedChart : c);
    
    const newData = { ...data, charts: newCharts };
    setData(newData);
    saveToHistory(newData, null, null, null);
    setEditingChart(null);
  };

  const handleSlideReorder = (newSlides: Slide[]) => {
    if (presentationData) {
      const newData = { ...presentationData, slides: newSlides };
      setPresentationData(newData);
    }
  };
  
  const handleSectionReorder = (newSections: InfographicSection[]) => {
    if (data) {
       setData({ ...data, sections: newSections });
    }
  };

  // NEW: Convert Comic to Presentation
  const handleComicToPresentation = () => {
    if (!comicData) return;
    
    const slides: Slide[] = comicData.panels.map((panel, idx) => ({
      id: panel.id,
      layout: 'text_and_image',
      title: `Panel ${idx + 1}: ${comicData.title}`,
      content: `${panel.dialogue}\n\n[Action]: ${panel.description}`,
      speakerNotes: `In this panel, ${panel.description}. The camera is set to ${panel.cameraDetail}.`,
      imageUrl: panel.imageUrl,
      imagePrompt: panel.imagePrompt
    }));

    // Add cover slide
    slides.unshift({
      id: 'cover',
      layout: 'title_cover',
      title: comicData.title,
      content: comicData.storySummary,
      speakerNotes: `Welcome to the story of ${comicData.title}.`,
      imagePrompt: ''
    });

    const presData: PresentationData = {
      mainTitle: comicData.title,
      subtitle: comicData.storySummary,
      slides: slides,
      themeColor: '#000000',
      style: comicData.style
    };

    setPresentationData(presData);
    setMode('presentation');
    saveToHistory(null, presData, null, comicData); // Save both
  };

  const getTimestampFilename = (prefix: string) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${prefix}_${yyyy}${mm}${dd}${hh}${min}`;
  };

  const handleDownloadPDF = async () => {
    if (infographicRef.current) {
      setIsLoading(true);
      try {
        const canvas = await html2canvas.default(infographicRef.current, {
           scale: 2,
           useCORS: true,
           backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: aspectRatio === 'horizontal' ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${getTimestampFilename('infographic')}.pdf`);
      } catch (e) {
        console.error("PDF export failed", e);
        alert("PDF 匯出失敗");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDownloadPPT = async () => {
    setIsLoading(true);
    try {
      const filename = `${getTimestampFilename(mode === 'presentation' ? 'presentation' : 'infographic')}.pptx`;
      if (mode === 'presentation' && presentationData) {
        await exportPresentationToPPTX(presentationData, filename, brandConfig);
      } else if (data) {
        await exportToPPTX(data, filename, brandConfig);
      }
    } catch (e) {
      console.error(e);
      alert("PPT 匯出失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportProject = () => {
    if (!data && !presentationData && !fullImageUrl && !comicData) return;
    const projectData = {
      version: 1,
      timestamp: Date.now(),
      mode,
      style: selectedStyle,
      data,
      presentationData,
      comicData,
      fullImageUrl,
      brandConfig,
      aspectRatio,
      targetSlideCount,
      targetPanelCount
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getTimestampFilename('project')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (json.mode) setMode(json.mode);
        if (json.style) setSelectedStyle(json.style);
        if (json.data) setData(json.data);
        if (json.presentationData) setPresentationData(json.presentationData);
        if (json.comicData) setComicData(json.comicData);
        if (json.fullImageUrl) setFullImageUrl(json.fullImageUrl);
        if (json.brandConfig) setBrandConfig(json.brandConfig);
        if (json.aspectRatio) setAspectRatio(json.aspectRatio);
        if (json.targetSlideCount) setTargetSlideCount(json.targetSlideCount);
        if (json.targetPanelCount) setTargetPanelCount(json.targetPanelCount);
        alert("專案載入成功！");
      } catch (err) {
        alert("無法讀取專案檔");
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setMode(item.mode);
    setInputText(item.inputText);
    setInputUrl(item.inputUrl);
    setSelectedStyle(item.selectedStyle);
    setAspectRatio(item.aspectRatio);
    setCustomStylePrompt(item.customStylePrompt);
    setData(item.data);
    setPresentationData(item.presentationData || null);
    setComicData(item.comicData || null);
    setFullImageUrl(item.fullImageUrl);
    if (item.brandConfig) setBrandConfig(item.brandConfig);
    if (item.customColor) setCustomThemeColor(item.customColor);
    if (item.imageModel) setImageModel(item.imageModel);
    if (item.targetSlideCount) setTargetSlideCount(item.targetSlideCount);
    if (item.targetPanelCount) setTargetPanelCount(item.targetPanelCount);
    setIsHistoryOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Sparkles size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">InfographAI</span>
            </div>
            <div className="flex items-center gap-3">
              
              {/* COST & PROMPT DISPLAY */}
              {(data || presentationData || comicData || fullImageUrl) && (
                <div className="flex items-center gap-2 mr-2">
                  <CostDisplay cost={data?.costEstimate || presentationData?.costEstimate || comicData?.costEstimate} />
                  
                  {/* PROMPT BUTTON */}
                  <button 
                    onClick={() => setIsPromptModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full text-xs font-bold border border-gray-200 transition-colors"
                  >
                    <Code size={12} />
                    <span>Prompt</span>
                  </button>
                </div>
              )}

              {/* Magic Tools Menu */}
              {(data && mode === 'layout') && (
                 <div className="relative group">
                   <button className="p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-1">
                     <Wand2 size={20} /> <span className="hidden sm:inline text-sm font-medium">Magic</span> <ChevronDown size={14} />
                   </button>
                   <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden hidden group-hover:block animate-in fade-in zoom-in duration-200">
                      <div className="p-2">
                        <div className="text-xs font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">Translate</div>
                        <button onClick={() => handleMagicTransform('translate', 'English')} className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 rounded-lg flex items-center gap-2"><Languages size={14}/> English</button>
                        <button onClick={() => handleMagicTransform('translate', 'Japanese')} className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 rounded-lg flex items-center gap-2"><Languages size={14}/> 日本語</button>
                        <button onClick={() => handleMagicTransform('translate', 'Spanish')} className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 rounded-lg flex items-center gap-2"><Languages size={14}/> Español</button>
                        <div className="border-t my-1"></div>
                        <div className="text-xs font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">Remix Content</div>
                        <button onClick={() => handleMagicTransform('remix', 'summarize')} className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 rounded-lg flex items-center gap-2"><TextSelect size={14}/> Summarize (精簡)</button>
                        <button onClick={() => handleMagicTransform('remix', 'expand')} className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 rounded-lg flex items-center gap-2"><FileText size={14}/> Expand (詳述)</button>
                      </div>
                   </div>
                 </div>
              )}

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                title="個人品牌設定"
              >
                <UserCircle size={20} />
                <span className="hidden sm:inline text-sm font-medium">設定</span>
              </button>
              
              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="歷史紀錄"
              >
                <History size={20} />
              </button>

              <div className="flex gap-2">
                <label className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer" title="匯入專案">
                   <FolderOpen size={20} />
                   <input type="file" accept=".json" onChange={handleImportProject} className="hidden" />
                </label>
                <button onClick={handleExportProject} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="匯出專案">
                   <Save size={20} />
                </button>
              </div>

              {(data || presentationData || fullImageUrl || comicData) && (
                <div className="flex gap-2 ml-2">
                   {mode === 'layout' && (
                     <>
                        <button onClick={() => setIsSocialModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-lg text-sm font-bold transition-colors">
                          Social
                        </button>
                        <Button variant="secondary" onClick={handleDownloadPDF} disabled={isLoading}>
                          <Download size={16} /> 下載 PDF
                        </Button>
                     </>
                   )}
                   {(mode === 'layout' || mode === 'presentation') && (
                      <Button variant="secondary" onClick={handleDownloadPPT} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
                        <Presentation size={16} /> PPT
                      </Button>
                   )}
                   <Button 
                      variant="primary" 
                      onClick={() => { setData(null); setPresentationData(null); setFullImageUrl(null); setComicData(null); setFullImagePrompt(null); }}
                      className="bg-indigo-600"
                    >
                      <Pencil size={16} /> 修改並重新產生
                    </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {!data && !fullImageUrl && !presentationData && !comicData ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                AI 資訊圖表產生器
              </h1>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                將繁雜的文件與數據，瞬間轉換為精美的視覺化圖表、海報、專業簡報或連續漫畫。
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 space-y-6">
              {/* Mode Selection */}
              <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto">
                <button 
                  onClick={() => setMode('layout')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${mode === 'layout' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <LayoutTemplate size={18} /> 標準排版
                </button>
                <button 
                  onClick={() => setMode('image')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${mode === 'image' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <ImageIcon size={18} /> 全圖海報
                </button>
                <button 
                  onClick={() => setMode('presentation')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${mode === 'presentation' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Presentation size={18} /> AI 簡報
                </button>
                <button 
                  onClick={() => setMode('comic')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${mode === 'comic' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <BookOpen size={18} /> 連續漫畫
                </button>
              </div>

              {/* URL Input */}
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <LinkIcon className="text-gray-400" size={18} />
                 </div>
                 <input 
                   type="text"
                   className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                   placeholder="輸入網址 (選填)... AI 將自動讀取並分析網頁內容"
                   value={inputUrl}
                   onChange={(e) => setInputUrl(e.target.value)}
                 />
              </div>

              <textarea
                className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-gray-700 transition-all text-lg"
                placeholder={mode === 'image' ? "描述您想要的海報內容、風格與重點..." : mode === 'comic' ? "描述漫畫劇情、角色與場景 (e.g. 辦公室裡的工程師遇到Bug...)" : "在此貼上文章、數據或筆記..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              {/* File Upload Area */}
              <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.docx,.xlsx,.csv,.txt,.ppt,.pptx" 
                  multiple 
                  onChange={handleFileUpload}
                />
                <div className="bg-indigo-50 p-3 rounded-full mb-3 group-hover:bg-indigo-100 transition-colors">
                  <Upload className="text-indigo-600" size={24} />
                </div>
                <p className="text-sm font-medium text-gray-700">點擊上傳或拖曳檔案至此</p>
                <p className="text-xs text-gray-400 mt-1">支援 PDF, Word, Excel, CSV (多檔支援)</p>
              </div>

              {/* Attached Files List */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-700">
                      <FileType size={14} />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="hover:text-red-500"><XCircle size={14}/></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Style Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Palette size={16} /> 視覺風格 (Visual Style)
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value as InfographicStyle)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="professional">🏢 專業商務 (Professional)</option>
                      <option value="comic">💥 美式漫畫 (Comic)</option>
                      <option value="digital">🔮 數位科技 (Digital)</option>
                      <option value="watercolor">🎨 水彩藝術 (Watercolor)</option>
                      <option value="minimalist">⚪ 極簡主義 (Minimalist)</option>
                      <option value="custom">✨ 自訂風格 (Custom)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                  
                  {/* Custom Style Input */}
                  {selectedStyle === 'custom' && (
                    <div className="mt-3 space-y-2">
                      <input 
                        type="text"
                        placeholder="描述您想要的風格 (e.g. Cyberpunk, Pixel Art)..."
                        className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={customStylePrompt}
                        onChange={(e) => setCustomStylePrompt(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        {['Cyberpunk', 'Pixel Art', 'Ukiyo-e', 'Low Poly', 'Manga', 'Studio Ghibli'].map(style => (
                          <button 
                            key={style}
                            onClick={() => setCustomStylePrompt(style)}
                            className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full hover:bg-indigo-100"
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Aspect Ratio / Slide Controls */}
                <div>
                   {mode === 'presentation' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                           <div className="flex items-center gap-2"><LayoutTemplate size={16} /> 投影片頁數</div>
                           <span className="text-indigo-600 font-bold">{targetSlideCount} 頁</span>
                        </label>
                        <input 
                          type="range" 
                          min="5" 
                          max="30" 
                          step="1"
                          value={targetSlideCount}
                          onChange={(e) => setTargetSlideCount(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-xs text-gray-500 mt-1 flex justify-between">
                          <span>精簡 (5)</span>
                          {targetSlideCount > 20 && <span className="text-orange-500">頁數較多可能需較長生成時間</span>}
                          <span>詳盡 (30)</span>
                        </p>
                      </div>
                   ) : mode === 'comic' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                           <div className="flex items-center gap-2"><LayoutGrid size={16} /> 漫畫格數 (Panels)</div>
                        </label>
                        <div className="flex gap-2">
                           <button onClick={() => setTargetPanelCount(4)} className={`flex-1 py-2 border rounded-lg ${targetPanelCount === 4 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'hover:bg-gray-50'}`}>4格</button>
                           <button onClick={() => setTargetPanelCount(8)} className={`flex-1 py-2 border rounded-lg ${targetPanelCount === 8 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'hover:bg-gray-50'}`}>8格</button>
                           <button onClick={() => setTargetPanelCount(16)} className={`flex-1 py-2 border rounded-lg ${targetPanelCount === 16 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'hover:bg-gray-50'}`}>16格</button>
                        </div>
                      </div>
                   ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <LayoutTemplate size={16} /> 版面比例 (Aspect Ratio)
                        </label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setAspectRatio('vertical')}
                            className={`flex-1 py-2 px-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${aspectRatio === 'vertical' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                          >
                            <RectangleVertical size={20} />
                            <span className="text-xs">Vertical</span>
                          </button>
                          <button 
                            onClick={() => setAspectRatio('horizontal')}
                            className={`flex-1 py-2 px-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${aspectRatio === 'horizontal' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                          >
                            <RectangleHorizontal size={20} />
                            <span className="text-xs">Horizontal</span>
                          </button>
                          <button 
                            onClick={() => setAspectRatio('square')}
                            className={`flex-1 py-2 px-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${aspectRatio === 'square' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                          >
                            <Square size={20} />
                            <span className="text-xs">Square</span>
                          </button>
                        </div>
                      </div>
                   )}
                   
                   {/* Advanced: Image Model Selector */}
                   <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <ImageIcon size={14} /> 圖片生成模型 (Image Model)
                      </label>
                      <select 
                        value={imageModel}
                        onChange={(e) => setImageModel(e.target.value as ImageModelType)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                         <option value="gemini-2.5-flash-image">⚡ Gemini 2.5 Flash (快速/免費)</option>
                         <option value="gemini-3-pro-image-preview">🚀 Gemini 3 Pro (高畫質/Pro)</option>
                      </select>
                   </div>
                </div>

                {/* Custom Color (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Palette size={16} /> 自訂主題色 (選填)
                  </label>
                   <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <input
                        type="color"
                        className="h-8 w-8 rounded cursor-pointer border-none bg-transparent"
                        value={customThemeColor || '#4f46e5'}
                        onChange={(e) => setCustomThemeColor(e.target.value)}
                      />
                      <span className="text-sm text-gray-500 font-mono">{customThemeColor || 'Default (AI)'}</span>
                      {customThemeColor && (
                        <button onClick={() => setCustomThemeColor('')} className="ml-auto text-xs text-red-500 hover:underline">Reset</button>
                      )}
                   </div>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                isLoading={isLoading} 
                className="w-full py-4 text-lg font-bold shadow-indigo-200"
                disabled={(!inputText && attachedFiles.length === 0 && !inputUrl)}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="animate-spin" /> AI 正在分析與生成中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles size={20} /> 立即產生 (Generate)
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-300">
            {/* Toolbar for Motion Toggle */}
            {mode === 'layout' && (
              <div className="mb-4 flex justify-end items-center gap-4">
                 <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      {isMotionEnabled ? <PlayCircle size={14} className="text-green-500"/> : <Video size={14} className="text-gray-400"/>}
                      Animation
                    </span>
                    <button 
                      onClick={() => setIsMotionEnabled(!isMotionEnabled)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${isMotionEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                       <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${isMotionEnabled ? 'left-4.5' : 'left-0.5'}`} style={{ left: isMotionEnabled ? '18px' : '2px' }}></div>
                    </button>
                 </div>
              </div>
            )}

            {mode === 'image' && fullImageUrl ? (
               <div className="flex flex-col items-center">
                  <div className="relative group max-w-full shadow-2xl rounded-lg overflow-hidden">
                    <img src={fullImageUrl} alt="Generated Infographic" className="max-w-full h-auto" />
                    
                    {/* Refine Overlay */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={handleImageRefine}
                        className="bg-white/90 text-indigo-600 px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-white"
                      >
                         <Wand2 size={16} /> 修正圖片 (Refine)
                      </button>
                    </div>
                  </div>
                  <a 
                    href={fullImageUrl} 
                    download={`poster_${Date.now()}.png`}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg"
                  >
                    <Download size={20} /> 下載圖片 (Download PNG)
                  </a>
               </div>
            ) : mode === 'presentation' && presentationData ? (
               <PresentationView 
                  data={presentationData} 
                  onRefine={handlePresentationRefine}
                  onReorder={handleSlideReorder}
               />
            ) : mode === 'comic' && comicData ? (
               <ComicView 
                  data={comicData}
                  onConvertToSlides={handleComicToPresentation}
               />
            ) : data ? (
              <div ref={infographicRef}>
                <InfographicView 
                  data={data} 
                  onEdit={(type, id, content) => setEditingSection({type, id, content})} 
                  onIconEdit={handleIconEdit}
                  onReorder={handleSectionReorder}
                  onChartEdit={handleChartEdit}
                  customThemeColor={customThemeColor}
                  brandConfig={brandConfig}
                  isMotionEnabled={isMotionEnabled}
                />
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Modals */}
      <EditModal 
        isOpen={!!editingSection} 
        onClose={() => setEditingSection(null)} 
        onConfirm={handleEditConfirm}
        isLoading={isLoading}
        sectionLabel={editingSection?.type === 'title' ? '主要標題' : editingSection?.type === 'subtitle' ? '副標題' : editingSection?.type === 'conclusion' ? '結語' : '內容區塊'}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={brandConfig}
        onSave={setBrandConfig}
      />

      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoad={loadHistoryItem}
        onDelete={(id) => setHistory(h => h.filter(i => i.id !== id))}
        onClear={() => setHistory([])}
      />

      <IconPickerModal 
        isOpen={!!editingIconSectionId}
        onClose={() => setEditingIconSectionId(null)}
        onSelect={handleIconSelect}
      />

      <SocialMediaModal 
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        onGenerate={handleSocialGenerate}
      />

      <ChartEditModal
        isOpen={!!editingChart}
        onClose={() => setEditingChart(null)}
        chart={editingChart}
        onSave={handleChartSave}
      />

      <PromptModal 
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        prompt={data?.promptUsed || presentationData?.promptUsed || comicData?.promptUsed || fullImagePrompt || undefined}
      />

    </div>
  );
};

export default App;
