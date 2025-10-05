import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin, ArrowLeft, Loader2, Check } from 'lucide-react';
import { t } from 'i18next';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsSubmitted(true);
    }, 1500);
    
    setIsSubmitting(false);
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">{t('brand.name')}</span>
            </Link>
            <Link 
              to="/" 
              className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('contact.getInTouch')}</h1>
              <p className="text-xl text-gray-600">
                {t('contact.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div className="lg:col-span-1">
                <div className="bg-white p-8 rounded-xl shadow-sm h-fit">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('contact.infoTitle')}</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <Mail className="h-6 w-6 text-green-600 mt-1 mr-4 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{t('contact.email')}</h4>
                        <p className="text-gray-600">support@snakemanager.com</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Phone className="h-6 w-6 text-green-600 mt-1 mr-4 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{t('contact.phone')}</h4>
                        <p className="text-gray-600">+1 (555) 123-4567</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="h-6 w-6 text-green-600 mt-1 mr-4 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{t('contact.address')}</h4>
                        <p className="text-gray-600">
                          123 Reptile Way<br />
                          San Francisco, CA 94102
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">{t('contact.supportHours')}</h4>
                    <p className="text-gray-600 text-sm">
                      {t('contact.hours.weekdays')}<br />
                      {t('contact.hours.saturday')}<br />
                      {t('contact.hours.sundayClosed')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-white p-8 rounded-xl shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('contact.form.title')}</h3>
                  
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-8 w-8 text-green-600" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{t('contact.form.sentTitle')}</h4>
                      <p className="text-gray-600">
                        {t('contact.form.successText')}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.form.nameLabel')}</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                          placeholder={t("contact.form.namePlaceholder")}
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.form.emailLabel')}</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                          placeholder={t("contact.form.emailPlaceholder")}
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">{t('contact.form.messageLabel')}</label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                          placeholder={t("contact.form.messagePlaceholder")}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {t('contact.form.sending')}
                        </div>
                      ) : showSuccess ? (
                        <div className="flex items-center justify-center">
                          <Check className="h-5 w-5 mr-2" />
                          {t('contact.form.sentShort')}
                        </div>
                      ) : (
                        t('contact.form.send')
                      )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;