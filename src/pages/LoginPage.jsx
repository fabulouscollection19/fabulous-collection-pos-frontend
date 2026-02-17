import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Store, ShieldCheck, Cpu } from 'lucide-react';
import { Button, Input, Card } from '../components/UIComponents';

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'tailor'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLocalLogin, setShowLocalLogin] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      if (data.success) {
        localStorage.setItem('pos_token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('pos_refresh_token', data.refreshToken);
        }

        onLogin('super-admin', data.user.email);
      } else {
        setError(data.error || 'Login failed');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. System is currently offline.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl shadow-black/20 mb-6 group transition-transform hover:rotate-3">
            <Store className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fabulous Collection</h1>
          <p className="text-slate-400 mt-2 font-medium">Retail Operations Hub</p>
        </div>

        <Card className="shadow-2xl border-white/5 bg-white/95 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                {error}
              </motion.div>
            )}

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="name@business.com"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  className="w-full pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-12 text-base shadow-lg shadow-indigo-600/20"
            >
              Secure Login
            </Button>
          </form>
        </Card>

        <p className="text-center text-slate-500 text-xs mt-8 font-medium">
          &copy; 2025 Fabulous Collection POS &bull; Internal Use Only
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
