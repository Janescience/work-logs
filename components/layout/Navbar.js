// components/Navbar.js
'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHome, faCalendarDays, faProjectDiagram, faCog, faTasks
} from '@fortawesome/free-solid-svg-icons';

// Function to generate DiceBear avatar URL based on username
const getAvatarUrl = (username) => {
    if (!username) return 'https://placehold.co/32x32/cccccc/ffffff?text=NA';
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;
};

export default function Navbar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const navRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const menuGroups = [
        {
            groupName: "Logs",
            groupIcon: faTasks,
            items: [
                { name: "Dashboard", href: "/", icon: faHome },
                { name: "Daily Logs", href: "/daily-logs", icon: faCalendarDays },
            ]
        },
        {
            groupName: "Setup",
            groupIcon: faCog,
            items: [
                { name: "Projects", href: "/master-data/projects", icon: faProjectDiagram },
                { name: "Services", href: "/master-data/services", icon: faCog },
            ]
        },
    ];

    const isActive = (href) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    const toggleDropdown = (groupName) => {
        setOpenDropdown(openDropdown === groupName ? null : groupName);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
    };

    return (
        <nav ref={navRef} className="fixed top-0 left-0 w-full h-16 bg-white text-black z-50 border-b border-black">
            <div className="grid grid-cols-2 lg:grid-cols-3 items-center h-16 px-8">
                {/* Logo - Left */}
                <div className="flex justify-start">
                    <Link href="/" className="flex items-center text-2xl font-mono !text-black hover:text-gray-600 transition-colors">
                        <img
                            src="/images/logo.png"
                            alt="logo"
                            className="w-8 h-8 object-cover mr-3"
                        />
                        <span className="hidden sm:block tracking-tight">WORK LOGS</span>
                    </Link>
                </div>

                {/* Center Navigation - Grouped */}
                {session && (
                    <div className="hidden lg:flex items-center justify-center">
                        <div className="flex items-center  px-6 py-2 space-x-8">
                            {/* Main menu section */}
                            <div className="flex items-center space-x-8">
                                {menuGroups.map((group) => (
                                    <div key={group.groupName} className="relative">
                                        <button
                                            className={`text-sm font-mono tracking-tight transition-colors duration-200 ${
                                                group.items.some(item => isActive(item.href))
                                                    ? '!text-black font-medium border-b-2 border-black pb-1'
                                                    : '!text-gray-500 hover:!text-black'
                                            }`}
                                            onClick={() => toggleDropdown(group.groupName)}
                                        >
                                            {group.groupName.toUpperCase()}
                                        </button>
                                        
                                        {openDropdown === group.groupName && (
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-48 bg-white border border-black z-50">
                                                {group.items.map((item) => (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        className={`block px-4 py-3 text-sm font-mono transition-colors ${
                                                            isActive(item.href)
                                                                ? 'bg-black !text-white'
                                                                : '!text-black hover:bg-gray-100'
                                                        }`}
                                                        onClick={() => setOpenDropdown(null)}
                                                    >
                                                        {item.name.toUpperCase()}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Divider */}
                            {(session?.user?.roles?.includes('IT LEAD') || 
                              session?.user?.roles?.includes('TEAM LEAD') || 
                              session?.user?.roles?.includes('ADMIN'))}

                            {/* Role-based menu section */}
                            <div className="flex items-center space-x-8">
                                {session?.user?.roles?.includes('IT LEAD') && (
                                    <Link
                                        href="/it-lead"
                                        className={`text-sm font-mono tracking-tight transition-colors duration-200 ${
                                            isActive('/it-lead')
                                                ? '!text-black font-medium border-b-2 border-black pb-1'
                                                : '!text-gray-500 hover:!text-black'
                                        }`}
                                    >
                                        BACKLOG
                                    </Link>
                                )}

                                {session?.user?.roles?.includes('TEAM LEAD') && (
                                    <Link
                                        href="/team"
                                        className={`text-sm font-mono tracking-tight transition-colors duration-200 ${
                                            isActive('/team')
                                                ? '!text-black font-medium border-b-2 border-black pb-1'
                                                : '!text-gray-500 hover:!text-black'
                                        }`}
                                    >
                                        MY TEAM
                                    </Link>
                                )}

                                {session?.user?.roles?.includes('ADMIN') && (
                                    <Link
                                        href="/admin"
                                        className={`text-sm font-mono tracking-tight transition-colors duration-200 ${
                                            isActive('/admin')
                                                ? '!text-black font-medium border-b-2 border-black pb-1'
                                                : '!text-gray-500 hover:!text-black'
                                        }`}
                                    >
                                        USERS
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {!session && <div></div>}

                {/* Right side - Minimal user info */}
                <div className="flex items-center justify-end space-x-6">
                    {status === 'loading' ? (
                        <div className="text-gray-500 text-sm font-mono">LOADING</div>
                    ) : session ? (
                        <>
                            {/* Desktop user info - ultra minimal */}
                            <div className="hidden md:flex items-center space-x-4">
                                <div className="text-right">
                                    <div className="text-sm font-mono text-black">{session.user.name.toUpperCase()}</div>
                                    {session.user.roles && session.user.roles.length > 0 && (
                                        <div className="text-xs font-mono text-gray-500">{session.user.roles.join(', ').toUpperCase()}</div>
                                    )}
                                </div>
                                {session.user.name && (
                                    <img
                                        src={getAvatarUrl(session.user.name)}
                                        alt={`${session.user.name}'s avatar`}
                                        className="w-8 h-8 object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/32x32/000000/ffffff?text=U'; }}
                                    />
                                )}
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="text-sm font-mono text-black hover:text-gray-500 transition-colors border-b border-black hover:border-gray-500"
                                >
                                    LOGOUT
                                </button>
                            </div>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden text-black hover:text-gray-500 transition-colors"
                            >
                                <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                                    <div className={`w-full h-0.5 bg-current transition-transform ${
                                        isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                                    }`}></div>
                                    <div className={`w-full h-0.5 bg-current transition-opacity ${
                                        isMobileMenuOpen ? 'opacity-0' : ''
                                    }`}></div>
                                    <div className={`w-full h-0.5 bg-current transition-transform ${
                                        isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                                    }`}></div>
                                </div>
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            {/* Mobile menu - Minimal */}
            {isMobileMenuOpen && session && (
                <div className="lg:hidden bg-white border-t border-black">
                    <div className="px-8 py-6">
                        {/* Mobile user info */}
                        <div className="flex items-center justify-between pb-6 border-b border-black">
                            <div>
                                <div className="text-sm font-mono text-black">{session.user.name.toUpperCase()}</div>
                                {session.user.roles && session.user.roles.length > 0 && (
                                    <div className="text-xs font-mono text-gray-500">{session.user.roles.join(', ').toUpperCase()}</div>
                                )}
                            </div>
                            {session.user.name && (
                                <img
                                    src={getAvatarUrl(session.user.name)}
                                    alt={`${session.user.name}'s avatar`}
                                    className="w-8 h-8 object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/32x32/000000/ffffff?text=U'; }}
                                />
                            )}
                        </div>

                        {/* Mobile navigation - Minimal list */}
                        <div className="py-6 space-y-4">
                            {menuGroups.flatMap(group => group.items).map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`block text-sm font-mono tracking-tight transition-colors ${
                                        isActive(item.href)
                                            ? 'text-black font-medium'
                                            : 'text-gray-500 hover:text-black'
                                    }`}
                                    onClick={closeMobileMenu}
                                >
                                    {item.name.toUpperCase()}
                                </Link>
                            ))}

                            {/* Role-based mobile items */}
                            {session?.user?.roles?.includes('IT LEAD') && (
                                <Link
                                    href="/it-lead"
                                    className={`block text-sm font-mono tracking-tight transition-colors ${
                                        isActive('/it-lead')
                                            ? 'text-black font-medium'
                                            : 'text-gray-500 hover:text-black'
                                    }`}
                                    onClick={closeMobileMenu}
                                >
                                    IT LEAD
                                </Link>
                            )}

                            {session?.user?.roles?.includes('TEAM LEAD') && (
                                <Link
                                    href="/team"
                                    className={`block text-sm font-mono tracking-tight transition-colors ${
                                        isActive('/team')
                                            ? 'text-black font-medium'
                                            : 'text-gray-500 hover:text-black'
                                    }`}
                                    onClick={closeMobileMenu}
                                >
                                    TEAM LEAD
                                </Link>
                            )}

                            {session?.user?.roles?.includes('ADMIN') && (
                                <Link
                                    href="/admin"
                                    className={`block text-sm font-mono tracking-tight transition-colors ${
                                        isActive('/admin')
                                            ? 'text-black font-medium'
                                            : 'text-gray-500 hover:text-black'
                                    }`}
                                    onClick={closeMobileMenu}
                                >
                                    ADMIN
                                </Link>
                            )}
                        </div>

                        {/* Mobile logout */}
                        <div className="pt-6 border-t border-black">
                            <button
                                onClick={() => {
                                    closeMobileMenu();
                                    signOut({ callbackUrl: '/login' });
                                }}
                                className="text-sm font-mono text-black hover:text-gray-500 transition-colors border-b border-black hover:border-gray-500"
                            >
                                LOGOUT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
