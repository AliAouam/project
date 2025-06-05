// src/components/layout/Layout.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import DarkModeToggle from '../ui/DarkModeToggle';
import ThemeToggle from '../ui/ThemeToggle'


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Pages publiques où on ne veut PAS de header
  const isPublic = ['/login', '/register'].includes(pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Pour la tab active
  const isActive = (route: string) => pathname === route;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">

      {/* Header only on non-public pages */}
      {!isPublic && (
        <>
          {/* Logout top-right */}
            <div className="absolute top-6 right-10 z-30 flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>

          
          {/* --- Tab Navigation Centered --- */}
          <nav className="flex justify-center pt-10 pb-2 bg-gray-50 relative z-20">
            <div className="inline-flex gap-2 bg-white dark:bg-gray-800 px-2 py-2 rounded-full shadow-md border border-gray-200">
              <button
                onClick={() => navigate('/dashboard')}
                className={`px-5 py-2 rounded-full font-medium transition
                  ${isActive('/dashboard')
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
              >
                Dashboard
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className={`px-5 py-2 rounded-full font-medium transition
                    ${isActive('/admin')
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
                >
                  Admin
                </button>
              )}
            </div>
          </nav>
        </>
      )}

      {/* Main wrapper : centered for public, padded for others */}
      <main
        className={
          isPublic
            ? 'flex justify-center items-center py-20'
            : 'p-6'
        }
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
