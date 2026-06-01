import React, { useState } from 'react';
import { 
  LayoutDashboard, Calendar, Clock, BookOpen, 
  MessageSquare, ClipboardList, Award, Bell, 
  Search, Download, CheckCircle, AlertCircle,
  TrendingUp, Book, User, Settings, LogOut,
  ChevronRight, ArrowRight, GraduationCap, Printer, Filter
} from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [timetableType, setTimetableType] = useState('regular'); // 'regular' or 'exam'
  const [attendanceMonth, setAttendanceMonth] = useState('March');
  const [attendanceYear, setAttendanceYear] = useState('2026');

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview" },
    { icon: Calendar, label: "Timetable" },
    { icon: ClipboardList, label: "Attendance" },
    { icon: Award, label: "Exam Results" },
    { icon: BookOpen, label: "Assignments" },
    { icon: Book, label: "Study Materials" },
    { icon: Bell, label: "Notifications" }
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
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Attendance", value: "94.2%", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-100" },
                { label: "Avg. Marks", value: "88%", icon: Award, color: "text-purple-600", bg: "bg-purple-100" },
                { label: "Assignments", value: "12/15", icon: BookOpen, color: "text-orange-600", bg: "bg-orange-100" },
                { label: "Rank", value: "#3", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl shadow-sm border border-gray-300 flex items-center space-x-4">
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-xl font-bold text-primary">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-card p-6 rounded-2xl shadow-sm border border-gray-300">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" /> Today's Classes
                </h3>
                <div className="space-y-4">
                  {[
                    { time: "08:30 AM", subject: "Advanced Mathematics", room: "Room 402", teacher: "Dr. Elena Smith" },
                    { time: "11:00 AM", subject: "Quantum Physics", room: "Lab B", teacher: "Prof. Johnson" },
                    { time: "01:00 PM", subject: "English Literature", room: "Room 205", teacher: "Ms. Davis" }
                  ].map((slot, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-bg-base hover:bg-white transition-colors border border-transparent hover:border-gray-300/20 group">
                      <div className="flex gap-4">
                        <div className="font-bold text-secondary">{slot.time}</div>
                        <div>
                          <div className="font-bold text-primary">{slot.subject}</div>
                          <div className="text-xs text-gray-400">{slot.teacher} • {slot.room}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-secondary transform group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl shadow-sm border border-gray-300">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-secondary" /> Notice Board
                </h3>
                <div className="space-y-6">
                  {[
                    { title: "Annual Sports Day", date: "Mar 15, 2026", type: "Event" },
                    { title: "Mid-Term Results Out", date: "Mar 12, 2026", type: "Academic" },
                    { title: "Holiday Notice", date: "Mar 10, 2026", type: "Holiday" }
                  ].map((notice, i) => (
                    <div key={i} className="flex gap-4 items-start border-l-2 border-secondary pl-4 py-1">
                      <div>
                        <p className="text-xs font-bold text-secondary uppercase mb-1">{notice.type}</p>
                        <p className="text-sm font-bold text-primary leading-tight">{notice.title}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{notice.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'Timetable':
        return (
          <div className="glass-card p-8 rounded-2xl shadow-sm border border-gray-300 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-primary">Student Schedule</h2>
                <div className="flex mt-2 p-1 bg-bg-base rounded-xl w-fit">
                  <button 
                    onClick={() => setTimetableType('regular')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timetableType === 'regular' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400 hover:text-primary'}`}
                  >
                    Regular Class
                  </button>
                  <button 
                    onClick={() => setTimetableType('exam')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timetableType === 'exam' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400 hover:text-primary'}`}
                  >
                    Exam Timetable
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg font-bold text-sm hover:bg-secondary/20 transition-colors">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors">
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>

            {timetableType === 'regular' ? (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-bg-base text-gray-500 text-sm">
                      <th className="p-4 text-left font-bold rounded-l-xl">Time</th>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <th key={d} className="p-4 text-left font-bold">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { time: "08:30 - 09:30", sub: "Math", bg: "bg-blue-50 text-blue-700" },
                      { time: "09:30 - 10:30", sub: "Science", bg: "bg-purple-50 text-purple-700" },
                      { time: "10:30 - 10:45", sub: "Break", bg: "bg-gray-50 text-gray-500" },
                      { time: "10:45 - 11:45", sub: "English", bg: "bg-orange-50 text-orange-700" },
                      { time: "11:45 - 12:45", sub: "Social", bg: "bg-green-50 text-green-700" }
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-gray-300">
                        <td className="p-4 font-bold text-primary">{row.time}</td>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="p-2">
                            <div className={`p-3 rounded-lg font-medium ${row.sub === 'Break' ? 'bg-gray-100 text-center text-xs' : row.bg}`}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {examData.map((exam, i) => (
                  <div key={i} className="p-6 rounded-2xl border-2 border-gray-300/50 bg-white hover:border-secondary transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                        <Award className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{exam.type} Exam</span>
                    </div>
                    <h3 className="text-lg font-black text-primary mb-1">{exam.sub}</h3>
                    <div className="space-y-2 mt-4 text-sm text-gray-500 font-medium">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {exam.date}</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {exam.time}</div>
                      <div className="flex items-center gap-2 font-bold text-secondary"><LayoutDashboard className="w-4 h-4" /> {exam.room}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'Attendance':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="glass-card p-8 rounded-2xl shadow-sm border border-gray-300">
              <h2 className="text-2xl font-bold text-primary mb-6 text-center lg:text-left">Attendance Overview</h2>
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
                <div className="relative w-32 h-32 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * 0.058} className="text-secondary" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-primary">94.2%</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Average</span>
                  </div>
                </div>
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary"></div> <span className="text-sm font-bold text-blue-900 font-inter">Present</span></div>
                    <span className="font-black text-secondary">180 Days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div> <span className="text-sm font-bold text-red-900 font-inter">Absent</span></div>
                    <span className="font-black text-red-500">8 Days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-400"></div> <span className="text-sm font-bold text-orange-900 font-inter">Leave</span></div>
                    <span className="font-black text-orange-600">4 Days</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-primary">Attendance Progress</h3>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '94.2%' }}></div>
                </div>
              </div>
            </div>
            <div className="glass-card p-8 rounded-2xl shadow-sm border border-gray-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-primary leading-tight">Attendance Calendar</h2>
                <div className="flex gap-2">
                  <select 
                    value={attendanceMonth} 
                    onChange={(e) => setAttendanceMonth(e.target.value)}
                    className="p-2 bg-bg-base rounded-xl border border-gray-300 text-xs font-bold outline-none focus:border-secondary"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={attendanceYear} 
                    onChange={(e) => setAttendanceYear(e.target.value)}
                    className="p-2 bg-bg-base rounded-xl border border-gray-300 text-xs font-bold outline-none focus:border-secondary"
                  >
                    {['2024', '2025', '2026'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="bg-bg-base p-6 rounded-2xl border border-gray-300/30">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-center font-bold text-gray-400 text-xs">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(31)].map((_, i) => (
                    <div key={i} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer ${i === 15 ? 'bg-red-400 text-white shadow-lg shadow-red-200' : i === 22 || i === 23 ? 'bg-orange-400 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-700 hover:text-secondary'}`}>
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest justify-center">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white border border-gray-300"></div> Present</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400"></div> Absent</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div> Leave</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Exam Results':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { exam: "Mid Term", year: "2025-26", status: "Analysed", color: "bg-secondary" },
                { exam: "Unit Test 2", year: "2025-26", status: "Archived", color: "bg-gray-400" }
              ].map((ex, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl shadow-sm border border-gray-300 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 ${ex.color} text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl`}>{ex.status}</div>
                  <h3 className="text-lg font-bold text-primary mb-1">{ex.exam}</h3>
                  <p className="text-xs text-gray-400 mb-6">Academic Year {ex.year}</p>
                  <button className="text-secondary font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">Download Report <Download className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            
            <div className="glass-card p-8 rounded-2xl shadow-sm border border-gray-300">
              <h2 className="text-2xl font-bold text-primary mb-8">Recent Performance - Mid Term</h2>
              <div className="space-y-6">
                {[
                  { sub: "Mathematics", score: 98, total: 100, color: "bg-blue-500" },
                  { sub: "Physics", score: 85, total: 100, color: "bg-purple-500" },
                  { sub: "Chemistry", score: 92, total: 100, color: "bg-pink-500" },
                  { sub: "English", score: 88, total: 100, color: "bg-orange-500" }
                ].map((row, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-primary">{row.sub}</span>
                      <span className="font-bold text-secondary">{row.score}/{row.total}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className={`${row.color} h-full rounded-full`} style={{ width: `${(row.score / row.total) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Assignments':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { sub: "Mathematics", title: "Calculus Problem Set 4", due: "Tomorrow", difficulty: "High", status: "Pending" },
                  { sub: "Physics", title: "Lab Report: Light", due: "Mar 19, 2026", difficulty: "Medium", status: "In Progress" },
                  { sub: "Social", title: "Global Warming Research", due: "Mar 25, 2026", difficulty: "Easy", status: "Pending" }
                ].map((task, i) => (
                  <div key={i} className="glass-card p-6 rounded-2xl shadow-sm border border-gray-300 hover:border-secondary transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{task.sub}</span>
                        <h3 className="text-lg font-bold text-primary leading-tight mt-1">{task.title}</h3>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400 mb-6">
                      <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {task.difficulty}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.status}</span>
                    </div>
                    <button className="w-full py-2 bg-bg-base hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all border border-gray-300">Submit Assignment</button>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'Study Materials':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search chapters, topics..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:border-secondary transition-all font-medium text-sm" />
              </div>
              <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"><Filter className="w-4 h-4" /> Filter By Subject</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Unit 4 Physics Notes.pdf", size: "2.4 MB", type: "PDF" },
                { name: "Math Formulae.zip", size: "15 MB", type: "ZIP" },
                { name: "English Vocab.pdf", size: "1.2 MB", type: "PDF" },
                { name: "Exam Blueprint.pdf", size: "500 KB", type: "PDF" }
              ].map((file, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl shadow-sm border border-gray-300 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-bg-base rounded-2xl flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-secondary" />
                  </div>
                  <h4 className="font-bold text-primary text-sm mb-1 leading-tight">{file.name}</h4>
                  <p className="text-xs text-gray-400 mb-6">{file.size} • {file.type}</p>
                  <button className="text-secondary font-bold text-xs flex items-center gap-1 hover:underline">Download <Download className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Notifications':
        return (
          <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-500">
            {[
              { title: "Exam Schedule Updated", body: "The final exam timetable for Grade 10 has been updated. Please check the Timetable module.", time: "2 hours ago", type: "Critical", icon: Bell, color: "text-red-500", bg: "bg-red-50" },
              { title: "Marks Published", body: "Chemistry Quiz 4 marks have been published in the results portal.", time: "1 day ago", type: "Academic", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-50" },
              { title: "Sports Registration", body: "Registrations for the Cricket Tournament are now open.", time: "2 days ago", type: "Activity", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" }
            ].map((n, i) => (
              <div key={i} className="glass-card p-6 rounded-2xl shadow-sm border border-gray-300 flex gap-4">
                <div className={`p-3 rounded-xl h-fit ${n.bg}`}>
                  <n.icon className={`w-6 h-6 ${n.color}`} />
                </div>
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-primary text-sm">{n.title}</h3>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{n.time}</span>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">{n.body}</p>
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
      <aside className="w-64 bg-primary text-white p-6 hidden lg:flex flex-col shadow-xl fixed inset-y-0 z-50">
        <div className="mb-10 flex items-center space-x-3">
          <div className="bg-secondary p-2 rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Silver Oak<br/><span className="text-secondary text-xs font-black uppercase tracking-widest">Portal</span></span>
        </div>
        
        <nav className="space-y-1 grow">
          {menuItems.map((item, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center space-x-3 p-4 rounded-xl font-bold transition-all ${activeTab === item.label ? 'bg-secondary text-white shadow-lg' : 'sidebar-link-muted sidebar-nav-link-hover'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-2">
          <button className="w-full flex items-center space-x-3 p-4 rounded-xl sidebar-link-muted sidebar-nav-link-hover transition-all font-bold">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Account Settings</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-4 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-black uppercase tracking-widest text-xs">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-8 lg:p-12 overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-200 rounded-3xl border-4 border-white shadow-sm overflow-hidden">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary mb-1">Hello, Rahul!</h1>
              <span className="text-gray-400">Grade 10-A • Roll No: 42</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-300">
            <div className="text-right">
              <div className="text-sm font-extrabold text-primary">Rahul Sharma</div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-none">Rank: #3</div>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary font-black">RS</div>
          </div>
        </div>

        {/* Tab Content */}
        {renderContent()}
      </main>
    </div>
  );
};

export default StudentDashboard;
