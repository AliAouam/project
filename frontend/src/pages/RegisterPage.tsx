// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Layout from '../components/layout/Layout';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'doctor'>('doctor');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:8000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Registration failed');
      }
      // Show inline success message
      setSuccess('Utilisateur créé avec succès !');
      // Optionally clear form fields
      setEmail('');
      setName('');
      setPassword('');
      setRole('doctor');
      // After a short delay, navigate to login
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    }
  };

  return (
    <Layout>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer un compte</h1>
          <p className="mt-2 text-gray-600">
            Inscrivez-vous pour accéder au système d’annotation rétinienne
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          {/* Success message */}
          {success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md mb-4">
              {success}
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Email */}
            <div>
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Name */}
            <div>
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'doctor')}
                className="w-full border p-2 rounded"
              >
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Choose a password"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Déjà un compte ? </span>
            <Link to="/login" className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;