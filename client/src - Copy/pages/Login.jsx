import React, { useState } from 'react';
import { User, Lock, Mail, ChevronRight, GraduationCap, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [role, setRole] = useState('student'); // 'student' or 'parent'
    const navigate = useNavigate();
    const { loginUser, getDashboardPath } = useAuth();

    const handleLogin = (e) => {
        e.preventDefault();
        
        // Simulating authentication by creating a mock user based on chosen role
        const mockUser = {
            id: 1,
            username: role === 'student' ? 'rahul_sharma' : 'parent_user',
            role: role,
            fullName: role === 'student' ? 'Rahul Sharma' : 'Parent User'
        };
        
        const mockToken = "mock_academic_token_" + Date.now();
        
        // Log the user in via context
        loginUser(mockUser, mockToken);
        
        // Redirect based on role
        const path = getDashboardPath(role);
        navigate(path, { replace: true });
    };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-bg-base py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl shadow-2xl border-2! border-gray-300!">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 animate-bounce-slow">
              <img src="https://newgraceacademy.in/assets/front/img/logo/nga-logo.png" alt="NGA Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-[#002147] tracking-tight">Academic Portal</h2>
          <p className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400">New Grace Academy Nashik</p>
        </div>

        {/* Role Switcher */}
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button 
            onClick={() => setRole('student')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg font-bold transition-all ${role === 'student' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <User className="w-4 h-4" />
            <span>Student</span>
          </button>
          <button 
            onClick={() => setRole('parent')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg font-bold transition-all ${role === 'parent' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users className="w-4 h-4" />
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
                placeholder="Student ID" 
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all" 
              />
            </div>
            
            {role === 'student' ? (
              <div className="relative animate-in slide-in-from-right duration-300">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  required 
                  type="password" 
                  placeholder="Password" 
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all" 
                />
              </div>
            ) : (
              <div className="relative animate-in slide-in-from-left duration-300">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  required 
                  type="email" 
                  placeholder="Parent Email Address" 
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all" 
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-700">Remember me</label>
            </div>
            <a href="#" className="text-sm font-medium text-secondary hover:underline">Forgot details?</a>
          </div>

          <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center space-x-2 text-lg">
            <span>Login as {role === 'student' ? 'Student' : 'Parent'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
