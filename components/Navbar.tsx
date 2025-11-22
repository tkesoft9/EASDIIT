import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { APP_NAME, LOCAL_STORAGE_KEYS } from '../constants';
import { LogOut, UserCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_ROLE);
    navigate('/');
  };

  const role = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ROLE);
  const isAuth = role && role !== UserRole.NONE;

  // Don't show navbar on login page
  if (location.pathname === '/') return null;

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0 left-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={role === UserRole.ADMIN ? '/admin' : '/lecturer'} className="flex items-center">
              <div className="bg-indigo-600 p-1.5 rounded-lg mr-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">{APP_NAME}</span>
            </Link>
            
            {role === UserRole.ADMIN && (
               <div className="hidden md:flex ml-10 space-x-8">
                 <Link to="/admin" className={`${location.pathname === '/admin' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-900'} px-1 py-5 text-sm font-medium transition-colors`}>Dashboard</Link>
                 <Link to="/admin/batches" className={`${location.pathname.includes('/batches') ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-900'} px-1 py-5 text-sm font-medium transition-colors`}>Batches & Students</Link>
               </div>
            )}
          </div>

          {isAuth && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <UserCircle size={16} />
                <span className="font-medium capitalize">{role?.toLowerCase()}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
