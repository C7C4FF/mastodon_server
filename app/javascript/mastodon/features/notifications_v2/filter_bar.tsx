import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';

import { FormattedMessage } from 'react-intl';

import { setNotificationsFilter } from 'mastodon/actions/notification_groups';
import { selectSettingsNotificationsQuickFilterActive } from 'mastodon/selectors/settings';
import { useAppDispatch, useAppSelector } from 'mastodon/store';

const BarButton: React.FC<
  PropsWithChildren<{
    selectedFilter: string;
    type: string;
    title?: string;
  }>
> = ({ selectedFilter, type, title, children }) => {
  const dispatch = useAppDispatch();

  const onClick = useCallback(() => {
    void dispatch(setNotificationsFilter({ filterType: type }));
  }, [dispatch, type]);

  return (
    <button
      className={selectedFilter === type ? 'active' : ''}
      onClick={onClick}
      title={title}
      type='button'
    >
      {children}
    </button>
  );
};

export const FilterBar: React.FC = () => {
  const selectedFilterValue = useAppSelector(
    selectSettingsNotificationsQuickFilterActive,
  );
  const selectedFilter = ['all', 'mention'].includes(selectedFilterValue)
    ? selectedFilterValue
    : 'all';

  return (
    <div className='notification__filter-bar'>
      <BarButton selectedFilter={selectedFilter} type='all' key='all'>
        <FormattedMessage id='notifications.filter.all' defaultMessage='All' />
      </BarButton>
      <BarButton selectedFilter={selectedFilter} type='mention' key='mention'>
        <FormattedMessage
          id='notifications.filter.mentions'
          defaultMessage='Mentions'
        />
      </BarButton>
    </div>
  );
};
