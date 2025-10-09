import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Activity,
  Database,
  Clipboard,
  DollarSign,
  BarChart3,
  ArrowLeft,
  HelpCircle,
  Languages
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import I18nTab from './admin/I18nTab';
import HusbandryTab from './admin/HusbandryTab';
import RevenueTab from './admin/RevenueTab';
import SupportTab from './admin/SupportTab';
import EngagementTab from './admin/EngagementTab';
import DashboardTab from './admin/DashboardTab';
import ContributionsTab from './admin/ContributionsTab';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    'dashboard'
  );

  const tabs = [
    { id: 'dashboard', name: 'Tableau de Bord', icon: BarChart3 },
    { id: 'engagement', name: 'Engagement', icon: Activity },
    { id: 'revenue', name: 'Monétisation', icon: DollarSign },
    { id: 'husbandry', name: 'Santé élevage', icon: Database },
    { id: 'i18n', name: 'i18n', icon: Languages },
    { id: 'contributions', name: 'Contributions', icon: Clipboard },
    { id: 'support', name: 'Support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-white hover:text-gray-300 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold">Administration</h1>
                <p className="text-sm text-gray-300">Panneau de contrôle étendu</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-gray-300">Super Admin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <t.icon className="h-5 w-5" />
                <span className="font-medium">{t.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DashboardTab />
        )}

        {/* ENGAGEMENT */}
        {activeTab === 'engagement' && (
          <EngagementTab />
        )}

        {/* MONÉTISATION */}
        {activeTab === 'revenue' && (
          <RevenueTab />
        )}

        {/* SANTÉ ÉLEVAGE */}
        {activeTab === 'husbandry' && (
          <HusbandryTab />
        )}

        {/* i18n */}
        {activeTab === 'i18n' && (
          <I18nTab />
        )}

        {/* CONTRIBUTIONS */}
        {activeTab === 'contributions' && (
          <ContributionsTab />
        )}

        {/* SUPPORT */}
        {activeTab === 'support' && (
          <SupportTab />
        )}
      </div>
    </div>
  );
}
