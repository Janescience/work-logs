'use client';
import { useEffect, useState } from 'react';
import { 
  NeedAction, 
  DashboardStats, 
  RecentActivity, 
  ProductivityInsights,
  TimeTrackingCharts,
  ProjectTimeline,
  BurndownChart,
  WorkloadBalance,
  MonthlySummary
} from '@/components/dashboard';
import { MyJiras, TaskDistribution } from '@/components/jira';
import { WeeklyProgress } from '@/components/calendar';
import { PageHeader } from '@/components/ui';

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
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto px-6 py-8">
            <PageHeader title="DASHBOARD" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-white border-b border-gray-200">
          <DashboardStats allJiras={allJiras} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
          {/* Left Column - Primary Content (2 columns width) */}
          <div className="lg:col-span-2 space-y-4">
            <WeeklyProgress allJiras={allJiras} />
            <NeedAction allJiras={allJiras} />
            <MyJiras userEmail={session.user.email} />
          </div>

          {/* Middle Column - Analytics (2 columns width) */}
          <div className="lg:col-span-2 space-y-4">
            <TimeTrackingCharts allJiras={allJiras} />
            <BurndownChart allJiras={allJiras} />
            <ProjectTimeline allJiras={allJiras} />
          </div>

          {/* Right Column - Insights (1 column width) */}
          <div className="lg:col-span-1 space-y-4">
            <ProductivityInsights allJiras={allJiras} />
            <MonthlySummary allJiras={allJiras} />
            <WorkloadBalance allJiras={allJiras} />
            <TaskDistribution allJiras={allJiras} />
            <RecentActivity allJiras={allJiras} />
          </div>
        </div>

      </div>
    </div>
  );
}