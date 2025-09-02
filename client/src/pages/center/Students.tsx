import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Search, Users, Plus, BookOpen, TrendingUp, Calendar, Phone, GraduationCap } from 'lucide-react';
import * as schema from '@shared/schema';

const Students: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Fetch students data
  const { data: students = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/center/students'],
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
      badge: students?.length || 0
    }
  ];

  // Filter students based on search term and grade
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // Get unique grades for filter
  const grades = Array.from(new Set(students.map(s => s.grade).filter(Boolean)));

  if (isLoading) {
    return (
      <ResponsiveDashboard 
        userRole="center" 
        sections={dashboardSections}
        currentPage="O'quvchilar"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">O'quvchilar ma'lumotlari yuklanmoqda...</p>
          </div>
        </div>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard 
      userRole="center" 
      sections={dashboardSections}
      currentPage="O'quvchilar"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">O'quvchilar</h1>
            <p className="text-gray-600">Markaz o'quvchilarini boshqaring</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            O'quvchi qo'shish
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="O'quvchi qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Grade Filter */}
          <div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sinf" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha sinflar</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>
                    {grade}-sinf
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Jami</p>
                  <p className="text-xl font-bold">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Faol o'quvchilar</p>
                  <p className="text-2xl font-bold">{students.filter(s => s.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">O'rtacha ball</p>
                  <p className="text-2xl font-bold">85%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Bu oyda</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Muvaffaqiyatli</p>
                  <p className="text-2xl font-bold">89%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || gradeFilter !== 'all' ? "Oquvchi topilmadi" : "Hali oquvchilar yoq"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || gradeFilter !== 'all'
                    ? "Filtr shartlariga mos oquvchi topilmadi" 
                    : "Birinchi oquvchingizni qoshing"
                  }
                </p>
                {!searchTerm && gradeFilter === 'all' && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    O'quvchi qo'shish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={student.profileImage} />
                      <AvatarFallback>
                        {student.fullName?.charAt(0)?.toUpperCase() || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {student.fullName || 'Nomalum'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        @{student.username}
                      </CardDescription>
                    </div>
                    {student.isActive ? (
                      <Badge variant="default" className="text-xs">Faol</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Nofaol</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Grade and Classroom */}
                  <div className="flex gap-2">
                    {student.grade && (
                      <Badge variant="outline" className="text-xs">
                        {student.grade}-sinf
                      </Badge>
                    )}
                    {student.classroom && (
                      <Badge variant="outline" className="text-xs">
                        {student.classroom}-guruh
                      </Badge>
                    )}
                  </div>

                  {/* Contact */}
                  {student.phoneNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {student.phoneNumber}
                    </div>
                  )}

                  {/* Bio */}
                  {student.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {student.bio}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">Progress</span>
                      <span className="text-xs text-gray-600">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Profil
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Natijalar
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

export default Students;