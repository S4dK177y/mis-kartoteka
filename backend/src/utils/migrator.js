const { PrismaClient } = require('@prisma/client');
const cryptoUtil = require('./crypto');

// Use a raw PrismaClient WITHOUT the encryption middleware.
// This ensures we read actual values from DB (plaintext or gost: strings)
// without any auto-decrypt/encrypt interference.
const rawPrisma = new PrismaClient();

const ENCRYPTED_FIELDS = {
  Patient: ['fullName', 'address', 'phoneNumber', 'relativeFullName', 'relativePhone', 'relativeAddress', 'dischargeDestination', 'admissionDiagnosis', 'clinicalDiagnosis', 'finalDiagnosis', 'complications', 'rank', 'militaryUnit', 'relativeRelation', 'caseHistoryNumber'],
  Consultation: ['fullName', 'address', 'phoneNumber', 'relativeFullName', 'relativePhone', 'relativeAddress', 'diagnosis', 'notes', 'rank', 'militaryUnit', 'relativeRelation'],
  User: [],
  Document: ['originalName', 'filename'],
  VvkConclusion: ['neurologistCategory', 'ophthalmologistCategory', 'dentistCategory', 'surgeonCategory', 'therapistCategory', 'finalCategory'],
  AuditLog: ['details']
};

const DETERMINISTIC_FIELDS = {
  Patient: ['tokenNumber'],
  Consultation: ['tokenNumber'],
  User: ['username']
};

/** Returns true if the value already has a GOST encryption prefix. */
function isAlreadyEncrypted(value) {
  if (typeof value !== 'string') return false;
  return value.startsWith('gost:') || value.startsWith('detgost:');
}

/** Yields to the event loop so server remains responsive during migration. */
function yieldLoop() {
  return new Promise(resolve => setImmediate(resolve));
}

async function migrateData() {
  console.log('Starting data migration to encrypted format...');

  const models = ['Patient', 'Consultation', 'User', 'Document', 'VvkConclusion', 'AuditLog'];

  for (const model of models) {
    const prismaModelName = model.charAt(0).toLowerCase() + model.slice(1);
    if (!rawPrisma[prismaModelName]) continue;

    const encFields = ENCRYPTED_FIELDS[model] || [];
    const detFields = DETERMINISTIC_FIELDS[model] || [];

    if (encFields.length === 0 && detFields.length === 0) continue;

    try {
      console.log(`Migrating ${model}...`);
      // Read raw values directly — no middleware decryption
      const records = await rawPrisma[prismaModelName].findMany();
      let count = 0;

      for (const record of records) {
        const dataToUpdate = {};

        for (const field of encFields) {
          const val = record[field];
          // Only encrypt plaintext values — skip nulls and already-encrypted fields
          if (val != null && !isAlreadyEncrypted(val)) {
            dataToUpdate[field] = cryptoUtil.encryptText(String(val));
          }
        }

        for (const field of detFields) {
          const val = record[field];
          if (val != null && !isAlreadyEncrypted(val)) {
            dataToUpdate[field] = cryptoUtil.encryptDeterministic(String(val));
          }
        }

        if (Object.keys(dataToUpdate).length > 0) {
          // Write raw encrypted strings directly — no middleware re-encryption
          await rawPrisma[prismaModelName].update({
            where: { id: record.id },
            data: dataToUpdate
          });
          count++;
        }

        // Yield after each record to keep the event loop free
        await yieldLoop();
      }

      console.log(`Migrated ${model}: ${count}/${records.length} records.`);
    } catch (err) {
      console.error(`Error migrating ${model}:`, err.message);
    }
  }

  console.log('Migration to encrypted format completed.');
}

module.exports = migrateData;
