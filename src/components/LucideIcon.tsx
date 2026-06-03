import React from 'react';
import {
  Sparkles,
  Users,
  Tv,
  Shield,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  Eye,
  EyeOff,
  User,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

const iconMap = {
  Sparkles,
  Users,
  Tv,
  Shield,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  Eye,
  EyeOff,
  User,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  Info
};

export type IconName = keyof typeof iconMap;

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = '', size = 20 }: LucideIconProps) {
  const IconComponent = iconMap[name as IconName] || HelpCircle;
  return <IconComponent className={className} size={size} />;
}
