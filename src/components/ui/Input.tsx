import React from 'react';
import { controlClass } from './Field';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className = '', invalid, ...props }: InputProps) {
  return (
    <input
      className={`${controlClass} ${invalid ? 'border-rose-300' : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...props} />);


}