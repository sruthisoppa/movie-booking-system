// app/admin/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          const userData = JSON.parse(user);
          if (userData.role === 'admin') {
            // Redirect to admin dashboard if already logged in
            router.push('/admin');
          }
        } catch {
          // Invalid user data, stay on login page
        }
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const adminCredentials = {
      email: 'admin@moviebook.com',
      password: 'admin123'
    };

    if (formData.email === adminCredentials.email && formData.password === adminCredentials.password) {
      const adminUser = { 
        id: 1, 
        name: 'Admin', 
        email: 'admin@moviebook.com', 
        role: 'admin' 
      };
      const adminToken = 'admin-auth-token';

      // Set localStorage
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('token', adminToken);
      
      // Set cookies properly for middleware
      const userCookie = encodeURIComponent(JSON.stringify(adminUser));
      document.cookie = `token=${adminToken}; path=/; max-age=86400; samesite=lax`;
      document.cookie = `user=${userCookie}; path=/; max-age=86400; samesite=lax`;
      
      console.log('Login successful, redirecting to admin dashboard');
      
      // Force reload to ensure middleware picks up the cookies
      window.location.href = '/admin';
    } else {
      setError('Invalid admin credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="absolute top-8 left-8">
        <Link 
          href="/"
          className="
            inline-flex items-center space-x-2 text-gray-600 
            hover:text-gray-900 hover:bg-gray-100 rounded-full 
            px-4 py-2 transition-all duration-200
          "
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </div>
      
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h2>
          <p className="text-gray-600">Sign in to admin dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <svg 
                className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="
                  w-full px-4 py-3 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-red-500 focus:border-red-500 
                  transition-all duration-200 placeholder-gray-400 text-gray-900
                "
                placeholder="admin@moviebook.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="
                  w-full px-4 py-3 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-red-500 focus:border-red-500 
                  transition-all duration-200 placeholder-gray-400 text-gray-900
                "
                placeholder="Enter admin password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex justify-center items-center py-3 px-4 
                border border-transparent text-sm font-medium rounded-lg 
                text-white bg-red-600 hover:bg-red-700 
                focus:ring-2 focus:ring-red-500 focus:ring-offset-2 
                transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
              "
            >
              {loading ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Demo Credentials:</h4>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> admin@moviebook.com<br />
              <strong>Password:</strong> admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}