const ExcelJS = require('exceljs');
const path = require('path');

async function parseExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.resolve(__dirname, '../Сводная таблица поликлиника.xlsx');
    await workbook.xlsx.readFile(filePath);
    
    workbook.worksheets.forEach(worksheet => {
        console.log('Worksheet:', worksheet.name);
        worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
            if (rowNumber <= 15) { // Print first 15 rows to understand the structure
                console.log(`Row ${rowNumber}: ${JSON.stringify(row.values)}`);
            }
        });
    });
}

parseExcel().catch(console.error);
