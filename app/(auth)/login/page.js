// app/(auth)/login/page.js
'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { createValidator } from '@/utils/validation';

const validator = createValidator({
  username: [{ type: 'required' }],
  password: [{ type: 'required' }]
});

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validator(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      username: formData.username,
      password: formData.password,
    });

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-black">Login</h1>
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
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            required
          />

          {/* Error Message */}
          {error && (
            <div className="text-center">
              <p className="text-black text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              loading={loading}
              loadingText="Signing in..."
              className="w-full py-3"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Register Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="text-black hover:underline font-medium"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}