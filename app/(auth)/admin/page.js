// app/admin/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminRequired } from '@/hooks/auth';
import { toast } from 'react-toastify';
import { LoadingSpinner, PageHeader, Select, ErrorMessage } from '@/components/ui';
import { get, put, handleFormSubmission } from '@/utils/apiHelpers';
import { formatDate } from '@/utils/formatters';

const getAvatarUrl = (username) => `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;

export default function ManageRolesPage() {
    const { session, status } = useAdminRequired();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [errorUsers, setErrorUsers] = useState(null);
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const availableRoles = ['DEVELOPER', 'TEAM LEAD','IT LEAD','ADMIN'];
    const availableTypes = ['Non-Core', 'Core'];


    const fetchUsers = useCallback(async () => {
        await handleFormSubmission(
            () => get('/api/admin/users'),
            setLoadingUsers,
            setErrorUsers,
            () => {},
            (data) => setUsers(data.users)
        );
    }, []);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.roles?.includes('ADMIN')) {
            fetchUsers();
        }
    }, [status, session, fetchUsers]);

    const handleUpdateUser = async (userId, updatePayload) => {
        setUpdatingUserId(userId);
        
        await handleFormSubmission(
            () => put('/api/admin/update-role', { userId, ...updatePayload }),
            () => {}, // loading is handled by updatingUserId
            (error) => {
                toast.error(`Error updating user: ${error}`);
                fetchUsers();
            },
            () => {},
            (data) => {
                toast.success(`User ${data.user.username} updated.`);
                fetchUsers();
            }
        );
        
        setUpdatingUserId(null);
    };

    const handleRoleCheckboxChange = (userId, role, isChecked) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;

        let newRoles = isChecked
            ? [...userToUpdate.roles, role]
            : userToUpdate.roles.filter(r => r !== role);

        if (newRoles.length === 0) {
            toast.warn("A user must have at least one role.");
            return;
        }
        if (userId === session.user.id && !newRoles.includes('ADMIN')) {
             toast.error("You cannot remove your own admin role.");
             return;
        }
        
        handleUpdateUser(userId, { newRoles });
    };

    const handleTypeChange = (userId, newType) => {
        handleUpdateUser(userId, { type: newType });
    };

    if (status === 'loading') {
        return (
            <LoadingSpinner 
                fullScreen 
                size="xl" 
                text="Loading Admin Panel..." 
            />
        );
    }

    if (status === 'unauthenticated' || !session?.user?.roles?.includes('ADMIN')) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="mx-auto px-6 py-8">
                    <PageHeader title="USERS" />
                </div>
            </div>

            <div className="mx-auto p-6">
                <ErrorMessage type="error" message={errorUsers} />

                {loadingUsers ? (
                    <LoadingSpinner centered text="Loading users..." />
                ) : users.length === 0 ? (
                    <div className="text-center py-12 border border-gray-300 bg-white">
                        <div className="text-gray-500">
                            <div className="text-lg font-light mb-2">No users found</div>
                            <div className="text-sm">Users will appear here once they register</div>
                        </div>
                    </div>
                ) : (
                    <div className="border border-gray-300 bg-white">
                        {/* Mobile view */}
                        <div className="block lg:hidden">
                            {users.map(user => (
                                <div key={user.id} className={`p-4 border-b border-gray-200 ${updatingUserId === user.id ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center mb-3">
                                        <img className="h-10 w-10 rounded-full" src={getAvatarUrl(user.username)} alt="" />
                                        <div className="ml-3">
                                            <div className="text-sm font-semibold text-gray-900">{user.username.toUpperCase()}</div>
                                            <div className="text-sm text-gray-500">{user.name}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-700">Contact:</span>
                                            <div className="text-gray-600">{user.email}</div>
                                            <div className="text-gray-600">{user.phone}</div>
                                        </div>
                                        
                                        <div>
                                            <span className="font-medium text-gray-700">Team:</span>
                                            <span className="ml-2 text-gray-600">{user.teamName}</span>
                                        </div>
                                        
                                        <div>
                                            <span className="font-medium text-gray-700">Type:</span>
                                            <Select
                                                size="sm"
                                                value={user.type}
                                                onChange={(e) => handleTypeChange(user.id, e.target.value)}
                                                disabled={updatingUserId === user.id}
                                                options={availableTypes.map(type => ({ value: type, label: type }))}
                                                className="ml-2 text-xs"
                                            />
                                        </div>
                                        
                                        <div>
                                            <div className="font-medium text-gray-700 mb-2">Roles:</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {availableRoles.map(role => (
                                                    <label key={role} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={user.roles?.includes(role) || false}
                                                            onChange={(e) => handleRoleCheckboxChange(user.id, role, e.target.checked)}
                                                            className="form-checkbox h-4 w-4 text-black rounded mr-2"
                                                            disabled={updatingUserId === user.id || (user.id === session.user.id && role === 'ADMIN')}
                                                        />
                                                        <span className="text-xs">{role}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <span className="font-medium text-gray-700">Registered:</span>
                                            <span className="ml-2 text-gray-600">{formatDate(user.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Desktop view */}
                        <div className="hidden lg:block overflow-x-auto p-4">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Team</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Roles</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Registered</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map(user => (
                                <tr key={user.id} className={updatingUserId === user.id ? 'opacity-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="h-10 w-10 rounded-full" src={getAvatarUrl(user.username)} alt="" />
                                            <div className="ml-4">
                                                <div className="text-sm font-semibold text-gray-900">{user.username.toUpperCase()}</div>
                                                <div className="text-sm text-gray-500">{user.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                        <div className="text-sm text-gray-500">{user.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.teamName}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <Select
                                            size="sm"
                                            value={user.type}
                                            onChange={(e) => handleTypeChange(user.id, e.target.value)}
                                            disabled={updatingUserId === user.id}
                                            options={availableTypes.map(type => ({ value: type, label: type }))}
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            {availableRoles.map(role => (
                                                <label key={role} className="inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={user.roles?.includes(role) || false}
                                                        onChange={(e) => handleRoleCheckboxChange(user.id, role, e.target.checked)}
                                                        className="form-checkbox h-4 w-4 text-black rounded"
                                                        disabled={updatingUserId === user.id || (user.id === session.user.id && role === 'ADMIN')}
                                                    />
                                                    <span className="ml-2 text-xs">{role}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                                </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}