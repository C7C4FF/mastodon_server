import { FormattedMessage } from 'react-intl';

import { domain } from 'mastodon/initial_state';

export const SignInBanner: React.FC = () => {
  return (
    <div className='sign-in-banner'>
      <div className='server-banner__introduction'>
        <FormattedMessage
          id='server_banner.c7c4ff_commissioned'
          defaultMessage='{domain}은 C7C4FF 커미션으로 설치된 비공개 서버입니다.'
          values={{ domain: <strong>{domain}</strong> }}
        />
      </div>
    </div>
  );
};
