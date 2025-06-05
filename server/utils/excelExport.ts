import * as XLSX from 'xlsx';
import { storage } from '../storage';
import { Response } from 'express';

export interface TestReportData {
  testId: number;
  testTitle: string;
  teacherName: string;
  studentName: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  completedAt: Date;
  duration: string;
}

export const generateTestReportExcel = async (testId: number, res: Response) => {
  try {
    // Get test details
    const test = await storage.getTestById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test topilmadi' });
    }

    // Get teacher details
    const teacher = await storage.getUser(test.teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Ustoz ma\'lumotlari topilmadi' });
    }

    // Get all test attempts for this test
    const allAttempts = await storage.getTestAttemptsByTestId(testId);
    
    const reportData: TestReportData[] = [];

    for (const attempt of allAttempts) {
      // Get student details
      const student = await storage.getUser(attempt.studentId);
      if (!student) continue;

      // Calculate duration
      const duration = attempt.endTime && attempt.startTime 
        ? Math.round((attempt.endTime.getTime() - attempt.startTime.getTime()) / (1000 * 60)) 
        : 0;

      const percentage = attempt.totalQuestions > 0 
        ? Math.round((Number(attempt.totalCorrect || 0) / attempt.totalQuestions) * 100)
        : 0;

      reportData.push({
        testId: test.id,
        testTitle: test.title,
        teacherName: teacher.fullName,
        studentName: student.fullName,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: Number(attempt.totalCorrect || 0),
        score: Number(attempt.score || 0),
        percentage: percentage,
        completedAt: attempt.endTime || attempt.startTime,
        duration: `${duration} daqiqa`
      });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet data
    const worksheetData = [
      [
        'Test ID',
        'Test nomi',
        'Ustoz ismi',
        'O\'quvchi ismi',
        'Jami savollar',
        'To\'g\'ri javoblar',
        'Ball',
        'Foiz (%)',
        'Tugatilgan vaqt',
        'Davomiyligi'
      ],
      ...reportData.map(row => [
        row.testId,
        row.testTitle,
        row.teacherName,
        row.studentName,
        row.totalQuestions,
        row.correctAnswers,
        row.score,
        row.percentage,
        row.completedAt.toLocaleString('uz-UZ'),
        row.duration
      ])
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 10 }, // Test ID
      { width: 25 }, // Test nomi
      { width: 20 }, // Ustoz ismi
      { width: 20 }, // O'quvchi ismi
      { width: 15 }, // Jami savollar
      { width: 15 }, // To'g'ri javoblar
      { width: 10 }, // Ball
      { width: 10 }, // Foiz
      { width: 20 }, // Tugatilgan vaqt
      { width: 15 }  // Davomiyligi
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test hisoboti');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="test_hisoboti_${test.title}_${new Date().toLocaleDateString('uz-UZ')}.xlsx"`);

    // Send file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Excel fayl yaratishda xatolik yuz berdi' });
  }
};

export const generateStudentProgressExcel = async (studentId: number, res: Response) => {
  try {
    // Get student details
    const student = await storage.getUser(studentId);
    if (!student) {
      return res.status(404).json({ message: 'O\'quvchi topilmadi' });
    }

    // Get all student's test attempts
    const attempts = await storage.getTestAttemptsByStudentId(studentId);
    
    const reportData: any[] = [];

    for (const attempt of attempts) {
      // Get test details
      const test = await storage.getTestById(attempt.testId);
      if (!test) continue;

      // Get teacher details
      const teacher = await storage.getUser(test.teacherId);
      if (!teacher) continue;

      // Calculate duration
      const duration = attempt.endTime && attempt.startTime 
        ? Math.round((attempt.endTime.getTime() - attempt.startTime.getTime()) / (1000 * 60)) 
        : 0;

      const percentage = attempt.totalQuestions > 0 
        ? Math.round((Number(attempt.totalCorrect || 0) / attempt.totalQuestions) * 100)
        : 0;

      reportData.push({
        testTitle: test.title,
        teacherName: teacher.fullName,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: Number(attempt.totalCorrect || 0),
        score: Number(attempt.score || 0),
        percentage: percentage,
        status: attempt.status === 'completed' ? 'Tugatilgan' : 'Jarayonda',
        completedAt: attempt.endTime ? attempt.endTime.toLocaleString('uz-UZ') : 'Tugatilmagan',
        duration: `${duration} daqiqa`
      });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet data
    const worksheetData = [
      [
        'Test nomi',
        'Ustoz',
        'Jami savollar',
        'To\'g\'ri javoblar',
        'Ball',
        'Foiz (%)',
        'Holati',
        'Tugatilgan vaqt',
        'Davomiyligi'
      ],
      ...reportData.map(row => [
        row.testTitle,
        row.teacherName,
        row.totalQuestions,
        row.correctAnswers,
        row.score,
        row.percentage,
        row.status,
        row.completedAt,
        row.duration
      ])
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 25 }, // Test nomi
      { width: 20 }, // Ustoz
      { width: 15 }, // Jami savollar
      { width: 15 }, // To'g'ri javoblar
      { width: 10 }, // Ball
      { width: 10 }, // Foiz
      { width: 15 }, // Holati
      { width: 20 }, // Tugatilgan vaqt
      { width: 15 }  // Davomiyligi
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, `${student.fullName} - Taraqqiyot`);

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${student.fullName}_taraqqiyot_${new Date().toLocaleDateString('uz-UZ')}.xlsx"`);

    // Send file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Excel fayl yaratishda xatolik yuz berdi' });
  }
};