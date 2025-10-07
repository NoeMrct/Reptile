import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { updatePasswordWithToken } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (password !== confirm) return setError(t('auth.passwordsNotMatch'));

    setLoading(true);
    const { error } = await updatePasswordWithToken('_', password);
    setLoading(false);
    if (error) setError(error.message || t('common.unexpectedError'));
    else  {
      setMessage(t('auth.passwordUpdated'));
      setTimeout(() => {
        window.location.href = '/auth';
      }, 200);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 relative">
      <LanguageSelector className="absolute top-4 right-4" />
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-1">{t('auth.defineNewPassword')}</h1>
        <p className="text-gray-600 mb-6">{t('auth.defineNewPasswordSubtitle')}</p>

        {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3">{error}</div> : null}
        {message ? <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 p-3">{message}</div> : null}

        <label className="block text-sm font-medium mb-1">{t('auth.newPassword')}</label>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder={t('auth.passwordPlaceholder') as string}
        />

        <label className="block text-sm font-medium mb-1">{t('auth.confirmPassword')}</label>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          className="w-full mb-6 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder={t('auth.confirmPasswordPlaceholder') as string}
        />

        <button
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
        >
          {loading ? t('auth.processing') : t('auth.updatePassword')}
        </button>
      </form>
    </div>
  );
}
