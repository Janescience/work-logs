// components/EditJiraModal.js
import React, { useState, useEffect } from 'react';

const EditJiraModal = ({ isOpen, onClose, jira, onUpdateJira }) => {
  const [projectName, setProjectName] = useState(jira?.projectName || '');
  const [serviceName, setServiceName] = useState(jira?.serviceName || '');
  const [jiraNumber, setJiraNumber] = useState(jira?.jiraNumber || '');
  const [description, setDescription] = useState(jira?.description || '');
  const [assignee, setAssignee] = useState(jira?.assignee || '');
  const [effortEstimation, setEffortEstimation] = useState(jira?.effortEstimation || '');
  const [jiraStatus, setJiraStatus] = useState(jira?.jiraStatus || '');
  const [actualStatus, setActualStatus] = useState(jira?.actualStatus || '');
  const [relatedJira, setRelatedJira] = useState(jira?.relatedJira || '');
  const [environment, setEnvironment] = useState(jira?.environment || '');
  const [dueDate, setDueDate] = useState(jira?.dueDate ? new Date(jira.dueDate).toISOString().split('T')[0] : '');
  const [envDetail, setEnvDetail] = useState(jira?.envDetail || '');
  const [sqlDetail, setSqlDetail] = useState(jira?.sqlDetail || '');
  const [deploySitDate, setDeploySitDate] = useState(jira?.deploySitDate ? new Date(jira.deploySitDate).toISOString().split('T')[0] : '');
  const [deployUatDate, setDeployUatDate] = useState(jira?.deployUatDate ? new Date(jira.deployUatDate).toISOString().split('T')[0] : '');
  const [deployPreprodDate, setDeployPreprodDate] = useState(jira?.deployPreprodDate ? new Date(jira.deployPreprodDate).toISOString().split('T')[0] : '');
  const [deployProdDate, setDeployProdDate] = useState(jira?.deployProdDate ? new Date(jira.deployProdDate).toISOString().split('T')[0] : '');

  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [jiraStatuses, setJiraStatuses] = useState([]);
  const [actualStatuses, setActualStatuses] = useState([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data.projects));

    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data.services));
      
    import('@/data/config').then(config => {
      setJiraStatuses(config.jiraStatuses);
      setActualStatuses(config.actualStatuses);
    });
  }, []);

  useEffect(() => {
    if (jira) {
      setProjectName(jira.projectName || '');
      setServiceName(jira.serviceName || '');
      setJiraNumber(jira.jiraNumber || '');
      setDescription(jira.description || '');
      setAssignee(jira.assignee || '');
      setEffortEstimation(jira.effortEstimation || '');
      setJiraStatus(jira.jiraStatus || '');
      setActualStatus(jira.actualStatus || '');
      setRelatedJira(jira.relatedJira || '');
      setEnvironment(jira.environment || '');
      setSqlDetail(jira.sqlDetail || '');
      setEnvDetail(jira.envDetail || '');
      setDeploySitDate(jira.deploySitDate ? new Date(jira.deploySitDate).toISOString().split('T')[0] : '');
      setDeployUatDate(jira.deployUatDate ? new Date(jira.deployUatDate).toISOString().split('T')[0] : '');
      setDeployPreprodDate(jira.deployPreprodDate ? new Date(jira.deployPreprodDate).toISOString().split('T')[0] : '');
      setDeployProdDate(jira.deployProdDate ? new Date(jira.deployProdDate).toISOString().split('T')[0] : '');
      setDueDate(jira.dueDate ? new Date(jira.dueDate).toISOString().split('T')[0] : '');
    }
  }, [jira]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedJiraData = {
      projectName,
      serviceName,
      jiraNumber,
      description,
      assignee,
      effortEstimation,
      jiraStatus,
      actualStatus,
      relatedJira,
      environment,
      dueDate,
      sqlDetail,
      envDetail,
      deploySitDate,
      deployUatDate,
      deployPreprodDate,
      deployProdDate
    };
    await onUpdateJira(jira._id?.$oid || jira._id, updatedJiraData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
      {/* Increased modal width and max-width */}
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Edit Task</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          {/* Main content area with 3-column grid layout */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
            
            {/* --- LEFT SECTION (2 columns wide) --- */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="sm:col-span-2">
                <label htmlFor="project_name" className="block text-sm font-medium text-gray-700">Project</label>
                <select id="project_name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={projectName} onChange={(e) => setProjectName(e.target.value)} required>
                  <option value="">-- Select Project --</option>
                  {projects.map(project => <option key={project._id} value={project.name}>{project.name}</option>)}
                </select>
              </div>
              
              <div>
                <label htmlFor="jira_number" className="block text-sm font-medium text-gray-700">JIRA Number</label>
                <input type="text" id="jira_number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={jiraNumber} onChange={(e) => setJiraNumber(e.target.value)} required />
              </div>

              <div>
                <label htmlFor="service_name" className="block text-sm font-medium text-gray-700">Service</label>
                <select id="service_name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={serviceName} onChange={(e) => setServiceName(e.target.value)}>
                  <option value="">-- Select Service --</option>
                  {services.map(service => <option key={service.name} value={service.name}>{service.name}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">JIRA Detail</label>
                <textarea id="description" rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>

              <div>
                <label htmlFor="actual_status" className="block text-sm font-medium text-gray-700">Actual Status</label>
                <select id="actual_status" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={actualStatus} onChange={(e) => setActualStatus(e.target.value)}>
                  <option value="">-- Select Status --</option>
                  {actualStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date</label>
                <input type="date" id="due_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            {/* --- RIGHT SECTION (1 column wide) --- */}
            <div className="lg:col-span-1 flex flex-col gap-y-4">
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Technical Details</h4>
                <label htmlFor="env_detail" className="block text-sm font-medium text-gray-700">Environment Detail</label>
                <textarea id="env_detail" rows="6" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={envDetail} onChange={(e) => setEnvDetail(e.target.value)} placeholder="Environment configurations, variables, etc."></textarea>
              </div>
              
              <div>
                <label htmlFor="sql_detail" className="block text-sm font-medium text-gray-700">SQL Detail</label>
                <textarea id="sql_detail" rows="6" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={sqlDetail} onChange={(e) => setSqlDetail(e.target.value)} placeholder="SQL scripts, database changes, etc."></textarea>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Deployment Schedule</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label htmlFor="deploy_sit_date" className="block text-sm font-medium text-gray-700">SIT</label>
                    <input type="date" id="deploy_sit_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={deploySitDate} onChange={(e) => setDeploySitDate(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="deploy_uat_date" className="block text-sm font-medium text-gray-700">UAT</label>
                    <input type="date" id="deploy_uat_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={deployUatDate} onChange={(e) => setDeployUatDate(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="deploy_preprod_date" className="block text-sm font-medium text-gray-700">PREPROD</label>
                    <input type="date" id="deploy_preprod_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={deployPreprodDate} onChange={(e) => setDeployPreprodDate(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="deploy_prod_date" className="block text-sm font-medium text-gray-700">PROD</label>
                    <input type="date" id="deploy_prod_date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black" value={deployProdDate} onChange={(e) => setDeployProdDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t text-right sticky bottom-0">
            <button type="button" className="inline-flex justify-center rounded-md border shadow-sm px-4 py-2 bg-red-500 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-black shadow-sm px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJiraModal;