import React, { useState, useEffect } from "react";
import { 
    User, Mail, Phone, MapPin, Calendar, 
    Briefcase, Award, GraduationCap, CreditCard,
    FileText, Shield, Clock, RefreshCw, Search
} from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import hrAPI from "../../../../services/hrAPI";
import { toast } from "react-toastify";

import StudentProfile from "../../../admpages/StudentProfile";
import ViewStafProfile from "../../../admpages/ViewStafProfile";
import { getAllStudents, getStudentById } from "../../../../services/studentAPI";

const ViewProfile = ({ toggleSidebar }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
          const data = await hrAPI.getProfile(user.id);
          setProfile(data);
        }
      } catch {
        toast.error("Failed to fetch institutional profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 2) {
      try {
        setSearching(true);
        // We use the first active year found or just search all
        const data = await getAllStudents('', ''); 
        const filtered = data.filter(s => 
          s.student_name?.toLowerCase().includes(term.toLowerCase()) || 
          s.student_id_no?.includes(term) ||
          s.gr_no?.includes(term)
        );
        setSearchResults(filtered.slice(0, 5));
      } catch {
        console.error("Search sync failed");
      } finally {
        setSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectStudent = async (studentId) => {
    try {
      setLoading(true);
      const data = await getStudentById(studentId);
      setViewingStudent(data);
      setSearchTerm("");
      setSearchResults([]);
    } catch (err) {
      toast.error("Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  if (viewingStudent) {
    return (
      <StudentProfile 
        student={viewingStudent} 
        onBack={() => setViewingStudent(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Retrieving Personal Registry...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen animate-in fade-in duration-500 font-sans text-left">

      <div className="max-w-7xl mx-auto mt-8">
        <ViewStafProfile staff={profile} isSelfProfile={true} />
      </div>
    </div>
  );
};

export default ViewProfile;