import React, { useState } from 'react';
import { User, Lock, ChevronRight, GraduationCap, Users, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as AuthAPI from '../services/authAPI';
import { toast } from 'react-toastify';
import logo from '../assets/nga-logo.png';

const Login = () => {
    const [role, setRole] = useState('student');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { loginUser, getDashboardPath } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await AuthAPI.login({
                username: username,
                password: password,
                role: role // Backend can use this to verify category if needed
            });

            // Log the user in via context
            loginUser(data.user, data.token);
            
            toast.success(`Welcome, ${data.user.fullName || data.user.username}`);
            
            // Redirect based on role
            const path = getDashboardPath(data.user.role);
            navigate(path, { replace: true });
        } catch (error) {
            const msg = error.response?.data?.error || "Login failed. Please check your credentials.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-bg-base py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl shadow-2xl border-2! border-gray-300!">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 animate-bounce-slow">
              <img src={logo} alt="NGA Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-[#002147] tracking-tight">Academic Portal</h2>
          <p className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400">New Grace Academy Nashik</p>
        </div>

        {/* Role Switcher */}
        <div className="flex p-1 bg-gray-100/50 rounded-xl border border-gray-200">
          <button 
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider transition-all duration-300 ${role === 'student' ? 'bg-white text-[#002147] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <GraduationCap className={`w-4 h-4 ${role === 'student' ? 'text-[#002147]' : 'text-gray-400'}`} />
            <span>Student</span>
          </button>
          <button 
            type="button"
            onClick={() => setRole('parent')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider transition-all duration-300 ${role === 'parent' ? 'bg-white text-[#002147] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Users className={`w-4 h-4 ${role === 'parent' ? 'text-[#002147]' : 'text-gray-400'}`} />
            <span>Parent</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                required 
                type="text" 
                placeholder={role === 'student' ? "Student ID / Username" : "Parent Username / Mobile"}
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#002147] focus:border-transparent outline-none transition-all font-bold" 
              />
            </div>
            
            <div className="relative animate-in slide-in-from-bottom duration-500">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#002147] focus:border-transparent outline-none transition-all font-bold" 
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-700">Remember me</label>
            </div>
            <Link to="/forgot-password" className="text-sm font-medium text-black hover:underline">Forgot details?</Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full btn-primary py-4 flex items-center justify-center space-x-2 text-lg shadow-xl ${loading ? 'opacity-70 cursor-not-allowed' : 'active:scale-98'}`}
          >
            {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <>
                    <span>Login as {role === 'student' ? 'Student' : 'Parent'}</span>
                    <ChevronRight className="w-5 h-5" />
                </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
