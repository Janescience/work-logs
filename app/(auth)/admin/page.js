// app/admin/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminRequired } from '@/hooks/useAuthRequired';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

export default function ManageRolesPage() {
    const { session, status } = useAdminRequired();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [errorUsers, setErrorUsers] = useState(null);
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const availableRoles = ['DEVELOPER', 'TEAM LEAD','IT LEAD','ADMIN']; // Define all possible roles (uppercase as per your DB)

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Function to fetch all users
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        setErrorUsers(null);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch users');
            }
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
        if (status === 'authenticated' && session?.user?.roles?.includes('ADMIN')) { // Check if roles array includes 'ADMIN'
            fetchUsers();
        }
    }, [status, session, fetchUsers]);

    // Handle individual role checkbox change for a user
    const handleRoleCheckboxChange = async (userId, role, isChecked) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;

        let newRoles;
        if (isChecked) {
            newRoles = [...userToUpdate.roles, role]; // Add role
        } else {
            newRoles = userToUpdate.roles.filter(r => r !== role); // Remove role
        }

        // Prevent removing the last role (a user must have at least one role)
        if (newRoles.length === 0) {
            toast.error("A user must have at least one role.");
            return;
        }

        // Prevent admin from removing their own admin role
        if (userId === session.user.id && !newRoles.includes('ADMIN') && userToUpdate.roles.includes('ADMIN')) {
             toast.error("You cannot remove your own admin role.");
             return;
        }


        setUpdatingUserId(userId);
        try {
            const res = await fetch('/api/admin/update-role', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newRoles }), // Send newRoles array
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update role');
            }

            const data = await res.json();
            setUsers(prevUsers =>
                prevUsers.map(user => (user.id === userId ? { ...user, roles: data.user.roles } : user))
            );
            toast.success(`Roles for ${data.user.username} updated.`);
        } catch (error) {
            toast.error(`Error updating roles: ${error.message}`);
        } finally {
            setUpdatingUserId(null);
        }
    };

    // Show loading for authentication or user list fetching
    if (status === 'loading' || loadingUsers) {
        return (
            // Themed loading overlay
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="flex flex-col items-center text-black">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4" /> {/* Adjusted size */}
                    <span className="text-lg font-light">Loading Admin Panel...</span> {/* Adjusted font */}
                </div>
            </div>
        );
    }

    // Redirect handled by useAdminRequired hook if not authenticated or not admin
    if (status === 'unauthenticated' || !session?.user?.roles?.includes('ADMIN')) {
        return null;
    }

    return (
        // Main container for the page, consistent with daily-logs page
        <div className="min-h-screen bg-white p-6">
            <div className="mx-auto"> {/* Centering container */}
                {/* Header - Styled to match DailyLogsPage header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-light text-black mb-4">Manage User Roles</h1>
                    <div className="w-16 h-px bg-black mx-auto"></div> {/* Divider */}
                </div>

                {errorUsers && (
                    <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4 border border-red-200"> {/* Themed error message */}
                        {errorUsers}
                    </div>
                )}

                {/* Users Table */}
                <div className="overflow-x-auto border-2 border-black bg-white rounded-lg p-4"> {/* Themed table container */}
                    <table className="min-w-full divide-y divide-gray-200"> {/* Themed divider */}
                        <thead className="bg-gray-100"> {/* Themed table header background */}
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider"> {/* Themed header text */}
                                    Created Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Username
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Roles
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200"> {/* Themed table body */}
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-gray-600"> {/* Themed text */}
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"> {/* Themed text */}
                                            {formatDate(user.createdAt)} 
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"> {/* Themed text */}
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"> {/* Themed text */}
                                            <div className="flex flex-col space-y-1">
                                                {availableRoles.map(role => (
                                                    <label key={role} className="inline-flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            value={role}
                                                            checked={user.roles?.includes(role) || false} // Ensure roles is an array
                                                            onChange={(e) => handleRoleCheckboxChange(user.id, role, e.target.checked)}
                                                            className="form-checkbox h-4 w-4 text-black rounded focus:ring-black transition duration-150 ease-in-out bg-gray-100 border-gray-300" // Themed checkbox
                                                            // Disable checkbox if updating, or if it's the current admin attempting to remove their own admin role
                                                            // Also disable for the admin themselves when they are trying to change their own roles.
                                                            disabled={
                                                                updatingUserId === user.id ||
                                                                (user.id === session.user.id && role === 'ADMIN' && user.roles?.includes('ADMIN')) ||
                                                                (user.id === session.user.id && user.roles.length === 1 && !user.roles?.includes(role)) // Prevent removing last role for self
                                                            }
                                                        />
                                                        <span className="ml-2 text-gray-700">{role}</span> {/* Themed text */}
                                                    </label>
                                                ))}
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {updatingUserId === user.id ? (
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-black" /> 
                                            ) : (
                                                <span className="text-gray-600">Awaiting changes</span> 
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
