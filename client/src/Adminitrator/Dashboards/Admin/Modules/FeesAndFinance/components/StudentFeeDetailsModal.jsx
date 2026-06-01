import React from 'react';
import { X, ListFilter, Landmark, CheckCircle, AlertCircle, FileText, Edit2, Printer, Eye } from 'lucide-react';
import ngaLogo from '../../../../../../assets/nga-logo.png';
import { ROOT_URL } from '../../../../../../services/API';

const formatCurrency = (val) => {
    const num = Number(val ?? 0);
    return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const StudentFeeDetailsModal = ({ onClose, viewingStudent, feeStructures, paymentHistory }) => {
    if (!viewingStudent) return null;

    return (
        <div className="fixed inset-0 bg-institutional-main/80 backdrop-blur-md z-500 flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="bg-slate-200 rounded-2xl w-full max-w-6xl shadow-4xl overflow-hidden animate-in zoom-in-95 duration-300 border  max-h-[95vh] flex flex-col">

                {/* HEADER: Sketch Top Line */}
                <div className="p-8 border-b bg-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-institutional-main uppercase tracking-tighter">Fee History & Details</h2>
                        <p className="text-[11px] font-bold text-black uppercase tracking-[0.3em] mt-1">{viewingStudent.name} ({viewingStudent.grade})</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-all group">
                        <X className="w-6 h-6 text-institutional-muted group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div id="printable-ledger" className="p-10 overflow-y-auto space-y-10 custom-scrollbar">

                    {/* SECTION 1: FEE HEADS */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ListFilter className="w-3.5 h-3.5" /> Institutional Fee Structure
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {(() => {
                                const matchingStructure = (feeStructures || []).find(s => s.grade === viewingStudent.grade);
                                const heads = [
                                    { label: 'Admission Fee', val: matchingStructure?.admission_fee || 0 },
                                    { label: 'Tuition Fee', val: matchingStructure?.tuition_fee || 0 },
                                    { label: 'Term Fee', val: matchingStructure?.term_fee || 0 },
                                    { label: 'Computer Fee', val: matchingStructure?.computer_fee || 0 },
                                    { label: 'Other Fees', val: (Number(matchingStructure?.other_fee || 0) + Number(viewingStudent.transport_fee || 0)) }
                                ];

                                return heads.map(head => (
                                    <div key={head.label} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-black transition-all group">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2 group-hover:text-black">{head.label}</p>
                                        <p className="text-sm font-black text-black">₹{formatCurrency(head.val)}</p>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* SECTION 2: FINANCIAL TOTALS */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Landmark className="w-3.5 h-3.5" /> Institutional Revenue Matrix
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {(() => {
                                const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(viewingStudent?.grade).replace(/\D/g, ''));
                                const annual = structure ? (
                                    Number(structure.admission_fee || 0) +
                                    Number(structure.tuition_fee || 0) +
                                    Number(structure.term_fee || 0) +
                                    Number(structure.computer_fee || 0) +
                                    Number(structure.other_fee || 0)
                                ) : (viewingStudent?.annual_fee || 0);

                                const discount = Number(viewingStudent?.discount_amount || 0);
                                const annualAfterDiscount = Math.max(0, annual - discount);
                                const transport = viewingStudent?.transport_fee || 0;
                                const total = annualAfterDiscount + transport;

                                return (
                                    <>
                                        <div className="p-6 bg-slate-900 text-white rounded-xl border-institutional-main">
                                            <p className="text-[9px] font-black text-white uppercase mb-1 tracking-widest">Annual Fee</p>
                                            <p className="text-xl font-black tracking-tighter text-white">₹{formatCurrency(annual)}</p>
                                        </div>
                                        <div className="p-6 bg-white border border-table rounded-xl shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Discount</p>
                                            <p className="text-xl font-black text-institutional-main tracking-tighter">₹{formatCurrency(discount)}</p>
                                        </div>
                                        <div className="p-6 bg-white border border-table rounded-xl shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Annual After Discount</p>
                                            <p className="text-xl font-black text-institutional-main tracking-tighter">₹{formatCurrency(annualAfterDiscount)}</p>
                                        </div>
                                        <div className="p-6 bg-white border border-table rounded-xl shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Transport</p>
                                            <p className="text-xl font-black text-institutional-main tracking-tighter">₹{formatCurrency(transport)}</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 border border-table rounded-xl">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total (YTD)</p>
                                            <p className="text-xl font-black text-slate-600 tracking-tighter">₹{formatCurrency(total)}</p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* SECTION 3: STATUS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {(() => {
                            const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(viewingStudent?.grade).replace(/\D/g, ''));
                            const annual = structure ? (
                                Number(structure.admission_fee || 0) +
                                Number(structure.tuition_fee || 0) +
                                Number(structure.term_fee || 0) +
                                Number(structure.computer_fee || 0) +
                                Number(structure.other_fee || 0)
                            ) : (viewingStudent?.annual_fee || 0);
                            const discount = Number(viewingStudent?.discount_amount || 0);
                            const total = Math.max(0, annual - discount) + (viewingStudent?.transport_fee || 0);

                            return (
                                <>
                                    <div className="flex-1 flex items-center justify-between px-8 py-5 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black text-black uppercase tracking-widest">Term 1 Fee</span>
                                                <p className="text-2xl font-black text-black tracking-tighter">₹{formatCurrency(total / 2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-center justify-between px-8 py-5 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black text-black uppercase tracking-widest">Term 2 Fee</span>
                                                <p className="text-2xl font-black text-black tracking-tighter">₹{formatCurrency(total / 2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-center justify-between px-8 py-5 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Fee Paid</span>
                                                <p className="text-2xl font-black text-emerald-600 tracking-tighter">₹{formatCurrency(viewingStudent?.totalPaid)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-center justify-between px-8 py-5 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">Pending Balance</span>
                                                <p className="text-2xl font-black text-rose-600 tracking-tighter">₹{formatCurrency(total - (viewingStudent?.totalPaid || 0))}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* SECTION 4: PAYMENT LEDGER TABLE */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Ledger Entries</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-black">
                                <thead className="bg-slate-300">
                                    <tr>
                                        <th className="border border-black px-4 py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest w-20">Date</th>
                                        <th className="border border-black px-4 py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest">Method</th>
                                        <th className="border border-black px-4 py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest">Ref/Chq</th>
                                        <th className="border border-black px-4 py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest">Payer Name</th>
                                        <th className="border border-black px-4 py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest">Receiver</th>
                                        <th className="border border-black px-4 py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest text-right">Amount</th>
                                        <th className="border border-black px-4 py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentHistory.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50` bg-white transition-colors">
                                            <td className="border border-black px-4 py-3 text-[10px] font-black text-slate-900 uppercase">
                                                {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB') : '---'}
                                            </td>
                                            <td className="border border-black px-4 py-3 text-[10px] font-bold text-slate-600 uppercase">
                                                {p.payment_method ? (p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1).toLowerCase()) : '---'}
                                            </td>
                                            <td className="border border-black px-4 py-3 text-[10px] font-bold text-slate-600 uppercase truncate max-w-[100px]">
                                                {p.cheque_no || p.cheque_number || p.transaction_id || '---'}
                                            </td>
                                            <td className="border border-black px-4 py-3 text-[10px] font-bold text-slate-600 uppercase truncate max-w-[120px]">
                                                {p.payer_name || '---'}
                                            </td>
                                            <td className="border border-black px-4 py-3 text-[10px] font-bold text-slate-600 uppercase">
                                                {p.receiver_name || '---'}
                                            </td>
                                            <td className="border border-black px-4 py-3 text-sm font-black text-emerald-600 text-right">
                                                ₹{formatCurrency(p.paid_amount)}
                                            </td>
                                            <td className="border border-black px-4 py-3">
                                                <div className="flex flex-col gap-1.5 items-center justify-center">
                                                    <button
                                                        onClick={() => {
                                                            const WinPrint = window.open('', '', 'width=1000,height=800');

                                                            const numberToWords = (num) => {
                                                                const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
                                                                const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                                                                if ((num = num.toString()).length > 9) return 'Overflow';
                                                                let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
                                                                if (!n) return '';
                                                                let str = '';
                                                                str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
                                                                str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
                                                                str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
                                                                str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
                                                                str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
                                                                return str;
                                                            };

                                                            const receiptStyle = `
                                                                <style>
                                                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                                                                    @page { size: A4; margin: 1cm; }
                                                                    body { font-family: 'Inter', sans-serif; color: #000; margin: 0; padding: 0; line-height: 1.4; }
                                                                    .receipt-container { border: 1px solid #000; padding: 0; width: 100%; margin: 0 auto; position: relative; box-sizing: border-box; }
                                                                    
                                                                    .header { display: flex; align-items: center; padding: 15px; gap: 20px; border-bottom: 1px solid #000; }
                                                                    .logo { width: 80px; height: 80px; object-fit: contain; }
                                                                    .school-info { flex: 1; text-align: center; }
                                                                    .school-name { font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px; }
                                                                    .school-address { font-size: 11px; font-weight: 700; margin: 5px 0; }
                                                                    
                                                                    .receipt-title { background: #f1f5f9; text-align: center; font-weight: 900; border-left: 1px solid #000; font-size: 14px; padding: 8px; border-bottom: 1px solid #000; text-transform: uppercase; letter-spacing: 2px; }
                                                                    
                                                                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #000; }
                                                                    .info-col { padding: 10px 15px; font-size: 11px; display: flex; flex-direction: column; gap: 5px; }
                                                                    .info-row { display: flex; }
                                                                    .info-label { width: 100px; font-weight: 900; text-transform: uppercase; color: #475569; }
                                                                    .info-value { font-weight: 700; color: #000; }
                                                                    
                                                                    .fee-table { width: 100%; border-collapse: collapse; }
                                                                    .fee-table th { border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: left; background: #fff; }
                                                                    .fee-table td { border-bottom: 1px solid #000; border-right: 1px solid #000; border-left: 1px solid #000; padding: 10px 8px; font-size: 11px; font-weight: 700; }
                                                                    .fee-table th:last-child, .fee-table td:last-child { border-right: none; }
                                                                    .fee-table td:nth-child(3), .fee-table td:nth-child(4), .fee-table td:nth-child(5) { text-align: center; border-bottom: 1px solid #000; }
                                                                    
                                                                    .pay-mode-title { background: #f1f5f9;border-left: 1px solid #000; text-align: center; font-weight: 900; font-size: 11px; padding: 6px; border-bottom: 1px solid #000; text-transform: uppercase; }
                                                                    .pay-info { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 11px; border-bottom: 1px solid #000; }
                                                                    
                                                                    .summary { padding: 10px 15px; border-bottom: 1px solid #000; }
                                                                    .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                                                                    .summary-label { font-weight: 900; text-transform: uppercase; }
                                                                    .summary-value { font-weight: 900; }
                                                                    
                                                                    .in-words { padding: 10px 15px; font-size: 10px; font-weight: 700; border-bottom: 1px solid #000; }
                                                                    
                                                                    .note { font-size: 9px; font-weight: 700; color: #475569; padding: 20px 15px 10px; text-align: center; width: 100%; }
                                                                    
                                                                    .footer { padding: 30px 15px; display: flex; justify-content: space-between; align-items: flex-end; }
                                                                    .sig-box { text-align: center; width: 150px; }
                                                                    .sig-line { border-top: 1px solid #000; margin-bottom: 5px; }
                                                                    .sig-text { font-size: 10px; font-weight: 900; text-transform: uppercase; }
                                                                </style>
                                                            `;

                                                            const termLabel = p.term_no === 2 ? 'TERM 2' : (p.term_no === 1 ? 'TERM 1' : 'ANNUAL FEE');
                                                            const totalAmountDue = Number(viewingStudent.annual_fee || 0) + (viewingStudent.transport_fee || 0);

                                                            WinPrint.document.write(`
                                                                <html>
                                                                    <head>
                                                                        <title>Fee Receipt - ${viewingStudent.name}</title>
                                                                        ${receiptStyle}
                                                                    </head>
                                                                    <body>
                                                                        <div class="receipt-container">
                                                                            <div class="header">
                                                                                <img src="${ngaLogo}" class="logo" />
                                                                                <div class="school-info">
                                                                                    <h1 class="school-name">NEW GRACE ACADEMY</h1>
                                                                                    <p class="school-address">Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004. MH</p>
                                                                                    <p class="school-address" style="margin-top: 0;"><strong>Contact:</strong> +91 91684 42244 | <strong>Website:</strong> www.newgraceacademy.in</p>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div class="receipt-title">FEE RECEIPT (${termLabel})</div>
                                                                            
                                                                            <div class="info-grid">
                                                                                <div class="info-col">
                                                                                    <div class="info-row"><span class="info-label">Receipt No</span><span class="info-value">: ${p.receipt_no || 'N/A'}</span></div>
                                                                                    <div class="info-row"><span class="info-label">Adm No</span><span class="info-value">: ${viewingStudent.studentIdNo || '---'}</span></div>
                                                                                    <div class="info-row"><span class="info-label">Name</span><span class="info-value">: ${viewingStudent.name.toUpperCase()}</span></div>
                                                                                    <div class="info-row"><span class="info-label">Installment</span><span class="info-value">: ${termLabel}</span></div>
                                                                                </div>
                                                                                <div class="info-col">
                                                                                    <div class="info-row"><span class="info-label">Date</span><span class="info-value">: ${new Date(p.payment_date).toLocaleDateString('en-GB')}</span></div>
                                                                                    <div class="info-row"><span class="info-label">Session</span><span class="info-value">: 2026-27</span></div>
                                                                                    <div class="info-row"><span class="info-label">Class</span><span class="info-value">: ${viewingStudent.grade}</span></div>
                                                                                    
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <table class="fee-table">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th style="width: 50px;">Sl.No</th>
                                                                                        <th>Description</th>
                                                                                        <th style="width: 100px;">Due</th>
                                                                                        <th style="width: 80px;">Con</th>
                                                                                        <th style="width: 100px;">Paid</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td style="text-align: center;">1</td>
                                                                                        <td>
                                                                                            <div>Tuition Fee (2026-27)</div>
                                                                                            ${viewingStudent.transport_fee > 0 ? '<div>Other Fee & Transport Fee</div>' : '<div>Other Annual Fee</div>'}
                                                                                        </td>
                                                                                        <td>${formatCurrency(totalAmountDue)}</td>
                                                                                        <td>0.00</td>
                                                                                        <td>${formatCurrency(p.paid_amount)}</td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                            
                                                                            <div class="pay-mode-title">PAY MODE INFORMATION</div>
                                                                            <div class="pay-info">
                                                                                <div><strong>Pay Mode:</strong> ${p.payment_method.toUpperCase()}</div>
                                                                                <div><strong>Date:</strong> ${new Date(p.payment_date).toLocaleDateString('en-GB')}</div>
                                                                                <div><strong>Ref/Chq No:</strong> ${p.cheque_no || p.cheque_number || p.transaction_id || '---'}</div>
                                                                                <div><strong>Bank:</strong> ${p.bank_name || '---'}</div>
                                                                            </div>
                                                                            
                                                                            <div class="summary">
                                                                                <div class="summary-row">
                                                                                    <span class="summary-label">Total Amount Paid</span>
                                                                                    <span class="summary-value">₹ ${formatCurrency(p.paid_amount)}</span>
                                                                                </div>
                                                                                <div class="summary-row" style="color: #e11d48;">
                                                                                    <span class="summary-label">Pending Balance</span>
                                                                                    <span class="summary-value">₹ ${formatCurrency(p.pending_amount)}</span>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div class="in-words">
                                                                                TOTAL IN WORDS: ${numberToWords(Math.round(p.paid_amount)).toUpperCase()}
                                                                            </div>
                                                                            
                                                                            <div class="note">
                                                                                Note : System Generated Document. Valid Subject to Realization.
                                                                            </div>
                                                                            
                                                                            <div class="footer">
                                                                                <div class="sig-box">
                                                                                    <div class="sig-line"></div>
                                                                                    <div class="sig-text">Receiver Signature</div>
                                                                                </div>
                                                                                <div class="sig-box">
                                                                                    <div class="sig-line"></div>
                                                                                    <div class="sig-text">Principal Signature</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </body>
                                                                </html>
                                                            `);

                                                            WinPrint.document.close();
                                                            WinPrint.focus();
                                                            setTimeout(() => {
                                                                WinPrint.print();
                                                                WinPrint.close();
                                                            }, 800);
                                                        }}
                                                        className="w-full py-1 hover:bg-slate-100 border border-black rounded text-black text-[8px] font-black uppercase transition-all mb-1"
                                                    >
                                                        Print Receipt
                                                    </button>
                                                    {p.attachment_url && (
                                                        <button
                                                            onClick={() => window.open(`${ROOT_URL}/uploads/${p.attachment_url}`, '_blank')}
                                                            className="w-full py-1 hover:bg-slate-100 border border-black rounded text-black text-[8px] font-black uppercase transition-all"
                                                        >
                                                            View Document
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paymentHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border border-black">
                                                No transaction records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                <div className="p-8 bg-slate-200 border-t flex justify-end gap-4">
                    <button
                        onClick={() => {
                            const printContent = document.getElementById('printable-ledger');
                            const WinPrint = window.open('', '', 'width=1000,height=800');

                            const style = `
                                <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                                    @page { size: A4; margin: 0; }
                                    body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 1cm; margin: 0; line-height: 1.3; }
                                    
                                    .letterhead { display: flex; align-items: center; gap: 30px; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
                                    .logo-container { width: 90px; height: 90px; flex-shrink: 0; }
                                    .logo-container img { width: 100%; height: 100%; object-fit: contain; }
                                    
                                    .school-info-container { flex-grow: 1; }
                                    .school-name { font-size: 32px; font-weight: 900; color: #000; margin: 0; line-height: 1; letter-spacing: -1.2px; }
                                    .school-address { font-size: 12px; font-weight: 700; color: #000; margin-top: 6px; }
                                    .school-contact { font-size: 11px; font-weight: 700; color: #000; margin-top: 4px; display: flex; gap: 25px; }
                                    
                                    .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                                    .report-title { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; padding-bottom: 3px; }

                                    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; }
                                    .info-item { font-size: 11px; }
                                    .info-label { font-weight: 900; text-transform: uppercase; color: #64748b; margin-right: 8px; }
                                    .info-value { font-weight: 700; color: #0f172a; }

                                    h3 { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #1e293b; margin-bottom: 10px; border-left: 4px solid #000; padding-left: 10px; margin-top: 20px; }
                                    
                                    .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
                                    .card { border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; background: #fff; }
                                    .card-label { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
                                    .card-value { font-size: 12px; font-weight: 900; }
                                    
                                    /* Force background colors for print */
                                    .bg-slate-900 { background-color: #fff !important; color: #000 !important; border: none !important; -webkit-print-color-adjust: exact; }
                                    .bg-slate-900 p { color: #000 !important; }
                                    .bg-white { background-color: white !important; -webkit-print-color-adjust: exact; }
                                    .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
                                    .bg-emerald-50 { background-color: #ecfdf5 !important; border-color: #10b981 !important; -webkit-print-color-adjust: exact; }
                                    .bg-rose-50 { background-color: #fff1f2 !important; border-color: #f43f5e !important; -webkit-print-color-adjust: exact; }

                                    /* Force horizontal layout for status boxes (Correct selector: child 3) */
                                    #printable-ledger > div:nth-child(3) { 
                                        display: flex !important; 
                                        flex-direction: row !important; 
                                        gap: 15px !important; 
                                        width: 100% !important; 
                                        margin-bottom: 20px !important;
                                    }
                                    #printable-ledger > div:nth-child(3) > div { 
                                        flex: 1 !important; 
                                        display: flex !important;
                                        flex-direction: row !important;
                                        align-items: center !important;
                                        justify-content: flex-start !important;
                                        padding: 12px 20px !important;
                                        border-radius: 12px !important;
                                    }
                                    
                                    table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #000; }
                                    th { background: #f8fafc !important; border: 1px solid #000; padding: 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; text-align: left; -webkit-print-color-adjust: exact; }
                                    td { border: 1px solid #000; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
                                    .amount-cell { text-align: right; color: #15803d !important; font-weight: 900; -webkit-print-color-adjust: exact; }
                                    
                                    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 8px; color: #64748b; text-align: center; text-transform: uppercase; letter-spacing: 1.2px; }
                                    button, .actions-column, .lucide, .no-print, .actions-header { display: none !important; }
                                    
                                    .overflow-x-auto { overflow: visible !important; }
                                </style>
                            `;

                            WinPrint.document.write(`
                                <html>
                                    <head>
                                        <title>Student Fee Ledger - ${viewingStudent.name}</title>
                                        ${style}
                                    </head>
                                    <body>
                                        <div class="letterhead">
                                            <div class="logo-container">
                                                <img src="${ngaLogo}" alt="Logo" />
                                            </div>
                                            <div class="school-info-container">
                                                <h1 class="school-name">NEW GRACE ACADEMY</h1>
                                                <p class="school-address">
                                                    Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik - 422 004.
                                                </p>
                                                <div class="school-contact">
                                                    <span><strong>Contact:</strong> +91 91684 42244</span>
                                                    <span><strong>Website:</strong> www.newgraceacademy.in</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="report-header">
                                            <div class="report-title">Financial Statement & Ledger History</div>
                                            <div style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">
                                                Year: 2026-27
                                            </div>
                                        </div>

                                        <div class="student-info">
                                            <div class="info-item"><span class="info-label">Student Name:</span><span class="info-value">${viewingStudent.name}</span></div>
                                            <div class="info-item"><span class="info-label">Class/Grade:</span><span class="info-value">${viewingStudent.grade}</span></div>
                                            <div class="info-item"><span class="info-label">Father Name:</span><span class="info-value">${viewingStudent.fatherName || '---'}</span></div>
                                            <div class="info-item"><span class="info-label">Contact:</span><span class="info-value">${viewingStudent.contact || '---'}</span></div>
                                        </div>

                                        ${printContent.innerHTML}

                                        <div class="footer">
                                            This is a computer-generated institutional document and does not require a physical signature.<br/>
                                            NEW GRACE ACADEMY • NASHIK • MAHARASHTRA • INDIA<br/>
                                            Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString()}
                                        </div>
                                    </body>
                                </html>
                            `);

                            WinPrint.document.close();
                            WinPrint.focus();
                            setTimeout(() => {
                                WinPrint.print();
                                WinPrint.close();
                            }, 800);
                        }}
                        className="px-8 py-3 bg-white border border-black text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
                    >
                        <Printer className="w-4 h-4" /> Print Statement
                    </button>
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all block"
                    >
                        Close Ledger
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentFeeDetailsModal;
