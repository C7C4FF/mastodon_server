import { useEffect, useState } from 'react';

import { animated, useSpring, config } from '@react-spring/web';

import { reduceMotion } from '../initial_state';

import { ShortNumber } from './short_number';

interface Props {
  value: number;
}
export const AnimatedNumber: React.FC<Props> = ({ value }) => {
  const [previousValue, setPreviousValue] = useState(value);
  const [hasMounted, setHasMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const direction = value > previousValue ? -1 : 1;

  const [styles, api] = useSpring(
    () => ({
      from: { transform: `translateY(${100 * direction}%)` },
      to: { transform: 'translateY(0%)' },
      onRest() {
        setPreviousValue(value);
        setIsAnimating(false);
      },
      config: { ...config.gentle, duration: 200 },
      immediate: true, // This ensures that the animation is not played when the component is first rendered
    }),
    [value, previousValue],
  );

  // When the value changes, start the animation
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (value !== previousValue) {
      setIsAnimating(true);
      void api.start({ reset: true });
    }
  }, [api, previousValue, value]);

  if (reduceMotion || !hasMounted || !isAnimating) {
    return <ShortNumber value={value} />;
  }

  return (
    <span className='animated-number'>
      <animated.span style={styles}>
        <ShortNumber value={value} />
      </animated.span>
      {value !== previousValue && (
        <animated.span
          style={{
            ...styles,
            position: 'absolute',
            top: `${-100 * direction}%`, // Adds extra space on top of translateY
          }}
          role='presentation'
        >
          <ShortNumber value={previousValue} />
        </animated.span>
      )}
    </span>
  );
};
