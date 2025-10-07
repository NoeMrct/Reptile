import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) setError(error.message || t('common.unexpectedError'));
    else setMessage(t('auth.resetSent'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 relative">
      <LanguageSelector className="absolute top-4 right-4" />
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-1">{t('auth.resetPassword')}</h1>
        <p className="text-gray-600 mb-6">{t('auth.resetSubtitle')}</p>

        {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3">{error}</div> : null}
        {message ? <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 p-3">{message}</div> : null}

        <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder={t('auth.emailPlaceholder') as string}
        />

        <button
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
        >
          {loading ? t('auth.processing') : t('auth.sendReset')}
        </button>
      </form>
    </div>
  );
}
