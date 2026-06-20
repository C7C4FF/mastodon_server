import classNames from 'classnames';

import logo from '@/images/c7c4ff_logo_icon.png';

export const WordmarkLogo: React.FC = () => (
  <img
    src={logo}
    alt='C7C4FF'
    className='logo logo--wordmark logo--c7c4ff'
  />
);

export const IconLogo: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={logo}
    alt='C7C4FF'
    className={classNames('logo logo--icon logo--c7c4ff', className)}
  />
);

export const SymbolLogo: React.FC = () => (
  <img src={logo} alt='C7C4FF' className='logo logo--icon logo--c7c4ff' />
);
