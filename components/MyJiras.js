'use client';
import { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faSquare, faSpinner, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons"; // Added chevron icons
import { useSession } from "next-auth/react";

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
};

// Define the sections and their matching criteria
const jiraSectionsConfig = [
  {
    title: "Need Action",
    statusMatch: ["intake","fix","awaiting production"],
    descriptionMatch: [],
    defaultCollapsed: false // Default to open
  },
  {
    title: "Business & Requirements",
    statusMatch: ["business","requirement","analysis"],
    descriptionMatch: [],
    defaultCollapsed: true // Default to open
  },
  {
    title: "Pending",
    statusMatch: ["pending"],
    descriptionMatch: [],
    defaultCollapsed: true // Default to open
  },
  {
    title: "Design",
    statusMatch: ["design"],
    descriptionMatch: [],
    defaultCollapsed: true
  },
  {
    title: "Develop",
    statusMatch: ["develop","in progress"],
    descriptionMatch: [],
    defaultCollapsed: false
  },
  {
    title: "SIT",
    statusMatch: ["sit"],
    descriptionMatch: [], // Added "sit" to descriptionMatch for consistency if needed
    defaultCollapsed: false
  },
  {
    title: "UAT",
    statusMatch: ["uat"],
    descriptionMatch: [], // Added "uat" to descriptionMatch for consistency if needed
    defaultCollapsed: false
  },
  {
    title: "Production",
    statusMatch: ["deployed","production"],
    descriptionMatch: [],
    defaultCollapsed: true
  },
  {
    title: "Closed",
    statusMatch: ["closed"],
    descriptionMatch: [],
    defaultCollapsed: true // Default to collapsed
  },
  {
    title: "Done",
    statusMatch: ["done"],
    descriptionMatch: [],
    defaultCollapsed: true // Default to collapsed
  },
  {
    title: "Canceled",
    statusMatch: ["cancel"],
    descriptionMatch: [],
    defaultCollapsed: true // Default to collapsed
  },
  { // *** NEW: Uncategorized section config ***
    title: "Uncategorized",
    statusMatch: [],
    descriptionMatch: [],
    defaultCollapsed: true // Default to collapsed
  }
];

export default function MyJiras({userEmail}) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [internalJiraNumbers, setInternalJiraNumbers] = useState(new Set());
  const [error, setError] = useState(null);
  // State to manage collapsed/expanded sections
  const [collapsedSections, setCollapsedSections] = useState(() => {
    const initialCollapsed = {};
    jiraSectionsConfig.forEach(section => {
      initialCollapsed[section.title] = section.defaultCollapsed;
    });
    return initialCollapsed;
  });

  // Function to toggle collapse state of a section
  const toggleSectionCollapse = (title) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      const fetchExternalAndInternalJiras = async () => {
        setLoading(true);
        setError(null);

        try {
          const externalRes = await fetch(`/api/my-jiras?email=${encodeURIComponent(userEmail)}`);
          if (!externalRes.ok) {
            const errorData = await externalRes.json();
            throw new Error(errorData.error || "Failed to load Jiras from external API");
          }
          const externalData = await externalRes.json();

          const internalRes = await fetch(`/api/jiras`);
          if (!internalRes.ok) {
            const errorData = await internalRes.json();
            throw new Error(errorData.message || "Failed to load internal Jira numbers");
          }
          // Corrected line: Assign the result of internalRes.json() to internalData
          const internalData = await internalRes.json(); 
          
          setIssues(externalData.issues || []);
          const jiraNumbersFromInternalData = internalData.jiras ? internalData.jiras.map(jira => jira.jiraNumber) : [];
          setInternalJiraNumbers(new Set(jiraNumbersFromInternalData));
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };

      fetchExternalAndInternalJiras();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError("Please log in to view your Jiras.");
      setIssues([]);
      setInternalJiraNumbers(new Set());
    }
  }, []);

  // Categorize issues into sections
  const categorizedIssues = useMemo(() => {
    const categories = jiraSectionsConfig.map(section => ({
      title: section.title,
      issues: [],
      defaultCollapsed: section.defaultCollapsed // Keep defaultCollapsed property
    }));

    const uncategorizedIssueKeys = new Set(issues.map(issue => issue.key)); // Track all issues initially as uncategorized

    issues.forEach(issue => {
      const statusNameLower = issue.fields.status?.name?.toLowerCase() || '';
      const summaryLower = issue.fields.summary?.toLowerCase() || '';
      const descriptionLower = issue.fields.description?.toLowerCase() || '';

      let assignedToCategory = false;

      for (const category of categories) {
        if (category.title === "Uncategorized") continue; // Skip Uncategorized in this loop

        const config = jiraSectionsConfig.find(s => s.title === category.title);
        if (!config) continue;

        let isMatch = false;

        // Check if statusNameLower contains any of the statusMatch keywords
        if (config.statusMatch.length > 0) {
          for (const keyword of config.statusMatch) {
            if (statusNameLower.includes(keyword)) { // Check if statusNameLower contains the keyword
              isMatch = true;
              break;
            }
          }
        }

        // Check description/summary match (if not already matched by status)
        if (!isMatch && config.descriptionMatch.length > 0) {
          for (const keyword of config.descriptionMatch) {
            if (summaryLower.includes(keyword) || descriptionLower.includes(keyword)) {
              isMatch = true;
              break;
            }
          }
        }

        if (isMatch) {
          category.issues.push(issue);
          uncategorizedIssueKeys.delete(issue.key); // Remove from uncategorized set
          assignedToCategory = true;
          break;
        }
      }
    });

    const uncategorizedSection = categories.find(c => c.title === "Uncategorized");
    if (uncategorizedSection) {
        issues.forEach(issue => {
            if (uncategorizedIssueKeys.has(issue.key)) { // If still in the uncategorized set
                uncategorizedSection.issues.push(issue);
            }
        });
    }

    categories.forEach(category => {
      category.issues.sort((a, b) => {
        const dateA = new Date(a.fields.created);
        const dateB = new Date(b.fields.created);
        return dateB.getTime() - dateA.getTime();
      });
    });

    // Filter out categories with no issues
    return categories.filter(category => category.issues.length > 0);
  }, [issues]);

  // Columns for the inner tables
  const tableColumns = [
    { label: "Jira Key", key: "key" },
    { label: "Summary", key: "summary" },
    { label: "Created", key: "created" },
    { label: "Reporter", key: "reporter" },
    { label: "Status", key: "status" },
    { label: "Recorded", key: "recorded" },
  ];

  return (
    <div className="my-4 p-4 bg-white border border-gray-300 ">
      <h2 className="text-xl font-bold  text-black font-light ">All Jira Assigned</h2>
      <p className="text-sm text-gray-600 mb-2 ">Categorized by current status or description keywords.</p>
      
      {/* Loading states */}
      {status === 'loading' && (
        <div className="text-center py-4">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-black" />
          <p className="text-gray-600 mt-2">Loading user session...</p>
        </div>
      )}
      
      {status === 'unauthenticated' && !loading && (
        <div className="text-black text-center py-4 border border-black bg-gray-100 p-4">
          {error || "You must be logged in to view your assigned Jiras."}
        </div>
      )}
      
      {(status === 'authenticated' && loading) && (
        <div className="text-center py-4">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-black" />
          <p className="text-gray-600 mt-2">Loading Jiras...</p>
        </div>
      )}
      
      {status === 'authenticated' && !loading && error && (
        <div className="text-black text-center py-4 border border-black bg-gray-100 p-4">{error}</div>
      )}
      
      {/* Display categorized Jiras */}
      {status === 'authenticated' && !loading && !error && (
        <div className="space-y-2">
          {categorizedIssues.map(category => (
            <div key={category.title} className="border border-gray-200 rounded overflow-hidden">
              {/* Section Header with Toggle Button */}
              <button
                className="w-full text-left bg-black text-white px-4 py-2 font-light flex justify-between items-center"
                onClick={() => toggleSectionCollapse(category.title)}
              >
                {category.title} [{category.issues.length}]
                <FontAwesomeIcon icon={collapsedSections[category.title] ? faChevronDown : faChevronUp} />
              </button>
              
              {/* Collapsible Content */}
              <div className={`overflow-hidden transition-all duration-300 ${collapsedSections[category.title] ? 'h-0' : 'h-auto'}`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100 text-black">
                      <tr>
                        {tableColumns.map(col => (
                          <th
                            key={col.key}
                            className="px-3 py-2 text-left text-xs font-semibold border-r border-gray-300 last:border-r-0"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {category.issues.length === 0 ? (
                        <tr>
                          <td colSpan={tableColumns.length} className="text-center text-gray-500 py-4 border-b border-gray-200">
                            No Jiras in this category.
                          </td>
                        </tr>
                      ) : (
                        category.issues.map((issue, index) => {
                          const isRecorded = internalJiraNumbers.has(issue.key);
                          return (
                            <tr key={issue.key} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-3 py-2 font-mono text-sm whitespace-nowrap">
                                <a
                                  href={`https://generalith.atlassian.net/browse/${issue.key}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline font-bold !text-black underline"
                                >
                                  {issue.key}
                                </a>
                              </td>
                              <td className="px-3 py-2 text-sm text-black">{issue.fields.summary || '-'}</td>
                              <td className="px-3 py-2 text-xs text-black font-mono whitespace-nowrap">{formatDate(issue.fields.created)}</td>
                              <td className="px-3 py-2 text-sm text-black">{issue.fields.reporter?.displayName || '-'}</td>
                              <td className="px-3 py-2 text-sm text-black">{issue.fields.status?.name || '-'}</td>
                              <td className="px-3 py-2 text-sm text-center">
                                <FontAwesomeIcon
                                  icon={isRecorded ? faCheckSquare : faSquare}
                                  className={isRecorded ? "text-black" : "text-gray-400"}
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
