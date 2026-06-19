import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import logoImage from '../../assests/logo.jpeg';
import Footer from '../../components/Footer';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate("/");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDemoCredential = (userId) => {
    if (userId === 'admin') {
      setUsername('admin');
      setPassword('123');
    } else if (userId === 'user') {
      setUsername('user1');
      setPassword('123');
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Center Content */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="min-h-full flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-[340px] sm:max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 space-y-3 sm:space-y-4">

          {/* Logo Section */}
          <div className="flex flex-col items-center space-y-1 sm:space-y-2">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
              <img src={logoImage} alt="App Logo" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
            </div>
            <div className="text-center space-y-0.5">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Leads To Order System</h1>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-2.5 sm:space-y-3" onSubmit={handleSubmit}>
            {error && (
              <div className="p-2 sm:p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs sm:text-sm text-center font-medium">
                {error}
              </div>
            )}

            {/* User ID Input */}
            <div className="space-y-1">
              <label htmlFor="username" className="text-[11px] sm:text-sm font-semibold text-gray-700">
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-4 py-1.5 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-xs sm:text-sm"
                  placeholder="Enter user ID"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-[11px] sm:text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-12 py-1.5 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-xs sm:text-sm"
                  placeholder="Enter password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-1.5 sm:py-2.5 px-4 text-xs sm:text-base font-bold text-white rounded-lg focus:outline-none focus-visible:ring-sky-600/20 bg-sky-600 hover:bg-sky-700 shadow-sm transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mt-3 sm:mt-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500 font-semibold text-[11px] sm:text-xs">Demo Credentials</span>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 sm:p-3 mt-3 sm:mt-4">
            <p className="text-[9px] sm:text-xs font-semibold text-gray-500 text-center mb-1 sm:mb-1.5 uppercase tracking-wider">Quick Login Options</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleDemoCredential('admin')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-1.5 sm:p-3 bg-white border border-gray-200 hover:border-sky-500 hover:shadow-md hover:bg-sky-50 rounded-lg transition-all group"
              >
                <span className="font-bold text-gray-800 text-[11px] sm:text-sm group-hover:text-sky-700">Admin</span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 font-mono mt-0.5">ID: admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoCredential('user')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-1.5 sm:p-3 bg-white border border-gray-200 hover:border-sky-500 hover:shadow-md hover:bg-sky-50 rounded-lg transition-all group"
              >
                <span className="font-bold text-gray-800 text-[11px] sm:text-sm group-hover:text-sky-700">User</span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 font-mono mt-0.5">ID: user1</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Footer at Bottom */}
      <div className="w-full bg-white border-t border-slate-200">
        <Footer />
      </div>
    </div>
  );
};

export default Login;
