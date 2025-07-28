// components/DailyLogsSummary.js
'use client';

const DailyLogsSummary = ({ stats }) => {
  const statItems = [
    { label: 'TOTAL', value: stats.totalTasks },
    { label: 'ACTIVE', value: stats.activeCount },
    { label: 'DONE', value: stats.doneCount },
    { label: 'MONTH', value: `${stats.monthHours.toFixed(1)}H` },
    { label: 'TODAY', value: `${stats.todayHours.toFixed(1)}H` },
    { label: 'WEEK', value: `${stats.weekHours.toFixed(1)}H` }
  ];

  return (
    <div className="">
      <div className="grid grid-cols-6 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-lg font-light text-black">
              {item.value}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyLogsSummary;