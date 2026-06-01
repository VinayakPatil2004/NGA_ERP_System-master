import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Printer, User } from 'lucide-react';
import logo from '../assets/nga-logo.png';
import { ROOT_URL } from '../services/API';

const StudentIdCard = ({ student }) => {
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `ID_Card_${student?.student_id_no || 'Student'}`,
    });

    if (!student) return null;

    // Resolve data fields safely with fallback values
    const classVal = student.current_grade || student.class_name || '---';
    const addressVal = student.residential_address || student.address || '---';

    // Format DOB to a beautiful date format (e.g., "17 May 2026")
    let dobVal = '---';
    if (student.dob) {
        try {
            const date = new Date(student.dob);
            if (!isNaN(date.getTime())) {
                dobVal = date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            } else {
                dobVal = student.dob;
            }
        } catch {
            dobVal = student.dob;
        }
    }

    // Safely parse/build absolute profile photo URL
    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('data:') || photoPath.startsWith('http')) return photoPath;
        const cleanPath = photoPath.replace(/\\/g, '/');
        const base = ROOT_URL || '';
        const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
        const suffix = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
        return `${prefix}${suffix}`;
    };

    const studentPhotoUrl = getPhotoUrl(student.student_photo || student.doc_passport_photo);

    const qrData = JSON.stringify({
        id: student.student_id_no,
        name: student.student_name,
        class: classVal,
        contact: student.father_mobile
    });

    return (
        <div className="flex flex-col items-center gap-8 p-6 bg-slate-100/50 rounded-3xl">
            {/* ID CARD PREVIEW CONTAINER */}
            <div ref={componentRef} className="print:m-0 flex flex-col gap-10 items-center bg-white p-4 print:p-0 print:block">

                {/* FRONT SIDE */}
                <div className="w-[350px] h-[550px] border border-slate-200 relative bg-white overflow-hidden shadow-2xl flex flex-col font-sans print:shadow-none print:break-after-page print:mb-0 mb-10 mx-auto" style={{ pageBreakAfter: 'always' }}>
                    {/* 1. Header (White) */}
                    <div className="h-28 flex items-center px-4 gap-4 relative border-b border-slate-100">
                        <div className="w-16 h-16 flex items-center justify-center">
                            <img src={logo} alt="Logo" className="w-full object-contain" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-[18px] font-black leading-none tracking-tight text-[#001736] uppercase">New Grace Academy</h1>
                            <div className="mt-1 space-y-0.5">
                                <p className="text-[7px] font-black text-slate-500 uppercase leading-tight">Ekta Nagar, Boargad, Shirish Society, Nashik, Maharashtra - 422004</p>
                                <p className="text-[7px] font-black text-slate-500 uppercase leading-tight">Contact : +91 7770055574</p>
                                <p className="text-[7px] font-black text-blue-600 lowercase">newgrace.edu.nsk@gmail.com</p>
                                <p className="text-[7px] font-black text-blue-600 lowercase">https://newgraceacademy.in/</p>
                            </div>
                        </div>
                        {/* Decorative Blue Triangle */}
                        <div className="absolute right-0 top-0 w-16 h-full bg-[#001736] [clip-path:polygon(100%_0,0_0,100%_100%)]"></div>
                    </div>

                    {/* 2. Main Content (Dark Blue) */}
                    <div className="flex-1 bg-[#001736] flex flex-col items-center pt-6 px-6 relative">
                        {/* Photo Container */}
                        <div className="w-28 h-32 border-[3px] border-white/20 bg-slate-800 rounded-xl overflow-hidden shadow-2xl mb-4 relative z-10">
                            {studentPhotoUrl ? (
                                <img
                                    src={studentPhotoUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                    <User size={50} strokeWidth={1} />
                                </div>
                            )}
                        </div>

                        {/* Name Section */}
                        <h3 className="text-[18px] font-black text-white! uppercase tracking-tight text-center leading-tight mb-2 z-10">
                            {student.student_name}
                        </h3>

                        {/* Divider Line */}
                        <div className="w-full h-px bg-amber-400 mb-6 opacity-50"></div>

                        {/* Details List */}
                        <div className="w-full space-y-4 px-2">
                            <DetailRow label="Class" value={`${classVal}`} />
                            <DetailRow label="DOB" value={`${dobVal}`} />
                            <DetailRow label="Address" value={addressVal} isSmall={true} />
                            <DetailRow label="Contact" value={student.father_mobile || '---'} />
                        </div>

                        {/* 3. Footer / Signature Section */}
                        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center">
                            <p className="text-[12px] font-serif font-black italic text-amber-400 leading-none mb-1">Principal</p>
                            <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em]">Authority Sign</p>
                        </div>
                    </div>
                </div>

                {/* BACK SIDE */}
                <div className="w-[350px] h-[550px] border border-slate-200 bg-white flex flex-col p-8 items-center justify-between font-sans shadow-2xl relative overflow-hidden print:shadow-none mx-auto print:mt-0">
                    {/* Decorative Header for Back */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-[#001736]"></div>

                    <div className="w-full text-center mt-4">
                        <h4 className="text-[16px] font-black uppercase tracking-tight text-[#001736] mb-8 border-b-2 border-amber-400 inline-block px-4 pb-1">Instructions</h4>
                        <ul className="text-[10px] font-bold uppercase tracking-wider text-slate-500 space-y-4 leading-relaxed text-left px-4">
                            <li className="flex gap-3"><span className="text-[#001736]">1.</span> This card is non-transferable and must be worn within the campus.</li>
                            <li className="flex gap-3"><span className="text-[#001736]">2.</span> If lost, please report immediately to the administration office.</li>
                            <li className="flex gap-3"><span className="text-[#001736]">3.</span> This card remains the property of New Grace Academy.</li>
                        </ul>
                    </div>

                    {/* QR Code Container */}
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-slate-50 border border-slate-100 rounded-3xl -z-10 group-hover:scale-105 transition-transform duration-500"></div>
                        <div className="bg-[#001736] p-5 rounded-2xl shadow-xl">
                            <QRCodeSVG
                                value={qrData}
                                size={140}
                                level="H"
                                bgColor="#001736"
                                fgColor="#FFFFFF"
                                includeMargin={true}
                            />
                        </div>
                        <p className="text-[8px] font-black text-[#001736] uppercase tracking-[0.4em] text-center mt-6">Scan to Verify</p>
                    </div>

                    <div className="w-full text-center border-t border-slate-100 pt-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] mb-1">Grace ERP Secured</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">www.newgraceacademy.com</p>
                    </div>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-4">
                <button
                    onClick={() => handlePrint()}
                    className="flex items-center gap-3 px-10 py-4 bg-[#001736] text-white rounded-2xl font-black uppercase text-[12px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 border-2 border-transparent hover:border-amber-400 hover:text-amber-400"
                >
                    <Printer size={20} /> Print ID Registry
                </button>
            </div>
        </div>
    );
};

// Helper component for detail rows
const DetailRow = ({ label, value, isSmall = false }) => (
    <div className="grid grid-cols-12 gap-2">
        <span className="col-span-4 text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">{label} :</span>
        <span className={`col-span-8 ${isSmall ? 'text-[9px]' : 'text-[11px]'} font-bold text-white uppercase tracking-wide leading-tight`}>{value}</span>
    </div>
);

export default StudentIdCard;
