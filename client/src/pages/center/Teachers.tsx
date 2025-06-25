import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Search, Users, Plus, GraduationCap, Star, Calendar, Mail, Phone } from 'lucide-react';
import * as schema from '@shared/schema';

const Teachers: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch teachers data
  const { data: teachers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/center/teachers'],
    queryFn: () => Promise.resolve([]), // Placeholder for now
  });

  // Dashboard sections for navigation
  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      href: '/dashboard/center',
    },
    {
      id: 'teachers',
      title: 'O\'qituvchilar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/center/teachers',
      badge: teachers?.length || 0
    },
    {
      id: 'students',
      title: 'O\'quvchilar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      href: '/center/students',
    }
  ];

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher =>
    teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <ResponsiveDashboard 
        userRole="center" 
        sections={dashboardSections}
        currentPage="O'qituvchilar"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">O'qituvchilar ma'lumotlari yuklanmoqda...</p>
          </div>
        </div>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard 
      userRole="center" 
      sections={dashboardSections}
      currentPage="O'qituvchilar"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">O'qituvchilar</h1>
            <p className="text-gray-600">Markaz o'qituvchilarini boshqaring</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            O'qituvchi qo'shish
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="O'qituvchi qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Jami</p>
                  <p className="text-xl font-bold">{teachers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers List */}
        {filteredTeachers.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? "Oqituvchi topilmadi" : "Hali oqituvchilar yoq"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? "Qidiruv sorovingiz boyicha oqituvchi topilmadi" 
                    : "Birinchi oqituvchingizni qoshing"
                  }
                </p>
                {!searchTerm && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    O'qituvchi qo'shish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={teacher.profileImage} />
                      <AvatarFallback>
                        {teacher.fullName?.charAt(0)?.toUpperCase() || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {teacher.fullName || 'Nomalum'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {teacher.specialty || 'Mutaxassislik korsatilmagan'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Experience */}
                  {teacher.experience && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {teacher.experience} yil tajriba
                    </div>
                  )}

                  {/* Contact */}
                  <div className="space-y-1">
                    {teacher.phoneNumber && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {teacher.phoneNumber}
                      </div>
                    )}
                    {teacher.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {teacher.email}
                      </div>
                    )}
                  </div>

                  {/* Subjects */}
                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.slice(0, 3).map((subject: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {teacher.subjects.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{teacher.subjects.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Bio */}
                  {teacher.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {teacher.bio}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ko'rish
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Tahrirlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ResponsiveDashboard>
  );
};

export default Teachers;