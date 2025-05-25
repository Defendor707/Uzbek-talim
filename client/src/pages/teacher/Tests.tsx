import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import TestList, { Test } from '@/components/teacher/TestList';
import TestForm from '@/components/teacher/TestForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Question type interface
interface Question {
  id?: number;
  testId: number;
  questionText: string;
  questionType: string;
  options?: any;
  correctAnswer: any;
  points: number;
  order: number;
}

const TestsPage: React.FC = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
  
  // Fetch tests
  const { data: tests, isLoading, error } = useQuery<Test[]>({
    queryKey: ['/api/tests'],
  });
  
  // Fetch questions for current test
  const { data: questions, refetch: refetchQuestions } = useQuery<Question[]>({
    queryKey: [`/api/tests/${currentTestId}/questions`],
    enabled: !!currentTestId,
  });
  
  // Create test mutation
  const { mutate: createTest, isPending: isCreating } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/tests', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Test muvaffaqiyatli yaratildi',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      setIsFormOpen(false);
      setEditingTest(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Testni yaratishda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });
  
  // Update test mutation
  const { mutate: updateTest, isPending: isUpdating } = useMutation({
    mutationFn: async (data: { id: number; testData: any }) => {
      const response = await apiRequest('PUT', `/api/tests/${data.id}`, data.testData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Test muvaffaqiyatli yangilandi',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      setIsFormOpen(false);
      setEditingTest(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Testni yangilashda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });
  
  // Delete test mutation
  const { mutate: deleteTest } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/tests/${id}`, null);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Test muvaffaqiyatli o\'chirildi',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Testni o\'chirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });
  
  // Create question mutation
  const { mutate: createQuestion, isPending: isCreatingQuestion } = useMutation({
    mutationFn: async (data: any) => {
      if (!currentTestId) return null;
      const response = await apiRequest('POST', `/api/tests/${currentTestId}/questions`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Savol muvaffaqiyatli qo\'shildi',
        variant: 'default',
      });
      if (currentTestId) {
        queryClient.invalidateQueries({ queryKey: [`/api/tests/${currentTestId}/questions`] });
      }
      setIsQuestionDialogOpen(false);
      setCurrentQuestion(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Savolni qo\'shishda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });
  
  const handleAddTest = () => {
    setEditingTest(null);
    setIsFormOpen(true);
  };
  
  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setIsFormOpen(true);
  };
  
  const handleDeleteTest = (id: number) => {
    deleteTest(id);
  };
  
  const handleManageQuestions = (testId: number) => {
    setCurrentTestId(testId);
    // Open questions management modal or navigate to questions page
    toast({
      title: 'Savollar',
      description: 'Savollarni boshqarish sahifasi ochilmoqda',
    });
    // For now, let's open a simple question dialog
    setIsQuestionDialogOpen(true);
  };
  
  const handleSubmitForm = (data: any) => {
    if (editingTest) {
      updateTest({ id: editingTest.id, testData: data });
    } else {
      createTest(data);
    }
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTest(null);
  };
  
  const handleAddQuestion = () => {
    if (!currentTestId) return;
    
    // Determine next question order
    const nextOrder = questions ? questions.length + 1 : 1;
    
    // Initialize new question
    setCurrentQuestion({
      testId: currentTestId,
      questionText: '',
      questionType: 'multiple_choice',
      options: [
        { label: 'Variant A', value: 'A' },
        { label: 'Variant B', value: 'B' },
        { label: 'Variant C', value: 'C' },
        { label: 'Variant D', value: 'D' }
      ],
      correctAnswer: 'A',
      points: 1,
      order: nextOrder
    });
  };
  
  const handleSubmitQuestion = () => {
    if (!currentQuestion) return;
    
    createQuestion(currentQuestion);
  };
  
  return (
    <DashboardLayout title="Testlar">
      <div className="mb-6">
        <TestList
          onAdd={handleAddTest}
          onEdit={handleEditTest}
          onDelete={handleDeleteTest}
          onManageQuestions={handleManageQuestions}
        />
      </div>
      
      {isFormOpen && (
        <TestForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          initialData={editingTest || undefined}
          isSubmitting={isCreating || isUpdating}
        />
      )}
      
      {/* Simple Question Management Dialog */}
      {isQuestionDialogOpen && (
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading font-bold text-neutral-dark">
                Testga savollar qo'shish
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              {/* Question List */}
              {questions && questions.length > 0 ? (
                <div className="mb-4 space-y-2">
                  <h3 className="text-sm font-medium text-neutral-dark">Mavjud savollar:</h3>
                  {questions.map((q, index) => (
                    <div key={q.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{q.order}. </span>
                          <span>{q.questionText}</span>
                        </div>
                        <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                          {q.questionType === 'multiple_choice' ? 'Test' : 
                           q.questionType === 'true_false' ? 'To\'g\'ri/Noto\'g\'ri' : 
                           q.questionType === 'matching' ? 'Moslashtirish' :
                           q.questionType === 'short_answer' ? 'Qisqa javob' : 'Esse'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-neutral-50 rounded-md mb-4">
                  <p className="text-neutral-medium">Bu testda hali savollar yo'q</p>
                </div>
              )}
              
              {/* Add Question Button */}
              <Button 
                onClick={handleAddQuestion}
                className="w-full bg-primary hover:bg-primary-dark text-white"
              >
                <span className="material-icons mr-2">add</span>
                Yangi savol qo'shish
              </Button>
              
              {/* New Question Form */}
              {currentQuestion && (
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="text-md font-medium text-neutral-dark mb-3">Yangi savol:</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Savol matni</Label>
                      <Textarea 
                        value={currentQuestion.questionText}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, questionText: e.target.value})}
                        placeholder="Savolni kiriting..."
                      />
                    </div>
                    
                    <div>
                      <Label>Savol turi</Label>
                      <Select
                        value={currentQuestion.questionType}
                        onValueChange={(value) => setCurrentQuestion({...currentQuestion, questionType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Savol turini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Test (bir javobli)</SelectItem>
                          <SelectItem value="true_false">To'g'ri/Noto'g'ri</SelectItem>
                          <SelectItem value="matching">Moslashtirish</SelectItem>
                          <SelectItem value="short_answer">Qisqa javob</SelectItem>
                          <SelectItem value="essay">Esse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {currentQuestion.questionType === 'multiple_choice' && (
                      <div>
                        <Label>Variantlar</Label>
                        <div className="space-y-2">
                          {currentQuestion.options?.map((option: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input 
                                value={option.label}
                                onChange={(e) => {
                                  const newOptions = [...(currentQuestion.options || [])];
                                  newOptions[index].label = e.target.value;
                                  setCurrentQuestion({...currentQuestion, options: newOptions});
                                }}
                                placeholder={`Variant ${option.value}`}
                              />
                              <Select
                                value={currentQuestion.correctAnswer === option.value ? 'true' : 'false'}
                                onValueChange={(value) => {
                                  if (value === 'true') {
                                    setCurrentQuestion({...currentQuestion, correctAnswer: option.value});
                                  }
                                }}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">To'g'ri</SelectItem>
                                  <SelectItem value="false">Noto'g'ri</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {currentQuestion.questionType === 'true_false' && (
                      <div>
                        <Label>To'g'ri javob</Label>
                        <Select
                          value={currentQuestion.correctAnswer}
                          onValueChange={(value) => setCurrentQuestion({...currentQuestion, correctAnswer: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">To'g'ri</SelectItem>
                            <SelectItem value="false">Noto'g'ri</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {currentQuestion.questionType === 'short_answer' && (
                      <div>
                        <Label>To'g'ri javob</Label>
                        <Input 
                          value={currentQuestion.correctAnswer}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value})}
                          placeholder="To'g'ri javobni kiriting"
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label>Ball</Label>
                      <Input 
                        type="number"
                        value={currentQuestion.points}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)})}
                        min="1"
                        placeholder="1"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentQuestion(null)}
                      >
                        Bekor qilish
                      </Button>
                      <Button 
                        onClick={handleSubmitQuestion}
                        disabled={isCreatingQuestion || !currentQuestion.questionText}
                        className="bg-primary hover:bg-primary-dark text-white"
                      >
                        {isCreatingQuestion ? 'Saqlanmoqda...' : 'Saqlash'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => setIsQuestionDialogOpen(false)}
                className="bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
              >
                Yopish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default TestsPage;
