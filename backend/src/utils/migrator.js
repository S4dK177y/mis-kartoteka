const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cryptoUtil = require('./crypto');
const prisma = require('./prisma');
const { storageDir } = require('../middlewares/upload');

async function migrateData() {
  console.log('Starting data migration to encrypted format...');
  
  // 1. Migrate Patients
  const patients = await prisma.patient.findMany();
  for (const p of patients) {
    await prisma.patient.update({
      where: { id: p.id },
      data: {
        fullName: p.fullName,
        address: p.address,
        phoneNumber: p.phoneNumber,
        relativeFullName: p.relativeFullName,
        relativePhone: p.relativePhone,
        admissionDiagnosis: p.admissionDiagnosis,
        clinicalDiagnosis: p.clinicalDiagnosis,
        finalDiagnosis: p.finalDiagnosis,
        complications: p.complications
      }
    });
  }
  
  // 2. Migrate Consultations
  const consultations = await prisma.consultation.findMany();
  for (const c of consultations) {
    await prisma.consultation.update({
      where: { id: c.id },
      data: {
        fullName: c.fullName,
        address: c.address,
        phoneNumber: c.phoneNumber,
        relativeFullName: c.relativeFullName,
        relativePhone: c.relativePhone,
        diagnosis: c.diagnosis,
        notes: c.notes
      }
    });
  }
  
  // 3. Migrate Files
  if (fs.existsSync(storageDir)) {
    const entities = fs.readdirSync(storageDir);
    for (const entityId of entities) {
      const entityPath = path.join(storageDir, entityId);
      if (fs.statSync(entityPath).isDirectory()) {
        const files = fs.readdirSync(entityPath);
        for (const file of files) {
          const filePath = path.join(entityPath, file);
          const fileBuffer = fs.readFileSync(filePath);
          
          let isEncrypted = false;
          try {
            if (fileBuffer.length > 28) {
              const iv = fileBuffer.slice(0, 12);
              const authTag = fileBuffer.slice(12, 28);
              const encryptedData = fileBuffer.slice(28);
              const decipher = crypto.createDecipheriv('aes-256-gcm', cryptoUtil.getMasterKey(), iv);
              decipher.setAuthTag(authTag);
              let decrypted = decipher.update(encryptedData);
              Buffer.concat([decrypted, decipher.final()]);
              isEncrypted = true;
            }
          } catch (err) {
            isEncrypted = false;
          }
          
          if (!isEncrypted) {
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', cryptoUtil.getMasterKey(), iv);
            let encryptedFile = cipher.update(fileBuffer);
            encryptedFile = Buffer.concat([encryptedFile, cipher.final()]);
            const authTag = cipher.getAuthTag();
            const finalBuffer = Buffer.concat([iv, authTag, encryptedFile]);
            
            fs.writeFileSync(filePath, finalBuffer);
          }
        }
      }
    }
  }
  
  console.log('Migration to encrypted format completed.');
}

module.exports = migrateData;
