// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('Dashboard - Checking auth:', { token, userData });
      
      if (!token || !userData) {
        console.log('Dashboard - No auth, redirecting to login');
        router.push('/admin/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
          console.log('Dashboard - Not admin, redirecting');
          router.push('/admin/login');
          return;
        }
        console.log('Dashboard - User authenticated');
        setUser(parsedUser);
      } catch (error) {
        console.log('Dashboard - Error parsing user:', error);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, {user.name}!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-700 mb-2">Total Movies</h3>
          <p className="text-3xl font-bold text-red-600">NA</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-700 mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold text-red-600">NA</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-700 mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-red-600">NA</p>
        </div>
      </div>
    </div>
  );
}