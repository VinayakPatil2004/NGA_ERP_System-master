import React from 'react';
import { User, Calendar, MapPin, Award, CheckCircle } from 'lucide-react';

/**
 * InstitutionalBonafide - Premium Certificate Template
 * Half-A4 (A5 Landscape) institutional design with student photo box.
 */
const InstitutionalBonafide = ({ data }) => {
    if (!data) return null;

    const { 
        first_name, last_name, middle_name, father_name, dob, pob, gr_no, student_id_no, application_no, id, doc_passport_photo 
    } = data;


    return (
        <div className="certificate-container bg-white p-8 w-[210mm] h-[148mm] mx-auto border-2 border-black relative overflow-hidden font-serif print:m-0 print:border-0 shadow-lg flex flex-col">
            {/* LEFT COLOR STRIP */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#FFB606]"></div>
            <div className="absolute left-2 bottom-0 w-full h-2 bg-[#E11D48]"></div>

            {/* Background Texture Placeholder */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center rotate-[-20deg] scale-125">
                <h1 className="text-7xl font-black select-none uppercase">New Grace Academy</h1>
            </div>

            {/* Header Section (Compact) */}
            <div className="w-full flex justify-between items-start mb-0.5 relative z-10">
                <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 bg-[#001736] rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                        <span className="text-4xl font-black tracking-tighter">NG</span>
                    </div>
                    <div className="-ml-1 -mt-3">
                        <h1 className="text-2xl font-black text-[#001736] tracking-tighter uppercase leading-none">New Grace Academy</h1>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight mt-1">
                            Ekta Nagar, Near Ankay Housing Society, Borgad, Nashik-422 004.
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            Contact: +91 91684 42244 | Website: www.newgraceacademy.in
                        </p>
                    </div>
                </div>

                {/* Photo Box */}
                <div className="w-16 h-20 border border-black flex items-center justify-center relative bg-white">
                    {doc_passport_photo ? (
                        <img 
                            src={`${window.location.origin}/${doc_passport_photo}`} 
                            alt="Student" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Photo</span>
                    )}
                </div>
            </div>

            {/* Redesigned Decorative Line */}
            <div className="w-full h-px bg-amber-400 mb-2 relative z-10"></div>

            {/* Title Section (Centered) */}
            <div className="text-center mb-4 relative z-10">
                <h2 className="text-2xl font-black text-[#001736] uppercase tracking-tighter italic">Bonafide/Domicile Certificate</h2>
            </div>

            {/* Sr. No & Gr. No Row (Moved below Title) */}
            <div className="w-full flex justify-between items-center mb-6 px-10 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">Sr. No:</span>
                    <span className="text-lg font-black text-rose-500 italic">
                        {(id || application_no || '1').toString().padStart(4, '0')}
                    </span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">Gr. No:</span>
                    <div className="border border-black px-6 py-0.5 font-black text-sm text-[#001736]">
                        {gr_no || student_id_no || '---'}
                    </div>
                </div>
            </div>

            {/* Content Body (Condensed spacing - Serif for PDF matching) */}
            <div className="w-full space-y-4 text-sm leading-relaxed text-slate-900 relative z-10 px-12 mb-3 text-left font-serif">
                <p>
                    This is to certify that <span className="font-bold text-black px-2 italic uppercase font-serif underline-none">{last_name} {first_name} {middle_name || father_name || ''}</span> 
                    &nbsp;son/daughter of <span className="font-bold text-black px-2 italic uppercase font-serif underline-none">{last_name} {father_name || middle_name || ''}</span>
                </p>
                <p>
                    residing at <span className="font-bold px-2 inline-block min-w-[150px] uppercase font-serif">{(data.residential_address || 'NASHIK').toUpperCase()}</span> 
                    &nbsp;is a bonafide student of our school.
                </p>
                <p>
                    He/She is/was very obedient, sincere and hardworking. He/She bears a good moral character, 
                    &nbsp;his/her date of birth is <span className="font-bold text-black px-2 font-serif">{dob ? new Date(dob).toLocaleDateString('en-GB') : '---'}</span>
                    &nbsp;and place of birth is <span className="font-bold text-black px-2 uppercase font-serif">{pob || 'NASHIK'}</span>.
                </p>
            </div>

            {/* Footer Section (Pulled up) */}
            <div className=" w-full flex justify-between items-end relative z-10 px-8 ">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Place: NASHIK</p>
                </div>
                <div className="text-center">
                    <div className="w-40 border-b border-slate-300"></div>
                    <p className="text-[10px] font-black text-[#001736] uppercase tracking-widest">Principal's Signature</p>
                </div>
            </div>

            {/* Security Mark (Faded) */}
            <div className="absolute bottom-4 right-4 opacity-[0.05] pointer-events-none">
                <CheckCircle size={80} className="text-[#001736]" />
            </div>
        </div>
    );
};

export default InstitutionalBonafide;
