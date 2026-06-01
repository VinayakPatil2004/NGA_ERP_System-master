import React from 'react';

const PrePrimaryReport = ({ prePrimaryData, studentData }) => {
    const term1 = prePrimaryData?.find(d => d.term === 'Term 1' || d.term === 'I Term') || {};
    const term2 = prePrimaryData?.find(d => d.term === 'Term 2' || d.term === 'II Term') || {};

    const getNextClass = (currentClass) => {
        if (!currentClass) return '—';
        const name = currentClass.toLowerCase();
        if (name.includes('nursery')) return 'Jr. KG';
        if (name.includes('junior') || name.includes('jr')) return 'Sr. KG';
        if (name.includes('senior') || name.includes('sr')) return 'I st';
        if (name.includes('1st') || name.includes('i ')) return 'II nd';
        return 'Next Level';
    };
    const nextClass = getNextClass(studentData?.class_name);

    const bg = '#b5b564';

    // Student fields
    const fullName = studentData?.student_name || [studentData?.first_name, studentData?.last_name].filter(Boolean).join(' ') || '—';
    const fatherName = studentData?.father_name || '—';
    const motherName = studentData?.mother_name || '—';
    const className = studentData?.class_name
        ? `${studentData.class_name}${studentData.section ? ' - ' + studentData.section : ''}`
        : '—';
    const contact = studentData?.father_mobile || studentData?.mother_mobile || '—';

    /* ── shared styles ──────────────────────────────────────────── */
    const HDR = {
        border: '1px solid #000',
        backgroundColor: bg,
        color: '#000',
        fontWeight: 'bold',
        fontSize: '11px',
        padding: '0 7px',
        verticalAlign: 'middle',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
    };
    const CELL = {
        border: '1px solid #000',
        backgroundColor: '#fff',
        color: '#000',
        fontSize: '11px',
        padding: '0 7px',
        verticalAlign: 'middle',
    };
    const VAL = { ...CELL, textAlign: 'center', fontWeight: 'bold', fontSize: '13px' };

    /* ── row heights (tweak here to fill page perfectly) ──────── */
    // Page 1 – available ≈ 217mm after student header (25mm) + image (30mm) + gaps (5mm)
    // We have: 10 rows (achieved) + 4 (art) + 2 (gk) + 2 (attendance) = 18 rows
    const P1_ROW = { height: '11mm' }; // taller rows = more gap inside cells

    // Page 2 – available ≈ 150mm after signatures (55mm) + promo (40mm) + logo (30mm)
    // We have: 8 data rows (trained)
    const P2_TRAINED_ROW = { height: '18mm' }; // 8 × 18 ≈ 144mm ✓

    /* ── page wrapper style ─────────────────────────────────────── */
    const PAGE = {
        display: 'flex',
        flexDirection: 'column',
        width: '210mm',
        minHeight: '297mm',
        padding: '10mm 13mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        colorScheme: 'light',
        margin: '0 auto 24px auto',
        border: '1px solid #bbb',
    };

    return (
        <>
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    html, body, #root {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background: #ffffff !important;
                        color-scheme: light !important;
                        margin: 0 !important; padding: 0 !important;
                    }
                    * { color-scheme: light !important; }
                    .pp-page {
                        width: 210mm !important;
                        min-height: 297mm !important;
                        height: 297mm !important;
                        padding: 10mm 13mm !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        border: none !important;
                        margin: 0 !important;
                    }
                    .pp-page:last-of-type {
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }
                }
            `}</style>

            {/* ══════════════ PAGE 1 : Academics ══════════════ */}
            <div className="pp-page" style={PAGE}>


                {/* Top Header Row: Logo & Student Details */}
                <div style={{
                    display: 'flex', gap: '30px', alignItems: 'center',
                    borderBottom: '1.5px solid #000', paddingBottom: '10px', marginBottom: '20px',
                    backgroundColor: '#fff'
                }}>

                    {/* Left: School Logo */}
                    <div style={{ width: '180px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                        <img src="/logo.png" alt="School Logo" style={{ maxHeight: '68px', objectFit: 'contain' }} />
                    </div>

                    {/* Right: Student Details Grid */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 30px' }}>
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

                {/* What I've Achieved — 10 rows */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                    <thead>
                        <tr style={P1_ROW}>
                            <th colSpan={2} style={{ ...HDR, textAlign: 'left', width: '60%' }}>What I've Achieved</th>
                            <th style={{ ...HDR, width: '20%', textAlign: 'center' }}>I Term</th>
                            <th style={{ ...HDR, width: '20%', textAlign: 'center' }}>II Term</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={P1_ROW}>
                            <td rowSpan={3} style={{ ...HDR, width: '15%', textAlign: 'left' }}>English</td>
                            <td style={CELL}>Reading</td>
                            <td style={VAL}>{term1.english_reading || ''}</td>
                            <td style={VAL}>{term2.english_reading || ''}</td>
                        </tr>
                        <tr style={P1_ROW}><td style={CELL}>Writing</td><td style={VAL}>{term1.english_writing || ''}</td><td style={VAL}>{term2.english_writing || ''}</td></tr>
                        <tr style={P1_ROW}><td style={CELL}>Phonics</td><td style={VAL}>{term1.english_phonics || ''}</td><td style={VAL}>{term2.english_phonics || ''}</td></tr>
                        <tr style={P1_ROW}>
                            <td rowSpan={3} style={{ ...HDR, textAlign: 'left' }}>Maths</td>
                            <td style={CELL}>No. Recognition</td>
                            <td style={VAL}>{term1.maths_recognition || ''}</td>
                            <td style={VAL}>{term2.maths_recognition || ''}</td>
                        </tr>
                        <tr style={P1_ROW}><td style={CELL}>No. Counting</td><td style={VAL}>{term1.maths_counting || ''}</td><td style={VAL}>{term2.maths_counting || ''}</td></tr>
                        <tr style={P1_ROW}><td style={CELL}>Writing</td><td style={VAL}>{term1.maths_writing || ''}</td><td style={VAL}>{term2.maths_writing || ''}</td></tr>
                        <tr style={P1_ROW}>
                            <td rowSpan={3} style={{ ...HDR, textAlign: 'left' }}>Hindi</td>
                            <td style={CELL}>Reading</td>
                            <td style={VAL}>{term1.hindi_reading || ''}</td>
                            <td style={VAL}>{term2.hindi_reading || ''}</td>
                        </tr>
                        <tr style={P1_ROW}><td style={CELL}>Writing</td><td style={VAL}>{term1.hindi_writing || ''}</td><td style={VAL}>{term2.hindi_writing || ''}</td></tr>
                        <tr style={P1_ROW}><td style={CELL}>Vocabulary</td><td style={VAL}>{term1.hindi_vocabulary || ''}</td><td style={VAL}>{term2.hindi_vocabulary || ''}</td></tr>
                    </tbody>
                </table>

                {/* Art & Craft — 4 rows */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '18px' }}>
                    <tbody>
                        <tr style={P1_ROW}><th colSpan={3} style={{ ...HDR, textAlign: 'left' }}>Art &amp; Craft</th></tr>
                        <tr style={P1_ROW}>
                            <td style={{ ...CELL, width: '60%' }}>Drawing</td>
                            <td style={{ ...VAL, width: '20%' }}>{term1.art_drawing || ''}</td>
                            <td style={{ ...VAL, width: '20%' }}>{term2.art_drawing || ''}</td>
                        </tr>
                        <tr style={P1_ROW}><td style={CELL}>Coloring</td><td style={VAL}>{term1.art_coloring || ''}</td><td style={VAL}>{term2.art_coloring || ''}</td></tr>
                        <tr style={P1_ROW}><td style={CELL}>Activities</td><td style={VAL}>{term1.art_activities || ''}</td><td style={VAL}>{term2.art_activities || ''}</td></tr>
                    </tbody>
                </table>

                {/* G.K. — 2 rows */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '18px' }}>
                    <tbody>
                        <tr style={P1_ROW}>
                            <th style={{ ...HDR, textAlign: 'left', width: '60%' }}>G.K.</th>
                            <td style={{ ...HDR, width: '20%' }}></td>
                            <td style={{ ...HDR, width: '20%' }}></td>
                        </tr>
                        <tr style={P1_ROW}>
                            <td style={CELL}></td>
                            <td style={VAL}>{term1.gk || ''}</td>
                            <td style={VAL}>{term2.gk || ''}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Attendance — 2 rows */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '18px' }}>
                    <tbody>
                        <tr style={P1_ROW}>
                            <th style={{ ...HDR, textAlign: 'left', width: '60%' }}>Attendance</th>
                            <th style={{ ...HDR, width: '20%', textAlign: 'center' }}>I Term</th>
                            <th style={{ ...HDR, width: '20%', textAlign: 'center' }}>II Term</th>
                        </tr>
                        <tr style={P1_ROW}>
                            <td style={CELL}>Present Days / Total No. Of Days</td>
                            <td style={VAL}>{term1.attendance || ''}/{term1.total_days || ''}</td>
                            <td style={VAL}>{term2.attendance || ''}/{term2.total_days || ''}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Kids image — fills remaining bottom space */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingTop: '6px' }}>
                    <img src="/images/kids_cartoon.png" alt="children" style={{ maxHeight: '110px', objectFit: 'contain' }} />
                </div>
            </div>

            {/* ══════════════ PAGE 2 : Co-Scholastic ══════════════ */}
            <div className="pp-page" style={{ ...PAGE, marginTop: '24px' }}>

                {/* What Else I am Trained for — 8 data rows */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ height: '11mm' }}>
                            <th colSpan={2} style={{ ...HDR, textAlign: 'left', width: '60%' }}>What Else I am Trained for</th>
                            <th style={{ ...HDR, width: '20%', textAlign: 'center' }}>I Term</th>
                            <th style={{ ...HDR, width: '20%', textAlign: 'center' }}>II Term</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={P2_TRAINED_ROW}>
                            <td rowSpan={3} style={{ ...HDR, width: '15%', textAlign: 'left' }}>Sub. &amp;<br />Skill</td>
                            <td style={CELL}>Sports</td>
                            <td style={VAL}>{term1.sports || ''}</td>
                            <td style={VAL}>{term2.sports || ''}</td>
                        </tr>
                        <tr style={P2_TRAINED_ROW}><td style={CELL}>Music</td><td style={VAL}>{term1.music || ''}</td><td style={VAL}>{term2.music || ''}</td></tr>
                        <tr style={P2_TRAINED_ROW}><td style={CELL}>Dance</td><td style={VAL}>{term1.dance || ''}</td><td style={VAL}>{term2.dance || ''}</td></tr>
                        <tr style={P2_TRAINED_ROW}>
                            <td rowSpan={5} style={{ ...HDR, width: '15%', textAlign: 'left', fontSize: '10px' }}>Personality<br />Character</td>
                            <td style={CELL}>Social Interaction</td>
                            <td style={VAL}>{term1.social || ''}</td>
                            <td style={VAL}>{term2.social || ''}</td>
                        </tr>
                        <tr style={P2_TRAINED_ROW}><td style={CELL}>Etiquettes</td><td style={VAL}>{term1.etiquettes || ''}</td><td style={VAL}>{term2.etiquettes || ''}</td></tr>
                        <tr style={P2_TRAINED_ROW}><td style={CELL}>Personal Hygiene</td><td style={VAL}>{term1.hygiene || ''}</td><td style={VAL}>{term2.hygiene || ''}</td></tr>
                        <tr style={P2_TRAINED_ROW}><td style={CELL}>Attention</td><td style={VAL}>{term1.attention || ''}</td><td style={VAL}>{term2.attention || ''}</td></tr>
                        <tr style={P2_TRAINED_ROW}><td style={CELL}>Creativity</td><td style={VAL}>{term1.creativity || ''}</td><td style={VAL}>{term2.creativity || ''}</td></tr>
                    </tbody>
                </table>

                {/* Small Gap above signatures */}
                <div style={{ height: '70px' }}></div>

                {/* Signatures */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '12px', fontWeight: 500 }}>
                    {["Class teacher's signature :", "Supervisor's signature :", "Principal's signature :", "Parents' signature :"].map(label => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <span>{label}</span>
                            <span style={{ width: '180px', borderBottom: '1px dotted #000' }}></span>
                        </div>
                    ))}
                </div>

                {/* Spacer to push promotion and logo to the bottom */}
                <div style={{ flex: 1 }}></div>

                {/* Kids image + Promotion — below signatures */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <img src="/images/kids_cartoon.png" alt="children" style={{ width: '110px', objectFit: 'contain' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#cc0000', fontSize: '15px', marginBottom: '14px' }}>
                            I am ready to climb the next step
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', fontSize: '12px', marginBottom: '10px' }}>
                            <span>Passed &amp; Promoted to Std.</span>
                            <span style={{ flex: 1, borderBottom: '1px dashed #000', fontWeight: 'bold', paddingLeft: '12px' }}>{nextClass}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', fontSize: '12px' }}>
                            <span>School reopens on</span>
                            <span style={{ flex: 1, borderBottom: '1px dashed #000', fontWeight: 'bold', textAlign: 'center' }}>
                                {term2.reopening_date || ''}{term2.reopening_date ? ' at ' : ''}{term2.reopening_time || ''}
                            </span>
                        </div>
                    </div>
                </div>


            </div>
        </>
    );
};

export default PrePrimaryReport;
