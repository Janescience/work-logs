'use client';
import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faSpinner,
  faChevronDown,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { JiraItem } from '@/components/jira';

const CompactTaskListView = ({ jiras = [], externalStatuses = {} }) => {
  const [expandedJiras, setExpandedJiras] = useState(new Set());

  const toggleExpand = (jiraId) => {
    const newExpanded = new Set(expandedJiras);
    if (newExpanded.has(jiraId)) {
      newExpanded.delete(jiraId);
    } else {
      newExpanded.add(jiraId);
    }
    setExpandedJiras(newExpanded);
  };

  const processedJiras = useMemo(() => {
    return jiras.map(jira => {
      const totalHours = (jira.dailyLogs || []).reduce((sum, log) => sum + (log.timeSpent || 0), 0);

      return {
        ...jira,
        totalHours,
        logsCount: (jira.dailyLogs || []).length
      };
    });
  }, [jiras]);

  if (!processedJiras.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        No tasks found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {processedJiras.map(jira => {
        const isExpanded = expandedJiras.has(jira._id);
        const externalStatus = externalStatuses[jira.jiraNumber] || jira.actualStatus;

        return (
          <div key={jira._id} className="bg-white border border-gray-200 rounded">
            {/* Compact Header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(jira._id)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FontAwesomeIcon
                  icon={isExpanded ? faChevronDown : faChevronRight}
                  className="text-gray-400 text-xs shrink-0"
                />

                <div className="font-mono text-sm font-medium text-blue-600 shrink-0">
                  {jira.jiraNumber}
                </div>

                <div className="text-sm text-gray-900 truncate min-w-0 flex-1">
                  {jira.description}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {externalStatus && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {externalStatus}
                  </span>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FontAwesomeIcon icon={faClock} className="text-xs" />
                  <span>{jira.totalHours.toFixed(1)}h</span>
                </div>

                <div className="text-xs text-gray-500">
                  {jira.logsCount} logs
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                <JiraItem
                  jira={jira}
                  onAddLog={() => {}} // Read-only
                  onEditJira={() => {}} // Read-only
                  onDeleteJira={() => {}} // Read-only
                  onSelectTask={() => {}} // Read-only
                  isSelected={false}
                  externalStatus={externalStatus}
                  readOnly={true}
                  compact={true}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CompactTaskListView;