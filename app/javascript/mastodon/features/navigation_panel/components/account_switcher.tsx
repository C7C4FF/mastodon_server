import { useCallback, useId, useState } from 'react';

import { defineMessages, useIntl } from 'react-intl';

import AddIcon from '@/material-icons/400-24px/add.svg?react';
import CheckIcon from '@/material-icons/400-24px/check.svg?react';
import LogoutIcon from '@/material-icons/400-24px/logout.svg?react';
import MoreHorizIcon from '@/material-icons/400-24px/more_horiz.svg?react';
import PersonRemoveIcon from '@/material-icons/400-24px/person_remove.svg?react';
import { openModal } from 'mastodon/actions/modal';
import api from 'mastodon/api';
import type { ApiAccountJSON } from 'mastodon/api_types/accounts';
import { Avatar } from 'mastodon/components/avatar';
import { DropdownMenu } from 'mastodon/components/dropdown_menu';
import { Icon } from 'mastodon/components/icon';
import { IconButton } from 'mastodon/components/icon_button';
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
  removeAccount: {
    id: 'account_switcher.remove_account',
    defaultMessage: '@{acct} 제거',
  },
  removeAccountTitle: {
    id: 'account_switcher.remove_account_title',
    defaultMessage: '계정을 제거할까요?',
  },
  removeAccountMessage: {
    id: 'account_switcher.remove_account_message',
    defaultMessage:
      '@{acct} 계정을 다중 계정 전환 목록에서 제거합니다. 이 계정에서 로그아웃되지는 않습니다.',
  },
  removeAccountConfirm: {
    id: 'account_switcher.remove_account_confirm',
    defaultMessage: '제거',
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
      removeAction?: React.MouseEventHandler<HTMLButtonElement>;
      removeLabel?: string;
      removeDisabled?: boolean;
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

  if (item.account) {
    return (
      <li
        className='dropdown-menu__item account-switcher__menu-item account-switcher__menu-item--account'
        key={`${item.text}-${index}`}
      >
        <div className='account-switcher__account-row'>
          <button
            type='button'
            data-index={index}
            onClick={onClick}
            disabled={item.disabled}
            className='account-switcher__account-button'
          >
            <Avatar account={item.account} size={32} />
            <span className='dropdown-menu__item-content'>
              {item.account.display_name || item.account.username}
              <span className='dropdown-menu__item-subtitle'>
                @{item.account.acct}
              </span>
            </span>
            {item.highlighted && <Icon id='check' icon={CheckIcon} />}
          </button>

          {item.removeAction && (
            <button
              type='button'
              className='account-switcher__remove-button'
              title={item.removeLabel ?? item.text}
              aria-label={item.removeLabel ?? item.text}
              onClick={item.removeAction}
              disabled={item.removeDisabled}
            >
              <Icon id='person-remove' icon={PersonRemoveIcon} />
            </button>
          )}
        </div>
      </li>
    );
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
        {item.icon && <Icon icon={item.icon} id={item.iconId ?? item.text} />}
        <span className='dropdown-menu__item-content'>{item.text}</span>
      </button>
    </li>
  );
};

export const AccountSwitcher: React.FC = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const menuId = useId();
  const [state, setState] = useState<AccountSwitcherState | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const [removingAccountId, setRemovingAccountId] = useState<string | null>(
    null,
  );
  const [adding, setAdding] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const handleRemove = useCallback((accountId: string) => {
    setRemovingAccountId(accountId);

    void api(false)
      .delete<AccountSwitcherState>('/auth/account_switcher/remove.json', {
        params: {
          account_id: accountId,
        },
      })
      .then(({ data }) => {
        setState(data);
      })
      .finally(() => {
        setRemovingAccountId(null);
      });
  }, []);

  const handleConfirmRemove = useCallback(
    (account: ApiAccountJSON) => {
      setOpen(false);

      dispatch(
        openModal({
          modalType: 'CONFIRM',
          modalProps: {
            title: intl.formatMessage(messages.removeAccountTitle),
            message: intl.formatMessage(messages.removeAccountMessage, {
              acct: account.acct,
            }),
            confirm: intl.formatMessage(messages.removeAccountConfirm),
            onConfirm: () => {
              handleRemove(account.id);
            },
          },
        }),
      );
    },
    [dispatch, handleRemove, intl],
  );

  const handleLogout = useCallback(() => {
    setLoggingOut(true);

    void api(false)
      .post<RedirectResponse>('/auth/account_switcher/logout.json')
      .then(({ data }) => {
        window.location.assign(data.redirect_to);
      })
      .catch(() => {
        setLoggingOut(false);
      });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        loadAccounts();
      }

      return !wasOpen;
    });
  }, [loadAccounts]);

  const items: AccountSwitcherMenuItem[] = [
    ...(state?.accounts ?? []).map((account) => {
      const current = account.id === state?.current_account_id;
      const busy =
        loadingAccountId !== null ||
        removingAccountId !== null ||
        adding ||
        loggingOut;

      return {
        text: current
          ? intl.formatMessage(messages.current)
          : intl.formatMessage(messages.switchTo, { acct: account.acct }),
        action: () => {
          handleSwitch(account.id);
        },
        account,
        disabled: current || busy,
        highlighted: current,
        removeAction: current
          ? undefined
          : (event: React.MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.stopPropagation();
              handleConfirmRemove(account);
            },
        removeLabel: intl.formatMessage(messages.removeAccount, {
          acct: account.acct,
        }),
        removeDisabled: busy,
      };
    }),
    null,
    {
      text: intl.formatMessage(messages.addAccount),
      action: handleAdd,
      icon: AddIcon,
      iconId: 'plus',
      disabled:
        loadingAccountId !== null ||
        removingAccountId !== null ||
        adding ||
        loggingOut,
    },
    {
      text: intl.formatMessage(messages.logout),
      action: handleLogout,
      icon: LogoutIcon,
      iconId: 'sign-out',
      disabled:
        loadingAccountId !== null ||
        removingAccountId !== null ||
        adding ||
        loggingOut,
    },
  ];

  return (
    <div className='account-switcher'>
      <IconButton
        icon='ellipsis-h'
        iconComponent={MoreHorizIcon}
        title={intl.formatMessage(messages.menu)}
        expanded={open}
        ariaControls={menuId}
        active={open}
        onClick={handleToggle}
      />

      {open && (
        <div className='account-switcher__dropdown' id={menuId}>
          <div className='dropdown-animation dropdown-menu bottom-end'>
            <DropdownMenu
              items={items}
              loading={loading}
              onClose={handleClose}
              openedViaKeyboard={false}
              renderItem={renderMenuItem}
            />
          </div>
        </div>
      )}
    </div>
  );
};
