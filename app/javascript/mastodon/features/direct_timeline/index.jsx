import PropTypes from 'prop-types';
import { useRef, useCallback, useEffect } from 'react';

import { defineMessages, useIntl, FormattedMessage } from 'react-intl';

import { Helmet } from '@unhead/react/helmet';

import { useDispatch } from 'react-redux';

import MailIcon from '@/material-icons/400-24px/mail.svg?react';
import { expandAllConversations } from 'mastodon/actions/all_conversations';
import { addColumn, removeColumn, moveColumn } from 'mastodon/actions/columns';
import { mountConversations, unmountConversations, expandConversations } from 'mastodon/actions/conversations';
import { connectDirectStream } from 'mastodon/actions/streaming';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';

import { ConversationsList } from './components/conversations_list';

const messages = defineMessages({
  title: { id: 'column.direct', defaultMessage: 'Direct messages' },
  allTitle: { id: 'column.all_direct', defaultMessage: 'All DMs' },
});

const DirectTimeline = ({ columnId, multiColumn, allConversations }) => {
  const columnRef = useRef();
  const intl = useIntl();
  const dispatch = useDispatch();
  const pinned = !!columnId;
  const title = intl.formatMessage(allConversations ? messages.allTitle : messages.title);

  const handlePin = useCallback(() => {
    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('DIRECT', {}));
    }
  }, [dispatch, columnId]);

  const handleMove = useCallback((dir) => {
    dispatch(moveColumn(columnId, dir));
  }, [dispatch, columnId]);

  const handleHeaderClick = useCallback(() => {
    columnRef.current.scrollTop();
  }, [columnRef]);

  useEffect(() => {
    if (allConversations) {
      dispatch(expandAllConversations());

      return () => {};
    }

    dispatch(mountConversations());
    dispatch(expandConversations());

    const disconnect = dispatch(connectDirectStream());

    return () => {
      dispatch(unmountConversations());
      disconnect();
    };
  }, [dispatch, allConversations]);

  return (
    <Column bindToDocument={!multiColumn} ref={columnRef} label={title}>
      <ColumnHeader
        icon='mail'
        iconComponent={MailIcon}
        title={title}
        onPin={handlePin}
        onMove={handleMove}
        onClick={handleHeaderClick}
        pinned={pinned}
        multiColumn={multiColumn}
        hideCollapseButton
      />

      <ConversationsList
        storeKey={allConversations ? 'all_conversations' : 'conversations'}
        expandAction={allConversations ? expandAllConversations : expandConversations}
        adminMode={allConversations}
        trackScroll={!pinned}
        scrollKey={`direct_timeline-${columnId}`}
        emptyMessage={<FormattedMessage id='empty_column.direct' defaultMessage="You don't have any direct messages yet. When you send or receive one, it will show up here." />}
        bindToDocument={!multiColumn}
        prepend={<div className='follow_requests-unlocked_explanation direct-timeline__warning'><span><FormattedMessage id='compose_form.encryption_warning' defaultMessage='Posts on Mastodon are not end-to-end encrypted. Do not share any dangerous information over Mastodon.' /> <a href='/terms' target='_blank'><FormattedMessage id='compose_form.direct_message_warning_learn_more' defaultMessage='Learn more' /></a></span></div>}
        alwaysPrepend
      />

      <Helmet>
        <title>{title}</title>
        <meta name='robots' content='noindex' />
      </Helmet>
    </Column>
  );
};

DirectTimeline.propTypes = {
  columnId: PropTypes.string,
  multiColumn: PropTypes.bool,
  allConversations: PropTypes.bool,
};

export default DirectTimeline;
