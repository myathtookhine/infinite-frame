import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  UserIcon, 
  LockClosedIcon, 
  EnvelopeIcon, 
  KeyIcon, 
  CheckCircleIcon,
  ArrowLeftIcon,
  SunIcon, 
  MoonIcon 
} from '@heroicons/react/24/outline';

const Register = () => {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP, 3: Success
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDark, toggleTheme } = useTheme();
  const { sendOtp, register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only 1 digit
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.username || !formData.email || !formData.password) {
        setError('Please fill all fields!');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match!');
        return;
      }
      
      setLoading(true);
      const result = await sendOtp(formData.email);
      setLoading(false);

      if (result.success) {
        setStep(2);
      } else {
        setError(result.error);
      }
    } else if (step === 2) {
      const otpCode = otp.join('');
      if (otpCode.length < 6) {
        setError('Please enter the 6-digit OTP!');
        return;
      }

      setLoading(true);
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        otp: otpCode
      });
      setLoading(false);

      if (result.success) {
        setStep(3);
      } else {
        setError(result.error);
      }
    }
  };

  const bgColor = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const panelBg = isDark ? 'bg-[#141414]' : 'bg-white';
  const panelBorder = isDark ? "border-[#262626]" : "border-black";
  const headingColor = isDark ? "text-white" : "text-black";
  const footerColor = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`min-h-screen ${bgColor} flex items-center justify-center p-5 relative overflow-hidden transition-colors duration-300`}>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="w-16 h-16 border-4 border-t-white border-white/20 rounded-full animate-spin mb-4"></div>
          <h2 className="text-white text-xl font-sans tracking-widest animate-pulse">Processing...</h2>
        </div>
      )}

      <div className="w-full max-w-lg">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
            className={`flex items-center gap-2 ${footerColor} hover:text-black dark:hover:text-white transition-colors cursor-pointer`}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="font-sans text-sm">Back</span>
          </button>
          
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md transition-colors cursor-pointer ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}
          >
            {isDark ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
          </button>
        </div>

        <div className={`border-2 ${panelBorder} ${panelBg} p-8 rounded-md transition-shadow hover:shadow-xl`}>
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className={`font-sans text-3xl mb-2 text-left ${headingColor}`}>Create Account</h2>
              <p className={`${footerColor} text-sm mb-8`}>Step 1: Your essential details</p>
              
              <form onSubmit={handleNextStep} className="space-y-5">
                <Input
                  id="username"
                  label="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  icon={UserIcon}
                />
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  icon={EnvelopeIcon}
                />
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  icon={LockClosedIcon}
                />
                <Input
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Repeat your password"
                  icon={LockClosedIcon}
                />

                {error && <div className="text-red-500 text-sm font-sans mt-2">{error}</div>}

                <Button type="submit" variant="primary" size="lg" block>
                  Next Step
                </Button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
              <div className="mb-6 flex justify-center">
                <div className={`p-4 rounded-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <KeyIcon className={`h-10 w-10 ${headingColor}`} />
                </div>
              </div>
              <h2 className={`font-sans text-3xl mb-2 ${headingColor}`}>Verify Email</h2>
              <p className={`${footerColor} text-sm mb-8`}>We sent a 6-digit code to {formData.email}</p>

              <div className="flex justify-between gap-2 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all
                      ${isDark ? 'bg-transparent border-[#262626] text-white' : 'bg-white border-black text-black'}`}
                  />
                ))}
              </div>

              {error && <div className="text-red-500 text-sm font-sans mb-4">{error}</div>}

              <Button onClick={handleNextStep} variant="primary" size="lg" block>
                Verify & Register
              </Button>
              
              <p className={`mt-6 text-xs ${footerColor}`}>
                Didn't receive the code?{' '}
                <button type="button" className="font-bold hover:underline">Resend OTP</button>
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in zoom-in duration-500 text-center py-4">
              <div className="mb-6 flex justify-center">
                <CheckCircleIcon className="h-20 w-20 text-green-500 animate-bounce" />
              </div>
              <h2 className={`font-sans text-3xl mb-2 ${headingColor}`}>Registration Successful!</h2>
              <p className={`${footerColor} text-sm mb-8`}>
                Welcome to Infinite Frame, <strong>{formData.username}</strong>. 
                Your account is now ready to use.
              </p>
              
              <Button onClick={() => navigate('/login')} variant="primary" size="lg" block>
                Go to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
