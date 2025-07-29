'use client';
import { useEffect, useState } from 'react';
import { NeedAction, DashboardStats, RecentActivity, ProductivityInsights } from '@/components/dashboard';
import { MyJiras, TaskDistribution } from '@/components/jira';
import { WeeklyProgress } from '@/components/calendar';

import { useJiras } from '@/hooks/api';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userEmail = session?.user?.email;

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
        {/* Clean Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-xl font-light text-black">DASHBOARD</h1>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Today</div>
              <div className="text-sm text-black">{new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-white border-b border-gray-200">
          <DashboardStats allJiras={allJiras} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
          {/* Primary Content - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Progress Section */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-sm font-medium text-black">Weekly Progress</h2>
              </div>
              <div className="p-4">
                <WeeklyProgress allJiras={allJiras} />
              </div>
            </div>
            
            {/* Action Items */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-sm font-medium text-black">Action Required</h2>
              </div>
              <div className="p-4">
                <NeedAction allJiras={allJiras} />
              </div>
            </div>

            {/* My Tasks */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-sm font-medium text-black">My Tasks</h2>
              </div>
              <div className="p-4">
                <MyJiras userEmail={session.user.email} />
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-4">
            {/* Insights */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-sm font-medium text-black">Insights</h2>
              </div>
              <div className="p-4">
                <ProductivityInsights allJiras={allJiras} />
              </div>
            </div>

            {/* Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-sm font-medium text-black">Distribution</h2>
              </div>
              <div className="p-4">
                <TaskDistribution allJiras={allJiras} />
              </div>
            </div>
            
            {/* Activity */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-sm font-medium text-black">Recent Activity</h2>
              </div>
              <div className="p-4">
                <RecentActivity allJiras={allJiras} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}