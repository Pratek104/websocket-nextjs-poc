"use client";

import React from 'react';
import { cn } from '@/lib/utils';

const styles = {
  switch: `relative block cursor-pointer h-10 w-[60px]
    [--c-active:#8B5CF6]
    [--c-success:#8B5CF6]
    [--c-warning:#F59E0B]
    [--c-danger:#EF4444]
    [--c-active-inner:#FFFFFF]
    [--c-default:#4C1D95]
    [--c-default-dark:#5B21B6]
    [--c-black:#1B1B22]
    [transform:translateZ(0)]
    [-webkit-transform:translateZ(0)]
    [backface-visibility:hidden]
    [-webkit-backface-visibility:hidden]
    [perspective:1000]
    [-webkit-perspective:1000]
    shadow-lg transition-all duration-500`,
  input: `h-full w-full cursor-pointer appearance-none rounded-full
    bg-[--c-default] outline-none transition-all duration-500
    hover:bg-[--c-default-dark]
    [transform:translate3d(0,0,0)]
    [-webkit-transform:translate3d(0,0,0)]
    data-[checked=true]:bg-[--c-background]
    border-2 border-purple-700
    data-[checked=true]:border-purple-400`,
  svg: `pointer-events-none absolute inset-0 fill-white
    [transform:translate3d(0,0,0)]
    [-webkit-transform:translate3d(0,0,0)]
    drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]`,
  circle: `transform-gpu transition-transform duration-500
    [transform:translate3d(0,0,0)]
    [-webkit-transform:translate3d(0,0,0)]
    [backface-visibility:hidden]
    [-webkit-backface-visibility:hidden]`,
  dropCircle: `transform-gpu transition-transform duration-700
    [transform:translate3d(0,0,0)]
    [-webkit-transform:translate3d(0,0,0)]`
};

const variantStyles = {
  default: '[--c-background:var(--c-active)]',
  success: '[--c-background:var(--c-success)]',
  warning: '[--c-background:var(--c-warning)]',
  danger: '[--c-background:var(--c-danger)]',
};

interface ToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
}

export function Toggle({ 
  checked = false, 
  onCheckedChange, 
  className,
  variant = 'default',
  disabled = false
}: ToggleProps) {
  const [isChecked, setIsChecked] = React.useState(checked);

  React.useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setIsChecked(e.target.checked);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <label className={cn(styles.switch, disabled && 'opacity-50 cursor-not-allowed', className)}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        data-checked={isChecked}
        disabled={disabled}
        className={cn(styles.input, variantStyles[variant], disabled && 'cursor-not-allowed')}
      />
      <svg
        viewBox="0 0 60 40"
        filter="url(#goo)"
        className={styles.svg}
      >
        <circle
          className={styles.circle}
          cx="20"
          cy="20"
          r="12"
          style={{
            transformOrigin: '20px 20px',
            transform: `translateX(${isChecked ? '14px' : '0px'}) scale(${isChecked ? '0' : '1'})`,
          }}
        />
        <circle
          className={styles.circle}
          cx="40"
          cy="20"
          r="12"
          style={{
            transformOrigin: '40px 20px',
            transform: `translateX(${isChecked ? '0px' : '-14px'}) scale(${isChecked ? '1' : '0'})`,
          }}
        />
        {isChecked && (
          <circle
            className={styles.dropCircle}
            cx="39"
            cy="2"
            r="3"
          />
        )}
      </svg>
    </label>
  );
}

export function GooeyFilter() {
  return (
    <svg className="fixed w-0 h-0">
      <defs>
        <filter id="goo">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="2"
            result="blur"
          />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feComposite
            in="SourceGraphic"
            in2="goo"
            operator="atop"
          />
        </filter>
      </defs>
    </svg>
  );
}
