import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  GitBranch,
  Dna,
  Heart,
  Egg,
  FileText,
  Shield,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PedigreeTab from '../components/breeding/PedigreeTab';
import GeneticsCalculator from '../components/breeding/GeneticsCalculator';
import PairingManagement from '../components/breeding/PairingManagement';
import EggTracking from '../components/breeding/EggTracking';
import BirthCertificates from '../components/breeding/BirthCertificates';
import UpgradeModal from '../components/UpgradeModal';

const BreedingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pedigree');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (user?.plan !== 'free') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Reproduction</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Fonctionnalite Professionnelle
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Les outils de reproduction sont reserves aux utilisateurs du plan Professionnel.
              Passez a un plan superieur pour acceder a:
            </p>
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <ul className="space-y-4 text-left">
                <li className="flex items-start">
                  <GitBranch className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Arbre Genealogique Visuel</p>
                    <p className="text-gray-600 text-sm">Visualisez les lignees et gerez la reproduction</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Dna className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Calculateur de Genetique</p>
                    <p className="text-gray-600 text-sm">Predisez les morphes des bebes avant l'accouplement</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Heart className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Gestion des Pairings</p>
                    <p className="text-gray-600 text-sm">Suivez les accouplements et leur succes</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Egg className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Tracking des Œufs</p>
                    <p className="text-gray-600 text-sm">Surveillez l'incubation avec temperatures et dates</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FileText className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Certificats de Naissance</p>
                    <p className="text-gray-600 text-sm">Generez des documents officiels professionnels</p>
                  </div>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg"
            >
              Passer au Plan Professionnel
            </button>
          </div>
        </div>

        {showUpgradeModal && (
          <UpgradeModal
            onClose={() => setShowUpgradeModal(false)}
            onUpgrade={(plan) => {
              console.log(`Upgrading to ${plan} plan`);
              setShowUpgradeModal(false);
            }}
          />
        )}
      </div>
    );
  }

  const tabs = [
    { id: 'pedigree', name: 'Arbre Genealogique', icon: GitBranch },
    { id: 'genetics', name: 'Calculateur Genetique', icon: Dna },
    { id: 'pairings', name: 'Gestion des Pairings', icon: Heart },
    { id: 'eggs', name: 'Tracking des Œufs', icon: Egg },
    { id: 'certificates', name: 'Certificats', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Reproduction</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'pedigree' && <PedigreeTab />}
            {activeTab === 'genetics' && <GeneticsCalculator />}
            {activeTab === 'pairings' && <PairingManagement />}
            {activeTab === 'eggs' && <EggTracking />}
            {activeTab === 'certificates' && <BirthCertificates />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreedingPage;
