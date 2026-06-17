import { useCallback, useMemo } from 'react';
import type { FC } from 'react';

import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { openModal } from '@/mastodon/actions/modal';
import { useAccount } from '@/mastodon/hooks/useAccount';
import { useAppDispatch } from '@/mastodon/store';
import CalendarIcon from '@/material-icons/400-24px/calendar_month.svg?react';

import { FormattedDateWrapper } from '../formatted_date';
import { Icon } from '../icon';

import classes from './styles.module.scss';

export const AccountNumberFields: FC<{ accountId: string }> = ({
  accountId,
}) => {
  const intl = useIntl();
  const account = useAccount(accountId);
  const createdThisYear = useMemo(
    () => account?.created_at.includes(new Date().getFullYear().toString()),
    [account?.created_at],
  );

  const dispatch = useAppDispatch();
  const showJoinModal = useCallback(() => {
    dispatch(
      openModal({ modalType: 'ACCOUNT_JOIN_DATE', modalProps: { accountId } }),
    );
  }, [accountId, dispatch]);

  if (!account) {
    return null;
  }

  return (
    <div className={classes.profileMeta}>
      <button
        type='button'
        onClick={showJoinModal}
        className={classes.joinedDate}
        title={intl.formatDate(account.created_at)}
      >
        <Icon id='calendar' icon={CalendarIcon} />
        <FormattedMessage
          id='account.joined_date_label'
          defaultMessage='Joined:'
        />{' '}
        <span>
          {createdThisYear ? (
            <FormattedDateWrapper
              value={account.created_at}
              month='short'
              day='2-digit'
            />
          ) : (
            <FormattedDateWrapper value={account.created_at} year='numeric' />
          )}
        </span>
      </button>

      <div className={classes.followCounts}>
        <Link
          to={`/@${account.acct}/following`}
          title={intl.formatNumber(account.following_count)}
        >
          <strong>
            <FormattedNumber value={account.following_count} />
          </strong>{' '}
          <FormattedMessage
            id='account.following_x'
            defaultMessage='Following'
          />
        </Link>

        <Link
          to={`/@${account.acct}/followers`}
          title={intl.formatNumber(account.followers_count)}
        >
          <strong>
            <FormattedNumber value={account.followers_count} />
          </strong>{' '}
          <FormattedMessage
            id='account.followers_x'
            defaultMessage='Followers'
          />
        </Link>
      </div>
    </div>
  );
};
