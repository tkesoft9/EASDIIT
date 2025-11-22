export const APP_NAME = "SmartAttend";
export const LOCAL_STORAGE_KEYS = {
  STUDENTS: 'smartattend_students',
  BATCHES: 'smartattend_batches',
  ATTENDANCE: 'smartattend_attendance',
  USER_ROLE: 'smartattend_user_role'
};

export const MOCK_BATCHES = [
  { id: 'b1', name: 'Computer Science 2024 - A', description: 'Morning Batch', createdAt: new Date().toISOString() },
  { id: 'b2', name: 'Business Admin 2024 - B', description: 'Evening Batch', createdAt: new Date().toISOString() }
];
