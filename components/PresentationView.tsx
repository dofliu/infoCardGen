
import React, { useState } from 'react';
import { PresentationData, Slide } from '../types';
import { ChevronLeft, ChevronRight, MessageSquare, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  data: PresentationData;
}

export const PresentationView: React.FC<Props> = ({ data }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(true);

  const currentSlide = data.slides[currentSlideIndex];
  const totalSlides = data.slides.length;

  const nextSlide = () => setCurrentSlideIndex(prev => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlideIndex(prev => Math.max(prev - 1, 0));

  const bgColor = data.style === 'digital' ? 'bg-gray-900' : 'bg-white';
  const textColor = data.style === 'digital' ? 'text-white' : 'text-gray-900';
  const accentColor = data.themeColor;

  const renderSlideContent = (slide: Slide) => {
    switch (slide.layout) {
      case 'title_cover':
        return (
          <div className="h-full flex flex-col justify-center items-center text-center p-12">
            <h1 className="text-5xl font-bold mb-6" style={{ color: accentColor }}>{slide.title}</h1>
            <p className={`text-2xl ${data.style === 'digital' ? 'text-gray-300' : 'text-gray-600'}`}>{slide.content}</p>
          </div>
        );
      case 'section_header':
        return (
          <div className="h-full flex flex-col justify-center items-center text-center p-12" style={{ backgroundColor: accentColor }}>
            <h1 className="text-5xl font-bold text-white">{slide.title}</h1>
          </div>
        );
      case 'text_and_image':
        return (
          <div className="h-full flex gap-8 p-12">
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-6" style={{ color: accentColor }}>{slide.title}</h2>
              <div className="text-lg leading-relaxed whitespace-pre-line">{slide.content}</div>
            </div>
            {slide.imageUrl && (
               <div className="flex-1 flex items-center justify-center">
                 <img src={slide.imageUrl} alt="Slide Visual" className="rounded-lg shadow-lg max-h-[400px] object-cover" />
               </div>
            )}
          </div>
        );
      case 'big_number':
        return (
          <div className="h-full flex flex-col justify-center items-center p-12 text-center">
            <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-gray-400">{slide.title}</h2>
            <div className="text-[8rem] font-bold leading-none mb-6" style={{ color: accentColor }}>{slide.statValue}</div>
            <p className="text-xl max-w-2xl">{slide.content}</p>
          </div>
        );
      case 'quote':
        return (
          <div className="h-full flex flex-col justify-center items-center p-16 text-center">
            <div className="text-3xl italic font-serif leading-relaxed mb-8">"{slide.content}"</div>
            <div className="text-xl font-bold self-end" style={{ color: accentColor }}>— {slide.title}</div>
          </div>
        );
      default: // bullet_list or generic
        return (
          <div className="h-full p-12">
            <h2 className="text-3xl font-bold mb-8 pb-4 border-b" style={{ borderColor: accentColor, color: accentColor }}>{slide.title}</h2>
            <div className="text-xl leading-loose whitespace-pre-line">
              {slide.content.split('\n').map((line, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <span className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentColor }}></span>
                  <span>{line.replace(/^[•-]\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Viewer Container */}
      <div className="relative aspect-video bg-gray-100 rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        
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
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 disabled:opacity-0 transition-all"
        >
          <ChevronLeft size={32} />
        </button>
        <button 
          onClick={nextSlide} 
          disabled={currentSlideIndex === totalSlides - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 disabled:opacity-0 transition-all"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Controls & Notes */}
      <div className="flex gap-4 h-48">
        {/* Thumbnails */}
        <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 overflow-x-auto flex gap-3 items-center">
           {data.slides.map((slide, idx) => (
             <button 
               key={slide.id}
               onClick={() => setCurrentSlideIndex(idx)}
               className={`shrink-0 w-32 aspect-video rounded border-2 transition-all text-[8px] p-1 overflow-hidden text-left bg-gray-50 ${currentSlideIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}
             >
                <div className="font-bold truncate mb-1" style={{ color: accentColor }}>{slide.title}</div>
                <div className="line-clamp-4 text-gray-400">{slide.content}</div>
             </button>
           ))}
        </div>

        {/* Speaker Notes */}
        <div className={`w-1/3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col transition-all ${showNotes ? 'opacity-100' : 'opacity-50'}`}>
           <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-2 text-yellow-800 font-bold text-sm">
               <MessageSquare size={16} /> Speaker Notes
             </div>
             <button onClick={() => setShowNotes(!showNotes)} className="text-yellow-600 hover:text-yellow-800">
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
  );
};
