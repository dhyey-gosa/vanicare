import React from 'react';
import { controlClass } from './Field';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className = '', invalid, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`${controlClass} resize-y leading-relaxed ${invalid ? 'border-rose-300' : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...props} />);


}