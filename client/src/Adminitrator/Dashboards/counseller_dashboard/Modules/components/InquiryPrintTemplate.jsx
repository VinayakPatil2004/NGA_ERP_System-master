import React from 'react';
import ngaLogo from '../../../../../assets/nga-logo.png';

const InquiryPrintTemplate = React.forwardRef(({ data, yearName }, ref) => {
    if (!data) return null;

    return (
        <div ref={ref} className="p-12 bg-white text-black font-serif print-content">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                <div className="flex gap-4">
                    <img src={ngaLogo} alt="Logo" className="w-20 h-20 object-contain" />
                    <div>
                        <h1 className="text-2xl font-bold uppercase">New Grace Academy</h1>
                        <p className="text-sm font-semibold italic">English Medium School & Junior College</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase mb-2">Admission Inquiry Form</h2>
                    <div className="border border-black px-4 py-2 inline-block">
                        <span className="font-bold">Form No: </span>
                        <span className="text-red-600 font-bold ml-2">{data.form_no || '______'}</span>
                    </div>
                </div>
            </div>

            {/* Top Row */}
            <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="border-b border-dotted border-black pb-1">
                    <span className="font-bold">Reference: </span> {data.reference || '_____________________'}
                </div>
                <div className="border-b border-dotted border-black pb-1">
                    <span className="font-bold">Date: </span> {new Date(data.enquiry_date).toLocaleDateString() || '_____________________'}
                </div>
            </div>

            {/* Student Info */}
            <div className="space-y-4">
                <div className="border-b border-dotted border-black pb-1">
                    <span className="font-bold">Pupil's Name in Full: </span> {data.full_name}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="border-b border-dotted border-black pb-1 col-span-1">
                        <span className="font-bold">Place of Birth: </span> {data.place_of_birth}
                    </div>
                    <div className="border-b border-dotted border-black pb-1 col-span-1">
                        <span className="font-bold">DOB: </span> {data.dob ? new Date(data.dob).toLocaleDateString() : '____________'}
                    </div>
                    <div className="border-b border-dotted border-black pb-1 col-span-1">
                        <span className="font-bold">Aadhar No: </span> {data.aadhar_no}
                    </div>
                </div>

                <div className="border-b border-dotted border-black pb-1">
                    <span className="font-bold">Address: </span> {data.address}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="border-b border-dotted border-black pb-1">
                        <span className="font-bold">Admission for Std: </span> {data.admission_std}
                    </div>
                    <div className="border-b border-dotted border-black pb-1">
                        <span className="font-bold">Previous Std: </span> {data.prev_std}
                    </div>
                    <div className="border-b border-dotted border-black pb-1">
                        <span className="font-bold">Caste: </span> {data.caste}
                    </div>
                </div>

                <div className="border-b border-dotted border-black pb-1">
                    <span className="font-bold">Name of Previous School: </span> {data.prev_school}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="border-b border-dotted border-black pb-1">
                        <span className="font-bold">No. of Siblings: </span> {data.siblings_count}
                    </div>
                    <div className="border-b border-dotted border-black pb-1">
                        <span className="font-bold">Age: </span> {data.age}
                    </div>
                    <div className="border-b border-dotted border-black pb-1">
                        <span className="font-bold">Religion: </span> {data.religion}
                    </div>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-4 py-2">
                    <span className="font-bold">Category: </span>
                    {['SC', 'ST', 'VJ', 'NT', 'SBC', 'OBC', 'OPEN'].map(cat => (
                        <div key={cat} className="flex items-center gap-1">
                            <div className={`w-4 h-4 border border-black flex items-center justify-center text-[10px] ${data.category === cat ? 'bg-black text-white' : ''}`}>
                                {data.category === cat ? 'X' : ''}
                            </div>
                            <span className="text-[10px] font-bold">{cat}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4">
                        <span className="font-bold">Bus facility required: </span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <div className={`w-4 h-4 border border-black flex items-center justify-center text-[10px] ${data.bus_facility ? 'bg-black text-white' : ''}`}>
                                    {data.bus_facility ? 'X' : ''}
                                </div>
                                <span className="text-[10px] font-bold">Yes</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className={`w-4 h-4 border border-black flex items-center justify-center text-[10px] ${!data.bus_facility ? 'bg-black text-white' : ''}`}>
                                    {!data.bus_facility ? 'X' : ''}
                                </div>
                                <span className="text-[10px] font-bold">No</span>
                            </div>
                        </div>
                    </div>
                    {data.bus_facility && (
                        <div className="border-b border-dotted border-black pb-1">
                            <span className="font-bold">Area: </span> {data.bus_area}
                        </div>
                    )}
                </div>
            </div>

            {/* Parent Info */}
            <div className="mt-8 space-y-6">
                {/* Father */}
                <div className="space-y-4">
                    <div className="border-b border-dotted border-black pb-1">
                        <span className="font-bold">Father's Name: </span> {data.father_name}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-dotted border-black pb-1">
                            <span className="font-bold">Contact No.: </span> {data.father_contact}
                        </div>
                        <div className="border-b border-dotted border-black pb-1">
                            <span className="font-bold">Qualification: </span> {data.father_qual}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-dotted border-black pb-1">
                            <span className="font-bold">Profession: </span> {data.father_prof}
                        </div>
                        <div className="border-b border-dotted border-black pb-1">
                            <span className="font-bold">Annual Income: </span> {data.father_income}
                        </div>
                    </div>
                </div>

                {/* Mother */}
                <div className="space-y-4">
                    <div className="border-b border-dotted border-black pb-1">
                        <span className="font-bold">Mother's Name: </span> {data.mother_name || '____________________________________________________________________'}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-dotted border-black pb-1">
                            <span className="font-bold">Contact No.: </span> {data.mother_contact || '_________________________'}
                        </div>
                        <div className="border-b border-dotted border-black pb-1">
                            <span className="font-bold">Qualification: </span> {data.mother_qual || '_________________________'}
                        </div>
                    </div>
                    <div className="border-b border-dotted border-black pb-1">
                        <span className="font-bold">Profession: </span> {data.mother_prof || '____________________________________________________'}
                    </div>
                </div>
            </div>

            {/* Signatures */}
            <div className="mt-20 flex justify-between">
                <div className="border-t border-black pt-2 px-8">
                    <p className="font-bold">Sign of Father</p>
                </div>
                <div className="border-t border-black pt-2 px-8">
                    <p className="font-bold">Sign of Mother</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-[8px] italic text-gray-500 uppercase tracking-widest border-t border-slate-100 pt-4">
                Generated via Grace ERP Institutional System • Academic Year {yearName}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { margin: 15mm; }
                    body * { visibility: hidden; }
                    .print-content, .print-content * { visibility: visible; }
                    .print-content { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        padding: 0;
                        margin: 0;
                    }
                }
            `}} />
        </div>
    );
});

export default InquiryPrintTemplate;
