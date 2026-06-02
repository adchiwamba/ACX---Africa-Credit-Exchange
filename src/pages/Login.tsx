// pages/LoginPage.tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Shield, Building, User, Sparkles } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { MOCK_USERS } from '../lib/store';
import Logo from '../img/logo.png';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email);
      if (user) {
        if (rememberMe) {
          localStorage.setItem('acx_remembered_email', email);
        }
        // onLogin(user);
        navigate('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setIsLoading(false);
    }, 800);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1710149459994-480e2b5c3b16?q=80&w=1197&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-guava-dark/80" />
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-guava-orange to-guava-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl text-black tracking-tighter mb-2">Welcome Back</h1>
                <p className="text-gray-500">Sign in to access your ACX portal</p>
              </div>

              {/* Role Selector */}
              <div className="mb-6">
                <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">Login as</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole(UserRole.LENDER)}
                    className={`py-3 rounded-xl border-2 text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedRole === UserRole.LENDER 
                        ? 'border-guava-orange bg-orange-50 text-guava-orange shadow-md' 
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    Business
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(UserRole.BORROWER)}
                    className={`py-3 rounded-xl border-2 text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedRole === UserRole.BORROWER 
                        ? 'border-guava-orange bg-orange-50 text-guava-orange shadow-md' 
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Consumer
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 placeholder:text-gray-400 text-gray-600 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 placeholder:text-gray-400 text-gray-600 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-guava-orange focus:ring-guava-orange"
                    />
                    <span className="text-sm text-gray-500">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-guava-orange hover:underline font-medium">Forgot password?</a>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r cursor-pointer from-guava-orange to-guava-green text-white rounded-xl font-black text-sm uppercase tracking-wider hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400 rounded-3xl">Are you new to African Credit Exchange?</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/signup')}
                className="w-full py-3.5 border-2 cursor-pointer border-gray-200 rounded-xl font-black text-sm uppercase tracking-wider text-gray-600 hover:border-guava-orange hover:text-guava-orange hover:bg-orange-50 transition-all"
              >
                Create Account
              </button>

              {/* Powered by Guava */}
              <div className=" pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-400">Powered by</span>
                  <img src={Logo} alt="Guava Africa" className="h-6" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <Shield className="w-3 h-3 text-guava-green" />
                <p className="text-[10px] text-gray-400">Bank-grade encryption • Secure login</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center">
          <p className="text-white/40 text-xs">
            &copy; {currentYear} African Credit Exchange. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}