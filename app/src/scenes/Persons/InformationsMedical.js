import React, { useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SubHeader from '../../components/SubHeader';
import HealthInsuranceMultiCheckBox from '../../components/Selects/HealthInsuranceMultiCheckBox';
import Spacer from '../../components/Spacer';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import InputLabelled from '../../components/InputLabelled';
import colors from '../../utils/colors';
import CustomFieldInput from '../../components/CustomFieldInput';
import { customFieldsPersonsMedicalSelector } from '../../recoil/persons';
import { currentTeamState, userState } from '../../recoil/auth';

const InformationsMedical = ({ navigation, editable, onChange, onUpdatePerson, onEdit, isUpdateDisabled, updating, backgroundColor, person }) => {
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const scrollViewRef = useRef(null);
  const refs = useRef({});
  const _scrollToInput = (ref) => {
    if (!ref) return;
    if (!scrollViewRef.current) return;
    setTimeout(() => {
      ref.measureLayout(
        scrollViewRef.current,
        (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  return (
    <>
      <SubHeader center backgroundColor={backgroundColor || colors.app.color} onBack={navigation.goBack} caption="Informations médicales" />
      <ScrollContainer ref={scrollViewRef} backgroundColor={backgroundColor || colors.app.color}>
        <View>
          <HealthInsuranceMultiCheckBox
            values={person.healthInsurances}
            onChange={(healthInsurances) => onChange({ healthInsurances })}
            editable={editable}
          />
          <InputLabelled
            label="Structure de suivi médical"
            onChangeText={(structureMedical) => onChange({ structureMedical })}
            value={person.structureMedical || (editable ? null : '-- Non renseignée --')}
            placeholder="Renseignez la structure médicale le cas échéant"
            editable={editable}
          />
          {!editable && <Spacer />}
          {(customFieldsPersonsMedical || [])
            .filter((f) => f)
            .filter((f) => f.enabled || f.enabledTeams?.includes(currentTeam._id))
            .filter((f) => !f.onlyHealthcareProfessional || user?.healthcareProfessional)
            .map((field) => {
              const { label, name } = field;
              return (
                <CustomFieldInput
                  label={label}
                  key={label}
                  field={field}
                  value={person[name]}
                  handleChange={(newValue) => onChange({ [name]: newValue })}
                  editable={editable}
                  ref={(r) => (refs.current[`${name}-ref`] = r)}
                  onFocus={() => _scrollToInput(refs.current[`${name}-ref`])}
                />
              );
            })}
          <ButtonsContainer>
            <Button
              caption={editable ? 'Mettre à jour' : 'Modifier'}
              onPress={editable ? onUpdatePerson : onEdit}
              disabled={editable ? isUpdateDisabled : false}
              loading={updating}
            />
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    </>
  );
};

export default InformationsMedical;
