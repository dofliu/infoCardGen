
import React, { useState, useRef, useEffect } from 'react';
import { generateInfographic, refineInfographicSection, generateFullInfographicImage, transformInfographic, FileData, generateSocialCaption, generatePresentation } from './services/geminiService';
import { InfographicData, SectionType, InfographicStyle, BrandConfig, InfographicAspectRatio, HistoryItem, InfographicSection, SocialPlatform, PresentationData, ImageModelType } from './types';
import { InfographicView } from './components/InfographicView';
import { PresentationView } from './components/PresentationView';
import { EditModal } from './components/EditModal';
import { SettingsModal } from './components/SettingsModal';
import { HistorySidebar } from './components/HistorySidebar';
import { IconPickerModal } from './components/IconPickerModal';
import { SocialMediaModal } from './components/SocialMediaModal';
import { Button } from './components/Button';
import { RefreshCw, Upload, Sparkles, Palette, FileText, Download, Image as ImageIcon, LayoutTemplate, XCircle, FileType, Trash2, Link as LinkIcon, UserCircle, Pencil, RectangleVertical, RectangleHorizontal, Square, History, Save, FolderOpen, Presentation, Wand2, ChevronDown, Languages, TextSelect, Eraser, PlayCircle, Share2, MonitorPlay, Zap } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { exportToPPTX, exportPresentationToPPTX } from './utils/pptExporter';

// Define a type for files kept as attachments (like PDFs)
interface AttachedFile extends FileData {
  id: string;
  name: string;
}

// Helper to get formatted timestamp yyyymmddhhmm
const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}`;
};

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPPTExporting, setIsPPTExporting] = useState(false);
  const [isMagicTransforming, setIsMagicTransforming] = useState(false);
  
  const [data, setData] = useState<InfographicData | null>(null);
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  
  const [selectedStyle, setSelectedStyle] = useState<InfographicStyle>('professional');
  const [aspectRatio, setAspectRatio] = useState<InfographicAspectRatio>('vertical');
  
  // NEW: Image Model Selection
  const [imageModel, setImageModel] = useState<ImageModelType>('gemini-3-pro-image-preview');

  const [customStylePrompt, setCustomStylePrompt] = useState<string>(''); // For Infinite Style Lab
  const [customColor, setCustomColor] = useState<string>(''); // For user overrides

  // Personal Branding Config
  const [brandConfig, setBrandConfig] = useState<BrandConfig>({
    isEnabled: false,
    footerText: '',
    brandColor: '#4f46e5',
    toneOfVoice: ''
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Icon Picker
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [editingIconSectionId, setEditingIconSectionId] = useState<string | null>(null);

  // Social Media Kit
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  // History & Persistence
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Motion & Animation
  const [isMotionEnabled, setIsMotionEnabled] = useState(false);

  const [mode, setMode] = useState<'layout' | 'image' | 'presentation'>('layout');
  
  const infographicRef = useRef<HTMLDivElement>(null);
  
  // Edit & Refine Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // For standard layout editing
  const [editingSection, setEditingSection] = useState<{type: SectionType, id: string | null, content: any} | null>(null);
  // For full image editing/regenerating
  const [isImageRefineMode, setIsImageRefineMode] = useState(false);
  
  const [isRefining, setIsRefining] = useState(false);

  // Load Brand Config & History from Local Storage on Mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('infographai_brand_config');
    if (savedConfig) {
      try {
        setBrandConfig(JSON.parse(savedConfig));
      } catch (e) { console.error("Failed to load brand config", e); }
    }

    const savedHistory = localStorage.getItem('infographai_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) { console.error("Failed to load history", e); }
    }
  }, []);

  const handleSaveBrandConfig = (newConfig: BrandConfig) => {
    setBrandConfig(newConfig);
    localStorage.setItem('infographai_brand_config', JSON.stringify(newConfig));
  };

  const saveToHistory = (
    resultData: InfographicData | null, 
    resultImage: string | null,
    resultPresentation: PresentationData | null,
    currentMode: 'layout' | 'image' | 'presentation'
  ) => {
    const title = resultData?.mainTitle || resultPresentation?.mainTitle || "Untitled Project";
    
    // Create history item
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      title: title.length > 30 ? title.substring(0, 30) + '...' : title,
      style: selectedStyle,
      mode: currentMode,
      data: resultData,
      presentationData: resultPresentation,
      fullImageUrl: resultImage,
      // Context inputs
      inputText,
      inputUrl,
      selectedStyle,
      aspectRatio,
      customStylePrompt,
      customColor,
      brandConfig,
      imageModel // Save chosen model
    };

    setHistory(prev => {
      // Limit to 10 items to prevent Quota Exceeded
      const updated = [newItem, ...prev].slice(0, 10);
      try {
        localStorage.setItem('infographai_history', JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage quota exceeded. Could not save history to localStorage.", e);
        // Fallback: Remove oldest item and try again, or just don't save to storage
      }
      return updated;
    });
  };

  const handleLoadHistory = (item: HistoryItem) => {
    // Restore state
    setInputText(item.inputText || '');
    setInputUrl(item.inputUrl || '');
    setSelectedStyle(item.selectedStyle || 'professional');
    setAspectRatio(item.aspectRatio || 'vertical');
    setCustomStylePrompt(item.customStylePrompt || '');
    setCustomColor(item.customColor || '');
    setMode(item.mode || 'layout');
    if (item.imageModel) setImageModel(item.imageModel);
    if (item.brandConfig) setBrandConfig(item.brandConfig);
    
    // Restore result
    setData(item.data);
    setPresentationData(item.presentationData || null);
    setFullImageUrl(item.fullImageUrl);
    
    setIsHistoryOpen(false);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('infographai_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    if(confirm("確定要清空所有歷史紀錄嗎？")) {
      setHistory([]);
      localStorage.removeItem('infographai_history');
    }
  };

  const handleExportProject = () => {
    const projectState = {
      version: "1.0",
      timestamp: Date.now(),
      state: {
        inputText, inputUrl, selectedStyle, aspectRatio, customStylePrompt, customColor, mode, brandConfig, imageModel,
        data, presentationData, fullImageUrl
      }
    };
    
    const blob = new Blob([JSON.stringify(projectState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use timestamp for project export
    a.download = `infographai-project-${getTimestamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if(json.state) {
          const s = json.state;
          // Restore everything
          setInputText(s.inputText || '');
          setInputUrl(s.inputUrl || '');
          setSelectedStyle(s.selectedStyle || 'professional');
          setAspectRatio(s.aspectRatio || 'vertical');
          setCustomStylePrompt(s.customStylePrompt || '');
          setCustomColor(s.customColor || '');
          setMode(s.mode || 'layout');
          if (s.imageModel) setImageModel(s.imageModel);
          if (s.brandConfig) setBrandConfig(s.brandConfig);
          setData(s.data || null);
          setPresentationData(s.presentationData || null);
          setFullImageUrl(s.fullImageUrl || null);
          
          alert("專案匯入成功！");
        } else {
          throw new Error("Invalid project file structure");
        }
      } catch(e) {
        console.error(e);
        alert("匯入失敗：檔案格式錯誤或已損毀。");
      } finally {
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    const newAttachedFiles: AttachedFile[] = [];
    let extractedTextAccumulator = "";
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      try {
        if (fileExtension === 'pdf') {
          const base64 = await readFileAsBase64(file);
          newAttachedFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            mimeType: 'application/pdf',
            data: base64
          });
        } 
        else if (fileExtension === 'docx') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedTextAccumulator += `\n\n[File: ${file.name}]\n${result.value}`;
        } 
        else if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer);
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet);
          extractedTextAccumulator += `\n\n[File: ${file.name}]\n${csvText}`;
        }
        else if (['txt', 'md', 'json'].includes(fileExtension || '')) {
          const text = await readFileAsText(file);
          extractedTextAccumulator += `\n\n[File: ${file.name}]\n${text}`;
        }
        else if (['ppt', 'pptx'].includes(fileExtension || '')) {
          alert(`檔案 ${file.name}: PPT 建議先轉存為 PDF 後再上傳，效果最佳。`);
        }
        else {
          alert(`檔案 ${file.name}: 不支援的格式。請上傳 PDF, Word, Excel, CSV 或純文字。`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        alert(`處理檔案 ${file.name} 時發生錯誤`);
      }
    }

    if (extractedTextAccumulator) {
      setInputText(prev => prev + extractedTextAccumulator);
    }
    if (newAttachedFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...newAttachedFiles]);
    }
    
    setIsLoading(false);
    e.target.value = '';
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleGenerate = async () => {
    if (!inputText.trim() && attachedFiles.length === 0 && !inputUrl.trim()) return;
    
    if (selectedStyle === 'custom' && !customStylePrompt.trim()) {
      alert("請輸入您想要的風格描述 (Custom Style Description)");
      return;
    }

    setIsLoading(true);
    
    const serviceFiles = attachedFiles.map(f => ({
      mimeType: f.mimeType,
      data: f.data
    }));

    try {
      if (imageModel === 'gemini-3-pro-image-preview') {
         const apiKey = await window.aistudio?.hasSelectedApiKey();
         if (!apiKey) await window.aistudio?.openSelectKey();
      }

      if (mode === 'layout') {
        const tone = brandConfig.isEnabled ? brandConfig.toneOfVoice : undefined;
        
        const result = await generateInfographic(
          inputText, 
          selectedStyle, 
          serviceFiles, 
          inputUrl, 
          tone,
          customStylePrompt,
          aspectRatio,
          imageModel // Pass selected image model
        );
        setData(result);
        setPresentationData(null);
        setFullImageUrl(null);
        saveToHistory(result, null, null, 'layout');

      } else if (mode === 'presentation') {
        const tone = brandConfig.isEnabled ? brandConfig.toneOfVoice : undefined;

        const result = await generatePresentation(
          inputText, 
          selectedStyle, 
          serviceFiles, 
          inputUrl, 
          tone,
          customStylePrompt,
          imageModel // Pass selected image model
        );
        setPresentationData(result);
        setData(null);
        setFullImageUrl(null);
        saveToHistory(null, null, result, 'presentation');

      } else { // mode === 'image'
        // Full Image mode always uses Pro 3 internally for text layout, so we ignore imageModel selector here for the main generation, 
        // but user must have API key anyway.
        const apiKey = await window.aistudio?.hasSelectedApiKey();
        if (!apiKey) {
           await window.aistudio?.openSelectKey();
        }
        const imageUrl = await generateFullInfographicImage(
          inputText, 
          selectedStyle, 
          serviceFiles, 
          inputUrl, 
          brandConfig,
          customStylePrompt,
          aspectRatio
        );
        if (imageUrl) {
          setFullImageUrl(imageUrl);
          setData(null);
          setPresentationData(null);
          saveToHistory(null, imageUrl, null, 'image');
        } else {
          throw new Error("No image returned");
        }
      }
    } catch (error) {
      console.error("Generation failed", error);
      alert("產生失敗。請檢查網路或 API 限制 (Pro 模型需付費 API Key)。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!infographicRef.current) return;
    
    setIsExporting(true);
    try {
      // Temporarily disable motion/transforms for clean capture if needed
      // but html2canvas captures current state
      const canvas = await html2canvas(infographicRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (element) => element.hasAttribute('data-html2canvas-ignore')
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const isLandscape = aspectRatio === 'horizontal';
      const orientation = isLandscape ? 'landscape' : 'portrait';
      
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      // Use timestamp for PDF download
      const safeTitle = (data?.mainTitle || 'infographic').replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
      pdf.save(`${safeTitle}_${getTimestamp()}.pdf`);
      
    } catch (error) {
      console.error("PDF export failed", error);
      alert("匯出 PDF 失敗，請稍後再試。");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPPT = async () => {
    if (!data && !presentationData) return;
    setIsPPTExporting(true);
    try {
      const safeTitle = (data?.mainTitle || presentationData?.mainTitle || 'infographic').replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
      const filename = `${safeTitle}_${getTimestamp()}.pptx`;
      
      if (mode === 'presentation' && presentationData) {
        await exportPresentationToPPTX(presentationData, filename, brandConfig);
      } else if (data) {
        await exportToPPTX(data, filename, brandConfig);
      }
    } catch (error) {
      console.error("PPT export failed", error);
      alert("匯出 PowerPoint 失敗，請稍後再試。");
    } finally {
      setIsPPTExporting(false);
    }
  };
  
  const handleDownloadFullImage = () => {
    if (!fullImageUrl) return;
    const link = document.createElement('a');
    link.href = fullImageUrl;
    // Use timestamp for Image download
    link.download = `infographic_${getTimestamp()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = (type: SectionType, id: string | null, currentContent: any) => {
    setEditingSection({ type, id, content: currentContent });
    setIsImageRefineMode(false);
    setIsEditModalOpen(true);
  };

  // Image Refine Click Handler
  const handleImageRefineClick = () => {
    setIsImageRefineMode(true);
    setIsEditModalOpen(true);
  };

  // Icon Editing Handlers
  const handleIconEditClick = (sectionId: string, currentIcon: string) => {
    setEditingIconSectionId(sectionId);
    setIsIconPickerOpen(true);
  };

  const handleIconSelect = (newIconType: string) => {
    if (!data || !editingIconSectionId) return;

    // Update local state directly for instant feedback
    const updatedSections = data.sections.map(s => 
      s.id === editingIconSectionId ? { ...s, iconType: newIconType as any } : s
    );
    
    const updatedData = { ...data, sections: updatedSections };
    setData(updatedData);
    setIsIconPickerOpen(false);
    setEditingIconSectionId(null);
  };

  // Reorder Handler (Drag & Drop)
  const handleReorder = (newSections: InfographicSection[]) => {
    if (!data) return;
    setData({ ...data, sections: newSections });
  };

  // Social Media Generator
  const handleSocialGenerate = async (platform: SocialPlatform) => {
    if (!data) return "";
    return await generateSocialCaption(data, platform);
  };

  // Magic Tools Handlers
  const handleMagicTransform = async (instruction: string) => {
    if (!data) return;
    
    setIsMagicTransforming(true);
    try {
      const newData = await transformInfographic(data, instruction);
      setData(newData);
    } catch (error) {
      console.error("Magic transform failed", error);
      alert("轉換失敗，請稍後再試。");
    } finally {
      setIsMagicTransforming(false);
    }
  };

  const handleRefineSubmit = async (instruction: string) => {
    setIsRefining(true);

    try {
      // Branch: If Image Refine Mode
      if (isImageRefineMode) {
        const apiKey = await window.aistudio?.hasSelectedApiKey();
        if (!apiKey) await window.aistudio?.openSelectKey();
        
        const serviceFiles = attachedFiles.map(f => ({ mimeType: f.mimeType, data: f.data }));
        
        const newImageUrl = await generateFullInfographicImage(
          inputText, 
          selectedStyle, 
          serviceFiles, 
          inputUrl, 
          brandConfig,
          customStylePrompt,
          aspectRatio,
          instruction // Pass instruction here
        );
        
        if (newImageUrl) {
          setFullImageUrl(newImageUrl);
          saveToHistory(null, newImageUrl, null, 'image');
          setIsEditModalOpen(false);
        } else {
           throw new Error("Refine image returned nothing");
        }
      } 
      // Branch: Standard Layout Refine Mode
      else if (editingSection && data) {
        const updatedData = await refineInfographicSection(
          data,
          editingSection.type,
          editingSection.id,
          instruction
        );
        setData(updatedData);
        setIsEditModalOpen(false);
        setEditingSection(null);
      }
    } catch (error) {
      console.error("Refinement failed", error);
      alert("修改失敗，請重試。");
    } finally {
      setIsRefining(false);
    }
  };

  const styles: {id: InfographicStyle, label: string}[] = [
    { id: 'professional', label: '專業 Professional' },
    { id: 'comic', label: '漫畫 Comic' },
    { id: 'digital', label: '數位 Digital' },
    { id: 'watercolor', label: '水彩 Watercolor' },
    { id: 'minimalist', label: '極簡 Minimalist' },
    { id: 'custom', label: '自訂 Custom (Style Lab)' },
  ];

  const stylePresets = [
    "Cyberpunk Neon (賽博龐克)", 
    "Pixel Art 8-bit (像素風)", 
    "Japanese Ukiyo-e (浮世繪)", 
    "Vintage 1950s Poster (復古海報)", 
    "Blueprint Technical (藍圖工程)", 
    "Paper Cutout Craft (剪紙藝術)",
    "Studio Ghibli Anime (吉卜力動畫)"
  ];
  
  const ratioOptions: {id: InfographicAspectRatio, label: string, icon: React.ReactNode}[] = [
    { id: 'vertical', label: '直式 (海報)', icon: <RectangleVertical size={16} /> },
    { id: 'horizontal', label: '橫式 (簡報)', icon: <RectangleHorizontal size={16} /> },
    { id: 'square', label: '方形 (IG)', icon: <Square size={16} /> },
  ];

  const hasContent = data || fullImageUrl || presentationData;

  const getButtonLabel = () => {
    if (isLoading) return "處理中...";
    if (mode === 'image') return "產生 AI 全圖 (Banana Pro)";
    if (mode === 'presentation') return "產生 AI 簡報 (Beta)";
    return "產生資訊圖表";
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Sparkles size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800 hidden sm:block">InfographAI</span>
            <span className="font-bold text-xl tracking-tight text-gray-800 sm:hidden">IGAI</span>
          </div>
          
          <div className="flex gap-2 items-center">
             {/* Import/Export Tools - Desktop Only */}
             <div className="hidden lg:flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImportProject} 
                />
                <button 
                  onClick={handleImportClick}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1 text-xs"
                  title="匯入專案 (Import)"
                >
                  <FolderOpen size={18} />
                </button>
                <button 
                  onClick={handleExportProject}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1 text-xs"
                  title="匯出專案 (Export)"
                  disabled={!hasContent && !inputText}
                >
                  <Save size={18} />
                </button>
             </div>

             {/* History Toggle */}
             <button 
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1 mr-1 relative"
                title="歷史紀錄 (History)"
             >
                <History size={20} />
                {history.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
             </button>

             {/* Settings Button */}
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${brandConfig.isEnabled ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="個人品牌設定"
             >
                <UserCircle size={20} />
                <span className="hidden sm:inline">設定</span>
             </button>

             {hasContent && (
                <>
                  <div className="hidden xl:flex bg-gray-100 rounded-lg p-1 mr-2 items-center">
                   {styles.map(s => (
                     <button 
                        key={s.id}
                        onClick={() => {
                          if (selectedStyle !== s.id) {
                            setSelectedStyle(s.id);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${selectedStyle === s.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                     >
                       {s.label}
                     </button>
                   ))}
                 </div>

                  {/* Magic Tools Dropdown */}
                  {mode === 'layout' && data && (
                    <>
                      <div className="relative group mr-1">
                         <button 
                           className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 text-sm font-medium hover:bg-indigo-100 transition-colors"
                           disabled={isMagicTransforming}
                         >
                           {isMagicTransforming ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
                           <span className="hidden sm:inline">魔術棒</span>
                           <ChevronDown size={14} />
                         </button>
                         <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50">
                            <div className="p-2 space-y-1">
                               <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
                                 <Languages size={12} /> 翻譯 (Translate)
                               </div>
                               <button onClick={() => handleMagicTransform("Translate all text to English")} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg">English</button>
                               <button onClick={() => handleMagicTransform("Translate all text to Japanese")} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg">日本語</button>
                               <button onClick={() => handleMagicTransform("Translate all text to Spanish")} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg">Español</button>
                               
                               <div className="h-px bg-gray-100 my-1"></div>
                               
                               <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
                                 <TextSelect size={12} /> 改寫 (Remix)
                               </div>
                               <button onClick={() => handleMagicTransform("Summarize content to be 50% shorter")} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg">精簡摘要 (Summarize)</button>
                               <button onClick={() => handleMagicTransform("Expand content with more details and explanations")} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg">擴充詳述 (Expand)</button>
                            </div>
                         </div>
                      </div>

                      <button 
                        onClick={() => setIsSocialModalOpen(true)}
                        className="p-2 rounded-lg bg-pink-50 text-pink-700 border border-pink-200 flex items-center gap-1 text-sm font-medium hover:bg-pink-100 transition-colors mr-2"
                        title="社群行銷套件"
                      >
                         <Share2 size={16} /> <span className="hidden sm:inline">Social</span>
                      </button>
                    </>
                  )}

                  {/* Color Picker Override */}
                  {mode === 'layout' && !brandConfig.isEnabled && (
                    <div className="flex items-center mr-2 border-r pr-2 h-8">
                       <label title="自訂主題色" className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-1.5 rounded-md flex items-center">
                          <input 
                            type="color" 
                            value={customColor || data?.themeColor || '#4f46e5'} 
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-5 h-5 cursor-pointer border-none p-0 bg-transparent" 
                          />
                       </label>
                    </div>
                  )}

                 <Button variant="secondary" onClick={() => { setData(null); setPresentationData(null); setFullImageUrl(null); setInputText(''); setAttachedFiles([]); setInputUrl(''); }} className="hidden md:flex">
                   新專案
                 </Button>
                 
                 {/* Export Buttons */}
                 <div className="flex gap-1">
                   {mode === 'layout' && data && (
                      <Button variant="outline" onClick={handleDownloadPDF} isLoading={isExporting} title="下載 PDF">
                        <Download size={16} /> <span className="hidden sm:inline">PDF</span>
                      </Button>
                   )}
                   
                   {(data || presentationData) && (
                      <Button variant="outline" onClick={handleDownloadPPT} isLoading={isPPTExporting} title="下載 PPT" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                        <Presentation size={16} /> <span className="hidden sm:inline">PPT</span>
                      </Button>
                   )}
                   
                   {mode === 'image' && fullImageUrl && (
                     <Button variant="outline" onClick={handleDownloadFullImage} title="下載圖片">
                       <Download size={16} /> <span className="hidden sm:inline">下載圖片</span>
                     </Button>
                   )}
                 </div>

                 <Button variant="primary" onClick={() => { setData(null); setPresentationData(null); setFullImageUrl(null); }} title="修改並重新產生">
                   <Pencil size={16} /> <span className="hidden sm:inline">修改</span>
                 </Button>
                </>
             )}
          </div>
        </div>
      </nav>

      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoad={handleLoadHistory}
        onDelete={handleDeleteHistory}
        onClear={handleClearHistory}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        {!hasContent ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8 border-b border-gray-100 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">AI 智能資訊圖表產生器</h2>
                <p className="text-gray-500 text-lg">上傳文件、輸入網址或貼上文字，AI 將自動生成精美圖表。</p>
              </div>
              
              <div className="p-8 space-y-6">
                
                {/* Mode Selector */}
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <button 
                      onClick={() => setMode('layout')}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-bold transition-all ${mode === 'layout' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                    >
                      <LayoutTemplate size={20} />
                      標準排版
                    </button>
                    <button 
                      onClick={() => setMode('image')}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-bold transition-all ${mode === 'image' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                    >
                      <ImageIcon size={20} />
                      AI 全圖繪製 (Beta)
                    </button>
                    <button 
                      onClick={() => setMode('presentation')}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-bold transition-all ${mode === 'presentation' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                    >
                      <MonitorPlay size={20} />
                      AI 簡報生成 (Beta)
                    </button>
                </div>
                
                {/* Image Model Selector - For Layout and Presentation Modes */}
                {(mode === 'layout' || mode === 'presentation') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                       <Zap size={18} /> 插圖生成模型 (Image Model)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <button
                         onClick={() => setImageModel('gemini-2.5-flash-image')}
                         className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${
                           imageModel === 'gemini-2.5-flash-image'
                             ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                             : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                         }`}
                       >
                         <span className="text-sm font-medium">標準速度 (Flash 2.5) - 免費/快速</span>
                       </button>
                       <button
                         onClick={() => setImageModel('gemini-3-pro-image-preview')}
                         className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${
                           imageModel === 'gemini-3-pro-image-preview'
                             ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                             : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                         }`}
                       >
                         <span className="text-sm font-medium">高畫質 (Pro 3) - 需付費 Key</span>
                       </button>
                    </div>
                  </div>
                )}
                
                {/* Aspect Ratio Selector (Only for Layout/Image) */}
                {mode !== 'presentation' && (
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <LayoutTemplate size={18} /> 版面比例 (Layout Ratio)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                       {ratioOptions.map(option => (
                          <button
                             key={option.id}
                             onClick={() => setAspectRatio(option.id)}
                             className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${
                               aspectRatio === option.id
                                 ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                 : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                             }`}
                          >
                             {option.icon}
                             <span className="text-sm font-medium">{option.label}</span>
                          </button>
                       ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Palette size={18} /> 選擇視覺風格
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {styles.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => setSelectedStyle(s.id)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-center ${
                          selectedStyle === s.id 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Infinite Style Lab UI */}
                  {selectedStyle === 'custom' && (
                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                       <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                         <Sparkles size={14} className="text-indigo-600" /> 
                         無限風格實驗室 (Infinite Style Lab)
                       </label>
                       
                       <div className="flex flex-wrap gap-2 mb-3">
                         {stylePresets.map(preset => (
                           <button 
                             key={preset} 
                             onClick={() => setCustomStylePrompt(preset)} 
                             className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-sm"
                           >
                             {preset}
                           </button>
                         ))}
                       </div>

                       <input 
                         type="text" 
                         value={customStylePrompt} 
                         onChange={(e) => setCustomStylePrompt(e.target.value)}
                         className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
                         placeholder="輸入任何風格描述 (e.g. 復古黑膠唱片風格, 霓虹賽博龐克, 剪紙藝術...)"
                         autoFocus
                       />
                    </div>
                  )}
                </div>

                {/* URL Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <LinkIcon size={18} />
                  </div>
                  <input
                    type="url"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="輸入網址 (e.g. https://example.com) 自動讀取網頁內容..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                  />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                  <input 
                    type="file" 
                    accept=".txt,.md,.csv,.json,.pdf,.docx,.doc,.xlsx,.xls,.ppt,.pptx"
                    multiple 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="bg-indigo-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="text-indigo-600" size={32} />
                    </div>
                    <span className="font-semibold text-lg text-gray-700">點擊或拖曳上傳多個文件</span>
                    <span className="text-sm text-gray-500 mt-1">支援 PDF (原生 AI 閱讀) 及 Word/Excel/TXT (自動提取文字)</span>
                    <span className="text-xs text-gray-400 mt-1">(可一次選擇多個檔案)</span>
                  </div>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">已附加 PDF 文件 ({attachedFiles.length})</p>
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-2 text-indigo-700 font-medium overflow-hidden">
                          <FileType size={20} className="shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs bg-indigo-200 px-2 py-0.5 rounded text-indigo-800 uppercase shrink-0">PDF</span>
                        </div>
                        <button 
                          onClick={() => removeAttachedFile(file.id)} 
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                          title="移除檔案"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-base"
                  placeholder="在此貼上文字內容，或上傳文件/網址後自動填入..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />

                <Button 
                  className={`w-full py-4 text-lg shadow-lg ${mode === 'image' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : mode === 'presentation' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                  onClick={handleGenerate}
                  disabled={!inputText.trim() && attachedFiles.length === 0 && !inputUrl.trim()}
                  isLoading={isLoading}
                >
                  {getButtonLabel()}
                </Button>
                
                {(mode === 'image' || imageModel === 'gemini-3-pro-image-preview') && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    注意：使用 Gemini 3 Pro (Nano Banana 3) 模型需選擇付費 API Key。
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {mode === 'layout' && data && (
              <>
                <div className="flex items-center gap-3">
                   <div className="bg-blue-50 text-blue-800 px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 border border-blue-100 shadow-sm">
                     <Pencil size={16} /> 將滑鼠移至任何區塊即可進行 AI 修改與修正，或點擊圖示進行更換
                   </div>
                   
                   {/* Motion Toggle */}
                   <button 
                     onClick={() => setIsMotionEnabled(!isMotionEnabled)}
                     className={`px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 border transition-colors ${isMotionEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                     title="啟用進場動畫與視覺效果"
                   >
                      <PlayCircle size={18} /> 動態效果 (Motion): {isMotionEnabled ? 'ON' : 'OFF'}
                   </button>
                </div>

                <div ref={infographicRef} className="w-full flex justify-center">
                  <InfographicView 
                     data={data} 
                     onEdit={handleEditClick} 
                     onIconEdit={handleIconEditClick}
                     onReorder={handleReorder}
                     customThemeColor={customColor}
                     brandConfig={brandConfig}
                     isMotionEnabled={isMotionEnabled}
                  />
                </div>
              </>
            )}

            {mode === 'presentation' && presentationData && (
               <div className="w-full max-w-5xl">
                 <PresentationView data={presentationData} />
                 <div className="text-center mt-4 text-gray-500 text-sm">
                   * 點擊上方 "下載 PPT" 按鈕即可匯出原生可編輯的 PowerPoint 檔案
                 </div>
               </div>
            )}

            {mode === 'image' && fullImageUrl && (
              <div className="w-full max-w-4xl bg-white p-4 rounded-2xl shadow-2xl">
                <h3 className="text-center text-lg font-bold mb-4 text-gray-700">AI 生成結果 ({aspectRatio === 'horizontal' ? '橫式' : aspectRatio === 'vertical' ? '直式' : '方形'})</h3>
                <div className="w-full flex justify-center">
                  <img src={fullImageUrl} alt="AI Generated Infographic" className="rounded-lg shadow-inner max-h-[80vh] w-auto" />
                </div>
                <div className="mt-4 flex justify-center gap-2">
                  <Button onClick={handleDownloadFullImage} variant="outline">
                    <Download size={18} /> 下載圖片 (PNG)
                  </Button>
                  <Button onClick={handleImageRefineClick} variant="primary" className="bg-purple-600 hover:bg-purple-700">
                    <Eraser size={18} /> 修正圖片 (重新繪製)
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-400 mt-2">
                   注意：全圖模式為點陣圖，使用「修正」將會依照您的指示讓 AI 重新繪製整張圖片。
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <EditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleRefineSubmit}
        isLoading={isRefining}
        sectionLabel={
          isImageRefineMode ? '整張圖片 (Image Re-generation)' :
          editingSection?.type === 'title' ? '標題' : 
          editingSection?.type === 'subtitle' ? '副標題' : 
          editingSection?.type === 'section' ? '內容區塊' : 
          editingSection?.type === 'statistic' ? '數據' : '結語'
        }
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={brandConfig}
        onSave={handleSaveBrandConfig}
      />

      <IconPickerModal 
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={handleIconSelect}
      />

      <SocialMediaModal 
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        onGenerate={handleSocialGenerate}
      />
    </div>
  );
};

export default App;
