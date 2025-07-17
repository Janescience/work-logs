// components/CalendarDetailModal.js (Updated from your DetailModal.js)
'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faRocket } from '@fortawesome/free-solid-svg-icons'; // Added faRocket

// Helper function for date formatting in modal
const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

// Now accepts dailySummary directly, no more isTable or content
const CalendarDetailModal = ({ isOpen, onClose, title, dailySummary }) => {
  if (!isOpen) return null;

  // Destructure relevant data from dailySummary
  const { dueJiras, deploymentLogs, taskAndOtherLogs, totalHours } = dailySummary;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"> {/* Increased max-w for better table display */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-2xl font-light text-black">{title}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* 1. Due Today Section */}
        {dueJiras && dueJiras.length > 0 && (
          <>
            <h3 className="text-lg font-light text-gray-800 mb-3 flex items-center">
                Due
            </h3>
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <ul className="list-disc list-inside text-sm text-red-700">
                    {dueJiras.map((jira, index) => (
                        <li key={index} className="">
                            <strong>{jira.jiraNumber}:</strong> {jira.description} 
                        </li>
                    ))}
                </ul>
            </div>
          </>
            
        )}

        {/* 2. Deployments Section */}
        {deploymentLogs && deploymentLogs.length > 0 && (
            <div className="mb-6">
                <h3 className="text-lg font-light text-gray-800 mb-3 flex items-center">
                    Deployments
                </h3>
                <div className="overflow-x-auto border border-gray-300 rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase">No</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase">Jira No.</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase">Description</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {deploymentLogs.map((log, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{log.jiraNumber || '-'}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{log.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* 3. Tasks & Other Logs Section */}
        {taskAndOtherLogs && taskAndOtherLogs.length > 0 && (
            <div className="mb-6">
                <h3 className="text-lg font-light text-gray-800 mb-3">Tasks</h3>
                <div className="overflow-x-auto border border-gray-300 rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase">No</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase">Jira No.</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase">Description</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 uppercase">Hours</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {taskAndOtherLogs.map((log, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{log.jiraNumber || '-'}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{log.description}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{log.hours}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Fallback message if no content */}
        {totalHours === 0 && dueJiras.length === 0 && (
            <p className="text-gray-600 text-center py-4">No work logs or due dates for this day.</p>
        )}

        <div className="mt-4 pt-2 border-t border-gray-200 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-bold rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarDetailModal;