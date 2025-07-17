// components/Sidebar.js
'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation'; // Import usePathname
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Re-added specific icons for menu items
import { faFolderOpen, faHistory, faListCheck, faUserShield, faUsers, faTasks, faCog } from '@fortawesome/free-solid-svg-icons';

// Removed isSidebarOpen from props
export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const menuGroups = [
        {
            groupName: "Logs",
            groupIcon: faTasks, // Icon for the group header
            items: [
                { name: "Dashboard", href: "/", icon: "" }, // Added icon back
                { name: "Daily Logs", href: "/daily-logs", icon: "" }, // Added icon back
                { name: "Deployment History", href: "/deployment-history", icon: "" }, // Added icon back
            ]
        },
        {
            groupName: "Setup",
            groupIcon: faCog, // Icon for the group header
            items: [
                { name: "Projects", href: "/master-data/projects", icon: "" }, // Added icon back
                // Assuming you want services in master data, adding it back with an icon
                // You'll need to create app/master-data/services/page.js and its API if not done yet
                { name: "Services", href: "/master-data/services", icon: "" }, // Added icon and new item
            ]
        },
        // Admin group will be handled separately as it depends on user role
    ];

    const isActive = (href) => {
        // For dashboard, check if pathname is exactly '/'
        if (href === '/') {
            return pathname === '/';
        }
        // For other links, check if pathname starts with the href
        return pathname.startsWith(href);
    };

    return (
        // Sidebar container with fixed width, always visible on md screens and up
        <aside
            className={`
                hidden md:flex 
                fixed top-16 left-0 h-[calc(100vh-64px)] 
                w-58 
                bg-white text-black p-4 flex-col shadow-lg z-40 
                dark:bg-gray-900 dark:text-white 
            `}
            // No inline style needed as top-16 and h-[calc(100vh-64px)] are sufficient
        >
            <nav className="flex-grow">
                {menuGroups.map((group) => (
                    <div key={group.groupName} className="mb-6"> {/* Margin bottom for each group */}
                        <h3 className="uppercase font-light text-gray-400 mb-2 flex items-center"> {/* Adjusted text color for light theme */}
                            {group.groupIcon && <FontAwesomeIcon icon={group.groupIcon} className="mr-2 text-sm" />} {/* Adjusted icon size */}
                            {group.groupName}
                        </h3>
                        <ul className="space-y-2">
                            {group.items.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`
                                            flex items-center p-2 rounded-lg transition duration-150 ease-in-out
                                            text-black 
                                            dark:text-white 
                                            ${isActive(item.href)
                                                ? 'bg-gray-200 font-semibold dark:bg-gray-800' // Active state for light/dark theme
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800' // Hover state for light/dark theme
                                            }
                                        `}
                                    >
                                        <FontAwesomeIcon icon={item.icon} className="mr-3 text-xs" /> {/* Added icon rendering */}
                                        <span className="text-xs whitespace-nowrap">{item.name}</span> {/* Adjusted text size */}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {session?.user?.roles?.includes('TEAM LEAD') && (
                    <div className="mb-6">
                        <h3 className="uppercase font-light text-gray-400 mb-2 flex items-center"> {/* Adjusted text color for light theme */}
                            <FontAwesomeIcon icon={faUsers} className="mr-2 text-xs" /> {/* Adjusted icon size */}
                            Team Lead
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/team"
                                    className={`
                                        flex items-center p-2 rounded-lg transition duration-150 ease-in-out
                                        text-black /* Ensure text is black for light theme */
                                        dark:text-white /* Ensure text is white in dark mode */
                                        ${isActive('/team')
                                            ? 'bg-gray-200 font-semibold dark:bg-gray-800' // Active state for light/dark theme
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800' // Hover state for light/dark theme
                                        }
                                    `}
                                >
                                    <span className="text-xs whitespace-nowrap">My Team</span> {/* Adjusted text size */}
                                </Link>
                            </li>
                        </ul>
                    </div>
                )}

                {/* Admin group - only show if user has 'ADMIN' role */}
                {session?.user?.roles?.includes('ADMIN') && (
                    <div className="mb-6">
                        <h3 className="uppercase font-light text-gray-400 mb-2 flex items-center"> {/* Adjusted text color for light theme */}
                            <FontAwesomeIcon icon={faUserShield} className="mr-2 text-xs" /> {/* Adjusted icon size */}
                            Admin
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/admin"
                                    className={`
                                        flex items-center p-2 rounded-lg transition duration-150 ease-in-out
                                        text-black /* Ensure text is black for light theme */
                                        dark:text-white /* Ensure text is white in dark mode */
                                        ${isActive('/admin')
                                            ? 'bg-gray-200 font-semibold dark:bg-gray-800' // Active state for light/dark theme
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800' // Hover state for light/dark theme
                                        }
                                    `}
                                >
                                    <span className="text-xs whitespace-nowrap">Manage Roles</span> {/* Adjusted text size */}
                                </Link>
                            </li>
                        </ul>
                    </div>
                )}
            </nav>
        </aside>
    );
}
