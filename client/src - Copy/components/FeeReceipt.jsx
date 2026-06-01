import React from 'react';

const numberToWords = (num) => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty ','Thirty ','Forty ','Fifty ', 'Sixty ','Seventy ','Eighty ','Ninety '];

    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + a[n[5][1]]) : '';
    return str.trim() + ' Only';
};

const FeeReceipt = ({ details }) => {
  const {
    receiptNo = "NGA/ADM/25-26/0001",
    date = new Date().toLocaleDateString('en-GB'),
    admNo = "---",
    session = "2026-2027",
    name = "STUDENT NAME",
    studentClass = "CLASS",
    installment = "ADMISSION",
    
    items = [],
    payMode = "UPI",
    payDate = new Date().toLocaleDateString('en-GB'),
    bank = "---",
    number = "---",
    totalDue = 0,
    totalPaid = 0,
  } = details;

  return (
    <div className="print-section bg-white max-w-[210mm] mx-auto min-h-[297mm] text-black font-sans box-border" style={{ padding: '10mm' }}>
      <div className="border border-black flex flex-col h-full text-[13px]">
        
        {/* Header */}
        <div className="flex items-center p-4 border-b border-black relative">
          <div className="absolute left-4 w-20 h-20">
            <img src="https://newgraceacademy.in/assets/front/img/logo/nga-logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="w-full text-center">
            <h1 className="text-3xl font-bold font-serif uppercase tracking-tight mb-2">New Grace Academy</h1>
            <p className="font-semibold text-[13px]">Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004, MH</p>
          </div>
        </div>

        {/* Title */}
        <div className="bg-gray-200 border-b border-black py-1.5 text-center font-bold uppercase tracking-widest text-[14px]">
          FEE RECEIPT
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-2 p-4 gap-y-3 gap-x-12 border-b border-black font-medium">
          <div className="grid grid-cols-[100px_auto] gap-2">
            <div>Receipt No</div><div>: <span className="ml-1">{receiptNo}</span></div>
            <div>Adm No</div><div>: <span className="ml-1">{admNo}</span></div>
            <div>Name</div><div>: <span className="ml-1 uppercase">{name}</span></div>
            <div>Installment</div><div>: <span className="ml-1 uppercase">{installment}</span></div>
          </div>
          <div className="grid grid-cols-[100px_auto] gap-2">
            <div>Date</div><div>: <span className="ml-1">{date}</span></div>
            <div>Session</div><div>: <span className="ml-1">{session}</span></div>
            <div>Class</div><div>: <span className="ml-1">{studentClass}</span></div>
            
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[50px_1fr_80px_60px_80px] bg-gray-200 border-b border-black font-bold py-1.5 px-4 text-center">
          <div className="text-left">Sl.No</div>
          <div className="text-left">Description</div>
          <div className="text-right">Due</div>
          <div className="text-right">Con</div>
          <div className="text-right">Paid</div>
        </div>

        {/* Table Body */}
        <div className="min-h-[150px] flex flex-col px-4 text-center">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[50px_1fr_80px_60px_80px] py-2 border-b border-gray-100 last:border-0 items-center">
              <div className="text-left">{item.sl}</div>
              <div className="text-left">{item.desc}</div>
              <div className="text-right">{item.due}</div>
              <div className="text-right">{item.con}</div>
              <div className="text-right">{item.paid}</div>
            </div>
          ))}
        </div>

        {/* Pay Mode Information Area */}
        <div className="mt-auto">
          <div className="bg-gray-200 border-y border-black py-1.5 text-center font-bold uppercase tracking-widest text-[14px]">
            PAY MODE INFORMATION
          </div>
          
          <div className="grid grid-cols-[1fr_min-content_auto] px-4 py-4 gap-y-4 gap-x-8 font-medium">
            <div className="grid grid-cols-[100px_auto] gap-2">
              <div>Pay Mode</div><div className="uppercase">{payMode}</div>
            </div>
            <div className="w-[10px]"></div>
            <div className="grid grid-cols-[100px_auto] gap-2">
              <div>Date</div><div className="text-right">{payDate}</div>
            </div>
            <div className="grid grid-cols-[100px_auto] gap-2">
              <div>Bank</div><div className="uppercase">{bank}</div>
            </div>
            <div className="w-[10px]"></div>
            <div className="grid grid-cols-[100px_auto] gap-2">
              <div>Number</div><div className="text-right">{number}</div>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-[1fr_auto] bg-gray-200 border-y border-black font-bold py-2 px-4">
            <div>Total</div>
            <div className="text-right tracking-wider pr-1">{totalPaid}</div>
          </div>
          
          <div className="grid grid-cols-[1fr_auto] border-b border-black font-bold py-2 px-4 bg-rose-50/30">
            <div className="flex gap-10">
              <span className="text-rose-700">Pending Balance :</span>
            </div>
            <div className="text-right tracking-wider pr-1 text-rose-700">₹ {totalDue - totalPaid}</div>
          </div>

          {/* Amount in Words */}
          <div className="p-4 border-b border-black font-semibold min-h-[60px]">
            Total in Words: {numberToWords(totalPaid)}
          </div>

          {/* Footer Note and QR */}
          <div className="p-4 flex gap-4">
            <div className="w-24 h-24 border border-black p-1 flex items-center justify-center shrink-0">
               {/* QR Placeholder */}
               <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=NGA-RECEIPT" alt="QR" className="w-full h-full opacity-80" />
            </div>
            <div className="flex flex-col flex-1 pl-4 relative">
              <span className="text-[12px] font-medium text-gray-700">Note : System Generated Document. Valid Subject to Realization.</span>
              <div className="mt-auto self-center pb-2 font-bold text-sm">
                This is a computer generated Receipt. Does not require signature.
              </div>
            </div>
          </div>

          <div className="text-center pb-2 text-gray-500 text-[10px] tracking-widest font-bold">PARENT COPY</div>
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

export default FeeReceipt;
