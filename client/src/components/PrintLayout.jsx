import React from 'react';

const PrintLayout = ({ children, title = "Form", date = new Date().toLocaleDateString(), formNo = "NGA/ADM/25-26/0001", studentPhoto = null }) => {
  return (
    <div className="print-section bg-white p-8 max-w-[210mm] print:shadow-none print:border-none font-serif text-[#002147] border border-slate-100 shadow-lg">
      {/* Print Header */}
      <div className="flex justify-between items-start border-b-2 border-[#002147] pb-4 mb-6">
        <div className="flex gap-6 items-center">
          <img
            src="https://newgraceacademy.in/assets/front/img/logo/nga-logo.png"
            alt="NGA Logo"
            className="w-28 h-28 object-contain"
          />
          <div className="text-left">
            <h1 className="text-2xl font-black uppercase leading-tight text-[#001736] mb-1">New Grace Academy</h1>
            <p className="text-[10px] font-bold leading-tight max-w-[350px] text-slate-500 mb-1">
              Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004.
            </p>
            <div className="flex gap-4 text-[9px] font-bold text-slate-400">
              <span>Contact: +91 91684 42244</span>
              <span>Website: www.newgraceacademy.in</span>
            </div>
          </div>
        </div>

        {/* Passport Photo Placeholder (Squared for official compliance) */}
        <div className="w-[30mm] h-[38mm] border-2 border-slate-200 rounded-none flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
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
      <div className="text-center mb-6">
        <h2 className="text-xl font-black uppercase tracking-widest border-b-4 border-[#FFB606] inline-block pb-1">{title}</h2>
      </div>

      {/* Document Meta */}
      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-6 text-slate-500">
        <div className="flex items-baseline gap-2">
          Application No.: <span className="text-[#002147] border-b border-slate-200 px-6 min-w-[120px]">{formNo}</span>
        </div>
        <div className="flex items-baseline gap-2 text-right">
          Date: <span className="text-[#002147] border-b border-slate-200 px-6 min-w-[120px]">{date}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-4 print:space-y-1 text-sm leading-relaxed">
        {children}
      </div>

      {/* Verification Declaration (Optional, but good for official forms) */}
      <div className="mt-8 text-[10px] font-bold italic text-slate-500 text-center border-y border-slate-100 py-4 mb-8">
        The information provided above by the undersigned is true & correct. Any discrepancy may lead to cancellation.
      </div>


      {/* Print Footer - Signature Area */}
      <div className="flex justify-between items-end mt-12">
        <div className="text-left flex flex-col items-center">
          {/* <div className="w-48 h-12 mb-2 flex items-center justify-center text-slate-100 text-[10px] italic font-bold">Principal Signature</div> */}
          <div className="w-56 border-b-2 border-[#002147]"></div>
          <p className="font-black text-[#002147] uppercase text-[10px] tracking-widest mt-2">Principal</p>
        </div>

        <div className="text-center mb-0 opacity-40">
          <p className="text-[10px] font-black uppercase text-slate-400">Institutional Seal Area</p>
        </div>

        <div className="text-right flex flex-col items-center">
          {/* <div className="w-48 h-12 mb-2 flex items-center justify-center text-slate-100 text-[10px] italic font-bold">Admin Signature</div> */}
          <div className="w-56 border-b-2 border-[#002147]"></div>
          <p className="font-black text-[#002147] uppercase text-[10px] tracking-widest mt-2">Authorized Signatory</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { 
            size: A4; 
            margin: 1cm 1cm 1cm 1.5cm;
          }
          
          /* Force hide ALL UI elements - aggressive for absolute clean print */
          header, nav, footer, aside, .sidebar, button, .print-hidden, .modal-close, .no-print, 
          [class*="Header"], [class*="Navbar"], [class*="bg-[#001736]"], [class*="bg-primary"] {
            display: none !important;
            height: 0 !important;
            visibility: hidden !important;
          }

          /* Force backgrounds to WHITE for crisp printing */
          * {
            background-color: transparent !important;
          }
          
          html, body, #root, .print-section, .print-section *, [class*="modal"], [class*="container"] {
            background-color: white !important;
            visibility: visible !important;
          }

          /* Allow content to flow across pages */
          html, body, #root, div {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
          }
          
          .print-section { 
            display: block !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 2rem !important;
            border: 1.5px solid #002147 !important;
            box-shadow: none !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: black !important;
          }
          
          h1, h2, h3, h4, .text-[#001736] { color: #001736 !important; }
        }
      `}} />
    </div>
  );
};

export default PrintLayout;
