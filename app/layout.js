// app/layout.js
// Removed 'use client' directive to allow metadata export
import '@/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

// Navbar and Sidebar will now be imported inside app/providers.js
// import Navbar from '@/components/Navbar';
// import Sidebar from '@/components/Sidebar';
import { ToastContainer } from 'react-toastify';
import Providers from './providers'; // Contains SessionProvider, Navbar, Sidebar, and state management

export const metadata = { // This metadata export is now allowed
  title: 'Work Logs',
  description: 'A simple work log application',
  manifest: '/manifest.json',
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export const viewport = { // This viewport export is now allowed
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  // State management (isSidebarOpen, toggleSidebar) has been moved to app/providers.js

  return (
    <html lang="en" className="dark">
      <body>
        {/* Providers component now wraps everything, including Navbar and Sidebar */}
        <Providers>
          {/* Main content area: Sidebar and Page Content (managed inside Providers) */}
          {/* The flex container and main content wrapper are now part of Providers to handle sidebar layout */}
          {children} {/* This is where your page content will be rendered */}
          {/* ToastContainer remains here as it doesn't depend on client state */}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
