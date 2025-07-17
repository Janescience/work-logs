// components/DeployModal.js
'use client';

import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const DeployModal = ({ isOpen, onClose, jira, onDeploySubmit }) => {
    const [deployDate, setDeployDate] = useState(new Date().toISOString().slice(0, 10));
    const [environment, setEnvironment] = useState('PREPROD');
    const [platform, setPlatform] = useState('Docker');
    const [imageVersion, setImageVersion] = useState('');
    const [language, setLanguage] = useState('JAVA');
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
        if (platform === 'Docker' && !imageVersion) {
            toast.error("Image Version is required for Docker platform.");
            return;
        }

        setIsSubmitting(true);
        const deployData = {
            deployDate,
            environment,
            platform,
            imageVersion,
            language,
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
                    </h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-black">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Deployment Date</label>
                            <input type="date" value={deployDate} onChange={e => setDeployDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Environment</label>
                            <select value={environment} onChange={e => setEnvironment(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black" required>
                                <option value="PREPROD">PREPROD</option>
                                <option value="PROD">PROD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Platform</label>
                            <select value={platform} onChange={e => setPlatform(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black" required>
                                <option value="Docker">Docker</option>
                                <option value="AWS ECS">AWS ECS</option>
                                <option value="Windows Server">Windows Server</option>
                            </select>
                        </div>
                        {platform === 'Docker' && (
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Image Version</label>
                                <input type="text" value={imageVersion} onChange={e => setImageVersion(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black" placeholder="e.g., 2.7.8" required />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Development Language</label>
                            <select value={language} onChange={e => setLanguage(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black" required>
                                <option value="JAVA">JAVA</option>
                                <option value=".NET">.NET</option>
                                <option value="PHP">PHP</option>
                                <option value="Visual Basic">Visual Basic</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {hasSql && (
                        <div className="pt-4 border-t">
                             <h3 className="text-lg font-medium text-gray-800">Data Patch Details</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Database System</label>
                                    <select value={dbSystem} onChange={e => setDbSystem(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black" required>
                                        <option value="MS-SQL Server">MS-SQL Server</option>
                                        <option value="MySQL">MySQL</option>
                                        <option value="PostgreSQL">PostgreSQL</option>
                                        <option value="Oracle DB">Oracle DB</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Database Name</label>
                                    <input type="text" value={dbName} onChange={e => setDbName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black" placeholder="e.g., policyservice" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Schema</label>
                                    <input type="text" value={dbSchema} onChange={e => setDbSchema(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black" placeholder="e.g., dbo" required />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-4 rounded" disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="bg-black hover:bg-gray-800 text-white py-2 px-4 rounded flex items-center" disabled={isSubmitting}>
                            {isSubmitting ? <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Processing...</> : 'Generate & Deploy'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeployModal;