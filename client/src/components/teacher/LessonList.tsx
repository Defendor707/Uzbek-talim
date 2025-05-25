import React from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export type Lesson = {
  id: number;
  title: string;
  description?: string;
  subjectId?: number;
  grade: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

interface LessonListProps {
  onEdit: (lesson: Lesson) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

const LessonList: React.FC<LessonListProps> = ({ onEdit, onDelete, onAdd }) => {
  const { toast } = useToast();
  
  const { data: lessons, isLoading, error } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
  });
  
  if (error) {
    toast({
      title: 'Xatolik',
      description: 'Darsliklarni yuklashda xatolik yuz berdi',
      variant: 'destructive',
    });
  }
  
  const columns = [
    {
      id: 'title',
      header: 'Nomi',
      cell: (lesson: Lesson) => (
        <div className="flex items-center">
          <span className="material-icons mr-2 text-primary">description</span>
          <div>
            <div className="text-sm font-medium text-neutral-dark">{lesson.title}</div>
            <div className="text-xs text-neutral-medium">{lesson.description || ''}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'grade',
      header: 'Sinf',
      cell: (lesson: Lesson) => (
        <span className="text-sm text-neutral-medium">{lesson.grade}-sinf</span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Yaratilgan',
      cell: (lesson: Lesson) => (
        <span className="text-sm text-neutral-medium">
          {new Date(lesson.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (lesson: Lesson) => {
        const statusClasses = {
          active: 'bg-green-100 text-status-success',
          draft: 'bg-amber-100 text-status-warning',
          archived: 'bg-neutral-200 text-neutral-medium',
        };
        
        const statusLabels = {
          active: 'Faol',
          draft: 'Qoralama',
          archived: 'Arxivlangan',
        };
        
        const statusClass = statusClasses[lesson.status as keyof typeof statusClasses] || statusClasses.draft;
        const statusLabel = statusLabels[lesson.status as keyof typeof statusLabels] || 'Noma\'lum';
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Amallar',
      cell: (lesson: Lesson) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(lesson)}
            className="text-primary hover:text-primary-dark"
          >
            <span className="material-icons text-sm">edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(lesson.id)}
            className="text-neutral-medium hover:text-status-error"
          >
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];
  
  const handleDelete = (id: number) => {
    if (window.confirm('Haqiqatan ham bu darslikni o\'chirmoqchimisiz?')) {
      onDelete(id);
    }
  };
  
  return (
    <DataTable
      data={lessons || []}
      columns={columns}
      title="Darsliklar"
      isLoading={isLoading}
      enableSearch={true}
      searchPlaceholder="Darsliklarni qidirish..."
      actionButton={{
        label: "Yangi darslik qo'shish",
        icon: "add",
        onClick: onAdd,
      }}
    />
  );
};

export default LessonList;
