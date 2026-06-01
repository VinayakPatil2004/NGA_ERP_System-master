import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

async function testImport() {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream('./Library_Transaction_Template.csv'));

        const response = await axios.post('http://localhost:5000/api/bulk-import/library-transactions', formData, {
            headers: {
                ...formData.getHeaders(),
                // I might need a token if it's protected
            }
        });

        console.log('IMPORT_RESULT_START');
        console.log(JSON.stringify(response.data));
        console.log('IMPORT_RESULT_END');
    } catch (e) {
        console.error(e.response?.data || e.message);
    }
}

testImport();
