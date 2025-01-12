import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';
import { theme } from '../config';
import { actionsState, CANCEL, DONE, prepareActionForEncryption, sortActionsOrConsultations, TODO } from '../recoil/actions';
import { currentTeamState } from '../recoil/auth';
import { commentsState, prepareCommentForEncryption } from '../recoil/comments';
import { personsState } from '../recoil/persons';
import { formatTime } from '../services/date';
import ButtonCustom from './ButtonCustom';
import DateBloc from './DateBloc';
import Table from './table';
import UserName from './UserName';
import { useLocalStorage } from 'react-use';
import API from '../services/api';

export default function Notification() {
  const [showModal, setShowModal] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const persons = useRecoilValue(personsState);
  const actions = useRecoilValue(actionsState);
  const comments = useRecoilValue(commentsState);

  const [actionsSortBy, setActionsSortBy] = useLocalStorage('actions-consultations-sortBy', 'dueAt');
  const [actionsSortOrder, setActionsSortOrder] = useLocalStorage('actions-consultations-sortOrder', 'ASC');

  const actionsFiltered = useMemo(
    () =>
      actions
        .filter((action) => {
          return (
            (Array.isArray(action.teams) ? action.teams.includes(currentTeam?._id) : action.team === currentTeam?._id) &&
            action.status === TODO &&
            action.urgent
          );
        })
        .sort(sortActionsOrConsultations(actionsSortBy, actionsSortOrder)),
    [actions, currentTeam?._id, actionsSortBy, actionsSortOrder]
  );

  const commentsFiltered = useMemo(
    () =>
      comments
        .filter((c) => c.urgent)
        .map((comment) => {
          const commentPopulated = { ...comment };
          if (comment.person) {
            const id = comment?.person;
            commentPopulated.person = persons.find((p) => p._id === id);
            commentPopulated.type = 'person';
          }
          if (comment.action) {
            const id = comment?.action;
            const action = actions.find((p) => p._id === id);
            commentPopulated.action = action;
            commentPopulated.person = persons.find((p) => p._id === action?.person);
            commentPopulated.type = 'action';
          }
          return commentPopulated;
        })
        .filter((c) => c.action || c.person)
        .sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt))),
    [comments, persons, actions]
  );

  if (!actionsFiltered.length && !commentsFiltered.length) return null;
  return (
    <>
      <div style={{ alignSelf: 'center', display: 'flex', cursor: 'pointer' }} onClick={() => setShowModal(true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          style={{ width: '1.5rem', height: '1.5rem' }}
          stroke={theme.main}
          strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <div style={{ marginTop: '-0.75rem', marginLeft: '-0.75rem' }}>
          <span className="badge badge-pill badge-danger">{actionsFiltered.length + commentsFiltered.length}</span>
        </div>
      </div>
      <StyledModal isOpen={showModal} toggle={() => setShowModal(false)} size="lg">
        <div>
          <Actions
            setShowModal={setShowModal}
            actions={actionsFiltered}
            setSortOrder={setActionsSortOrder}
            setSortBy={setActionsSortBy}
            sortBy={actionsSortBy}
            sortOrder={actionsSortOrder}
          />
          <Comments setShowModal={setShowModal} comments={commentsFiltered} />
          <ButtonCustom style={{ margin: '1rem auto' }} title="OK, merci" onClick={() => setShowModal(false)} />
        </div>
      </StyledModal>
    </>
  );
}

const Actions = ({ setShowModal, actions, setSortOrder, setSortBy, sortBy, sortOrder }) => {
  const history = useHistory();
  const persons = useRecoilValue(personsState);
  const setActions = useSetRecoilState(actionsState);

  if (!actions.length) return null;
  return (
    <>
      <ModalHeader toggle={() => setShowModal(false)}>Actions urgentes et vigilance</ModalHeader>
      <ModalBody>
        <Table
          data={actions}
          rowKey={'_id'}
          onRowClick={(action) => {
            setShowModal(false);
            history.push(`/action/${action._id}`);
          }}
          columns={[
            {
              title: 'Date',
              dataKey: 'dueAt',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (action) => {
                return <DateBloc date={[DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt} />;
              },
            },
            {
              title: 'Heure',
              dataKey: '_id',
              render: (action) => {
                if (!action.dueAt || !action.withTime) return null;
                return formatTime(action.dueAt);
              },
            },
            { title: 'Nom', dataKey: 'name', onSortOrder: setSortOrder, onSortBy: setSortBy, sortBy, sortOrder },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (action) => <>{persons.find((p) => p._id === action.person)?.name}</>,
            },
            {
              title: '',
              dataKey: 'urgent',
              small: true,
              className: '!tw-min-w-0 !tw-w-4',
              render: (action) => {
                return (
                  <button
                    className="button-destructive !tw-ml-0"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const actionResponse = await API.put({
                        path: `/action/${action._id}`,
                        body: prepareActionForEncryption({ ...action, urgent: false }),
                      });
                      if (actionResponse.ok) {
                        const newAction = actionResponse.decryptedData;
                        setActions((actions) =>
                          actions.map((a) => {
                            if (a._id === newAction._id) return newAction;
                            return a;
                          })
                        );
                      }
                    }}>
                    Déprioriser
                  </button>
                );
              },
            },
          ]}
        />
      </ModalBody>
    </>
  );
};

const Comments = ({ setShowModal, comments }) => {
  const history = useHistory();
  const setComments = useSetRecoilState(commentsState);

  if (!comments.length) return null;
  return (
    <>
      <ModalHeader>Commentaires urgents et vigilance</ModalHeader>
      <ModalBody>
        <Table
          data={comments}
          rowKey={'_id'}
          onRowClick={(comment) => {
            setShowModal(false);
            history.push(`/${comment.type}/${comment[comment.type]._id}?tab=Résumé`);
          }}
          columns={[
            {
              title: 'Date',
              dataKey: 'date',
              render: (comment) => {
                return <DateBloc date={comment.date || comment.createdAt} />;
              },
            },
            {
              title: 'Heure',
              dataKey: '_id',
              render: (comment) => <span>{dayjs(comment.date || comment.createdAt).format('HH:mm')}</span>,
            },
            {
              title: 'Utilisateur',
              dataKey: 'user',
              render: (comment) => <UserName id={comment.user} />,
            },
            {
              title: 'Type',
              dataKey: 'type',
              render: (comment) => <span>{comment.type === 'action' ? 'Action' : 'Personne suivie'}</span>,
            },
            {
              title: 'Nom',
              dataKey: 'person',
              render: (comment) => (
                <>
                  <b></b>
                  <b>{comment[comment.type]?.name}</b>
                  {comment.type === 'action' && (
                    <>
                      <br />
                      <i>(pour {comment.person?.name || ''})</i>
                    </>
                  )}
                </>
              ),
            },
            {
              title: 'Commentaire',
              dataKey: 'comment',
              render: (comment) => {
                return (
                  <p>
                    {comment.comment
                      ? comment.comment.split('\n').map((c, i, a) => {
                          if (i === a.length - 1) return c;
                          return (
                            <React.Fragment key={i}>
                              {c}
                              <br />
                            </React.Fragment>
                          );
                        })
                      : ''}
                  </p>
                );
              },
            },
            {
              title: '',
              dataKey: 'urgent',
              small: true,
              className: '!tw-min-w-0 !tw-w-4',
              render: (comment) => {
                return (
                  <button
                    className="button-destructive !tw-ml-0"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const commentResponse = await API.put({
                        path: `/comment/${comment._id}`,
                        body: prepareCommentForEncryption({ ...comment, urgent: false }),
                      });
                      if (commentResponse.ok) {
                        const newComment = commentResponse.decryptedData;
                        setComments((comments) =>
                          comments.map((a) => {
                            if (a._id === newComment._id) return newComment;
                            return a;
                          })
                        );
                      }
                    }}>
                    Déprioriser
                  </button>
                );
              },
            },
          ]}
        />
      </ModalBody>
    </>
  );
};

const StyledModal = styled(Modal)`
  width: 1000px;
  max-width: 90vw;
  max-height: 90vh;
  > div {
    overflow: auto;
    max-height: 90vh;
  }
`;
