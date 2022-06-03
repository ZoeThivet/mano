import { storage } from '../services/dataManagement';
import { atom } from 'recoil';

export const reportsState = atom({
  key: 'reportsState',
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('report', JSON.stringify(newValue)))],
});

const encryptedFields = ['description', 'services', 'team', 'date', 'collaborations', 'oldDateSystem'];

export const prepareReportForEncryption = (report) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = report[field];
  }
  return {
    _id: report._id,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    organisation: report.organisation,

    decrypted,
    entityKey: report.entityKey,
  };
};