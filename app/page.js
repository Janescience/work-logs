'use client';
import { useEffect, useState } from 'react';
import { 
  NeedAction, 
  DashboardStats, 
  RecentActivity,
  TaskTimeline,
  HolidaysDisplay,
  LoggingTracker
} from '@/components/dashboard';
import { MyJiras } from '@/components/jira';
import { PageHeader } from '@/components/ui';

import { useJiras } from '@/hooks/api';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { allJiras, isLoading: isInitialLoading, error: fetchError } = useJiras();
  const [isCrudLoading, setIsCrudLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (!session) {
    return null;
  }

  if (fetchError) {
    return <div className="p-4 bg-white text-red-500 min-h-screen">Error loading data: {fetchError}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto">

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-6">
            <PageHeader title="DASHBOARD" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-white border-b border-gray-200">
          <DashboardStats allJiras={allJiras} />
        </div>

        <div className="p-4 ">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 row-span-3">
              <NeedAction allJiras={allJiras} />
              <TaskTimeline allJiras={allJiras} className="mb-4"/>
              <MyJiras userEmail={session.user.email} />
            </div>
            <div className="overflow-y-auto">
              <LoggingTracker allJiras={allJiras} className="mb-4"/>
              <HolidaysDisplay className="mb-4"/>
              <RecentActivity allJiras={allJiras} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
