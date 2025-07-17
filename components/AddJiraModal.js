// components/AddJiraModal.js
'use client';
import { useState,useEffect } from 'react';

const AddJiraModal = ({ show, onClose, onAddJira }) => {
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [jiraStatuses, setJiraStatuses] = useState([]);
  const [actualStatuses, setActualStatuses] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [serviceName, setServiceName] = useState('');  
  const [jiraNumber, setJiraNumber] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [effortEstimation, setEffortEstimation] = useState('');
  const [jiraStatus, setJiraStatus] = useState('');
  const [actualStatus, setActualStatus] = useState('');
  const [relatedJira, setRelatedJira] = useState('');
  const [environment, setEnvironment] = useState('');

  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]); 

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data.projects));

    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data.services));

    // ดึง Jira Status และ Actual Status จากไฟล์โดยตรง (ถ้าต้องการ)
    import('@/data/config').then(config => {
      setJiraStatuses(config.jiraStatuses);
      setActualStatuses(config.actualStatuses);
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddJira({
      projectName,
      jiraNumber,
      description,
      serviceName,
      assignee,
      effortEstimation,
      jiraStatus,
      actualStatus,
      relatedJira,
      environment,
      dueDate
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setProjectName('');
    setJiraNumber('');
    setDescription('');
    setServiceName('');
    setEffortEstimation('');
    setJiraStatus('');
    setActualStatus('');
    setRelatedJira('');
    setEnvironment('');
    setDueDate(new Date());
  };

  if (!show) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">New Task</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4"> {/* ใช้ Grid Layout */}
            <div className="mb-4 col-span-2">
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700">Project</label>
              <select
                id="project_name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                placeholder="-- Select/Type Project --"
              >
                <option value="">-- Select Project --</option>
                {projects.map(project => (
                  <option key={project._id} value={project.name}>{project.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="jira_number" className="block text-sm font-medium text-gray-700">JIRA Number</label>
              <input
                type="text"
                id="jira_number"
                placeholder="IR-XXXX"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
                value={jiraNumber}
                onChange={(e) => setJiraNumber(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">JIRA Detail</label>
              <textarea
                id="description"
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="service_name" className="block text-sm font-medium text-gray-700">Service</label>
              <select
                id="service_name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              >
                <option value="">-- Select Service --</option>
                {services.map(service => (
                  <option key={service.name} value={service.name}>{service.name}</option>
                ))}
              </select>
            </div>
            {/* <div className="mb-4">
              <label htmlFor="environment" className="block text-sm font-medium text-gray-700">Environment:</label>
              <select
                id="environment"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              >
                <option value="">-- เลือก Environment --</option>
                <option value="sit">SIT</option>
                <option value="uat">UAT</option>
                <option value="preprod">PREPROD</option>
                <option value="prod">PROD</option>
              </select>
            </div> */}
            {/* <div className="mb-4">
              <label htmlFor="jira_status" className="block text-sm font-medium text-gray-700">JIRA Status:</label>
              <select
                id="jira_status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
                value={jiraStatus}
                onChange={(e) => setJiraStatus(e.target.value)}
              >
                <option value="">-- เลือก Status --</option>
                {jiraStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div> */}
            <div className="mb-4">
              <label htmlFor="actual_status" className="block text-sm font-medium text-gray-700">Actual Status:</label>
              <select
                id="actual_status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
                value={actualStatus}
                onChange={(e) => setActualStatus(e.target.value)}
              >
                <option value="">-- Select Status --</option>
                {actualStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date:</label>
              <input
                type="date"
                id="due_date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button type="button" className="inline-flex justify-center rounded-md border  shadow-sm px-4 py-2 bg-red-500 text-sm font-medium text-white  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-black shadow-sm px-4 py-2  text-sm font-medium text-white  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJiraModal;