import React from 'react';

const PrintLayout = ({ children, title = "Form", date = new Date().toLocaleDateString(), formNo = "NGA/ADM/25-26/0001", studentPhoto = null }) => {
  return (
    <div className="print-section bg-white p-8 max-w-[210mm] print:shadow-none print:p-0 font-serif text-[#002147] border border-slate-100 print:border-none shadow-lg">
      {/* Print Header */}
      <div className="flex justify-between items-start border-b-2 border-[#002147] pb-6 mb-8">
        <div className="flex gap-6 items-center">
          <img 
            src="https://newgraceacademy.in/assets/front/img/logo/nga-logo.png" 
            alt="NGA Logo" 
            className="w-24 h-24 object-contain"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none whitespace-nowrap">New Grace Academy</h1>
            <p className="text-[10px] font-bold leading-tight max-w-[400px] text-slate-500">
              Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004.
            </p>
            <div className="flex gap-4 text-[9px] font-bold text-slate-400 mt-2">
              <span>Contact: +91 91684 42244</span>
              <span>Website: www.newgraceacademy.in</span>
            </div>
          </div>
        </div>

        {/* Passport Photo Placeholder */}
        <div className="w-[35mm] h-[45mm] border-2 border-slate-200 rounded-sm flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
          {studentPhoto ? (
            <img src={studentPhoto} alt="Student" className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="text-[8px] font-black text-slate-300 text-center px-4 uppercase tracking-tighter">Affix Passport <br /> Size Photo <br /> Here</div>
            </>
          )}
        </div>
      </div>

      {/* Decorative Title */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black uppercase tracking-widest border-b-4 border-[#FFB606] inline-block pb-2">{title}</h2>
      </div>

      {/* Document Meta */}
      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-10 text-slate-500">
        <div className="flex items-baseline gap-2">
          No.: <span className="text-[#002147] border-b border-slate-200 px-6 min-w-[150px]">{formNo}</span>
        </div>
        <div className="flex items-baseline gap-2 text-right">
          Date: <span className="text-[#002147] border-b border-slate-200 px-6 min-w-[150px]">{date}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-8 text-sm leading-relaxed">
        {children}
      </div>

      {/* Verification Declaration (Optional, but good for official forms) */}
      <div className="mt-8 text-[10px] font-bold italic text-slate-500 text-center border-y border-slate-100 py-4 mb-8">
        The information provided above by the undersigned is true & correct. Any discrepancy may lead to cancellation.
      </div>

      {/* Admission Instructions */}
      <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-100 mb-12 text-left">
        <h4 className="text-xs font-black uppercase tracking-widest text-[#002147] mb-4 flex items-center justify-start gap-2">
          <span className="w-2 h-2 bg-[#FFB606] rounded-full"></span>
          Next Steps / Enrollment Instructions
        </h4>
        <ul className="grid grid-cols-2 gap-y-3 gap-x-8 text-[10px] font-bold text-slate-600 list-disc pl-4">
          <li>Bring 2 hard copies of this Online Admission Form.</li>
          <li>Bring 2 hard copies of the generated Fees Receipt.</li>
          <li>Submit all Original Documents for physical verification.</li>
          <li>Bring 4 recent passport-size photographs of the student.</li>
          <li>Both parents must be present during final interview.</li>
          <li>Carry Aadhar card of both parents (Original + Copy).</li>
        </ul>
      </div>

      {/* Print Footer - Signature Area */}
      <div className="flex justify-between items-end">
        <div className="text-[9px] text-slate-400 italic">
          <p>System Generated Document</p>
          <p>NGA School Management System v1.0</p>
        </div>
        <div className="text-right flex flex-col items-center">
            <div className="w-48 h-16 mb-2 flex items-center justify-center text-slate-100 text-xs italic">School Stamp Area</div>
            <div className="w-56 border-b-2 border-[#002147]"></div>
            <p className="font-black text-[#002147] uppercase text-[10px] tracking-widest mt-2">Authorized Signatory</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 2cm; }
          body { background-color: white !important; margin: 0; padding: 0; }
          body * { visibility: hidden; }
          nav, footer { display: none !important; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-sizing: border-box; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
};

export default PrintLayout;
