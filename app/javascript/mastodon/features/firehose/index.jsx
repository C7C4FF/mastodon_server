import PropTypes from 'prop-types';
import { useRef, useCallback, useEffect } from 'react';

import { useIntl, defineMessages, FormattedMessage } from 'react-intl';

import { Helmet } from '@unhead/react/helmet';

import { useIdentity } from '@/mastodon/identity_context';
import PublicIcon from '@/material-icons/400-24px/public.svg?react';
import { addColumn } from 'mastodon/actions/columns';
import { changeSetting } from 'mastodon/actions/settings';
import { connectCommunityStream } from 'mastodon/actions/streaming';
import { expandCommunityTimeline } from 'mastodon/actions/timelines';
import { DismissableBanner } from 'mastodon/components/dismissable_banner';
import { localLiveFeedAccess, domain } from 'mastodon/initial_state';
import { canViewFeed } from 'mastodon/permissions';
import { useAppDispatch, useAppSelector } from 'mastodon/store';

import Column from '../../components/column';
import ColumnHeader from '../../components/column_header';
import SettingToggle from '../notifications/components/setting_toggle';
import StatusListContainer from '../ui/containers/status_list_container';

const messages = defineMessages({
  title: { id: 'column.firehose', defaultMessage: 'Local timeline' },
});

const ColumnSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.getIn(['settings', 'firehose']));
  const onChange = useCallback(
    (key, checked) => dispatch(changeSetting(['firehose', ...key], checked)),
    [dispatch],
  );

  return (
    <div className='column-settings'>
      <section>
        <div className='column-settings__row'>
          <SettingToggle
            settings={settings}
            settingPath={['onlyMedia']}
            onChange={onChange}
            label={<FormattedMessage id='community.column_settings.media_only' defaultMessage='Media only' />}
          />
        </div>
      </section>
    </div>
  );
};

const Firehose = ({ multiColumn }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const { signedIn, permissions } = useIdentity();
  const columnRef = useRef(null);
  const feedType = 'community';

  const onlyMedia = useAppSelector((state) => state.getIn(['settings', 'firehose', 'onlyMedia'], false));
  const hasUnread = useAppSelector((state) => state.getIn(['timelines', `${feedType}${onlyMedia ? ':media' : ''}`, 'unread'], 0) > 0);

  const handlePin = useCallback(
    () => {
      dispatch(addColumn('COMMUNITY', { other: { onlyMedia } }));
    },
    [dispatch, onlyMedia],
  );

  const handleLoadMore = useCallback(
    (maxId) => {
      dispatch(expandCommunityTimeline({ maxId, onlyMedia }));
    },
    [dispatch, onlyMedia],
  );

  const handleHeaderClick = useCallback(() => columnRef.current?.scrollTop(), []);

  useEffect(() => {
    let disconnect;

    dispatch(expandCommunityTimeline({ onlyMedia }));
    if (signedIn) {
      disconnect = dispatch(connectCommunityStream({ onlyMedia }));
    }

    return () => disconnect?.();
  }, [dispatch, signedIn, onlyMedia]);

  const prependBanner = (
    <DismissableBanner id='community_timeline'>
      <FormattedMessage
        id='dismissable_banner.community_timeline'
        defaultMessage='These are the most recent public posts from people whose accounts are hosted by {domain}.'
        values={{ domain }}
      />
    </DismissableBanner>
  );

  const emptyMessage = (
    <FormattedMessage
      id='empty_column.community'
      defaultMessage='The local timeline is empty. Write something publicly to get the ball rolling!'
    />
  );

  const canViewSelectedFeed = canViewFeed(signedIn, permissions, localLiveFeedAccess);

  const disabledTimelineMessage = (
    <FormattedMessage
      id='empty_column.disabled_feed'
      defaultMessage='This feed has been disabled by your server administrators.'
    />
  );

  return (
    <Column bindToDocument={!multiColumn} ref={columnRef} label={intl.formatMessage(messages.title)}>
      <ColumnHeader
        icon='globe'
        iconComponent={PublicIcon}
        active={hasUnread}
        title={intl.formatMessage(messages.title)}
        onPin={handlePin}
        onClick={handleHeaderClick}
        multiColumn={multiColumn}
      >
        <ColumnSettings />
      </ColumnHeader>

      <StatusListContainer
        prepend={prependBanner}
        timelineId={`${feedType}${onlyMedia ? ':media' : ''}`}
        onLoadMore={handleLoadMore}
        trackScroll
        scrollKey='firehose'
        emptyMessage={canViewSelectedFeed ? emptyMessage : disabledTimelineMessage}
        bindToDocument={!multiColumn}
      />

      <Helmet>
        <title>{intl.formatMessage(messages.title)}</title>
        <meta name='robots' content='noindex' />
      </Helmet>
    </Column>
  );
};

Firehose.propTypes = {
  multiColumn: PropTypes.bool,
};

export default Firehose;
