// components/MyJiras.js
'use client';
import { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCheckSquare, 
  faSquare, 
  faSpinner, 
  faSync,
  faPlus,
  faExternalLinkAlt,
  faExclamationTriangle,
  faClock,
  faChevronDown,
  faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import { useSession } from "next-auth/react";
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
};

// Status priority for sorting
const statusPriority = {
  'fix': 1,
  'awaiting production': 2,
  'in progress': 3,
  'develop': 4,
  'business': 5,
  'requirement': 6,
  'analysis': 7,
  'pending': 8,
  'sit': 9,
  'uat': 10,
  'deployed': 11,
  'production': 12,
  'done': 13,
  'closed': 14,
  'cancel': 15
};

export default function MyJiras({ userEmail, userName, compact = false, readOnly = false }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [issues, setIssues] = useState([]);
  const [internalJiraNumbers, setInternalJiraNumbers] = useState(new Set());
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [syncStats, setSyncStats] = useState({ new: 0, existing: 0 });

  const fetchJiras = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch external JIRAs
      console.log('🔍 Fetching JIRAs for email:', userEmail);
      const externalRes = await fetch(`/api/my-jiras?email=${encodeURIComponent(userEmail)}`);
      console.log('📡 External API response status:', externalRes.status);
      
      if (!externalRes.ok) {
        const errorData = await externalRes.json();
        console.error('❌ External API error:', errorData);
        throw new Error(errorData.error || "Failed to load JIRAs from external API");
      }
      const externalData = await externalRes.json();
      console.log('📊 External API data:', externalData);
      console.log('📋 Issues found:', externalData.issues?.length || 0);

      // Fetch internal JIRAs
      const internalRes = await fetch(`/api/jiras`);
      if (!internalRes.ok) {
        const errorData = await internalRes.json();
        throw new Error(errorData.message || "Failed to load internal JIRA numbers");
      }
      const internalData = await internalRes.json();
      
      setIssues(externalData.issues || []);
      const jiraNumbersFromInternalData = internalData.jiras ? internalData.jiras.map(jira => jira.jiraNumber) : [];
      setInternalJiraNumbers(new Set(jiraNumbersFromInternalData));
    } catch (err) {
      console.error('💥 Error in fetchJiras:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetchJiras();
    }
  }, [status, session, userEmail]);

  // Auto-sync untracked JIRAs
  const syncUntracked = async () => {
    const untrackedIssues = issues.filter(issue => 
      !internalJiraNumbers.has(issue.key) && 
      !['done', 'closed', 'cancel'].includes(issue.fields.status?.name?.toLowerCase())
    );

    if (untrackedIssues.length === 0) {
      toast.info('No untracked JIRAs to sync');
      return;
    }

    setSyncing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const issue of untrackedIssues) {
      try {
        const res = await fetch('/api/jiras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jiraNumber: issue.key,
            description: issue.fields.summary,
            projectName: issue.fields.project?.name || 'External JIRA',
            actualStatus: 'In Progress',
            assignee: issue.fields.assignee?.displayName || userEmail
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setSyncing(false);
    setSyncStats({ new: successCount, existing: errorCount });
    
    if (successCount > 0) {
      toast.success(`Synced ${successCount} JIRAs successfully!`);
      fetchJiras(); // Refresh data
    }
    if (errorCount > 0) {
      toast.error(`Failed to sync ${errorCount} JIRAs`);
    }
  };

  // Group and sort issues by status
  const { groupedIssues, activeIssues, completedIssues, untrackedCount, completedGroups } = useMemo(() => {
    const active = [];
    const completed = [];
    const statusGroups = {};
    const completedStatusGroups = {};
    let untracked = 0;

    // Define completed statuses
    const completedStatuses = ['done', 'closed', 'cancel', 'cancelled', 'deployed to production'];

    issues.forEach(issue => {
      const statusName = issue.fields.status?.name?.toLowerCase() || '';
      const originalStatusName = issue.fields.status?.name || 'No Status';
      const isTracked = internalJiraNumbers.has(issue.key);
      const isCompleted = completedStatuses.some(completedStatus => 
        statusName.includes(completedStatus)
      );
      
      if (!isTracked && !isCompleted) {
        untracked++;
      }

      // Group by original status name
      if (isCompleted) {
        // Put completed statuses in separate group
        if (!completedStatusGroups[originalStatusName]) {
          completedStatusGroups[originalStatusName] = [];
        }
        completedStatusGroups[originalStatusName].push(issue);
        completed.push(issue);
      } else {
        // Active statuses
        if (!statusGroups[originalStatusName]) {
          statusGroups[originalStatusName] = [];
        }
        statusGroups[originalStatusName].push(issue);
        active.push(issue);
      }
    });

    // Sort each status group by priority
    Object.keys(statusGroups).forEach(status => {
      statusGroups[status].sort((a, b) => {
        const priorityA = statusPriority[a.fields.status?.name?.toLowerCase()] || 999;
        const priorityB = statusPriority[b.fields.status?.name?.toLowerCase()] || 999;
        return priorityA - priorityB;
      });
    });

    Object.keys(completedStatusGroups).forEach(status => {
      completedStatusGroups[status].sort((a, b) => new Date(b.fields.updated) - new Date(a.fields.updated));
    });

    // Sort status groups by priority (lowest first)
    const sortedStatusGroups = Object.entries(statusGroups).sort(([statusA], [statusB]) => {
      const priorityA = statusPriority[statusA.toLowerCase()] || 999;
      const priorityB = statusPriority[statusB.toLowerCase()] || 999;
      return priorityA - priorityB;
    });

    const sortedCompletedGroups = Object.entries(completedStatusGroups).sort(([statusA], [statusB]) => {
      const priorityA = statusPriority[statusA.toLowerCase()] || 999;
      const priorityB = statusPriority[statusB.toLowerCase()] || 999;
      return priorityA - priorityB;
    });

    // Legacy sorting for backward compatibility
    active.sort((a, b) => {
      const priorityA = statusPriority[a.fields.status?.name?.toLowerCase()] || 999;
      const priorityB = statusPriority[b.fields.status?.name?.toLowerCase()] || 999;
      return priorityA - priorityB;
    });

    completed.sort((a, b) => new Date(b.fields.updated) - new Date(a.fields.updated));

    return { 
      groupedIssues: sortedStatusGroups, 
      activeIssues: active, 
      completedIssues: completed, 
      untrackedCount: untracked,
      completedGroups: sortedCompletedGroups
    };
  }, [issues, internalJiraNumbers]);

  // Quick add JIRA to tracking
  const quickAddJira = async (issue) => {
    try {
      const res = await fetch('/api/jiras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraNumber: issue.key,
          description: issue.fields.summary,
          projectName: issue.fields.project?.name || 'External JIRA',
          actualStatus: 'In Progress',
          assignee: issue.fields.assignee?.displayName || userEmail
        }),
      });

      if (res.ok) {
        toast.success(`Added ${issue.key} to tracking!`);
        fetchJiras();
      } else {
        throw new Error('Failed to add JIRA');
      }
    } catch (error) {
      toast.error(`Failed to add ${issue.key}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 border border-gray-300 rounded-lg">
        <div className="text-center py-4">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-black mb-2" />
          <p className="text-gray-600">Loading JIRAs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 border border-gray-300 rounded-lg">
        <div className="text-red-600 text-center py-4">{error}</div>
      </div>
    );
  }


  const IssueRowGrouped = ({ issue, isTracked }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="p-3 w-32">
        <a
          href={`https://${process.env.JIRA_DOMAIN}/browse/${issue.key}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-blue-600 hover:underline"
        >
          {issue.key}
        </a>
      </td>
      <td className="p-3 text-sm text-black">
        <div className="truncate whitespace-nowrap" title={issue.fields.summary}>
          {issue.fields.summary}
        </div>
      </td>
      <td className="p-3 w-20 text-xs text-gray-500  whitespace-nowrap">
        {formatDate(issue.fields.created)}
      </td>
      {!readOnly && (
        <td className="px-4 py-3 whitespace-nowrap text-center">
          {isTracked ? (
            <FontAwesomeIcon icon={faCheckSquare} className="text-green-600" />
          ) : (
            <button
              onClick={() => quickAddJira(issue)}
              className="text-gray-400 hover:text-black transition-colors"
              title="Add to tracking"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          )}
        </td>
      )}
    </tr>
  );

  const CompletedIssueRow = ({ issue, isTracked }) => (
    <tr className="hover:bg-gray-100 transition-colors opacity-75">
      <td className="px-4 py-3 whitespace-nowrap">
        <a
          href={`https://${process.env.JIRA_DOMAIN}/browse/${issue.key}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-gray-600 hover:underline flex items-center gap-1"
        >
          {issue.key}
          <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className={readOnly ? "" : "max-w-xs truncate"} title={issue.fields.summary}>
          {issue.fields.summary}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
        {formatDate(issue.fields.updated)}
      </td>
      {!readOnly && (
        <td className="px-4 py-3 whitespace-nowrap text-center">
          {isTracked ? (
            <FontAwesomeIcon icon={faCheckSquare} className="text-green-500" />
          ) : (
            <FontAwesomeIcon icon={faSquare} className="text-gray-300" />
          )}
        </td>
      )}
    </tr>
  );

  return (
    <div className="bg-white overflow-hidden border border-gray-300">
      {/* Clean Header */}
      <div className="border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-black">
              {activeIssues.length} Active
            </span>
            <span className="text-sm text-gray-500">
              {completedIssues.length} Done
            </span>
            {untrackedCount > 0 && (
              <span className="text-sm text-red-600">
                {untrackedCount} Untracked
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {completedGroups.length > 0 && (
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-sm text-gray-500 hover:text-black transition-colors"
              >
                {showCompleted ? 'Hide' : 'Show'} Done
              </button>
            )}
            {!readOnly && (
              <>
                <button
                  onClick={fetchJiras}
                  className="text-sm text-gray-500 hover:text-black transition-colors"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} />
                </button>
                {untrackedCount > 0 && (
                  <button
                    onClick={syncUntracked}
                    disabled={syncing}
                    className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {syncing ? 'Syncing...' : `Sync ${untrackedCount}`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active Issues */}
      {groupedIssues.length > 0 && (
        <div className="divide-y divide-gray-200">
          {groupedIssues.map(([statusName, statusIssues]) => (
            <div key={statusName}>
              <div className="bg-gray-50 border-b border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black">
                    {statusName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {statusIssues.length}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">JIRA</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Created</th>
                      {!readOnly && (
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Tracked</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statusIssues.map(issue => (
                      <IssueRowGrouped 
                        key={issue.key} 
                        issue={issue} 
                        isTracked={internalJiraNumbers.has(issue.key)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Issues (Hidden by Default) */}
      {showCompleted && completedGroups.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Completed Tasks</h3>
            <p className="text-xs text-gray-500">These tasks are no longer active but can be viewed for reference</p>
          </div>
          <div className="divide-y divide-gray-200">
            {completedGroups.map(([statusName, statusIssues]) => (
              <div key={statusName} className="p-6 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                  {statusName} ({statusIssues.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">JIRA</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Updated</th>
                        {!readOnly && (
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Tracked</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {statusIssues.map(issue => (
                        <CompletedIssueRow 
                          key={issue.key} 
                          issue={issue} 
                          isTracked={internalJiraNumbers.has(issue.key)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {issues.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No JIRAs assigned to you
        </div>
      )}
    </div>
  );
}