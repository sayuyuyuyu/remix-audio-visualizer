import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center gap-2',
      'font-medium transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'relative overflow-hidden',
      'rounded-xl'
    ];

    const variants = {
      primary: [
        'bg-gradient-to-r from-indigo-500 to-purple-600',
        'hover:from-indigo-600 hover:to-purple-700',
        'text-white shadow-lg shadow-indigo-500/25',
        'hover:shadow-xl hover:shadow-indigo-500/30',
        'focus-visible:ring-indigo-500',
        'transform hover:scale-105 active:scale-95'
      ],
      secondary: [
        'bg-gradient-to-r from-slate-100 to-slate-200',
        'hover:from-slate-200 hover:to-slate-300',
        'text-slate-800 shadow-sm',
        'focus-visible:ring-slate-500',
        'border border-slate-200'
      ],
      outline: [
        'border-2 border-indigo-200 bg-transparent',
        'hover:bg-indigo-50 hover:border-indigo-300',
        'text-indigo-600',
        'focus-visible:ring-indigo-500'
      ],
      ghost: [
        'bg-transparent hover:bg-slate-100',
        'text-slate-600 hover:text-slate-900',
        'focus-visible:ring-slate-500'
      ],
      danger: [
        'bg-gradient-to-r from-red-500 to-pink-600',
        'hover:from-red-600 hover:to-pink-700',
        'text-white shadow-lg shadow-red-500/25',
        'hover:shadow-xl hover:shadow-red-500/30',
        'focus-visible:ring-red-500',
        'transform hover:scale-105 active:scale-95'
      ]
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* ローディングスピナー */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 通常のコンテンツ */}
        <div className={cn('flex items-center gap-2', isLoading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
