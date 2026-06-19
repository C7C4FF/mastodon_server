import { useLayoutEffect, useState } from 'react';

import { animated, useSpring, config } from '@react-spring/web';

import { reduceMotion } from '../initial_state';

import { ShortNumber } from './short_number';

export const ANIMATED_NUMBER_DURATION = 200;

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
  const hasInitialAnimation =
    typeof initialPreviousValue !== 'undefined' &&
    initialPreviousValue !== value &&
    previousValue === initialPreviousValue;
  const shouldHideValue = hideZero && value === 0;
  const shouldHidePreviousValue = hidePreviousZero && previousValue === 0;

  const [styles, api] = useSpring(() => ({
    transform: hasInitialAnimation
      ? `translateY(${100 * direction}%)`
      : 'translateY(0%)',
    config: { ...config.gentle, duration: ANIMATED_NUMBER_DURATION },
    immediate: true,
  }));

  useLayoutEffect(() => {
    if (!isAnimating) {
      return undefined;
    }

    void api.start({
      from: { transform: `translateY(${100 * direction}%)` },
      to: { transform: 'translateY(0%)' },
      reset: true,
      immediate: false,
      onRest() {
        setPreviousValue(value);
        setIsAnimating(false);
      },
    });

    const timeout = window.setTimeout(() => {
      setPreviousValue(value);
    }, ANIMATED_NUMBER_DURATION + 50);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [api, direction, isAnimating, value]);

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
