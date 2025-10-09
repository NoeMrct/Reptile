import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Scale, Ruler, CreditCard as Edit, Download, Activity, TrendingUp, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, ComposedChart, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Snake, Event } from '../types';
import EventEditModal, { EditableEvent } from '../components/EventEditModal';
import { Trash2, Archive, Undo2 } from 'lucide-react';
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
    const mockSnakes: Snake[] = [
      {
        id: '1',
        name: 'Luna',
        species: 'Ball Python',
        morph: 'Pastel',
        sex: 'Female',
        birthDate: '2022-03-15',
        weight: 1200,
        length: 120,
        imageUrl: 'https://images.pexels.com/photos/45863/python-snake-reptile-green-45863.jpeg?auto=compress&cs=tinysrgb&w=800',
        notes: 'Very docile and easy to handle. Excellent feeder, rarely refuses meals.',
        userId: 'user1'
      },
      {
        id: '2',
        name: 'Thor',
        species: 'Corn Snake',
        morph: 'Anery',
        sex: 'Male',
        birthDate: '2021-08-20',
        weight: 800,
        length: 95,
        imageUrl: 'https://images.pexels.com/photos/8142977/pexels-photo-8142977.jpeg?auto=compress&cs=tinysrgb&w=400',
        notes: 'Great feeder, very active',
        userId: 'user1'
      }
    ];

    const mockSnake = mockSnakes.find(s => s.id === id) || mockSnakes[0];

    const mockEvents: Event[] = [
      {
        id: '1',
        snakeId: id!,
        type: 'feeding',
        date: '2025-01-10',
        notes: 'Adult mouse, ate well',
        weight: 1210,
        userId: 'user1'
      },
      {
        id: '2',
        snakeId: id!,
        type: 'shed',
        date: '2025-01-08',
        notes: 'Complete shed, perfect',
        userId: 'user1'
      },
      {
        id: '3',
        snakeId: id!,
        type: 'feeding',
        date: '2025-01-03',
        notes: 'Adult mouse',
        weight: 1200,
        userId: 'user1'
      },
      {
        id: '4',
        snakeId: id!,
        type: 'vet_visit',
        date: '2024-12-15',
        notes: 'Annual checkup - healthy',
        weight: 1180,
        userId: 'user1'
      },
      {
        id: '5',
        snakeId: id!,
        type: 'feeding',
        date: '2024-12-20',
        notes: 'Adult mouse',
        weight: 1190,
        userId: 'user1'
      }
    ];

    setSnake(mockSnake);
    setEvents(mockEvents);
  }, [id]);

  const [editOpen, setEditOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EditableEvent | null>(null);

  const handleEditOpen = (id: string) => {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    setEditEvent({
      id: ev.id,
      snakeId: ev.snakeId,
      type: ev.type as EditableEvent['type'],
      date: ev.date,
      weight: ev.weight ?? null,
      notes: ev.notes ?? null,
    });
    setEditOpen(true);
  };

  const handleEditSave = (updated: EditableEvent) => {
    setEvents(prev => prev.map(e => (e.id === updated.id ? { ...e, ...updated } : e)));
    setEditOpen(false);
    setEditEvent(null);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    if (!window.confirm(t('events.delete') || 'Supprimer cet événement ?')) return;
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const [showDeleteSnake, setShowDeleteSnake] = useState(false);
  const [archivedUntil, setArchivedUntil] = useState<string | null>(null);

  useEffect(() => {
    const v = localStorage.getItem(`snake_archive_until_${id}`);
    setArchivedUntil(v || null);
  }, [id]);

  const archiveSnake = (days = 30) => {
    const until = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
    localStorage.setItem(`snake_archive_until_${id}`, until);
    setArchivedUntil(until);
    setShowDeleteSnake(false);
  };

  const restoreSnake = () => {
    localStorage.removeItem(`snake_archive_until_${id}`);
    setArchivedUntil(null);
  };

  const hardDeleteSnake = () => {
    if (!window.confirm('Supprimer définitivement ce serpent et TOUT l’historique associé ?')) return;
    localStorage.removeItem(`snake_archive_until_${id}`);
    window.location.href = '/dashboard';
  };

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

  const feedingEvents = events.filter(e => e.type === 'feeding');
  const shedEvents = events.filter(e => e.type === 'shed');
  const vetEvents = events.filter(e => e.type === 'vet_visit');

  // Weight chart data
  const weightData = events
    .filter(e => e.weight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(e => ({
      date: format(new Date(e.date), 'MMM dd'),
      weight: e.weight
    }));

  // Length chart data (simulated - in real app, track length in events)
  const lengthData = events
    .filter(e => e.weight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e, index) => ({
      date: format(new Date(e.date), 'MMM dd'),
      length: snake.length - (events.length - index - 1) * 2
    }));

  // Feeding frequency data
  const feedingDates = feedingEvents
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(e => new Date(e.date));

  const feedingIntervals = feedingDates.slice(1).map((date, i) => {
    const diff = Math.floor((date.getTime() - feedingDates[i].getTime()) / (1000 * 60 * 60 * 24));
    return {
      period: format(date, 'MMM dd'),
      days: diff
    };
  });

  // Shedding timeline data
  const sheddingTimeline = shedEvents
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e, index) => {
      const nextShed = shedEvents[index + 1];
      const daysBetween = nextShed
        ? Math.floor((new Date(nextShed.date).getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        date: format(new Date(e.date), 'MMM dd, yyyy'),
        daysSinceLast: daysBetween
      };
    });

  // Combined weight and feeding data
  const combinedData = events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(e => ({
      date: format(new Date(e.date), 'MMM dd'),
      weight: e.weight || null,
      feeding: e.type === 'feeding' ? e.weight || 1 : null
    }))
    .filter(d => d.weight || d.feeding);

  // Health indicators
  const avgFeedingInterval = feedingIntervals.length > 0
    ? feedingIntervals.reduce((sum, f) => sum + f.days, 0) / feedingIntervals.length
    : 0;

  const avgSheddingInterval = sheddingTimeline.filter(s => s.daysSinceLast).length > 0
    ? sheddingTimeline.filter(s => s.daysSinceLast).reduce((sum, s) => sum + (s.daysSinceLast || 0), 0) / sheddingTimeline.filter(s => s.daysSinceLast).length
    : 0;

  const feedingRegularity = avgFeedingInterval > 0 ? Math.min(100, (7 / avgFeedingInterval) * 100) : 0;
  const sheddingHealth = avgSheddingInterval > 0 && avgSheddingInterval < 60 ? 100 : avgSheddingInterval > 0 ? Math.max(50, 100 - (avgSheddingInterval - 60)) : 0;
  const weightTrend = weightData.length >= 2 ? ((weightData[weightData.length - 1].weight! - weightData[0].weight!) / weightData[0].weight!) * 100 : 0;
  const overallHealth = (feedingRegularity + sheddingHealth + Math.min(100, weightTrend * 2)) / 3;

  const healthData = [
    { name: 'Alimentation', value: Math.round(feedingRegularity), fill: '#3b82f6' },
    { name: 'Mues', value: Math.round(sheddingHealth), fill: '#8b5cf6' },
    { name: 'Croissance', value: Math.round(Math.min(100, weightTrend * 2)), fill: '#10b981' },
    { name: 'Santé Globale', value: Math.round(overallHealth), fill: '#16a34a' }
  ];

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
              <button
                onClick={() => setShowDeleteSnake(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      {archivedUntil && new Date(archivedUntil) > new Date() && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 flex items-center justify-between">
            <div>
              <strong>Serpent archivé.</strong>{' '}
              Visible en lecture seule jusqu’au {new Date(archivedUntil).toLocaleString()}.
            </div>
            <div className="flex gap-2">
              <button onClick={restoreSnake} className="px-3 py-1.5 rounded-lg border border-amber-300 hover:bg-white text-sm flex items-center">
                <Undo2 className="h-4 w-4 mr-1" /> Restaurer
              </button>
              <button onClick={() => setShowDeleteSnake(true)} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">
                Supprimer…
              </button>
            </div>
          </div>
        </div>
      )}

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
                          <EventCard
                            key={event.id}
                            event={event}
                            snakeName={snake.name}
                            onDelete={archivedUntil ? undefined : handleDeleteEvent}
                            onEdit={archivedUntil ? undefined : handleEditOpen}
                          />
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
                        <EventCard
                          key={event.id}
                          event={event}
                          snakeName={snake.name}
                          onDelete={archivedUntil ? undefined : handleDeleteEvent}
                          onEdit={archivedUntil ? undefined : handleEditOpen}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-8">
                    {/* Health Indicators */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Indicateurs de Santé</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {healthData.map((item, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                            <div className="relative h-24 mb-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                  cx="50%"
                                  cy="50%"
                                  innerRadius="60%"
                                  outerRadius="90%"
                                  data={[item]}
                                  startAngle={90}
                                  endAngle={-270}
                                >
                                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                  <RadialBar
                                    background
                                    dataKey="value"
                                    cornerRadius={10}
                                    fill={item.fill}
                                  />
                                </RadialBarChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold" style={{ color: item.fill }}>
                                  {item.value}%
                                </span>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weight Trend with Area */}
                    {weightData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">{t('snake.weightTrend')}</h3>
                        <div className="h-64 w-full bg-gradient-to-br from-green-50 to-white p-4 rounded-lg">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weightData}>
                              <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                                label={{ value: 'Poids (g)', angle: -90, position: 'insideLeft' }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                              />
                              <Area
                                type="monotone"
                                dataKey="weight"
                                stroke="#16a34a"
                                strokeWidth={3}
                                fill="url(#colorWeight)"
                                dot={{ fill: '#16a34a', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 8, fill: '#15803d' }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Length Growth Chart */}
                    {lengthData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Évolution de la Longueur</h3>
                        <div className="h-64 w-full bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lengthData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                                label={{ value: 'Longueur (cm)', angle: -90, position: 'insideLeft' }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="length"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 8, fill: '#2563eb' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Combined Weight & Feeding Chart */}
                    {combinedData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Poids et Alimentation</h3>
                        <div className="h-64 w-full bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={combinedData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis
                                yAxisId="left"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                                label={{ value: 'Poids (g)', angle: -90, position: 'insideLeft' }}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Legend />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="weight"
                                stroke="#16a34a"
                                strokeWidth={2}
                                name="Poids"
                                dot={{ fill: '#16a34a', r: 4 }}
                              />
                              <Bar
                                yAxisId="right"
                                dataKey="feeding"
                                fill="#f59e0b"
                                name="Repas"
                                opacity={0.6}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Feeding Frequency */}
                    {feedingIntervals.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Intervalle entre Repas</h3>
                        <div className="h-64 w-full bg-gradient-to-br from-orange-50 to-white p-4 rounded-lg">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={feedingIntervals}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="period"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                                label={{ value: 'Jours', angle: -90, position: 'insideLeft' }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value) => [`${value} jours`, 'Intervalle']}
                              />
                              <Bar
                                dataKey="days"
                                fill="#f59e0b"
                                radius={[8, 8, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">
                            Intervalle moyen: <span className="text-orange-600">{avgFeedingInterval.toFixed(1)} jours</span>
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Dernier repas: {feedingEvents[0] ? format(new Date(feedingEvents[0].date), 'MMM dd, yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Shedding Timeline */}
                    {sheddingTimeline.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Historique des Mues</h3>
                        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-lg">
                          <div className="space-y-3">
                            {sheddingTimeline.reverse().map((shed, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{shed.date}</p>
                                    {shed.daysSinceLast && (
                                      <p className="text-sm text-gray-600">
                                        {shed.daysSinceLast} jours après la précédente
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {shed.daysSinceLast && (
                                  <div className="text-right">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                      {shed.daysSinceLast}j
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {avgSheddingInterval > 0 && (
                            <div className="mt-4 p-4 bg-purple-100 rounded-lg">
                              <p className="text-sm font-medium text-gray-900">
                                Cycle moyen: <span className="text-purple-600">{avgSheddingInterval.toFixed(0)} jours</span>
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Prochaine mue estimée dans {avgSheddingInterval.toFixed(0)} jours
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Croissance</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Poids actuel:</span>
                            <span className="font-medium text-gray-900">{snake.weight}g</span>
                          </div>
                          {weightData.length >= 2 && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Poids initial:</span>
                                <span className="font-medium text-gray-900">{weightData[0].weight}g</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Gain total:</span>
                                <span className="font-medium text-green-600">
                                  +{(weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(0)}g
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Progression:</span>
                                <span className="font-medium text-green-600">
                                  +{weightTrend.toFixed(1)}%
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Statistiques</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total repas:</span>
                            <span className="font-medium text-gray-900">{feedingEvents.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total mues:</span>
                            <span className="font-medium text-gray-900">{shedEvents.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Visites véto:</span>
                            <span className="font-medium text-gray-900">{vetEvents.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total événements:</span>
                            <span className="font-medium text-gray-900">{events.length}</span>
                          </div>
                        </div>
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

      <EventEditModal
        open={editOpen}
        event={editEvent}
        onClose={handleEditClose}
        onSave={handleEditSave}
      />

      {showDeleteSnake && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteSnake(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h4 className="font-semibold">Supprimer « {snake.name} »</h4>
                <button onClick={() => setShowDeleteSnake(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-6 space-y-4 text-sm text-gray-700">
                <p>Choisis une option :</p>
                <div className="space-y-3">
                  <button
                    onClick={() => archiveSnake(30)}
                    className="w-full flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-amber-50"
                  >
                    <div className="flex items-center gap-3">
                      <Archive className="h-5 w-5 text-amber-600" />
                      <div>
                        <div className="font-medium">Archiver 30 jours (recommandé)</div>
                        <div className="text-xs text-gray-500">Le serpent reste visible en lecture seule. Tu pourras le restaurer à tout moment.</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={hardDeleteSnake}
                    className="w-full flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-red-50"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="font-medium text-red-700">Supprimer définitivement</div>
                        <div className="text-xs text-red-600">Action irréversible : toutes les données et événements associés seront supprimés.</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 border-t text-right">
                <button onClick={() => setShowDeleteSnake(false)} className="px-4 py-2 rounded-lg border">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeProfile;