const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\ADMIN\\Downloads\\NEW_NGA\\NGA_ERP_System\\client\\src\\pages\\ParentDashboard.jsx', 'utf8');

const lines = content.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Find all <Tag or <Tag/
    const opens = (line.match(/<div(?!\s*\/>)/g) || []).length;
    const selfCloses = (line.match(/<div[^>]*\/>/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    
    // Adjusted logic: only count tags that aren't self-closing
    // But self-closing might be across multiple lines... let's assume single line for now
    
    // Better way:
    // count += number of <div that don't end in />
    // count -= number of </div>
}

// Actually, let's just use a more robust regex for the whole file
const divOpens = (content.match(/<div(?![^>]*\/>)/g) || []).length;
const divCloses = (content.match(/<\/div>/g) || []).length;
console.log('Divs:', divOpens, divCloses);

const spanOpens = (content.match(/<span(?![^>]*\/>)/g) || []).length;
const spanCloses = (content.match(/<\/span>/g) || []).length;
console.log('Spans:', spanOpens, spanCloses);

const buttonOpens = (content.match(/<button(?![^>]*\/>)/g) || []).length;
const buttonCloses = (content.match(/<\/button>/g) || []).length;
console.log('Buttons:', buttonOpens, buttonCloses);
