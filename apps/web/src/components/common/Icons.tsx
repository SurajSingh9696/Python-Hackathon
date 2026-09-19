import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  FileText,
  X,
  Clock,
  LifeBuoy,
  Mic,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ExternalLink,
  LogOut,
  Pencil,
  Circle,
  Zap,
  Check,
  MessageSquare,
} from 'lucide-react';

// Re-export Lucide components directly
export {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  FileText,
  X,
  Clock,
  LifeBuoy,
  Mic,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ExternalLink,
  LogOut,
  Pencil,
  Circle,
  Zap,
  Check,
  MessageSquare,
};

// Backwards-compatible wrappers mapped cleanly to Lucide
export function ShieldCheckIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <ShieldCheck size={size} className={className} />;
}

export function CheckCircleIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <CheckCircle2 size={size} className={className} />;
}

export function AlertTriangleIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <AlertTriangle size={size} className={className} />;
}

export function InfoIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <Info size={size} className={className} />;
}

export function ArrowRightIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <ArrowRight size={size} className={className} />;
}

export function ThumbUpIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <ThumbsUp size={size} className={className} />;
}

export function ThumbDownIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <ThumbsDown size={size} className={className} />;
}

export function SparklesIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <Sparkles size={size} className={className} />;
}

export function DocumentTextIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <FileText size={size} className={className} />;
}

export function XMarkIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <X size={size} className={className} />;
}

export function ClockIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <Clock size={size} className={className} />;
}

export function SupportIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <LifeBuoy size={size} className={className} />;
}

export function MicrophoneIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <Mic size={size} className={className} />;
}

export function SpeakerWaveIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <Volume2 size={size} className={className} />;
}

export function SpeakerXMarkIcon({ className = 'w-4 h-4', size = 16 }: { className?: string; size?: number }) {
  return <VolumeX size={size} className={className} />;
}
