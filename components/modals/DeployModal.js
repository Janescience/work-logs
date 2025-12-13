// components/DeployModal.js
'use client';

import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { Input, Select, Button } from '@/components/ui';

const DeployModal = ({ isOpen, onClose, jira, onDeploySubmit }) => {
    const [deployDate, setDeployDate] = useState(new Date().toISOString().slice(0, 10));
    const [environment, setEnvironment] = useState('PREPROD');
    const [platform, setPlatform] = useState('CI/CD');
    const [imageVersion, setImageVersion] = useState('');
    const [dbSystem, setDbSystem] = useState('MS-SQL Server');
    const [dbName, setDbName] = useState('');
    const [dbSchema, setDbSchema] = useState('dbo');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ตรวจสอบว่า Jira นี้มี SQL script หรือไม่
    const hasSql = useMemo(() => 
        jira.dailyLogs?.some(log => log.sqlDetail && log.sqlDetail.trim() !== ''), 
        [jira.dailyLogs]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);
        const deployData = {
            deployDate,
            environment,
            platform,
            imageVersion,
            dbSystem: hasSql ? dbSystem : null,
            dbName: hasSql ? dbName : null,
            dbSchema: hasSql ? dbSchema : null,
        };

        try {
            await onDeploySubmit(deployData);
            onClose(); // ปิด Modal เมื่อสำเร็จ
        } catch (error) {
            toast.error(`Deployment failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h2 className="text-2xl font-light text-black">
                        Deploy: <span className="font-semibold">{jira.jiraNumber}</span>
                        {jira.serviceName && <span className="text-lg text-gray-600 ml-2">({jira.serviceName})</span>}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:text-black">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Deployment Date"
                                type="date"
                                value={deployDate}
                                onChange={e => setDeployDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Select
                                label="Environment"
                                value={environment}
                                onChange={e => setEnvironment(e.target.value)}
                                options={[
                                    { value: 'PREPROD', label: 'PREPROD' },
                                    { value: 'PROD', label: 'PROD' }
                                ]}
                                required
                            />
                        </div>
                        <div>
                            <Select
                                label="Platform"
                                value={platform}
                                onChange={e => setPlatform(e.target.value)}
                                options={[
                                    { value: 'CI/CD', label: 'CI/CD' },
                                    { value: 'Manual', label: 'Manual' }
                                ]}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                label="Version or Tag"
                                value={imageVersion}
                                onChange={e => setImageVersion(e.target.value)}
                                placeholder="e.g., 2.7.8, latest, v1.0.0"
                            />
                        </div>
                    </div>

                    {hasSql && (
                        <div className="pt-4 border-t">
                             <h3 className="text-lg font-medium text-gray-800">Data Patch Details</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                <div>
                                    <Select
                                        label="Database System"
                                        value={dbSystem}
                                        onChange={e => setDbSystem(e.target.value)}
                                        options={[
                                            { value: 'MS-SQL Server', label: 'MS-SQL Server' },
                                            { value: 'MySQL', label: 'MySQL' },
                                            { value: 'PostgreSQL', label: 'PostgreSQL' },
                                            { value: 'Oracle DB', label: 'Oracle DB' },
                                            { value: 'Other', label: 'Other' }
                                        ]}
                                        required
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Database Name"
                                        value={dbName}
                                        onChange={e => setDbName(e.target.value)}
                                        placeholder="e.g., policyservice"
                                        required
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Schema"
                                        value={dbSchema}
                                        onChange={e => setDbSchema(e.target.value)}
                                        placeholder="e.g., dbo"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting} loadingText="Processing...">
                            Generate & Deploy
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeployModal;