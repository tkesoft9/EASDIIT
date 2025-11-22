export enum UserRole {
  ADMIN = 'ADMIN',
  LECTURER = 'LECTURER',
  NONE = 'NONE'
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string; // Base64 or Blob URL
  batchId: string;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE'
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  batchId: string;
  date: string; // ISO Date string
  status: AttendanceStatus;
  timestamp: number;
}

export interface AttendanceSummary {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
}

export interface ChartDataPoint {
  name: string;
  present: number;
  absent: number;
}
