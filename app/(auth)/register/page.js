'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState(''); 
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState('Non-Core');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, email, name, phone, type: userType }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message);
                setUsername('');
                setPassword('');
                setEmail('');
                // Redirect after showing success message
                setTimeout(() => {
                    router.push('/login?registered=true');
                }, 1500);
            } else {
                setError(data.message || 'Registration failed.');
            }
        } catch (err) {
            console.error('Client-side registration error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-light text-black">Register</h1>
                    <div className="w-12 h-px bg-black mx-auto mt-4"></div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Input */}
                    <div>
                        <input
                            type="text"
                            id="username"
                            placeholder="Username"
                            className="w-full px-0 py-3 text-black bg-transparent border-0 border-b border-gray-300 focus:border-black focus:outline-none transition-colors placeholder-gray-400"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    {/* Email Input */}
                    <div>
                        <input
                            type="email"
                            id="email"
                            placeholder="Email (email@generali.co.th)"
                            className="w-full px-0 py-3 text-black bg-transparent border-0 border-b border-gray-300 focus:border-black focus:outline-none transition-colors placeholder-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <input
                            type="password"
                            id="password"
                            placeholder="Password (Can use anything no rule)"
                            className="w-full px-0 py-3 text-black bg-transparent border-0 border-b border-gray-300 focus:border-black focus:outline-none transition-colors placeholder-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            id="name"
                            placeholder="Full Name"
                            className="w-full px-0 py-3 text-black bg-transparent border-0 border-b border-gray-300 focus:border-black focus:outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            id="phone"
                            placeholder="Phone Number (Optional)"
                            className="w-full px-0 py-3 text-black bg-transparent border-0 border-b border-gray-300 focus:border-black focus:outline-none"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div>
                        <select
                            id="userType"
                            className="w-full px-0 py-3 text-black bg-transparent border-0 border-b border-gray-300 focus:border-black focus:outline-none"
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                        >
                            <option value="Non-Core">Non-Core</option>
                            <option value="Core">Core</option>
                        </select>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="text-center">
                            <p className="text-black text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="text-center">
                            <p className="text-black text-sm font-medium">{success}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </form>

                {/* Login Link */}
                <div className="text-center mt-8">
                    <p className="text-gray-600 text-sm">
                        Already have an account?{' '}
                        <Link 
                            href="/login" 
                            className="text-black hover:underline font-medium"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}