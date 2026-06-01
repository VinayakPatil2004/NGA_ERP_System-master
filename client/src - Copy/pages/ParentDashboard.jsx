import React, { useState } from 'react';
import { 
  Users, CreditCard, ClipboardCheck, BarChart3, 
  Bell, MessageSquare, Headphones, FileText,
  DollarSign, CheckCircle, AlertCircle, TrendingUp,
  Download, Send, User, Settings, LogOut,
  ChevronRight, Calendar, Info, Search, GraduationCap,
  Printer, Clock, LayoutDashboard
} from 'lucide-react';

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [timetableType, setTimetableType] = useState('regular'); // 'regular' or 'exam'
  const [attendanceMonth, setAttendanceMonth] = useState('March');
  const [attendanceYear, setAttendanceYear] = useState('2026');

  const menuItems = [
    { icon: Users, label: "Overview" },
    { icon: Calendar, label: "Timetable" },
    { icon: ClipboardCheck, label: "Attendance" },
    { icon: BarChart3, label: "Exam Results" },
    { icon: CreditCard, label: "Fee Portal" },
    { icon: MessageSquare, label: "Teacher Connect" },
    { icon: Bell, label: "Alerts" }
  ];

  const examData = [
    { date: "Mar 20, 2026", sub: "Mathematics", time: "09:00 - 12:00", room: "Hall A", type: "Final" },
    { date: "Mar 22, 2026", sub: "Science", time: "09:00 - 12:00", room: "Hall B", type: "Final" },
    { date: "Mar 24, 2026", sub: "English", time: "09:00 - 12:00", room: "Hall A", type: "Final" },
    { date: "Mar 26, 2026", sub: "History", time: "09:00 - 12:00", room: "Hall C", type: "Final" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Student Profile Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-8 rounded-3xl shadow-sm border-t-4 border-secondary flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="w-24 h-24 bg-gray-100 rounded-3xl shrink-0 overflow-hidden ring-4 ring-secondary/10">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul" alt="student" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-4 text-center md:text-left">
                  <div>
                    <h3 className="text-2xl font-black text-primary">Rahul Sharma</h3>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Grade 10-A • ID: STU2026001</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="px-4 py-2 bg-bg-base rounded-xl border border-gray-300 text-center">
                      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Attendance</div>
                      <div className="text-lg font-bold text-secondary">94%</div>
                    </div>
                    <div className="px-4 py-2 bg-bg-base rounded-xl border border-gray-300 text-center">
                      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Avg. Marks</div>
                      <div className="text-lg font-bold text-success">88%</div>
                    </div>
                  </div>
                  <button className="text-secondary font-bold text-sm hover:underline flex items-center gap-1 mx-auto md:mx-0">
                    View Full Profile <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="glass-card p-8 rounded-3xl shadow-sm border border-gray-300">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-secondary" /> Recent Performance
                </h3>
                <div className="space-y-4">
                  {[
                    { subject: "Mathematics", score: "98/100", status: "Excellent" },
                    { subject: "Science", score: "82/100", status: "Good" },
                    { subject: "English", score: "90/100", status: "Excellent" }
                  ].map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-bg-base rounded-2xl hover:bg-white border border-transparent hover:border-secondary/10 transition-all group">
                      <div>
                        <div className="font-bold text-primary">{res.subject}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{res.status}</div>
                      </div>
                      <div className="text-xl font-black text-secondary group-hover:scale-110 transition-transform">{res.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary p-6 rounded-3xl text-white group cursor-pointer hover:shadow-xl transition-all border border-white/5">
                <CreditCard className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-bold mb-2">Pay Fees</h4>
                <p className="text-white/60 text-sm mb-4">Current balance: ₹12,400</p>
                <button className="w-full py-2 bg-accent text-primary rounded-xl font-black text-xs">PAY NOW</button>
              </div>
              <div className="bg-secondary p-6 rounded-3xl text-white group cursor-pointer hover:shadow-xl transition-all border border-white/5">
                <MessageSquare className="w-8 h-8 text-white mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-bold mb-2">Teacher Connect</h4>
                <p className="text-white/60 text-sm mb-4">Request meeting or chat</p>
                <div className="flex -space-x-3 mb-4">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-secondary bg-gray-300"></div>)}
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm group cursor-pointer border border-gray-300 hover:border-secondary transition-all">
                <Bell className="w-8 h-8 text-secondary mb-4 group-hover:rotate-12 transition-transform" />
                <h4 className="text-lg font-bold text-primary mb-2">Notice Board</h4>
                <p className="text-gray-400 text-sm mb-4">3 new announcements</p>
                <button className="text-secondary font-bold text-xs hover:underline">View Notices</button>
              </div>
            </div>
          </div>
        );
      case 'Timetable':
        return (
          <div className="glass-card p-8 rounded-3xl shadow-sm border border-gray-300 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-black text-primary">Academic Schedule</h2>
                <div className="flex mt-3 p-1 bg-bg-base rounded-2xl w-fit border border-gray-300/30">
                  <button 
                    onClick={() => setTimetableType('regular')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timetableType === 'regular' ? 'bg-white shadow-md text-secondary' : 'text-gray-400 hover:text-primary'}`}
                  >
                    Class Table
                  </button>
                  <button 
                    onClick={() => setTimetableType('exam')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timetableType === 'exam' ? 'bg-white shadow-md text-secondary' : 'text-gray-400 hover:text-primary'}`}
                  >
                    Exam Table
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-bg-base text-primary rounded-2xl font-bold text-sm border border-gray-300 hover:bg-white transition-colors">
                  <Printer className="w-4 h-4 text-secondary" /> Print Schedule
                </button>
              </div>
            </div>

            {timetableType === 'regular' ? (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-bg-base text-gray-400 text-xs font-black border-b border-gray-300">
                      <th className="p-6 text-left uppercase tracking-tighter">Time Slot</th>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <th key={d} className="p-6 text-left uppercase tracking-tighter">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { time: "08:30 - 09:30", sub: "Math", bg: "bg-blue-50 text-blue-700" },
                      { time: "09:30 - 10:30", sub: "Science", bg: "bg-purple-50 text-purple-700" },
                      { time: "10:30 - 10:45", sub: "Recess", bg: "bg-gray-100 text-gray-400" },
                      { time: "10:45 - 11:45", sub: "English", bg: "bg-orange-50 text-orange-700" },
                      { time: "11:45 - 12:45", sub: "Social", bg: "bg-green-50 text-green-700" }
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-gray-300 group hover:bg-bg-base/30 transition-colors">
                        <td className="p-6 font-black text-primary text-sm">{row.time}</td>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="p-2">
                            <div className={`p-4 rounded-2xl font-bold text-xs ${row.sub === 'Recess' ? 'bg-gray-50 text-center opacity-50' : row.bg + ' shadow-xs'}`}>
                              {row.sub}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {examData.map((exam, i) => (
                  <div key={i} className="p-8 rounded-3xl border border-gray-300 bg-white hover:border-secondary transition-all relative overflow-hidden group shadow-sm hover:shadow-xl">
                    <div className="absolute top-0 right-0 p-4">
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none rotate-90 inline-block origin-right">{exam.type}</span>
                    </div>
                    <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black text-primary mb-4 leading-tight">{exam.sub}</h3>
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                        <Calendar className="w-4 h-4 text-secondary" /> {exam.date}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                        <Clock className="w-4 h-4 text-secondary" /> {exam.time}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-black text-primary pt-2">
                        <LayoutDashboard className="w-4 h-4 text-secondary" /> Room: {exam.room}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'Attendance':
        return (
          <div className="glass-card p-8 rounded-3xl shadow-sm border border-gray-300 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <h2 className="text-3xl font-black text-primary">Attendance Tracker</h2>
              <div className="flex gap-3">
                <select 
                  value={attendanceMonth} 
                  onChange={(e) => setAttendanceMonth(e.target.value)}
                  className="bg-bg-base border border-gray-300 outline-none rounded-xl px-4 py-2 text-sm font-bold text-gray-600 focus:border-secondary"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select 
                  value={attendanceYear} 
                  onChange={(e) => setAttendanceYear(e.target.value)}
                  className="bg-bg-base border border-gray-300 outline-none rounded-xl px-4 py-2 text-sm font-bold text-gray-600 focus:border-secondary"
                >
                  {['2024', '2025', '2026'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <div className="md:col-span-2 space-y-6">
                 <div className="grid grid-cols-7 gap-4 mb-4">
                    {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-300">{d}</div>)}
                    {[...Array(31)].map((_, i) => (
                      <div key={i} className={`aspect-square rounded-2xl flex items-center justify-center text-sm font-black relative group shadow-xs ${i === 15 ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : i === 22 || i === 23 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-bg-base text-primary hover:bg-white hover:shadow-md cursor-pointer border border-transparent hover:border-gray-300'}`}>
                        {i + 1}
                        {i < 15 && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>}
                      </div>
                    ))}
                 </div>
               </div>
               <div className="bg-bg-base rounded-3xl p-8 space-y-8 border border-gray-300/30">
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-secondary" /> Statistics
                  </h3>
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                       <div><div className="text-3xl font-black text-secondary">18</div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Days Present</div></div>
                       <CheckCircle className="w-8 h-8 text-success opacity-20" />
                     </div>
                     <div className="flex justify-between items-end">
                       <div><div className="text-3xl font-black text-red-500">01</div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Day Absent</div></div>
                       <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
                     </div>
                     <button className="w-full py-4 bg-white text-primary rounded-2xl font-black text-xs shadow-sm hover:shadow-lg transition-all border border-gray-300 group">
                       <span className="group-hover:text-secondary">Request Leave Details</span>
                     </button>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'Exam Results':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-primary">Academic Reports</h2>
              <button className="flex items-center gap-2 text-secondary font-black text-sm"><Download className="w-4 h-4" /> Export All Data</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: "Mid Term Evaluation", date: "Feb 2026", grade: "A+", cgpa: "3.85" },
                { title: "Quarterly Review", date: "Nov 2025", grade: "A", cgpa: "3.70" }
              ].map((rep, i) => (
                <div key={i} className="glass-card p-8 rounded-3xl shadow-sm border border-gray-300 group hover:border-secondary transition-all">
                  <div className="flex justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-primary">{rep.title}</h3>
                      <p className="text-xs text-gray-400">{rep.date}</p>
                    </div>
                    <div className="text-4xl font-black text-secondary">{rep.grade}</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-bg-base rounded-2xl mb-8 border border-gray-300/30">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Composite CGPA</span>
                    <span className="text-xl font-black text-primary">{rep.cgpa}</span>
                  </div>
                  <button className="w-full py-3 bg-primary text-white rounded-2xl font-black text-xs hover:bg-secondary transition-colors">VIEW DETAILED SHEET</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Fee Portal':
        return (
          <div className="glass-card p-8 rounded-3xl shadow-sm border border-gray-300 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-primary mb-10">Fee Payment Portal</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="p-8 bg-linear-to-br from-primary to-blue-800 rounded-3xl text-white relative overflow-hidden shadow-xl">
                  <CreditCard className="w-16 h-16 absolute -bottom-4 -right-4 opacity-10" />
                  <p className="text-xs font-bold text-white/50 uppercase mb-2">Total Outstanding Balance</p>
                  <h3 className="text-5xl font-black mb-6">₹12,400.00</h3>
                  <div className="flex items-center gap-2 text-accent">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Due by March 31, 2026</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-primary">Pending Components</h4>
                  {[
                    { label: "Tuition Fee (Term 3)", amt: "₹10,000" },
                    { label: "Laboratory Charges", amt: "₹1,500" },
                    { label: "Library Fine", amt: "₹900" }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-bg-base rounded-2xl border border-gray-300/30">
                      <span className="text-sm font-bold text-gray-600">{item.label}</span>
                      <span className="text-sm font-black text-primary">{item.amt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-bg-base rounded-3xl p-8 border border-gray-300/30">
                <h4 className="font-bold text-primary mb-6">Online Payment</h4>
                <form className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Amount to Pay</label>
                    <input type="text" value="₹12,400" className="w-full p-4 bg-white rounded-2xl outline-none border border-gray-300 focus:border-secondary font-black" readOnly />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" className="p-4 bg-white rounded-2xl border-2 border-secondary flex flex-col items-center gap-2 group">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center"><Download className="w-4 h-4 text-secondary rotate-180" /></div>
                      <span className="text-[10px] font-black uppercase">UPI / QR</span>
                    </button>
                    <button type="button" className="p-4 bg-white rounded-2xl border-2 border-gray-300 flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all">
                       <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-gray-400" /></div>
                       <span className="text-[10px] font-black uppercase">Card / Net Banking</span>
                    </button>
                  </div>
                  <button className="w-full py-4 bg-success text-white rounded-2xl font-black mt-4 shadow-lg shadow-success/20 hover:scale-[1.02] transition-transform">PROCEED TO SECURE PAYMENT</button>
                </form>
              </div>
            </div>
          </div>
        );
      case 'Teacher Connect':
        return (
          <div className="glass-card h-[600px] rounded-3xl shadow-sm border border-gray-300 overflow-hidden flex animate-in fade-in duration-500">
             <div className="w-80 border-r border-gray-300 bg-bg-base flex flex-col">
               <div className="p-6">
                 <h2 className="text-xl font-black text-primary mb-4">Messages</h2>
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input type="text" placeholder="Search teacher..." className="w-full pl-10 pr-4 py-2 bg-white rounded-xl text-xs outline-none border border-gray-300 focus:border-secondary shadow-xs" />
                 </div>
               </div>
               <div className="overflow-y-auto grow">
                 {[
                   { name: "Dr. Elena Smith", sub: "Math Teacher", active: true },
                   { name: "Prof. Alan Turing", sub: "Coding Club", active: false },
                   { name: "Ms. Sarah Davis", sub: "Class Teacher", active: false }
                 ].map((t, i) => (
                   <div key={i} className={`p-6 flex items-center gap-4 cursor-pointer border-b border-gray-300 ${t.active ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}>
                     <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300/30"></div>
                     <div>
                       <div className="text-sm font-bold text-primary">{t.name}</div>
                       <div className="text-[10px] text-gray-400">{t.sub}</div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             <div className="flex-1 flex flex-col">
                <div className="p-6 border-b border-gray-300 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                     <h3 className="font-bold text-primary">Dr. Elena Smith</h3>
                   </div>
                   <div className="flex gap-2">
                     <button className="p-2 bg-bg-base rounded-lg text-secondary border border-gray-300 hover:bg-white transition-colors"><Calendar className="w-4 h-4" /></button>
                     <button className="p-2 bg-bg-base rounded-lg text-secondary border border-gray-300 hover:bg-white transition-colors"><GraduationCap className="w-4 h-4" /></button>
                   </div>
                </div>
                <div className="grow bg-white p-8 space-y-4 overflow-y-auto">
                   <div className="max-w-[80%] bg-bg-base p-4 rounded-3xl rounded-tl-none border border-gray-300/20">
                      <p className="text-sm">Hello Mr. Sharma, I wanted to discuss Rahul's progress in the last Mathematics unit test.</p>
                      <span className="text-[10px] text-gray-400 font-bold mt-2 inline-block">09:30 AM</span>
                   </div>
                   <div className="max-w-[80%] bg-secondary text-white p-4 rounded-3xl rounded-tr-none ml-auto shadow-lg shadow-secondary/10">
                      <p className="text-sm">Thank you for reaching out, Dr. Smith. We are very pleased with his performance. Looking forward to the meeting.</p>
                      <span className="text-[10px] text-white/50 font-bold mt-2 inline-block">10:45 AM</span>
                   </div>
                </div>
                <div className="p-6 border-t border-gray-300 flex gap-4 bg-bg-base/30">
                   <input type="text" placeholder="Type your message..." className="grow bg-white rounded-2xl px-6 outline-none text-sm border border-gray-300 focus:border-secondary shadow-xs" />
                   <button className="p-4 bg-secondary text-white rounded-2xl shadow-lg shadow-secondary/20 hover:scale-110 transition-transform active:scale-95"><Send className="w-5 h-5" /></button>
                </div>
             </div>
          </div>
        );
      case 'Alerts':
        return (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-primary mb-8">System Notifications</h2>
            {[
              { title: "Attendance Notice", body: "Rahul was marked absent for the morning session on March 15th.", time: "6 hours ago", type: "Alert", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
              { title: "Fee Receipt Generated", body: "Payment receipt for Jan Term has been generated and is available for download.", time: "1 day ago", type: "Financial", icon: DollarSign, color: "text-green-500", bg: "bg-green-50" },
              { title: "Parent Teacher Meeting", body: "The monthly PTM is scheduled for this Saturday, 10:00 AM.", time: "2 days ago", type: "Event", icon: Users, color: "text-secondary", bg: "bg-blue-50" }
            ].map((n, i) => (
              <div key={i} className="glass-card p-8 rounded-3xl shadow-sm border border-gray-300 flex gap-6 hover:shadow-xl transition-all">
                <div className={`p-4 rounded-2xl h-fit border border-gray-300/20 ${n.bg}`}>
                  <n.icon className={`w-6 h-6 ${n.color}`} />
                </div>
                <div className="grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-primary text-lg">{n.title}</h3>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{n.time}</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return <div>Module Under Construction</div>;
    }
  };

  return (
    <div className="flex bg-bg-base min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white p-6 hidden lg:flex flex-col shadow-2xl fixed inset-y-0 z-50">
        <div className="mb-10 flex items-center gap-3">
          <div className="bg-accent p-2 rounded-xl">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">Parent<br/><span className="text-accent text-sm font-black uppercase tracking-tighter">Academic</span></span>
        </div>
        
        <nav className="space-y-1 grow border-t border-white/5 pt-6">
          {menuItems.map((item, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center space-x-3 p-4 rounded-2xl font-bold transition-all ${activeTab === item.label ? 'bg-secondary text-white shadow-xl shadow-secondary/30 scale-105' : 'sidebar-link-muted sidebar-nav-link-hover'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.label ? 'animate-pulse' : ''}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-2">
          <button className="w-full flex items-center space-x-3 p-4 rounded-2xl sidebar-link-muted sidebar-nav-link-hover transition-all font-bold">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Portal Settings</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-black uppercase tracking-wider text-xs">
            <LogOut className="w-5 h-5" />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-8 lg:p-12 overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <h1 className="text-5xl font-black text-primary mb-2 tracking-tight">Parent Dashboard</h1>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
               <span className="flex items-center gap-1"><User className="w-3 h-3 text-secondary" /> Mr. Ashok Sharma</span>
               <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
               <span>Guardian Account</span>
            </div>
          </div>
          <div className="flex items-center bg-white pl-4 pr-1 py-1 rounded-3xl shadow-sm border border-gray-300">
             <div className="mr-6 text-right">
                <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1 text-xs">Student Focus</div>
                <div className="text-sm font-black text-primary">Rahul • Grade 10-A</div>
             </div>
             <div className="hidden sm:flex bg-bg-base p-3 rounded-2xl gap-2 border border-gray-300/30">
               <button className="p-2 hover:bg-white rounded-lg transition-all text-primary border border-transparent hover:border-gray-300"><Search className="w-4 h-4" /></button>
               <button className="p-2 hover:bg-white rounded-lg transition-all text-primary border border-transparent hover:border-gray-300"><Bell className="w-4 h-4" /></button>
             </div>
          </div>
        </div>

        {/* Tab Content */}
        {renderContent()}
      </main>
    </div>
  );
};

export default ParentDashboard;
