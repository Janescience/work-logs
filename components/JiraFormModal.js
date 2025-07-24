// components/JiraFormModal.js
'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const JiraFormModal = ({ isOpen, onClose, jira, onSaveJira, userEmail }) => {
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [actualStatuses, setActualStatuses] = useState([]);

  // Form States
  const [jiraType, setJiraType] = useState('My Jira'); // 'Jira' or 'Non-Jira'
  const [selectedJiraFromDdl, setSelectedJiraFromDdl] = useState(''); // For Jira type dropdown

  const [jiraNumber, setJiraNumber] = useState('');
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [assignee, setAssignee] = useState('');
  const [effortEstimation, setEffortEstimation] = useState('');
  const [jiraStatus, setJiraStatus] = useState(''); // Live Jira status from API or user input
  const [actualStatus, setActualStatus] = useState('');
  const [relatedJira, setRelatedJira] = useState('');
  const [environment, setEnvironment] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [envDetail, setEnvDetail] = useState('');
  const [sqlDetail, setSqlDetail] = useState('');
  const [deploySitDate, setDeploySitDate] = useState('');
  const [deployUatDate, setDeployUatDate] = useState('');
  const [deployPreprodDate, setDeployPreprodDate] = useState('');
  const [deployProdDate, setDeployProdDate] = useState('');

  const [availableJiras, setAvailableJiras] = useState([]); // Jiras fetched from /api/my-jiras
  const [loadingAvailableJiras, setLoadingAvailableJiras] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableJirasLoaded, setAvailableJirasLoaded] = useState(false); // Track if jiras have been loaded

  const nodeRef = useRef(null); // For react-draggable

  const isEditMode = useMemo(() => !!jira, [jira]);

  // Fetch initial data (projects, services, statuses)
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data.projects || []));

    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data.services || []));

    import('@/data/config').then(config => {
      setActualStatuses(config.actualStatuses);
    });
  }, []);

  // Fetch available JIRAs from API for DDL, runs when userEmail is available
  useEffect(() => {
    const fetchAvailableJiras = async () => {
      if (!userEmail) return;

      setLoadingAvailableJiras(true);
      setAvailableJirasLoaded(false);
      try {
        const res = await fetch(`/api/my-jiras?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch available JIRAs, status: ${res.status}`);
        }
        const data = await res.json();
        setAvailableJiras(data.issues || []);
        setAvailableJirasLoaded(true);
      } catch (error) {
        console.error('Error fetching available JIRAs:', error);
        toast.error('Failed to load JIRAs from external API.');
        setAvailableJiras([]);
        setAvailableJirasLoaded(true);
      } finally {
        setLoadingAvailableJiras(false);
      }
    };
    fetchAvailableJiras();
  }, [userEmail]); // Depend on userEmail

  // Effect for edit mode - populate form when opening in edit mode
  useEffect(() => {
    if (isOpen && jira) {
      // Always populate these fields immediately
      setJiraNumber(jira.jiraNumber || '');
      setDescription(jira.description || '');
      setProjectName(jira.projectName || '');
      setServiceName(jira.serviceName || '');
      setAssignee(jira.assignee || '');
      setEffortEstimation(jira.effortEstimation || '');
      setJiraStatus(jira.jiraStatus || ''); // This will now be set immediately
      setActualStatus(jira.actualStatus || '');
      setRelatedJira(jira.relatedJira || '');
      setEnvironment(jira.environment || '');
      setDueDate(jira.dueDate ? new Date(jira.dueDate).toISOString().split('T')[0] : '');
      setEnvDetail(jira.envDetail || '');
      setSqlDetail(jira.sqlDetail || '');
      setDeploySitDate(jira.deploySitDate ? new Date(jira.deploySitDate).toISOString().split('T')[0] : '');
      setDeployUatDate(jira.deployUatDate ? new Date(jira.deployUatDate).toISOString().split('T')[0] : '');
      setDeployPreprodDate(jira.deployPreprodDate ? new Date(jira.deployPreprodDate).toISOString().split('T')[0] : '');
      setDeployProdDate(jira.deployProdDate ? new Date(jira.deployProdDate).toISOString().split('T')[0] : '');

      // Set initial jira type - default to 'Other' until we can verify
      setJiraType('Other');
      setSelectedJiraFromDdl('');
    }
  }, [isOpen, jira]); // Only depend on isOpen and jira

  // Separate effect to determine jira type after availableJiras are loaded
  useEffect(() => {
    if (isOpen && jira && availableJirasLoaded && availableJiras.length > 0) {
      const isExternalJira = availableJiras.some(externalJira => externalJira.key === jira.jiraNumber);
      if (isExternalJira) {
        setJiraType('My Jira');
        setSelectedJiraFromDdl(jira.jiraNumber);
        
        // Update jiraStatus from the external JIRA if found
        const externalJiraData = availableJiras.find(j => j.key === jira.jiraNumber);
        if (externalJiraData && externalJiraData.fields?.status?.name) {
          setJiraStatus(externalJiraData.fields.status.name);
        }
      } else {
        setJiraType('Other');
        setSelectedJiraFromDdl('');
      }
    }
  }, [isOpen, jira, availableJiras, availableJirasLoaded]);

  // Reset form when closing or opening in add mode
  useEffect(() => {
    if (isOpen && !jira) {
      resetForm();
    }
  }, [isOpen, jira]);

  // Handle selection from JIRA dropdown
  const handleJiraDdlChange = (e) => {
    const selectedKey = e.target.value;
    setSelectedJiraFromDdl(selectedKey);
    const selectedJira = availableJiras.find(j => j.key === selectedKey);
    if (selectedJira) {
      setJiraNumber(selectedJira.key);
      setDescription(selectedJira.fields?.summary || '');
      setJiraStatus(selectedJira.fields?.status?.name || 'N/A');
    } else {
      setJiraNumber('');
      setDescription('');
      setJiraStatus('');
    }
  };

  const handleJiraTypeChange = (type) => {
    setJiraType(type);
    // Reset relevant fields when changing type
    setJiraNumber('');
    setDescription('');
    setJiraStatus('');
    setSelectedJiraFromDdl('');
    // For simplicity, for now, we don't clear projectName/assignee
    // but in a real app, you might want to reset them based on type too.
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const jiraData = {
      jiraNumber: jiraNumber.trim(),
      description: description.trim(),
      projectName: projectName.trim(),
      serviceName: serviceName.trim(),
      assignee: assignee.trim(),
      effortEstimation: parseFloat(effortEstimation) || 0,
      jiraStatus: jiraStatus.trim(),
      actualStatus: actualStatus.trim(),
      relatedJira: relatedJira.trim(),
      environment: environment.trim(),
      dueDate: dueDate,
      envDetail: envDetail.trim(),
      sqlDetail: sqlDetail.trim(),
      deploySitDate: deploySitDate,
      deployUatDate: deployUatDate,
      deployPreprodDate: deployPreprodDate,
      deployProdDate: deployProdDate,
    };

    try {
      await onSaveJira(jira ? jira._id : null, jiraData);
      // onClose() is called by parent onSaveJira callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setJiraType('My Jira'); // Default to My Jira for new entries
    setSelectedJiraFromDdl('');
    setJiraNumber('');
    setDescription('');
    setProjectName('');
    setServiceName('');
    setAssignee('');
    setEffortEstimation('');
    setJiraStatus('');
    setActualStatus('');
    setRelatedJira('');
    setEnvironment('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setEnvDetail('');
    setSqlDetail('');
    setDeploySitDate('');
    setDeployUatDate('');
    setDeployPreprodDate('');
    setDeployProdDate('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Draggable nodeRef={nodeRef} handle=".modal-handle" cancel=".no-drag">
        <div ref={nodeRef} className="bg-white w-full max-w-6xl rounded-lg shadow-xl flex flex-col max-h-[90vh]">
          <div className="modal-handle cursor-move px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">{isEditMode ? 'Edit Task' : 'New Task'}</h3>
            <button onClick={onClose} className="text-gray-600 hover:text-black no-drag">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
            <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-4">

              {/* LEFT SECTION (General Details) */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Jira Type Selection (Now always shown) */}
                <div className="sm:col-span-2 flex items-center gap-4 mb-2">
                  <label className="text-sm font-medium text-gray-700">Task Type:</label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-black no-drag"
                        name="jiraType"
                        value="My Jira"
                        checked={jiraType === 'My Jira'}
                        onChange={() => handleJiraTypeChange('My Jira')}
                        disabled={loadingAvailableJiras || isSubmitting}
                      />
                      <span className="ml-2 text-gray-700">My JIRA</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-black no-drag"
                        name="jiraType"
                        value="Other"
                        checked={jiraType === 'Other'}
                        onChange={() => handleJiraTypeChange('Other')}
                        disabled={isSubmitting}
                      />
                      <span className="ml-2 text-gray-700">Other</span>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="project_name" className="block text-sm font-medium text-gray-700">Project</label>
                  <select
                    id="project_name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map(project => (
                      <option key={project._id} value={project.name}>{project.name}</option>
                    ))}
                  </select>
                </div>

                {/* JIRA Number / DDL or Manual Input (Conditional based on jiraType) */}
                {jiraType === 'My Jira' ? (
                  <div className="sm:col-span-2">
                    <label htmlFor="jira_select" className="block text-sm font-medium text-gray-700">Select JIRA Issue</label>
                    <div className="mt-1 flex items-center">
                      <select
                        id="jira_select"
                        className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                        value={selectedJiraFromDdl}
                        onChange={handleJiraDdlChange}
                        required={jiraType === 'My Jira'}
                        disabled={loadingAvailableJiras || isSubmitting}
                      >
                        <option value="">
                          {loadingAvailableJiras ? 'Loading JIRAs...' : '-- Select JIRA --'}
                        </option>
                        {availableJiras.map(jiraIssue => (
                          <option key={jiraIssue.id} value={jiraIssue.key}>
                            {jiraIssue.key} - {jiraIssue.fields?.summary}
                          </option>
                        ))}
                      </select>
                      {loadingAvailableJiras && <FontAwesomeIcon icon={faSpinner} spin className="ml-2 text-gray-500" />}
                    </div>
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <label htmlFor="jira_number" className="block text-sm font-medium text-gray-700">Task Key / JIRA Number</label>
                    <input
                      type="text"
                      id="jira_number"
                      placeholder="IR-XXXX or Internal Key"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                      value={jiraNumber}
                      onChange={(e) => setJiraNumber(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    id="description"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    disabled={jiraType === 'My Jira' || isSubmitting} // Disable if My Jira type
                  />
                </div>

                <div>
                  <label htmlFor="jira_status" className="block text-sm font-medium text-gray-700">JIRA Status (Live)</label>
                  <input
                    type="text"
                    id="jira_status"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    value={jiraStatus}
                    onChange={(e) => setJiraStatus(e.target.value)} // Allow manual override if needed
                    disabled={jiraType === 'My Jira' || isSubmitting} // Disable if auto-filled from DDL
                    placeholder="Auto-filled from JIRA API"
                  />
                </div>

                <div>
                  <label htmlFor="actual_status" className="block text-sm font-medium text-gray-700">Actual Status</label>
                  <select
                    id="actual_status"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    value={actualStatus}
                    onChange={(e) => setActualStatus(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">-- Select Status --</option>
                    {actualStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label htmlFor="service_name" className="block text-sm font-medium text-gray-700">Service</label>
                  <select
                    id="service_name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">-- Select Service --</option>
                    {services.map(service => (
                      <option key={service.name} value={service.name}>{service.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    id="due_date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* RIGHT SECTION (Technical Details & Deployment) */}
              <div className="lg:col-span-1 flex flex-col gap-2">
                <div className="">
                  <h4 className="text-md font-semibold text-gray-800 mb-2 mt-2">Deployment Schedule</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label htmlFor="deploy_sit_date" className="block text-sm font-medium text-gray-700">SIT Date</label>
                      <input type="date" id="deploy_sit_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag" value={deploySitDate} onChange={(e) => setDeploySitDate(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label htmlFor="deploy_uat_date" className="block text-sm font-medium text-gray-700">UAT Date</label>
                      <input type="date" id="deploy_uat_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag" value={deployUatDate} onChange={(e) => setDeployUatDate(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label htmlFor="deploy_preprod_date" className="block text-sm font-medium text-gray-700">PREPROD Date</label>
                      <input type="date" id="deploy_preprod_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag" value={deployPreprodDate} onChange={(e) => setDeployPreprodDate(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label htmlFor="deploy_prod_date" className="block text-sm font-medium text-gray-700">PROD Date</label>
                      <input type="date" id="deploy_prod_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag" value={deployProdDate} onChange={(e) => setDeployProdDate(e.target.value)} disabled={isSubmitting} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-6 grid grid-cols-3 gap-5'>
                <div>
                  <label htmlFor="env_detail" className="block text-sm font-medium text-gray-700">Environment Detail</label>
                  <textarea
                    id="env_detail"
                    rows="8"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    value={envDetail}
                    onChange={(e) => setEnvDetail(e.target.value)}
                    placeholder="Environment configurations, variables, etc."
                    disabled={isSubmitting}
                  ></textarea>
                </div>

                <div className="col-span-2">
                  <label htmlFor="sql_detail" className="block text-sm font-medium text-gray-700">SQL Detail</label>
                  <textarea
                    id="sql_detail"
                    rows="8"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    value={sqlDetail}
                    onChange={(e) => setSqlDetail(e.target.value)}
                    placeholder="SQL scripts, database changes, etc."
                    disabled={isSubmitting}
                  ></textarea>
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t text-right sticky bottom-0">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border shadow-sm px-4 py-2 bg-red-500 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mr-3 no-drag"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-black shadow-sm px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 no-drag"
                disabled={isSubmitting}
              >
                {isSubmitting ? <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Saving...</> : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </Draggable>
    </div>
  );
};

export default JiraFormModal;