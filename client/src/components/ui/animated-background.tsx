import React from 'react';

interface AnimatedBackgroundProps {
  variant?: 'aurora' | 'mesh' | 'ocean' | 'sunset' | 'forest';
  className?: string;
  children?: React.ReactNode;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  variant = 'aurora', 
  className = '',
  children 
}) => {
  const getBackgroundClass = () => {
    switch (variant) {
      case 'aurora':
        return 'gradient-aurora';
      case 'mesh':
        return 'mesh-gradient';
      case 'ocean':
        return 'gradient-ocean';
      case 'sunset':
        return 'gradient-sunset';
      case 'forest':
        return 'gradient-forest';
      default:
        return 'gradient-aurora';
    }
  };

  return (
    <div className={`relative min-h-screen ${getBackgroundClass()} ${className}`}>
      <div className="absolute inset-0 particles opacity-20"></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};