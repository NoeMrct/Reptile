import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const resetFeedback = () => { setError(''); setMessage(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await login(form.email, form.password);
        if (error) throw error;
        setMessage(t('auth.loggedIn'));
        navigate('/dashboard');
      } else {
        if (form.password !== form.confirm) throw new Error(t('auth.passwordsNotMatch'));
        const { error } = await register(form.email, form.password);
        if (error) throw error;
        setMessage(t('auth.accountCreated'));
        setIsLogin(true);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || t('common.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 relative">
      <LanguageSelector className="absolute top-4 right-4" />

      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-1">
          {isLogin ? t('auth.signIn') : t('auth.signUp')}
        </h1>
        <p className="text-gray-600 mb-6">
          {isLogin ? t('auth.welcomeBack') : t('auth.createYourAccount')}
        </p>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3">{error}</div>
        ) : null}
        {message ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 p-3">{message}</div>
        ) : null}

        <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))}
          required
          className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder={t('auth.emailPlaceholder') as string}
        />

        <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={(e) => setForm(s => ({ ...s, password: e.target.value }))}
            required
            minLength={6}
            className="w-full pr-12 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder={t('auth.passwordPlaceholder') as string}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600"
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            {showPassword ? t('auth.hide') : t('auth.show')}
          </button>
        </div>

        {!isLogin && (
          <>
            <label className="block text-sm font-medium mb-1">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              name="confirm"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm(s => ({ ...s, confirm: e.target.value }))}
              required
              minLength={6}
              className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder={t('auth.confirmPasswordPlaceholder') as string}
            />
          </>
        )}

        <button
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
        >
          {loading ? t('auth.processing') : (isLogin ? t('auth.signIn') : t('auth.signUp'))}
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => { setIsLogin(v => !v); resetFeedback(); }}
            className="text-green-700 hover:underline"
          >
            {isLogin ? t('auth.createAccount') : t('auth.backToSignIn')}
          </button>

          <Link to="/forgot-password" className="text-gray-600 hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>
      </form>
    </div>
  );
}
