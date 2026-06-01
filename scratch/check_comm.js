const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\ADMIN\\Downloads\\NEW_NGA\\NGA_ERP_System\\client\\src\\pages\\ParentDashboard.jsx', 'utf8');

const commCase = content.split('case \'Communication\':')[1].split('case \'Documents\':')[0];

function check(str, open, close) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === open) count++;
        if (str[i] === close) count--;
    }
    return count;
}

console.log('Parens:', check(commCase, '(', ')'));
console.log('Braces:', check(commCase, '{', '}'));
console.log('Divs:', (commCase.match(/<div/g) || []).length, (commCase.match(/<\/div>/g) || []).length);
