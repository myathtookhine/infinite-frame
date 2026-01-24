import { useState, useEffect } from 'react';
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from 'axios';
import {
  UsersIcon,
  PhotoIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const mockData = {
  week: [
    { name: 'Mon', views: 120 },
    { name: 'Tue', views: 300 },
    { name: 'Wed', views: 200 },
    { name: 'Thu', views: 450 },
    { name: 'Fri', views: 400 },
    { name: 'Sat', views: 700 },
    { name: 'Sun', views: 500 },
  ],
  month: [
    { name: 'Week 1', views: 1200 },
    { name: 'Week 2', views: 1800 },
    { name: 'Week 3', views: 1400 },
    { name: 'Week 4', views: 2200 },
  ],
  year: [
    { name: 'Jan', views: 5000 },
    { name: 'Feb', views: 6500 },
    { name: 'Mar', views: 5800 },
    { name: 'Apr', views: 8000 },
    { name: 'May', views: 7200 },
    { name: 'Jun', views: 9000 },
    { name: 'Jul', views: 8500 },
    { name: 'Aug', views: 10000 },
    { name: 'Sep', views: 9200 },
    { name: 'Oct', views: 11000 },
    { name: 'Nov', views: 10500 },
    { name: 'Dec', views: 13000 },
  ],
};

const Dashboard = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('week');
  const [statsData, setStatsData] = useState({
    visitors: 0,
    artworks: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        const response = await axios.get('https://infinite-frame-server.onrender.com/api/auth/me', {
          headers: {
            'x-admin-id': user.id
          }
        });
        if (response.data.user) {
          setStatsData({
            visitors: response.data.user.page_views || 0,
            artworks: response.data.user.artwork_count || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  const textColor = isDark ? "text-white" : "text-[#151416]";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const cardBg = isDark ? "bg-[#141414]" : "bg-white";
  const cardBorder = isDark ? "border-[#262626]" : "border-gray-200";
  const accentColor = isDark ? "#ffffff" : "#000000";
  const gridColor = isDark ? "#262626" : "#f0f0f0";

  /* Removed static stats array in favor of direct render */

  const chartLabelColor = isDark ? "#9CA3AF" : "#4B5563";

  return (
    <main className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>Dashboard</h1>
        <p className={`font-sans ${subtextColor} text-sm sm:text-lg`}>
          Overview of your gallery's performance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`border-2 ${cardBorder} ${cardBg} p-6 rounded-2xl transition-all duration-300 hover:shadow-xl group`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'} group-hover:scale-110 transition-transform duration-300`}>
              <UsersIcon className={`h-6 w-6 ${textColor}`} />
              </div>
            </div>
            <div className={`font-sans text-sm ${subtextColor} font-bold uppercase tracking-widest mb-1`}>
            Visitors
          </div>
          <div className={`font-sans text-4xl font-black ${textColor}`}>
            {statsData.visitors}
          </div>
        </div>

        <div className={`border-2 ${cardBorder} ${cardBg} p-6 rounded-2xl transition-all duration-300 hover:shadow-xl group`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'} group-hover:scale-110 transition-transform duration-300`}>
              <PhotoIcon className={`h-6 w-6 ${textColor}`} />
            </div>
          </div>
          <div className={`font-sans text-sm ${subtextColor} font-bold uppercase tracking-widest mb-1`}>
            Artworks
            </div>
            <div className={`font-sans text-4xl font-black ${textColor}`}>
            {statsData.artworks}
            </div>
        </div>

        <div className={`border-2 ${cardBorder} ${cardBg} p-6 rounded-2xl transition-all duration-300 hover:shadow-xl group opacity-60`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'} group-hover:scale-110 transition-transform duration-300`}>
              <CalendarDaysIcon className={`h-6 w-6 ${textColor}`} />
            </div>
          </div>
          <div className={`font-sans text-sm ${subtextColor} font-bold uppercase tracking-widest mb-1`}>
            Exhibitions
          </div>
          <div className={`font-sans text-md font-bold ${textColor}`}>
            Coming soon feature...
          </div>
        </div>
      </div>

      {/* Graph Section */}
      <div className={`border-2 ${cardBorder} ${cardBg} p-6 sm:p-8 rounded-2xl`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className={`text-xl font-bold ${textColor}`}>Visitor Activity</h3>
            <p className={`text-sm ${subtextColor}`}>Total views over selected period</p>
          </div>

          <div className={`flex p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            {['week', 'month', 'year'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-all duration-200 ${timeFilter === filter
                  ? (isDark ? 'bg-white text-black' : 'bg-[#151416] text-white')
                  : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData[timeFilter]}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: chartLabelColor, fontSize: 12, fontWeight: 'bold' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: chartLabelColor, fontSize: 12, fontWeight: 'bold' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  border: `2px solid ${isDark ? '#262626' : '#f0f0f0'}`,
                  borderRadius: '12px',
                  padding: '10px'
                }}
                labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', marginBottom: '4px' }}
                itemStyle={{ color: isDark ? '#fff' : '#000' }}
                cursor={{ stroke: gridColor, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke={accentColor}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorViews)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
