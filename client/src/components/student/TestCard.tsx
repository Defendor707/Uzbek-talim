import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface TestCardProps {
  id: number;
  title: string;
  subject?: string;
  grade: string;
  classroom?: string;
  teacherName?: string;
  questionCount: number;
  duration: number;
  daysLeft?: number;
  isActive: boolean;
  onStartTest: (id: number) => void;
}

const TestCard: React.FC<TestCardProps> = ({
  id,
  title,
  subject,
  grade,
  classroom,
  teacherName,
  questionCount,
  duration,
  daysLeft,
  isActive,
  onStartTest
}) => {
  // Determine badge color based on days left
  const getBadgeClass = () => {
    if (!daysLeft) return '';
    
    if (daysLeft <= 2) {
      return 'bg-red-100 text-status-error';
    } else if (daysLeft <= 5) {
      return 'bg-amber-100 text-status-warning';
    } else {
      return 'bg-green-100 text-status-success';
    }
  };
  
  // Generate days left text
  const getDaysLeftText = () => {
    if (!daysLeft) return '';
    
    if (daysLeft === 0) {
      return 'Bugun tugaydi';
    } else if (daysLeft === 1) {
      return '1 kun qoldi';
    } else {
      return `${daysLeft} kun qoldi`;
    }
  };
  
  return (
    <Card className="border border-neutral-ultralight rounded-lg p-4 hover:shadow-md transition duration-200">
      <CardHeader className="p-0 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-medium text-neutral-dark">{title}</CardTitle>
            <p className="text-sm text-neutral-medium mt-1">{subject}, {grade}-sinf{classroom ? ` "${classroom}"` : ''}</p>
          </div>
          {daysLeft !== undefined && (
            <span className={`px-3 py-1 ${getBadgeClass()} text-xs rounded-full`}>
              {getDaysLeftText()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-sm text-neutral-medium">
            <span className="material-icons text-sm mr-1">person</span>
            {teacherName || 'O\'qituvchi'}
          </div>
          <div className="flex items-center text-sm text-neutral-medium">
            <span className="material-icons text-sm mr-1">help_outline</span>
            {questionCount} ta savol
          </div>
          <div className="flex items-center text-sm text-neutral-medium">
            <span className="material-icons text-sm mr-1">timer</span>
            {duration} daqiqa
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-0">
        <Button 
          className={`w-full ${
            isActive
              ? 'bg-primary hover:bg-primary-dark text-white' 
              : 'bg-neutral-ultralight text-neutral-medium cursor-not-allowed'
          }`}
          disabled={!isActive}
          onClick={() => isActive && onStartTest(id)}
        >
          {isActive ? 'Testni boshlash' : 'Hali ochilmagan'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TestCard;
