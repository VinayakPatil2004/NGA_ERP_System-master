import React, { useEffect, useState, useCallback } from 'react';
import { 
  Smartphone, 
  MapPin, 
  Wifi, 
  Clock, 
  Coffee, 
  Utensils, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import * as attendanceAPI from '../../services/attendanceAPI';
import * as authAPI from '../../services/authAPI';
import { getOrCreateDeviceId } from '../../utils/deviceId';
import toast from 'react-hot-toast';

const AttendancePanel = () => {
  const [att, setAtt] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [bindLoading, setBindLoading] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [attData, deviceData] = await Promise.all([
        attendanceAPI.getCurrentAttendance(),
        authAPI.getDeviceStatus()
      ]);
      setAtt(attData);
      setDeviceStatus(deviceData);
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError('Failed to sync with server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const bindDevice = async () => {
    try {
      setBindLoading(true);
      const deviceId = getOrCreateDeviceId();
      await authAPI.bindDevice(deviceId);
      toast.success('Device bound successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bind device');
    } finally {
      setBindLoading(false);
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Location not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        resolve,
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handlePunch = async (type, method) => {
    try {
      setPunchLoading(true);
      setError('');
      const deviceId = getOrCreateDeviceId();
      let locationData = null;

      if (method === 'gps') {
        try {
          const position = await getLocation();
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (e) {
          throw new Error('Please enable GPS/Location to punch in via GPS.');
        }
      }

      const apiCall = type === 'in' ? attendanceAPI.punchIn : attendanceAPI.punchOut;
      await apiCall({ location: locationData, via: method }, deviceId);
      
      toast.success(`Punched ${type === 'in' ? 'In' : 'Out'} successfully`);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleBreak = async (type) => {
    try {
      setBreakLoading(true);
      const methods = {
        'lunch-start': attendanceAPI.startLunch,
        'lunch-end': attendanceAPI.endLunch,
        'tea-start': attendanceAPI.startTea,
        'tea-end': attendanceAPI.endTea
      };
      await methods[type]();
      toast.success('Break status updated');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update break');
    } finally {
      setBreakLoading(false);
    }
  };

  if (loading) return (
    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-4">
      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Attendance Matrix...</p>
    </div>
  );

  const isBound = deviceStatus?.deviceBound;
  const statusColor = att?.status === 'in' ? 'bg-emerald-500' : att?.status === 'complete' ? 'bg-indigo-500' : 'bg-rose-500';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Mobile / Device Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
        <div>
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-black text-[#001736] uppercase tracking-tighter">Mobile / Device Status</h3>
             <Smartphone className="w-5 h-5 text-indigo-600" />
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-3 h-3 rounded-full ${isBound ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
            <div>
              <p className="text-sm font-bold text-[#001736]">{isBound ? 'Mobile bound' : 'Mobile not bound'}</p>
              {deviceStatus?.deviceBoundAt && (
                <p className="text-[10px] text-slate-400 font-medium">Bound on: {new Date(deviceStatus.deviceBoundAt).toLocaleString()}</p>
              )}
            </div>
          </div>
          
          {!isBound && (
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium mb-4">
              Access from your primary mobile device and perform a GPS punch to auto-bind, or manual link below.
            </p>
          )}
        </div>

        <button
          onClick={bindDevice}
          disabled={bindLoading}
          className="w-full py-3 px-4 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#001736] hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          {bindLoading ? 'Processing...' : isBound ? 'Re-bind this device' : 'Bind current device'}
        </button>
      </div>

      {/* 2. Current Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-sm font-black text-[#001736] uppercase tracking-tighter">Live Status</h3>
           <Clock className="w-5 h-5 text-amber-500" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className={`w-16 h-16 rounded-2xl ${statusColor} flex items-center justify-center shadow-lg mb-4 text-white`}>
               {att?.status === 'in' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>
            <h4 className="text-2xl font-black text-[#001736] uppercase tracking-tighter">
              {att?.status === 'in' ? 'Punched In' : att?.status === 'complete' ? 'Shift Ended' : 'Punched Out'}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
               Registry Integrity: High
            </p>
        </div>
      </div>

      {/* 3. Punch Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-sm font-black text-[#001736] uppercase tracking-tighter">Punch Gateway</h3>
           <MapPin className="w-5 h-5 text-rose-500" />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold uppercase tracking-tight flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
           <button
             onClick={() => handlePunch('in', 'gps')}
             disabled={punchLoading || att?.status !== 'out'}
             className="py-3 px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
           >
             <MapPin className="w-3 h-3" /> In (GPS)
           </button>
           <button
             onClick={() => handlePunch('out', 'gps')}
             disabled={punchLoading || att?.status !== 'in'}
             className="py-3 px-4 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#001736] hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
           >
             <MapPin className="w-3 h-3" /> Out (GPS)
           </button>
           <button
             onClick={() => handlePunch('in', 'wifi')}
             disabled={punchLoading || att?.status !== 'out'}
             className="py-3 px-4 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 shadow-md shadow-amber-200 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
           >
             <Wifi className="w-3 h-3" /> In (WiFi)
           </button>
           <button
             onClick={() => handlePunch('out', 'wifi')}
             disabled={punchLoading || att?.status !== 'in'}
             className="py-3 px-4 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#001736] hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
           >
             <Wifi className="w-3 h-3" /> Out (WiFi)
           </button>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lunch Break</p>
               <div className="flex gap-2">
                  <button 
                    disabled={breakLoading || att?.status !== 'in' || att?.lunchStartTime}
                    onClick={() => handleBreak('lunch-start')}
                    className="flex-1 p-2 bg-slate-50 rounded-lg text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-30"
                  >
                    <Utensils className="w-4 h-4 mx-auto" />
                  </button>
                  <button 
                    disabled={breakLoading || !att?.lunchStartTime || att?.lunchEndTime}
                    onClick={() => handleBreak('lunch-end')}
                    className="flex-1 p-2 bg-slate-50 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-30"
                  >
                    <CheckCircle2 className="w-4 h-4 mx-auto" />
                  </button>
               </div>
            </div>
            <div className="space-y-2">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tea Break</p>
               <div className="flex gap-2">
                  <button 
                    disabled={breakLoading || att?.status !== 'in' || att?.teaStartTime}
                    onClick={() => handleBreak('tea-start')}
                    className="flex-1 p-2 bg-slate-50 rounded-lg text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-30"
                  >
                    <Coffee className="w-4 h-4 mx-auto" />
                  </button>
                  <button 
                    disabled={breakLoading || !att?.teaStartTime || att?.teaEndTime}
                    onClick={() => handleBreak('tea-end')}
                    className="flex-1 p-2 bg-slate-50 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-30"
                  >
                    <CheckCircle2 className="w-4 h-4 mx-auto" />
                  </button>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePanel;
