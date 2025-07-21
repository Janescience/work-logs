// app/master-data/projects/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

export default function MasterDataProjectsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null); // For editing
    const [projectName, setProjectName] = useState('');
    const [projectType, setProjectType] = useState('Project'); // New state for project type, default to 'Project'
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/projects');
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch projects');
            }
            const data = await res.json();
            setProjects(data.projects);
        } catch (err) {
            setError(err.message);
            toast.error(`Error fetching projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchProjects();
        }
    }, [status, router, fetchProjects]);

    const openModal = (project = null) => {
        setCurrentProject(project);
        setProjectName(project ? project.name : '');
        setProjectType(project ? project.type : 'Project'); // Set projectType when opening modal
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProject(null);
        setProjectName('');
        setProjectType('Project'); // Reset projectType on close
        setError(null); // Clear modal error
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            let res;
            // Data to send to API now includes type
            const postData = { name: projectName, type: projectType };

            if (currentProject) {
                // Edit existing project
                res = await fetch(`/api/projects/${currentProject._id}`, { // Use _id for currentProject
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData),
                });
            } else {
                // Add new project
                res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData),
                });
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to ${currentProject ? 'update' : 'add'} project`);
            }

            toast.success(`Project ${currentProject ? 'updated' : 'added'} successfully!`);
            closeModal();
            fetchProjects(); // Refresh list
        } catch (err) {
            setError(err.message);
            toast.error(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (projectId, projectName) => {
        if (!confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete project');
            }

            toast.success(`Project "${projectName}" deleted successfully!`);
            fetchProjects(); // Refresh list
        } catch (err) {
            toast.error(`Error deleting project: ${err.message}`);
        }
    };

    if (status === 'loading' || loading) {
        return (
            // Themed loading overlay
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="flex flex-col items-center text-black">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4" />
                    <span className="text-lg font-light">Loading Projects...</span>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Redirect handled by useEffect
    }

    if (error) {
        return <div className="p-4 bg-white text-red-500 min-h-screen">Error: {error}</div>;
    }

    return (
        // Main container for the page, consistent with daily-logs page
        <div className="min-h-screen bg-white p-6">
            <div className="mx-auto"> {/* Centering container */}
                {/* Header - Styled to match DailyLogsPage header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-light text-black mb-4">Projects</h1>
                    <div className="w-16 h-px bg-black mx-auto"></div> {/* Divider */}
                </div>

                {/* Add New Project Button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => openModal()}
                        className="px-6 py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-colors flex items-center gap-2" // Themed button
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-sm" /> New Project
                    </button>
                </div>

                {/* Projects Table */}
                <div className="overflow-x-auto border-2 border-black bg-white rounded-lg p-4"> {/* Themed table container */}
                    <table className="min-w-full divide-y divide-gray-200"> {/* Themed divider */}
                        <thead className="bg-gray-100"> {/* Themed table header background */}
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider"> {/* Themed header text */}
                                    No. 
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Project Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Created Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Last Updated
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200"> {/* Themed table body */}
                            {projects.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-gray-600"> {/* Themed text */}
                                        No projects found.
                                    </td>
                                </tr>
                            ) : (
                                projects.map((project, index) => (
                                    <tr key={project._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {index + 1}. 
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {project.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {project.type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"> {/* Themed text */}
                                            {formatDate(project.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"> {/* Themed text */}
                                            {formatDate(project.updatedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openModal(project)}
                                                className="text-gray-700 hover:text-black mr-4" // Themed edit button
                                            >
                                                <FontAwesomeIcon icon={faEdit} className="mr-1" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project._id, project.name)}
                                                className="text-gray-700 hover:text-black" // Themed delete button
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add/Edit Project Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"> {/* Themed modal background */}
                            <h2 className="text-2xl font-bold mb-4 text-black"> {/* Themed modal header */}
                                {currentProject ? 'Edit Project' : 'Add New Project'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="projectName" className="block text-gray-700 text-sm font-bold mb-2">
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        id="projectName"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 border-gray-300" // Themed input
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="projectType" className="block text-gray-700 text-sm font-bold mb-2">
                                        Project Type
                                    </label>
                                    <select
                                        id="projectType"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 border-gray-300" // Themed select
                                        value={projectType}
                                        onChange={(e) => setProjectType(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                    >
                                        <option value="Project">Project</option>
                                        <option value="Product">Product</option>
                                        <option value="BAU">BAU</option>
                                        <option value="Other">Other</option>

                                    </select>
                                </div>

                                {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded" // Themed cancel button
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded" // Themed submit button
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Saving...
                                            </>
                                        ) : (
                                            currentProject ? 'Update' : 'Add'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
