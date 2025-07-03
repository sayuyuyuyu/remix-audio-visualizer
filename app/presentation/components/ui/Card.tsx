import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseClasses = [
      'rounded-2xl transition-all duration-200',
      'border border-white/10'
    ];

    const variants = {
      default: [
        'bg-white/60 backdrop-blur-lg',
        'shadow-xl shadow-slate-900/5',
        'ring-1 ring-slate-200/50'
      ],
      glass: [
        'bg-white/20 backdrop-blur-xl',
        'shadow-2xl shadow-slate-900/10',
        'ring-1 ring-white/20',
        'border-white/20'
      ],
      elevated: [
        'bg-white',
        'shadow-2xl shadow-slate-900/10',
        'ring-1 ring-slate-200/50',
        'hover:shadow-3xl hover:scale-[1.02]'
      ],
      outline: [
        'bg-transparent border-2',
        'border-slate-200 hover:border-slate-300',
        'hover:bg-slate-50/50'
      ]
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12'
    };

    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
