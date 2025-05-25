import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import LessonList, { Lesson } from '@/components/teacher/LessonList';
import LessonForm from '@/components/teacher/LessonForm';
import { useToast } from '@/hooks/use-toast';

const LessonsPage: React.FC = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  // Fetch lessons
  const { data: lessons, isLoading, error } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
  });
  
  // Create lesson mutation
  const { mutate: createLesson, isPending: isCreating } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/lessons', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Darslik muvaffaqiyatli yaratildi',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      setIsFormOpen(false);
      setEditingLesson(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Darslikni yaratishda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });
  
  // Update lesson mutation
  const { mutate: updateLesson, isPending: isUpdating } = useMutation({
    mutationFn: async (data: { id: number; lessonData: any }) => {
      const response = await apiRequest('PUT', `/api/lessons/${data.id}`, data.lessonData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Darslik muvaffaqiyatli yangilandi',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      setIsFormOpen(false);
      setEditingLesson(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Darslikni yangilashda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });
  
  // Delete lesson mutation
  const { mutate: deleteLesson } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/lessons/${id}`, null);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Darslik muvaffaqiyatli o\'chirildi',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Darslikni o\'chirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });
  
  const handleAddLesson = () => {
    setEditingLesson(null);
    setIsFormOpen(true);
  };
  
  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsFormOpen(true);
  };
  
  const handleDeleteLesson = (id: number) => {
    deleteLesson(id);
  };
  
  const handleSubmitForm = (data: any) => {
    if (editingLesson) {
      updateLesson({ id: editingLesson.id, lessonData: data });
    } else {
      createLesson(data);
    }
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLesson(null);
  };
  
  return (
    <DashboardLayout title="Darsliklar">
      <div className="mb-6">
        <LessonList
          onAdd={handleAddLesson}
          onEdit={handleEditLesson}
          onDelete={handleDeleteLesson}
        />
      </div>
      
      {isFormOpen && (
        <LessonForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          initialData={editingLesson || undefined}
          isSubmitting={isCreating || isUpdating}
        />
      )}
    </DashboardLayout>
  );
};

export default LessonsPage;
