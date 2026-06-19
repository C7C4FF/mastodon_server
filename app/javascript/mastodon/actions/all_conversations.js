import api, { getLinks } from '../api';

import {
  importFetchedAccounts,
  importFetchedStatuses,
} from './importer';

export const ALL_CONVERSATIONS_FETCH_REQUEST = 'ALL_CONVERSATIONS_FETCH_REQUEST';
export const ALL_CONVERSATIONS_FETCH_SUCCESS = 'ALL_CONVERSATIONS_FETCH_SUCCESS';
export const ALL_CONVERSATIONS_FETCH_FAIL    = 'ALL_CONVERSATIONS_FETCH_FAIL';

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
