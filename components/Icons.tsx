import React from 'react';
import { Lightbulb, BarChart3, List, Target, AlertTriangle, Info, Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface IconProps {
  type: string;
  className?: string;
}

export const IconDisplay: React.FC<IconProps> = ({ type, className = "w-6 h-6" }) => {
  switch (type) {
    case 'bulb': return <Lightbulb className={className} />;
    case 'chart': return <BarChart3 className={className} />;
    case 'list': return <List className={className} />;
    case 'target': return <Target className={className} />;
    case 'warning': return <AlertTriangle className={className} />;
    case 'calendar': return <Calendar className={className} />;
    case 'time': return <Clock className={className} />;
    case 'check': return <CheckCircle2 className={className} />;
    default: return <Info className={className} />;
  }
};