'use client';
import { useEffect, useState } from 'react';
import NeedAction from '@/components/NeedAction';
import DueDateAlert from '@/components/DueDateAlert.js';
import MyJiras from '@/components/MyJiras';
import WorkCalendar from '@/components/WorkCalendar';
import DashboardStats from '@/components/DashboardStats';
import RecentActivity from '@/components/RecentActivity';
import TaskDistribution from '@/components/TaskDistribution';
import WeeklyProgress from '@/components/WeeklyProgress';
import ProductivityInsights from '@/components/ProductivityInsights';

import useJiras from '@/hooks/useJiras';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
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
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-light text-black mb-4">Dashboard</h1>
          <div className="w-16 h-px bg-black mx-auto"></div>
        </div>
        
        {/* Welcome Message */}
        <div className="mb-6 text-center">
          <p className="text-gray-600 font-light">
            Welcome back, <span className=" text-black">{session.user.name.toUpperCase()}</span>
          </p>
        </div>

        {/* Stats Overview - New Component */}
        <div className="mb-6">
          <DashboardStats allJiras={allJiras} />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Progress Chart - New Component */}
            <WeeklyProgress allJiras={allJiras} />
            
            {/* Need Action Section */}
            <NeedAction allJiras={allJiras} />
            
            {/* Due Date Alert Section */}
            {/* <DueDateAlert allJiras={allJiras} /> */}

            <div className="mb-6">
              <MyJiras userEmail={session.user.email} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Productivity Insights */}
            <ProductivityInsights allJiras={allJiras} />
            {/* Task Distribution - New Component */}
            <TaskDistribution allJiras={allJiras} />
            
            {/* Recent Activity - New Component */}
            <RecentActivity allJiras={allJiras} />
          </div>
        </div>

      </div>
    </div>
  );
}