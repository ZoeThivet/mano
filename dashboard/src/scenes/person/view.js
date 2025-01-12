import { useLocation, useParams } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import Places from './Places';
import { itemsGroupedByPersonSelector } from '../../recoil/selectors';
import API from '../../services/api';
import { formatDateWithFullMonth } from '../../services/date';
import History from './components/History';
import { MedicalFile } from './MedicalFile';
import Summary from './components/Summary';
import BackButton from '../../components/backButton';
import UserName from '../../components/UserName';
import { personsState, usePreparePersonForEncryption } from '../../recoil/persons';
import { toast } from 'react-toastify';
import { organisationState, userState } from '../../recoil/auth';
import PersonFamily from './PersonFamily';
import { groupSelector } from '../../recoil/groups';
import useSearchParamState from '../../services/useSearchParamState';

const populatedPersonSelector = selectorFamily({
  key: 'populatedPersonSelector',
  get:
    ({ personId }) =>
    ({ get }) => {
      const persons = get(itemsGroupedByPersonSelector);
      return persons[personId] || {};
    },
});

export default function View() {
  const { personId } = useParams();
  const location = useLocation();

  const organisation = useRecoilValue(organisationState);
  const person = useRecoilValue(populatedPersonSelector({ personId }));
  const personGroup = useRecoilValue(groupSelector({ personId }));
  const setPersons = useSetRecoilState(personsState);
  const user = useRecoilValue(userState);
  const [currentTab, setCurrentTab] = useSearchParamState('tab', new URLSearchParams(location.search)?.get('tab') || 'Résumé', {
    resetToDefaultIfTheFollowingValueChange: personId,
  });
  const preparePersonForEncryption = usePreparePersonForEncryption();

  return (
    <div>
      <div className="tw-flex tw-w-full tw-justify-between">
        <div>
          <BackButton />
        </div>
        <div className="noprint">
          <UserName
            id={person.user}
            wrapper={() => 'Créée par '}
            canAddUser
            handleChange={async (newUser) => {
              const response = await API.put({
                path: `/person/${person._id}`,
                body: preparePersonForEncryption({ ...person, user: newUser }),
              });
              if (response.ok) {
                toast.success('Personne mise à jour (créée par)');
                const newPerson = response.decryptedData;
                setPersons((persons) =>
                  persons.map((p) => {
                    if (p._id === person._id) return newPerson;
                    return p;
                  })
                );
              } else {
                toast.error('Impossible de mettre à jour la personne');
              }
            }}
          />
        </div>
      </div>
      <div className="tw-flex tw-w-full tw-justify-center">
        <div className="noprint tw-flex tw-flex-1">
          {!['restricted-access'].includes(user.role) && (
            <ul className="nav nav-tabs tw-m-auto">
              <li role="presentation" className="nav-item">
                <button onClick={() => setCurrentTab('Résumé')} className={currentTab === 'Résumé' ? 'active nav-link' : 'btn-link nav-link'}>
                  Résumé
                </button>
              </li>
              {Boolean(user.healthcareProfessional) && (
                <li role="presentation" className="nav-item">
                  <button
                    onClick={() => setCurrentTab('Dossier Médical')}
                    className={currentTab === 'Dossier Médical' ? 'active nav-link' : 'btn-link nav-link'}>
                    Dossier Médical
                  </button>
                </li>
              )}
              <li role="presentation" className="nav-item">
                <button
                  onClick={() => setCurrentTab('Lieux fréquentés')}
                  className={currentTab === 'Lieux fréquentés' ? 'active nav-link' : 'btn-link nav-link'}>
                  Lieux fréquentés ({person.relsPersonPlace?.length || 0})
                </button>
              </li>
              <li role="presentation" className="nav-item">
                <button onClick={() => setCurrentTab('Historique')} className={currentTab === 'Historique' ? 'active nav-link' : 'btn-link nav-link'}>
                  Historique
                </button>
              </li>
              {Boolean(organisation.groupsEnabled) && (
                <li role="presentation" className="nav-item">
                  <button
                    onClick={() => setCurrentTab('Liens familiaux')}
                    className={currentTab === 'Liens familiaux' ? 'active nav-link' : 'btn-link nav-link'}>
                    Liens familiaux ({personGroup.relations.length})
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
      <div className="tw-pt-4">
        {person.outOfActiveList && (
          <Alert color="warning" className="noprint">
            {person?.name} est en dehors de la file active, pour{' '}
            {person.outOfActiveListReasons.length > 1 ? 'les motifs suivants' : 'le motif suivant'} :{' '}
            <b>{person.outOfActiveListReasons.join(', ')}</b>{' '}
            {person.outOfActiveListDate && `le ${formatDateWithFullMonth(person.outOfActiveListDate)}`}
          </Alert>
        )}
        {currentTab === 'Résumé' && <Summary person={person} />}
        {!['restricted-access'].includes(user.role) && (
          <>
            {currentTab === 'Dossier Médical' && user.healthcareProfessional && <MedicalFile person={person} />}
            {currentTab === 'Lieux fréquentés' && <Places person={person} />}
            {currentTab === 'Historique' && <History person={person} />}
            {currentTab === 'Liens familiaux' && <PersonFamily person={person} />}
          </>
        )}
      </div>
    </div>
  );
}
