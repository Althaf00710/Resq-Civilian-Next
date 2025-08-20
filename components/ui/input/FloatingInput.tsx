'use client';

import React from 'react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  textarea?: boolean;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, id, type = 'text', className = '', textarea = false, ...props }, ref) => {
    return (
      <div className="relative">
        {textarea ? (
          <textarea
            id={id}
            placeholder=" "
            className={`
              peer p-4 block w-full border-gray-200 rounded-xl sm:text-sm placeholder:text-transparent bg-gray-100
              focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none
              dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:focus:ring-neutral-600
              focus:pt-6 focus:pb-2 not-placeholder-shown:pt-6 not-placeholder-shown:pb-2
              ${className}
            `}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={id}
            type={type}
            placeholder=" "
            ref={ref}
            className={`
              peer p-4 block w-full border-gray-200 rounded-full sm:text-sm placeholder:text-transparent bg-gray-200
              focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none
              dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:focus:ring-neutral-600
              focus:pt-6 focus:pb-2 not-placeholder-shown:pt-6 not-placeholder-shown:pb-2
              autofill:pt-6 autofill:pb-2 
              ${className}
            `}
            {...props}
          />
        )}

        <label
          htmlFor={id}
          className={`
            absolute top-0 start-0 p-4 h-full sm:text-sm truncate pointer-events-none transition ease-in-out duration-100 text-gray-500
            border border-transparent origin-[0_0] dark:text-white peer-disabled:opacity-50 peer-disabled:pointer-events-none
            peer-focus:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:text-gray-500 dark:peer-focus:text-neutral-500
            peer-not-placeholder-shown:scale-90 peer-not-placeholder-shown:translate-x-0.5 peer-not-placeholder-shown:-translate-y-1.5
            peer-not-placeholder-shown:text-gray-500 dark:peer-not-placeholder-shown:text-neutral-500 dark:text-neutral-500 ${className}
          `}
        >
          {label}
        </label>
      </div>
    );
  }
);


FloatingInput.displayName = 'FloatingInput';

export default FloatingInput;
