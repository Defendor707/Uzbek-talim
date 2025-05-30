import React from 'react';
import { cn } from '@/lib/utils';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 block">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'mobile-input',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);
MobileInput.displayName = "MobileInput";

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, ...props }, ref) => {
    const variants = {
      primary: 'mobile-button',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200'
    };

    const sizes = {
      sm: 'h-10 px-4 text-sm',
      md: 'h-12 px-6 text-base',
      lg: 'h-14 px-8 text-lg'
    };

    return (
      <button
        className={cn(
          'touch-target rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2',
          variants[variant],
          sizes[size],
          loading && 'pointer-events-none',
          className
        )}
        disabled={loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        )}
        {icon && !loading && <span>{icon}</span>}
        <span>{children}</span>
      </button>
    );
  }
);
MobileButton.displayName = "MobileButton";

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  pressable?: boolean;
}

export const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
  ({ className, pressable, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'mobile-card',
          pressable && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
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
MobileCard.displayName = "MobileCard";

interface MobileListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  pressable?: boolean;
}

export const MobileListItem = React.forwardRef<HTMLDivElement, MobileListItemProps>(
  ({ className, title, subtitle, icon, action, pressable, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-center p-4 border-b border-gray-100 last:border-b-0 transition-all duration-200',
          pressable && 'cursor-pointer hover:bg-gray-50 active:bg-gray-100',
          className
        )}
        ref={ref}
        {...props}
      >
        {icon && (
          <div className="mr-3 text-gray-500">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="ml-3">
            {action}
          </div>
        )}
      </div>
    );
  }
);
MobileListItem.displayName = "MobileListItem";