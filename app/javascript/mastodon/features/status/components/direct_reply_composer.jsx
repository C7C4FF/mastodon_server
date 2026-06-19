import { useCallback, useMemo, useState } from 'react';

import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import ImmutablePropTypes from 'react-immutable-proptypes';
import { useDispatch } from 'react-redux';

import { showAlertForError } from 'mastodon/actions/alerts';
import { importFetchedStatus } from 'mastodon/actions/importer';
import { fetchStatus } from 'mastodon/actions/statuses';
import api from 'mastodon/api';
import { useIdentity } from 'mastodon/identity_context';

const messages = defineMessages({
  placeholder: { id: 'direct_reply.placeholder', defaultMessage: 'Write a message' },
  send: { id: 'direct_reply.send', defaultMessage: 'Send' },
});

const getMentionAcct = mention => mention.get('acct') || mention.get('username');

export const DirectReplyComposer = ({ status }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { accountId } = useIdentity();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recipients = useMemo(() => {
    const seen = new Set();
    const result = [];

    const add = (id, acct) => {
      if (!acct || id === accountId || seen.has(acct)) {
        return;
      }

      seen.add(acct);
      result.push({ id, acct });
    };

    add(status.getIn(['account', 'id']), status.getIn(['account', 'acct']));

    status.get('mentions')?.forEach(mention => {
      add(mention.get('id'), getMentionAcct(mention));
    });

    return result;
  }, [accountId, status]);

  const handleChange = useCallback(e => {
    setText(e.target.value);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();

    if (!trimmed || isSubmitting) {
      return;
    }

    const mentionPrefix = recipients.map(({ acct }) => `@${acct}`).join(' ');
    const body = mentionPrefix ? `${mentionPrefix} ${trimmed}` : trimmed;

    setIsSubmitting(true);

    api().post('/api/v1/statuses', {
      status: body,
      visibility: 'direct',
      in_reply_to_id: status.get('id'),
      quote_approval_policy: 'nobody',
      allowed_mentions: recipients.map(({ id }) => id).filter(Boolean),
    }).then(response => {
      dispatch(importFetchedStatus(response.data));
      dispatch(fetchStatus(status.get('id'), { forceFetch: true }));
      setText('');
    }).catch(error => {
      dispatch(showAlertForError(error));
    }).finally(() => {
      setIsSubmitting(false);
    });
  }, [dispatch, isSubmitting, recipients, status, text]);

  const handleKeyDown = useCallback(e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className='direct-reply-composer'>
      <textarea
        className='direct-reply-composer__textarea'
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={intl.formatMessage(messages.placeholder)}
        rows={1}
      />

      <button
        className='direct-reply-composer__button'
        type='button'
        disabled={text.trim().length === 0 || isSubmitting}
        onClick={handleSubmit}
      >
        {intl.formatMessage(messages.send)}
      </button>
    </div>
  );
};

DirectReplyComposer.propTypes = {
  status: ImmutablePropTypes.map.isRequired,
};
