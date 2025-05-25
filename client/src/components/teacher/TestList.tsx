import React from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export type Test = {
  id: number;
  title: string;
  description?: string;
  type: string;
  duration: number;
  totalQuestions: number;
  grade: string;
  classroom?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

interface TestListProps {
  onEdit: (test: Test) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  onManageQuestions: (testId: number) => void;
}

const TestList: React.FC<TestListProps> = ({ onEdit, onDelete, onAdd, onManageQuestions }) => {
  const { toast } = useToast();
  
  const { data: tests, isLoading, error } = useQuery<Test[]>({
    queryKey: ['/api/tests'],
  });
  
  if (error) {
    toast({
      title: 'Xatolik',
      description: 'Testlarni yuklashda xatolik yuz berdi',
      variant: 'destructive',
    });
  }
  
  const testTypes: Record<string, string> = {
    multiple_choice: 'Test (bir javobli)',
    true_false: 'To\'g\'ri/Noto\'g\'ri',
    matching: 'Moslashtirish',
    short_answer: 'Qisqa javob',
    essay: 'Esse',
  };
  
  const testStatus: Record<string, { label: string, style: string }> = {
    draft: { label: 'Qoralama', style: 'bg-amber-100 text-status-warning' },
    active: { label: 'Faol', style: 'bg-green-100 text-status-success' },
    completed: { label: 'Yakunlangan', style: 'bg-neutral-200 text-neutral-medium' },
  };
  
  const columns = [
    {
      id: 'title',
      header: 'Nomi',
      cell: (test: Test) => (
        <div className="flex items-center">
          <span className="material-icons mr-2 text-primary">quiz</span>
          <div>
            <div className="text-sm font-medium text-neutral-dark">{test.title}</div>
            <div className="text-xs text-neutral-medium">{test.description || ''}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Test turi',
      cell: (test: Test) => (
        <span className="text-sm text-neutral-medium">
          {testTypes[test.type] || test.type}
        </span>
      ),
    },
    {
      id: 'details',
      header: 'Tafsilotlar',
      cell: (test: Test) => (
        <div className="text-sm">
          <div className="flex items-center text-neutral-medium mb-1">
            <span className="material-icons text-sm mr-1">help_outline</span>
            {test.totalQuestions} ta savol
          </div>
          <div className="flex items-center text-neutral-medium">
            <span className="material-icons text-sm mr-1">timer</span>
            {test.duration} daqiqa
          </div>
        </div>
      ),
    },
    {
      id: 'grade',
      header: 'Sinf',
      cell: (test: Test) => (
        <span className="text-sm text-neutral-medium">
          {test.grade}-sinf {test.classroom ? `"${test.classroom}"` : ''}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (test: Test) => {
        const status = testStatus[test.status] || { label: 'Noma\'lum', style: 'bg-neutral-200 text-neutral-medium' };
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.style}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Amallar',
      cell: (test: Test) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onManageQuestions(test.id)}
            className="text-primary hover:text-primary-dark mr-1"
            title="Savollarni boshqarish"
          >
            <span className="material-icons text-sm">format_list_bulleted</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(test)}
            className="text-primary hover:text-primary-dark mr-1"
            title="Tahrirlash"
          >
            <span className="material-icons text-sm">edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(test.id)}
            className="text-neutral-medium hover:text-status-error"
            title="O'chirish"
          >
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];
  
  const handleDelete = (id: number) => {
    if (window.confirm('Haqiqatan ham bu testni o\'chirmoqchimisiz?')) {
      onDelete(id);
    }
  };
  
  return (
    <DataTable
      data={tests || []}
      columns={columns}
      title="Testlar"
      isLoading={isLoading}
      enableSearch={true}
      searchPlaceholder="Testlarni qidirish..."
      actionButton={{
        label: "Yangi test yaratish",
        icon: "add",
        onClick: onAdd,
      }}
    />
  );
};

export default TestList;
