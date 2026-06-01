import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const importsDir = path.resolve(__dirname, '../../imports');

if (!fs.existsSync(importsDir)) {
    fs.mkdirSync(importsDir, { recursive: true });
}

async function generateSamples() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await db.getConnection();

        console.log('Fetching active staff...');
        const [staffRows] = await connection.query(`SELECT id, employee_id, full_name, salary AS basic_salary FROM staff WHERE status = 'active' ORDER BY full_name ASC`);

        if (staffRows.length === 0) {
            console.warn('No active staff found in database. Samples will be empty.');
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // 1. Salary Setup
        const salarySetupData = staffRows.map(s => ({
            EmployeeID: s.employee_id,
            StaffName: s.full_name,
            BasicSalary: s.basic_salary || 0,
            HRA: 0,
            DA: 0,
            Bonus: 0,
            PF: 0,
            PT: 0,
            ESIC: 0,
            OtherDeductions: 0
        }));

        // 2. Staff Payroll
        const staffPayrollData = staffRows.map(s => ({
            EmployeeID: s.employee_id,
            StaffName: s.full_name,
            Month: currentMonth,
            Year: currentYear,
            BasicSalary: s.basic_salary || 0,
            HRA: 0,
            DA: 0,
            Bonus: 0,
            PF: 0,
            PT: 0,
            ESIC: 0,
            Deductions: 0,
            LoanDeduction: 0,
            PresentDays: 26,
            HalfDays: 0,
            TotalDays: 30,
            NetSalary: s.basic_salary || 0,
            Status: 'pending',
            Remarks: 'Sample data'
        }));

        // 3. Loan and Advance
        const loanAdvanceData = staffRows.map(s => ({
            EmployeeID: s.employee_id,
            StaffName: s.full_name,
            TotalAmount: 5000,
            EMIAmount: 1000,
            Reason: 'Sample loan'
        }));

        // 4. Payroll Record (Paid)
        const payrollRecordData = staffRows.map(s => ({
            EmployeeID: s.employee_id,
            StaffName: s.full_name,
            Month: currentMonth === 1 ? 12 : currentMonth - 1,
            Year: currentMonth === 1 ? currentYear - 1 : currentYear,
            BasicSalary: s.basic_salary || 0,
            HRA: 0,
            DA: 0,
            Bonus: 0,
            PF: 0,
            PT: 0,
            ESIC: 0,
            Deductions: 0,
            LoanDeduction: 0,
            PresentDays: 30,
            HalfDays: 0,
            TotalDays: 30,
            NetSalary: s.basic_salary || 0,
            Status: 'paid',
            PaymentDate: now.toISOString().split('T')[0],
            Remarks: 'Imported paid record'
        }));

        const createExcel = (data, filename) => {
            const worksheet = xlsx.utils.json_to_sheet(data.length > 0 ? data : [{}]);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            const filepath = path.join(importsDir, filename);
            xlsx.writeFile(workbook, filepath);
            console.log(`Created: ${filepath}`);
        };

        createExcel(salarySetupData, 'salary_setup_sample.xlsx');
        createExcel(staffPayrollData, 'staff_payroll_sample.xlsx');
        createExcel(loanAdvanceData, 'loan_and_advance_sample.xlsx');
        createExcel(payrollRecordData, 'payroll_record_sample.xlsx');

        console.log('Sample generation complete.');
    } catch (err) {
        console.error('Error generating samples:', err);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

generateSamples();
