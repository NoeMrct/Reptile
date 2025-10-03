import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Globe, 
  Shield, 
  CreditCard,
  Download,
  Trash2,
  Save,
  Check,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import UpgradeModal from '../components/UpgradeModal';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profileImage: user?.profileImage || '',
    notifications: {
      feedingReminders: true,
      shedReminders: true,
      vetReminders: true,
      emailNotifications: true
    }
  });

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user context with new profile data
      if (user) {
        // In a real app, you would call an API to update the user
        // For now, we'll simulate the update
        const updatedUser = {
          ...user,
          name: profileData.name,
          profileImage: profileData.profileImage
        };
        // This would normally update the auth context
      }
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
    } catch (error) {
      setError(t('settings.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t('settings.deleteConfirm'))) {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Deleting account');
      } catch (error) {
        setError(t('settings.deleteError'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExportData = async () => {
    if (user?.plan === 'free') {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Create and download file
      const data = { user: profileData, exported: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'snake-manager-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setError(t('settings.exportError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileData({
          ...profileData,
          profileImage: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', name: t('settings.profile'), icon: User },
    { id: 'notifications', name: t('settings.notifications'), icon: Bell },
    { id: 'language', name: t('settings.language'), icon: Globe },
    { id: 'subscription', name: t('settings.subscription'), icon: CreditCard },
    { id: 'data', name: t('settings.data'), icon: Download },
    { id: 'security', name: t('settings.security'), icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link 
              to="/dashboard"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={(plan) => {
            console.log(`Upgrading to ${plan} plan`);
            setShowUpgradeModal(false);
          }}
        />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Modal */}
        {error && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('common.error')}</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t('settings.profile')}</h2>
                  
                  {/* Profile Image */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      {t('settings.profileImage')}
                    </label>
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <img
                          src={profileData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || profileData.email)}&background=16a34a&color=fff&size=128`}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                        />
                        <label className="absolute bottom-0 right-0 bg-green-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-green-700 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('settings.profileImageDescription')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.name')}
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder={t('settings.namePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.email')}
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder={t('settings.emailPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t('settings.notifications')}</h2>
                  <div className="space-y-4">
                    {Object.entries(profileData.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-700">{t(`settings.${key}`)}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              notifications: {
                                ...profileData.notifications,
                                [key]: e.target.checked
                              }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Language Tab */}
              {activeTab === 'language' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t('settings.language')}</h2>
                  <div className="space-y-4">
                    <p className="text-gray-600">{t('settings.languageDescription')}</p>
                    <LanguageSelector />
                  </div>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t('settings.subscription')}</h2>
                  <div className="bg-gradient-to-br from-gray-50 to-green-50 p-6 rounded-xl border-2 border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('settings.currentPlan')}</h3>
                        <p className="text-gray-600">{t('settings.freePlan')}</p>
                      </div>
                      <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-semibold">{t('settings.planFreeBadge')}</span>
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg transform hover:scale-105"
                    >
                      <Crown className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                      {t('settings.upgrade')}
                    </button>
                  </div>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t('settings.data')}</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('settings.exportData')}</h3>
                      <p className="text-gray-600 mb-4">{t('settings.exportDescription')}</p>
                      <button
                        onClick={handleExportData}
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('settings.exporting')}
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            {t('settings.exportButton')}
                          </>
                        )}
                      </button>
                    </div>
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-red-600 mb-2">{t('settings.deleteAccount')}</h3>
                      <p className="text-gray-600 mb-4">{t('settings.deleteDescription')}</p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('settings.deleting')}
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('settings.deleteButton')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t('settings.security')}</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('settings.changePassword')}</h3>
                      <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                        {t('settings.changePasswordButton')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {(activeTab === 'profile' || activeTab === 'notifications') && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : showSuccess ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {t('common.saved')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('common.save')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;