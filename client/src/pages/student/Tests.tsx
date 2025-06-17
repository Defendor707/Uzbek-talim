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

const StudentTestsPage: React.FC = () => {
  const { user, logout } = useAuth();
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
    if (!query.trim()) return;
    
    try {
      const response = await fetch(`/api/tests/search/${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const foundTests = await response.json();
        if (foundTests && foundTests.length > 0) {
          // If only one test found, navigate directly
          if (foundTests.length === 1) {
            setLocation(`/student/test/${foundTests[0].id}`);
          } else {
            // Show multiple results
            setSearchResults(foundTests);
          }
        } else {
          toast({
            title: "Test topilmadi",
            description: "Bu kod yoki nom bilan test mavjud emas",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Test topilmadi",
          description: "Bu kod yoki nom bilan test mavjud emas",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Xato",
        description: "Qidiruvda xato yuz berdi",
        variant: "destructive",
      });
    }
  };

  // Filter tests based on type
  const getFilteredTests = () => {
    const allTests = [...(tests || []), ...(publicTests || [])];
    
    if (filterType === 'all') return allTests;
    if (filterType === 'public') return publicTests || [];
    if (filterType === 'numerical') return allTests.filter(t => t.type === 'numerical');
    if (filterType === 'active') return allTests.filter(t => t.status === 'active');
    
    return allTests;
  };

  const filteredTests = getFilteredTests();

  const getTestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'simple': 'Oddiy',
      'open': 'Ochiq',
      'dtm': 'DTM',
      'certificate': 'Sertifikat',
      'disciplinary': 'Intizomli',
      'public': 'Ommaviy',
      'numerical': 'Raqamli'
    };
    return labels[type] || type;
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Testlar</h1>
              <p className="text-gray-600">Test kodini kiritib qidiring yoki mavjud testlarni ko'ring</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/student">
                <Button variant="outline">
                  Bosh sahifa
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={logout}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Test qidirish
            </CardTitle>
            <CardDescription>
              Test nomini yozing (masalan: "Matematika") yoki 6 xonali test kodini kiriting (masalan: 123456)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Test nomi yoki kod kiriting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
              />
              <Button 
                onClick={() => handleSearch(searchQuery)}
                disabled={!searchQuery.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Qidirish
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Qidiruv natijalari</CardTitle>
              <CardDescription>
                "{searchQuery}" uchun {searchResults.length} ta test topildi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{test.title}</h3>
                          {test.testCode && (
                            <p className="text-sm text-gray-600">
                              Kod: <span className="font-mono font-bold">{test.testCode}</span>
                            </p>
                          )}
                        </div>
                        <Badge className={getTestTypeColor(test.type)}>
                          {getTestTypeLabel(test.type)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{test.grade} sinf</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{test.duration || 0} daqiqa</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => setLocation(`/student/test/${test.id}`)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Testni boshlash
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setSearchResults([])}
                className="mt-4"
              >
                Natijalarni yashirish
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filter Section */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
          >
            Barchasi
          </Button>
          <Button
            variant={filterType === 'public' ? 'default' : 'outline'}
            onClick={() => setFilterType('public')}
          >
            Ommaviy testlar
          </Button>
          <Button
            variant={filterType === 'numerical' ? 'default' : 'outline'}
            onClick={() => setFilterType('numerical')}
          >
            Raqamli testlar
          </Button>
          <Button
            variant={filterType === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterType('active')}
          >
            Faol testlar
          </Button>
        </div>

        {/* Tests List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      {test.testCode && (
                        <div className="text-sm text-gray-600 mt-1">
                          Kod: <span className="font-mono font-bold">{test.testCode}</span>
                        </div>
                      )}
                    </div>
                    <Badge className={getTestTypeColor(test.type)}>
                      {getTestTypeLabel(test.type)}
                    </Badge>
                  </div>
                  {test.description && (
                    <CardDescription>{test.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{test.grade} sinf</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{test.totalQuestions || 0} savol</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{test.duration || 0} daqiqa</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge 
                        variant={test.status === 'active' ? 'default' : 'secondary'}
                        className={test.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {test.status === 'active' ? 'Faol' : 'Tugallangan'}
                      </Badge>
                      
                      <Button
                        onClick={() => setLocation(`/student/test/${test.id}`)}
                        disabled={test.status !== 'active'}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {test.status === 'active' ? 'Boshlash' : 'Tugallangan'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Testlar topilmadi</h3>
              <p className="text-gray-600">
                {filterType === 'all' 
                  ? "Hozircha sizga tegishli test mavjud emas."
                  : `${filterType === 'public' ? 'Ommaviy' : filterType === 'numerical' ? 'Raqamli' : 'Faol'} testlar topilmadi.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Jami testlar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(tests?.length || 0) + (publicTests?.length || 0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Faol testlar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredTests.filter(t => t.status === 'active').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Ommaviy testlar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {publicTests?.length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Raqamli testlar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredTests.filter(t => t.type === 'numerical').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Search className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentTestsPage;