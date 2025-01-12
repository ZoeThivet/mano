import { atom, selector } from 'recoil';
import { storage } from '../services/dataManagement';
import { organisationState } from './auth';

export const actionsState = atom({
  key: 'actionsState',
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('action', JSON.stringify(newValue)))],
});

export const actionsCategoriesSelector = selector({
  key: 'actionsCategoriesSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (organisation.actionsGroupedCategories) return organisation.actionsGroupedCategories;
    return [{ groupTitle: 'Toutes mes catégories', categories: organisation.categories ?? [] }];
  },
});

export const flattenedCategoriesSelector = selector({
  key: 'flattenedCategoriesSelector',
  get: ({ get }) => {
    const actionsGroupedCategories = get(actionsCategoriesSelector);
    return actionsGroupedCategories.reduce((allCategories, { categories }) => [...allCategories, ...categories], []);
  },
});

const encryptedFields = [
  'category',
  'categories',
  'person',
  'group',
  'structure',
  'name',
  'description',
  'withTime',
  'team',
  'teams',
  'user',
  'urgent',
];

export const prepareActionForEncryption = (action) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = action[field];
  }
  return {
    _id: action._id,
    organisation: action.organisation,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,

    completedAt: action.completedAt,
    dueAt: action.dueAt,
    status: action.status,

    decrypted,
    entityKey: action.entityKey,
  };
};

export const CHOOSE = 'CHOOSE';
export const TODO = 'A FAIRE';
export const DONE = 'FAIT';
export const CANCEL = 'ANNULEE';

export const mappedIdsToLabels = [
  { _id: TODO, name: 'À FAIRE' },
  { _id: DONE, name: 'FAITE' },
  { _id: CANCEL, name: 'ANNULÉE' },
];
