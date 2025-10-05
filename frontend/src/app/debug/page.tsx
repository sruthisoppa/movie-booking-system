// app/debug/page.tsx - ENHANCED VERSION
'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [authInfo, setAuthInfo] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Parse cookies manually
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    let parsedUser = null;
    if (cookies['user']) {
      try {
        parsedUser = JSON.parse(decodeURIComponent(cookies['user']));
      } catch (e) {
        console.error('Failed to parse user cookie:', e);
      }
    }

    setAuthInfo({
      localStorage: {
        token: token,
        user: user ? JSON.parse(user) : null
      },
      cookies: {
        raw: document.cookie,
        token: cookies['token'],
        user: cookies['user'],
        parsedUser: parsedUser
      },
      currentPath: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, []);

  const setTestAuth = () => {
    const testUser = {
      id: 1,
      name: 'Admin',
      email: 'admin@moviebook.com',
      role: 'admin'
    };
    
    // Set localStorage
    localStorage.setItem('user', JSON.stringify(testUser));
    localStorage.setItem('token', 'test-admin-token');
    
    // Set cookies with proper encoding
    const userCookieString = encodeURIComponent(JSON.stringify(testUser));
    document.cookie = `token=test-admin-token; path=/; max-age=86400; samesite=lax`;
    document.cookie = `user=${userCookieString}; path=/; max-age=86400; samesite=lax`;
    
    console.log('✅ Test auth data set');
    console.log('User cookie set as:', userCookieString);
    
    window.location.reload();
  };

  const testAdminAccess = () => {
    console.log('Testing admin access...');
    window.location.href = '/admin';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">LocalStorage</h3>
          <pre className="text-sm">{JSON.stringify(authInfo.localStorage, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Cookies</h3>
          <pre className="text-sm">{JSON.stringify(authInfo.cookies, null, 2)}</pre>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">Check These:</h3>
        <ul className="list-disc list-inside text-yellow-700 text-sm">
          <li>Are both token and user cookies present?</li>
          <li>Is the user cookie properly parsed?</li>
          <li>Does parsedUser show email: "admin@moviebook.com"?</li>
          <li>Check browser console for middleware logs</li>
        </ul>
      </div>
      
      <div className="space-x-4">
        <button 
          onClick={setTestAuth}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Set Test Auth Data
        </button>
        <button 
          onClick={testAdminAccess}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Try Admin Dashboard
        </button>
        <button 
          onClick={() => {
            localStorage.clear();
            document.cookie.split(";").forEach(c => {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear All Auth
        </button>
      </div>
    </div>
  );
}