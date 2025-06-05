import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Eye } from "lucide-react";
import { format } from "date-fns";

interface TestResult {
  id: number;
  testId: number;
  studentId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  totalCorrect?: number;
  totalQuestions: number;
  status: string;
  student?: {
    id: number;
    fullName: string;
    username: string;
  };
  test?: {
    id: number;
    title: string;
    teacherId: number;
  };
}

interface Test {
  id: number;
  title: string;
  description?: string;
  totalQuestions: number;
  status: string;
  createdAt: string;
}

export function TestResults() {
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const { toast } = useToast();

  // Fetch teacher's tests
  const { data: tests = [], isLoading: testsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  // Fetch test results for selected test
  const { data: testResults = [], isLoading: resultsLoading } = useQuery<TestResult[]>({
    queryKey: ["/api/tests", selectedTestId, "results"],
    enabled: !!selectedTestId,
  });

  const handleExportExcel = async (testId: number, testTitle: string) => {
    setDownloadingExcel(true);
    try {
      const response = await fetch(`/api/tests/${testId}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Excel fayl yuklab olishda xatolik');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `test_hisoboti_${testTitle}_${new Date().toLocaleDateString('uz-UZ')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Excel fayl yuklandi",
        description: "Test hisoboti muvaffaqiyatli yuklandi",
      });
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "Excel fayl yuklab olishda xatolik",
        variant: "destructive",
      });
    } finally {
      setDownloadingExcel(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Tugallangan</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">Jarayonda</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculatePercentage = (correct: number, total: number) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'Tugallanmagan';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return `${diffMinutes} daqiqa`;
  };

  if (testsLoading) {
    return <div className="flex justify-center items-center h-64">Yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test natijalari</h1>
      </div>

      {/* Tests list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((test) => (
          <Card 
            key={test.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTestId === test.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedTestId(test.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{test.title}</CardTitle>
              {test.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{test.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">
                    {test.totalQuestions} savol
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(test.createdAt), 'dd.MM.yyyy')}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTestId(test.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportExcel(test.id, test.title);
                    }}
                    disabled={downloadingExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test results table */}
      {selectedTestId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {tests.find(t => t.id === selectedTestId)?.title} - Natijalar
              </CardTitle>
              <Button
                onClick={() => {
                  const test = tests.find(t => t.id === selectedTestId);
                  if (test) {
                    handleExportExcel(test.id, test.title);
                  }
                }}
                disabled={downloadingExcel}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadingExcel ? "Yuklanmoqda..." : "Excel yuklash"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
              <div className="flex justify-center items-center h-32">Yuklanmoqda...</div>
            ) : testResults.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Bu test uchun hali natijalar yo'q
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>O'quvchi</TableHead>
                      <TableHead>Holati</TableHead>
                      <TableHead>To'g'ri javoblar</TableHead>
                      <TableHead>Ball</TableHead>
                      <TableHead>Foiz</TableHead>
                      <TableHead>Davomiyligi</TableHead>
                      <TableHead>Tugallangan vaqt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">
                          {result.student?.fullName || 'Noma\'lum'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(result.status)}
                        </TableCell>
                        <TableCell>
                          {result.totalCorrect || 0} / {result.totalQuestions}
                        </TableCell>
                        <TableCell>
                          {result.score || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{calculatePercentage(result.totalCorrect || 0, result.totalQuestions)}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${calculatePercentage(result.totalCorrect || 0, result.totalQuestions)}%`
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {calculateDuration(result.startTime, result.endTime)}
                        </TableCell>
                        <TableCell>
                          {result.endTime 
                            ? format(new Date(result.endTime), 'dd.MM.yyyy HH:mm')
                            : 'Tugallanmagan'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary statistics */}
      {selectedTestId && testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.length}
                </div>
                <div className="text-sm text-gray-600">Jami urinishlar</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Tugallangan</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(
                    testResults
                      .filter(r => r.totalCorrect !== undefined)
                      .reduce((acc, r) => acc + calculatePercentage(r.totalCorrect || 0, r.totalQuestions), 0) /
                    testResults.filter(r => r.totalCorrect !== undefined).length || 0
                  )}%
                </div>
                <div className="text-sm text-gray-600">O'rtacha natija</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(
                    ...testResults.map(r => calculatePercentage(r.totalCorrect || 0, r.totalQuestions)),
                    0
                  )}%
                </div>
                <div className="text-sm text-gray-600">Eng yuqori natija</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}