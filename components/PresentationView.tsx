
import React, { useState } from 'react';
import { PresentationData, Slide } from '../types';
import { ChevronLeft, ChevronRight, MessageSquare, Maximize2, Wand2, Grid, Layout } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface Props {
  data: PresentationData;
  onRefine?: (slideId: string, currentContent: Slide) => void;
  onReorder?: (newSlides: Slide[]) => void;
}

export const PresentationView: React.FC<Props> = ({ data, onRefine, onReorder }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  const currentSlide = data.slides[currentSlideIndex];
  const totalSlides = data.slides.length;

  const nextSlide = () => setCurrentSlideIndex(prev => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlideIndex(prev => Math.max(prev - 1, 0));

  const bgColor = data.style === 'digital' ? 'bg-gray-900' : 'bg-white';
  const textColor = data.style === 'digital' ? 'text-white' : 'text-gray-900';
  const accentColor = data.themeColor;

  const safeContent = (content: any) => String(content || '');

  // ... (renderSlideContent function remains the same, omitted for brevity, will include full content below)
  const renderSlideContent = (slide: Slide) => {
    switch (slide.layout) {
      case 'title_cover':
        return (
          <div className="h-full flex flex-col justify-center items-center text-center p-4 md:p-12 overflow-hidden">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 line-clamp-3" style={{ color: accentColor }}>{slide.title}</h1>
            <p className={`text-xl md:text-2xl line-clamp-4 ${data.style === 'digital' ? 'text-gray-300' : 'text-gray-600'}`}>{safeContent(slide.content)}</p>
          </div>
        );
      case 'section_header':
        return (
          <div className="h-full flex flex-col justify-center items-center text-center p-12" style={{ backgroundColor: accentColor }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white line-clamp-3">{slide.title}</h1>
          </div>
        );
      case 'text_and_image':
        return (
          <div className="h-full flex flex-col md:flex-row gap-4 md:gap-8 p-6 md:p-12 overflow-hidden">
            <div className="flex-1 flex flex-col justify-center min-h-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 shrink-0" style={{ color: accentColor }}>{slide.title}</h2>
              <div className="text-base md:text-lg leading-relaxed whitespace-pre-line overflow-y-auto pr-2">{safeContent(slide.content)}</div>
            </div>
            {slide.imageUrl && (
               <div className="flex-1 flex items-center justify-center min-h-0">
                 <img src={slide.imageUrl} alt="Slide Visual" className="rounded-lg shadow-lg max-h-full object-contain" />
               </div>
            )}
          </div>
        );
      case 'diagram_image':
        return (
           <div className="h-full flex flex-col items-center p-6 md:p-8 overflow-hidden">
              <h2 className="text-xl md:text-2xl font-bold mb-4 shrink-0" style={{ color: accentColor }}>{slide.title}</h2>
              {slide.imageUrl ? (
                 <div className="flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg shadow-md border border-gray-200 bg-white">
                   <img src={slide.imageUrl} alt="Diagram" className="w-full h-full object-contain" />
                 </div>
              ) : (
                 <div className="flex-1 flex items-center justify-center bg-gray-100 rounded text-gray-400 w-full">Image Generating...</div>
              )}
           </div>
        );
      case 'big_number':
        return (
          <div className="h-full flex flex-col justify-center items-center p-8 md:p-12 text-center overflow-hidden">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-8 uppercase tracking-widest text-gray-400 shrink-0">{slide.title}</h2>
            <div className="text-6xl md:text-[8rem] font-bold leading-none mb-4 md:mb-6" style={{ color: accentColor }}>{slide.statValue}</div>
            <p className="text-lg md:text-xl max-w-2xl line-clamp-4">{safeContent(slide.content)}</p>
          </div>
        );
      case 'quote':
        return (
          <div className="h-full flex flex-col justify-center items-center p-8 md:p-16 text-center overflow-hidden">
            <div className="text-2xl md:text-3xl italic font-serif leading-relaxed mb-8 line-clamp-6">"{safeContent(slide.content)}"</div>
            <div className="text-lg md:text-xl font-bold self-end" style={{ color: accentColor }}>— {slide.title}</div>
          </div>
        );
      default: // bullet_list or generic
        return (
          <div className="h-full p-8 md:p-12 overflow-hidden flex flex-col">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 pb-4 border-b shrink-0" style={{ borderColor: accentColor, color: accentColor }}>{slide.title}</h2>
            <div className="text-lg md:text-xl leading-loose whitespace-pre-line overflow-y-auto pr-2 flex-1">
              {safeContent(slide.content).split('\n').map((line, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <span className="mt-2.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentColor }}></span>
                  <span>{line.replace(/^[•-]\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
        <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200">
           <h3 className="font-bold text-gray-700 flex items-center gap-2">
             <Grid size={18} /> 投影片排序 (Slide Sorter)
           </h3>
           <div className="flex gap-2">
              <button 
                onClick={() => setViewMode('single')}
                className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 flex items-center gap-1 font-medium transition-colors"
              >
                <Maximize2 size={16} /> 單頁視圖
              </button>
           </div>
        </div>
        
        <Reorder.Group axis="y" values={data.slides} onReorder={onReorder || (() => {})} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.slides.map((slide, index) => (
            <Reorder.Item key={slide.id} value={slide} id={slide.id} className="relative group cursor-grab active:cursor-grabbing">
               <div className="aspect-video bg-white rounded-lg shadow-sm border hover:border-indigo-500 hover:shadow-md transition-all overflow-hidden relative">
                 {/* Mini Render (Simplified) */}
                 <div className="absolute inset-0 p-2 transform scale-[0.25] origin-top-left w-[400%] h-[400%] pointer-events-none select-none bg-gray-50">
                    <div className="w-full h-full flex flex-col p-8 bg-white text-gray-900 border">
                        <h1 className="text-4xl font-bold mb-4 text-gray-800">{slide.title}</h1>
                        <div className="text-2xl text-gray-500 line-clamp-6">{safeContent(slide.content)}</div>
                    </div>
                 </div>
                 
                 {/* Index Badge */}
                 <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm z-10">
                   {index + 1}
                 </div>
                 
                 {/* Drag Handle Overlay */}
                 <div className="absolute inset-0 bg-transparent z-0"></div>
               </div>
               <div className="text-xs text-gray-500 mt-1 truncate px-1">{slide.title}</div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        
        <p className="text-center text-xs text-gray-400 mt-2">拖放卡片以調整順序</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Viewer Container */}
      <div className="relative aspect-video bg-gray-100 rounded-xl shadow-2xl overflow-hidden border border-gray-200 group">
        
        {/* View Mode Toggle Overlay */}
        <button 
           onClick={() => setViewMode('grid')}
           className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-black/5 hover:bg-black/10 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
           title="切換至網格排序視圖"
        >
           <Grid size={20} />
        </button>

        <AnimatePresence mode='wait'>
          <motion.div 
            key={currentSlideIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`w-full h-full ${bgColor} ${textColor}`}
          >
            {renderSlideContent(currentSlide)}
            
            {/* Slide Footer */}
            <div className="absolute bottom-4 right-6 text-sm opacity-50 font-mono">
              {currentSlideIndex + 1} / {totalSlides}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays */}
        <button 
          onClick={prevSlide} 
          disabled={currentSlideIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 disabled:opacity-0 transition-all z-10"
        >
          <ChevronLeft size={32} />
        </button>
        <button 
          onClick={nextSlide} 
          disabled={currentSlideIndex === totalSlides - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 disabled:opacity-0 transition-all z-10"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Controls & Notes */}
      <div className="flex flex-col md:flex-row gap-4 h-auto md:h-48">
        {/* Thumbnails Strip */}
        <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 overflow-x-auto flex gap-3 items-center min-h-[120px]">
           {data.slides.map((slide, idx) => (
             <button 
               key={slide.id}
               onClick={() => setCurrentSlideIndex(idx)}
               className={`shrink-0 w-32 aspect-video rounded border-2 transition-all text-[8px] p-1 overflow-hidden text-left bg-gray-50 relative ${currentSlideIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}
             >
                <div className="font-bold truncate mb-1" style={{ color: accentColor }}>{slide.title}</div>
                <div className="line-clamp-4 text-gray-400">{safeContent(slide.content)}</div>
                <div className="absolute bottom-0.5 right-1 text-[8px] font-bold text-gray-300">{idx + 1}</div>
             </button>
           ))}
        </div>

        {/* Actions & Speaker Notes */}
        <div className="w-full md:w-1/3 flex flex-col gap-2">
          {onRefine && (
            <button 
              onClick={() => onRefine(currentSlide.id, currentSlide)}
              className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Wand2 size={16} /> ✨ AI 修改此頁 (Refine Slide)
            </button>
          )}

          <div className={`flex-1 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col transition-all overflow-hidden min-h-[120px] ${showNotes ? 'opacity-100' : 'opacity-50'}`}>
             <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2 text-yellow-800 font-bold text-sm">
                 <MessageSquare size={16} /> Speaker Notes
               </div>
               <button onClick={() => setShowNotes(!showNotes)} className="text-yellow-600 hover:text-yellow-800 text-xs underline">
                 {showNotes ? 'Hide' : 'Show'}
               </button>
             </div>
             {showNotes && (
               <div className="flex-1 overflow-y-auto text-sm text-gray-700 leading-relaxed pr-2 font-serif">
                 {currentSlide.speakerNotes}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
