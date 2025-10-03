import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Filter, Search } from 'lucide-react';
import { Event, Snake } from '../types';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

const EventsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    // Mock data - in real app, fetch from API
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
        imageUrl: 'https://images.pexels.com/photos/45863/python-snake-reptile-green-45863.jpeg?auto=compress&cs=tinysrgb&w=400',
        notes: 'Very docile and easy to handle',
        userId: user?.id || ''
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
        userId: user?.id || ''
      }
    ];

    const mockEvents: Event[] = [
      {
        id: '1',
        snakeId: '1',
        type: 'feeding',
        date: '2025-01-10',
        notes: 'Adult mouse, ate well',
        weight: 1210,
        userId: user?.id || ''
      },
      {
        id: '2',
        snakeId: '2',
        type: 'shed',
        date: '2025-01-08',
        notes: 'Complete shed, perfect',
        userId: user?.id || ''
      },
      {
        id: '3',
        snakeId: '1',
        type: 'vet_visit',
        date: '2025-01-05',
        notes: 'Annual checkup - healthy',
        weight: 1200,
        userId: user?.id || ''
      },
      {
        id: '4',
        snakeId: '2',
        type: 'feeding',
        date: '2025-01-03',
        notes: 'Adult mouse',
        weight: 810,
        userId: user?.id || ''
      },
      {
        id: '5',
        snakeId: '1',
        type: 'handling',
        date: '2025-01-01',
        notes: 'Gentle handling session',
        userId: user?.id || ''
      },
      {
        id: '6',
        snakeId: '2',
        type: 'shed',
        date: '2024-12-28',
        notes: 'Perfect shed',
        userId: user?.id || ''
      },
      {
        id: '7',
        snakeId: '1',
        type: 'feeding',
        date: '2024-12-25',
        notes: 'Holiday feeding',
        weight: 1190,
        userId: user?.id || ''
      }
    ];

    setSnakes(mockSnakes);
    setEvents(mockEvents);
  }, [user]);

  const getSnakeById = (id: string) => snakes.find(snake => snake.id === id);

  const filteredEvents = events.filter(event => {
    const snake = getSnakeById(event.snakeId);
    const matchesSearch = snake?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (selectedFilter === 'all') return true;
    return event.type === selectedFilter;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const eventTypes = [
    { value: 'all', label: t('events.all') },
    { value: 'feeding', label: t('events.feeding') },
    { value: 'shed', label: t('events.shed') },
    { value: 'vet_visit', label: t('events.vetVisit') },
    { value: 'handling', label: t('events.handling') },
    { value: 'other', label: t('events.other') }
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
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">{t('events.allEvents')}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('events.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <Filter className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {t('events.eventHistory')} ({filteredEvents.length})
            </h2>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map(event => {
                const snake = getSnakeById(event.snakeId);
                return (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    snakeName={snake?.name || 'Unknown'} 
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('events.noEventsFound')}
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedFilter !== 'all' 
                  ? t('events.noEventsMatch') 
                  : t('events.noEventsYet')
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;