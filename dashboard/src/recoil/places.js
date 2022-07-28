import { setCacheItem } from '../services/dataManagement';
import { atom } from 'recoil';

const collectionName = 'place';
export const placesState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ['name'];

export const preparePlaceForEncryption = (place) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = place[field];
  }
  return {
    _id: place._id,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
    deletedAt: place.deletedAt,
    organisation: place.organisation,
    user: place.user,

    decrypted,
    entityKey: place.entityKey,
  };
};
