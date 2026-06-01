import React, { useState } from 'react';
import {
    Search, CreditCard, Landmark, Banknote, Smartphone,
    Calendar, User, Users, Phone, Hash, ChevronRight,
    CheckCircle, X, ArrowLeft, Loader2, Info, Printer, Eye
} from 'lucide-react';
import { toast } from 'react-toastify';
import ModuleHeader from '../admcomponents/ModuleHeader';
import { recordStudentPayment, updateStudentPayment } from '../../services/FeesAndFinance/studentFeeAPI';
import ngaLogo from '../../assets/nga-logo.png';
 
 // Institutional Formatting Helper
 const formatCurrency = (val) => (val ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
 const ROOT_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StudentFeeEntry = ({ onClose, initialStudent, selectedYear, initialPayment }) => {
    // 1. Core State
    const [selectedStudent] = useState(initialStudent || null);
    const [submitting, setSubmitting] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(initialPayment?.discount_amount || initialStudent?.discount_amount || 0);

    // 2. Form State
    const [formData, setFormData] = useState({
        id: initialPayment?.id || null,
        term: initialPayment?.term_no === 2 ? 'Term 2' : 'Term 1',
        paymentMethod: initialPayment?.payment_method ? (initialPayment.payment_method.charAt(0).toUpperCase() + initialPayment.payment_method.slice(1).toLowerCase()) : 'Cash',
        amount: initialPayment?.paid_amount || '',
        date: initialPayment?.payment_date ? new Date(initialPayment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        document: null,
        remark: initialPayment?.remarks || '',
        payer_name: initialPayment?.payer_name || initialStudent?.name || '',
        receiver_name: initialPayment?.receiver_name || 'Admin Desk',
        payer_mobile: initialPayment?.payer_mobile || initialStudent?.contact || '',
        upiDetails: { 
            transactionId: initialPayment?.transaction_id || '', 
            payerName: initialPayment?.payer_name || initialStudent?.name || '', 
            mobileNo: initialPayment?.payer_mobile || initialStudent?.contact || '', 
            date: initialPayment?.payment_date ? new Date(initialPayment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 
            receiverName: initialPayment?.receiver_name || 'Admin Desk' 
        },
        chequeDetails: { 
            payerName: initialPayment?.payer_name || initialStudent?.name || '', 
            chequeNo: initialPayment?.cheque_no || '', 
            bankName: initialPayment?.bank_name || '', 
            receiverName: initialPayment?.receiver_name || 'Admin Desk', 
            date: initialPayment?.cheque_date ? new Date(initialPayment.cheque_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 
            mobileNo: initialPayment?.payer_mobile || initialStudent?.contact || '' 
        },
        netbankingDetails: { 
            payerName: initialPayment?.payer_name || initialStudent?.name || '', 
            transactionId: initialPayment?.transaction_id || '', 
            bankName: initialPayment?.bank_name || '', 
            date: initialPayment?.payment_date ? new Date(initialPayment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 
            mobileNo: initialPayment?.payer_mobile || initialStudent?.contact || '' 
        }
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // 🚀 AUTO-DETECT COLLECTION TERM (Only for new entries)
    React.useEffect(() => {
        if (selectedStudent && !initialPayment) {
            const total = (selectedStudent.annual_fee || 0) + (selectedStudent.transport_fee || 0);
            const paid = selectedStudent.totalPaid || 0;
            if (paid >= (total / 2)) {
                setFormData(prev => ({ ...prev, term: 'Term 2' }));
            }
        }
    }, [selectedStudent, initialPayment]);

    // 3. Selection Handlers
    const handleInputChange = (field, value, subfield = null) => {
        if (subfield) {
            // Institutional Validations
            if (subfield === 'chequeNo') {
                const cleaned = value.replace(/\s/g, ''); // No spaces
                if (cleaned.length > 6 || (cleaned && !/^\d+$/.test(cleaned))) return; // 6 digits only
                value = cleaned;
            }
            if (['payerName', 'bankName', 'receiverName'].includes(subfield)) {
                if (/[0-9]/.test(value)) return; // No numbers allowed
            }

            setFormData(prev => ({
                ...prev,
                [field]: { ...prev[field], [subfield]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleDownloadReceipt = () => {
        if (!selectedStudent || !formData) return;
        
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
                .receipt-container { border: 1px solid #000; padding: 0; width: 100%; margin: 0 auto; box-sizing: border-box; }
                
                .header { display: flex; align-items: center; padding: 15px; gap: 20px; border-bottom: 1px solid #000; }
                .logo { width: 80px; height: 80px; object-fit: contain; }
                .school-info { flex: 1; text-align: center; }
                .school-name { font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px; }
                .school-address { font-size: 11px; font-weight: 700; margin: 5px 0; }
                
                .receipt-title { background: #f1f5f9; border-left: 1px solid #000; text-align: center; font-weight: 900; font-size: 14px; padding: 8px; border-bottom: 1px solid #000; text-transform: uppercase; letter-spacing: 2px; }
                
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #000; }
                .info-col { padding: 10px 15px; font-size: 11px; display: flex; flex-direction: column; gap: 5px; }
                .info-row { display: flex; }
                .info-label { width: 100px; font-weight: 900; text-transform: uppercase; color: #475569; }
                .info-value { font-weight: 700; color: #000; }
                
                .fee-table { width: 100%; border-collapse: collapse; }
                .fee-table th { border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: left; background: #fff; }
                .fee-table td { border-bottom: 1px solid #000; border-left: 1px solid #000;border-right: 1px solid #000; padding: 10px 8px; font-size: 11px; font-weight: 700; }
                .fee-table th:last-child, .fee-table td:last-child { border-right: none; }
                .fee-table td:nth-child(3), .fee-table td:nth-child(4), .fee-table td:nth-child(5) { text-align: center; border-bottom: 1px solid #000; }
                
                .pay-mode-title { background: #f1f5f9; text-align: center; font-weight: 900; font-size: 11px; padding: 6px; border-bottom: 1px solid #000; text-transform: uppercase; }
                .pay-info { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 11px; border-bottom: 1px solid #000; }
                
                .summary { padding: 10px 15px; border-bottom: 1px solid #000; }
                .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                .summary-label { font-weight: 900; text-transform: uppercase; }
                .summary-value { font-weight: 900; }
                
                .in-words { padding: 10px 15px; font-size: 10px; font-weight: 700; border-bottom: 1px solid #000; }
                
                .note { font-size: 9px; font-weight: 700; color: #475569; padding: 20px 15px 10px; text-align: center; }
                
                .footer { padding: 30px 15px; display: flex; justify-content: space-between; align-items: flex-end; }
                .sig-box { text-align: center; width: 150px; }
                .sig-line { border-top: 1px solid #000; margin-bottom: 5px; }
                .sig-text { font-size: 10px; font-weight: 900; text-transform: uppercase; }
            </style>
        `;

        const totalAmountDue = Number(selectedStudent.annual_fee || 0) + (selectedStudent.transport_fee || 0);
        const refNo = formData.chequeDetails?.chequeNo || formData.upiDetails?.transactionId || formData.netbankingDetails?.transactionId || '---';
        const bankName = formData.chequeDetails?.bankName || formData.netbankingDetails?.bankName || '---';

        WinPrint.document.write(`
            <html>
                <head>
                    <title>Fee Receipt - ${selectedStudent.name}</title>
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
                        
                        <div class="receipt-title">FEE RECEIPT (${formData.term.toUpperCase()})</div>
                        
                        <div class="info-grid">
                            <div class="info-col">
                                <div class="info-row"><span class="info-label">Receipt No</span><span class="info-value">: ${successData?.receipt_no || 'N/A'}</span></div>
                                <div class="info-row"><span class="info-label">Adm No</span><span class="info-value">: ${selectedStudent.studentIdNo || '---'}</span></div>
                                <div class="info-row"><span class="info-label">Name</span><span class="info-value">: ${selectedStudent.name.toUpperCase()}</span></div>
                                <div class="info-row"><span class="info-label">Installment</span><span class="info-value">: ${formData.term.toUpperCase()}</span></div>
                            </div>
                            <div class="info-col">
                                <div class="info-row"><span class="info-label">Date</span><span class="info-value">: ${new Date(formData.date).toLocaleDateString('en-GB')}</span></div>
                                <div class="info-row"><span class="info-label">Session</span><span class="info-value">: 2026-27</span></div>
                                <div class="info-row"><span class="info-label">Class</span><span class="info-value">: ${selectedStudent.grade}</span></div>
                                
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
                                        ${selectedStudent.transport_fee > 0 ? '<div>Other Fee & Transport Fee</div>' : '<div>Other Annual Fee</div>'}
                                    </td>
                                    <td>${formatCurrency(totalAmountDue)}</td>
                                    <td>0.00</td>
                                    <td>${formatCurrency(formData.amount)}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="pay-mode-title">PAY MODE INFORMATION</div>
                        <div class="pay-info">
                            <div><strong>Pay Mode:</strong> ${formData.paymentMethod.toUpperCase()}</div>
                            <div><strong>Date:</strong> ${new Date(formData.date).toLocaleDateString('en-GB')}</div>
                            <div><strong>Ref/Chq No:</strong> ${refNo}</div>
                            <div><strong>Bank:</strong> ${bankName}</div>
                        </div>
                        
                        <div class="summary">
                            <div class="summary-row">
                                <span class="summary-label">Total Amount Paid</span>
                                <span class="summary-value">₹ ${formatCurrency(formData.amount)}</span>
                            </div>
                            <div class="summary-row" style="color: #e11d48;">
                                <span class="summary-label">Pending Balance</span>
                                <span class="summary-value">₹ ${formatCurrency(successData?.pending || 0)}</span>
                            </div>
                        </div>
                        
                        <div class="in-words">
                            TOTAL IN WORDS: ${numberToWords(Math.round(formData.amount)).toUpperCase()}
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        if (!selectedStudent) return toast.warning("Please select a student first.");
        
        const amount = Number(formData.amount);
        if (!amount || amount <= 0) return toast.warning("Please enter a valid amount.");

        // --- STRICT VALIDATION LOGIC ---
        const nameRegex = /^[A-Za-z\s]+$/;
        const mobileRegex = /^[0-9]{10}$/;
        const chequeRegex = /^[0-9]{6}$/;

        if (formData.paymentMethod === 'Cash') {
            if (!formData.payer_name.trim()) return toast.warning("Payer Name is required.");
            if (!formData.receiver_name.trim()) return toast.warning("Receiver Name is required.");
            if (!mobileRegex.test(formData.payer_mobile)) return toast.warning("Please enter a valid 10-digit mobile number.");
        }

        else if (formData.paymentMethod === 'UPI') {
            const upi = formData.upiDetails;
            if (!upi.transactionId.trim()) return toast.warning("Transaction ID (UTR) is required.");
            if (!upi.payerName.trim()) return toast.warning("Payer Name is required.");
            if (!mobileRegex.test(upi.mobileNo)) return toast.warning("Please enter a valid 10-digit mobile number.");
            if (!upi.receiverName.trim()) return toast.warning("Receiver Name is required.");
            if (!nameRegex.test(upi.payerName)) return toast.warning("Payer Name should only contain letters.");
        }

        else if (formData.paymentMethod === 'Cheque') {
            const chq = formData.chequeDetails;
            if (!chequeRegex.test(chq.chequeNo)) return toast.warning("Cheque Number must be exactly 6 digits.");
            if (!chq.payerName.trim()) return toast.warning("Payer Name is required.");
            if (!chq.bankName.trim()) return toast.warning("Bank Name is required.");
            if (!mobileRegex.test(chq.mobileNo)) return toast.warning("Please enter a valid 10-digit mobile number.");
            if (!nameRegex.test(chq.payerName)) return toast.warning("Payer Name should only contain letters.");
        }

        else if (formData.paymentMethod === 'Netbanking') {
            const net = formData.netbankingDetails;
            if (!net.transactionId.trim()) return toast.warning("Reference Number is required.");
            if (!net.payerName.trim()) return toast.warning("Payer Name is required.");
            if (!net.bankName.trim()) return toast.warning("Bank Name is required.");
            if (!mobileRegex.test(net.mobileNo)) return toast.warning("Please enter a valid 10-digit mobile number.");
        }

        const annualVal = Number(selectedStudent.annual_fee) || 0;
        const transportVal = Number(selectedStudent.transport_fee) || 0;
        const discountVal = Number(discountAmount) || 0;
        const totalPayable = Math.max(0, annualVal - discountVal) + transportVal;
        const totalPaidAlready = Number(selectedStudent.totalPaid) || 0;
        const currentEditAmount = initialPayment ? Number(initialPayment.paid_amount) : 0;
        const pendingBeforeThis = totalPayable - (totalPaidAlready - currentEditAmount);
        
        if (amount > pendingBeforeThis) {
            return toast.error(`Payment exceeds pending balance of ₹${formatCurrency(pendingBeforeThis)}`);
        }

        try {
            setSubmitting(true);
            const formDataObj = new FormData();
            formDataObj.append('student_id', selectedStudent.id);
            formDataObj.append('academic_year_id', selectedYear);
            formDataObj.append('term', formData.term);
            formDataObj.append('payment_method', formData.paymentMethod);
            formDataObj.append('amount', amount);
            formDataObj.append('date', formData.date);
            formDataObj.append('remark', formData.remark);
            
            // Consolidate Payer/Receiver/Mobile/Dates based on method
            let details = {};
            if (formData.paymentMethod === 'UPI') {
                details = formData.upiDetails;
                formDataObj.append('transaction_number', details.transactionId);
                formDataObj.append('payer_name', details.payerName);
                formDataObj.append('mobile_number', details.mobileNo);
                formDataObj.append('payment_date', details.date);
                formDataObj.append('receiver_name', details.receiverName);
            } else if (formData.paymentMethod === 'Cheque') {
                details = formData.chequeDetails;
                formDataObj.append('cheque_number', details.chequeNo);
                formDataObj.append('payer_name', details.payerName);
                formDataObj.append('bank_name', details.bankName);
                formDataObj.append('receiver_name', details.receiverName);
                formDataObj.append('cheque_date', details.date);
                formDataObj.append('mobile_number', details.mobileNo);
            } else if (formData.paymentMethod === 'Netbanking') {
                details = formData.netbankingDetails;
                formDataObj.append('transaction_number', details.transactionId);
                formDataObj.append('payer_name', details.payerName);
                formDataObj.append('bank_name', details.bankName);
                formDataObj.append('payment_date', details.date);
                formDataObj.append('mobile_number', details.mobileNo);
                formDataObj.append('receiver_name', formData.receiver_name);
            } else {
                formDataObj.append('payer_name', formData.payer_name);
                formDataObj.append('receiver_name', formData.receiver_name);
                formDataObj.append('mobile_number', formData.payer_mobile);
            }

            // Append student/fee fields for single-row storage
            formDataObj.append('total_payable', totalPayable);
            formDataObj.append('transport_amount', selectedStudent.transport_fee || 0);
            formDataObj.append('class', selectedStudent.grade);
            formDataObj.append('fee', selectedStudent.annual_fee || 0);
            formDataObj.append('paid', amount);
            formDataObj.append('balance', pendingBeforeThis - amount);
            formDataObj.append('details', JSON.stringify(details));
            formDataObj.append('discount_amount', discountAmount);
            
            if (formData.document) {
                formDataObj.append('document', formData.document);
            }

            let response;
            if (formData.id) {
                response = await updateStudentPayment(formData.id, formDataObj);
                toast.success("Payment Record Updated Successfully");
            } else {
                response = await recordStudentPayment(formDataObj);
                toast.success("Fee Entry Recorded Successfully");
            }
            
            setSuccessData({
                paid: amount,
                totalPaid: (selectedStudent.totalPaid || 0) + (formData.id ? 0 : amount), // Don't add again if editing
                pending: pendingBeforeThis - (formData.id ? 0 : amount),
                paymentMethod: formData.paymentMethod,
                details: details,
                remark: formData.remark,
                receipt_no: response?.receipt_no
            });
            setShowSuccess(true);
            if (onClose && formData.id) setTimeout(onClose, 1500);
        } catch (error) {
            toast.error(error.message || "Transaction failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`animate-in fade-in duration-700 ${onClose ? 'fixed inset-0 bg-black/60 backdrop-blur-sm z-300 flex items-center justify-center p-4 lg:p-4' : 'min-h-screen bg-institutional-page p-4 lg:p-8 space-y-8'}`}>
            <div className={`w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg flex flex-col ${onClose ? 'animate-in zoom-in-95 duration-300 max-h-[92vh] overflow-y-auto hide-scrollbar' : ''}`}>

                {/* HEADER */}
                <div className="p-6 flex items-center justify-between sticky top-0 z-100 bg-white border-b rounded-t-xl">
                    <h1 className="text-xl font-black text-institutional-main uppercase tracking-tighter pb-1 px-1">Student Fee Entry</h1>
                    <button onClick={onClose || (() => window.history.back())} className="p-2 hover:bg-slate-100 rounded-full transition-all text-institutional-muted" title="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* ROW 1: IDENTITY */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="std Name" value={selectedStudent?.name || ''} readOnly disabled />
                        <FormField label="father Name" value={selectedStudent?.fatherName || ''} readOnly disabled />
                    </div>

                    {/* ROW 2: CONTACT & CLASS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Mobile" value={selectedStudent?.contact || ''} readOnly disabled />
                        <FormField label="Class" value={selectedStudent?.grade || ''} readOnly disabled />
                    </div>

                    {/* ROW 3: CONTROLS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Collection Term" type="select" value={formData.term} onChange={(e) => handleInputChange('term', e.target.value)} options={['Term 1', 'Term 2', 'Annual Fee']} required />
                        <FormField label="Method of Pay" type="select" value={formData.paymentMethod} onChange={(e) => handleInputChange('paymentMethod', e.target.value)} options={['Cash', 'UPI', 'Cheque', 'Netbanking']} required />
                    </div>

                    {/* ROW 4: FEE MATRIX */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {/* 1. Annual Fee Card */}
                        <div className="p-3 bg-slate-50 border border-table rounded-xl flex flex-col justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Annual Fee</p>
                            <p className="text-xs font-black text-institutional-main">₹{formatCurrency(selectedStudent?.annual_fee)}</p>
                        </div>

                        {/* 2. Discount Input Card */}
                        <div className="p-3 bg-slate-50 border border-table rounded-xl flex flex-col justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Discount</p>
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-0.5 mt-1">
                                <span className="text-[10px] font-bold text-slate-400">₹</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={discountAmount}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setDiscountAmount(val >= 0 ? val : 0);
                                    }}
                                    className="w-full bg-transparent text-xs font-black text-institutional-main outline-none"
                                />
                            </div>
                        </div>

                        {/* 3. Annual Fee After Discount Card */}
                        <div className="p-3 bg-slate-50 border border-table rounded-xl flex flex-col justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Annual Fee After Discount</p>
                            <p className="text-xs font-black text-institutional-main">₹{formatCurrency(Math.max(0, (selectedStudent?.annual_fee || 0) - discountAmount))}</p>
                        </div>

                        {/* 4. Transport Card */}
                        <div className="p-3 bg-slate-50 border border-table rounded-xl flex flex-col justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Transport</p>
                            <p className="text-xs font-black text-institutional-main">₹{formatCurrency(selectedStudent?.transport_fee)}</p>
                        </div>

                        {/* 5. Total Fee Card */}
                        <div className="p-3 bg-[#001736] border border-[#001736] rounded-xl shadow-sm flex flex-col justify-between">
                            <p className="text-[9px] font-black text-white/60 uppercase mb-1">Total Fee</p>
                            <p className="text-xs font-black text-white">₹{formatCurrency(Math.max(0, (selectedStudent?.annual_fee || 0) - discountAmount) + (selectedStudent?.transport_fee || 0))}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                        <FormField label="Payment Date" type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} required />
                        
                        {(() => {
                            const annual = Number(selectedStudent?.annual_fee || 0);
                            const transport = Number(selectedStudent?.transport_fee || 0);
                            const discount = Number(discountAmount || 0);
                            const totalFee = Math.max(0, annual - discount) + transport;
                            const term1 = totalFee / 2;
                            const term2 = totalFee / 2;

                            return (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Term 1 Fee</label>
                                        <div className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm text-center flex items-center justify-center min-h-[46px] shadow-sm">
                                            ₹{formatCurrency(term1)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Term 2 Fee</label>
                                        <div className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm text-center flex items-center justify-center min-h-[46px] shadow-sm">
                                            ₹{formatCurrency(term2)}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Already Paid</label>
                            <div className="px-5 py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl font-black text-sm text-center flex items-center justify-center min-h-[46px] shadow-sm">
                                {(() => {
                                    const totalPaidAlready = Number(selectedStudent?.totalPaid || 0);
                                    const currentPaymentValue = initialPayment ? Number(initialPayment.paid_amount) : 0;
                                    const alreadyPaid = totalPaidAlready - currentPaymentValue;
                                    return `₹${formatCurrency(alreadyPaid)}`;
                                })()}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Pending Balance</label>
                            <div className="px-5 py-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-black text-sm text-center flex items-center justify-center min-h-[46px] shadow-sm">
                                {(() => {
                                    const annual = Number(selectedStudent?.annual_fee || 0);
                                    const transport = Number(selectedStudent?.transport_fee || 0);
                                    const discount = Number(discountAmount || 0);
                                    const totalPayable = Math.max(0, annual - discount) + transport;
                                    const totalPaidAlready = Number(selectedStudent?.totalPaid || 0);
                                    
                                    // If we are editing, totalPaidAlready includes initialPayment.paid_amount.
                                    // We want the balance BEFORE this specific payment was made.
                                    const currentPaymentValue = initialPayment ? Number(initialPayment.paid_amount) : 0;
                                    const balanceBeforeCurrent = totalPayable - (totalPaidAlready - currentPaymentValue);
                                    
                                    return `₹${formatCurrency(balanceBeforeCurrent)}`;
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* ROW 5: PAYER & RECEIVER (ONLY FOR CASH) */}
                    {formData.paymentMethod === 'Cash' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField 
                                label="Payer Name" 
                                value={formData.payer_name} 
                                onChange={(e) => handleInputChange('payer_name', e.target.value)} 
                                placeholder="Enter Payer Name"
                            />
                            <FormField 
                                label="Receiver Name" 
                                value={formData.receiver_name} 
                                onChange={(e) => handleInputChange('receiver_name', e.target.value)} 
                            />
                            <FormField 
                                label="Mobile Number" 
                                value={formData.payer_mobile} 
                                onChange={(e) => handleInputChange('payer_mobile', e.target.value)} 
                                placeholder="Payer Mobile"
                            />
                        </div>
                    )}

                    {/* ROW 6: DOCUMENT & REMARK */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative flex flex-col">
                            <FormField label="Document Upload" type="file" onChange={(e) => handleInputChange('document', e.target.files[0])} />
                            {/* Document Preview/View Button */}
                            {(formData.document || initialPayment?.attachment_url) && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (formData.document) {
                                            const url = URL.createObjectURL(formData.document);
                                            window.open(url, '_blank');
                                        } else if (initialPayment?.attachment_url) {
                                            window.open(`${ROOT_URL}/uploads/${initialPayment.attachment_url}`, '_blank');
                                        }
                                    }}
                                    className="absolute right-2 top-[34px] p-2 bg-white border border-table rounded-lg shadow-sm hover:bg-slate-50 transition-all group flex items-center gap-2"
                                    title="View Document"
                                >
                                    <Eye className="w-4 h-4 text-institutional-main" />
                                    <span className="text-[8px] font-black uppercase text-institutional-main hidden group-hover:inline">View Doc</span>
                                </button>
                            )}
                        </div>
                        <FormField label="Remark" placeholder="Optional notes..." value={formData.remark} onChange={(e) => handleInputChange('remark', e.target.value)} />
                    </div>

                    {/* DYNAMIC DETAILS BOX (e.g. Cheque Details) */}
                    {(formData.paymentMethod !== 'Cash') && (
                        <div className="p-8 bg-slate-50 border border-table rounded-xl space-y-8 animate-in slide-in-from-bottom-2 duration-500 text-left">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-institutional-muted border-b pb-2">{formData.paymentMethod} Detail's</h3>
                            {formData.paymentMethod === 'UPI' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField label="Transaction ID" placeholder="Ref No / UTR" value={formData.upiDetails.transactionId} onChange={(e) => handleInputChange('upiDetails', e.target.value, 'transactionId')} required />
                                    <FormField label="Payer Name" placeholder="Sender Name" value={formData.upiDetails.payerName} onChange={(e) => handleInputChange('upiDetails', e.target.value, 'payerName')} required />
                                    <FormField label="Mobile Number" placeholder="10-digit number" value={formData.upiDetails.mobileNo} onChange={(e) => handleInputChange('upiDetails', e.target.value, 'mobileNo')} />
                                    <FormField label="Receiver Name" value={formData.upiDetails.receiverName} onChange={(e) => handleInputChange('upiDetails', e.target.value, 'receiverName')} />
                                    <FormField label="Transaction Date" type="date" value={formData.upiDetails.date} onChange={(e) => handleInputChange('upiDetails', e.target.value, 'date')} />
                                </div>
                            )}

                            {formData.paymentMethod === 'Cheque' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField label="Cheque Number" placeholder="6-digit code" value={formData.chequeDetails.chequeNo} onChange={(e) => handleInputChange('chequeDetails', e.target.value, 'chequeNo')} required />
                                    <FormField label="Payer Name" placeholder="Drawer Name" value={formData.chequeDetails.payerName} onChange={(e) => handleInputChange('chequeDetails', e.target.value, 'payerName')} required />
                                    <FormField label="Bank Name" placeholder="Drawee Bank" value={formData.chequeDetails.bankName} onChange={(e) => handleInputChange('chequeDetails', e.target.value, 'bankName')} required />
                                    <FormField label="Receiver Name" value={formData.chequeDetails.receiverName} onChange={(e) => handleInputChange('chequeDetails', e.target.value, 'receiverName')} />
                                    <FormField label="Cheque Date" type="date" value={formData.chequeDetails.date} onChange={(e) => handleInputChange('chequeDetails', e.target.value, 'date')} />
                                    <FormField label="Mobile Number" value={formData.chequeDetails.mobileNo} onChange={(e) => handleInputChange('chequeDetails', e.target.value, 'mobileNo')} />
                                </div>
                            )}

                            {formData.paymentMethod === 'Netbanking' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField label="Transaction ID" placeholder="Reference Number" value={formData.netbankingDetails.transactionId} onChange={(e) => handleInputChange('netbankingDetails', e.target.value, 'transactionId')} required />
                                    <FormField label="Payer Name" placeholder="Account Holder" value={formData.netbankingDetails.payerName} onChange={(e) => handleInputChange('netbankingDetails', e.target.value, 'payerName')} required />
                                    <FormField label="Transaction Date" type="date" value={formData.netbankingDetails.date} onChange={(e) => handleInputChange('netbankingDetails', e.target.value, 'date')} />
                                    <FormField label="Mobile Number" value={formData.netbankingDetails.mobileNo} onChange={(e) => handleInputChange('netbankingDetails', e.target.value, 'mobileNo')} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* PAID AMOUNT */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black text-institutional-main uppercase tracking-widest ml-1">Actual Paid Amount *</label>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-table focus-within:border-institutional-main focus-within:bg-white transition-all group">
                            <span className="text-2xl font-black text-slate-300 group-focus-within:text-institutional-main ml-2">₹</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => handleInputChange('amount', e.target.value)}
                                className="w-full bg-transparent text-2xl font-black text-institutional-main outline-none placeholder:text-slate-300"
                                required
                            />
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <form onSubmit={handleSubmit} className="flex items-center justify-end gap-4 pt-4 border-t border-slate-50 mt-4">
                        <button
                            type="submit"
                            disabled={submitting || !selectedStudent}
                            className="px-10 py-4 border btn-add-institutional rounded-xl font-black text-xs uppercase tracking-[0.4em] shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={onClose || (() => window.history.back())}
                            className="px-10 py-4 border-2 border-slate-900 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
            {/* SUCCESS WINDOW */}
            {showSuccess && (
                <div className="fixed inset-0 bg-institutional-main/80 backdrop-blur-md z-500 flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-4xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 max-h-[90vh] flex flex-col">
                        {/* HEADER */}
                        <div className="p-6 bg-slate-50 border-b flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-institutional-main uppercase tracking-tighter">Payment Confirmed</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Receipt Generated & Ledger Synchronized</p>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8">
                            {/* FEE OVERVIEW GRID */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 border border-table rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Annual Fee</p>
                                    <p className="text-[11px] font-black text-institutional-main">₹{formatCurrency(selectedStudent?.annual_fee)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-table rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Transport</p>
                                    <p className="text-[11px] font-black text-institutional-main">₹{formatCurrency(selectedStudent?.transport_fee)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-table rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Term 1 Target</p>
                                    <p className="text-[11px] font-black text-slate-600">₹{formatCurrency(((selectedStudent?.annual_fee || 0) + (selectedStudent?.transport_fee || 0)) / 2)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-table rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Term 2 Target</p>
                                    <p className="text-[11px] font-black text-slate-600">₹{formatCurrency(((selectedStudent?.annual_fee || 0) + (selectedStudent?.transport_fee || 0)) / 2)}</p>
                                </div>
                            </div>

                            {/* TRANSACTION DETAILS TABLE */}
                            <div className="border border-table rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-slate-900 p-4 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Transaction Summary</span>
                                    <span className="bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Success</span>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-left">
                                        <tbody className="text-[10px] font-bold uppercase">
                                            <tr className="border-b border-slate-50">
                                                <td className="px-6 py-4 bg-slate-50/50 text-slate-400 font-black w-1/3">Paid Amount</td>
                                                <td className="px-6 py-4 text-emerald-600 font-black">₹{formatCurrency(successData?.paid)}</td>
                                            </tr>
                                            <tr className="border-b border-slate-50">
                                                <td className="px-6 py-4 bg-slate-50/50 text-slate-400 font-black">Payment Mode</td>
                                                <td className="px-6 py-4 text-institutional-main">{successData?.paymentMethod}</td>
                                            </tr>
                                            {successData?.details && Object.entries(successData.details).map(([key, val]) => (
                                                val && (
                                                    <tr key={key} className="border-b border-slate-50">
                                                        <td className="px-6 py-4 bg-slate-50/50 text-slate-400 font-black capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
                                                        <td className="px-6 py-4 text-slate-700">{val}</td>
                                                    </tr>
                                                )
                                            ))}
                                            {successData?.remark && (
                                                <tr className="border-b border-slate-50">
                                                    <td className="px-6 py-4 bg-slate-50/50 text-slate-400 font-black">Official Remark</td>
                                                    <td className="px-6 py-4 text-slate-700 italic">"{successData.remark}"</td>
                                                </tr>
                                            )}
                                            {formData.document && (
                                                <tr className="border-b border-slate-50">
                                                    <td className="px-6 py-4 bg-slate-50/50 text-slate-400 font-black">Payment Proof</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-info text-[9px] font-black underline cursor-default">Document Attached</span>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td className="px-6 py-4 bg-rose-50/50 text-rose-400 font-black">Balance Remaining</td>
                                                <td className="px-6 py-4 text-rose-500 font-black">₹{formatCurrency(successData?.pending)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="p-6 bg-slate-50 border-t flex flex-col md:flex-row gap-3">
                            <button
                                onClick={handleDownloadReceipt}
                                className="flex-1 py-4 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg flex items-center justify-center gap-3 transition-none"
                            >
                                <Printer className="w-4 h-4" /> Generate Receipt
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 border-2 border-slate-900 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Internal Form Field Helper
const FormField = ({ label, value, onChange, placeholder, type = "text", options = [], required, readOnly, disabled }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-institutional-main uppercase tracking-widest ml-1">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {type === 'select' ? (
            <div className="relative group">
                <select
                    value={value}
                    onChange={onChange}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-table rounded-xl outline-none focus:border-institutional-main focus:bg-white font-bold transition-all uppercase tracking-widest text-[10px] appearance-none cursor-pointer pr-10"
                >
                    <option value="">Select {label}</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-institutional-muted">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
            </div>
        ) : type === 'file' ? (
            <div className="relative">
                <input
                    type="file"
                    onChange={onChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-table rounded-xl font-bold text-[10px] uppercase tracking-widest file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-2 file:border-table file:text-[9px] file:font-black file:bg-white file:text-institutional-main file:cursor-pointer hover:border-institutional-main transition-all"
                />
            </div>
        ) : (
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                disabled={disabled}
                className={`w-full px-5 py-3.5 border rounded-xl outline-none transition-all uppercase tracking-widest text-[10px] font-bold ${readOnly ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-table focus:border-institutional-main focus:bg-white'}`}
            />
        )}
    </div>
);

export default StudentFeeEntry;
