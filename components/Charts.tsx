
import React from 'react';
import { InfographicChart, ChartItem } from '../types';

interface ChartsProps {
  chart: InfographicChart;
  themeColor: string;
  className?: string;
  styleMode: string;
}

export const ChartRenderer: React.FC<ChartsProps> = ({ chart, themeColor, className = "", styleMode }) => {
  const isDigital = styleMode === 'digital';
  const textColor = isDigital ? 'text-gray-200' : 'text-gray-700';

  return (
    <div className={`w-full p-4 ${className}`}>
      <h4 className={`text-lg font-bold mb-1 text-center ${isDigital ? 'text-white' : 'text-gray-800'}`}>{chart.title}</h4>
      {chart.description && <p className={`text-sm text-center mb-4 ${isDigital ? 'text-gray-400' : 'text-gray-500'}`}>{chart.description}</p>}
      
      <div className="flex justify-center">
        {chart.type === 'bar' ? (
          <BarChart data={chart.data} themeColor={themeColor} isDigital={isDigital} />
        ) : (
          <PieChart data={chart.data} themeColor={themeColor} isDigital={isDigital} />
        )}
      </div>
    </div>
  );
};

const BarChart: React.FC<{ data: ChartItem[]; themeColor: string; isDigital: boolean }> = ({ data, themeColor, isDigital }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="w-full max-w-md space-y-3">
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        return (
          <div key={index} className="w-full">
            <div className={`flex justify-between text-xs mb-1 font-medium ${isDigital ? 'text-gray-300' : 'text-gray-600'}`}>
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className={`w-full h-4 rounded-full ${isDigital ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: item.color || themeColor,
                  boxShadow: isDigital ? `0 0 10px ${item.color || themeColor}` : 'none'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PieChart: React.FC<{ data: ChartItem[]; themeColor: string; isDigital: boolean }> = ({ data, themeColor, isDigital }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = data.map((item) => {
    const startPercent = cumulativePercent;
    const slicePercent = item.value / total;
    cumulativePercent += slicePercent;
    const endPercent = cumulativePercent;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

    const pathData = [
      `M 0 0`,
      `L ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L 0 0`,
    ].join(' ');

    return { pathData, color: item.color || themeColor, label: item.label, value: item.value };
  });

  // Generate slightly different shades if no color provided
  const adjustColor = (hex: string, index: number) => {
     // Simple hash logic for variety or opacity
     return index % 2 === 0 ? hex : `${hex}CC`; 
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative w-48 h-48">
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full overflow-visible">
          {slices.map((slice, index) => (
            <path 
              key={index} 
              d={slice.pathData} 
              fill={slice.color === themeColor ? adjustColor(themeColor, index) : slice.color} 
              stroke={isDigital ? '#111827' : '#fff'}
              strokeWidth="0.02"
              className="hover:opacity-90 transition-opacity"
            />
          ))}
        </svg>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color || (index % 2 === 0 ? themeColor : `${themeColor}CC`) }}
            ></div>
            <span className={`text-xs ${isDigital ? 'text-gray-300' : 'text-gray-600'}`}>
              {item.label} ({Math.round((item.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
