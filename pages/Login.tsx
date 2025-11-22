import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { LOCAL_STORAGE_KEYS, APP_NAME } from '../constants';
import { Button } from '../components/Button';
import { ShieldCheck, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    const role = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ROLE);
    if (role === UserRole.ADMIN) navigate('/admin');
    if (role === UserRole.LECTURER) navigate('/lecturer');
  }, [navigate]);

  const handleLogin = (role: UserRole) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ROLE, role);
    navigate(role === UserRole.ADMIN ? '/admin' : '/lecturer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-indigo-100 mt-2">Smart Student Management System</p>
        </div>
        
        <div className="p-8">
          <p className="text-center text-gray-600 mb-8">Select your role to continue</p>
          
          <div className="space-y-4">
            <button
              onClick={() => handleLogin(UserRole.ADMIN)}
              className="w-full group relative flex items-center p-4 border-2 border-gray-100 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
              <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-semibold text-gray-900">Admin Portal</h3>
                <p className="text-sm text-gray-500">Manage batches, students & insights</p>
              </div>
            </button>

            <button
              onClick={() => handleLogin(UserRole.LECTURER)}
              className="w-full group relative flex items-center p-4 border-2 border-gray-100 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all duration-200"
            >
              <div className="bg-emerald-100 p-3 rounded-lg group-hover:bg-emerald-200 transition-colors">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-semibold text-gray-900">Lecturer Portal</h3>
                <p className="text-sm text-gray-500">Mark attendance for assigned classes</p>
              </div>
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
