// app/admin/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminRequired } from '@/hooks/useAuthRequired';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const getAvatarUrl = (username) => `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;

export default function ManageRolesPage() {
    const { session, status } = useAdminRequired();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [errorUsers, setErrorUsers] = useState(null);
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const availableRoles = ['DEVELOPER', 'TEAM LEAD','IT LEAD','ADMIN'];
    const availableTypes = ['Non-Core', 'Core'];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    };

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        setErrorUsers(null);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch users');
            const data = await res.json();
            setUsers(data.users);
        } catch (error) {
            setErrorUsers(error.message);
            toast.error(`Error fetching users: ${error.message}`);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.roles?.includes('ADMIN')) {
            fetchUsers();
        }
    }, [status, session, fetchUsers]);

    const handleUpdateUser = async (userId, updatePayload) => {
        setUpdatingUserId(userId);
        try {
            const res = await fetch('/api/admin/update-role', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...updatePayload }),
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to update user');
            
            const data = await res.json();
            // To show the updated team name instantly, we need to refetch all users.
            // A more advanced solution would be to update the state optimistically.
            toast.success(`User ${data.user.username} updated.`);
            fetchUsers(); 
        } catch (error) {
            toast.error(`Error updating user: ${error.message}`);
            fetchUsers();
        } finally {
            setUpdatingUserId(null);
        }
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

    if (status === 'loading' || loadingUsers) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="flex flex-col items-center text-black">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4" />
                    <span className="text-lg font-light">Loading Admin Panel...</span>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated' || !session?.user?.roles?.includes('ADMIN')) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-light text-black mb-4">Manage Users</h1>
                    <div className="w-16 h-px bg-black mx-auto"></div>
                </div>

                {errorUsers && <div className="text-red-500 p-3 mb-4">{errorUsers}</div>}

                <div className="overflow-x-auto border border-gray-300 bg-white  p-4">
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
                                    <td className=" py-4 text-sm">
                                        <select
                                            value={user.type}
                                            onChange={(e) => handleTypeChange(user.id, e.target.value)}
                                            disabled={updatingUserId === user.id}
                                            className="w-full rounded-md border-gray-300 shadow-sm text-black p-1 text-xs"
                                        >
                                            {availableTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
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
                                    <td className=" py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}