import xlsx from 'xlsx';

function checkExcel(filePath) {
    try {
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        console.log(`FILE: ${filePath}`);
        if (data.length > 0) {
            console.log('HEADERS:', Object.keys(data[0]));
            // console.log('SAMPLE_ROW:', data[0]);
        } else {
            console.log('No data found in sheet.');
        }
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e.message);
    }
}

checkExcel('H:/InnovativeSolutions/GraceERPSystem/imports/Staff/staff_import_sample.xlsx');
checkExcel('H:/InnovativeSolutions/GraceERPSystem/imports/Staff/staff_import_template.xlsx');
