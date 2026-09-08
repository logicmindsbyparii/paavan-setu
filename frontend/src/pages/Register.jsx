import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../lib/api';
import AuthForm from '../components/ui/AuthForm';

const FIELDS = [
  { id: 'name', label: 'Full Name', type: 'text', required: true, autoComplete: 'name', placeholder: 'Your full name' },
  { id: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email', placeholder: 'you@example.com' },
  { id: 'password', label: 'Password', password: true, required: true, autoComplete: 'new-password', placeholder: 'At least 6 characters', minLength: 6 },
];

export default function Register() {
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (id, val) => setValues((p) => ({ ...p, [id]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerUser({ name: values.name, email: values.email, password: values.password });
      localStorage.setItem('userToken', res.token);
      localStorage.setItem('userName', res.user.name);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Create an Account"
      subtitle="Sign up to take tests and discover your ideal career path."
      fields={FIELDS}
      values={values}
      onChange={handleChange}
      error={error}
      loading={loading}
      submitLabel="Sign Up"
      loadingLabel="Creating account…"
      onSubmit={handleSubmit}
      footerText="Already have an account?"
      footerLink="Log in here"
      footerTo="/login"
    />
  );
}
