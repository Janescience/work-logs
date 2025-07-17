// components/Navbar.js
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
// FontAwesomeIcon and faBars import are not needed in this simplified Navbar version
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
// import { faBars } from '@fortawesome/free-solid-svg-icons'; 

// Function to generate DiceBear avatar URL based on username
const getAvatarUrl = (username) => {
    if (!username) return 'https://placehold.co/32x32/cccccc/ffffff?text=NA';
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;
};

export default function Navbar() { // Removed toggleSidebar and isSidebarOpen props as per previous decision
    const { data: session, status } = useSession();

    return (
        // Navbar container with fixed top, full width, and minimalist theme
        <nav className="fixed top-0 left-0 w-full h-16 bg-white p-4 text-black shadow-md z-50 border-b border-gray-200"> {/* Updated background, text, and added bottom border */}
            <div className=" mx-auto flex justify-between items-center h-full"> {/* mx-auto for centering content within container */}

                <Link href="/" className="flex text-2xl font-light !text-black hover:text-gray-800 transition-colors duration-150"> {/* Adjusted font and text color */}
                    <img
                        src="/images/logo.png"
                        alt="logo"
                        className="w-8 h-8 object-cover shadow-sm mr-2"
                    />
                    Work Logs
                </Link>

                <div className="flex items-center space-x-4">
                    {status === 'loading' ? (
                        <div className="text-gray-600">Loading...</div> // Themed loading text
                    ) : session ? (
                        <>
                            {/* User Avatar */}
                            {session.user.name && (
                                <img
                                    src={getAvatarUrl(session.user.name)}
                                    alt={`${session.user.name}'s avatar`}
                                    className="w-9 h-9 rounded-full border border-gray-300 object-cover shadow-sm" // Themed border
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/36x36/cccccc/000000?text=Err'; }} // Themed error placeholder
                                />
                            )}

                            <span className="font-semibold text-black">{session.user.name.toUpperCase()}</span> {/* Themed text color */}
                            {/* Display user roles, if available (themed for consistency) */}
                            {session.user.roles && session.user.roles.length > 0 && (
                                <span className="text-sm text-gray-700">[{session.user.roles.join(', ')}]</span> // Themed text color
                            )}

                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="bg-black hover:bg-gray-800 text-white font-light py-2 px-4  focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-150" // Themed button
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        // If not logged in, login/register buttons are handled by the page, not the navbar.
                        null
                    )}
                </div>
            </div>
        </nav>
    );
}
