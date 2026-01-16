import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { UserIcon, LockClosedIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password!');
      return;
    }

    setLoading(true);
    const result = await login(username, password);

    if (result.success) {
      // Login အောင်မြင်ရင် 2 seconds စောင့်ခိုင်းမယ်
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 800);
    } else {
      setLoading(false);
      setError(result.error);
    }
  };

  const bgColor = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const rightPanelBg = isDark ? 'bg-[#141414]' : 'bg-white';
  const rightPanelBorder = isDark ? "border-[#262626]" : "border-black";
  const headingColor = isDark ? "text-white" : "text-black";
  const footerColor = isDark ? "text-gray-500" : "text-gray-500";

  return (
    <div
      className={`min-h-screen ${bgColor} flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-y-auto`}
    >
      {/* Full Page Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="flex flex-col items-center">
            {/* Spinning Loader */}
            <div className="w-16 h-16 border-4 border-t-white border-white/20 rounded-full animate-spin mb-4"></div>
            <h2 className="text-white text-2xl font-sans tracking-widest animate-pulse">
              Signing In...
            </h2>
            <p className="text-gray-400 text-sm mt-2 font-sans">
              Authenticating with Infinite Frame Server
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Info Panel */}
        <div className="border-2 border-black p-8 h-full relative overflow-hidden bg-black text-white rounded-md transition-shadow hover:shadow-md">
          <div className="relative z-10 h-full flex flex-col">
            {/* Top-left branding */}
            <div className="text-left py-6 md:py-0">
              <h1 className="font-sans text-4xl sm:text-5xl md:text-7xl mb-0 leading-tight">
                <span className="glitch" data-text="Infinite">
                  Infinite
                </span>
              </h1>
              <h1 className="font-sans text-4xl sm:text-5xl md:text-7xl mb-4 leading-tight">
                <span className="glitch glitch--delay" data-text="Frame">
                  Frame
                </span>
              </h1>
              <p className="font-sans text-sm text-gray-300 mb-6">
                Admin Portal
              </p>
            </div>
          </div>
        </div>

        {/* Right Login Panel */}
        <div
          className={`border-2 ${rightPanelBorder} ${rightPanelBg} p-6 sm:p-8 md:p-10 h-full flex items-center rounded-md relative`}
        >
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`absolute top-4 right-4 p-2 rounded-md transition-colors cursor-pointer ${
              isDark
                ? "hover:bg-white/10 text-white"
                : "hover:bg-black/5 text-black"
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <SunIcon className="h-6 w-6" />
            ) : (
              <MoonIcon className="h-6 w-6" />
            )}
          </button>

          <div className="w-full animate-in fade-in slide-in-from-left-8 duration-700">
            <h2 className={`font-sans text-3xl mb-8 text-left ${headingColor}`}>
              Sign In
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <Input
                id="username"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                icon={UserIcon}
              />

              {/* Password Field */}
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                icon={LockClosedIcon}
              />

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 text-sm font-sans rounded">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" variant="primary" size="lg" block disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="text-center mt-4">
                <p className={`font-sans text-xs ${footerColor}`}>
                  Don't have an account? Please register now!
                </p>
              </div>
              {/* Register Button - Full Width Outline */}
              <Button
                type="button" 
                variant="secondary"
                size="lg"
                block
                onClick={() => navigate('/register')}
              >
                Register Account
              </Button>



              {/* Default Credentials Hint */}
              {/* <div
                className={`text-center text-xs ${footerColor} font-sans mt-4`}
              >
                Default: admin01 / 123456
              </div> */}
            </form>

            {/* Footer */}
            <div className="text-center mt-12">
              <p className={`font-sans text-xs ${footerColor}`}>
                @2026 Infinite Frame. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
