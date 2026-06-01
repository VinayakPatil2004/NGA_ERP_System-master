import React from 'react';
import { UserPlus, Mail, Lock, Phone, User, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-bg-base py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-6">
             <img src="https://newgraceacademy.in/assets/front/img/logo/nga-logo.png" alt="NGA Logo" className="w-14 h-14 object-contain" />
          </div>
          <h2 className="text-3xl font-black text-[#002147] tracking-tighter">Join New Grace</h2>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-[#D83030]">Academic Registration</p>
        </div>
        <form className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-secondary transition-all" />
            <input type="text" placeholder="Last Name" className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-secondary transition-all" />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="email" placeholder="Email Address" className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-secondary transition-all" />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="tel" placeholder="Mobile Number" className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-secondary transition-all" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="password" placeholder="Create Password" className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-secondary transition-all" />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-secondary appearance-none transition-all">
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          
          <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center space-x-2 mt-4">
            <span>Create Account</span>
            <UserPlus className="w-4 h-4" />
          </button>
        </form>
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">Already have an account? <Link to="/login" className="text-secondary font-bold hover:underline">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
