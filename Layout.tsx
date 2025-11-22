import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};
