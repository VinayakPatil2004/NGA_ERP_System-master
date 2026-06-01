const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\ADMIN\\Downloads\\NEW_NGA\\NGA_ERP_System\\client\\src\\pages\\ParentDashboard.jsx', 'utf8');

function checkBalance(str, open, close) {
    let count = 0;
    let pos = 0;
    while (pos < str.length) {
        if (str.substr(pos, open.length) === open) {
            count++;
            pos += open.length;
        } else if (str.substr(pos, close.length) === close) {
            count--;
            pos += close.length;
            if (count < 0) {
                console.log(`Extra ${close} at approx pos ${pos}`);
            }
        } else {
            pos++;
        }
    }
    return count;
}

console.log('Div balance:', checkBalance(content, '<div', '</div>'));
console.log('Paren balance:', checkBalance(content, '(', ')'));
console.log('Brace balance:', checkBalance(content, '{', '}'));
console.log('Button balance:', checkBalance(content, '<button', '</button>'));
