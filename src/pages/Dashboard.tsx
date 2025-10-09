import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Plus, 
  Search, 
  Calendar, 
  TrendingUp, 
  Users, 
  Activity,
  LogOut,
  Settings,
  Heart,
  Sparkles,
  Coins
} from 'lucide-react';
import { GripVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SnakeCard from '../components/SnakeCard';
import EventCard from '../components/EventCard';
import StatsCard from '../components/StatsCard';
import AddSnakeModal from '../components/AddSnakeModal';
import AddEventModal from '../components/AddEventModal';
import FilterDropdown from '../components/FilterDropdown';
import UpgradeModal from '../components/UpgradeModal';
import LanguageSelector from '../components/LanguageSelector';
import { Snake, Event } from '../types';
import EventEditModal, { EditableEvent } from '../components/EventEditModal';

const Dashboard = () => {
  const { t } = useTranslation();
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddSnake, setShowAddSnake] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EditableEvent | null>(null);

  const [order, setOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const loadOrder = React.useCallback(() => {
    const key = `snake_order_${user?.id || 'anon'}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as string[];
    } catch {}
    return [];
  }, [user]);

  const saveOrder = React.useCallback((next: string[]) => {
    const key = `snake_order_${user?.id || 'anon'}`;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [user]);

  useEffect(() => {
    const stored = loadOrder();
    const currentIds = snakes.map(s => s.id);
    const merged = [
      ...stored.filter(id => currentIds.includes(id)),
      ...currentIds.filter(id => !stored.includes(id)),
    ];
    setOrder(merged);
  }, [snakes, loadOrder]);

  const moveId = (arr: string[], src: string, dst: string) => {
    const a = [...arr];
    const s = a.indexOf(src), d = a.indexOf(dst);
    if (s === -1 || d === -1) return arr;
    a.splice(s, 1);
    a.splice(d, 0, src);
    return a;
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault(); // autorise le drop
    if (overId !== id) setOverId(id);
  };
  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!sourceId || sourceId === targetId) { setDraggingId(null); setOverId(null); return; }
    const next = moveId(order, sourceId, targetId);
    setOrder(next);
    saveOrder(next);
    setDraggingId(null);
    setOverId(null);
  };
  const onDropEnd = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!sourceId) return;
    const next = [...order.filter(id => id !== sourceId), sourceId];
    setOrder(next);
    saveOrder(next);
    setDraggingId(null);
    setOverId(null);
  };
  const onDragEnd = () => { setDraggingId(null); setOverId(null); };

  const orderedSnakes = React.useMemo(() => {
    if (!order.length) return snakes;
    const pos = new Map(order.map((id, i) => [id, i]));
    return [...snakes].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9));
  }, [snakes, order]);

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

  const handleEditSave = async (updated: EditableEvent) => {
    setEvents(prev => prev.map(e => (e.id === updated.id ? { ...e, ...updated } : e)));
    setEditOpen(false);
    setEditEvent(null);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditEvent(null);
  };

  // Mock data
  useEffect(() => {
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

    const mockEvents: Event[] = [
      {
        id: '1',
        snakeId: '1',
        type: 'feeding',
        date: '2025-01-10',
        notes: 'Souris adulte, a bien mangé',
        weight: 1210,
        userId: user?.id || ''
      },
      {
        id: '2',
        snakeId: '2',
        type: 'shed',
        date: '2025-01-08',
        notes: 'Mue complète, parfaite',
        userId: user?.id || ''
      },
      {
        id: '3',
        snakeId: '1',
        type: 'vet_visit',
        date: '2025-01-05',
        notes: 'Visite annuelle - en bonne santé',
        userId: user?.id || ''
      }
    ];

    setSnakes(mockSnakes);
    setEvents(mockEvents);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const addSnake = (snake: Omit<Snake, 'id' | 'userId'>) => {
    if (snakes.length >= 5) {
      setShowUpgradeModal(true);
      return;
    }
    
    const newSnake: Snake = {
      ...snake,
      id: Date.now().toString(),
      userId: user?.id || ''
    };
    setSnakes([...snakes, newSnake]);
  };

  const addEvent = (event: Omit<Event, 'id' | 'userId'>) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      userId: user?.id || ''
    };
    setEvents([...events, newEvent]);
  };

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    console.log(`Upgrading to ${plan} plan`);
    setShowUpgradeModal(false);
  };

  const filteredSnakes = orderedSnakes.filter(snake => {
    const matchesSearch = snake.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snake.species.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case 'male':
        return snake.sex === 'Male';
      case 'female':
        return snake.sex === 'Female';
      case 'unknown':
        return snake.sex === 'Unknown';
      case 'recent':
        return true;
      case 'feeding':
        return Math.random() > 0.5;
      default:
        return true;
    }
  });

  const handleDeleteEvent = (id: string) => {
    if (!window.confirm(t('events.delete'))) return;
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const recentEvents = events
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getSnakeById = (id: string) => snakes.find(snake => snake.id === id);

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const eventsLast7Days = events.filter(e => {
    const d = new Date(e.date);
    return d >= sevenDaysAgo && d <= now;
  });

  const stats = {
    totalSnakes: snakes.length,
    recentFeedings: events.filter(e => e.type === 'feeding').length,
    recentSheds: events.filter(e => e.type === 'shed').length,
    totalEvents: events.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">{t('brand.name')}</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <LanguageSelector />
              {user?.plan !== 'professional' && (
                <Link
                  to="/breeding"
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <Heart className="h-5 w-5" />
                  <span>{t('breeding.title')}</span>
                </Link>
              )}
              <Link
                to="/contribute"
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
              >
                <Sparkles className="h-5 w-5" />
                <span>{t('contribute.title')}</span>
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold">
                      {(user?.name || user?.email || '').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{user?.name || user?.email}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border">
                    <Link
                      to="/settings"
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      {t('dashboard.settings')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      {t('dashboard.signOut')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddEvent(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t('dashboard.addEvent')}
            </button>
            <button
              onClick={() => setShowAddSnake(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('dashboard.addSnake')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={t('dashboard.stats.totalSnakes')}
            value={stats.totalSnakes}
            icon={<Users className="h-6 w-6 text-green-600" />}
            change={`+2 ${t('dashboard.stats.thisMonth')}`}
          />
          <StatsCard
            title={t('dashboard.stats.recentFeedings')}
            value={stats.recentFeedings}
            icon={<Activity className="h-6 w-6 text-blue-600" />}
            change={t('dashboard.stats.thisWeek')}
          />
          <StatsCard
            title={t('dashboard.stats.recentSheds')}
            value={stats.recentSheds}
            icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
            change={t('dashboard.stats.thisMonth')}
          />
          <StatsCard
            title={t('dashboard.stats.totalEvents')}
            value={eventsLast7Days.length}
            icon={<Calendar className="h-6 w-6 text-orange-600" />}
            change={t('dashboard.stats.lastWeek')}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t('dashboard.mySnakes')}</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t('dashboard.search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <FilterDropdown
                    selectedFilter={selectedFilter}
                    onFilterChange={setSelectedFilter}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                  {filteredSnakes.map(snake => (
                    <div
                      key={snake.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, snake.id)}
                      onDragOver={(e) => onDragOver(e, snake.id)}
                      onDrop={(e) => onDrop(e, snake.id)}
                      onDragEnd={onDragEnd}
                      className={`relative group rounded-lg border border-transparent transition
                        ${draggingId === snake.id ? 'opacity-60' : ''}
                        ${overId === snake.id ? 'ring-2 ring-green-500' : ''}`}
                    >
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition">
                        <div className="p-1 rounded-md bg-white border shadow-sm cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <SnakeCard snake={snake} />
                    </div>
                  ))}
                  {filteredSnakes.length > 0 && (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDropEnd}
                    className="h-6 rounded-md border-2 border-dashed border-gray-200 text-xs text-gray-400
                              flex items-center justify-center"
                  >
                    {t('dashboard.dropHere')}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t('dashboard.recentEvents')}</h2>
                <button className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors">
                  <Link to="/events" className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors">
                    {t('dashboard.viewAllEvents')}
                  </Link>
                </button>
              </div>
              
              {recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.map(event => {
                    const snake = getSnakeById(event.snakeId);
                    return (
                      <EventCard key={event.id} event={event} snakeName={snake?.name || 'Unknown'} onDelete={handleDeleteEvent} onEdit={handleEditOpen} />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">{t('dashboard.noEvents')}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-bold text-gray-900">{t('dashboard.contribute.title')}</h2>
                </div>
                <Link to="/contribute" className="text-green-600 hover:text-green-700 text-sm font-medium">{t('dashboard.contribute.ctaDiscover')}</Link>
              </div>
              <p className="text-gray-600 text-sm">{t('dashboard.contribute.subtitle')}</p>
              <Link
                to="/contribute"
                className="inline-flex items-center mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                <Coins className="h-4 w-4 mr-2" />{t('dashboard.contribute.ctaStart')}</Link>
            </div>
          </div>
        </div>
      </div>

      {showAddSnake && (
        <AddSnakeModal
          onClose={() => setShowAddSnake(false)}
          onAdd={addSnake}
        />
      )}

      {showAddEvent && (
        <AddEventModal
          onClose={() => setShowAddEvent(false)}
          onAdd={addEvent}
          snakes={snakes}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
        />
      )}

      <EventEditModal
        open={editOpen}
        event={editEvent}
        onClose={handleEditClose}
        onSave={handleEditSave}
      />
    </div>
  );
};

export default Dashboard;