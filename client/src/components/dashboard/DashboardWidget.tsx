import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
}

interface DashboardWidgetProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: string;
  actions?: QuickAction[];
  badge?: string | number;
  children?: React.ReactNode;
  className?: string;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradient = 'from-blue-500 to-blue-600',
  actions = [],
  badge,
  children,
  className = ''
}) => {
  return (
    <Card className={`transition-all duration-300 hover:shadow-lg border-0 ${className}`}>
      <CardHeader className={`${gradient ? `bg-gradient-to-r ${gradient} text-white` : ''} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="w-8 h-8 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className={`text-sm font-medium ${gradient ? 'text-white' : 'text-gray-900'}`}>
                {title}
                {badge && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-xs">
                    {badge}
                  </Badge>
                )}
              </CardTitle>
              {subtitle && (
                <p className={`text-xs ${gradient ? 'text-white/80' : 'text-gray-600'} mt-1`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {value !== undefined && (
            <div className={`text-right ${gradient ? 'text-white' : 'text-gray-900'}`}>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          )}
        </div>
      </CardHeader>
      
      {(children || actions.length > 0) && (
        <CardContent className="p-4">
          {children}
          
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {actions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button 
                    variant={action.variant || 'outline'} 
                    size="sm"
                    className="flex items-center space-x-2 text-xs"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default DashboardWidget;