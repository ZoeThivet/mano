import { organisationState } from './auth';
import { atom, selector } from 'recoil';
import { setCacheItem } from '../services/dataManagement';

const collectionName = 'territory-observation';
export const territoryObservationsState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

export const customFieldsObsSelector = selector({
  key: 'customFieldsObsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (Array.isArray(organisation.customFieldsObs)) return organisation.customFieldsObs;
    return defaultCustomFields;
  },
});

export const defaultCustomFields = [
  {
    name: 'personsMale',
    label: 'Nombre de personnes non connues hommes rencontrées',
    type: 'number',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'personsFemale',
    label: 'Nombre de personnes non connues femmes rencontrées',
    type: 'number',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'police',
    label: 'Présence policière',
    type: 'yes-no',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'material',
    label: 'Nombre de matériel ramassé',
    type: 'number',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'atmosphere',
    label: 'Ambiance',
    options: ['Violences', 'Tensions', 'RAS'],
    type: 'enum',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'mediation',
    label: 'Nombre de médiations avec les riverains / les structures',
    type: 'number',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'comment',
    label: 'Commentaire',
    type: 'textarea',
    enabled: true,
    required: true,
    showInStats: true,
  },
];

const compulsoryEncryptedFields = ['observedAt'];

export const prepareObsForEncryption = (customFields) => (obs) => {
  const encryptedFields = [...customFields.map((f) => f.name), ...compulsoryEncryptedFields];
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = obs[field];
  }
  return {
    _id: obs._id,
    createdAt: obs.createdAt,
    updatedAt: obs.updatedAt,
    deletedAt: obs.deletedAt,
    organisation: obs.organisation,
    user: obs.user,
    team: obs.team,
    territory: obs.territory,

    decrypted,
    entityKey: obs.entityKey,
  };
};

export const observationsKeyLabels = defaultCustomFields.map((f) => f.name);
