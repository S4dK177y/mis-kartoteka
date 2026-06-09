const exceljs = require('exceljs');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/logger');

exports.exportPatients = async (req, res) => {
  try {
    const { format } = req.query;
    const patients = await prisma.patient.findMany({ orderBy: { createdAt: 'desc' } });
    const consultations = await prisma.consultation.findMany({ orderBy: { createdAt: 'desc' } });

    const rows = [];

    patients.forEach(p => {
      rows.push({
        recordType: 'Стационар',
        caseHistoryNumber: p.caseHistoryNumber || '',
        date: p.admissionDate.toISOString().split('T')[0],
        time: p.admissionDate.toISOString().split('T')[1].substring(0, 5),
        militaryStatus: p.militaryStatus || '',
        isSvoParticipant: p.isSvoParticipant ? 'Да' : 'Нет',
        rank: p.rank || '',
        fullName: p.fullName,
        birthDate: p.birthDate.toISOString().split('T')[0],
        tokenNumber: p.tokenNumber || '',
        militaryUnit: p.militaryUnit || '',
        phoneNumber: p.phoneNumber || '',
        relativeRelation: p.relativeRelation || '',
        relativeFullName: p.relativeFullName || '',
        relativePhone: p.relativePhone || '',
        relativeAddress: p.relativeAddress || '',
        allDiagnoses: [p.admissionDiagnosis, p.clinicalDiagnosis, p.finalDiagnosis].filter(Boolean).join('; '),
        department: p.department || '',
        status: p.status || '',
        endDate: p.dischargeDate ? p.dischargeDate.toISOString().split('T')[0] : '',
        endTime: p.dischargeDate ? p.dischargeDate.toISOString().split('T')[1].substring(0, 5) : '',
        notes: p.dischargeDestination || ''
      });
    });

    const getTypeLabel = (type) => {
      const map = { PRIMARY: 'Первичный', SECONDARY: 'Повторный', PREVENTIVE: 'Профилактический', VVK: 'ВВК' };
      return map[type] || 'Обычный';
    };

    consultations.forEach(c => {
      rows.push({
        recordType: `Амбулатория (${getTypeLabel(c.type)})`,
        caseHistoryNumber: '-',
        date: c.consultationDate.toISOString().split('T')[0],
        time: c.consultationDate.toISOString().split('T')[1].substring(0, 5),
        militaryStatus: c.militaryStatus || '',
        isSvoParticipant: c.isSvoParticipant ? 'Да' : 'Нет',
        rank: c.rank || '',
        fullName: c.fullName,
        birthDate: c.birthDate ? c.birthDate.toISOString().split('T')[0] : '',
        tokenNumber: c.tokenNumber || '',
        militaryUnit: c.militaryUnit || '',
        phoneNumber: c.phoneNumber || '',
        relativeRelation: c.relativeRelation || '',
        relativeFullName: c.relativeFullName || '',
        relativePhone: c.relativePhone || '',
        relativeAddress: c.relativeAddress || '',
        allDiagnoses: c.diagnosis || '',
        department: '-',
        status: '-',
        endDate: c.nextConsultationDate ? c.nextConsultationDate.toISOString().split('T')[0] : '',
        endTime: c.nextConsultationDate ? c.nextConsultationDate.toISOString().split('T')[1].substring(0, 5) : '',
        notes: c.notes || ''
      });
    });

    if (format === 'json') {
      return res.json({ rows });
    }

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Все записи');

    worksheet.columns = [
      { header: 'Тип записи', key: 'recordType', width: 18 },
      { header: '№ ИБ', key: 'caseHistoryNumber', width: 15 },
      { header: 'Дата приема/поступления', key: 'date', width: 15 },
      { header: 'Время', key: 'time', width: 10 },
      { header: 'Статус службы', key: 'militaryStatus', width: 15 },
      { header: 'Участник СВО', key: 'isSvoParticipant', width: 15 },
      { header: 'Звание', key: 'rank', width: 15 },
      { header: 'ФИО', key: 'fullName', width: 30 },
      { header: 'Дата рождения', key: 'birthDate', width: 15 },
      { header: 'Жетон', key: 'tokenNumber', width: 15 },
      { header: '№ в/ч', key: 'militaryUnit', width: 15 },
      { header: 'Телефон', key: 'phoneNumber', width: 20 },
      { header: 'Статус близкого', key: 'relativeRelation', width: 15 },
      { header: 'ФИО близкого', key: 'relativeFullName', width: 25 },
      { header: 'Телефон близкого', key: 'relativePhone', width: 20 },
      { header: 'Адрес близкого', key: 'relativeAddress', width: 30 },
      { header: 'Диагнозы (все)', key: 'allDiagnoses', width: 40 },
      { header: 'Отделение', key: 'department', width: 25 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Дата выписки/След. визит', key: 'endDate', width: 15 },
      { header: 'Время (выписка/след. визит)', key: 'endTime', width: 15 },
      { header: 'Куда выписан/Заметки', key: 'notes', width: 30 }
    ];

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length }
    };

    rows.forEach(r => worksheet.addRow(r));

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURI('Картотека_Выгрузка.xlsx'));

    await logAction(req.user.id, 'EXPORT', 'Patient/Consultation', null, { format: 'Excel' });
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
