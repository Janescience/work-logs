'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Select } from '@/components/ui';
import { post, handleFormSubmission } from '@/utils/apiHelpers';
import { createValidator } from '@/utils/validation';

const validator = createValidator({
  username: [{ type: 'required' }],
  email: [{ type: 'required' }, { type: 'email' }],
  password: [{ type: 'required' }, { type: 'password', minLength: 6 }],
  name: [{ type: 'required' }]
});

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: '',
        phone: '',
        type: 'Non-Core'
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    
    const handleInputChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validator(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        await handleFormSubmission(
            () => post('/api/auth/register', formData),
            setLoading,
            setError,
            setSuccess,
            () => {
                setTimeout(() => {
                    router.push('/login?registered=true');
                }, 1500);
            }
        );
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
                    <Input
                        type="text"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleInputChange('username')}
                        error={errors.username}
                        required
                    />

                    <Input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        error={errors.email}
                        required
                    />

                    <Input
                        type="password"
                        placeholder="Password (Can use anything no rule)"
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        error={errors.password}
                        required
                    />

                    <Input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        error={errors.name}
                        required
                    />

                    <Input
                        type="text"
                        placeholder="Phone Number (Optional)"
                        value={formData.phone}
                        onChange={handleInputChange('phone')}
                        error={errors.phone}
                    />

                    <Select
                        value={formData.type}
                        onChange={handleInputChange('type')}
                        options={[
                            { value: 'Non-Core', label: 'Non-Core' },
                            { value: 'Core', label: 'Core' }
                        ]}
                    />

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
                        <Button
                            type="submit"
                            loading={loading}
                            loadingText="Creating Account..."
                            className="w-full py-3"
                            size="lg"
                        >
                            Create Account
                        </Button>
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