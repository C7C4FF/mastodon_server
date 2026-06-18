import { useCallback, useEffect, useState, forwardRef } from 'react';

import classNames from 'classnames';

import { usePrevious } from '../hooks/usePrevious';

import {
  ANIMATED_NUMBER_DURATION,
  AnimatedNumber,
} from './animated_number';
import type { IconProp } from './icon';
import { Icon } from './icon';

interface Props {
  className?: string;
  title: string;
  icon: string;
  iconComponent: IconProp;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  active?: boolean;
  expanded?: boolean;
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
  disabled?: boolean;
  inverted?: boolean;
  animate?: boolean;
  overlay?: boolean;
  tabIndex?: number;
  counter?: number;
  reserveCounterSpace?: boolean;
  href?: string;
  ariaHidden?: boolean;
  ariaControls?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  (
    {
      className,
      expanded,
      icon,
      iconComponent,
      inverted,
      title,
      counter,
      reserveCounterSpace,
      href,
      style,
      activeStyle,
      onClick,
      onKeyDown,
      onMouseDown,
      active = false,
      disabled = false,
      animate = false,
      overlay = false,
      tabIndex = 0,
      ariaHidden = false,
      ariaControls,
    },
    buttonRef,
  ) => {
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = useCallback(
      (e) => {
        e.preventDefault();

        if (!disabled) {
          onClick?.(e);
        }
      },
      [disabled, onClick],
    );

    const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> =
      useCallback(
        (e) => {
          if (!disabled) {
            onMouseDown?.(e);
          }
        },
        [disabled, onMouseDown],
      );

    const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> =
      useCallback(
        (e) => {
          if (!disabled) {
            onKeyDown?.(e);
          }
        },
        [disabled, onKeyDown],
      );

    const buttonStyle = {
      ...style,
      ...(active ? activeStyle : {}),
    };

    const previousActive = usePrevious(active) ?? active;
    const shouldAnimate = animate && active !== previousActive;
    const [
      { currentCounter, exitingCounter, enteringCounter, counterAnimationFrom },
      setCounterState,
    ] = useState<{
      currentCounter: number | undefined;
      exitingCounter: number | undefined;
      enteringCounter: boolean;
      counterAnimationFrom: number | undefined;
    }>(() => ({
      currentCounter: counter,
      exitingCounter: undefined,
      enteringCounter: false,
      counterAnimationFrom: undefined,
    }));

    let counterLeaving = exitingCounter;
    let counterEntering = enteringCounter;
    let counterFrom = counterAnimationFrom;

    if (counter !== currentCounter) {
      counterEntering =
        typeof currentCounter === 'undefined' && typeof counter !== 'undefined';
      counterLeaving =
        typeof counter === 'undefined' ? currentCounter : undefined;
      counterFrom =
        typeof counter === 'undefined' ? currentCounter : currentCounter ?? 0;

      setCounterState({
        currentCounter: counter,
        exitingCounter: counterLeaving,
        enteringCounter: counterEntering,
        counterAnimationFrom: counterFrom,
      });
    }

    const isCounterExiting =
      typeof counter === 'undefined' && typeof counterLeaving !== 'undefined';
    const isCounterRendered =
      typeof counter !== 'undefined' || typeof counterLeaving !== 'undefined';

    useEffect(() => {
      if (!isCounterExiting) {
        return undefined;
      }

      const timeout = window.setTimeout(() => {
        setCounterState((state) => {
          if (
            typeof state.currentCounter === 'undefined' &&
            state.exitingCounter === counterLeaving
          ) {
            return {
              ...state,
              exitingCounter: undefined,
              enteringCounter: false,
              counterAnimationFrom: undefined,
            };
          }

          return state;
        });
      }, ANIMATED_NUMBER_DURATION);

      return () => {
        window.clearTimeout(timeout);
      };
    }, [counterLeaving, isCounterExiting]);

    const classes = classNames(className, 'icon-button', {
      active,
      disabled,
      inverted,
      activate: shouldAnimate && active,
      deactivate: shouldAnimate && !active,
      overlayed: overlay,
      'icon-button--with-counter': isCounterRendered,
      'icon-button--reserve-counter-space': reserveCounterSpace,
    });

    let contents = (
      <>
        <span className='icon-button__icon'>
          <Icon id={icon} icon={iconComponent} aria-hidden='true' />
        </span>
        {isCounterRendered ? (
          <span className='icon-button__counter'>
            <AnimatedNumber
              value={counter ?? 0}
              hideZero={isCounterExiting}
              hidePreviousZero={counterEntering}
              initialPreviousValue={counterFrom}
            />
          </span>
        ) : reserveCounterSpace ? (
          <span className='icon-button__counter icon-button__counter--placeholder' aria-hidden='true' />
        ) : null}
      </>
    );

    if (href != null) {
      contents = (
        <a href={href} target='_blank' rel='noopener noreferrer'>
          {contents}
        </a>
      );
    }

    return (
      <button
        type='button'
        aria-label={title}
        aria-expanded={expanded}
        aria-hidden={ariaHidden}
        aria-controls={ariaControls}
        title={title}
        className={classes}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        style={buttonStyle}
        tabIndex={tabIndex}
        disabled={disabled}
        ref={buttonRef}
      >
        {contents}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
