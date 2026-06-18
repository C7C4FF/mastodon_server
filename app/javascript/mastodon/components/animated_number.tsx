import { useLayoutEffect, useState } from 'react';

import { animated, useSpring, config } from '@react-spring/web';

import { reduceMotion } from '../initial_state';

import { ShortNumber } from './short_number';

interface Props {
  value: number;
  hideZero?: boolean;
  hidePreviousZero?: boolean;
  initialPreviousValue?: number;
}
export const AnimatedNumber: React.FC<Props> = ({
  value,
  hideZero = false,
  hidePreviousZero = false,
  initialPreviousValue,
}) => {
  const [previousValue, setPreviousValue] = useState(
    initialPreviousValue ?? value,
  );
  const direction = value > previousValue ? -1 : 1;
  const isAnimating = value !== previousValue;
  const shouldHideValue = hideZero && value === 0;
  const shouldHidePreviousValue = hidePreviousZero && previousValue === 0;

  const [styles, api] = useSpring(() => ({
    transform: 'translateY(0%)',
    config: { ...config.gentle, duration: 200 },
    immediate: true,
  }));

  useLayoutEffect(() => {
    if (value !== previousValue) {
      void api.start({
        from: { transform: `translateY(${100 * direction}%)` },
        to: { transform: 'translateY(0%)' },
        reset: true,
        immediate: false,
        onRest() {
          setPreviousValue(value);
        },
      });
    }
  }, [api, direction, previousValue, value]);

  if (reduceMotion || !isAnimating) {
    return shouldHideValue ? null : <ShortNumber value={value} />;
  }

  return (
    <span className='animated-number'>
      <animated.span
        className='animated-number__current'
        style={{
          ...styles,
          visibility: shouldHideValue ? 'hidden' : undefined,
        }}
      >
        <ShortNumber value={shouldHideValue ? previousValue : value} />
      </animated.span>
      {value !== previousValue && (
        <animated.span
          className='animated-number__previous'
          style={{
            ...styles,
            top: `${-100 * direction}%`, // Adds extra space on top of translateY
          }}
          role='presentation'
          aria-hidden={shouldHidePreviousValue}
        >
          {shouldHidePreviousValue ? null : (
            <ShortNumber value={previousValue} />
          )}
        </animated.span>
      )}
    </span>
  );
};
