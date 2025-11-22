import React, { useState, useEffect, useRef } from 'react';
import { Batch, Student } from '../types';
import { getBatches, saveBatch, saveStudents, getStudents, updateStudentPhoto } from '../services/storageService';
import { parseStudentListWithGemini } from '../services/geminiService';
import { Button } from '../components/Button';
import { Plus, Upload, FileText, Image as ImageIcon, Info } from 'lucide-react';

export const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  
  // Student Import State
  const [students, setStudents] = useState<Student[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = getBatches();
    setBatches(loaded);
    if (loaded.length > 0) {
      setSelectedBatchId(loaded[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      setStudents(getStudents(selectedBatchId));
    }
  }, [selectedBatchId]);

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    const newBatch: Batch = {
      id: crypto.randomUUID(),
      name: newBatchName,
      createdAt: new Date().toISOString()
    };

    saveBatch(newBatch);
    setBatches([...batches, newBatch]);
    setSelectedBatchId(newBatch.id);
    setNewBatchName('');
    setShowCreateModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBatchId) return;

    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      
      try {
        // Attempt to parse with Gemini
        const parsedStudents = await parseStudentListWithGemini(text, selectedBatchId);
        
        if (parsedStudents.length > 0) {
          saveStudents(parsedStudents);
          setStudents([...students, ...parsedStudents]);
          alert(`Successfully imported ${parsedStudents.length} students!`);
        } else {
          alert("No students found in file. Please ensure the file contains a list of names.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse file. Please try a simpler CSV or Text file.");
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handlePhotoUpload = (studentId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
       const base64 = reader.result as string;
       updateStudentPhoto(studentId, base64);
       // Update local state to reflect change immediately
       setStudents(prev => prev.map(s => s.id === studentId ? { ...s, photoUrl: base64 } : s));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-500">Create classes and upload student lists</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Batch
        </Button>
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Create New Batch</h3>
            <form onSubmit={handleCreateBatch}>
              <input 
                type="text" 
                placeholder="e.g. Computer Science 2024"
                className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={newBatchName}
                onChange={e => setNewBatchName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      {batches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar List of Batches */}
          <div className="bg-white rounded-xl shadow-sm p-4 h-fit border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4 px-2">Your Classes</h3>
            <ul className="space-y-1">
              {batches.map(batch => (
                <li key={batch.id}>
                  <button
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedBatchId === batch.id 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {batch.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Batch Details & Student List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {batches.find(b => b.id === selectedBatchId)?.name}
                </h2>
                <p className="text-sm text-gray-500">{students.length} Students Enrolled</p>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                    <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".csv,.txt" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    />
                    <Button 
                    variant="secondary" 
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isParsing}
                    title="Upload CSV with student names"
                    >
                    <Upload className="w-4 h-4 mr-2" /> 
                    {isParsing ? 'Analyzing File...' : 'Import List'}
                    </Button>
                </div>
                <p className="text-xs text-gray-400 flex items-center">
                    <Info className="w-3 h-3 mr-1"/> Accepts .csv or .txt (Convert Excel to CSV)
                </p>
              </div>
            </div>

            {/* Student Grid */}
            {students.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-gray-200">
                <div className="mx-auto bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No students yet</h3>
                <p className="text-gray-500 mt-1 mb-6 max-w-md mx-auto">
                    Upload a <b>CSV</b> or <b>Text</b> file containing student names. 
                    <br/>
                    <span className="text-xs">If you have an Excel file, please do "Save As > CSV" before uploading.</span>
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>Upload Student List</Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                 <ul className="divide-y divide-gray-100">
                   {students.map((student) => (
                     <li key={student.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="relative group w-12 h-12 flex-shrink-0">
                           {student.photoUrl ? (
                             <img src={student.photoUrl} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                           ) : (
                             <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                               {student.name.charAt(0)}
                             </div>
                           )}
                           {/* Hidden file input for photo */}
                           <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                              <ImageIcon className="w-5 h-5 text-white" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(student.id, e.target.files[0])}
                              />
                           </label>
                         </div>
                         <div>
                           <p className="text-sm font-medium text-gray-900">{student.name}</p>
                           <p className="text-xs text-gray-500 font-mono">{student.email || `ID: ${student.id.slice(0, 6)}`}</p>
                         </div>
                       </div>
                       <div className="text-xs text-gray-400">
                         {/* Placeholder for actions if needed */}
                       </div>
                     </li>
                   ))}
                 </ul>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};