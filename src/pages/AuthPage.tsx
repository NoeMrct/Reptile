import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { t } from 'i18next';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/dashboard';

  const { signIn, signUp, resetPassword, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (showForgotPassword) {
        const { error } = await resetPassword(formData.email);
        if (error) {
          setError(error.message);
        } else {
          setMessage(t('auth.resetSent'));
        }
      } else if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError(t('auth.passwordsDontMatch'));
          return;
        }
        const { error } = await signUp(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else {
          setMessage(t('auth.signUpSuccess', { defaultValue: 'Account created successfully! Please check your email to verify your account.' }));
        }
      }
    } catch (_err) {
      setError(t('common.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Shield className="h-10 w-10 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{t('brand.name')}</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {showForgotPassword ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.resetPassword')}</h2>
              <p className="text-gray-600 mb-6">{t('auth.resetSubtitle')}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
              </h2>
              <p className="text-gray-600 mb-6">
                {isLogin ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
              </p>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>

            {!showForgotPassword && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors pr-12"
                      placeholder={t('auth.passwordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? t('auth.hidePassword', { defaultValue: 'Hide password' }) : t('auth.showPassword', { defaultValue: 'Show password' })}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('auth.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {t('auth.processing')}
                </div>
              ) : showForgotPassword ? t('auth.sendReset') : isLogin ? t('auth.signInBtn') : t('auth.createAccountBtn')}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            {showForgotPassword ? (
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-green-600 hover:text-green-500 text-sm"
              >
                {t('auth.backToSignIn')}
              </button>
            ) : (
              <>
                {isLogin && (
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-green-600 hover:text-green-500 text-sm"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}

                <div className="text-center">
                  <span className="text-gray-600">
                    {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                  </span>
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-green-600 hover:text-green-500 font-medium"
                  >
                    {isLogin ? t('auth.createAccountBtn') : t('auth.signInBtn')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-gray-600 hover:text-green-600 transition-colors">
            <span aria-hidden="true">←</span> {t('common.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
