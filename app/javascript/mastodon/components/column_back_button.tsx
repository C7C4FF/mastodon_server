import { useCallback } from 'react';

import { FormattedMessage, useIntl } from 'react-intl';
import type { MessageDescriptor } from 'react-intl';

import classNames from 'classnames';
import ArrowBackIcon from '@/material-icons/400-24px/arrow_back.svg?react';
import { Icon } from 'mastodon/components/icon';
import { getColumnSkipLinkId } from 'mastodon/features/ui/components/skip_links';
import { ButtonInTabsBar } from 'mastodon/features/ui/util/columns_context';

import { useColumnIndexContext } from '../features/ui/components/columns_area';

import { useAppHistory } from './router';

type OnClickCallback = () => void;

interface Props {
  onClick?: OnClickCallback;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  onTitleClick?: OnClickCallback;
  backLabel?: MessageDescriptor;
}

function useHandleClick(onClick?: OnClickCallback) {
  const history = useAppHistory();

  return useCallback(() => {
    if (onClick) {
      onClick();
    } else if (history.location.state?.fromMastodon) {
      history.goBack();
    } else {
      history.push('/');
    }
  }, [history, onClick]);
}

export const ColumnBackButton: React.FC<Props> = ({
  onClick,
  title,
  subtitle,
  onTitleClick,
  backLabel,
}) => {
  const intl = useIntl();
  const handleClick = useHandleClick(onClick);
  const columnIndex = useColumnIndexContext();
  const hasTitle = Boolean(title);
  const label = backLabel ?? {
    id: 'column_back_button.label',
    defaultMessage: 'Back',
  };

  const component = hasTitle ? (
    <div className='column-back-button column-back-button--with-title'>
      <button
        onClick={handleClick}
        id={getColumnSkipLinkId(columnIndex)}
        className='column-back-button__back'
        type='button'
        aria-label={intl.formatMessage(label)}
      >
        <Icon
          id='chevron-left'
          icon={ArrowBackIcon}
          className='column-back-button__icon'
        />
        <span className='sr-only'>
          <FormattedMessage {...label} />
        </span>
      </button>

      <button
        onClick={onTitleClick}
        className='column-back-button__account-title'
        type='button'
      >
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </button>
    </div>
  ) : (
    <button
      onClick={handleClick}
      id={getColumnSkipLinkId(columnIndex)}
      className='column-back-button'
      type='button'
    >
      <Icon
        id='chevron-left'
        icon={ArrowBackIcon}
        className='column-back-button__icon'
      />
      <FormattedMessage {...label} />
    </button>
  );

  return <ButtonInTabsBar>{component}</ButtonInTabsBar>;
};
