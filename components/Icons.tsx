
import React from 'react';
import { 
  Lightbulb, BarChart3, List, Target, AlertTriangle, Info, Calendar, Clock, CheckCircle2,
  DollarSign, Globe, TrendingUp, Users, Heart, Star, Shield, Zap, BookOpen, 
  Briefcase, Camera, Coffee, Cpu, Flag, Gift, Home, MapPin, Music, Phone,
  Search, Settings, Smile, ThumbsUp, Truck, Video, Award, Bell
} from 'lucide-react';

interface IconProps {
  type: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ICON_TYPES = [
  { id: 'bulb', label: 'Idea/Bulb', icon: Lightbulb },
  { id: 'chart', label: 'Chart', icon: BarChart3 },
  { id: 'list', label: 'List', icon: List },
  { id: 'target', label: 'Target', icon: Target },
  { id: 'warning', label: 'Warning', icon: AlertTriangle },
  { id: 'info', label: 'Info', icon: Info },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'check', label: 'Check', icon: CheckCircle2 },
  { id: 'dollar', label: 'Money', icon: DollarSign },
  { id: 'globe', label: 'Global', icon: Globe },
  { id: 'trend', label: 'Trend', icon: TrendingUp },
  { id: 'users', label: 'People', icon: Users },
  { id: 'heart', label: 'Heart', icon: Heart },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'shield', label: 'Security', icon: Shield },
  { id: 'zap', label: 'Energy', icon: Zap },
  { id: 'book', label: 'Learning', icon: BookOpen },
  { id: 'briefcase', label: 'Business', icon: Briefcase },
  { id: 'camera', label: 'Media', icon: Camera },
  { id: 'coffee', label: 'Lifestyle', icon: Coffee },
  { id: 'cpu', label: 'Tech', icon: Cpu },
  { id: 'flag', label: 'Goal', icon: Flag },
  { id: 'gift', label: 'Rewards', icon: Gift },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'map', label: 'Location', icon: MapPin },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'phone', label: 'Contact', icon: Phone },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'smile', label: 'Happy', icon: Smile },
  { id: 'thumbsup', label: 'Like', icon: ThumbsUp },
  { id: 'truck', label: 'Logistics', icon: Truck },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'award', label: 'Award', icon: Award },
  { id: 'bell', label: 'Notification', icon: Bell },
];

export const IconDisplay: React.FC<IconProps> = ({ type, className = "w-6 h-6", style }) => {
  const iconDef = ICON_TYPES.find(i => i.id === type);
  const IconComponent = iconDef ? iconDef.icon : Info;
  return <IconComponent className={className} style={style} />;
};
