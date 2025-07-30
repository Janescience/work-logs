// app/master-data/projects/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { Button, Input, Select, Modal, LoadingSpinner, PageHeader, ErrorMessage, Table } from '@/components/ui';
import { get, post, put, del, handleFormSubmission } from '@/utils/apiHelpers';
import { formatDate } from '@/utils/formatters';

export default function MasterDataProjectsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [formData, setFormData] = useState({ name: '', type: 'Project' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const projectTypes = [
        { value: 'Project', label: 'Project' },
        { value: 'Product', label: 'Product' },
        { value: 'BAU', label: 'BAU' },
        { value: 'Other', label: 'Other' }
    ];
    
    const handleInputChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };


    const fetchProjects = useCallback(async () => {
        await handleFormSubmission(
            () => get('/api/projects'),
            setLoading,
            setError,
            () => {},
            (data) => setProjects(data.projects)
        );
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
        setFormData({
            name: project ? project.name : '',
            type: project ? project.type : 'Project'
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProject(null);
        setFormData({ name: '', type: 'Project' });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const apiCall = currentProject 
            ? () => put(`/api/projects/${currentProject._id}`, formData)
            : () => post('/api/projects', formData);
            
        await handleFormSubmission(
            apiCall,
            setIsSubmitting,
            setError,
            () => {},
            () => {
                toast.success(`Project ${currentProject ? 'updated' : 'added'} successfully!`);
                closeModal();
                fetchProjects();
            }
        );
    };

    const handleDelete = async (projectId, projectName) => {
        if (!confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
            return;
        }

        await handleFormSubmission(
            () => del(`/api/projects/${projectId}`),
            () => {},
            (error) => toast.error(`Error deleting project: ${error}`),
            () => {},
            () => {
                toast.success(`Project "${projectName}" deleted successfully!`);
                fetchProjects();
            }
        );
    };

    if (status === 'loading' || loading) {
        return <LoadingSpinner fullScreen size="xl" text="Loading Projects..." />;
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="mx-auto px-6 py-8">
                    <PageHeader title="PROJECTS" />
                    
                    {/* Action button - Centered */}
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="primary"
                            onClick={() => openModal()}
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" />
                            New Project
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto p-6">
                <ErrorMessage type="error" message={error} />

                <Table
                    columns={[
                        { key: 'number', title: 'No.', render: (_, __, index) => `${index + 1}.` },
                        { key: 'name', title: 'Project Name' },
                        { 
                            key: 'type', 
                            title: 'Type',
                            render: (value) => (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {value}
                                </span>
                            )
                        },
                        { 
                            key: 'createdAt', 
                            title: 'Created Date',
                            render: (value) => formatDate(value, 'DD-MM-YYYY')
                        },
                        { 
                            key: 'updatedAt', 
                            title: 'Last Updated',
                            render: (value) => formatDate(value, 'DD-MM-YYYY')
                        },
                        {
                            key: 'actions',
                            title: 'Actions',
                            render: (_, project) => (
                                <div className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openModal(project)}
                                        className="mr-2"
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="mr-1" /> Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(project._id, project.name)}
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> Delete
                                    </Button>
                                </div>
                            )
                        }
                    ]}
                    data={projects}
                    loading={loading}
                    emptyMessage="No projects found. Click 'New Project' to add one."
                    className="border-2 border-black rounded-lg"
                />

                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={currentProject ? 'Edit Project' : 'Add New Project'}
                    size="md"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Project Name"
                            value={formData.name}
                            onChange={handleInputChange('name')}
                            required
                            disabled={isSubmitting}
                        />

                        <Select
                            label="Project Type"
                            value={formData.type}
                            onChange={handleInputChange('type')}
                            options={projectTypes}
                            required
                            disabled={isSubmitting}
                        />

                        <ErrorMessage type="error" message={error} />
                        
                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={closeModal}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={isSubmitting}
                                loadingText="Saving..."
                            >
                                {currentProject ? 'Update' : 'Add'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}
