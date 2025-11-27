
import React, { useState } from 'react';
import { ICON_TYPES } from './Icons';
import { X, Search } from 'lucide-react';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconType: string) => void;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredIcons = ICON_TYPES.filter(icon => 
    icon.label.toLowerCase().includes(search.toLowerCase()) || 
    icon.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">選擇圖示 (Select Icon)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="搜尋圖示..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="p-4 h-80 overflow-y-auto grid grid-cols-5 sm:grid-cols-6 gap-3">
          {filteredIcons.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all gap-1 group"
              title={item.label}
            >
              <item.icon className="w-6 h-6 text-gray-600 group-hover:text-indigo-600" />
              <span className="text-[10px] text-gray-400 group-hover:text-indigo-500 truncate w-full text-center">
                {item.label}
              </span>
            </button>
          ))}
          {filteredIcons.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-8">
              找不到符合的圖示
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
