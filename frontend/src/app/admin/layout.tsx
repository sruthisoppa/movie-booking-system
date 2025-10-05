// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Don't show admin layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('Checking auth - Token:', token, 'User:', userData);
      
      if (!token || !userData) {
        console.log('No auth data, redirecting to login');
        router.push('/admin/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
          console.log('Not admin user, redirecting to login');
          router.push('/admin/login');
          return;
        }
        console.log('User authenticated:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.log('Error parsing user data:', error);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

 // In your app/admin/layout.tsx - Update the logout function
const handleLogout = () => {
  try {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    console.log('Logout successful, redirecting to login...');
    
    // Use window.location for reliable redirect
    window.location.href = '/admin/login';
    
    // OR if you prefer router, ensure it's properly handled
    // router.push('/admin/login');
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback redirect
    window.location.href = '/admin/login';
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
              
              <nav className="hidden md:flex space-x-6">
                <Link 
                  href="/admin" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/admin' 
                      ? 'bg-red-100 text-red-700 border-b-2 border-red-600' 
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin/movies" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.includes('/movies') 
                      ? 'bg-red-100 text-red-700 border-b-2 border-red-600' 
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Movies
                </Link>
                <Link 
                  href="/admin/cinemas" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.includes('/admin/cinemas') 
                      ? 'bg-red-100 text-red-700 border-b-2 border-red-600' 
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Cinemas
                </Link>
                {/*<Link 
                <Link 
                  href="/admin/screens" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.includes('/screens') 
                      ? 'bg-red-100 text-red-700 border-b-2 border-red-600' 
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Screens
                </Link>
                <Link 
                  href="/admin/shows" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.includes('/shows') 
                      ? 'bg-red-100 text-red-700 border-b-2 border-red-600' 
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Shows
                </Link>*/}
              </nav>
            </div>

            {/* Right side - User info and Logout */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, <strong>{user?.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}