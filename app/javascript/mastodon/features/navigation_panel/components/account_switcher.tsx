import { useCallback, useState } from 'react';

import { defineMessages, useIntl } from 'react-intl';

import AddIcon from '@/material-icons/400-24px/add.svg?react';
import CheckIcon from '@/material-icons/400-24px/check.svg?react';
import LogoutIcon from '@/material-icons/400-24px/logout.svg?react';
import MoreHorizIcon from '@/material-icons/400-24px/more_horiz.svg?react';
import { openModal } from 'mastodon/actions/modal';
import api from 'mastodon/api';
import type { ApiAccountJSON } from 'mastodon/api_types/accounts';
import { Avatar } from 'mastodon/components/avatar';
import { Dropdown } from 'mastodon/components/dropdown_menu';
import { Icon } from 'mastodon/components/icon';
import type { RenderItemFn } from 'mastodon/components/dropdown_menu';
import type { ActionMenuItem } from 'mastodon/models/dropdown_menu';
import { useAppDispatch } from 'mastodon/store';

const messages = defineMessages({
  title: {
    id: 'account_switcher.title',
    defaultMessage: 'Accounts',
  },
  addAccount: {
    id: 'account_switcher.add_account',
    defaultMessage: '기존 계정 추가',
  },
  switchTo: {
    id: 'account_switcher.switch_to',
    defaultMessage: 'Switch to @{acct}',
  },
  current: {
    id: 'account_switcher.current',
    defaultMessage: 'Current account',
  },
  menu: {
    id: 'account_switcher.menu',
    defaultMessage: 'Account menu',
  },
  logout: {
    id: 'navigation_bar.logout',
    defaultMessage: 'Logout',
  },
});

interface AccountSwitcherState {
  current_account_id: string;
  accounts: ApiAccountJSON[];
}

interface RedirectResponse {
  redirect_to: string;
}

type AccountSwitcherMenuItem =
  | (ActionMenuItem & {
      account?: ApiAccountJSON;
    })
  | null;

const renderMenuItem: RenderItemFn<AccountSwitcherMenuItem> = (
  item,
  index,
  onClick,
) => {
  if (item === null) {
    return <li key={`sep-${index}`} className='dropdown-menu__separator' />;
  }

  return (
    <li
      className='dropdown-menu__item account-switcher__menu-item'
      key={`${item.text}-${index}`}
    >
      <button
        type='button'
        data-index={index}
        onClick={onClick}
        disabled={item.disabled}
      >
        {item.account ? (
          <>
            <Avatar account={item.account} size={32} />
            <span className='dropdown-menu__item-content'>
              {item.account.display_name || item.account.username}
              <span className='dropdown-menu__item-subtitle'>
                @{item.account.acct}
              </span>
            </span>
            {item.highlighted && <Icon id='check' icon={CheckIcon} />}
          </>
        ) : (
          <>
            {item.icon && <Icon icon={item.icon} id={item.iconId ?? item.text} />}
            <span className='dropdown-menu__item-content'>{item.text}</span>
          </>
        )}
      </button>
    </li>
  );
};

export const AccountSwitcher: React.FC = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const [state, setState] = useState<AccountSwitcherState | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loadAccounts = useCallback(() => {
    setLoading(true);

    void api(false)
      .get<AccountSwitcherState>('/auth/account_switcher.json')
      .then(({ data }) => {
        setState(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const switchToAccount = useCallback((accountId: string) => {
    setLoadingAccountId(accountId);

    void api(false)
      .post<RedirectResponse>('/auth/account_switcher/switch.json', {
        account_id: accountId,
      })
      .then(({ data }) => {
        window.location.assign(data.redirect_to);
      })
      .catch(() => {
        setLoadingAccountId(null);
      });
  }, []);

  const handleSwitch = useCallback(
    (accountId: string) => {
      switchToAccount(accountId);
    },
    [switchToAccount],
  );

  const handleAdd = useCallback(() => {
    setAdding(true);

    void api(false)
      .post<RedirectResponse>('/auth/account_switcher/add.json')
      .then(({ data }) => {
        window.location.assign(data.redirect_to);
      })
      .catch(() => {
        setAdding(false);
      });
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(openModal({ modalType: 'CONFIRM_LOG_OUT', modalProps: {} }));
  }, [dispatch]);

  const items: AccountSwitcherMenuItem[] = [
    ...(state?.accounts ?? []).map((account) => {
      const current = account.id === state?.current_account_id;

      return {
        text: current
          ? intl.formatMessage(messages.current)
          : intl.formatMessage(messages.switchTo, { acct: account.acct }),
        action: () => {
          handleSwitch(account.id);
        },
        account,
        disabled: current || loadingAccountId !== null || adding,
        highlighted: current,
      };
    }),
    null,
    {
      text: intl.formatMessage(messages.addAccount),
      action: handleAdd,
      icon: AddIcon,
      iconId: 'plus',
      disabled: loadingAccountId !== null || adding,
    },
    {
      text: intl.formatMessage(messages.logout),
      action: handleLogout,
      icon: LogoutIcon,
      iconId: 'sign-out',
      disabled: loadingAccountId !== null || adding,
    },
  ];

  return (
    <div className='account-switcher'>
      <Dropdown<AccountSwitcherMenuItem>
        items={items}
        loading={loading}
        icon='ellipsis-h'
        iconComponent={MoreHorizIcon}
        title={intl.formatMessage(messages.menu)}
        placement='top-end'
        className='account-switcher__dropdown'
        renderItem={renderMenuItem}
        onOpen={loadAccounts}
        forceDropdown
      />
    </div>
  );
};
