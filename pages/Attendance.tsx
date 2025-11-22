import React, { useState, useEffect } from 'react';
import { getBatches, getStudents, saveAttendance } from '../services/storageService';
import { Batch, Student, AttendanceStatus, AttendanceRecord } from '../types';
import { Button } from '../components/Button';
import { CheckCircle, XCircle, Save, Calendar } from 'lucide-react';

export const Attendance: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  
  // Temporary state map: studentId -> status
  const [markingState, setMarkingState] = useState<Record<string, AttendanceStatus>>({});
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loaded = getBatches();
    setBatches(loaded);
    if (loaded.length > 0) {
      setSelectedBatchId(loaded[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      const batchStudents = getStudents(selectedBatchId);
      setStudents(batchStudents);
      // Reset marking state
      const initial: Record<string, AttendanceStatus> = {};
      batchStudents.forEach(s => initial[s.id] = AttendanceStatus.PRESENT); // Default present
      setMarkingState(initial);
      setIsSaved(false);
    }
  }, [selectedBatchId]);

  const toggleStatus = (studentId: string) => {
    setMarkingState(prev => ({
      ...prev,
      [studentId]: prev[studentId] === AttendanceStatus.PRESENT ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT
    }));
    setIsSaved(false);
  };

  const handleSubmit = () => {
    const records: AttendanceRecord[] = students.map(s => ({
      id: crypto.randomUUID(),
      studentId: s.id,
      batchId: selectedBatchId,
      date: date,
      status: markingState[s.id],
      timestamp: Date.now()
    }));

    saveAttendance(records);
    setIsSaved(true);
    
    // Auto-hide success message after 3s
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (batches.length === 0) {
    return <div className="pt-24 text-center text-gray-500">No batches available. Ask Admin to create one.</div>;
  }

  return (
    <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 sticky top-20 z-20 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
            <p className="text-gray-500 text-sm">Select a class and tap cards to toggle status</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <select 
               className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
               value={selectedBatchId}
               onChange={e => setSelectedBatchId(e.target.value)}
             >
               {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
             <input 
               type="date"
               className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
               value={date}
               onChange={e => setDate(e.target.value)}
             />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {students.map(student => {
          const isPresent = markingState[student.id] === AttendanceStatus.PRESENT;
          return (
            <div 
              key={student.id}
              onClick={() => toggleStatus(student.id)}
              className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 flex items-center gap-4 group select-none ${
                isPresent 
                  ? 'bg-white border-gray-200 hover:border-indigo-300' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="relative">
                {student.photoUrl ? (
                    <img src={student.photoUrl} alt="" className={`w-12 h-12 rounded-full object-cover ${!isPresent && 'grayscale'}`} />
                ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isPresent ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                        {student.name.charAt(0)}
                    </div>
                )}
                <div className={`absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 ${isPresent ? 'text-green-500' : 'text-red-500'}`}>
                    {isPresent ? <CheckCircle size={16} fill="currentColor" className="text-white" /> : <XCircle size={16} fill="currentColor" className="text-white" />}
                </div>
              </div>
              
              <div>
                <p className={`font-medium ${isPresent ? 'text-gray-900' : 'text-red-800'}`}>{student.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPresent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isPresent ? 'Present' : 'Absent'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-30">
        <button 
          onClick={handleSubmit}
          disabled={isSaved || students.length === 0}
          className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 ${
            isSaved 
            ? 'bg-green-600 text-white cursor-default' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isSaved ? (
             <>Saved Successfully <CheckCircle size={20}/></>
          ) : (
             <>Submit Attendance <Save size={20}/></>
          )}
        </button>
      </div>
    </div>
  );
};
