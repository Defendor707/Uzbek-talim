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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Darsliklar</h1>
          <Link href="/teacher/lessons/create">
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Yangi darslik yaratish
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Faol darsliklar</span>
                  <BookOpen className="w-4 h-4 text-gray-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500">Jami {lessons?.length || 0} ta darslik</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Ko'rishlar soni</span>
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
              <p className="text-xs text-gray-500">Barcha darsliklar bo'yicha</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Umumiy vaqt</span>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{totalTime}</p>
              <p className="text-xs text-gray-500">Daqiqa</p>
            </CardContent>
          </Card>
        </div>

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <CardTitle>Mening darsliklarim</CardTitle>
          </CardHeader>
          <CardContent>
            {lessons && lessons.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                          <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {lesson.title}
                          </h3>
                          {lesson.topic && (
                            <p className="text-sm text-gray-500 mt-1">{lesson.topic}</p>
                          )}
                          {lesson.description && (
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{lesson.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-sm text-gray-500">Sinf: {lesson.grade}</span>
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
                            {lesson.estimatedTime && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.estimatedTime} daqiqa
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="px-4 pb-4 flex gap-2 border-t pt-3">
                      <Link href={`/teacher/lessons/edit/${lesson.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Tahrirlash
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-1" />
                        O'chirish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Darsliklar topilmadi</h3>
                <p className="text-gray-600 mb-4">Hozircha sizda darslik mavjud emas. Birinchi darsligingizni yarating.</p>
                <Link href="/teacher/lessons/create">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Yangi darslik yaratish
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveDashboard>
  );
};

export default LessonsPage;