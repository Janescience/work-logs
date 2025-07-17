// components/AddLogForm.js
'use client';
import { useState } from 'react';

const AddLogForm = ({ jiraId, logOptions, onAddLog }) => {
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [taskDescription, setTaskDescription] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [envDetail, setEnvDetail] = useState('');
  const [sqlDetail, setSqlDetail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddLog(jiraId, {
      logDate,
      taskDescription,
      timeSpent,
      envDetail,
      sqlDetail,
      logOptions: [], // Checkboxes removed
    });
    resetForm();
  };

  const resetForm = () => {
    setLogDate(new Date().toISOString().slice(0, 10));
    setTaskDescription('');
    setTimeSpent('');
    setEnvDetail('');
    setSqlDetail('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-gray-300 text-black rounded grid grid-cols-4 gap-2">
      <div className="">
        <label htmlFor="logDate" className="block text-xs font-medium ">DATE</label>
        <input
          type="date"
          id="logDate"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs text-black"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          required
        />
      </div>
      <div className="col-span-2">
        <label htmlFor="taskDescription" className="block text-sm font-medium ">DETAILS</label>
        <textarea
          id="taskDescription"
          rows="1"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          required
        ></textarea>
      </div>
      <div className="">
        <label htmlFor="timeSpent" className="block text-xs font-medium ">MAN HOURS</label>
        <input
          type="number"
          step="0.5"
          id="timeSpent"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs text-black"
          value={timeSpent}
          onChange={(e) => setTimeSpent(e.target.value)}
          required
        />
      </div>
      <div className="mb-2">
        <label htmlFor="envDetail" className="block text-xs font-medium ">ENV</label>
        <textarea
          id="envDetail"
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs text-black"
          value={envDetail}
          onChange={(e) => setEnvDetail(e.target.value)}
        ></textarea>
      </div>
      <div className="mb-2 col-span-3">
        <label htmlFor="sqlDetail" className="block text-xs font-medium ">SQL</label>
        <textarea
          id="sqlDetail"
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 text-xs text-black"
          value={sqlDetail}
          onChange={(e) => setSqlDetail(e.target.value)}
        ></textarea>
      </div>
      {/* Checkbox options removed */}
      <button
        type="submit"
        className="bg-gray-900 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Save
      </button>
    </form>
  );
};

export default AddLogForm;