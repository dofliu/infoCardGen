
import React from 'react';
import { HistoryItem } from '../types';
import { X, Trash2, Clock, Calendar, LayoutTemplate, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onLoad,
  onDelete,
  onClear
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800">
            <Clock size={20} className="text-indigo-600" />
            <h2 className="font-bold text-lg">歷史紀錄 (History)</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
              <Clock size={48} className="opacity-20" />
              <p>尚無歷史紀錄</p>
              <p className="text-xs">產生的圖表將自動儲存於此</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer relative"
                onClick={() => onLoad(item)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                     <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded tracking-wide ${item.mode === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                       {item.mode === 'image' ? 'Image' : 'Layout'}
                     </span>
                     <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="刪除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{item.title || "未命名專案"}</h3>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 capitalize">{item.style}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 capitalize">{item.aspectRatio}</span>
                </div>

                <div className="flex items-center text-indigo-600 text-xs font-medium group-hover:translate-x-1 transition-transform">
                  載入專案 <ArrowRight size={12} className="ml-1" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t bg-white">
            <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 text-sm" onClick={onClear}>
              <Trash2 size={16} /> 清空所有紀錄
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
