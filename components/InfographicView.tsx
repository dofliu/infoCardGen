
import React from 'react';
import { InfographicData, SectionType, InfographicSection } from '../types';
import { IconDisplay } from './Icons';
import { ChartRenderer } from './Charts';
import { Pencil, ArrowDown, ArrowRightLeft } from 'lucide-react';

interface Props {
  data: InfographicData;
  onEdit: (type: SectionType, id: string | null, currentContent: any) => void;
  customThemeColor?: string; // New prop for color override
}

export const InfographicView: React.FC<Props> = ({ data, onEdit, customThemeColor }) => {
  
  // Use custom color if provided, otherwise use AI data.themeColor
  const activeThemeColor = customThemeColor || data.themeColor;

  // Style Definitions
  const getStyleConfig = () => {
    switch (data.style) {
      case 'comic':
        return {
          container: "font-sans border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white",
          header: "clip-path-polygon-[0_0,100%_0,100%_90%,50%_100%,0_90%] border-b-4 border-black",
          headerTitle: "font-black uppercase tracking-wider drop-shadow-[3px_3px_0_#000]",
          statCard: "border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-100",
          sectionCard: "border-2 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] bg-white",
          timelineLine: "bg-black",
          iconBg: "bg-white border-2 border-black",
          bgPattern: "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]",
          imageContainer: "border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4"
        };
      case 'digital':
        return {
          container: "font-mono bg-gray-900 text-green-400 border border-green-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
          header: "bg-gray-800 border-b border-green-500/30 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] [background-size:20px_20px]",
          headerTitle: "text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-widest",
          statCard: "bg-gray-800 border border-green-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] text-green-300",
          sectionCard: "bg-gray-800/50 border border-green-500/20 hover:border-green-500/60 backdrop-blur-sm",
          timelineLine: "bg-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
          iconBg: "bg-gray-900 border border-green-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] text-green-400",
          bgPattern: "bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] [background-size:20px_20px]",
          imageContainer: "border border-green-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded overflow-hidden mb-4"
        };
      case 'watercolor':
        return {
          container: "font-serif bg-[#fdfbf7]",
          header: "rounded-b-[3rem] opacity-90 blur-[0.5px]",
          headerTitle: "italic text-gray-800",
          statCard: "bg-white/60 backdrop-blur-sm rounded-[2rem] shadow-lg border border-white/50",
          sectionCard: "bg-white/40 rounded-[1rem] shadow-sm hover:shadow-md transition-shadow border border-stone-100",
          timelineLine: "bg-stone-300 opacity-50",
          iconBg: "bg-stone-100/50 rounded-full",
          bgPattern: "bg-[url('https://www.transparenttextures.com/patterns/watercolor.png')]",
          imageContainer: "rounded-2xl overflow-hidden border-4 border-white shadow-md rotate-1 mb-4 opacity-90"
        };
      case 'minimalist':
        return {
          container: "font-sans bg-white",
          header: "border-b border-gray-100",
          headerTitle: "font-light tracking-[0.2em] uppercase text-gray-800",
          statCard: "bg-gray-50 rounded-none border-l-4 border-gray-300 pl-4",
          sectionCard: "bg-white border-b border-gray-100 py-4",
          timelineLine: "bg-gray-200",
          iconBg: "bg-gray-100 rounded-full text-gray-600",
          bgPattern: "",
          imageContainer: "grayscale mb-4 rounded-sm"
        };
      default: // Professional
        return {
          container: "font-sans bg-white shadow-xl rounded-xl",
          header: "relative overflow-hidden",
          headerTitle: "font-extrabold tracking-tight",
          statCard: "bg-white shadow-lg rounded-xl hover:-translate-y-1 border border-gray-50",
          sectionCard: "bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow",
          timelineLine: "bg-gray-200",
          iconBg: "bg-gray-50 rounded-lg text-gray-700 shadow-inner",
          bgPattern: "bg-gray-50",
          imageContainer: "rounded-lg overflow-hidden shadow-sm border border-gray-100 mb-4"
        };
    }
  };

  const styles = getStyleConfig();

  const Editable = ({ children, type, id, content, className = "" }: { children: React.ReactNode, type: SectionType, id: string | null, content: any, className?: string }) => (
    <div className={`group relative transition-all duration-200 cursor-pointer ${className}`}
         onClick={() => onEdit(type, id, content)}>
      {children}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-full shadow-sm border border-gray-200 text-indigo-600 z-20 data-html2canvas-ignore">
        <Pencil size={14} />
      </div>
    </div>
  );

  const SectionImage = ({ url }: { url?: string }) => {
    if (!url) return null;
    return (
      <div className={`w-full aspect-video relative ${styles.imageContainer}`}>
        <img src={url} alt="Section illustration" className="w-full h-full object-cover" />
      </div>
    );
  };

  const renderGridSection = (section: InfographicSection, index: number) => (
    <Editable 
      key={section.id} 
      type="section" 
      id={section.id} 
      content={section}
      className={`p-6 flex flex-col md:flex-row gap-4 items-start ${styles.sectionCard} ${index % 3 === 0 && data.style !== 'minimalist' ? 'md:col-span-2' : ''}`}
    >
      <div className={`p-3 shrink-0 ${styles.iconBg}`}>
        <IconDisplay type={section.iconType} className="w-6 h-6" />
      </div>
      <div className="flex-1 w-full">
        <SectionImage url={section.imageUrl} />
        <h3 className={`text-xl font-bold mb-2 ${data.style === 'digital' ? 'text-white' : 'text-gray-800'}`}>{section.title}</h3>
        <div className={`leading-relaxed whitespace-pre-line ${data.style === 'digital' ? 'text-gray-300' : 'text-gray-600'}`}>
          {section.content}
        </div>
      </div>
    </Editable>
  );

  const renderTimelineSection = (section: InfographicSection, index: number) => {
    const isLeft = index % 2 === 0;
    return (
      <div key={section.id} className="relative flex items-center justify-between md:justify-center w-full mb-8">
        <div className={`w-full md:w-5/12 ${isLeft ? 'order-1 md:text-right' : 'order-3 hidden md:block'}`}>
           {isLeft && (
             <Editable type="section" id={section.id} content={section} className={`p-5 ${styles.sectionCard}`}>
               <SectionImage url={section.imageUrl} />
               <h3 className={`text-lg font-bold mb-1 ${data.style === 'digital' ? 'text-white' : 'text-gray-800'}`}>{section.title}</h3>
               <p className={`text-sm ${data.style === 'digital' ? 'text-gray-300' : 'text-gray-600'}`}>{section.content}</p>
             </Editable>
           )}
        </div>
        
        <div className="absolute left-0 md:left-1/2 h-full w-0.5 -ml-[1px] top-0 bottom-0 flex flex-col items-center justify-center z-10 order-2">
          <div className={`w-1 h-full ${styles.timelineLine} absolute`}></div>
          <div className={`relative w-10 h-10 flex items-center justify-center rounded-full border-4 ${data.style === 'digital' ? 'bg-gray-900 border-green-500' : 'bg-white border-indigo-100'} shadow-md z-20`}>
            <IconDisplay type={section.iconType} className={`w-5 h-5 ${data.style === 'digital' ? 'text-green-400' : 'text-indigo-600'}`} />
          </div>
        </div>

        <div className={`w-full pl-8 md:pl-0 md:w-5/12 ${isLeft ? 'order-3 hidden md:block' : 'order-1'}`}>
           {!isLeft && (
             <Editable type="section" id={section.id} content={section} className={`p-5 ${styles.sectionCard}`}>
               <SectionImage url={section.imageUrl} />
               <h3 className={`text-lg font-bold mb-1 ${data.style === 'digital' ? 'text-white' : 'text-gray-800'}`}>{section.title}</h3>
               <p className={`text-sm ${data.style === 'digital' ? 'text-gray-300' : 'text-gray-600'}`}>{section.content}</p>
             </Editable>
           )}
           <div className="md:hidden">
             {isLeft && (
                <Editable type="section" id={section.id} content={section} className={`p-5 ${styles.sectionCard}`}>
                  <SectionImage url={section.imageUrl} />
                  <h3 className={`text-lg font-bold mb-1 ${data.style === 'digital' ? 'text-white' : 'text-gray-800'}`}>{section.title}</h3>
                  <p className={`text-sm ${data.style === 'digital' ? 'text-gray-300' : 'text-gray-600'}`}>{section.content}</p>
                </Editable>
             )}
           </div>
        </div>
      </div>
    );
  };

  const renderProcessSection = (section: InfographicSection, index: number) => (
    <div key={section.id} className="flex flex-col items-center relative w-full">
       <Editable 
         type="section" 
         id={section.id} 
         content={section} 
         className={`w-full p-6 ${styles.sectionCard} relative z-10`}
       >
         <div className="flex items-center gap-4 mb-3">
           <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${data.style === 'comic' ? 'bg-black' : ''}`} style={{ backgroundColor: data.style !== 'comic' ? activeThemeColor : undefined }}>
             {index + 1}
           </div>
           <h3 className={`text-xl font-bold ${data.style === 'digital' ? 'text-white' : 'text-gray-800'}`}>{section.title}</h3>
         </div>
         <div className={`pl-12 w-full ${data.style === 'digital' ? 'text-gray-300' : 'text-gray-600'}`}>
           <SectionImage url={section.imageUrl} />
           <div className="flex items-start gap-2">
             <IconDisplay type={section.iconType} className="w-5 h-5 mt-0.5 opacity-70 shrink-0" />
             <span>{section.content}</span>
           </div>
         </div>
       </Editable>
       {index < data.sections.length - 1 && (
         <div className="h-8 w-0.5 bg-gray-300 my-1 relative">
            <div className="absolute -bottom-1 -left-1.5 text-gray-300">
              <ArrowDown size={16} />
            </div>
         </div>
       )}
    </div>
  );

  const renderComparisonLayout = () => {
    // Split sections into two groups
    const midpoint = Math.ceil(data.sections.length / 2);
    const leftSections = data.sections.slice(0, midpoint);
    const rightSections = data.sections.slice(midpoint);
    const labels = data.comparisonLabels || ['Side A', 'Side B'];

    return (
      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -ml-[0.5px] z-10 hidden md:block"></div>
        <div className="absolute left-1/2 top-10 -ml-5 bg-white border border-gray-200 rounded-full p-2 z-20 text-gray-400 hidden md:block">
           <ArrowRightLeft size={20} />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
           {/* Left Column */}
           <div className="flex-1">
             <div className="text-center mb-6 pb-2 border-b-2" style={{ borderColor: activeThemeColor }}>
               <h3 className="text-2xl font-bold" style={{ color: activeThemeColor }}>{labels[0]}</h3>
             </div>
             <div className="space-y-4">
               {leftSections.map((section) => renderGridSection(section, 99))}
             </div>
           </div>

           {/* Right Column */}
           <div className="flex-1">
             <div className="text-center mb-6 pb-2 border-b-2 border-gray-400">
               <h3 className="text-2xl font-bold text-gray-600">{labels[1]}</h3>
             </div>
             <div className="space-y-4">
               {rightSections.map((section) => renderGridSection(section, 99))}
             </div>
           </div>
        </div>
      </div>
    );
  };

  const headerStyle = {
    backgroundColor: (data.style === 'professional' || data.style === 'watercolor' || data.style === 'comic') ? activeThemeColor : undefined
  };

  return (
    <div className={`w-full max-w-4xl mx-auto min-h-[1000px] flex flex-col overflow-hidden ${styles.container} ${data.style !== 'digital' ? 'text-gray-900' : 'text-gray-100'}`}>
      
      <div className={`p-12 text-center relative ${styles.header}`} style={headerStyle}>
        
        {data.style === 'professional' && (
          <>
             <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
             <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>
          </>
        )}

        <div className="relative z-10">
          <Editable type="title" id={null} content={data.mainTitle} className="inline-block mb-4 p-2 hover:bg-black/5 rounded border border-transparent hover:border-white/20">
            <h1 className={`text-5xl mb-2 ${styles.headerTitle} ${data.style === 'professional' || data.style === 'comic' ? 'text-white drop-shadow-md' : ''}`}>
              {data.mainTitle}
            </h1>
          </Editable>
          <div className="flex justify-center">
             <Editable type="subtitle" id={null} content={data.subtitle} className="inline-block max-w-2xl p-2 rounded hover:bg-black/5 border border-transparent hover:border-white/20">
              <p className={`text-xl leading-relaxed ${data.style === 'professional' || data.style === 'comic' ? 'text-white/90' : 'opacity-80'}`}>
                {data.subtitle}
              </p>
            </Editable>
          </div>
        </div>
      </div>

      <div className={`flex-grow flex flex-col ${styles.bgPattern}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 -mt-8 relative z-20">
          {data.statistics.map((stat) => (
            <Editable 
              key={stat.id} 
              type="statistic" 
              id={stat.id} 
              content={stat}
              className={`p-4 text-center transition-transform flex flex-col justify-center min-h-[100px] ${styles.statCard}`}
            >
              <div className="text-3xl font-bold mb-1 break-words" style={{ color: data.style === 'digital' ? '#4ade80' : activeThemeColor }}>{stat.value}</div>
              <div className={`font-medium uppercase tracking-wide text-xs ${data.style === 'digital' ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</div>
            </Editable>
          ))}
        </div>

        <div className="flex-grow p-8 pt-0 space-y-8">
          {data.layout === 'timeline' && (
            <div className="flex flex-col relative pl-4 md:pl-0">
               {data.sections.map((section, index) => renderTimelineSection(section, index))}
            </div>
          )}

          {data.layout === 'process' && (
            <div className="flex flex-col gap-2 max-w-2xl mx-auto">
               {data.sections.map((section, index) => renderProcessSection(section, index))}
            </div>
          )}

          {data.layout === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.sections.map((section, index) => renderGridSection(section, index))}
            </div>
          )}

          {data.layout === 'comparison' && renderComparisonLayout()}

          {/* Charts Section */}
          {data.charts && data.charts.length > 0 && (
            <div className={`p-6 rounded-xl ${data.style === 'digital' ? 'bg-gray-800/50 border border-green-500/20' : 'bg-white/50 border border-gray-100'} shadow-sm`}>
               <h3 className={`text-center text-xl font-bold mb-6 ${data.style === 'digital' ? 'text-white' : 'text-gray-800'}`}>數據分析</h3>
               <div className="flex flex-wrap justify-center gap-8">
                 {data.charts.map(chart => (
                   <ChartRenderer 
                     key={chart.id} 
                     chart={chart} 
                     themeColor={activeThemeColor} 
                     className="w-full md:w-[45%]"
                     styleMode={data.style}
                   />
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className={`p-8 text-center ${data.style === 'digital' ? 'bg-gray-950 text-gray-400' : 'bg-gray-900 text-gray-300'} ${data.style === 'comic' ? 'border-t-4 border-black bg-yellow-400 text-black font-bold' : ''}`}>
        <Editable type="conclusion" id={null} content={data.conclusion} className="inline-block p-4 border border-transparent hover:border-white/20 rounded">
          <p className="text-lg font-medium">{data.conclusion}</p>
        </Editable>
      </div>
    </div>
  );
};
