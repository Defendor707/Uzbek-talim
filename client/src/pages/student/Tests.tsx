import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, FileText, Users, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import MobileDashboard from '@/components/dashboard/MobileDashboard';

const StudentTestsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  
  // Fetch all available tests
  const { data: tests, isLoading } = useQuery<any[]>({
    queryKey: ['/api/tests'],
  });

  // Fetch public tests
  const { data: publicTests } = useQuery<any[]>({
    queryKey: ['/api/tests/public'],
  });

  // Handle universal search (both code and name)
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/tests/search/${encodeURIComponent(query.trim())}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const foundTests = await response.json();
        if (foundTests && foundTests.length > 0) {
          setSearchResults(foundTests);
          toast({
            title: "Qidiruv muvaffaqiyatli",
            description: `${foundTests.length} ta test topildi`,
          });
        } else {
          setSearchResults([]);
          toast({
            title: "Test topilmadi",
            description: "Bunday kod yoki nom bilan test mavjud emas",
            variant: "destructive",
          });
        }
      } else if (response.status === 404) {
        setSearchResults([]);
        toast({
          title: "Test topilmadi",
          description: "Bunday kod yoki nom bilan test mavjud emas",
          variant: "destructive",
        });
      } else {
        console.error('Search failed with status:', response.status);
        toast({
          title: "Xatolik",
          description: "Test qidirishda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Xatolik",
        description: "Tarmoq xatoligi. Internetni tekshiring",
        variant: "destructive",
      });
    }
  };

  // Filter tests based on type
  const filteredTests = tests?.filter(test => {
    if (filterType === 'all') return true;
    return test.type === filterType;
  }) || [];

  const getTestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'simple': 'bg-blue-100 text-blue-800',
      'open': 'bg-green-100 text-green-800',
      'dtm': 'bg-purple-100 text-purple-800',
      'certificate': 'bg-yellow-100 text-yellow-800',
      'disciplinary': 'bg-red-100 text-red-800',
      'public': 'bg-orange-100 text-orange-800',
      'numerical': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Dashboard sections for mobile navigation
  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      href: '/dashboard/student',
    },
    {
      id: 'tests',
      title: 'Testlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      href: '/student/tests',
    },
    {
      id: 'lessons',
      title: 'Darsliklar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/student/lessons',
    },
    {
      id: 'profile',
      title: 'Profil',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: '/student/profile',
    }
  ];

  return (
    <MobileDashboard
      userRole="student"
      sections={dashboardSections}
      currentPage="Testlar"
    >
      <div className="p-4 lg:p-0">
        {/* Search Section */}
        <div className="mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-semibold mb-3">Test qidirish</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Test kodi yoki nomi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
              />
            </div>
            <Button 
              onClick={() => handleSearch(searchQuery)}
              disabled={searchQuery.length < 2}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-blue-100 text-xs">Jami testlar</p>
                <p className="text-2xl font-bold">{tests?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-purple-100 text-xs">Ommaviy testlar</p>
                <p className="text-2xl font-bold">{publicTests?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Qidiruv natijalari</h3>
            <div className="space-y-3">
              {searchResults.map((test, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{test.title}</h4>
                        <p className="text-sm text-gray-600">{test.subject} • {test.grade}</p>
                        <Badge className={getTestTypeColor(test.type)}>{test.type}</Badge>
                      </div>
                      <Link href={`/student/test/${test.id}`}>
                        <Button size="sm">Boshlash</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Tests */}
        {filteredTests && filteredTests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Mavjud testlar</h3>
            <div className="space-y-3">
              {filteredTests.map((test, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{test.title}</h4>
                        <p className="text-sm text-gray-600">{test.subject} • {test.grade}</p>
                        <Badge className={getTestTypeColor(test.type)}>{test.type}</Badge>
                      </div>
                      <Link href={`/student/test/${test.id}`}>
                        <Button size="sm">Boshlash</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!tests || tests.length === 0) && !isLoading && (
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Hozircha testlar mavjud emas</p>
            <Link href="/dashboard/student">
              <Button>Bosh sahifaga qaytish</Button>
            </Link>
          </div>
        )}
      </div>
    </MobileDashboard>
  );
};

export default StudentTestsPage;