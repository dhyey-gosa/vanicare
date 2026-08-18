import React from 'react';
import { controlClass } from './Field';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ className = '', invalid, children, ...props }: SelectProps) {
  return (
    <select
      className={`${controlClass} pr-9 ${invalid ? 'border-rose-300' : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...props}>
      
      {children}
    </select>);

}