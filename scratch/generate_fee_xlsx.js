import fs from 'fs';
import xlsx from 'xlsx';
import path from 'path';

const csvPath = 'h:/InnovativeSolutions/GraceERPSystem/imports/Fees/fee_import_sample.csv';
const xlsxPath = 'h:/InnovativeSolutions/GraceERPSystem/imports/Fees/fee_import_sample.xlsx';

try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    const rows = lines.map(line => {
        // Handle CSV split simply for this controlled file (no escaped commas in data)
        return line.split(',');
    });
    
    const ws = xlsx.utils.aoa_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Fees_Import_Template');
    
    xlsx.writeFile(wb, xlsxPath);
    console.log('✓ Successfully created fee_import_sample.xlsx at:', xlsxPath);
} catch (error) {
    console.error('Error generating Excel file:', error);
}
