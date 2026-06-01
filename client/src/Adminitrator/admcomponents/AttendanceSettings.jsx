import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Wifi, 
  Clock, 
  Save, 
  RefreshCw, 
  Settings, 
  Navigation,
  Globe
} from 'lucide-react';
import * as attendanceAPI from '../../services/attendanceAPI';
import { toast } from 'react-toastify';
import ModuleHeader from './ModuleHeader';

const AttendanceSettings = ({ toggleSidebar }) => {
  const [settings, setSettings] = useState({
    punch_in_start: '09:00:00',
    punch_in_end: '10:30:00',
    punch_out_start: '17:30:00',
    punch_out_end: '20:00:00',
    office_latitude: 0,
    office_longitude: 0,
    office_radius: 100,
    allowed_ip: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await attendanceAPI.getAttendanceSettings();
      if (data) setSettings(data);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await attendanceAPI.updateAttendanceSettings(settings);
      toast.success('Attendance settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings({
          ...settings,
          office_latitude: pos.coords.latitude,
          office_longitude: pos.coords.longitude
        });
        toast.info('Captured current location');
      },
      (err) => toast.error('Failed to get location')
    );
  };

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center gap-4">
      <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Configuration Ledger...</p>
    </div>
  );

  return (
    <div className="p-2 lg:p-8 bg-slate-50 min-h-screen text-left">
      <ModuleHeader 
        title="Attendance Config" 
        subTitle="Institutional Matrix Settings" 
        badge="System Admin"
        toggleSidebar={toggleSidebar}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 btn-add-institutional px-6 py-3 rounded-md font-black text-[10px] uppercase tracking-widest shadow-xl  hover:text-white transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </ModuleHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* 1. GPS Configuration */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-sm font-black text-[#001736] uppercase tracking-tight">GPS / Geofencing Matrix</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Office Location Boundaries</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitude</label>
              <input 
                type="number" step="any"
                value={settings.office_latitude}
                onChange={(e) => setSettings({...settings, office_latitude: parseFloat(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-bold text-[#001736] outline-none focus:bg-white focus:border-rose-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitude</label>
              <input 
                type="number" step="any"
                value={settings.office_longitude}
                onChange={(e) => setSettings({...settings, office_longitude: parseFloat(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-bold text-[#001736] outline-none focus:bg-white focus:border-rose-400 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office Radius (Meters)</label>
            <input 
              type="number"
              value={settings.office_radius}
              onChange={(e) => setSettings({...settings, office_radius: parseInt(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-bold text-[#001736] outline-none focus:bg-white focus:border-rose-400 transition-all"
            />
          </div>

          <button 
            onClick={getCurrentLocation}
            className="w-full py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-3.5 h-3.5" /> Capture Current Coordinates
          </button>
        </div>

        {/* 2. WiFi / IP Configuration */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-sm font-black text-[#001736] uppercase tracking-tight">WiFi / Network Matrix</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Public IP Gateway</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allowed Public IP Address</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text"
                value={settings.allowed_ip || ''}
                onChange={(e) => setSettings({...settings, allowed_ip: e.target.value})}
                placeholder="e.g. 103.120.45.10"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-[#001736] outline-none focus:bg-white focus:border-indigo-400 transition-all"
              />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Teachers must be connected to this network to perform WiFi punches.</p>
          </div>
        </div>

        {/* 3. Shift Windows */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-sm font-black text-[#001736] uppercase tracking-tight">Temporal Registry Windows</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Punch Timeframes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Punch In Start</label>
              <input 
                type="time"
                value={settings.punch_in_start}
                onChange={(e) => setSettings({...settings, punch_in_start: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-bold text-[#001736] outline-none focus:bg-white focus:border-amber-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Punch In End</label>
              <input 
                type="time"
                value={settings.punch_in_end}
                onChange={(e) => setSettings({...settings, punch_in_end: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-bold text-[#001736] outline-none focus:bg-white focus:border-amber-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Punch Out Start</label>
              <input 
                type="time"
                value={settings.punch_out_start}
                onChange={(e) => setSettings({...settings, punch_out_start: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-bold text-[#001736] outline-none focus:bg-white focus:border-amber-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Punch Out End</label>
              <input 
                type="time"
                value={settings.punch_out_end}
                onChange={(e) => setSettings({...settings, punch_out_end: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-bold text-[#001736] outline-none focus:bg-white focus:border-amber-400 transition-all"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttendanceSettings;
