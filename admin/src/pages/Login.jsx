import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    const result = login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-5">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Info Panel */}
        <div className="border-2 p-8 h-full relative overflow-hidden bg-black text-white rounded-md transition-shadow hover:shadow-md">
          <div className="relative z-10 h-full flex flex-col">
            {/* Top-left branding */}
            <div className="text-left">
              <h1 className="font-sans text-7xl  text-white mb-0"><span className="glitch" data-text="Infinite">Infinite</span></h1>
              <h1 className="font-sans text-7xl text-white mb-4"><span className="glitch glitch--delay" data-text="Frame">Frame</span></h1>
              <p className="font-sans text-sm text-gray-300 mb-6">
                Admin Portal
              </p>
            </div>
          </div>
        </div>

        {/* Right Login Panel */}
        <div className="border-2 border-black p-8 h-full flex items-center rounded-md transition-shadow hover:shadow-md">
          <div className="w-full">
            <h2 className="font-sans text-3xl mb-8 text-left">Sign In</h2>

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
              <Button type="submit" variant="primary" size="lg" block>
                Sign In
              </Button>

              {/* Default Credentials Hint */}
              <div className="text-center text-xs text-gray-500 font-sans mt-4">
                Default: admin / 123123
              </div>
            </form>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="font-sans text-sm text-gray-500">
                @2024 Infinit Frame. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
