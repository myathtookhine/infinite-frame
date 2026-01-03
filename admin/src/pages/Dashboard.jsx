import { useAuth } from '../context/AuthContext';
import { useTheme } from "../context/ThemeContext";

const Dashboard = () => {
  const { isDark } = useTheme();
  const textColor = isDark ? "text-white" : "text-black";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const cardBg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const cardBorder = isDark ? "border-[#262626]" : "border-gray-300";
  const hoverBorder = isDark
    ? "hover:border-[#404040]"
    : "hover:border-gray-400";

  return (
    <main className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className={`font-sans text-3xl sm:text-5xl mb-2 ${textColor}`}>
          Dashboard
        </h2>
        <p className={`font-sans ${subtextColor} text-sm sm:text-lg`}>
          Welcome to the Admin Portal
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div
          className={`border-2 ${cardBorder} ${cardBg} p-6 sm:p-8 rounded-lg transition-all ${hoverBorder}`}
        >
          <div className={`font-sans text-sm ${subtextColor} mb-2`}>
            Total Artworks
          </div>
          <div className={`font-sans text-4xl sm:text-5xl ${textColor}`}>0</div>
        </div>
        <div
          className={`border-2 ${cardBorder} ${cardBg} p-6 sm:p-8 rounded-lg transition-all ${hoverBorder}`}
        >
          <div className={`font-sans text-sm ${subtextColor} mb-2`}>
            Categories
          </div>
          <div className={`font-sans text-4xl sm:text-5xl ${textColor}`}>0</div>
        </div>
        <div
          className={`border-2 ${cardBorder} ${cardBg} p-6 sm:p-8 rounded-lg transition-all ${hoverBorder}`}
        >
          <div className={`font-sans text-sm ${subtextColor} mb-2`}>
            Mediums
          </div>
          <div className={`font-sans text-4xl sm:text-5xl ${textColor}`}>0</div>
        </div>
      </div>

      {/* Zen Quote */}
      <div
        className={`border-2 ${cardBorder} ${cardBg} p-8 sm:p-12 text-center rounded-lg`}
      >
        <p className={`font-sans text-xl sm:text-2xl mb-4 ${textColor}`}>
          "Coming Soon"
        </p>
        <p className={`font-sans text-sm ${subtextColor}`}>
          — Infinite Frame
        </p>
      </div>
    </main>
  );
};

export default Dashboard;
