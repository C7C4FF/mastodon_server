import { Map as ImmutableMap, List as ImmutableList } from 'immutable';

import {
  ALL_CONVERSATIONS_FETCH_REQUEST,
  ALL_CONVERSATIONS_FETCH_SUCCESS,
  ALL_CONVERSATIONS_FETCH_FAIL,
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
  accounts: ImmutableList(item.accounts.map(a => a.id)),
  last_status: item.last_status ? item.last_status.id : null,
});

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

export default function allConversations(state = initialState, action) {
  switch (action.type) {
  case ALL_CONVERSATIONS_FETCH_REQUEST:
    return state.set('isLoading', true);
  case ALL_CONVERSATIONS_FETCH_FAIL:
    return state.set('isLoading', false);
  case ALL_CONVERSATIONS_FETCH_SUCCESS:
    return expandNormalizedConversations(state, action.conversations, action.next, action.isLoadingRecent);
  default:
    return state;
  }
}
