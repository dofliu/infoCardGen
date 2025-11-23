
import React, { useState, useRef } from 'react';
import { generateInfographic, refineInfographicSection, generateFullInfographicImage, FileData } from './services/geminiService';
import { InfographicData, SectionType, InfographicStyle } from './types';
import { InfographicView } from './components/InfographicView';
import { EditModal } from './components/EditModal';
import { Button } from './components/Button';
import { RefreshCw, Upload, Sparkles, Palette, FileText, Download, Image as ImageIcon, LayoutTemplate, XCircle, FileType, Trash2, Link as LinkIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Define a type for files kept as attachments (like PDFs)
interface AttachedFile extends FileData {
  id: string;
  name: string;
}

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [data, setData] = useState<InfographicData | null>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  
  const [selectedStyle, setSelectedStyle] = useState<InfographicStyle>('professional');
  const [customColor, setCustomColor] = useState<string>(''); // For user overrides

  const [mode, setMode] = useState<'layout' | 'image'>('layout');
  
  const infographicRef = useRef<HTMLDivElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<{type: SectionType, id: string | null, content: any} | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    const newAttachedFiles: AttachedFile[] = [];
    let extractedTextAccumulator = "";
    
    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      try {
        if (fileExtension === 'pdf') {
          // Keep PDF as base64 attachment for Gemini
          const base64 = await readFileAsBase64(file);
          newAttachedFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            mimeType: 'application/pdf',
            data: base64
          });
        } 
        else if (fileExtension === 'docx') {
          // Extract text from DOCX
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedTextAccumulator += `\n\n[File: ${file.name}]\n${result.value}`;
        } 
        else if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
          // Extract text from Spreadsheet
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer);
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet);
          extractedTextAccumulator += `\n\n[File: ${file.name}]\n${csvText}`;
        }
        else if (['txt', 'md', 'json'].includes(fileExtension || '')) {
          // Extract text from plain text files
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
    
    setIsLoading(true);
    setData(null);
    setFullImageUrl(null);
    setCustomColor(''); // Reset custom color on new gen

    const serviceFiles = attachedFiles.map(f => ({
      mimeType: f.mimeType,
      data: f.data
    }));

    try {
      if (mode === 'layout') {
        const result = await generateInfographic(inputText, selectedStyle, serviceFiles, inputUrl);
        setData(result);
      } else {
        const apiKey = await window.aistudio?.hasSelectedApiKey();
        if (!apiKey) {
           await window.aistudio?.openSelectKey();
        }
        const imageUrl = await generateFullInfographicImage(inputText, selectedStyle, serviceFiles, inputUrl);
        if (imageUrl) {
          setFullImageUrl(imageUrl);
        } else {
          throw new Error("No image returned");
        }
      }
    } catch (error) {
      console.error("Generation failed", error);
      alert("產生失敗。請檢查網路或 API 限制。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!infographicRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(infographicRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (element) => element.hasAttribute('data-html2canvas-ignore')
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${data?.mainTitle || 'infographic'}.pdf`);
      
    } catch (error) {
      console.error("PDF export failed", error);
      alert("匯出 PDF 失敗，請稍後再試。");
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleDownloadFullImage = () => {
    if (!fullImageUrl) return;
    const link = document.createElement('a');
    link.href = fullImageUrl;
    link.download = 'ai-generated-infographic.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = (type: SectionType, id: string | null, currentContent: any) => {
    setEditingSection({ type, id, content: currentContent });
    setIsEditModalOpen(true);
  };

  const handleRefineSubmit = async (instruction: string) => {
    if (!editingSection || !data) return;

    setIsRefining(true);
    try {
      const updatedData = await refineInfographicSection(
        data,
        editingSection.type,
        editingSection.id,
        instruction
      );
      setData(updatedData);
      setIsEditModalOpen(false);
      setEditingSection(null);
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
  ];

  const hasContent = data || fullImageUrl;

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
          
          {hasContent && (
             <div className="flex gap-2 items-center">
                {/* Style Selector */}
                <div className="hidden lg:flex bg-gray-100 rounded-lg p-1 mr-2 items-center">
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

                {/* Color Picker Override */}
                {mode === 'layout' && (
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

               <Button variant="secondary" onClick={() => { setData(null); setFullImageUrl(null); setInputText(''); setAttachedFiles([]); setInputUrl(''); }} className="hidden md:flex">
                 新專案
               </Button>
               
               {mode === 'layout' && data && (
                 <Button variant="outline" onClick={handleDownloadPDF} isLoading={isExporting} title="下載 PDF">
                   <Download size={16} /> <span className="hidden sm:inline">下載 PDF</span>
                 </Button>
               )}
               
               {mode === 'image' && fullImageUrl && (
                 <Button variant="outline" onClick={handleDownloadFullImage} title="下載圖片">
                   <Download size={16} /> <span className="hidden sm:inline">下載圖片</span>
                 </Button>
               )}

               <Button variant="primary" onClick={handleGenerate} isLoading={isLoading} title="重新產生">
                 <RefreshCw size={16} /> <span className="hidden sm:inline">重新產生</span>
               </Button>
             </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasContent ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8 border-b border-gray-100 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">AI 智能資訊圖表產生器</h2>
                <p className="text-gray-500 text-lg">上傳文件、輸入網址或貼上文字，AI 將自動生成精美圖表。</p>
              </div>
              
              <div className="p-8 space-y-6">
                
                <div className="flex justify-center gap-4 mb-6">
                    <button 
                      onClick={() => setMode('layout')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-bold transition-all ${mode === 'layout' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                    >
                      <LayoutTemplate size={20} />
                      標準排版 (可編輯)
                    </button>
                    <button 
                      onClick={() => setMode('image')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-bold transition-all ${mode === 'image' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                    >
                      <ImageIcon size={20} />
                      AI 全圖繪製 (Beta)
                    </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Palette size={18} /> 選擇視覺風格
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                  className={`w-full py-4 text-lg shadow-lg ${mode === 'image' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                  onClick={handleGenerate}
                  disabled={!inputText.trim() && attachedFiles.length === 0 && !inputUrl.trim()}
                  isLoading={isLoading}
                >
                  {isLoading ? (mode === 'image' ? "AI 正在讀取並繪製全圖 (約需 20-30 秒)..." : "正在讀取網址與文件並設計中...") : (mode === 'image' ? "產生 AI 全圖 (Banana Pro)" : "產生資訊圖表")}
                </Button>
                
                {mode === 'image' && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    注意：AI 全圖繪製功能使用 Gemini 3 Pro Image 模型，需選擇付費 API Key。
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {mode === 'layout' && data && (
              <>
                <div className="bg-blue-50 text-blue-800 px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 border border-blue-100 shadow-sm">
                  <PencilIcon /> 將滑鼠移至任何區塊即可進行 AI 修改與修正
                </div>
                <div ref={infographicRef} className="w-full flex justify-center">
                  <InfographicView 
                     data={data} 
                     onEdit={handleEditClick} 
                     customThemeColor={customColor} 
                  />
                </div>
              </>
            )}

            {mode === 'image' && fullImageUrl && (
              <div className="w-full max-w-2xl bg-white p-4 rounded-2xl shadow-2xl">
                <h3 className="text-center text-lg font-bold mb-4 text-gray-700">AI 生成結果</h3>
                <img src={fullImageUrl} alt="AI Generated Infographic" className="w-full rounded-lg shadow-inner" />
                <div className="mt-4 flex justify-center">
                  <Button onClick={handleDownloadFullImage}>
                    <Download size={18} /> 下載圖片 (PNG)
                  </Button>
                </div>
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
        sectionLabel={editingSection?.type === 'title' ? '標題' : 
                      editingSection?.type === 'subtitle' ? '副標題' : 
                      editingSection?.type === 'section' ? '內容區塊' : 
                      editingSection?.type === 'statistic' ? '數據' : '結語'}
      />
    </div>
  );
};

const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

export default App;
