import api, { getLinks } from '../api';
import { unescapeHTML } from '../utils/html';

import {
  importFetchedAccounts,
  importFetchedStatuses,
  importFetchedStatus,
} from './importer';

export const ALL_CONVERSATIONS_FETCH_REQUEST = 'ALL_CONVERSATIONS_FETCH_REQUEST';
export const ALL_CONVERSATIONS_FETCH_SUCCESS = 'ALL_CONVERSATIONS_FETCH_SUCCESS';
export const ALL_CONVERSATIONS_FETCH_FAIL    = 'ALL_CONVERSATIONS_FETCH_FAIL';
export const ALL_CONVERSATIONS_UPDATE        = 'ALL_CONVERSATIONS_UPDATE';
export const ALL_CONVERSATIONS_READ          = 'ALL_CONVERSATIONS_READ';

const notifiedAllConversationStatusIds = new Set();

const notifyAllConversation = (conversation, getState) => {
  const status = conversation.last_status;

  if (!conversation.unread || !status || notifiedAllConversationStatusIds.has(status.id) || status.account?.id === getState().getIn(['meta', 'me'])) {
    return;
  }

  notifiedAllConversationStatusIds.add(status.id);

  if (typeof window.Notification === 'undefined' || window.Notification.permission !== 'granted') {
    return;
  }

  const name = status.account.display_name || status.account.username;
  const body = status.spoiler_text?.length > 0 ? status.spoiler_text : unescapeHTML(status.content || '');
  const notification = new Notification(`${name}님의 전체 다이렉트 메세지`, {
    body,
    icon: status.account.avatar,
    tag: `all-direct-${conversation.id}`,
  });

  notification.addEventListener('click', () => {
    window.focus();
    notification.close();
  });
};

export const expandAllConversations = ({ maxId } = {}) => (dispatch, getState) => {
  dispatch(expandAllConversationsRequest());

  const params = { max_id: maxId };

  if (!maxId) {
    params.since_id = getState().getIn(['all_conversations', 'items', 0, 'last_status']);
  }

  const isLoadingRecent = !!params.since_id;

  api().get('/api/v1/admin/direct_messages', { params })
    .then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');

      dispatch(importFetchedAccounts(response.data.reduce((aggr, item) => aggr.concat(item.accounts), [])));
      dispatch(importFetchedStatuses(response.data.map(item => item.last_status).filter(x => !!x)));
      dispatch(expandAllConversationsSuccess(response.data, next ? next.uri : null, isLoadingRecent));
    })
    .catch(err => dispatch(expandAllConversationsFail(err)));
};

export const expandAllConversationsRequest = () => ({
  type: ALL_CONVERSATIONS_FETCH_REQUEST,
});

export const expandAllConversationsSuccess = (conversations, next, isLoadingRecent) => ({
  type: ALL_CONVERSATIONS_FETCH_SUCCESS,
  conversations,
  next,
  isLoadingRecent,
});

export const expandAllConversationsFail = error => ({
  type: ALL_CONVERSATIONS_FETCH_FAIL,
  error,
});

export const updateAllConversations = conversation => (dispatch, getState) => {
  dispatch(importFetchedAccounts(conversation.accounts));

  if (conversation.last_status) {
    dispatch(importFetchedStatus(conversation.last_status));
  }

  dispatch({
    type: ALL_CONVERSATIONS_UPDATE,
    conversation,
  });

  notifyAllConversation(conversation, getState);
};

export const markAllConversationRead = conversationId => (dispatch) => {
  dispatch({
    type: ALL_CONVERSATIONS_READ,
    id: conversationId,
  });

  api().post(`/api/v1/admin/direct_messages/${conversationId}/read`);
};
