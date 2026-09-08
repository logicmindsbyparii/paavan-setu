import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../lib/api';
import AuthForm from '../components/ui/AuthForm';

const FIELDS = [
  { id: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email', placeholder: 'you@example.com' },
  { id: 'password', label: 'Password', password: true, required: true, autoComplete: 'current-password', placeholder: 'Enter your password' },
];

export default function Login() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleChange = (id, val) => setValues((p) => ({ ...p, [id]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser({ email: values.email, password: values.password });
      localStorage.setItem('userToken', res.token);
      localStorage.setItem('userName', res.user.name);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Welcome Back"
      subtitle="Login to access your psychometric tests and results."
      fields={FIELDS}
      values={values}
      onChange={handleChange}
      error={error}
      loading={loading}
      submitLabel="Log In"
      loadingLabel="Logging in…"
      onSubmit={handleSubmit}
      footerText="Don't have an account?"
      footerLink="Sign up here"
      footerTo="/register"
    />
  );
}
