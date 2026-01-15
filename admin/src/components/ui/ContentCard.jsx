import { useTheme } from "../../context/ThemeContext";

const ContentCard = ({ title, children, className = "", subtitle }) => {
  const { isDark } = useTheme();

  const textColor = isDark ? "text-white" : "text-black";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const cardBg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const cardBorder = isDark ? "border-[#262626]" : "border-gray-300";
  const hoverBorder = isDark
    ? "shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
    : "shadow-[0_8px_30px_rgb(0,0,0,0.12)]";

  return (
    <div
      className={`border-2 ${cardBorder} ${cardBg} p-6 sm:p-8 rounded-lg mb-6 transition-all duration-300 hover:${hoverBorder} ${className}`}
    >
      {title && (
        <h3 className={`font-sans font-bold text-2xl sm:text-2xl mb-1 ${textColor}`}>
          {title}
        </h3>
      )}
      {subtitle && (
        <p className={`font-sans ${subtextColor} text-sm mb-6`}>
          {subtitle}
        </p>
      )}
      <div className={subtitle ? "" : "mt-4"}>
        {children}
      </div>
    </div>
  );
};

export default ContentCard;
