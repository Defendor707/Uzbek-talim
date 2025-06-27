import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { BookOpen, Clock, Tag, Eye } from 'lucide-react';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const StudentLessonsPage: React.FC = () => {
  // Fetch lessons
  const { data: lessons } = useQuery<any[]>({
    queryKey: ['/api/lessons'],
  });

  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: <BookOpen className="w-4 h-4" />,
      href: '/dashboard/student',
    },
    {
      id: 'tests',
      title: 'Testlar',
      icon: <BookOpen className="w-4 h-4" />,
      href: '/student/tests'
    },
    {
      id: 'lessons',
      title: 'Darsliklar',
      icon: <BookOpen className="w-4 h-4" />,
      href: '/student/lessons',
      badge: lessons?.length || 0
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ResponsiveDashboard 
      userRole="student" 
      sections={dashboardSections}
      currentPage="Darsliklar"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Darsliklar</h1>
          <p className="text-gray-600 mt-1">Mavjud darsliklarni ko'ring va o'rganing</p>
        </div>

        {/* Lessons Grid */}
        {lessons && lessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.filter(lesson => lesson.status === 'active').map((lesson) => (
              <Card key={lesson.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/student/lessons/${lesson.id}`}>
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
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                        {lesson.title}
                      </CardTitle>
                      {lesson.topic && (
                        <p className="text-sm text-gray-500">{lesson.topic}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {lesson.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="text-gray-500">Sinf: {lesson.grade}</span>
                        
                        {lesson.difficulty && (
                          <Badge className={getDifficultyColor(lesson.difficulty)}>
                            {lesson.difficulty === 'easy' ? 'Oson' : 
                             lesson.difficulty === 'medium' ? "O'rtacha" : 'Qiyin'}
                          </Badge>
                        )}
                        
                        {lesson.estimatedTime && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{lesson.estimatedTime} daqiqa</span>
                          </div>
                        )}
                        
                        {lesson.viewCount > 0 && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Eye className="w-3 h-3" />
                            <span>{lesson.viewCount}</span>
                          </div>
                        )}
                      </div>
                      
                      {lesson.keywords && lesson.keywords.length > 0 && (
                        <div className="flex gap-1 mt-3">
                          <Tag className="w-3 h-3 text-gray-400 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {lesson.keywords.slice(0, 3).map((keyword: string, index: number) => (
                              <span key={index} className="text-xs text-gray-500">
                                {keyword}{index < 2 && index < lesson.keywords.length - 1 && ','}
                              </span>
                            ))}
                            {lesson.keywords.length > 3 && (
                              <span className="text-xs text-gray-400">+{lesson.keywords.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Darsliklar topilmadi</h3>
              <p className="text-gray-600">Hozircha sizning sinfingiz uchun darsliklar mavjud emas.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsiveDashboard>
  );
};

export default StudentLessonsPage;