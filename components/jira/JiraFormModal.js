// components/JiraFormModal.js
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useFormState } from '@/hooks/ui';
import { useApiData, useAsyncState } from '@/hooks/api';

const JiraFormModal = ({ isOpen, onClose, jira, onSaveJira, userEmail }) => {
  // Stable transform functions
  const projectsTransform = useCallback((data) => data.projects || [], []);
  const servicesTransform = useCallback((data) => data.services || [], []);

  // API data hooks - only fetch when modal is open
  const { data: projects = [] } = useApiData('/api/projects', [], {
    transform: projectsTransform,
    skip: () => !isOpen
  });
  
  const { data: services = [] } = useApiData('/api/services', [], {
    transform: servicesTransform,
    skip: () => !isOpen
  });
  
  // Define default statuses instead of fetching from API
  const actualStatuses = [
    'In Progress',
    'Done', 
    'Cancel'
  ];

  // Form state with validation
  const initialFormValues = useMemo(() => ({
    jiraType: 'My Jira',
    selectedJiraFromDdl: '',
    jiraNumber: '',
    description: '',
    projectName: '',
    projectId: '',
    serviceName: '',
    jiraStatus: '',
    actualStatus: '',
    envDetail: '',
    sqlDetail: '',
    deploySitDate: '',
    deployUatDate: '',
    deployPreprodDate: '',
    deployProdDate: ''
  }), []);

  const validationRules = useMemo(() => ({
    jiraNumber: {
      required: 'JIRA Number is required',
      minLength: 3
    },
    description: {
      required: 'Description is required',
      minLength: 5
    },
    projectName: {
      required: 'Project is required'
    }
  }), []);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    setValue,
    validateAll,
    reset,
    getFieldProps
  } = useFormState(initialFormValues, validationRules);

  // Available JIRAs async state
  const {
    data: availableJiras,
    loading: loadingAvailableJiras,
    execute: fetchAvailableJiras
  } = useAsyncState([]);
  
  // Ensure availableJiras is always an array
  const safeAvailableJiras = useMemo(() => 
    Array.isArray(availableJiras) ? availableJiras : [], 
    [availableJiras]
  );

  const [availableJirasLoaded, setAvailableJirasLoaded] = useState(false);

  const nodeRef = useRef(null); // For react-draggable

  const isEditMode = useMemo(() => !!jira, [jira]);

  // Remove unused config loading

  // Fetch available JIRAs when modal opens and userEmail is available  
  const fetchJiraData = useCallback(async () => {
    if (!userEmail) return;
    
    console.log('Fetching JIRAs for email:', userEmail); // Debug log
    setAvailableJirasLoaded(false);
    
    try {
      await fetchAvailableJiras(async () => {
        const res = await fetch(`/api/my-jiras?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch available JIRAs, status: ${res.status}`);
        }
        const data = await res.json();
        console.log('JIRA API response:', data); // Debug log
        // JIRA API returns { issues: [...] } structure
        return data.issues || [];
      });
      setAvailableJirasLoaded(true);
    } catch (error) {
      console.error('Error fetching available JIRAs:', error);
      toast.error('Failed to load JIRAs from external API.');
      setAvailableJirasLoaded(true);
    }
  }, [userEmail, fetchAvailableJiras]);

  useEffect(() => {
    if (isOpen) {
      fetchJiraData();
    }
  }, [isOpen, fetchJiraData]);

  // Effect for edit mode - populate form when opening in edit mode
  useEffect(() => {
    if (isOpen && jira) {
      const formData = {
        jiraNumber: jira.jiraNumber || '',
        description: jira.description || '',
        projectName: jira.projectId 
          ? (typeof jira.projectId === 'object' ? jira.projectId.name : jira.projectName || '')
          : (jira.projectName || ''),
        projectId: jira.projectId 
          ? (typeof jira.projectId === 'object' ? jira.projectId._id : jira.projectId)
          : '',
        serviceName: jira.serviceName || '',
        jiraStatus: jira.jiraStatus || '',
        actualStatus: jira.actualStatus || '',
        envDetail: jira.envDetail || '',
        sqlDetail: jira.sqlDetail || '',
        deploySitDate: jira.deploySitDate ? new Date(jira.deploySitDate).toISOString().split('T')[0] : '',
        deployUatDate: jira.deployUatDate ? new Date(jira.deployUatDate).toISOString().split('T')[0] : '',
        deployPreprodDate: jira.deployPreprodDate ? new Date(jira.deployPreprodDate).toISOString().split('T')[0] : '',
        deployProdDate: jira.deployProdDate ? new Date(jira.deployProdDate).toISOString().split('T')[0] : '',
        jiraType: 'Other',
        selectedJiraFromDdl: ''
      };
      
      // Populate form with all values at once
      Object.entries(formData).forEach(([key, value]) => {
        setValue(key, value);
      });
    } else if (isOpen && !jira) {
      // Reset form for new item
      reset();
    }
  }, [isOpen, jira, setValue, reset]);

  // Separate effect to determine jira type after availableJiras are loaded
  useEffect(() => {
    if (isOpen && jira && availableJirasLoaded && safeAvailableJiras.length > 0) {
      const currentJiraNumber = jira.jiraNumber || '';
      const isExternalJira = safeAvailableJiras.some(externalJira => externalJira.key === currentJiraNumber);
      if (isExternalJira) {
        setValue('jiraType', 'My Jira');
        setValue('selectedJiraFromDdl', currentJiraNumber);
        
        // Update jiraStatus from the external JIRA if found
        const externalJiraData = safeAvailableJiras.find(j => j.key === currentJiraNumber);
        if (externalJiraData && externalJiraData.fields?.status?.name) {
          setValue('jiraStatus', externalJiraData.fields.status.name);
        }
      } else {
        setValue('jiraType', 'Other');
        setValue('selectedJiraFromDdl', '');
      }
    }
  }, [isOpen, jira, availableJirasLoaded, setValue, safeAvailableJiras]);

  // This is now handled in the main useEffect above

  // Handle selection from JIRA dropdown
  const handleJiraDdlChange = (e) => {
    const selectedKey = e.target.value;
    setValue('selectedJiraFromDdl', selectedKey);
    const selectedJira = safeAvailableJiras.find(j => j.key === selectedKey);
    if (selectedJira) {
      setValue('jiraNumber', selectedJira.key);
      setValue('description', selectedJira.fields?.summary || '');
      setValue('jiraStatus', selectedJira.fields?.status?.name || 'N/A');
    } else {
      setValue('jiraNumber', '');
      setValue('description', '');
      setValue('jiraStatus', '');
    }
  };

  const handleJiraTypeChange = (type) => {
    setValue('jiraType', type);
    // Reset relevant fields when changing type
    setValue('jiraNumber', '');
    setValue('description', '');
    setValue('jiraStatus', '');
    setValue('selectedJiraFromDdl', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAll()) {
      toast.error('Please fix validation errors before submitting.');
      return;
    }
    
    setIsSubmitting(true);

    const jiraData = {
      jiraNumber: values.jiraNumber.trim(),
      description: values.description.trim(),
      projectId: values.projectId,
      projectName: values.projectName.trim(),
      serviceName: values.serviceName.trim(),
      jiraStatus: values.jiraStatus.trim(),
      actualStatus: values.actualStatus.trim(),
      envDetail: values.envDetail.trim(),
      sqlDetail: values.sqlDetail.trim(),
      deploySitDate: values.deploySitDate,
      deployUatDate: values.deployUatDate,
      deployPreprodDate: values.deployPreprodDate,
      deployProdDate: values.deployProdDate,
    };

    try {
      await onSaveJira(jira ? jira._id : null, jiraData);
      // onClose() is called by parent onSaveJira callback
    } finally {
      setIsSubmitting(false);
    }
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
                        checked={values.jiraType === 'My Jira'}
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
                        checked={values.jiraType === 'Other'}
                        onChange={() => handleJiraTypeChange('Other')}
                        disabled={isSubmitting}
                      />
                      <span className="ml-2 text-gray-700">Other</span>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">Project</label>
                  <select
                    id="project_id"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    value={values.projectId}
                    onChange={(e) => {
                      const selectedProject = projects.find(p => p._id === e.target.value);
                      setValue('projectId', e.target.value);
                      setValue('projectName', selectedProject ? selectedProject.name : '');
                    }}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">-- Select Project --</option>
                    {Array.isArray(projects) && projects.map(project => (
                      <option key={project._id} value={project._id}>{project.name}</option>
                    ))}
                  </select>
                  {errors.projectName && touched.projectName && (
                    <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
                  )}
                </div>

                {/* JIRA Number / DDL or Manual Input (Conditional based on jiraType) */}
                {values.jiraType === 'My Jira' ? (
                  <div className="sm:col-span-2">
                    <label htmlFor="jira_select" className="block text-sm font-medium text-gray-700">Select JIRA Issue</label>
                    <div className="mt-1 flex items-center">
                      <select
                        id="jira_select"
                        className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                        {...getFieldProps('selectedJiraFromDdl')}
                        onChange={handleJiraDdlChange}
                        required={values.jiraType === 'My Jira'}
                        disabled={loadingAvailableJiras || isSubmitting}
                      >
                        <option value="">
                          {loadingAvailableJiras ? 'Loading JIRAs...' : '-- Select JIRA --'}
                        </option>
                        {safeAvailableJiras.map(jiraIssue => (
                          <option key={jiraIssue.key} value={jiraIssue.key}>
                            {jiraIssue.key} - {jiraIssue.fields?.summary || jiraIssue.summary}
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
                      {...getFieldProps('jiraNumber')}
                      required
                      disabled={isSubmitting}
                    />
                    {errors.jiraNumber && touched.jiraNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.jiraNumber}</p>
                    )}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    id="description"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    {...getFieldProps('description')}
                    required
                    disabled={values.jiraType === 'My Jira' || isSubmitting} // Disable if My Jira type
                  />
                  {errors.description && touched.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="jira_status" className="block text-sm font-medium text-gray-700">JIRA Status (Live)</label>
                  <input
                    type="text"
                    id="jira_status"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    {...getFieldProps('jiraStatus')}
                    disabled={values.jiraType === 'My Jira' || isSubmitting} // Disable if auto-filled from DDL
                    placeholder="Auto-filled from JIRA API"
                  />
                </div>

                <div>
                  <label htmlFor="actual_status" className="block text-sm font-medium text-gray-700">Actual Status</label>
                  <select
                    id="actual_status"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag"
                    {...getFieldProps('actualStatus')}
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
                    {...getFieldProps('serviceName')}
                    disabled={isSubmitting}
                  >
                    <option value="">-- Select Service --</option>
                    {Array.isArray(services) && services.map(service => (
                      <option key={service.name} value={service.name}>{service.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* RIGHT SECTION (Technical Details & Deployment) */}
              <div className="lg:col-span-1 flex flex-col gap-2">
                <div className="">
                  <h4 className="text-md font-semibold text-gray-800 mb-2 mt-2">Deployment Schedule</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label htmlFor="deploy_sit_date" className="block text-sm font-medium text-gray-700">SIT Date</label>
                      <input type="date" id="deploy_sit_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag" {...getFieldProps('deploySitDate')} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label htmlFor="deploy_uat_date" className="block text-sm font-medium text-gray-700">UAT Date</label>
                      <input type="date" id="deploy_uat_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag" {...getFieldProps('deployUatDate')} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label htmlFor="deploy_preprod_date" className="block text-sm font-medium text-gray-700">PREPROD Date</label>
                      <input type="date" id="deploy_preprod_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag" {...getFieldProps('deployPreprodDate')} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label htmlFor="deploy_prod_date" className="block text-sm font-medium text-gray-700">PROD Date</label>
                      <input type="date" id="deploy_prod_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black no-drag" {...getFieldProps('deployProdDate')} disabled={isSubmitting} />
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
                    {...getFieldProps('envDetail')}
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
                    {...getFieldProps('sqlDetail')}
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