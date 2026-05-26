const { PrismaClient } = require('@prisma/client');
const cryptoUtil = require('./crypto');

const prisma = new PrismaClient();

const encryptedFields = {
  Patient: ['fullName', 'address', 'phoneNumber', 'relativeFullName', 'relativePhone', 'relativeAddress', 'dischargeDestination', 'admissionDiagnosis', 'clinicalDiagnosis', 'finalDiagnosis', 'complications', 'rank', 'militaryUnit', 'relativeRelation', 'caseHistoryNumber'],
  Consultation: ['fullName', 'address', 'phoneNumber', 'relativeFullName', 'relativePhone', 'relativeAddress', 'diagnosis', 'notes', 'rank', 'militaryUnit', 'relativeRelation'],
  User: [],
  Document: ['originalName', 'filename'],
  VvkConclusion: ['neurologistCategory', 'ophthalmologistCategory', 'dentistCategory', 'surgeonCategory', 'therapistCategory', 'finalCategory'],
  AuditLog: ['details']
};

const deterministicFields = {
  Patient: ['tokenNumber'],
  Consultation: ['tokenNumber'],
  User: ['username']
};

const encryptModelFields = (model, data) => {
  if (!data) return data;
  const fields = encryptedFields[model] || [];
  const detFields = deterministicFields[model] || [];
  const result = { ...data };
  
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = cryptoUtil.encryptText(result[field]);
    }
  }
  for (const field of detFields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = cryptoUtil.encryptDeterministic(result[field]);
    }
  }
  return result;
};

const decryptRecursive = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => decryptRecursive(item));
  }
  
  if (data instanceof Date) return data;
  
  const result = { ...data };
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = cryptoUtil.decryptText(result[key]);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = decryptRecursive(result[key]);
    }
  }
  return result;
};

const extendedPrisma = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const hasEncrypted = encryptedFields[model] || deterministicFields[model];
        
        // Intercept writes for specific models
        if (hasEncrypted && ['create', 'update', 'upsert'].includes(operation)) {
          if (args.data) args.data = encryptModelFields(model, args.data);
          if (args.create) args.create = encryptModelFields(model, args.create);
          if (args.update) args.update = encryptModelFields(model, args.update);
        }
        
        if (hasEncrypted && operation === 'createMany' && Array.isArray(args.data)) {
          args.data = args.data.map(item => encryptModelFields(model, item));
        }

        // Intercept unique/first queries for deterministic fields
        if (deterministicFields[model] && ['findUnique', 'findFirst', 'findMany', 'count'].includes(operation)) {
          if (args.where) {
            args.where = { ...args.where };
            for (const field of deterministicFields[model]) {
              if (args.where[field] !== undefined && args.where[field] !== null && typeof args.where[field] === 'string') {
                args.where[field] = cryptoUtil.encryptDeterministic(args.where[field]);
              }
            }
          }
        }

        const result = await query(args);

        // Decrypt all results recursively
        return decryptRecursive(result);
      }
    }
  }
});

module.exports = extendedPrisma;
