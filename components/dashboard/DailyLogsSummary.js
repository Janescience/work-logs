// components/DailyLogsSummary.js
'use client';
import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCalendarAlt,
  faChartLine,
  faRocket,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { useWorkingDays } from '@/hooks/useWorkingDays';

const DailyLogsSummary = ({ stats, externalStatuses = {}, allJiras = [] }) => {
  const { getCurrentMonthWorkingDays, getWorkingDaysPassed, getWorkingHoursCapacity } = useWorkingDays();
  const [isProductionExpanded, setIsProductionExpanded] = useState(false);

  const enhancedStats = useMemo(() => {
    // Default stats if not provided
    const defaultStats = {
      monthHours: 0
    };

    const currentStats = stats || defaultStats;

    // Calculate working days and expected hours
    const totalWorkingDays = getCurrentMonthWorkingDays(true);
    const workedDays = getWorkingDaysPassed(true);
    const expectedTotalHours = getWorkingHoursCapacity(totalWorkingDays, 8);
    const expectedWorkedHours = getWorkingHoursCapacity(workedDays, 8);
    const actualHours = currentStats.monthHours || 0;

    // Calculate progress percentage
    const progressPercentage = expectedTotalHours > 0 ? (actualHours / expectedTotalHours) * 100 : 0;

    // Count and collect production statuses with descriptions
    const productionJiras = externalStatuses ? Object.entries(externalStatuses)
      .filter(([jiraNumber, status]) => status && status.toLowerCase().includes('production'))
      .map(([jiraNumber, status]) => {
        const jira = allJiras.find(j => j.jiraNumber === jiraNumber);
        return {
          jiraNumber,
          status,
          description: jira?.description || 'No description available'
        };
      }) : [];

    return {
      ...currentStats,
      totalWorkingDays,
      workedDays,
      expectedTotalHours,
      expectedWorkedHours,
      actualHours,
      progressPercentage,
      productionCount: productionJiras.length,
      productionJiras
    };
  }, [stats, externalStatuses, allJiras, getCurrentMonthWorkingDays, getWorkingDaysPassed, getWorkingHoursCapacity]);


  const statItems = [
    {
      label: 'THIS MONTH',
      value: `${enhancedStats.actualHours.toFixed(1)}h`,
      subtext: 'logged hours',
      icon: faCalendarAlt,
      color: 'text-purple-600',
      progress: enhancedStats.progressPercentage
    },
    ...(enhancedStats.productionCount > 0 ? [{
      label: 'PRODUCTION',
      value: enhancedStats.productionCount,
      subtext: 'ready to deploy',
      icon: faRocket,
      color: 'text-green-600',
      isProduction: true,
      expandable: true
    }] : [])
  ];

  return (
    <div className="px-4 py-2">
      <div className="w-full space-y-4">
        {statItems.map((item, index) => (
          <div key={index} className="p-4 bg-white border border-gray-200 hover:shadow-sm transition-shadow rounded-lg">
            <div
              className={`flex items-center justify-between mb-2 ${item.expandable ? 'cursor-pointer' : ''}`}
              onClick={item.expandable ? () => setIsProductionExpanded(!isProductionExpanded) : undefined}
            >
              <div className="flex items-center">
                <FontAwesomeIcon icon={item.icon} className={`text-lg ${item.color} mr-2`} />
                <div>
                  <div className="text-xl font-bold text-black">
                    {item.value}
                  </div>
                  <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {item.label}
                  </div>
                </div>
              </div>
              <div className="flex items-center text-right text-xs text-gray-500">
                <span className="mr-2">{item.subtext}</span>
                {item.expandable && (
                  <FontAwesomeIcon
                    icon={isProductionExpanded ? faChevronUp : faChevronDown}
                    className="text-gray-400"
                  />
                )}
              </div>
            </div>

            {/* Show progress bar only for non-production items */}
            {!item.isProduction && (
              <>
                {/* Animated Fire Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2 relative overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{
                      width: `${Math.min(item.progress || 0, 100)}%`,
                      background: 'linear-gradient(90deg, #FF6B35, #F7931E, #FFD23F, #FF6B35)',
                      backgroundSize: '200% 100%',
                      animation: 'fireFlow 2s ease-in-out infinite'
                    }}
                  >
                    {/* Fire particles effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-500 to-yellow-400 opacity-60 animate-pulse"></div>
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
                    ></div>
                  </div>
                </div>

                <style jsx>{`
                  @keyframes fireFlow {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                  }

                  @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                `}</style>

                {/* Progress Details */}
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>{enhancedStats.actualHours.toFixed(1)}h / {enhancedStats.expectedTotalHours.toFixed(1)}h</span>
                  <span>{(item.progress || 0).toFixed(1)}% • {enhancedStats.workedDays}/{enhancedStats.totalWorkingDays} days</span>
                </div>
              </>
            )}

            {/* Show production JIRA list - Collapsible */}
            {item.isProduction && isProductionExpanded && enhancedStats.productionJiras && enhancedStats.productionJiras.length > 0 && (
              <div className="mt-3 space-y-2">
                {enhancedStats.productionJiras.map(({ jiraNumber, status, description }) => (
                  <div key={jiraNumber} className="p-2 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <a
                          href={`https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/browse/${jiraNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-green-800 font-medium hover:text-green-600 hover:underline transition-colors mr-3 shrink-0"
                        >
                          {jiraNumber}
                        </a>
                        <div className="text-xs text-gray-700 truncate min-w-0">
                          {description}
                        </div>
                      </div>
                      <span className="text-xs text-green-600 px-2 py-1 bg-green-100 rounded ml-2 shrink-0">{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyLogsSummary;