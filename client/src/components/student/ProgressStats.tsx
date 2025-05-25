import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProgressItem {
  subject: string;
  percentage: number;
  status?: 'success' | 'warning' | 'danger';
}

interface RecentResult {
  id: number;
  title: string;
  correct: number;
  total: number;
  percentage: number;
  type: 'primary' | 'secondary' | 'accent';
}

interface ProgressStatsProps {
  progressItems: ProgressItem[];
  recentResults: RecentResult[];
}

const ProgressStats: React.FC<ProgressStatsProps> = ({ progressItems, recentResults }) => {
  const getProgressColor = (percentage: number, status?: string) => {
    if (status === 'success') return 'bg-secondary';
    if (status === 'warning') return 'bg-accent';
    if (status === 'danger') return 'bg-status-error';
    
    if (percentage >= 80) return 'bg-secondary';
    if (percentage >= 60) return 'bg-primary';
    return 'bg-accent';
  };
  
  const getResultBgColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-blue-50';
      case 'secondary': return 'bg-green-50';
      case 'accent': return 'bg-amber-50';
      default: return 'bg-blue-50';
    }
  };
  
  const getResultIconColor = (type: string) => {
    switch (type) {
      case 'primary': return 'text-primary';
      case 'secondary': return 'text-secondary';
      case 'accent': return 'text-accent';
      default: return 'text-primary';
    }
  };
  
  const getResultIconBgColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-primary';
      case 'secondary': return 'bg-secondary';
      case 'accent': return 'bg-accent';
      default: return 'bg-primary';
    }
  };
  
  return (
    <Card className="bg-white rounded-lg card-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-heading font-medium text-neutral-dark">O'zlashtirish statistikasi</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 mb-6">
          {progressItems.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-neutral-dark">{item.subject}</span>
                <span className="text-sm text-neutral-medium">{item.percentage}%</span>
              </div>
              <div className="w-full bg-neutral-ultralight rounded-full h-2">
                <div 
                  className={`${getProgressColor(item.percentage, item.status)} h-2 rounded-full`} 
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        {recentResults.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-neutral-dark mb-3">So'nggi natijalar</h3>
            <div className="space-y-3">
              {recentResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`flex justify-between items-center p-3 rounded-lg ${getResultBgColor(result.type)}`}
                >
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getResultIconBgColor(result.type)} text-white mr-3`}>
                      <span className="material-icons text-sm">
                        {result.percentage >= 80 ? 'done_all' : 'done'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-dark">{result.title}</p>
                      <p className="text-xs text-neutral-medium">{result.correct}/{result.total} to'g'ri</p>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${getResultIconColor(result.type)}`}>{result.percentage}%</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressStats;
