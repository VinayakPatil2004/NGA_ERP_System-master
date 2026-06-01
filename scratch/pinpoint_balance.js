const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\ADMIN\\Downloads\\NEW_NGA\\NGA_ERP_System\\client\\src\\pages\\ParentDashboard.jsx', 'utf8');

const lines = content.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    if (opens !== closes) {
        count += opens;
        count -= closes;
        console.log(`Line ${i+1}: Balance: ${count} | ${line.trim()}`);
    }
}
