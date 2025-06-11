import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import useAuth from '@/hooks/useAuth';

const TestsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<any>(null);
  
  // Fetch tests
  const { data: tests } = useQuery<any[]>({
    queryKey: ['/api/tests'],
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (testId: number) => {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Test o\'chirishda xatolik');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyat',
        description: 'Test muvaffaqiyatli o\'chirildi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    },
    onError: () => {
      toast({
        title: 'Xatolik',
        description: 'Test o\'chirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteTest = (test: any) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (testToDelete) {
      deleteTestMutation.mutate(testToDelete.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Testlar</h1>
              <p className="text-sm sm:text-base text-gray-600">Testlarni boshqaring va yarating</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Link href="/dashboard/teacher" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  Bosh sahifa
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={logout}
                className="text-red-600 border-red-600 hover:bg-red-50 w-full sm:w-auto"
              >
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Actions */}
        <div className="mb-6 sm:mb-8">
          <Link href="/teacher/tests/create" className="w-full sm:w-auto">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yangi test yaratish
            </Button>
          </Link>
        </div>

        {/* Tests List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Mening testlarim</h2>
            
            {tests && tests.length > 0 ? (
              <div className="space-y-4">
                {tests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{test.title}</h3>
                        {test.description && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{test.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {test.type === 'public' ? 'Ommaviy' : 'Maxsus raqamli'}
                          </span>
                          {test.type === 'numerical' && test.testCode && (
                            <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Kod: {test.testCode}
                            </span>
                          )}
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {test.totalQuestions || 0} savol
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            test.status === 'active' ? 'bg-green-100 text-green-800' :
                            test.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {test.status === 'active' ? 'Faol' :
                             test.status === 'draft' ? 'Qoralama' : 'Tugallangan'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="p-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50 p-2"
                          onClick={() => handleDeleteTest(test)}
                          disabled={deleteTestMutation.isPending}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Testlar topilmadi</h3>
                <p className="text-gray-600 mb-4">Hozircha sizda test mavjud emas. Birinchi testingizni yarating.</p>
                <Link href="/teacher/tests/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Yangi test yaratish
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Jami testlar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tests?.length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Faol testlar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tests?.filter(t => t.status === 'active').length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Qoralama testlar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tests?.filter(t => t.status === 'draft').length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Testni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham "{testToDelete?.title}" testini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTestMutation.isPending}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteTestMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTestMutation.isPending ? 'O\'chirilmoqda...' : 'O\'chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestsPage;