
import React, { useState } from 'react';
import { ComicData, ComicPanel } from '../types';
import { Download, Presentation, LayoutGrid, Image as ImageIcon, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { Button } from './Button';

interface Props {
  data: ComicData;
  onConvertToSlides: () => void;
}

export const ComicView: React.FC<Props> = ({ data, onConvertToSlides }) => {
  const [cols, setCols] = useState<2 | 3 | 4>(2);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadSingle = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `comic_panel_${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = async () => {
    if (!data.panels.some(p => p.imageUrl)) return;
    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      const folder = zip.folder("comic_panels");
      
      data.panels.forEach((panel, i) => {
        if (panel.imageUrl) {
          const base64Data = panel.imageUrl.split(',')[1];
          folder?.file(`panel_${i + 1}.png`, base64Data, { base64: true });
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.title.replace(/\s+/g, '_')}_comic.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Zip failed", e);
      alert("打包下載失敗");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{data.title}</h1>
          <p className="text-gray-500 max-w-2xl">{data.storySummary}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
              <button onClick={() => setCols(2)} className={`px-3 py-1 text-xs font-bold rounded ${cols === 2 ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>2欄</button>
              <button onClick={() => setCols(3)} className={`px-3 py-1 text-xs font-bold rounded ${cols === 3 ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>3欄</button>
              <button onClick={() => setCols(4)} className={`px-3 py-1 text-xs font-bold rounded ${cols === 4 ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>4欄</button>
           </div>
           
           <Button variant="outline" onClick={handleDownloadAll} disabled={isDownloading}>
             {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
             下載全套 (ZIP)
           </Button>
           
           <Button variant="primary" onClick={onConvertToSlides}>
             <Presentation size={16} /> 轉為簡報
           </Button>
        </div>
      </div>

      {/* Comic Grid */}
      <div className={`grid gap-6 ${cols === 2 ? 'grid-cols-1 md:grid-cols-2' : cols === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-4'}`}>
        {data.panels.map((panel, index) => (
          <div key={panel.id} className="bg-white border-2 border-gray-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg overflow-hidden flex flex-col">
            
            {/* Header / Camera Info */}
            <div className="bg-gray-100 border-b border-gray-200 px-3 py-1 text-[10px] uppercase font-bold text-gray-500 flex justify-between">
               <span>PANEL {panel.panelNumber}</span>
               <span>{panel.cameraDetail}</span>
            </div>

            {/* Image */}
            <div className="aspect-square w-full bg-gray-50 relative group border-b-2 border-gray-900">
               {panel.imageUrl ? (
                 <>
                   <img src={panel.imageUrl} alt={`Panel ${index + 1}`} className="w-full h-full object-cover" />
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDownloadSingle(panel.imageUrl!, index)}
                        className="p-2 bg-white/90 rounded-full shadow-lg text-gray-700 hover:text-indigo-600"
                        title="下載此圖"
                      >
                        <Download size={16} />
                      </button>
                   </div>
                 </>
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <ImageIcon size={32} />
                    <span className="text-xs">Generating...</span>
                 </div>
               )}
            </div>

            {/* Dialogue / Description */}
            <div className="p-4 flex-1 flex flex-col">
               <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg relative mb-3">
                  <p className="text-sm font-bold text-gray-800 font-comic">{panel.dialogue}</p>
                  {/* Speech bubble tail */}
                  <div className="absolute -bottom-2 left-4 w-4 h-4 bg-yellow-50 border-b border-r border-yellow-200 transform rotate-45"></div>
               </div>
               <p className="text-xs text-gray-500 mt-auto">{panel.description}</p>
            </div>

          </div>
        ))}
      </div>

      {/* Visual Bible Info */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-xs text-indigo-800">
        <span className="font-bold block mb-1">Character Visual Bible (AI Consistency Config):</span>
        {data.characterVisualBible}
      </div>

    </div>
  );
};
