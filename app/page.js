'use client';
import { useEffect, useState } from 'react'; // Keep useState for isCrudLoading, even if not directly used for display in this simplified dashboard
import NeedAction from '@/components/NeedAction';
import DueDateAlert from '@/components/DueDateAlert.js';
import MyJiras from '@/components/MyJiras';
import WorkCalendar from '@/components/WorkCalendar';

import useJiras from '@/hooks/useJiras';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userEmail = session?.user?.email;

  // Fetch allJiras here since NeedAction and DueDateAlert depend on it
  const { allJiras, isLoading: isInitialLoading, error: fetchError } = useJiras();
  const [isCrudLoading, setIsCrudLoading] = useState(false); // Keep for consistency, though not used for CRUD in this dashboard view

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (!session) {
    return null; // Redirect handled by useEffect
  }

  // If there's an error fetching Jiras, display it
  if (fetchError) {
    return <div className="p-4 bg-white text-red-500 min-h-screen">Error loading data: {fetchError}</div>;
  }

  return (
    // Apply the new black/white theme for the main container
    <div className="min-h-screen bg-white p-6">
      <div className=" mx-auto"> {/* Centering container */}
        {/* Header - Styled to match DailyLogsPage header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-light text-black mb-4">Dashboard</h1>
          <div className="w-16 h-px bg-black mx-auto"></div> {/* Divider */}
        </div>
        
        {/* My Jiras Section */}
        <div className="mb-6">
          <MyJiras userEmail={userEmail} /> {/* Assuming MyJiras might need allJiras as a prop now, if it didn't fetch internally */}
        </div>

        <div className="mb-6">
          <WorkCalendar allJiras={allJiras} />
        </div>

        {/* Need Action Section */}
        <div className="mb-6">
          <NeedAction allJiras={allJiras} />
        </div>

        {/* Due Date Alert Section */}
        <div className="mb-6">
          <DueDateAlert allJiras={allJiras} />
        </div>

      </div>
    </div>
  );
}
