import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../services/api';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import DocumentsManager from '../../components/DocumentsManager';
import Spacer from '../../components/Spacer';
import Label from '../../components/Label';
import ActionStatusSelect from '../../components/Selects/ActionStatusSelect';
import { consultationsState, encryptedFields, prepareConsultationForEncryption } from '../../recoil/consultations';
import ConsultationTypeSelect from '../../components/Selects/ConsultationTypeSelect';
import CustomFieldInput from '../../components/CustomFieldInput';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { CANCEL, DONE, TODO } from '../../recoil/actions';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import useCreateReportAtDateIfNotExist from '../../utils/useCreateReportAtDateIfNotExist';
import { dayjsInstance } from '../../services/dateDayjs';
import InputFromSearchList from '../../components/InputFromSearchList';
import { useFocusEffect } from '@react-navigation/native';

const cleanValue = (value) => {
  if (typeof value === 'string') return (value || '').trim();
  return value;
};

const Consultation = ({ navigation, route }) => {
  const setAllConsultations = useSetRecoilState(consultationsState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const person = route?.params?.personDB || route?.params?.person;
  const consultationDB = route?.params?.consultationDB;
  const isNew = !consultationDB?._id;
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const castToConsultation = useCallback(
    (consult = {}) => {
      const toReturn = {};
      const consultationTypeCustomFields = consult?.type
        ? organisation.consultations.find((c) => c?.name === consult?.type)?.fields
        : organisation.consultations[0].fields;
      const encryptedFieldsIncludingCustom = [...(consultationTypeCustomFields?.map((f) => f.name) || []), ...encryptedFields];
      for (const field of encryptedFieldsIncludingCustom) {
        toReturn[field] = cleanValue(consult[field]);
      }
      return {
        ...toReturn,
        name: consult.name || '',
        type: consult.type || '',
        status: consult.status || TODO,
        dueAt: consult.dueAt || null,
        person: consult.person || person?._id,
        completedAt: consult.completedAt || null,
        onlyVisibleBy: consult.onlyVisibleBy || [],
        user: consult.user || user._id,
        organisation: consult.organisation || organisation._id,
      };
    },
    [organisation?._id, organisation.consultations, person?._id, user?._id]
  );

  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [consultation, setConsultation] = useState(() => castToConsultation(consultationDB));

  const onChange = (keyValue) => setConsultation((c) => ({ ...c, ...keyValue }));

  const backRequestHandledRef = useRef(null);
  useEffect(() => {
    const handleBeforeRemove = (e) => {
      if (backRequestHandledRef.current) return;
      e.preventDefault();
      onGoBackRequested();
    };

    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      beforeRemoveListenerUnsbscribe();
    };
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const newPerson = route?.params?.person;
      if (newPerson) {
        setConsultation((c) => ({ ...c, person: newPerson?._id }));
      }
    }, [route?.params?.person])
  );

  const onSaveConsultationRequest = async () => {
    if (!consultation.status) return Alert.alert('Veuillez indiquer un status');
    if (!consultation.dueAt) return Alert.alert('Veuillez indiquer une date');
    if (!consultation.type) return Alert.alert('Veuillez indiquer un type');
    if (!consultation.person) return Alert.alert('Veuillez ajouter une personne');
    Keyboard.dismiss();
    setPosting(true);
    if ([DONE, CANCEL].includes(consultation.status)) {
      if (!consultation.completedAt) consultation.completedAt = new Date();
    } else {
      consultation.completedAt = null;
    }
    const body = prepareConsultationForEncryption(organisation.consultations)({ ...consultation, _id: consultationDB?._id });
    const consultationResponse = isNew
      ? await API.post({ path: '/consultation', body })
      : await API.put({ path: `/consultation/${consultationDB._id}`, body });
    if (!consultationResponse.ok) return;
    if (isNew) {
      setAllConsultations((all) => [...all, consultationResponse.decryptedData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
    } else {
      setAllConsultations((all) =>
        all
          .map((c) => {
            if (c._id === consultationDB._id) return consultationResponse.decryptedData;
            return c;
          })
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      );
    }
    const { createdAt, completedAt } = consultationResponse.decryptedData;
    await createReportAtDateIfNotExist(createdAt);
    if (!!completedAt) {
      if (dayjsInstance(completedAt).format('YYYY-MM-DD') !== dayjsInstance(createdAt).format('YYYY-MM-DD')) {
        await createReportAtDateIfNotExist(completedAt);
      }
    }
    onBack();
  };

  const onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer cette consultation ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onDelete,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onDelete = async () => {
    setDeleting(true);
    const response = await API.delete({ path: `/consultation/${consultationDB._id}` });
    if (!response.ok) {
      Alert.alert(response.error);
      return;
    }
    setAllConsultations((all) => all.filter((t) => t._id !== consultationDB._id));
    Alert.alert('Consultation supprimée !');
    onBack();
  };

  const isDisabled = useMemo(() => {
    if (JSON.stringify(castToConsultation(consultationDB)) === JSON.stringify(castToConsultation(consultation))) return true;
    return false;
  }, [castToConsultation, consultationDB, consultation]);

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.goBack();
    setTimeout(() => setPosting(false), 250);
    setTimeout(() => setDeleting(false), 250);
  };

  const onGoBackRequested = () => {
    if (isDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer cette consultation ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          await onSaveConsultationRequest();
        },
      },
      {
        text: 'Ne pas enregistrer',
        onPress: onBack,
        style: 'destructive',
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onSearchPerson = () => navigation.push('PersonsSearch', { fromRoute: 'Consultation' });

  return (
    <SceneContainer testID="consultation-form">
      <ScreenTitle
        title={`${isNew ? `Nouvelle consultation${person?.name ? ' pour' : ''}` : `Modifier la consultation ${consultation?.name} de`} ${
          person?.name
        }`}
        onBack={onGoBackRequested}
        testID="consultation"
      />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          {!!isNew && !route?.params?.personDB && (
            <InputFromSearchList label="Personne concernée" value={person?.name || '-- Aucune --'} onSearchRequest={onSearchPerson} />
          )}
          <InputLabelled
            label="Nom (facultatif)"
            value={consultation.name}
            onChangeText={(name) => onChange({ name })}
            placeholder="Nom de la consultation (facultatif)"
            testID="consultation-name"
          />
          <ConsultationTypeSelect editable value={consultation.type} onSelect={(type) => onChange({ type })} />
          {organisation.consultations
            .find((e) => e.name === consultation.type)
            ?.fields.filter((f) => f)
            .filter((f) => f.enabled || f.enabledTeams?.includes(currentTeam._id))
            .map((field) => {
              const { label, name } = field;
              return (
                <CustomFieldInput
                  key={label}
                  label={label}
                  field={field}
                  value={consultation[name]}
                  handleChange={(newValue) => onChange({ [name]: newValue })}
                  editable
                  // ref={(r) => (refs.current[`${name}-ref`] = r)}
                  // onFocus={() => _scrollToInput(refs.current[`${name}-ref`])}
                />
              );
            })}
          <Label label="Document(s)" />
          <DocumentsManager
            personDB={person}
            onAddDocument={(doc) => onChange({ documents: [...(consultation.documents || []), doc] })}
            onDelete={(doc) => onChange({ documents: consultation.documents.filter((d) => d.file.filename !== doc.file.filename) })}
            documents={consultation.documents}
          />
          <Spacer />
          <ActionStatusSelect value={consultation.status} onSelect={(status) => onChange({ status })} editable testID="consultation-status" />
          <DateAndTimeInput label="Date" date={consultation.dueAt} setDate={(dueAt) => onChange({ dueAt })} editable showYear showTime withTime />
          <CheckboxLabelled
            label="Seulement visible par moi"
            alone
            onPress={() => onChange({ onlyVisibleBy: consultation.onlyVisibleBy?.includes(user._id) ? [] : [user._id] })}
            value={consultation.onlyVisibleBy?.includes(user._id)}
          />
          <ButtonsContainer>
            {!isNew && <ButtonDelete onPress={onDeleteRequest} deleting={deleting} />}
            <Button
              caption={isNew ? 'Créer' : 'Modifier'}
              disabled={!!isDisabled}
              onPress={onSaveConsultationRequest}
              loading={posting}
              testID="consultation-create"
            />
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Consultation;
