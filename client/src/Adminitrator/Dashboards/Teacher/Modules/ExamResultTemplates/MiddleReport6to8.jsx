import React from 'react';

const MiddleReport6to8 = ({
    term1Data,
    term2Data,
    coScholasticData,
    overallStats,
    studentData
}) => {

    // Student fields
    const fullName = studentData?.student_name || [studentData?.first_name, studentData?.last_name].filter(Boolean).join(' ') || '—';
    const fatherName = studentData?.father_name || '—';
    const motherName = studentData?.mother_name || '—';
    const className = studentData?.class_name
        ? `${studentData.class_name}${studentData.section ? ' - ' + studentData.section : ''}`
        : '—';
    const contact = studentData?.father_mobile || studentData?.mother_mobile || '—';

    // Fill up empty rows up to 7 for Scholastic
    const padRows = (data, count = 7) => {
        const padded = [...data];
        while (padded.length < count) {
            padded.push({});
        }
        return padded;
    };

    const paddedTerm1 = padRows(term1Data, 7);
    const paddedTerm2 = padRows(term2Data, 7);

    // List of co-scholastic areas expected in 6th-8th
    const coScholasticAreas = [
        "Work Education",
        "Art Education",
        "Physical Education",
        "Scientific Skills",
        "Yoga / NCC"
    ];

    const getCoScholasticGrades = (areaName) => {
        const item = coScholasticData.find(c => c.area_name?.toLowerCase() === areaName.toLowerCase());
        return {
            term1: item?.grade_term1 || '',
            term2: item?.grade_term2 || ''
        };
    };

    return (
        <div className="bg-white print:m-0 w-full max-w-[210mm] min-h-[297mm] mx-auto p-6 pb-4 text-[#001736] print:p-6 print:pb-4 print:shadow-none shadow-xl border border-slate-200 flex flex-col justify-between">

            <div>
                {/* Top Header Row: Logo & Student Details */}
                <div style={{
                    display: 'flex', gap: '30px', alignItems: 'center',
                    borderBottom: '1.5px solid #000', paddingBottom: '10px', marginBottom: '16px',
                    backgroundColor: '#fff'
                }}>

                    {/* Left: School Logo */}
                    <div style={{ width: '180px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                        <img src="/logo.png" alt="School Logo" style={{ maxHeight: '64px', objectFit: 'contain' }} />
                    </div>

                    {/* Right: Student Details Grid */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 30px' }}>
                        {[
                            ['Student Name', fullName, true],
                            ["Father's Name", fatherName],
                            ['Mother Name', motherName],
                            ['Class', className],
                            ['Contact No.', contact],
                        ].map(([label, value, span2]) => (
                            <div key={label} style={{
                                display: 'flex', gap: '5px', fontSize: '11px', color: '#000',
                                backgroundColor: '#fff', alignItems: 'flex-end',
                                gridColumn: span2 ? 'span 2' : 'auto'
                            }}>
                                <span style={{ fontWeight: 'bold', minWidth: '82px', flexShrink: 0 }}>{label}:</span>
                                <span style={{ flex: 1 }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Term 1 Section */}
                <div className="mb-5">
                    <div className="flex gap-4">
                        {/* Scholastic Table */}
                        <div className="flex-1">
                            <table className="w-full border-collapse border border-black text-[10px]">
                                <thead>
                                    <tr>
                                        <th colSpan={2} className="border border-slate-800 px-2 py-2 text-left bg-transparent text-[11px] font-bold">
                                            Scholastic Area
                                        </th>
                                        <th colSpan={6} className="border border-slate-800 px-2 py-2 text-center bg-[#FDE68A] font-bold">
                                            Term - 1 (100 Marks)
                                        </th>
                                    </tr>
                                    <tr className="bg-[#FDE68A]">
                                        <th className="border border-slate-800 px-1 py-2 w-8 text-center leading-tight">Sr.<br />No.</th>
                                        <th className="border border-slate-800 px-2 py-2 text-left w-48">Subject</th>
                                        <th className="border border-slate-800 px-1 py-2 w-16 text-center leading-tight">Unit I<br />Written<br /><span className="text-[8px]">(10)</span></th>
                                        <th className="border border-slate-800 px-1 py-2 w-24 text-center leading-tight">Subject<br />Enrichment<br />oral/Project<br />/Class test<br /><span className="text-[8px]">(5)</span></th>
                                        <th className="border border-slate-800 px-1 py-2 w-16 text-center leading-tight">Note<br />Book<br /><span className="text-[8px]">(5)</span></th>
                                        <th className="border border-slate-800 px-1 py-2 w-16 text-center leading-tight">Term 1<br />Written<br /><span className="text-[8px]">(80)</span></th>
                                        <th className="border border-slate-800 px-1 py-2 w-16 text-center leading-tight">Total<br />Out of<br /><span className="text-[8px]">(100)</span></th>
                                        <th className="border border-slate-800 px-2 py-2 w-12 text-center font-bold">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paddedTerm1.map((row, idx) => {
                                        const enrichment = row.class_test ? parseFloat(row.class_test).toFixed(2) : '\u00A0';
                                        return (
                                            <tr key={idx}>
                                                <td className="border border-slate-800 px-1 py-2 text-center font-bold">{row.subject_name ? idx + 1 : '\u00A0'}</td>
                                                <td className="border border-slate-800 px-2 py-2 font-bold uppercase">{row.subject_name || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center">{row.unit_written || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center">{enrichment}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center">{row.notebook || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center">{row.term_written || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center font-bold">{row.total_obtained || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-2 py-2 text-center font-bold">{row.grade || '\u00A0'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Signatures Term 1 */}
                        <div className="w-56 pl-2 flex flex-col pt-2 text-[12px] font-bold space-y-5">
                            <div className="uppercase underline underline-offset-4 decoration-2 mb-5">Term I Signature :</div>
                            <div className="flex justify-between items-end">
                                <span>Class Teacher</span>
                                <span className="w-24 border-b border-dotted border-black"></span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span>Supervisor</span>
                                <span className="w-24 border-b border-dotted border-black"></span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span>Principal</span>
                                <span className="w-24 border-b border-dotted border-black"></span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span>Parent</span>
                                <span className="w-24 border-b border-dotted border-black"></span>
                            </div>
                            <div className="flex justify-between items-end pt-1">
                                <span>Attendance</span>
                                <span className="w-24 border-b border-dotted border-black text-center">{overallStats?.term1_attendance || '     /     '}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Term 2 Section */}
                <div className="mb-5">
                    <div className="flex gap-4">
                        {/* Scholastic Table */}
                        <div className="flex-1">
                            <table className="w-full border-collapse border border-black text-[10px]">
                                <thead>
                                    <tr>
                                        <th colSpan={2} className="border border-slate-800 px-2 py-2 text-left bg-transparent text-[11px] font-bold">
                                            Scholastic Area
                                        </th>
                                        <th colSpan={6} className="border border-slate-800 px-2 py-2 text-center bg-[#FDE68A] font-bold">
                                            Term - 2 (100 Marks)
                                        </th>
                                    </tr>
                                    <tr className="bg-[#FDE68A]">
                                        <th className="border border-slate-800 px-1 py-2 w-8 text-center leading-tight">Sr.<br />No.</th>
                                        <th className="border border-slate-800 px-2 py-2 text-left w-48">Subject</th>
                                        <th className="border border-slate-800 px-1 py-2 w-16 text-center leading-tight">Unit I<br />Written<br /><span className="text-[8px]">(10)</span></th>
                                        <th className="border border-slate-800 px-1 py-2 w-24 text-center leading-tight">Subject<br />Enrichment<br />oral/Project<br />/Class test<br /><span className="text-[8px]">(5)</span></th>
                                        <th className="border border-slate-800 px-1 py-2 w-16 text-center leading-tight">Note<br />Book<br /><span className="text-[8px]">(5)</span></th>
                                        <th className="border border-slate-800 px-1 py-2 w-16 text-center leading-tight">Term 2<br />Written<br /><span className="text-[8px]">(80)</span></th>
                                        <th className="border border-slate-800 px-1 py-2 w-16 text-center leading-tight">Total<br />Out of<br /><span className="text-[8px]">(100)</span></th>
                                        <th className="border border-slate-800 px-2 py-2 w-12 text-center font-bold">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paddedTerm2.map((row, idx) => {
                                        const enrichment = row.class_test ? parseFloat(row.class_test).toFixed(2) : '\u00A0';
                                        return (
                                            <tr key={idx}>
                                                <td className="border border-slate-800 px-1 py-2 text-center font-bold">{row.subject_name ? idx + 1 : '\u00A0'}</td>
                                                <td className="border border-slate-800 px-2 py-2 font-bold uppercase">{row.subject_name || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center">{row.unit_written || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center">{enrichment}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center">{row.notebook || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center">{row.term_written || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-1 py-2 text-center font-bold">{row.total_obtained || '\u00A0'}</td>
                                                <td className="border border-slate-800 px-2 py-2 text-center font-bold">{row.grade || '\u00A0'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Signatures Term 2 */}
                        <div className="w-56 pl-2 flex flex-col pt-2 text-[12px] font-bold space-y-5">
                            <div className="uppercase underline underline-offset-4 decoration-2 mb-5">Term II Signature :</div>
                            <div className="flex justify-between items-end">
                                <span>Class Teacher</span>
                                <span className="w-24 border-b border-dotted border-black"></span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span>Supervisor</span>
                                <span className="w-24 border-b border-dotted border-black"></span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span>Principal</span>
                                <span className="w-24 border-b border-dotted border-black"></span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span>Parent</span>
                                <span className="w-24 border-b border-dotted border-black"></span>
                            </div>
                            <div className="flex justify-between items-end pt-0.5">
                                <span>Attendance</span>
                                <span className="w-24 border-b border-dotted border-black text-center">{overallStats?.term2_attendance || '     /     '}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Stats Section */}
                <div className="flex justify-between gap-8 mb-2 mt-2">
                    {/* Co-Scholastic Box */}
                    <div className="w-[45%]">
                        <table className="w-full border-collapse border border-black text-[11px]">
                            <thead>
                                <tr className="bg-[#FDE68A]">
                                    <th rowSpan={2} className="border border-slate-800 px-2 py-1 text-center leading-tight">
                                        <strong>Co-Scholastic Areas</strong><br />
                                        <span className="font-normal text-[8px]">(3 Point Grading Scales A,B,C)</span>
                                    </th>
                                    <th colSpan={2} className="border border-slate-800 px-2 py-1 text-center font-bold">Grade</th>
                                </tr>
                                <tr className="bg-[#FDE68A]">
                                    <th className="border border-slate-800 px-2 py-1 w-16 text-center font-bold">Term 1</th>
                                    <th className="border border-slate-800 px-2 py-1 w-16 text-center font-bold">Term 2</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coScholasticAreas.map((area, idx) => {
                                    const grades = getCoScholasticGrades(area);
                                    return (
                                        <tr key={idx}>
                                            <td className="border border-slate-800 px-2 py-1 font-medium">{area}</td>
                                            <td className="border border-slate-800 px-2 py-1 text-center font-bold">{grades.term1 || '\u00A0'}</td>
                                            <td className="border border-slate-800 px-2 py-1 text-center font-bold">{grades.term2 || '\u00A0'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Overall Stats Boxes */}
                    <div className="w-64 flex flex-col justify-center space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="w-32 bg-[#FFEDD5] border border-orange-200 px-3 py-1 text-[11px] font-bold">Overall Marks :</span>
                            <div className="w-28 h-7 border border-slate-800 text-center font-bold text-[12px] pt-1">{overallStats?.totalMarks}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="w-32 bg-[#FFEDD5] border border-orange-200 px-3 py-1 text-[11px] font-bold">Percentage :</span>
                            <div className="w-28 h-7 border border-slate-800 text-center font-bold text-[12px] pt-1">{overallStats?.percentage ? `${overallStats.percentage}%` : '\u00A0'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="w-32 bg-[#FFEDD5] border border-orange-200 px-3 py-1 text-[11px] font-bold">Grade :</span>
                            <div className="w-28 h-7 border border-slate-800 text-center font-bold text-[12px] pt-1">{overallStats?.grade}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="w-32 bg-[#FFEDD5] border border-orange-200 px-3 py-1 text-[11px] font-bold">Attendance :</span>
                            <div className="w-28 h-7 border border-slate-800 text-center font-bold text-[12px] pt-1">{overallStats?.attendance}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div>
                <table className="w-full border-collapse border border-black text-[11px]">
                    <tbody>
                        <tr>
                            <td className="border border-slate-800 bg-[#E5E7EB] px-3 py-1 font-bold w-[65%] uppercase">CONGRATULATION !!! PROMOTED TO CLASS</td>
                            <td className="border border-slate-800 bg-[#E5E7EB] px-3 py-1 font-bold text-center uppercase">PASSED AND PROMOTED IN <span className="underline decoration-slate-800 underline-offset-4 ml-1">{overallStats?.promotedClass || '    '}</span></td>
                        </tr>
                        <tr>
                            <td className="border border-slate-800 bg-[#E5E7EB] px-3 py-1 font-bold uppercase">NEW SESSION BEGINS ON</td>
                            <td className="border border-slate-800 bg-[#E5E7EB] px-3 py-1 font-bold text-center uppercase"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MiddleReport6to8;
