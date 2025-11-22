import React, { useState, useEffect, useMemo } from 'react';
import { getBatches, getStudents, getAttendance } from '../services/storageService';
import { generateAttendanceInsights } from '../services/geminiService';
import { Batch, Student, AttendanceRecord, AttendanceStatus, ChartDataPoint } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Sparkles, TrendingUp, Users, Calendar, AlertCircle, Download, Filter } from 'lucide-react';
import { Button } from '../components/Button';

export const AdminDashboard: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  
  // Date Filter State
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
    end: new Date().toISOString().split('T')[0]
  });

  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const loadedBatches = getBatches();
    setBatches(loadedBatches);
    if (loadedBatches.length > 0) {
      setSelectedBatchId(loadedBatches[0].id);
    }
  }, []);

  // Load Batch Data when selection changes
  useEffect(() => {
    if (selectedBatchId) {
      setAllStudents(getStudents(selectedBatchId));
      setAllRecords(getAttendance(selectedBatchId));
      setAiInsight(''); // Reset insight
    }
  }, [selectedBatchId]);

  // Process Data based on Filters
  const { stats, studentStats, chartData, atRiskStudents } = useMemo(() => {
    // Filter records by date range
    const filteredRecords = allRecords.filter(r => 
      r.date >= dateRange.start && r.date <= dateRange.end
    );

    // 1. Chart Data (Daily Trend)
    const groupedByDate: Record<string, { present: number; absent: number }> = {};
    filteredRecords.forEach(r => {
      if (!groupedByDate[r.date]) groupedByDate[r.date] = { present: 0, absent: 0 };
      if (r.status === AttendanceStatus.PRESENT) groupedByDate[r.date].present++;
      else groupedByDate[r.date].absent++;
    });

    const chartData: ChartDataPoint[] = Object.keys(groupedByDate)
      .sort()
      .map(date => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: groupedByDate[date].present,
        absent: groupedByDate[date].absent
      }));

    // 2. Student Stats
    const uniqueDates = new Set(filteredRecords.map(r => r.date));
    const totalClasses = uniqueDates.size;

    const studentStats = allStudents.map(student => {
      const studentRecords = filteredRecords.filter(r => r.studentId === student.id);
      const presentCount = studentRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
      // Absent count includes explicit absent OR missing records if we assume strict daily attendance, 
      // but for flexibility, we count explicit records in this filtered view.
      // To be more accurate, absence = totalClasses - presentCount (assuming they should be there every time)
      
      // Let's use explicit records for now to handle "Late" or other future statuses if needed, 
      // but usually Attendance Rate = Present / Total Classes Held
      
      const rate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
      
      return {
        ...student,
        presentCount,
        absentCount: totalClasses - presentCount, // Assuming they should have been there
        rate
      };
    }).sort((a, b) => a.rate - b.rate); // Sort by lowest attendance first

    // 3. Overall Stats
    const totalPresent = filteredRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const totalPossible = totalClasses * allStudents.length;
    const overallRate = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0;

    // 4. At Risk (Below 75%)
    const atRiskStudents = studentStats.filter(s => s.rate < 75 && totalClasses > 0);

    return {
      stats: {
        totalClasses,
        overallRate,
        totalPresent,
        atRiskCount: atRiskStudents.length
      },
      studentStats,
      chartData,
      atRiskStudents
    };
  }, [allRecords, allStudents, dateRange]);

  const handleGenerateInsight = async () => {
    if (!selectedBatchId) return;
    
    setIsLoadingInsight(true);
    const batchName = batches.find(b => b.id === selectedBatchId)?.name || 'Unknown Batch';
    
    try {
      // Prepare data for AI
      const insight = await generateAttendanceInsights(
        batchName,
        { totalClasses: stats.totalClasses, attendanceRate: stats.overallRate },
        chartData.slice(-7), // Send last 7 days of current filtered view
        atRiskStudents.map(s => ({ name: s.name, rate: s.rate, absentCount: s.absentCount }))
      );
      setAiInsight(insight);
    } catch (error) {
      setAiInsight("Failed to generate insights.");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  if (batches.length === 0) {
    return (
      <div className="pt-24 px-4 text-center">
         <div className="bg-white p-10 rounded-2xl shadow-sm max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800">Welcome to SmartAttend</h2>
            <p className="text-gray-500 mt-2">Get started by creating your first batch.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
            <p className="text-gray-500 text-sm">Monitor student performance and trends</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
             <div className="w-full md:w-64">
               <label className="block text-xs font-medium text-gray-500 mb-1">Select Batch</label>
               <select 
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md border"
               >
                 {batches.map(b => (
                   <option key={b.id} value={b.id}>{b.name}</option>
                 ))}
               </select>
             </div>
             
             <div className="flex gap-2 items-end">
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                 <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="block w-full py-2 px-3 text-sm border-gray-300 rounded-md border focus:ring-indigo-500 focus:border-indigo-500"
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                 <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="block w-full py-2 px-3 text-sm border-gray-300 rounded-md border focus:ring-indigo-500 focus:border-indigo-500"
                 />
               </div>
               <div className="pb-2 text-gray-400">
                 <Filter size={20} />
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow-sm rounded-xl p-5 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Classes Conducted</dt>
              <dd className="text-2xl font-bold text-gray-900">{stats.totalClasses}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-xl p-5 border border-gray-100">
           <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Avg Attendance</dt>
              <dd className="text-2xl font-bold text-gray-900">{stats.overallRate.toFixed(1)}%</dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-xl p-5 border border-gray-100">
           <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5">
              <dt className="text-sm font-medium text-gray-500 truncate">At Risk Students</dt>
              <dd className="text-2xl font-bold text-red-600">{stats.atRiskCount}</dd>
            </div>
          </div>
        </div>
         
        {/* AI Insight Trigger */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 overflow-hidden shadow-sm rounded-xl text-white">
           <div className="p-5 h-full flex flex-col justify-center items-start">
             <h3 className="font-semibold flex items-center mb-2">
               <Sparkles className="w-4 h-4 mr-2 text-yellow-300" /> AI Insights
             </h3>
             {aiInsight ? (
               <p className="text-xs text-indigo-100 line-clamp-3">{aiInsight}</p>
             ) : (
               <Button 
                onClick={handleGenerateInsight}
                isLoading={isLoadingInsight}
                size="sm"
                className="w-full bg-white/10 hover:bg-white/20 border-transparent text-white"
               >
                 Analyze Trends
               </Button>
             )}
           </div>
        </div>
      </div>

      {/* Insight Full View (if generated) */}
      {aiInsight && (
        <div className="bg-white border-l-4 border-purple-500 shadow-sm rounded-r-xl p-6 mb-8 animate-fade-in">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                <div className="mt-2 text-gray-600 prose prose-sm max-w-none">
                  {aiInsight.split('\n').map((line, i) => (
                    <p key={i} className="mb-1">{line}</p>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setAiInsight('')} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="bg-white shadow-sm rounded-xl p-6 lg:col-span-2 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance Trend</h3>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    cursor={{ fill: '#F9FAFB' }}
                  />
                  <Legend />
                  <Bar dataKey="present" name="Present" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="absent" name="Absent" fill="#FECACA" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No attendance records in this range.
              </div>
            )}
          </div>
        </div>

        {/* At Risk List (Sidebar) */}
        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" /> Critical Attention
          </h3>
          <div className="overflow-y-auto max-h-80 pr-2 space-y-3">
            {atRiskStudents.length === 0 ? (
              <p className="text-gray-500 text-sm">Great! No students are below 75% attendance.</p>
            ) : (
              atRiskStudents.map(student => (
                <div key={student.id} className="flex items-center p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-bold text-sm">
                    {student.photoUrl ? (
                      <img src={student.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : student.name.charAt(0)}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-red-600 font-medium">{student.rate.toFixed(1)}% Attendance</p>
                  </div>
                  <div className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
                    {student.absentCount} Absent
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Student Table */}
      <div className="mt-8 bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Detailed Student Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentStats.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {student.photoUrl ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={student.photoUrl} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {student.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.email || 'ID: ' + student.id.slice(0,8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 font-medium w-12">{student.rate.toFixed(0)}%</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full ml-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${student.rate >= 75 ? 'bg-green-500' : student.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${student.rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.presentCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.absentCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.rate >= 75 
                        ? 'bg-green-100 text-green-800' 
                        : student.rate >= 60 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {student.rate >= 75 ? 'Good' : student.rate >= 60 ? 'Warning' : 'Critical'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};