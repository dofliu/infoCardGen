import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { X } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (instruction: string) => void;
  isLoading: boolean;
  sectionLabel: string;
}

export const EditModal: React.FC<EditModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading,
  sectionLabel
}) => {
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (isOpen) setInstruction('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-800">修改內容: {sectionLabel}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            您希望如何調整此區塊？
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[100px]"
            placeholder="例如：「讓文字更精簡一點」、「把數據改成 90%」、「換成更幽默的語氣」..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            AI 將根據您的指示重新撰寫此區塊的內容。
          </p>
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button 
            onClick={() => onConfirm(instruction)} 
            isLoading={isLoading}
            disabled={!instruction.trim()}
          >
            {isLoading ? "處理中..." : "確認修改"}
          </Button>
        </div>
      </div>
    </div>
  );
};