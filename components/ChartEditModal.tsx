
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { X, Plus, Trash2, Save, BarChart3, PieChart } from 'lucide-react';
import { InfographicChart, ChartItem } from '../types';

interface ChartEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  chart: InfographicChart | null;
  onSave: (updatedChart: InfographicChart) => void;
}

export const ChartEditModal: React.FC<ChartEditModalProps> = ({
  isOpen,
  onClose,
  chart,
  onSave
}) => {
  const [tempChart, setTempChart] = useState<InfographicChart | null>(null);

  useEffect(() => {
    if (isOpen && chart) {
      setTempChart(JSON.parse(JSON.stringify(chart))); // Deep copy
    }
  }, [isOpen, chart]);

  if (!isOpen || !tempChart) return null;

  const handleDataChange = (index: number, field: keyof ChartItem, value: any) => {
    const newData = [...tempChart.data];
    newData[index] = { ...newData[index], [field]: value };
    setTempChart({ ...tempChart, data: newData });
  };

  const handleRemoveRow = (index: number) => {
    const newData = tempChart.data.filter((_, i) => i !== index);
    setTempChart({ ...tempChart, data: newData });
  };

  const handleAddRow = () => {
    setTempChart({
      ...tempChart,
      data: [...tempChart.data, { label: 'New Item', value: 10, color: '#4f46e5' }]
    });
  };

  const handleSave = () => {
    onSave(tempChart);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2 text-indigo-700">
            <BarChart3 size={24} />
            <h3 className="font-bold text-lg">編輯圖表數據 (Edit Chart Data)</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Chart Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">圖表標題 (Title)</label>
              <input 
                type="text" 
                value={tempChart.title}
                onChange={(e) => setTempChart({...tempChart, title: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">圖表類型 (Type)</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTempChart({...tempChart, type: 'bar'})}
                  className={`flex-1 py-2 px-3 rounded border flex items-center justify-center gap-2 ${tempChart.type === 'bar' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  <BarChart3 size={16} /> 長條圖 (Bar)
                </button>
                <button 
                   onClick={() => setTempChart({...tempChart, type: 'pie'})}
                   className={`flex-1 py-2 px-3 rounded border flex items-center justify-center gap-2 ${tempChart.type === 'pie' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  <PieChart size={16} /> 圓餅圖 (Pie)
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述 (Description)</label>
            <input 
                type="text" 
                value={tempChart.description || ''}
                onChange={(e) => setTempChart({...tempChart, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="選填：圖表下方的簡短說明"
              />
          </div>

          {/* Data Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">數據點 (Data Points)</label>
              <Button variant="ghost" onClick={handleAddRow} className="text-xs h-8 text-indigo-600 hover:bg-indigo-50">
                <Plus size={14} /> 新增項目
              </Button>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="p-3">標籤 (Label)</th>
                    <th className="p-3 w-24">數值 (Value)</th>
                    <th className="p-3 w-20">顏色</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tempChart.data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 group">
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={item.label}
                          onChange={(e) => handleDataChange(idx, 'label', e.target.value)}
                          className="w-full p-1 border border-transparent hover:border-gray-300 focus:border-indigo-500 rounded outline-none bg-transparent"
                        />
                      </td>
                      <td className="p-2">
                         <input 
                          type="number" 
                          value={item.value}
                          onChange={(e) => handleDataChange(idx, 'value', Number(e.target.value))}
                          className="w-full p-1 border border-transparent hover:border-gray-300 focus:border-indigo-500 rounded outline-none bg-transparent"
                        />
                      </td>
                      <td className="p-2">
                         <input 
                          type="color" 
                          value={item.color || '#000000'}
                          onChange={(e) => handleDataChange(idx, 'color', e.target.value)}
                          className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          onClick={() => handleRemoveRow(idx)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save size={18} /> 儲存變更
          </Button>
        </div>

      </div>
    </div>
  );
};
