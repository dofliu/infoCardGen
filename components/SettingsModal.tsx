import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { X, Save, UserCircle } from 'lucide-react';
import { BrandConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BrandConfig;
  onSave: (newConfig: BrandConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  config,
  onSave
}) => {
  const [tempConfig, setTempConfig] = useState<BrandConfig>(config);

  useEffect(() => {
    if (isOpen) {
      setTempConfig(config);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(tempConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2 text-indigo-700">
            <UserCircle size={24} />
            <h3 className="font-bold text-lg">個人品牌設定 (Personal Branding)</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div>
              <span className="font-semibold text-gray-800 block">啟用個人品牌</span>
              <span className="text-xs text-gray-500">開啟後將自動套用以下設定至所有新生成的圖表</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={tempConfig.isEnabled} 
                onChange={(e) => setTempConfig({...tempConfig, isEnabled: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className={`space-y-4 transition-opacity duration-200 ${tempConfig.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                固定頁尾署名 (Footer Signature)
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="例如：國立勤益科技大學 劉瑞弘老師團隊"
                value={tempConfig.footerText}
                onChange={(e) => setTempConfig({...tempConfig, footerText: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">此文字將固定顯示在圖表的最底部。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                指定品牌色 (Brand Color)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="h-10 w-16 p-0 border border-gray-300 rounded cursor-pointer"
                  value={tempConfig.brandColor}
                  onChange={(e) => setTempConfig({...tempConfig, brandColor: e.target.value})}
                />
                <span className="text-sm text-gray-600 font-mono">{tempConfig.brandColor}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">強制使用此顏色作為主色調，覆蓋 AI 的建議。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                專屬語氣 (Tone of Voice)
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="例如：學術專業、親切活潑、條列式簡報..."
                value={tempConfig.toneOfVoice}
                onChange={(e) => setTempConfig({...tempConfig, toneOfVoice: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">AI 撰寫內容時會參考此語氣指示。</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save size={18} /> 儲存設定
          </Button>
        </div>
      </div>
    </div>
  );
};