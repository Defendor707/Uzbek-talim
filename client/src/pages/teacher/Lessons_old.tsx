import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Plus, BookOpen, Eye, Clock, Edit, Trash2 } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LessonsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch lessons
  const { data: lessons } = useQuery<any[]>({
    queryKey: ['/api/lessons'],
  });

  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: <BookOpen className="w-4 h-4" />,
      href: '/dashboard/teacher',
    },
    {
      id: 'lessons',
      title: 'Darsliklar',
      icon: <BookOpen className="w-4 h-4" />,
      href: '/teacher/lessons',
      badge: lessons?.length || 0
    },
    {
      id: 'tests',
      title: 'Testlar',
      icon: <BookOpen className="w-4 h-4" />,
      href: '/teacher/tests'
    }
  ];

  // Calculate statistics
  const activeCount = lessons?.filter(l => l.status === 'active').length || 0;
  const totalViews = lessons?.reduce((sum, l) => sum + (l.viewCount || 0), 0) || 0;
  const totalTime = lessons?.reduce((sum, l) => sum + (l.estimatedTime || 0), 0) || 0;

  return (
    <ResponsiveDashboard 
      userRole="teacher" 
      sections={dashboardSections}
      currentPage="Darsliklar"
    >
      {/* Actions */}
      <div className="mb-8">
        <Link href="/teacher/lessons/create">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Yangi darslik yaratish
          </Button>
        </Link>
      </div>

        {/* Lessons List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Mening darsliklarim</h2>
            
            {lessons && lessons.length > 0 ? (
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <Link href={`/teacher/lessons/${lesson.id}`}>
                      <div className="cursor-pointer">
                        {lesson.coverImage && (
                          <div className="h-48 bg-gray-100">
                            <img 
                              src={lesson.coverImage} 
                              alt={lesson.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                {lesson.title}
                              </h3>
                              {lesson.topic && (
                                <p className="text-sm text-gray-500 mt-1">{lesson.topic}</p>
                              )}
                              {lesson.description && (
                                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{lesson.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                <span>Sinf: {lesson.grade}</span>
                                {lesson.difficulty && (
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    lesson.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    lesson.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {lesson.difficulty === 'easy' ? 'Oson' : 
                                     lesson.difficulty === 'medium' ? "O'rtacha" : 'Qiyin'}
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded text-xs ${
                                  lesson.status === 'active' ? 'bg-green-100 text-green-800' :
                                  lesson.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {lesson.status === 'active' ? 'Faol' :
                                   lesson.status === 'draft' ? 'Qoralama' : 'Arxivlangan'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="px-4 pb-4 flex gap-2 border-t pt-3">
                        <Button variant="outline" size="sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Darsliklar topilmadi</h3>
                <p className="text-gray-600 mb-4">Hozircha sizda darslik mavjud emas. Birinchi darsligingizni yarating.</p>
                <Button className="bg-green-600 hover:bg-green-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Yangi darslik yaratish
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Jami darsliklar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.length || 0}
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
                <p className="text-gray-600 text-sm">Faol darsliklar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.filter(l => l.status === 'active').length || 0}
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
                <p className="text-gray-600 text-sm">Qoralama darsliklar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.filter(l => l.status === 'draft').length || 0}
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
    </ResponsiveDashboard>
  );
};

export default LessonsPage;