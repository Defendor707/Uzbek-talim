import * as XLSX from 'xlsx';
import { storage } from '../storage';
import * as schema from '@shared/schema';

export interface TestResultData {
  studentName: string;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  completedAt: Date;
}

export async function generateTestReportExcel(testId: number): Promise<Buffer> {
  try {
    // Get test details
    const test = await storage.getTestById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    // Get all test attempts for this test
    const attempts = await storage.getTestAttemptsByTestId(testId);
    
    // Get student data for each attempt
    const results: TestResultData[] = [];
    
    for (const attempt of attempts) {
      if (attempt.status === 'completed' && attempt.score !== null) {
        const student = await storage.getUser(attempt.studentId);
        if (student) {
          results.push({
            studentName: student.fullName,
            correctAnswers: Number(attempt.score),
            totalQuestions: attempt.totalQuestions,
            percentage: Math.round((Number(attempt.score) / attempt.totalQuestions) * 100),
            completedAt: attempt.endTime || new Date()
          });
        }
      }
    }

    // Sort by student name
    results.sort((a, b) => a.studentName.localeCompare(b.studentName));

    // Create Excel data
    const excelData = results.map((result, index) => ({
      '№': index + 1,
      'Ism familya': result.studentName,
      'T.J.S.': result.correctAnswers,
      'T.S': result.totalQuestions,
      'Foiz': `${result.percentage}%`,
      'Sana': result.completedAt.toLocaleDateString('uz-UZ')
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 5 },   // №
      { width: 25 },  // Ism familya
      { width: 10 },  // T.J.S.
      { width: 8 },   // T.S
      { width: 10 },  // Foiz
      { width: 15 }   // Sana
    ];

    // Add title row
    XLSX.utils.sheet_add_aoa(worksheet, [[`Test: ${test.title}`]], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(worksheet, [['Savollar soni:', test.totalQuestions]], { origin: 'A2' });
    XLSX.utils.sheet_add_aoa(worksheet, [['Jami ishtirokchilar:', results.length]], { origin: 'A3' });
    XLSX.utils.sheet_add_aoa(worksheet, [['']], { origin: 'A4' });

    // Move data down to accommodate title
    const dataRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    dataRange.s.r = 4; // Start from row 5
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Natijalari');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;

  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw new Error('Failed to generate Excel report');
  }
}

export async function generateStudentProgressExcel(studentId: number): Promise<Buffer> {
  try {
    // Get student data
    const student = await storage.getUser(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Get all test attempts for this student
    const attempts = await storage.getTestAttemptsByStudentId(studentId);
    
    // Get test data for each attempt
    const results: any[] = [];
    
    for (const attempt of attempts) {
      if (attempt.status === 'completed' && attempt.score !== null) {
        const test = await storage.getTestById(attempt.testId);
        if (test) {
          results.push({
            testName: test.title,
            correctAnswers: Number(attempt.score),
            totalQuestions: attempt.totalQuestions,
            percentage: Math.round((Number(attempt.score) / attempt.totalQuestions) * 100),
            completedAt: attempt.endTime || new Date()
          });
        }
      }
    }

    // Sort by completion date
    results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

    // Create Excel data
    const excelData = results.map((result, index) => ({
      '№': index + 1,
      'Test nomi': result.testName,
      'T.J.S.': result.correctAnswers,
      'T.S': result.totalQuestions,
      'Foiz': `${result.percentage}%`,
      'Sana': result.completedAt.toLocaleDateString('uz-UZ')
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 5 },   // №
      { width: 30 },  // Test nomi
      { width: 10 },  // T.J.S.
      { width: 8 },   // T.S
      { width: 10 },  // Foiz
      { width: 15 }   // Sana
    ];

    // Add title row
    XLSX.utils.sheet_add_aoa(worksheet, [[`O'quvchi: ${student.fullName}`]], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(worksheet, [['Jami testlar:', results.length]], { origin: 'A2' });
    
    // Calculate average score
    const avgScore = results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
      : 0;
    XLSX.utils.sheet_add_aoa(worksheet, [['O\'rtacha natija:', `${avgScore}%`]], { origin: 'A3' });
    XLSX.utils.sheet_add_aoa(worksheet, [['']], { origin: 'A4' });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Natijalari');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;

  } catch (error) {
    console.error('Error generating student progress Excel:', error);
    throw new Error('Failed to generate student progress Excel');
  }
}