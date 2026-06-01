import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Users, Settings, LineChart, 
  GraduationCap, Calculator, Library,
  ShieldCheck, ClipboardCheck, BookOpen, Truck,
  Target, Heart, Star
} from 'lucide-react';

const LandingPage = () => {
  const modules = [
    {
      title: "Student Management",
      icon: Users,
      desc: "Comprehensive database for student records, admissions, and academic history.",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Attendance Tracking",
      icon: ClipboardCheck,
      desc: "Real-time attendance monitoring for students and staff with automated alerts.",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Exams & Results",
      icon: GraduationCap,
      desc: "Seamless exam scheduling, mark entry, and automated result generation.",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      title: "Fee & Finance",
      icon: Calculator,
      desc: "Automated fee collection, receipt generation, and detailed financial reports.",
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Library Management",
      icon: Library,
      desc: "Digital cataloging with issue/return tracking and fine management.",
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      title: "Staff & Payroll",
      icon: ShieldCheck,
      desc: "Manage educator profiles, leave requests, and payroll processing.",
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "Transport & Hostel",
      icon: Truck,
      desc: "Route management and room allocations with real-time tracking.",
      color: "text-cyan-600",
      bg: "bg-cyan-50"
    },
    {
      title: "Reports & Analytics",
      icon: LineChart,
      desc: "Advanced data visualization for performance and administrative oversight.",
      color: "text-teal-600",
      bg: "bg-teal-50"
    }
  ];

  const quickLinks = [
    { role: "Administrator", path: "/dashboard/admin", icon: Settings },
    { role: "Principal", path: "/dashboard/principle", icon: LineChart },
    { role: "Teacher", path: "/dashboard/teacher", icon: BookOpen },
    { role: "Accountant", path: "/dashboard/accountant", icon: Calculator },
    { role: "Librarian", path: "/dashboard/librarian", icon: Library }
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* Hero Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white shadow-sm border border-slate-200 mb-8">
          <img src="https://newgraceacademy.in/assets/front/img/logo/nga-logo.png" className="w-5 h-5 object-contain" alt="NGA Logo" />
          <span className="text-[#001736] font-bold text-xs uppercase tracking-widest">New Grace Academy Portal</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-[#001736] leading-tight mb-6 tracking-tight">
          Academic <span className="text-[#FFB606] italic">Governance.</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          The unified management ecosystem for New Grace Academy. Empowering educators and administrators with precision tools for institutional excellence.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/administration" className="bg-[#001736] text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg">
            Manage Institution <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="bg-white border-2 border-slate-200 text-[#001736] px-8 py-4 rounded-xl font-bold hover:border-[#001736] transition-colors flex items-center gap-2">
            Generate Reports <LineChart className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Portal Quick Access */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Select Department Portal</p>
          <div className="flex flex-wrap justify-center gap-4">
            {quickLinks.map((link, idx) => (
              <Link 
                key={idx}
                to={link.path}
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-6 py-4 rounded-xl hover:border-[#001736] hover:bg-slate-100 hover:-translate-y-1 transition-all text-[#001736] group shadow-sm"
              >
                <link.icon className="w-5 h-5 text-[#FFB606] group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm tracking-wide">{link.role}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-black text-[#001736]">Administrative Powerhouse</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">Streamlined operations tailored for New Grace Academy's unique academic workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((mod, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-[#FFB606] hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${mod.bg} group-hover:-translate-y-2 transition-transform`}>
                <mod.icon className={`w-7 h-7 ${mod.color}`} />
              </div>
              <h3 className="text-xl font-black text-[#001736] mb-3 tracking-tight">{mod.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed grow mb-8 font-medium">
                {mod.desc}
              </p>
              <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-auto">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Operational Status</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars Summary */}
      <section className="py-24 px-6 bg-[#001736] text-white text-center rounded-t-[3rem] mt-12 mx-auto max-w-[95%]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-[#FFB606]" />
              </div>
              <h4 className="text-2xl font-black text-[#FFB606] mb-2 tracking-tight">Imagination</h4>
              <p className="text-slate-400 text-sm font-medium">Nurturing creative governance.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-[#FFB606]" />
              </div>
              <h4 className="text-2xl font-black text-[#FFB606] mb-2 tracking-tight">Investigation</h4>
              <p className="text-slate-400 text-sm font-medium">Data-driven decision making.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-[#FFB606]" />
              </div>
              <h4 className="text-2xl font-black text-[#FFB606] mb-2 tracking-tight">Interaction</h4>
              <p className="text-slate-400 text-sm font-medium">Seamless staff collaboration.</p>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/10">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
               Official New Grace Academy Administrative Portal &copy; 2026
             </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
