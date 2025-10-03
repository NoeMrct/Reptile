import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Scale, Ruler, CreditCard as Edit, Download, Activity, TrendingUp, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Snake, Event } from '../types';
import EventCard from '../components/EventCard';
import AddEventModal from '../components/AddEventModal';
import EditSnakeModal from '../components/EditSnakeModal';
import UpgradeModal from '../components/UpgradeModal';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';

const SnakeProfile = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [snake, setSnake] = useState<Snake | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditSnake, setShowEditSnake] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockSnakes: Snake[] = [
      {
        id: '1',
        name: 'Mira',
        species: 'Python Regius',
        morph: 'Pastel',
        sex: 'Female',
        birthDate: '2022-03-15',
        weight: 1200,
        length: 120,
        imageUrl: 'https://images.pexels.com/photos/8142977/pexels-photo-8142977.jpeg?auto=compress&cs=tinysrgb&w=400',
        notes: 'Très docile et facile à manipuler',
        userId: user?.id || ''
      },
      {
        id: '2',
        name: 'Yuzu',
        species: 'Python Regius',
        morph: 'Pastel',
        sex: 'Male',
        birthDate: '2021-08-20',
        weight: 800,
        length: 95,
        imageUrl: 'https://images.pexels.com/photos/8142977/pexels-photo-8142977.jpeg?auto=compress&cs=tinysrgb&w=400',
        notes: 'Excellent nourrisseur, très actif',
        userId: user?.id || ''
      }
    ];

    const mockSnake = mockSnakes.find(s => s.id === id) || mockSnakes[0];

    const mockEvents: Event[] = [
      {
        id: '1',
        snakeId: id!,
        type: 'feeding',
        date: '2025-01-10',
        notes: 'Souris adulte, a bien mangé',
        weight: 1210,
        userId: 'user1'
      },
      {
        id: '2',
        snakeId: id!,
        type: 'shed',
        date: '2025-01-08',
        notes: 'Mue complète, parfaite',
        userId: 'user1'
      },
      {
        id: '3',
        snakeId: id!,
        type: 'feeding',
        date: '2025-01-03',
        notes: 'Souris adulte',
        weight: 1200,
        userId: 'user1'
      },
      {
        id: '4',
        snakeId: id!,
        type: 'vet_visit',
        date: '2024-12-15',
        notes: 'Visite annuelle - en bonne santé',
        weight: 1180,
        userId: 'user1'
      },
      {
        id: '5',
        snakeId: id!,
        type: 'feeding',
        date: '2024-12-20',
        notes: 'Souris adulte',
        weight: 1190,
        userId: 'user1'
      }
    ];

    setSnake(mockSnake);
    setEvents(mockEvents);
  }, [id]);

  const addEvent = (event: Omit<Event, 'id' | 'userId'>) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      userId: 'user1'
    };
    setEvents([newEvent, ...events]);
  };

  const updateSnake = (updatedSnake: Snake) => {
    setSnake(updatedSnake);
  };
  const exportToPDF = () => {
    if (user?.plan === 'free') {
      setShowUpgradeModal(true);
      return;
    }

    if (!snake) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(`${snake.name} - ${t('snake.profile')} Report`, 20, 20);
    
    // Global section
    doc.setFontSize(14);
    doc.text(`${t('snake.profile')} Details:`, 20, 40);
    doc.setFontSize(12);
    doc.text(`${t('snake.species')}: ${snake.species}`, 20, 55);
    doc.text(`${t('snake.morph')}: ${snake.morph || 'N/A'}`, 20, 65);
    doc.text(`${t('snake.sex')}: ${snake.sex}`, 20, 75);
    doc.text(`Birth Date: ${format(new Date(snake.birthDate), 'MMM dd, yyyy')}`, 20, 85);
    doc.text(`${t('snake.weight')}: ${snake.weight}g`, 20, 95);
    doc.text(`${t('snake.length')}: ${snake.length}cm`, 20, 105);
    
    // Feeding section
    doc.setFontSize(14);
    doc.text(`${t('snake.feedings')}:`, 20, 130);
    doc.setFontSize(10);
    
    let yPos = 145;
    const feedingEvents = events.filter(e => e.type === 'feeding');
    feedingEvents.forEach((event) => {
      const eventText = `${format(new Date(event.date), 'MMM dd, yyyy')} - ${event.notes || ''}`;
      doc.text(eventText, 20, yPos);
      yPos += 10;
    });
    
    // Shedding section
    yPos += 10;
    doc.setFontSize(14);
    doc.text(`${t('snake.sheds')}:`, 20, yPos);
    yPos += 15;
    doc.setFontSize(10);
    const shedEvents = events.filter(e => e.type === 'shed');
    shedEvents.forEach((event) => {
      const eventText = `${format(new Date(event.date), 'MMM dd, yyyy')} - ${event.notes || ''}`;
      doc.text(eventText, 20, yPos);
      yPos += 10;
    });
    
    // Vet visits section
    yPos += 10;
    doc.setFontSize(14);
    doc.text(`${t('snake.vetVisits')}:`, 20, yPos);
    yPos += 15;
    doc.setFontSize(10);
    const vetEvents = events.filter(e => e.type === 'vet_visit');
    vetEvents.forEach((event) => {
      const eventText = `${format(new Date(event.date), 'MMM dd, yyyy')} - ${event.notes || ''}`;
      doc.text(eventText, 20, yPos);
      yPos += 10;
    });
    
    doc.save(`${snake.name}_profile.pdf`);
  };

  if (!snake) {
    return <div>{t('common.loading')}</div>;
  }

  // Weight chart data
  const weightData = events
    .filter(e => e.weight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(e => ({
      date: format(new Date(e.date), 'MMM dd'),
      weight: e.weight
    }));

  const feedingEvents = events.filter(e => e.type === 'feeding');
  const shedEvents = events.filter(e => e.type === 'shed');
  const vetEvents = events.filter(e => e.type === 'vet_visit');

  const age = Math.floor((Date.now() - new Date(snake.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  return (
    <div className="min-h-screen bg-gray-50">
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={(plan) => {
            console.log(`Upgrading to ${plan} plan`);
            setShowUpgradeModal(false);
          }}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{snake.name}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddEvent(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('events.addEvent')}
              </button>
              <button
                onClick={exportToPDF}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('snake.exportPDF')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={snake.imageUrl}
                  alt={snake.name}
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{snake.name}</h2>
                  <button 
                    onClick={() => setShowEditSnake(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('snake.species')}:</span>
                    <span className="font-medium">{snake.species}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('snake.morph')}:</span>
                    <span className="font-medium">{snake.morph || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('snake.sex')}:</span>
                    <span className="font-medium">{snake.sex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('snake.age')}:</span>
                    <span className="font-medium">{age} {t('snake.years')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('snake.weight')}:</span>
                    <span className="font-medium flex items-center">
                      <Scale className="h-4 w-4 mr-1" />
                      {snake.weight}g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('snake.length')}:</span>
                    <span className="font-medium flex items-center">
                      <Ruler className="h-4 w-4 mr-1" />
                      {snake.length}cm
                    </span>
                  </div>
                </div>

                {snake.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">{t('snake.notes')}</h3>
                    <p className="text-gray-600 text-sm">{snake.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', name: t('snake.overview'), icon: Activity },
                    { id: 'events', name: t('snake.events'), icon: Calendar },
                    { id: 'analytics', name: t('snake.analytics'), icon: TrendingUp }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
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
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{feedingEvents.length}</div>
                        <div className="text-sm text-blue-600">{t('snake.feedings')}</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">{shedEvents.length}</div>
                        <div className="text-sm text-purple-600">{t('snake.sheds')}</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{vetEvents.length}</div>
                        <div className="text-sm text-green-600">{t('snake.vetVisits')}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t('snake.recentActivity')}</h3>
                      <div className="space-y-3">
                        {events.slice(0, 5).map(event => (
                          <EventCard key={event.id} event={event} snakeName={snake.name} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold">{t('snake.eventHistory')}</h3>
                      <button
                        onClick={() => setShowAddEvent(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        {t('events.addEvent')}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {events.map(event => (
                        <EventCard key={event.id} event={event} snakeName={snake.name} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    {weightData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">{t('snake.weightTrend')}</h3>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weightData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#16a34a"
                                strokeWidth={2}
                                dot={{ fill: '#16a34a' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">{t('snake.feedingSchedule')}</h4>
                        <p className="text-sm text-gray-600">
                          {t('snake.avgInterval')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('snake.lastFeeding')} {feedingEvents[0] ? format(new Date(feedingEvents[0].date), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">{t('snake.growthRate')}</h4>
                        <p className="text-sm text-gray-600">
                          {t('snake.weightGain')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('snake.growthTrend')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <AddEventModal
          onClose={() => setShowAddEvent(false)}
          onAdd={addEvent}
          snakes={[snake]}
          selectedSnakeId={snake.id}
        />
      )}

      {/* Edit Snake Modal */}
      {showEditSnake && (
        <EditSnakeModal
          snake={snake}
          onClose={() => setShowEditSnake(false)}
          onSave={updateSnake}
        />
      )}
    </div>
  );
};

export default SnakeProfile;