const xlsx = require('xlsx');
const path = require('path');

const data = [
    {
        'Book Title/ISBN': 'A Brief History of Time',
        'Member ID (GR No)': 'GR1001',
        'Member Class': '10th',
        'Issue Date': '2026-04-01',
        'Due Date': '2026-04-15',
        'Return Date': '2026-04-14',
        'Status': 'Returned',
        'Academic Year': '2026-27'
    },
    {
        'Book Title/ISBN': '978-0553380163',
        'Member ID (GR No)': 'GR1002',
        'Member Class': '9th',
        'Issue Date': '2026-04-10',
        'Due Date': '2026-04-24',
        'Return Date': '',
        'Status': 'Active',
        'Academic Year': '2026-27'
    }
];

const ws = xlsx.utils.json_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Transactions");

const filePath = path.join(process.cwd(), 'Library_Transaction_Template.xlsx');
xlsx.writeFile(wb, filePath);

console.log(`Template created at: ${filePath}`);
