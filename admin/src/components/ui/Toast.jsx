import { useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  BellIcon
} from "@heroicons/react/24/outline";
import { useTheme } from "../../context/ThemeContext";

const Toast = ({ 
  message, 
  type = "neutral", 
  isVisible, 
  onClose, 
  duration = 2000 
}) => {
  const { isDark } = useTheme();

  useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const types = {
    success: {
      icon: CheckCircleIcon,
      color: "text-green-500",
      borderColor: isDark ? "border-green-500/50" : "border-green-500",
      bgColor: isDark ? "bg-[#1a1a1a]" : "bg-white"
    },
    warning: {
      icon: ExclamationTriangleIcon,
      color: "text-amber-500",
      borderColor: isDark ? "border-amber-500/50" : "border-amber-500",
      bgColor: isDark ? "bg-[#1a1a1a]" : "bg-white"
    },
    danger: {
      icon: XCircleIcon,
      color: "text-red-500",
      borderColor: isDark ? "border-red-500/50" : "border-red-500",
      bgColor: isDark ? "bg-[#1a1a1a]" : "bg-white"
    },
    info: {
      icon: InformationCircleIcon,
      color: "text-blue-500",
      borderColor: isDark ? "border-blue-500/50" : "border-blue-500",
      bgColor: isDark ? "bg-[#1a1a1a]" : "bg-white"
    },
    neutral: {
      icon: BellIcon,
      color: isDark ? "text-white" : "text-black",
      borderColor: isDark ? "border-white" : "border-black",
      bgColor: isDark ? "bg-[#1a1a1a]" : "bg-white"
    }
  };

  const { icon: Icon, color, borderColor, bgColor } = types[type] || types.neutral;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border-2 ${borderColor} ${bgColor} ${isDark ? 'text-white' : 'text-black'}`}>
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="font-sans font-bold text-sm whitespace-nowrap">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
