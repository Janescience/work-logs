// app/providers.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import FloatingQuickActions from '@/components/FloatingQuickActions'; // เพิ่มบรรทัดนี้

const inter = Inter({ subsets: ['latin'] });

export default function Providers({ children }) {
  const pathname = usePathname();

  const noSidebarPaths = ['/login', '/register', '/denied'];
  const showSidebar = !noSidebarPaths.includes(pathname); // Still used to determine overall layout

  return (
    <SessionProvider>
      <div className={inter.className}>
        
        <FloatingQuickActions />

        {/* Conditionally render sidebar and main content layout */}
        {showSidebar ? (
          <>
            <Navbar /> 
            <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] mt-12">
              <Sidebar /> {/* No longer passes isSidebarOpen */}
              <main
                // Main content always has left margin for sidebar on md screens and up
                className={`flex-grow p-4 dark:bg-gray-900 dark:text-gray-100 overflow-auto md:ml-44`}
              >
                {children}
              </main>
            </div>
          </>
          
        ) : (
          // Layout without sidebar (for login, register, etc.)
          <main className="min-h-screen dark:bg-gray-900 dark:text-gray-100">
            {children}
          </main>
        )}
      </div>
    </SessionProvider>
  );
}
