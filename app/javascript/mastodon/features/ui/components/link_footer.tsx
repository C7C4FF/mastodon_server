import { FormattedMessage } from 'react-intl';

import { Link } from 'react-router-dom';

import { domain } from 'mastodon/initial_state';

import classes from './link_footer.module.scss';

const COMMISSION_URL = 'https://crepe.cm/ko/@yBlrMdSz/x8j0ttu';
const SOURCE_CODE_URL = 'https://github.com/C7C4FF/mastodon_server';
const AGPL_URL = 'https://www.gnu.org/licenses/agpl-3.0.html';
const MASTODON_URL = 'https://joinmastodon.org';
const MASTODON_VERSION = '4.6.0';

export const LinkFooter: React.FC<{
  context?: 'default' | 'multi-column' | 'about';
}> = ({ context = 'default' }) => {
  const multiColumn = context === 'multi-column';

  return (
    <footer className={classes.wrapper} data-context={context}>
      <section>
        <h2 className={classes.heading}>{`${domain}:`}</h2>
        <ul className={classes.list}>
          <li>
            <Link
              to='/privacy-policy'
              target={multiColumn ? '_blank' : undefined}
              rel='privacy-policy'
            >
              <FormattedMessage
                id='footer.privacy_policy'
                defaultMessage='Privacy policy'
              />
            </Link>
          </li>
        </ul>
      </section>
      <section>
        <h2 className={classes.heading}>C7C4FF:</h2>
        <ul className={classes.list}>
          <li>
            <a href={COMMISSION_URL} target='_blank' rel='noopener'>
              C7C4FF의 커미션 페이지
            </a>
          </li>
          <li>
            <a href={SOURCE_CODE_URL} target='_blank' rel='noopener'>
              <FormattedMessage
                id='footer.source_code'
                defaultMessage='View source code'
              />
            </a>
          </li>
          <li>
            <a href={AGPL_URL} target='_blank' rel='license noopener'>
              AGPL-3.0
            </a>
          </li>
        </ul>
      </section>
      <section>
        <ul className={classes.list}>
          <li>
            <a href={MASTODON_URL} target='_blank' rel='noopener'>
              Powered by Mastodon
            </a>
          </li>
          <li className={classes.version}>v{MASTODON_VERSION}</li>
        </ul>
      </section>
    </footer>
  );
};
