import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import styled from 'styled-components';
import InputLabelled from '../../components/InputLabelled';
import Label from '../../components/Label';
import { MyText } from '../../components/MyText';
import Row from '../../components/Row';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import Spacer from '../../components/Spacer';
import Tags from '../../components/Tags';
import { CANCEL, DONE } from '../../recoil/actions';
import { currentTeamState } from '../../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import API from '../../services/api';
import colors from '../../utils/colors';
import { actionsCompletedOrCanceledForReport, actionsCreatedForReport, commentsForReport, observationsForReport } from './selectors';
import { getPeriodTitle } from './utils';

const castToReport = (report = {}) => ({
  description: report.description?.trim() || '',
  collaborations: report.collaborations || [],
  date: report.date,
  date: report.date,
});

const Report = ({ navigation, route }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const [reports, setReports] = useRecoilState(reportsState);

  const reportDB = useMemo(() => reports.find((r) => r._id === route.params._id), [reports, route.params._id]);
  const [report, setReport] = useState(castToReport(route?.params));

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) setReport(castToReport(reportDB)); // to update collaborations
  }, [isFocused, reportDB]);

  const actionsCreated = useRecoilValue(actionsCreatedForReport({ date: reportDB.date }));
  const actionsCompleted = useRecoilValue(actionsCompletedOrCanceledForReport({ date: reportDB.date, status: DONE }));
  const actionsCanceled = useRecoilValue(actionsCompletedOrCanceledForReport({ date: reportDB.date, status: CANCEL }));
  const comments = useRecoilValue(commentsForReport({ date: reportDB.date }));
  const observations = useRecoilValue(observationsForReport({ date: reportDB.date }));

  const [updating, setUpdating] = useState(false);
  const [editable, setEditable] = useState(route?.params?.editable || false);

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.goBack();
  };

  const backRequestHandledRef = useRef(null);
  const handleBeforeRemove = (e) => {
    if (backRequestHandledRef.current === true) return;
    e.preventDefault();
    onGoBackRequested();
  };

  const isUpdateDisabled = useMemo(() => {
    const newReport = { ...reportDB, ...castToReport(report) };
    if (JSON.stringify(castToReport(reportDB)) !== JSON.stringify(castToReport(newReport))) return false;
    return true;
  }, [reportDB, report]);

  const onEdit = () => setEditable((e) => !e);

  const onUpdateReport = async () => {
    setUpdating(true);
    const response = await API.put({
      path: `/report/${reportDB._id}`,
      body: prepareReportForEncryption({ ...reportDB, ...castToReport(report) }),
    });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setReports((territories) =>
        territories.map((a) => {
          if (a._id === reportDB._id) return response.decryptedData;
          return a;
        })
      );
      Alert.alert('Compte-rendu mis à jour !');
      setUpdating(false);
      setEditable(false);
      return true;
    }
  };

  const onGoBackRequested = () => {
    if (isUpdateDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer ce compte-rendu ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const ok = await onUpdateReport();
          if (ok) onBack();
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

  useEffect(() => {
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = useMemo(
    () => `Compte rendu de l'équipe ${currentTeam?.name || ''}\n${getPeriodTitle(reportDB.date, currentTeam?.nightSession)}`,
    [currentTeam?.name, currentTeam?.nightSession, reportDB.date]
  );

  return (
    <SceneContainer>
      <ScreenTitle
        title={title}
        onBack={onGoBackRequested}
        onEdit={!editable ? onEdit : null}
        onSave={!editable || isUpdateDisabled ? null : onUpdateReport}
        saving={updating}
        testID="report"
      />
      <ScrollContainer noPadding>
        <Summary>
          <InputLabelled
            label="Description"
            onChangeText={(description) => setReport((r) => ({ ...r, description }))}
            value={report.description}
            placeholder="Que s'est-il passé aujourd'hui ?"
            multiline
            editable={editable}
          />
          {editable ? <Label label="Collaboration(s)" /> : <InlineLabel>Collaboration(s) :</InlineLabel>}
          <Tags
            data={report.collaborations}
            onChange={(collaborations) => setReport((r) => ({ ...r, collaborations }))}
            editable={editable}
            onAddRequest={() => navigation.navigate('Collaborations', { report: reportDB })}
            renderTag={(collaboration) => <MyText>{collaboration}</MyText>}
          />
        </Summary>
        <Row
          withNextButton
          caption={`Actions complétées (${actionsCompleted.length})`}
          onPress={() => navigation.navigate('Actions', { date: reportDB.date, status: DONE })}
          disabled={!actionsCompleted.length}
        />
        <Row
          withNextButton
          caption={`Actions créées (${actionsCreated.length})`}
          onPress={() => navigation.navigate('Actions', { date: reportDB.date, status: null })}
          disabled={!actionsCreated.length}
        />
        <Row
          withNextButton
          caption={`Actions annulées (${actionsCanceled.length})`}
          onPress={() => navigation.navigate('Actions', { date: reportDB.date, status: CANCEL })}
          disabled={!actionsCanceled.length}
        />
        <Spacer height={30} />
        <Row
          withNextButton
          caption={`Commentaires (${comments.length})`}
          onPress={() => navigation.navigate('Comments', { date: reportDB.date })}
          disabled={!comments.length}
        />
        <Spacer height={30} />
        <Row
          withNextButton
          caption={`Observations (${observations.length})`}
          onPress={() => navigation.navigate('Observations', { date: reportDB.date })}
          disabled={!observations.length}
        />
      </ScrollContainer>
    </SceneContainer>
  );
};

const Summary = styled.View`
  padding: 30px 30px 0;
`;

const InlineLabel = styled(MyText)`
  font-size: 15px;
  color: ${colors.app.color};
  margin-bottom: 15px;
`;

export default Report;
