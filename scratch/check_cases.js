const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\ADMIN\\Downloads\\NEW_NGA\\NGA_ERP_System\\client\\src\\pages\\ParentDashboard.jsx', 'utf8');

const cases = [
    'Overview',
    'Timetable',
    'Attendance',
    'Exam Results',
    'Fee Portal',
    'Teacher Connect',
    'Leave Application',
    'Communication',
    'Documents',
    'Feedback'
];

cases.forEach(c => {
    const start = content.indexOf(`case '${c}':`);
    if (start === -1) {
        console.log(`Case ${c} not found`);
        return;
    }
    // Find matching return content
    let sub = content.substr(start);
    let nextCase = cases.find(nc => nc !== c && sub.includes(`case '${nc}':`));
    if (nextCase) {
        sub = sub.split(`case '${nextCase}':`)[0];
    } else {
        sub = sub.split('default:')[0];
    }
    
    const divOpens = (sub.match(/<div(?![^>]*\/>)/g) || []).length;
    const divCloses = (sub.match(/<\/div>/g) || []).length;
    const pOpens = (sub.match(/\(/g) || []).length;
    const pCloses = (sub.match(/\)/g) || []).length;
    const bOpens = (sub.match(/\{/g) || []).length;
    const bCloses = (sub.match(/\}/g) || []).length;
    
    console.log(`Case ${c}: Divs(${divOpens}-${divCloses}), Parens(${pOpens}-${pCloses}), Braces(${bOpens}-${bCloses})`);
});
