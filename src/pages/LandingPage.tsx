import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  BarChart3, 
  Camera, 
  Calendar, 
  Download, 
  Users, 
  Star,
  Check,
  ArrowRight
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

const LandingPage = () => {
  const { t } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">Snake Manager</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-green-600 transition-colors">{t('nav.features')}</a>
              <a href="#pricing" className="text-gray-600 hover:text-green-600 transition-colors">{t('nav.pricing')}</a>
              <Link to="/contact" className="text-gray-600 hover:text-green-600 transition-colors">{t('nav.contact')}</Link>
              <LanguageSelector />
              <Link to="/auth" className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md transform hover:scale-105">
                {t('nav.signIn')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('hero.title')}
              <span className="text-green-600 block">{t('hero.subtitle')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth"
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 inline-flex items-center justify-center shadow-lg"
              >
                {t('hero.tryFree')} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 hover:text-white transition-all transform hover:scale-105 shadow-md"
              >
                {t('hero.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Shield className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">{t('features.detailedProfiles.title')}</h3>
              <p className="text-gray-600">{t('features.detailedProfiles.description')}</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Calendar className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">{t('features.eventTracking.title')}</h3>
              <p className="text-gray-600">{t('features.eventTracking.description')}</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <BarChart3 className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">{t('features.analytics.title')}</h3>
              <p className="text-gray-600">{t('features.analytics.description')}</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Camera className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">{t('features.photoManagement.title')}</h3>
              <p className="text-gray-600">{t('features.photoManagement.description')}</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Download className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">{t('features.exportReports.title')}</h3>
              <p className="text-gray-600">{t('features.exportReports.description')}</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">{t('features.multiUser.title')}</h3>
              <p className="text-gray-600">{t('features.multiUser.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('testimonials.title')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "{t('testimonials.testimonial1')}"
              </p>
              <div className="font-semibold text-gray-900">Sarah Chen</div>
              <div className="text-sm text-gray-500">Professional Breeder</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "{t('testimonials.testimonial2')}"
              </p>
              <div className="font-semibold text-gray-900">Michael Rodriguez</div>
              <div className="text-sm text-gray-500">Reptile Enthusiast</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "{t('testimonials.testimonial3')}"
              </p>
              <div className="font-semibold text-gray-900">Dr. Emily Watson</div>
              <div className="text-sm text-gray-500">Exotic Veterinarian</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('pricing.title')}</h2>
            <p className="text-xl text-gray-600">{t('pricing.subtitle')}</p>
            
            <div className="flex items-center justify-center mt-8">
              <div className="bg-white border-2 border-gray-200 rounded-full p-1 inline-flex items-center shadow-sm">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-6 py-3 rounded-full text-base font-semibold transition-all ${
                    !isYearly
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('pricing.monthly')}
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-6 py-3 rounded-full text-base font-semibold transition-all relative ${
                    isYearly
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('pricing.yearly')}
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {t('pricing.save2Months')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-2">{t('pricing.starter.title')}</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                {t('pricing.starter.price')}
                {t('pricing.starter.duration') && (
                  <div className="text-sm text-orange-600 font-normal">{t('pricing.starter.duration')}</div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.starter.features.snakes')}
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.starter.features.tracking')}
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.starter.features.photos')}
                </li>
              </ul>
              <Link to="/auth" className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-105 block text-center shadow-sm">
                {t('pricing.starter.cta')}
              </Link>
            </div>

            <div className="border-2 border-green-600 rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">{t('pricing.professional.popular')}</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">{t('pricing.professional.title')}</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                {isYearly ? t('pricing.professional.yearlyPrice') : t('pricing.professional.price')}
                <span className="text-lg text-gray-500">
                  {isYearly ? t('pricing.professional.yearlyDuration') : t('pricing.professional.duration')}
                </span>
                {isYearly && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    {t('pricing.professional.yearlySavings')}
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.professional.features.snakes')}
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.professional.features.analytics')}
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.professional.features.exports')}
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.professional.features.multiUser')}
                </li>
              </ul>
              <Link to="/auth" className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-4 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 block text-center shadow-lg text-lg">
                {t('pricing.professional.cta')}
              </Link>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-2">{t('pricing.enterprise.title')}</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                {isYearly ? t('pricing.enterprise.yearlyPrice') : t('pricing.enterprise.price')}
                <span className="text-lg text-gray-500">
                  {isYearly ? t('pricing.enterprise.yearlyDuration') : t('pricing.enterprise.duration')}
                </span>
                {isYearly && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    {t('pricing.enterprise.yearlySavings')}
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.enterprise.features.snakes')}
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.enterprise.features.support')}
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.enterprise.features.integrations')}
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  {t('pricing.enterprise.features.api')}
                </li>
              </ul>
              <Link to="/contact" className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-105 block text-center shadow-sm">
                {t('pricing.enterprise.cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('faq.title')}</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-3">{t('faq.q1.question')}</h3>
              <p className="text-gray-600">{t('faq.q1.answer')}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-3">{t('faq.q2.question')}</h3>
              <p className="text-gray-600">{t('faq.q2.answer')}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-3">{t('faq.q3.question')}</h3>
              <p className="text-gray-600">{t('faq.q3.answer')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold">Snake Manager</span>
              </div>
              <p className="text-gray-400">{t('footer.description')}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">{t('nav.features')}</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</a></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">{t('nav.contact')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.privacy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Snake Manager. {t('footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;