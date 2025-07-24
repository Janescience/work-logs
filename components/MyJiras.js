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

export default function MyJiras({ userEmail, compact = false }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [issues, setIssues] = useState([]);
  const [internalJiraNumbers, setInternalJiraNumbers] = useState(new Set());
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [syncStats, setSyncStats] = useState({ new: 0, existing: 0 });

  const fetchJiras = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch external JIRAs
      const externalRes = await fetch(`/api/my-jiras?email=${encodeURIComponent(userEmail)}`);
      if (!externalRes.ok) {
        const errorData = await externalRes.json();
        throw new Error(errorData.error || "Failed to load JIRAs from external API");
      }
      const externalData = await externalRes.json();

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

  // Group and sort issues
  const { activeIssues, completedIssues, untrackedCount } = useMemo(() => {
    const active = [];
    const completed = [];
    let untracked = 0;

    issues.forEach(issue => {
      const statusName = issue.fields.status?.name?.toLowerCase() || '';
      const isTracked = internalJiraNumbers.has(issue.key);
      
      if (!isTracked && !['done', 'closed', 'cancel'].includes(statusName)) {
        untracked++;
      }

      if (['done', 'closed', 'cancel'].includes(statusName)) {
        completed.push(issue);
      } else {
        active.push(issue);
      }
    });

    // Sort by priority
    active.sort((a, b) => {
      const priorityA = statusPriority[a.fields.status?.name?.toLowerCase()] || 999;
      const priorityB = statusPriority[b.fields.status?.name?.toLowerCase()] || 999;
      return priorityA - priorityB;
    });

    completed.sort((a, b) => new Date(b.fields.updated) - new Date(a.fields.updated));

    return { activeIssues: active, completedIssues: completed, untrackedCount: untracked };
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

  const IssueRow = ({ issue, isTracked }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap">
        <a
          href={`https://generalith.atlassian.net/browse/${issue.key}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          {issue.key}
          <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        <div className="max-w-xs truncate" title={issue.fields.summary}>
          {issue.fields.summary}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded-full ${
          issue.fields.status?.name?.toLowerCase().includes('done') ? 'bg-green-100 text-green-800' :
          issue.fields.status?.name?.toLowerCase().includes('progress') ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {issue.fields.status?.name || '-'}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
        {formatDate(issue.fields.created)}
      </td>
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
    </tr>
  );

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-light text-black">My JIRAs</h2>
            <p className="text-sm text-gray-600 mt-1">
              {activeIssues.length} active, {completedIssues.length} completed
              {untrackedCount > 0 && (
                <span className="ml-2 text-orange-600">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                  {untrackedCount} untracked
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchJiras}
              className="px-3 py-1 text-sm text-gray-600 hover:text-black transition-colors"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} />
            </button>
            {untrackedCount > 0 && (
              <button
                onClick={syncUntracked}
                disabled={syncing}
                className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : `Sync ${untrackedCount} JIRAs`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Issues */}
      {activeIssues.length > 0 && (
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} className="text-gray-400" />
            Active Tasks
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">JIRA</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tracked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeIssues.map(issue => (
                  <IssueRow 
                    key={issue.key} 
                    issue={issue} 
                    isTracked={internalJiraNumbers.has(issue.key)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed Issues - Collapsible */}
      {completedIssues.length > 0 && (
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full px-6 py-3 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span>Completed ({completedIssues.length})</span>
            <FontAwesomeIcon icon={showAll ? faChevronUp : faChevronDown} />
          </button>
          
          {showAll && (
            <div className="px-6 pb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-200">
                    {completedIssues.map(issue => (
                      <IssueRow 
                        key={issue.key} 
                        issue={issue} 
                        isTracked={internalJiraNumbers.has(issue.key)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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