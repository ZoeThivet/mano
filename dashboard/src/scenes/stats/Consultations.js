import React from 'react';
import { CustomResponsivePie } from './charts';
import { getPieData } from './utils';
import { organisationState } from '../../recoil/auth';
import { useRecoilValue } from 'recoil';
import { Block } from './Blocks';
import CustomFieldsStats from './CustomFieldsStats';

const ConsultationsStats = ({ consultations }) => {
  const organisation = useRecoilValue(organisationState);
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des consultations</h3>
      <div className="tw-mb-5 tw-flex tw-justify-center">
        <Block
          data={consultations}
          title="Nombre de consultations"
          help={`Nombre de consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
        />
      </div>
      <CustomResponsivePie
        title="Consultations par type"
        data={getPieData(consultations, 'type')}
        help={`Répartition par type des consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
      />
      <CustomResponsivePie
        title="Consultations par statut"
        data={getPieData(consultations, 'status')}
        help={`Répartition par status des consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
      />
      {organisation.consultations.map((c) => {
        return (
          <div key={c.name}>
            <h4 className="tw-my-8 tw-mx-0 tw-text-xl tw-text-black75">Statistiques des consultations de type « {c.name} »</h4>
            <CustomFieldsStats
              data={consultations.filter((d) => d.type === c.name)}
              customFields={c.fields}
              help={(label) => `${label.capitalize()} des consultations réalisées dans la période définie.`}
            />
          </div>
        );
      })}
    </>
  );
};

export default ConsultationsStats;
