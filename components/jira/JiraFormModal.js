// components/JiraFormModal.js
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useFormState } from '@/hooks/ui';
import { useApiData, useAsyncState } from '@/hooks/api';
import { Input, Select, Button } from '@/components/ui';

const JiraFormModal = ({ isOpen, onClose, jira, onSaveJira, userEmail }) => {
  // Stable transform functions
  const projectsTransform = useCallback((data) => data.projects || [], []);
  const servicesTransform = useCallback((data) => data.services || [], []);

  // API data hooks - always fetch projects data
  const { data: projects = [], loading: loadingProjects } = useApiData('/api/projects', [], {
    transform: projectsTransform
  });
  
  const { data: services = [], loading: loadingServices, error: servicesError, refetch: refetchServices } = useApiData('/api/services', [isOpen], {
    transform: servicesTransform,
    skip: () => !isOpen,
    fetchOnMount: true
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
      // Force refetch of services when modal opens
      if (refetchServices) {
        refetchServices();
      }
    }
  }, [isOpen, fetchJiraData, refetchServices]);

  // Debug logging for services data
  useEffect(() => {
    if (isOpen) {
      console.log('JiraFormModal - Services data:', { services, loadingServices, servicesError, servicesLength: services?.length || 0 });
    }
  }, [isOpen, services, loadingServices, servicesError]);

  // Effect for edit mode - populate form when opening in edit mode
  useEffect(() => {
    if (isOpen && jira) {
      const formData = {
        jiraNumber: jira.jiraNumber || '',
        description: jira.description || '',
        projectName: jira.projectName || 
          (jira.projectId && typeof jira.projectId === 'object' ? jira.projectId.name : ''),
        projectId: jira.projectId && typeof jira.projectId === 'object' 
          ? jira.projectId._id 
          : jira.projectId || '',
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
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:text-black">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </Button>
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
                  <Select
                    label="Project"
                    value={values.projectId}
                    onChange={(e) => {
                      const selectedProject = projects.find(p => p._id === e.target.value);
                      setValue('projectId', e.target.value);
                      setValue('projectName', selectedProject ? selectedProject.name : '');
                    }}
                    options={[
                      { value: '', label: loadingProjects ? 'Loading Projects...' : '-- Select Project --' },
                      ...(Array.isArray(projects) ? projects.map(project => ({
                        value: project._id,
                        label: project.name
                      })) : [])
                    ]}
                    required
                    disabled={isSubmitting}
                  />
                  {errors.projectName && touched.projectName && (
                    <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
                  )}
                </div>

                {/* JIRA Number / DDL or Manual Input (Conditional based on jiraType) */}
                {values.jiraType === 'My Jira' ? (
                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <Select
                        label="Select JIRA Issue"
                        {...getFieldProps('selectedJiraFromDdl')}
                        onChange={handleJiraDdlChange}
                        options={[
                          { 
                            value: '', 
                            label: loadingAvailableJiras ? 'Loading JIRAs...' : '-- Select JIRA --' 
                          },
                          ...safeAvailableJiras.map(jiraIssue => ({
                            value: jiraIssue.key,
                            label: `${jiraIssue.key} - ${jiraIssue.fields?.summary || jiraIssue.summary}`
                          }))
                        ]}
                        required={values.jiraType === 'My Jira'}
                        disabled={loadingAvailableJiras || isSubmitting}
                      />
                      {loadingAvailableJiras && <FontAwesomeIcon icon={faSpinner} spin className="ml-2 text-gray-500" />}
                    </div>
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <Input
                      label="Task Key / JIRA Number"
                      placeholder="IR-XXXX or Internal Key"
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
                  <Input
                    label="Description"
                    {...getFieldProps('description')}
                    required
                    disabled={values.jiraType === 'My Jira' || isSubmitting} // Disable if My Jira type
                  />
                  {errors.description && touched.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="JIRA Status (Live)"
                    {...getFieldProps('jiraStatus')}
                    disabled={values.jiraType === 'My Jira' || isSubmitting} // Disable if auto-filled from DDL
                    placeholder="Auto-filled from JIRA API"
                  />
                </div>

                <div>
                  <Select
                    label="Actual Status"
                    {...getFieldProps('actualStatus')}
                    options={[
                      { value: '', label: '-- Select Status --' },
                      ...actualStatuses.map(status => ({
                        value: status,
                        label: status
                      }))
                    ]}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="sm:col-span-1">
                  <Select
                    label="Service"
                    {...getFieldProps('serviceName')}
                    options={[
                      { 
                        value: '', 
                        label: loadingServices ? 'Loading Services...' : '-- Select Service --' 
                      },
                      ...(Array.isArray(services) ? services.map(service => ({
                        value: service.name,
                        label: service.name
                      })) : [])
                    ]}
                    disabled={isSubmitting || loadingServices}
                  />
                  {servicesError && (
                    <p className="mt-1 text-sm text-red-600">Error loading services: {servicesError}</p>
                  )}
                </div>

              </div>

              {/* RIGHT SECTION (Technical Details & Deployment) */}
              <div className="lg:col-span-1 flex flex-col gap-2">
                <div className="">
                  <h4 className="text-md font-semibold text-gray-800 mb-2 mt-2">Deployment Schedule</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Input
                        label="SIT Date"
                        type="date"
                        {...getFieldProps('deploySitDate')}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Input
                        label="UAT Date"
                        type="date"
                        {...getFieldProps('deployUatDate')}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Input
                        label="PREPROD Date"
                        type="date"
                        {...getFieldProps('deployPreprodDate')}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Input
                        label="PROD Date"
                        type="date"
                        {...getFieldProps('deployProdDate')}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-6 grid grid-cols-2 gap-5'>
                <div>
                  <Input
                    label="Environment Detail"
                    as="textarea"
                    rows="12"
                    {...getFieldProps('envDetail')}
                    placeholder="Environment configurations, variables, etc."
                    disabled={isSubmitting}
                    className="w-full min-h-[300px]"
                  />
                </div>

                <div>
                  <Input
                    label="SQL Detail"
                    as="textarea"
                    rows="12"
                    {...getFieldProps('sqlDetail')}
                    placeholder="SQL scripts, database changes, etc."
                    disabled={isSubmitting}
                    className="w-full min-h-[300px]"
                  />
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t text-right sticky bottom-0">
              <Button
                type="button"
                variant="danger"
                onClick={onClose}
                disabled={isSubmitting}
                className="mr-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Saving..."
              >
                Save
              </Button>
            </div>
          </form>
        </div>
      </Draggable>
    </div>
  );
};

export default JiraFormModal;