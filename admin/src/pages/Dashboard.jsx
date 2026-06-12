import { useState, useEffect } from 'react';
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ENDPOINTS } from '../config';
import {
  UsersIcon,
  PhotoIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import SubscriptionModal from '../components/SubscriptionModal';
import Button from '../components/ui/Button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const Dashboard = () => {
  const { isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('today'); // Default to Today as requested
  const [statsData, setStatsData] = useState({
    visitors: 0,
    artworks: 0
  });
  const [popularArtworks, setPopularArtworks] = useState([]);


  const [currentDateInfo, setCurrentDateInfo] = useState('');
  const subscriptionPlan = (user?.subscription_plan || 'free').toLowerCase();
  const isDeluxePlan = subscriptionPlan === 'deluxe';

  // Helper to get skeleton data for smooth UI and Axis visibility
  const getEmptyChartData = (period) => {
    if (period === 'today') {
      return Array.from({ length: 24 }, (_, i) => {
        const hour = i % 12 === 0 ? 12 : i % 12;
        const ampm = i < 12 ? 'AM' : 'PM';
        return { name: `${hour} ${ampm}`, views: 0 };
      });
    } else if (period === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map(d => ({ name: d, views: 0 }));
    } else if (period === 'month') {
      return Array.from({ length: 4 }, (_, i) => ({ name: `Week ${i + 1}`, views: 0 }));
    } else if (period === 'year') {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        .map(m => ({ name: m, views: 0 }));
    }
    return [];
  };

  const [chartData, setChartData] = useState(getEmptyChartData('today'));

  // Fetch Chart Data
  useEffect(() => {
    if (!user?.id) return;

    // Set skeleton immediately on filter change
    setChartData(getEmptyChartData(timeFilter));

    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await axios.get(`${ENDPOINTS.ANALYTICS || 'http://localhost:5000/api/analytics'}/activity?period=${timeFilter}&timezone=${encodeURIComponent(userTimezone)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        // console.log("Analytics API Response:", response.data);
        if (Array.isArray(response.data) && response.data.length > 0) {
          setChartData(response.data);
        } else {
          // Keep skeleton or set empty? API returns 0s for missing slots so it should be full.
          console.warn("Analytics returned empty/malformed data");
        }
      } catch (err) {
        console.error("Failed to fetch chart data", err);
      }
    };

    // Set Date Info
    const now = new Date();
    if (timeFilter === 'today') {
      setCurrentDateInfo(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    } else if (timeFilter === 'week') {
      setCurrentDateInfo(`Last 7 Days`);
    } else if (timeFilter === 'month') {
      setCurrentDateInfo(now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    } else if (timeFilter === 'year') {
      setCurrentDateInfo(now.getFullYear().toString());
    }

    fetchChartData();
  }, [timeFilter, user]);


  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        const response = await axios.get(ENDPOINTS.AUTH.ME, {

          headers: {
            'x-admin-id': user.id
          }
        });
        if (response.data.user) {
          const { page_views, artwork_count, subscription_plan, subscription_expiry } = response.data.user;
          setStatsData({
            visitors: page_views || 0,
            artworks: artwork_count || 0
          });
          updateUser({ subscription_plan, subscription_expiry });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  // Fetch Popular Artworks (Deluxe Only)
  useEffect(() => {
    if (isDeluxePlan) {
      const fetchPopular = async () => {
        try {
          const token = localStorage.getItem('adminToken');
          const response = await axios.get(`${ENDPOINTS.ANALYTICS || 'http://localhost:5000/api/analytics'}/popular`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setPopularArtworks(response.data);
        } catch (err) {
          console.error("Failed to fetch popular artworks", err);
        }
      };
      fetchPopular();
    }
  }, [user, isDeluxePlan]);

  const textColor = isDark ? "text-white" : "text-[#151416]";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const cardBg = isDark ? "bg-[#141414]" : "bg-white";
  const cardBorder = isDark ? "border-[#262626]" : "border-gray-200";
  const accentColor = isDark ? "#ffffff" : "#000000";
  const gridColor = isDark ? "#262626" : "#f0f0f0";

  /* Removed static stats array in favor of direct render */

  const chartLabelColor = isDark ? "#9CA3AF" : "#4B5563";

  // Calculate ticks for Y-Axis (Increment by 10)
  const maxViews = Math.max(...chartData.map(d => d.views || 0), 0);
  const tickStep = 10;
  // Determine max value for axis (at least 10, and multiple of 10)
  const yAxisMax = Math.max(Math.ceil(maxViews / tickStep) * tickStep, 10);

  const customTicks = [];
  // Safety: Only generate strict 10-step ticks if reasonable count (e.g. up to 200)
  // Otherwise revert to standard auto behavior (or larger steps) to avoid clutter
  if (yAxisMax <= 200) {
    for (let i = 0; i <= yAxisMax; i += tickStep) {
      customTicks.push(i);
    }
  }
  // If > 200, we leave customTicks empty and let Recharts handle it (or could implement dynamic steps)


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
            Total Page Visits
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
            Total Artworks
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
            <p className={`text-sm ${subtextColor}`}>Total views over selected period • <span className="font-semibold text-theme-accent">{currentDateInfo}</span></p>
          </div>

          <div className={`flex p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            {['today', 'week', 'month', 'year'].map((filter) => (
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

        <div className="w-full min-w-0" style={{ height: 350, position: 'relative', marginLeft: -36 }}>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  axisLine={true}
                  tickLine={true}
                  tick={{ fill: chartLabelColor, fontSize: 12, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis
                  axisLine={true}
                  tickLine={true}
                  tick={{ fill: chartLabelColor, fontSize: 12, fontWeight: 'bold' }}
                  ticks={customTicks.length > 0 ? customTicks : undefined}
                  domain={[0, 'auto']}
                  allowDecimals={false}
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
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                />
                <Bar
                  dataKey="views"
                  radius={[4, 4, 0, 0]}
                  fill={accentColor}
                  animationDuration={1500}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Popular Artworks (Deluxe Only) */}
      {isDeluxePlan && (
        <section className={`border-2 ${cardBorder} ${cardBg} p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700`}>
          <div className="mb-6">
            <h3 className={`text-xl font-bold ${textColor}`}>Popular Artworks</h3>
            <p className={`text-sm ${subtextColor}`}>Top performing pieces based on gallery views</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {popularArtworks.map((artwork) => (
              <div key={artwork.id} className="space-y-3 group">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-theme/10">
                  <img
                    src={artwork.main_image}
                    alt={artwork.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase tracking-widest bg-theme/80 px-3 py-1.5 rounded-full">
                      {artwork.views} Views
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className={`text-sm font-bold truncate ${textColor}`}>{artwork.name}</h4>
                  <p className={`text-xs font-mono font-bold text-theme`}>
                    {artwork.price ? `${artwork.price.toLocaleString()} ${artwork.currency}` : 'Price on request'}
                  </p>
                </div>
              </div>
            ))}
            {popularArtworks.length === 0 && (
              <div className="col-span-full py-12 text-center opacity-50">
                <p className={`text-sm ${textColor}`}>No data available yet</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Upgrade Banner for Non-Deluxe */}
      {['free', 'pro'].includes(subscriptionPlan) && (
        <section className={`relative overflow-hidden p-8 border-2 border-dashed rounded-2xl ${isDark ? 'border-theme/30 bg-theme/5' : 'border-theme/20 bg-theme/5'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className={`text-lg font-bold ${textColor}`}>Unlock Advanced Analytics</h3>
              <p className={`text-sm opacity-70 ${textColor}`}>Get insights into popular artworks, visitor trends, and more with the Deluxe plan.</p>
            </div>
            <Button
              onClick={() => navigate('/subscription')}
            >
              Upgrade to Deluxe
            </Button>
          </div>
        </section>
      )}

      <SubscriptionModal />
    </main>
  );
};

export default Dashboard;

