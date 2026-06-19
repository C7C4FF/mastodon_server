import { Map as ImmutableMap, List as ImmutableList } from 'immutable';

import {
  ALL_CONVERSATIONS_FETCH_REQUEST,
  ALL_CONVERSATIONS_FETCH_SUCCESS,
  ALL_CONVERSATIONS_FETCH_FAIL,
  ALL_CONVERSATIONS_UPDATE,
  ALL_CONVERSATIONS_READ,
} from '../actions/all_conversations';
import { compareId } from '../compare_id';

const initialState = ImmutableMap({
  items: ImmutableList(),
  isLoading: false,
  hasMore: true,
});

const conversationToMap = item => ImmutableMap({
  id: item.id,
  unread: item.unread,
  unread_count: item.unread_count ?? (item.unread ? 1 : 0),
  accounts: ImmutableList(item.accounts.map(a => a.id)),
  last_status: item.last_status ? item.last_status.id : null,
});

const updateConversation = (state, item) => {
  const newItem = conversationToMap(item);

  return state.update('items', list => {
    const itemIndex = list.findIndex(x => x.get('id') === newItem.get('id'));

    if (itemIndex > -1) {
      list = list.delete(itemIndex);
    }

    return list.unshift(newItem);
  });
};

const expandNormalizedConversations = (state, conversations, next, isLoadingRecent) => {
  let items = ImmutableList(conversations.map(conversationToMap));

  return state.withMutations(mutable => {
    if (!items.isEmpty()) {
      mutable.update('items', list => {
        list = list.map(oldItem => {
          const newItemIndex = items.findIndex(x => x.get('id') === oldItem.get('id'));

          if (newItemIndex === -1) {
            return oldItem;
          }

          const newItem = items.get(newItemIndex);
          items = items.delete(newItemIndex);

          return newItem;
        });

        list = list.concat(items);

        return list.sortBy(x => x.get('last_status'), (a, b) => {
          if(a === null || b === null) {
            return -1;
          }

          return compareId(a, b) * -1;
        });
      });
    }

    if (!next && !isLoadingRecent) {
      mutable.set('hasMore', false);
    }

    mutable.set('isLoading', false);
  });
};

export const selectUnreadAllConversationsCount = state => (
  state
    .getIn(['all_conversations', 'items'])
    .count(item => item.get('unread'))
);

export default function allConversations(state = initialState, action) {
  switch (action.type) {
  case ALL_CONVERSATIONS_FETCH_REQUEST:
    return state.set('isLoading', true);
  case ALL_CONVERSATIONS_FETCH_FAIL:
    return state.set('isLoading', false);
  case ALL_CONVERSATIONS_FETCH_SUCCESS:
    return expandNormalizedConversations(state, action.conversations, action.next, action.isLoadingRecent);
  case ALL_CONVERSATIONS_UPDATE:
    return updateConversation(state, action.conversation);
  case ALL_CONVERSATIONS_READ:
    return state.update('items', list => list.map(item => {
      if (item.get('id') === action.id) {
        return item.set('unread', false).set('unread_count', 0);
      }

      return item;
    }));
  default:
    return state;
  }
}
