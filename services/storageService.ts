import { Batch, Student, AttendanceRecord, AttendanceStatus, AttendanceSummary, ChartDataPoint } from '../types';
import { LOCAL_STORAGE_KEYS } from '../constants';

// --- Batches ---
export const getBatches = (): Batch[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.BATCHES);
  return stored ? JSON.parse(stored) : [];
};

export const saveBatch = (batch: Batch): void => {
  const batches = getBatches();
  batches.push(batch);
  localStorage.setItem(LOCAL_STORAGE_KEYS.BATCHES, JSON.stringify(batches));
};

// --- Students ---
export const getStudents = (batchId?: string): Student[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.STUDENTS);
  const allStudents: Student[] = stored ? JSON.parse(stored) : [];
  if (batchId) {
    return allStudents.filter(s => s.batchId === batchId);
  }
  return allStudents;
};

export const saveStudents = (newStudents: Student[]): void => {
  const existing = getStudents();
  const updated = [...existing, ...newStudents];
  localStorage.setItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
};

export const updateStudentPhoto = (studentId: string, photoUrl: string): void => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    students[index].photoUrl = photoUrl;
    localStorage.setItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }
};

// --- Attendance ---
export const getAttendance = (batchId?: string): AttendanceRecord[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.ATTENDANCE);
  const allRecords: AttendanceRecord[] = stored ? JSON.parse(stored) : [];
  if (batchId) {
    return allRecords.filter(r => r.batchId === batchId);
  }
  return allRecords;
};

export const saveAttendance = (records: AttendanceRecord[]): void => {
  const existing = getAttendance();
  // Remove existing records for the same student on the same date to prevent duplicates
  const newRecordKeys = new Set(records.map(r => `${r.studentId}-${r.date}`));
  const filteredExisting = existing.filter(r => !newRecordKeys.has(`${r.studentId}-${r.date}`));
  
  const updated = [...filteredExisting, ...records];
  localStorage.setItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
};

// --- Analytics Helpers ---
export const getBatchStats = (batchId: string): AttendanceSummary => {
  const students = getStudents(batchId);
  const records = getAttendance(batchId);
  
  if (students.length === 0 || records.length === 0) {
    return { totalClasses: 0, presentCount: 0, absentCount: 0, attendanceRate: 0 };
  }

  // Calculate unique dates to determine total classes
  const uniqueDates = new Set(records.map(r => r.date));
  const totalClasses = uniqueDates.size;
  
  const presentCount = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
  const absentCount = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
  
  const totalPossibleRecords = records.length; // Or totalClasses * students.length
  const attendanceRate = totalPossibleRecords > 0 ? (presentCount / totalPossibleRecords) * 100 : 0;

  return {
    totalClasses,
    presentCount,
    absentCount,
    attendanceRate
  };
};

export const getChartData = (batchId: string): ChartDataPoint[] => {
    const records = getAttendance(batchId);
    const groupedByDate: Record<string, { present: number, absent: number }> = {};

    records.forEach(r => {
        if (!groupedByDate[r.date]) {
            groupedByDate[r.date] = { present: 0, absent: 0 };
        }
        if (r.status === AttendanceStatus.PRESENT) groupedByDate[r.date].present++;
        else groupedByDate[r.date].absent++;
    });

    return Object.keys(groupedByDate).map(date => ({
        name: date,
        present: groupedByDate[date].present,
        absent: groupedByDate[date].absent
    })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()).slice(-7); // Last 7 sessions
};
