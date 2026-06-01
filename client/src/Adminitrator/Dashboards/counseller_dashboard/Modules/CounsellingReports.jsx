import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download, FileSpreadsheet, FilePieChart, TrendingUp, Filter, RefreshCw } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import * as XLSX from 'xlsx';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { getCounsellorStats } from '../../../../services/counsellorAPI';
import { toast } from 'react-toastify';

const CounsellingReports = ({ toggleSidebar }) => {
  const { selectedYear } = useAcademicYear();
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    totalAdmissions: 0,
    followupsDue: 0,
    sessionsToday: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!selectedYear) return;
    try {
      setLoading(true);
      const data = await getCounsellorStats(selectedYear.id);
      console.log("Counsellor Stats Received:", data);
      setStats({
        totalEnquiries: data.totalEnquiries || 0,
        totalAdmissions: data.totalAdmissions || 0,
        followupsDue: data.followupsDue || 0,
        sessionsToday: data.sessionsToday || 0
      });
    } catch (error) {
      console.error("Fetch Stats Error:", error);
      toast.error("Failed to load reporting metrics");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportExcel = () => {
    const data = [
      { "Metric": "Total Enquiries", "Value": stats.totalEnquiries, "Status": "Active" },
      { "Metric": "Total Admissions", "Value": stats.totalAdmissions, "Status": "Processed" },
      { "Metric": "Conversion Rate", "Value": stats.totalEnquiries > 0 ? ((stats.totalAdmissions / stats.totalEnquiries) * 100).toFixed(1) + "%" : "0%", "Status": "Calculated" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Institutional_Reports");
    XLSX.writeFile(workbook, `Counseling_Analytics_${selectedYear?.year_name || '2026'}.xlsx`);
  };

  const cards = [
    { title: "Total Enquiries", val: stats.totalEnquiries, icon: TrendingUp, color: "text-indigo-600", trend: "+8.4% YoY" },
    { title: "Total Admissions", val: stats.totalAdmissions, icon: BarChart3, color: "text-emerald-600", trend: "+12.1% YoY" },
    { title: "Conversion Rate", val: stats.totalEnquiries > 0 ? ((stats.totalAdmissions / stats.totalEnquiries) * 100).toFixed(1) + "%" : "0%", icon: FilePieChart, color: "text-amber-600", trend: "Stable" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans text-left">
      <ModuleHeader
        title="Institutional Intelligence"
        subTitle="Audit & Analysis of Counseling Engagement"
        icon={BarChart3}
        toggleSidebar={toggleSidebar}
      />

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                  <Filter className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#001736] shadow-sm flex items-center gap-2">
                  {selectedYear?.year_name ? `Analysis: ${selectedYear.year_name}` : "Selecting Period..."}
                  <RefreshCw 
                    size={12} 
                    className={`cursor-pointer hover:text-indigo-600 ${loading ? "animate-spin" : ""}`} 
                    onClick={fetchStats}
                  />
              </div>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={handleExportExcel}
                className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
              >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button className="flex-1 lg:flex-none px-6 py-3 bg-[#001736] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 active:scale-95">
                  <Download className="w-4 h-4" /> PDF Report
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                  <div className="flex items-center justify-between mb-8">
                      <div className={`p-4 rounded-xl bg-slate-50 border border-slate-100 ${card.color} transition-colors group-hover:bg-[#001736] group-hover:text-white`}>
                          <card.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">{card.trend}</span>
                  </div>
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
                      <h4 className="text-3xl font-black text-[#001736] tracking-tighter">
                          {loading ? "..." : card.val}
                      </h4>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default CounsellingReports;
