import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Award, TrendingUp, User, FileText } from 'lucide-react';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { format } from 'date-fns';

const ParentResults: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  // Fetch children data
  const { data: children, isLoading: childrenLoading } = useQuery<any[]>({
    queryKey: ['/api/parent/children'],
  });

  // Fetch test results
  const { data: testResults, isLoading: resultsLoading } = useQuery<any[]>({
    queryKey: ['/api/parent/test-results'],
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
      href: '/dashboard/parent',
    },
    {
      id: 'children',
      title: 'Farzandlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/parent/children',
    },
    {
      id: 'results',
      title: 'Natijalar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/parent/results',
    }
  ];

  // Filter results by selected child
  const filteredResults = selectedChildId 
    ? testResults?.filter(result => result.studentId === selectedChildId) || []
    : testResults || [];

  // Calculate statistics
  const averageScore = filteredResults.length > 0
    ? Math.round(filteredResults.reduce((sum, r) => sum + (r.scorePercentage || 0), 0) / filteredResults.length)
    : 0;

  const totalTests = filteredResults.length;
  const passedTests = filteredResults.filter(r => r.scorePercentage >= 60).length;

  if (childrenLoading || resultsLoading) {
    return (
      <ResponsiveDashboard 
        userRole="parent" 
        sections={dashboardSections}
        currentPage="Natijalar"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard 
      userRole="parent" 
      sections={dashboardSections}
      currentPage="Natijalar"
    >
      <div className="space-y-6">
        {/* Child selector */}
        {children && children.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedChildId === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChildId(null)}
            >
              Barcha farzandlar
            </Button>
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChildId === child.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChildId(child.id)}
              >
                {child.fullName}
              </Button>
            ))}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">O'rtacha natija</p>
                  <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jami testlar</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTests}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">O'tgan testlar</p>
                  <p className="text-2xl font-bold text-gray-900">{passedTests}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Muvaffaqiyat darajasi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results List */}
        <Card>
          <CardHeader>
            <CardTitle>Test natijalari</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Hozircha test natijalari mavjud emas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{result.testTitle}</h3>
                          <Badge 
                            variant={result.scorePercentage >= 60 ? "default" : "destructive"}
                            className={result.scorePercentage >= 60 ? "bg-green-600" : ""}
                          >
                            {result.scorePercentage >= 60 ? "O'tdi" : "O'tmadi"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{result.studentName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(result.completedAt), 'dd.MM.yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{Math.floor(result.timeSpent / 60)} daqiqa</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">{result.scorePercentage}%</p>
                        <p className="text-sm text-gray-600">
                          {result.correctAnswers}/{result.totalQuestions} to'g'ri
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveDashboard>
  );
};

export default ParentResults;