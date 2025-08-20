'use client';

import React, { useEffect, useState } from 'react';
import { Check, X, User } from 'lucide-react';
import FloatingInput from './FloatingInput';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  isValid?: boolean | null;
  onDebouncedChange?: (value: string) => void;
  debounceDelay?: number;
  LeftIcon?: React.ReactNode;
  textarea?: boolean;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  isValid = null,
  onDebouncedChange,
  debounceDelay = 500,
  LeftIcon ,
  className = '',
  textarea = false,
  ...props
}) => {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [value, debounceDelay]);

  useEffect(() => {
    if (onDebouncedChange) onDebouncedChange(debouncedValue);
  }, [debouncedValue, onDebouncedChange]);

  const borderColor = isValid === true
    ? 'border-green-500'
    : isValid === false
    ? 'border-red-500'
    : 'border-gray-200 dark:border-neutral-700';

  const endIcon = isValid === true ? (
    <Check className="text-green-500 w-5 h-5" />
  ) : isValid === false ? (
    <X className="text-red-500 w-5 h-5" />
  ) : null;

  return (
    <div className="relative w-full">
      {/* Left Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
        {LeftIcon}
      </div>

      {/* Right Icon */}
      {endIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
          {endIcon}
        </div>
      )}

      <FloatingInput
        label={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`pr-10 ${borderColor} ${className}`}
        textarea={textarea}
        {...props}
      />
    </div>
  );
};

export default ValidatedInput;
