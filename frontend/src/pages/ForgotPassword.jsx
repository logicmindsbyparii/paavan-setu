import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../lib/api';
import AuthForm from '../components/ui/AuthForm';

const FIELDS = [
  { id: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email', placeholder: 'you@example.com' },
];

export default function ForgotPassword() {
  const [values, setValues] = useState({ email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (id, val) => setValues((p) => ({ ...p, [id]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await forgotPassword({ email: values.email });
      setSuccess(res.message || 'If an account exists, a request has been sent.');
    } catch (err) {
      setError(err.message || 'Request failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: 'var(--color-snow)' }}>
        <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-xl text-center border border-gray-100">
          <h2 className="text-2xl font-bold mb-4 font-['DM_Serif_Display',Georgia,serif]">Request Sent</h2>
          <p className="text-gray-600 mb-6">{success}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-full text-white font-bold text-base transition-colors duration-300"
            style={{ backgroundColor: 'var(--color-green)' }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Reset Password"
      subtitle="Enter your email to request a password reset."
      fields={FIELDS}
      values={values}
      onChange={handleChange}
      error={error}
      loading={loading}
      submitLabel="Request Reset"
      loadingLabel="Sending…"
      onSubmit={handleSubmit}
      footerText="Remembered your password?"
      footerLink="Log in"
      footerTo="/login"
    />
  );
}
