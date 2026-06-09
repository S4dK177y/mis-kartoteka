const ExcelJS = require('exceljs');
const prisma = require('../utils/prisma');

const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

exports.getDoctorsMonthlyReport = async (req, res) => {
  try {
    const { month, year, format } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'Month and year are required' });

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1); // 1st of next month

    const users = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, fullName: true, username: true }
    });

    const consultations = await prisma.consultation.findMany({
      where: {
        consultationDate: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    // Grouping
    const doctorStats = {};
    for (const u of users) {
      doctorStats[u.id] = {
        name: u.fullName || u.username,
        weeks: [
          { I: 0, II: 0, Z: 0, VVK: 0 }, // W1: 1-7
          { I: 0, II: 0, Z: 0, VVK: 0 }, // W2: 8-14
          { I: 0, II: 0, Z: 0, VVK: 0 }, // W3: 15-21
          { I: 0, II: 0, Z: 0, VVK: 0 }, // W4: 22-28
          { I: 0, II: 0, Z: 0, VVK: 0 }  // W5: 29+
        ]
      };
    }

    // Assign consultations to weeks
    for (const c of consultations) {
      if (!c.doctorId || !doctorStats[c.doctorId]) continue;

      const d = c.consultationDate.getDate();
      let weekIdx = 0;
      if (d >= 8 && d <= 14) weekIdx = 1;
      else if (d >= 15 && d <= 21) weekIdx = 2;
      else if (d >= 22 && d <= 28) weekIdx = 3;
      else if (d >= 29) weekIdx = 4;

      const w = doctorStats[c.doctorId].weeks[weekIdx];
      if (c.type === 'PRIMARY') w.I++;
      else if (c.type === 'SECONDARY') w.II++;
      else if (c.type === 'PREVENTIVE') w.Z++;
      else if (c.type === 'VVK') w.VVK++;
    }

    if (format === 'json') {
      return res.json({ doctorStats });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${months[m-1]} ${y}`);

    worksheet.columns = [
      { width: 35 }, // Врач (Column A)
      // W1
      { width: 5 }, { width: 5 }, { width: 5 }, { width: 5 },
      // W2
      { width: 5 }, { width: 5 }, { width: 5 }, { width: 5 },
      // W3
      { width: 5 }, { width: 5 }, { width: 5 }, { width: 5 },
      // W4
      { width: 5 }, { width: 5 }, { width: 5 }, { width: 5 },
      // W5
      { width: 5 }, { width: 5 }, { width: 5 }, { width: 5 },
      // Total
      { width: 6 }, { width: 6 }, { width: 6 }, { width: 6 },
    ];

    const topRow = [`${months[m-1]} ${y}`, 'Неделя 1', '', '', '', 'Неделя 2', '', '', '', 'Неделя 3', '', '', '', 'Неделя 4', '', '', '', 'Неделя 5', '', '', '', 'Итог за месяц', '', '', ''];
    worksheet.addRow(topRow);
    worksheet.mergeCells('B1:E1');
    worksheet.mergeCells('F1:I1');
    worksheet.mergeCells('J1:M1');
    worksheet.mergeCells('N1:Q1');
    worksheet.mergeCells('R1:U1');
    worksheet.mergeCells('V1:Y1');

    const subHeaderRow = ['Врач', 
      'I', 'II', 'Z', 'ВВК', 
      'I', 'II', 'Z', 'ВВК', 
      'I', 'II', 'Z', 'ВВК', 
      'I', 'II', 'Z', 'ВВК', 
      'I', 'II', 'Z', 'ВВК', 
      'I', 'II', 'Z', 'ВВК'];
    worksheet.addRow(subHeaderRow);

    // Styling headers
    worksheet.getRow(1).font = { name: 'Times New Roman', size: 14, bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).font = { name: 'Times New Roman', size: 14, bold: true };
    worksheet.getRow(2).alignment = { horizontal: 'center', vertical: 'middle' };

    // Fill for headers
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
    for (let c = 1; c <= 25; c++) {
      worksheet.getRow(1).getCell(c).fill = headerFill;
      worksheet.getRow(2).getCell(c).fill = headerFill;
      worksheet.getRow(1).getCell(c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      worksheet.getRow(2).getCell(c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    }

    let rowIndex = 3;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const getCol = (idx) => idx < 26 ? alphabet[idx] : alphabet[Math.floor(idx/26)-1] + alphabet[idx%26];

    for (const docId of Object.keys(doctorStats)) {
      const doc = doctorStats[docId];
      const rowData = [doc.name];
      for (let w = 0; w < 5; w++) {
        rowData.push(doc.weeks[w].I || null, doc.weeks[w].II || null, doc.weeks[w].Z || null, doc.weeks[w].VVK || null);
      }
      
      const r = worksheet.addRow(rowData);
      r.font = { name: 'Times New Roman', size: 14 };
      // Add formulas for the last 4 columns (Total I, Total II, Total Z, Total VVK)
      // I: B, F, J, N, R -> sum
      // II: C, G, K, O, S
      // Z: D, H, L, P, T
      // VVK: E, I, M, Q, U
      r.getCell(22).value = { formula: `SUM(B${rowIndex},F${rowIndex},J${rowIndex},N${rowIndex},R${rowIndex})` };
      r.getCell(23).value = { formula: `SUM(C${rowIndex},G${rowIndex},K${rowIndex},O${rowIndex},S${rowIndex})` };
      r.getCell(24).value = { formula: `SUM(D${rowIndex},H${rowIndex},L${rowIndex},P${rowIndex},T${rowIndex})` };
      r.getCell(25).value = { formula: `SUM(E${rowIndex},I${rowIndex},M${rowIndex},Q${rowIndex},U${rowIndex})` };

      // Borders and alignment for data row
      for(let c=1; c<=25; c++) {
        r.getCell(c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        if (c >= 2) {
          r.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
      
      rowIndex++;
    }

    const tr = worksheet.addRow([]);
    worksheet.mergeCells(`A${rowIndex}:U${rowIndex}`);
    const totalCell = tr.getCell(1);
    totalCell.value = 'ВСЕГО ЗА МЕСЯЦ:';
    totalCell.alignment = { horizontal: 'right', vertical: 'middle' };

    tr.font = { name: 'Times New Roman', size: 14, bold: true };
    
    for (let c = 22; c <= 25; c++) {
      if (rowIndex > 3) {
        tr.getCell(c).value = { formula: `SUM(${getCol(c-1)}3:${getCol(c-1)}${rowIndex-1})` };
      } else {
        tr.getCell(c).value = 0;
      }
    }

    // Apply borders to total row
    totalCell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    for (let c = 22; c <= 25; c++) {
      tr.getCell(c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      tr.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // Set fixed column widths
    worksheet.getColumn(1).width = 35; // Врач
    for (let c = 2; c <= 25; c++) {
      worksheet.getColumn(c).width = 8;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Report_${m}_${y}.xlsx"; filename*=UTF-8''Report_${encodeURIComponent(months[m-1])}_${y}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
