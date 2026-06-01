import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const headers = [
    "Full Name", "Employee ID", "Universal Number", "Staff Type", "Role Name",
    "Designation", "Qualification", "Specialization", "Experience", "Previous Schools",
    "Mobile", "Emergency Contact", "Email", "Gender", "DOB", "Aadhar No", "PAN No",
    "Joining Date", "Address", "Bank Name", "Account No", "IFSC Code", "Status", "Academic Year"
];

const data = [
    {
        "Full Name": "John Doe",
        "Employee ID": "STF/2026/001",
        "Staff Type": "Teaching",
        "Role Name": "Teacher",
        "Designation": "Senior Teacher",
        "Qualification": "M.A. B.Ed",
        "Specialization": "English",
        "Experience": "5",
        "Mobile": "9876543210",
        "Gender": "Male",
        "DOB": "1990-05-15",
        "Joining Date": "2024-06-01",
        "Status": "active",
        "Academic Year": "2026-27"
    },
    {
        "Full Name": "Jane Smith",
        "Employee ID": "STF/2026/002",
        "Staff Type": "Non-Teaching",
        "Role Name": "Accountant",
        "Designation": "Head Accountant",
        "Qualification": "M.Com",
        "Specialization": "Finance",
        "Experience": "8",
        "Mobile": "9876543211",
        "Gender": "Female",
        "DOB": "1988-10-20",
        "Joining Date": "2023-01-10",
        "Status": "active",
        "Academic Year": "2026-27"
    }
];

const ws = xlsx.utils.json_to_sheet(data, { header: headers });
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Staff_Data");

const targetDir = 'H:/InnovativeSolutions/GraceERPSystem/imports/Staff';
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

xlsx.writeFile(wb, path.join(targetDir, 'Staff_Import_Master.xlsx'));

console.log('Created Staff_Import_Master.xlsx');
