import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Crown, Check, Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: (plan: 'monthly' | 'yearly') => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, onUpgrade }) => {
  const { t } = useTranslation();
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const [isYearly, setIsYearly] = React.useState(false);

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    setLoadingPlan(plan);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      onUpgrade(plan);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Débloquez tout le potentiel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('upgrade.limitReached')}
            </h3>
            <p className="text-gray-600">
              {t('upgrade.description')}
            </p>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-50 border-2 border-gray-200 rounded-full p-1 inline-flex items-center shadow-sm">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  !isYearly
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('pricing.monthly')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all relative ${
                  isYearly
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('pricing.yearly')}
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {t('pricing.save2Months')}
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Plan Mensuel */}
            <div className={`border-2 rounded-xl p-6 hover:border-green-500 transition-colors ${
              !isYearly ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}>
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">{t('pricing.professional.title')}</h4>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {isYearly ? t('pricing.professional.yearlyPrice') : t('pricing.professional.price')}
                </div>
                <div className="text-gray-500">
                  {isYearly ? t('pricing.professional.yearlyDuration') : t('pricing.professional.duration')}
                </div>
                {isYearly && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    {t('pricing.professional.yearlySavings')}
                  </div>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{t('pricing.professional.features.snakes')}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{t('pricing.professional.features.analytics')}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{t('pricing.professional.features.exports')}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{t('pricing.professional.features.multiUser')}</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade(isYearly ? 'yearly' : 'monthly')}
                disabled={loadingPlan !== null}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loadingPlan === (isYearly ? 'yearly' : 'monthly') ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('upgrade.processing')}
                  </div>
                ) : (
                  t('upgrade.choosePlan')
                )}
              </button>
            </div>

            {/* Plan Enterprise */}
            <div className={`border-2 rounded-xl p-6 hover:border-green-500 transition-colors relative ${
              isYearly ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}>
              {isYearly && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {t('pricing.save2Months')}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">{t('pricing.enterprise.title')}</h4>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {isYearly ? t('pricing.enterprise.yearlyPrice') : t('pricing.enterprise.price')}
                </div>
                <div className="text-gray-500">
                  {isYearly ? t('pricing.enterprise.yearlyDuration') : t('pricing.enterprise.duration')}
                </div>
                {isYearly && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    {t('pricing.enterprise.yearlySavings')}
                  </div>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{t('pricing.enterprise.features.snakes')}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{t('pricing.enterprise.features.support')}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{t('pricing.enterprise.features.integrations')}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{t('pricing.enterprise.features.api')}</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade(isYearly ? 'enterprise-yearly' : 'enterprise-monthly')}
                disabled={loadingPlan !== null}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loadingPlan === (isYearly ? 'enterprise-yearly' : 'enterprise-monthly') ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('upgrade.processing')}
                  </div>
                ) : (
                  t('upgrade.choosePlan')
                )}
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              {t('upgrade.guarantee')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;