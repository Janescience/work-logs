// app/providers.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout';
import { FloatingQuickActions } from '@/components/dashboard';

const inter = Inter({ subsets: ['latin'] });

export default function Providers({ children }) {
  const pathname = usePathname();

  const noNavbarPaths = ['/login', '/register', '/denied'];
  const showNavbar = !noNavbarPaths.includes(pathname);

  return (
    <SessionProvider>
      <div className={inter.className}>
        
        <FloatingQuickActions />

        {/* Conditionally render navbar and main content layout */}
        {showNavbar ? (
          <>
            <Navbar /> 
            <main className="pt-16 min-h-screen bg-white">
              {children}
            </main>
          </>
        ) : (
          // Layout without navbar (for login, register, etc.)
          <main className="min-h-screen bg-white">
            {children}
          </main>
        )}
      </div>
    </SessionProvider>
  );
}
