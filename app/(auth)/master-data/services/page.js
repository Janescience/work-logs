// app/master-data/services/page.js
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSpinner, faChevronDown, faChevronUp, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { set } from 'mongoose';

export default function MasterDataServicesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [serviceName, setServiceName] = useState('');
    const [serviceRepo, setServiceRepo] = useState('');
    const [serviceDeployBy, setServiceDeployBy] = useState('');

    const [isSubmittingService, setIsSubmittingService] = useState(false);

    // For Service Detail management
    const [expandedServiceId, setExpandedServiceId] = useState(null);
    const [serviceDetailsMap, setServiceDetailsMap] = useState({}); // Store details for all services
    const [loadingDetailsMap, setLoadingDetailsMap] = useState({}); // Track loading state per service
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [currentDetail, setCurrentDetail] = useState(null);
    const [detailForm, setDetailForm] = useState({
        env: '', url: '', database1: '', database2: '', database3: '',
        server: '', repository: '', soap: '', deployBy: ''
    });
    const [isSubmittingDetail, setIsSubmittingDetail] = useState(false);

    // Environments list for dropdown
    const environments = ['SIT', 'UAT', 'PREPROD', 'PROD'];

    // --- Service CRUD Operations ---
    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/services');
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch services');
            }
            const data = await res.json();
            setServices(data.services);
            
            // Fetch all service details in parallel
            const detailsPromises = data.services.map(service => 
                fetchServiceDetailsBackground(service._id)
            );
            await Promise.all(detailsPromises);
        } catch (err) {
            setError(err.message);
            toast.error(`Error fetching services: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Background fetch for service details
    const fetchServiceDetailsBackground = async (serviceId) => {
        setLoadingDetailsMap(prev => ({ ...prev, [serviceId]: true }));
        try {
            const res = await fetch(`/api/services/${serviceId}/details`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch service details');
            }
            const data = await res.json();
            setServiceDetailsMap(prev => ({ ...prev, [serviceId]: data.serviceDetails }));
        } catch (err) {
            console.error(`Error fetching details for service ${serviceId}:`, err.message);
            setServiceDetailsMap(prev => ({ ...prev, [serviceId]: [] }));
        } finally {
            setLoadingDetailsMap(prev => ({ ...prev, [serviceId]: false }));
        }
    };

    const openServiceModal = (service = null) => {
        setCurrentService(service);
        setServiceName(service ? service.name : '');
        setServiceRepo(service ? service.repository : '');
        setServiceDeployBy(service ? service.deployBy : '');
        setIsServiceModalOpen(true);
        setError(null);
    };

    const closeServiceModal = () => {
        setIsServiceModalOpen(false);
        setCurrentService(null);
        setServiceName('');
        setServiceRepo('');
        setServiceDeployBy('');
        setError(null);
    };

    const handleSubmitService = async (e) => {
        e.preventDefault();
        setIsSubmittingService(true);
        setError(null);

        // Generate temporary ID for new services
        const tempId = currentService?._id || `temp_${Date.now()}`;
        
        // Optimistic update
        if (currentService) {
            // Update existing service
            setServices(prev => prev.map(s => 
                s._id === currentService._id ? { 
                    ...s, 
                    name: serviceName,
                    repository: serviceRepo,      // เพิ่ม
                    deployBy: serviceDeployBy     // เพิ่ม
                } : s
            ));
        } else {
            // Add new service
            const newService = { 
                _id: tempId, 
                name: serviceName, 
                repository: serviceRepo,      // เพิ่ม
                deployBy: serviceDeployBy,    // เพิ่ม
                createdAt: new Date().toISOString() 
            };            
            setServices(prev => [...prev, newService]);
            setServiceDetailsMap(prev => ({ ...prev, [tempId]: [] }));
        }
        
        closeServiceModal();

        try {
            let res;
            const postData = { 
                name: serviceName,
                repository : serviceRepo,
                deployBy : serviceDeployBy
            };

            if (currentService) {
                res = await fetch(`/api/services/${currentService._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData),
                });
            } else {
                res = await fetch('/api/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData),
                });
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to ${currentService ? 'update' : 'add'} service`);
            }

            const result = await res.json();
            
            // Update with real data from server
            if (!currentService && result.service) {
                setServices(prev => prev.map(s => 
                    s._id === tempId ? result.service : s
                ));
                // Update the key in serviceDetailsMap
                setServiceDetailsMap(prev => {
                    const newMap = { ...prev };
                    newMap[result.service._id] = prev[tempId] || [];
                    delete newMap[tempId];
                    return newMap;
                });
            }

            toast.success(`Service ${currentService ? 'updated' : 'added'} successfully!`);
        } catch (err) {
            // Rollback on error
            if (currentService) {
                fetchServices(); // Refresh to get correct data
            } else {
                setServices(prev => prev.filter(s => s._id !== tempId));
                setServiceDetailsMap(prev => {
                    const newMap = { ...prev };
                    delete newMap[tempId];
                    return newMap;
                });
            }
            setError(err.message);
            toast.error(`Error: ${err.message}`);
        } finally {
            setIsSubmittingService(false);
        }
    };

    const handleDeleteService = async (serviceId, serviceName) => {
        if (!confirm(`Are you sure you want to delete service "${serviceName}"? This will also delete all associated details.`)) {
            return;
        }

        // Optimistic update
        const deletedService = services.find(s => s._id === serviceId);
        setServices(prev => prev.filter(s => s._id !== serviceId));
        const deletedDetails = serviceDetailsMap[serviceId];
        setServiceDetailsMap(prev => {
            const newMap = { ...prev };
            delete newMap[serviceId];
            return newMap;
        });

        try {
            const res = await fetch(`/api/services/${serviceId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete service');
            }

            toast.success(`Service "${serviceName}" and its details deleted successfully!`);
            
            // Close details if the deleted service was expanded
            if (expandedServiceId === serviceId) {
                setExpandedServiceId(null);
            }
        } catch (err) {
            // Rollback on error
            if (deletedService) {
                setServices(prev => [...prev, deletedService].sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                ));
                setServiceDetailsMap(prev => ({ ...prev, [serviceId]: deletedDetails || [] }));
            }
            toast.error(`Error deleting service: ${err.message}`);
        }
    };

    // --- Service Detail CRUD Operations ---
    const toggleServiceDetails = (serviceId) => {
        if (expandedServiceId === serviceId) {
            setExpandedServiceId(null);
        } else {
            setExpandedServiceId(serviceId);
        }
    };

    const openDetailModal = (detail = null) => {
        setCurrentDetail(detail);
        setDetailForm({
            env: detail?.env || '',
            url: detail?.url || '',
            database1: detail?.database1 || '',
            database2: detail?.database2 || '',
            database3: detail?.database3 || '',
            server: detail?.server || '',
            repository: detail?.repository || '',
            soap: detail?.soap || '',
            deployBy: detail?.deployBy || ''
        });
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setCurrentDetail(null);
        setDetailForm({
            env: '', url: '', database1: '', database2: '', database3: '',
            server: '', repository: '', soap: '', deployBy: ''
        });
    };

    const handleDetailFormChange = (e) => {
        const { name, value } = e.target;
        setDetailForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitDetail = async (e) => {
        e.preventDefault();
        setIsSubmittingDetail(true);

        const tempId = currentDetail?._id || `temp_detail_${Date.now()}`;
        
        // Optimistic update
        const newDetail = {
            _id: tempId,
            ...detailForm,
            service: expandedServiceId,
            createdAt: new Date().toISOString()
        };

        if (currentDetail) {
            // Update existing detail
            setServiceDetailsMap(prev => ({
                ...prev,
                [expandedServiceId]: prev[expandedServiceId].map(d =>
                    d._id === currentDetail._id ? { ...d, ...detailForm } : d
                )
            }));
        } else {
            // Add new detail
            setServiceDetailsMap(prev => ({
                ...prev,
                [expandedServiceId]: [...(prev[expandedServiceId] || []), newDetail]
            }));
        }

        closeDetailModal();

        try {
            let res;
            const payload = { ...detailForm, service: expandedServiceId };

            if (currentDetail) {
                res = await fetch(`/api/services/${expandedServiceId}/details/${currentDetail._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch(`/api/services/${expandedServiceId}/details`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to ${currentDetail ? 'update' : 'add'} detail`);
            }

            const result = await res.json();
            
            // Update with real data from server
            if (!currentDetail && result.serviceDetail) {
                setServiceDetailsMap(prev => ({
                    ...prev,
                    [expandedServiceId]: prev[expandedServiceId].map(d =>
                        d._id === tempId ? result.serviceDetail : d
                    )
                }));
            }

            toast.success(`Service detail ${currentDetail ? 'updated' : 'added'} successfully!`);
        } catch (err) {
            // Rollback on error
            fetchServiceDetailsBackground(expandedServiceId);
            toast.error(`Error: ${err.message}`);
        } finally {
            setIsSubmittingDetail(false);
        }
    };

    const handleDeleteDetail = async (serviceId, detailId, env) => {
        if (!confirm(`Are you sure you want to delete detail for environment "${env}"?`)) {
            return;
        }

        // Optimistic update
        const deletedDetail = serviceDetailsMap[serviceId]?.find(d => d._id === detailId);
        setServiceDetailsMap(prev => ({
            ...prev,
            [serviceId]: prev[serviceId].filter(d => d._id !== detailId)
        }));

        try {
            const res = await fetch(`/api/services/${serviceId}/details/${detailId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete detail');
            }

            toast.success(`Service detail for "${env}" deleted successfully!`);
        } catch (err) {
            // Rollback on error
            if (deletedDetail) {
                setServiceDetailsMap(prev => ({
                    ...prev,
                    [serviceId]: [...prev[serviceId], deletedDetail]
                }));
            }
            toast.error(`Error deleting detail: ${err.message}`);
        }
    };

    // --- Initial Load / Authentication Check ---
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchServices();
        }
    }, [status, router, fetchServices]);

    if (status === 'loading') {
        return null;
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white p-4 sm:p-6">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-4xl font-light text-black mb-4">Services</h1>
                    <div className="w-16 h-px bg-black mx-auto"></div>
                </div>

                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => openServiceModal()}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm sm:text-base"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-sm" /> New Service
                    </button>
                </div>

                {/* Services Table - Mobile Responsive */}
                <div className="border border-gray-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">No.</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Service Name</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Repository</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Deploy By</th>
                                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 relative">
                                {loading && (
                                    <tr className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                                        <td>
                                            <div className="flex flex-col items-center text-black">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mb-2" />
                                                <span className="text-sm">Loading services...</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {services.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-gray-600">No services found.</td>
                                    </tr>
                                ) : (
                                    services.map((service, index) => (
                                        <React.Fragment key={service._id}>
                                            <tr className={service._id.startsWith('temp_') ? 'opacity-60' : ''}>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}.</td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
                                                <td className="px-3 sm:px-6 py-4 text-sm text-gray-700">
                                                    {service.repository ? (
                                                        <a href={service.repository} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                            {service.repository} <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs ml-1" />
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 text-sm text-gray-700">{service.deployBy || '-'}</td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end font-light">
                                                        <button
                                                            onClick={() => openServiceModal(service)}
                                                            className="text-gray-700 hover:text-black text-xs sm:text-sm"
                                                            disabled={service._id.startsWith('temp_')}
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="mr-1" /> 
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteService(service._id, service.name)}
                                                            className="text-gray-700 hover:text-black text-xs sm:text-sm"
                                                            disabled={service._id.startsWith('temp_')}
                                                        >
                                                            <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> 
                                                        </button>
                                                        <button
                                                            onClick={() => toggleServiceDetails(service._id)}
                                                            className="text-gray-700 hover:text-black text-xs sm:text-sm"
                                                        >
                                                            <FontAwesomeIcon icon={expandedServiceId === service._id ? faChevronUp : faChevronDown} className="mr-1" /> Details
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Service Details Row (Conditionally Rendered) */}
                                            {expandedServiceId === service._id && (
                                                <tr>
                                                    <td colSpan="5" className="p-0">
                                                        <div className="bg-gray-50 border-t border-gray-200 p-4 ">
                                                            <div className="flex justify-between">
                                                                <label className=" mb-3 text-gray-800">
                                                                    Details - {service.name}
                                                                    {loadingDetailsMap[service._id] && <FontAwesomeIcon icon={faSpinner} spin className="ml-2 text-gray-600" />}
                                                                </label>
                                                                
                                                                <button
                                                                    onClick={() => openDetailModal()}
                                                                    className="px-4 py-2 bg-black text-white text-sm font-light hover:bg-gray-800 mb-3"
                                                                    disabled={service._id.startsWith('temp_')}
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add Detail
                                                                </button>
                                                            </div>
                                                            

                                                            {(!serviceDetailsMap[service._id] || serviceDetailsMap[service._id].length === 0) && !loadingDetailsMap[service._id] ? (
                                                                <p className="text-gray-600 text-sm">No details found for this service.</p>
                                                            ) : (
                                                                <div className="overflow-x-auto -mx-4 px-4">
                                                                    {/* Mobile View - Cards */}
                                                                    <div className="sm:hidden space-y-3 text-black">
                                                                        {serviceDetailsMap[service._id]?.map(detail => (
                                                                            <div key={detail._id} className={`border border-gray-200 rounded-lg p-4 bg-white ${detail._id.startsWith('temp_') ? 'opacity-60' : ''}`}>
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <span className="font-semibold ">{detail.env}</span>
                                                                                    <div className="flex gap-2">
                                                                                        <button 
                                                                                            onClick={() => openDetailModal(detail)} 
                                                                                            className="text-gray-700 hover:text-black"
                                                                                            disabled={detail._id.startsWith('temp_')}
                                                                                        >
                                                                                            <FontAwesomeIcon icon={faEdit} />
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={() => handleDeleteDetail(service._id, detail._id, detail.env)} 
                                                                                            className="text-gray-700 hover:text-black"
                                                                                            disabled={detail._id.startsWith('temp_')}
                                                                                        >
                                                                                            <FontAwesomeIcon icon={faTrashAlt} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-1 text-sm">
                                                                                    {detail.url && (
                                                                                        <div className="flex items-start">
                                                                                            <span className="font-medium mr-2">URL:</span>
                                                                                            <a href={detail.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                                                                {detail.url} <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs ml-1" />
                                                                                            </a>
                                                                                        </div>
                                                                                    )}
                                                                                    {detail.database1 && <div><span className="font-medium">DB1:</span> <span className="break-all font-light">{detail.database1}</span></div>}
                                                                                    {detail.database2 && <div><span className="font-medium">DB2:</span> <span className="break-all font-light">{detail.database2}</span></div>}
                                                                                    {detail.database3 && <div><span className="font-medium">DB3:</span> <span className="break-all font-light">{detail.database3}</span></div>}
                                                                                    {detail.server && <div><span className="font-medium">Server:</span> <span className="break-all font-light">{detail.server}</span></div>}
                                                                                    {detail.soap && <div><span className="font-medium">SOAP:</span> <span className="break-all font-light">{detail.soap}</span></div>}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Desktop View - Table */}
                                                                    <div className="hidden sm:block text-sm">
                                                                        <table className="min-w-full divide-y divide-gray-200">
                                                                            <thead className="bg-gray-100">
                                                                                <tr>
                                                                                    <th className="px-4 py-2 text-left font-medium text-gray-800 uppercase">Env</th>
                                                                                    <th className="px-4 py-2 text-left font-medium text-gray-800 uppercase">URL</th>
                                                                                    <th className="px-4 py-2 text-left font-medium text-gray-800 uppercase">DB1</th>
                                                                                    <th className="px-4 py-2 text-left font-medium text-gray-800 uppercase">DB2</th>
                                                                                    <th className="px-4 py-2 text-left font-medium text-gray-800 uppercase">DB3</th>
                                                                                    <th className="px-4 py-2 text-left font-medium text-gray-800 uppercase">Server</th>
                                                                                    <th className="px-4 py-2 text-left font-medium text-gray-800 uppercase">SOAP</th>
                                                                                    <th className="px-4 py-2 text-left font-medium text-gray-800 uppercase">Actions</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                                {serviceDetailsMap[service._id]?.map(detail => (
                                                                                    <tr key={detail._id} className={detail._id.startsWith('temp_') ? 'opacity-60' : ''}>
                                                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{detail.env}</td>
                                                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                                                            <div className="max-w-xs">
                                                                                                {detail.url ? (
                                                                                                    <a href={detail.url} target="_blank" rel="noopener noreferrer" 
                                                                                                       className="text-blue-600 hover:underline break-all" 
                                                                                                       title={detail.url}>
                                                                                                        {detail.url} <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs ml-1" />
                                                                                                    </a>
                                                                                                ) : '-'}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                                                            <div className="max-w-xs overflow-hidden text-ellipsis" title={detail.database1}>
                                                                                                {detail.database1 || '-'}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                                                            <div className="max-w-xs overflow-hidden text-ellipsis" title={detail.database2}>
                                                                                                {detail.database2 || '-'}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                                                            <div className="max-w-xs overflow-hidden text-ellipsis" title={detail.database3}>
                                                                                                {detail.database3 || '-'}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                                                            <div className="max-w-xs overflow-hidden text-ellipsis" title={detail.server}>
                                                                                                {detail.server || '-'}
                                                                                            </div>
                                                                                        </td>
                                                        
                                                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                                                            <div className="max-w-xs overflow-hidden text-ellipsis" title={detail.soap}>
                                                                                                {detail.soap || '-'}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                                                                            <button 
                                                                                                onClick={() => openDetailModal(detail)} 
                                                                                                className="text-gray-700 hover:text-black mr-2"
                                                                                                disabled={detail._id.startsWith('temp_')}
                                                                                            >
                                                                                                <FontAwesomeIcon icon={faEdit} />
                                                                                            </button>
                                                                                            <button 
                                                                                                onClick={() => handleDeleteDetail(service._id, detail._id, detail.env)} 
                                                                                                className="text-gray-700 hover:text-black"
                                                                                                disabled={detail._id.startsWith('temp_')}
                                                                                            >
                                                                                                <FontAwesomeIcon icon={faTrashAlt} />
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Service Modal */}
                {isServiceModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                            <h2 className="text-2xl  mb-4 text-black">
                                {currentService ? 'Edit Service' : 'New Service'}
                            </h2>
                            <form onSubmit={handleSubmitService}>
                                <div className="mb-4">
                                    <label htmlFor="serviceName" className="block text-gray-700 text-sm  mb-2">Service Name</label>
                                    <input
                                        type="text"
                                        id="serviceName"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline "
                                        value={serviceName}
                                        onChange={(e) => setServiceName(e.target.value)}
                                        required
                                        disabled={isSubmittingService}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="serviceRepo" className="block text-gray-700 text-sm  mb-2">Git Repository</label>
                                    <input
                                        type="text"
                                        id="serviceRepo"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline "
                                        value={serviceRepo}
                                        onChange={(e) => setServiceRepo(e.target.value)}
                                        required
                                        disabled={isSubmittingService}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="serviceDeployBy" className="block text-gray-700 text-sm  mb-2">Deploy By</label>
                                    <textarea
                                        id="serviceDeployBy"
                                        rows={3}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline "
                                        value={serviceDeployBy}
                                        onChange={(e) => setServiceDeployBy(e.target.value)}
                                        required
                                        disabled={isSubmittingService}
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={closeServiceModal}
                                        className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-4 rounded"
                                        disabled={isSubmittingService}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-black hover:bg-gray-800 text-white py-2 px-4 rounded"
                                        disabled={isSubmittingService}
                                    >
                                        {currentService ? 'Update' : 'Add'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add/Edit Service Detail Modal */}
                {isDetailModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl  mb-4 text-black">
                                {currentDetail ? 'Edit Service Detail' : `Add Service Detail (${services.find(s => s._id === expandedServiceId)?.name})`}
                            </h2>
                            <form onSubmit={handleSubmitDetail}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Environment (Dropdown) */}
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <label htmlFor="env" className="block text-gray-700 text-sm  mb-2">Environment</label>
                                            <select
                                                id="env"
                                                name="env"
                                                value={detailForm.env}
                                                onChange={handleDetailFormChange}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline "
                                                required
                                                disabled={isSubmittingDetail || currentDetail}
                                            >
                                                {environments.map(env => (
                                                    <option key={env} value={env}>{env}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* Server */}
                                        <div>
                                            <label htmlFor="server" className="block text-gray-700 text-sm  mb-2">Server</label>
                                            <input 
                                                type="text" 
                                                id="server" 
                                                name="server" 
                                                value={detailForm.server} 
                                                onChange={handleDetailFormChange} 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-black " 
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* URL */}
                                    <div >
                                        <label htmlFor="url" className="block text-gray-700 text-sm  mb-2">URL</label>
                                        <input 
                                            type="text" 
                                            id="url" 
                                            name="url" 
                                            value={detailForm.url} 
                                            onChange={handleDetailFormChange} 
                                            className=" appearance-none  rounded w-full py-2 px-3 text-black" 
                                        />
                                    </div>
                                    {/* Database 1 */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="database1" className="block text-gray-700 text-sm  mb-2">Database 1</label>
                                        <input 
                                            type="text" 
                                            id="database1" 
                                            name="database1" 
                                            value={detailForm.database1} 
                                            onChange={handleDetailFormChange} 
                                            className=" appearance-none  rounded w-full py-2 px-3 text-black" 
                                        />
                                    </div>
                                    {/* Database 2 */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="database2" className="block text-gray-700 text-sm mb-2">Database 2</label>
                                        <input 
                                            type="text" 
                                            id="database2" 
                                            name="database2" 
                                            value={detailForm.database2} 
                                            onChange={handleDetailFormChange} 
                                            className=" appearance-none  rounded w-full py-2 px-3 text-black" 
                                        />
                                    </div>
                                    {/* Database 3 */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="database3" className="block text-gray-700 text-sm  mb-2">Database 3</label>
                                        <input 
                                            type="text" 
                                            id="database3" 
                                            name="database3" 
                                            value={detailForm.database3} 
                                            onChange={handleDetailFormChange} 
                                            className=" appearance-none  rounded w-full py-2 px-3 text-black" 
                                        />
                                    </div>
                                    
                                    {/* SOAP */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="soap" className="block text-gray-700 text-sm mb-2">SOAP</label>
                                        <input 
                                            type="text" 
                                            id="soap" 
                                            name="soap" 
                                            value={detailForm.soap} 
                                            onChange={handleDetailFormChange} 
                                            className=" appearance-none  rounded w-full py-2 px-3 text-black" 
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={closeDetailModal}
                                        className="bg-gray-200 hover:bg-gray-300 text-black  py-2 px-4 rounded"
                                        disabled={isSubmittingDetail}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-black hover:bg-gray-800 text-white py-2 px-4 rounded"
                                        disabled={isSubmittingDetail}
                                    >
                                        {currentDetail ? 'Update Detail' : 'Add Detail'}
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