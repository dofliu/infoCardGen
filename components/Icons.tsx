import React from 'react';
import { Lightbulb, BarChart3, List, Target, AlertTriangle, Info, Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface IconProps {
  type: string;
  className?: string;
  style?: React.CSSProperties;
}

export const IconDisplay: React.FC<IconProps> = ({ type, className = "w-6 h-6", style }) => {
  const props = { className, style };
  switch (type) {
    case 'bulb': return <Lightbulb {...props} />;
    case 'chart': return <BarChart3 {...props} />;
    case 'list': return <List {...props} />;
    case 'target': return <Target {...props} />;
    case 'warning': return <AlertTriangle {...props} />;
    case 'calendar': return <Calendar {...props} />;
    case 'time': return <Clock {...props} />;
    case 'check': return <CheckCircle2 {...props} />;
    default: return <Info {...props} />;
  }
};