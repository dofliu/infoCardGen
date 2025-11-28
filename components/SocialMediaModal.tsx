
import React, { useState } from 'react';
import { Button } from './Button';
import { X, Copy, Check, Instagram, Linkedin, Twitter, Facebook, Loader2 } from 'lucide-react';
import { SocialPlatform } from '../types';

interface SocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (platform: SocialPlatform) => Promise<string>;
}

export const SocialMediaModal: React.FC<SocialMediaModalProps> = ({ 
  isOpen, 
  onClose,
  onGenerate
}) => {
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>('instagram');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Generate when platform changes or opens
  React.useEffect(() => {
    if (isOpen) {
      handleGenerate(activePlatform);
    }
  }, [isOpen]);

  const handleGenerate = async (platform: SocialPlatform) => {
    setActivePlatform(platform);
    setIsLoading(true);
    setContent('');
    try {
      const text = await onGenerate(platform);
      setContent(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">社群行銷套件 (Social Media Kit)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex border-b">
           <button 
             onClick={() => handleGenerate('instagram')} 
             className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activePlatform === 'instagram' ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <Instagram size={18} /> Instagram
           </button>
           <button 
             onClick={() => handleGenerate('linkedin')} 
             className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activePlatform === 'linkedin' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <Linkedin size={18} /> LinkedIn
           </button>
           <button 
             onClick={() => handleGenerate('facebook')} 
             className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activePlatform === 'facebook' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <Facebook size={18} /> Facebook
           </button>
           <button 
             onClick={() => handleGenerate('twitter')} 
             className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activePlatform === 'twitter' ? 'text-sky-500 border-b-2 border-sky-500 bg-sky-50' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <Twitter size={18} /> Twitter
           </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/30">
           {isLoading ? (
             <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-3">
               <Loader2 size={32} className="animate-spin text-indigo-500" />
               <p className="text-sm">AI 正在撰寫貼文文案...</p>
             </div>
           ) : (
             <div className="relative">
               <textarea 
                 className="w-full h-64 p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700 leading-relaxed resize-none shadow-sm"
                 value={content}
                 readOnly
               />
               <div className="absolute top-2 right-2">
                 <button 
                   onClick={handleCopy}
                   className={`p-2 rounded-lg shadow-sm border transition-all flex items-center gap-1 text-xs font-medium ${isCopied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                 >
                   {isCopied ? <Check size={14} /> : <Copy size={14} />}
                   {isCopied ? '已複製' : '複製'}
                 </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
