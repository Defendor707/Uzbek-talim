import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor?: string;
  trend?: {
    value: string | number;
    label: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  progressValue?: number;
  progressColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor = 'text-primary',
  trend,
  progressValue = 0,
  progressColor = 'bg-primary',
}) => {
  return (
    <div className="bg-white p-6 rounded-lg card-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${iconBgColor} mr-4`}>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
        <div>
          <p className="text-sm text-neutral-medium">{title}</p>
          <p className="text-2xl font-bold text-neutral-dark">{value}</p>
        </div>
      </div>
      
      {trend && (
        <div className="mt-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-medium">{trend.label}</span>
            <span className={`text-xs flex items-center ${
              trend.isNeutral 
                ? 'text-status-warning' 
                : trend.isPositive 
                  ? 'text-status-success' 
                  : 'text-status-error'
            }`}>
              <span className="material-icons text-xs mr-1">
                {trend.isNeutral 
                  ? 'remove' 
                  : trend.isPositive 
                    ? 'arrow_upward' 
                    : 'arrow_downward'}
              </span>
              {trend.value}
            </span>
          </div>
          <div className="w-full bg-neutral-ultralight rounded-full h-1 mt-2">
            <div 
              className={`${progressColor} h-1 rounded-full`} 
              style={{ width: `${Math.min(Math.max(progressValue, 0), 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StatsRowProps {
  stats: StatsCardProps[];
}

const StatsRow: React.FC<StatsRowProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsRow;
