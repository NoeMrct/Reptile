import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Activity,
  TrendingUp,
  Settings,
  Database,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  UserCheck,
  UserX,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    inactiveUsers: 355,
    totalSnakes: 5834,
    totalEvents: 23456,
    revenue: 45678,
    freeUsers: 920,
    professionalUsers: 287,
    enterpriseUsers: 40,
    newUsersToday: 12,
    newUsersThisWeek: 87,
    newUsersThisMonth: 342
  };

  const userGrowthData = [
    { month: 'Jan', users: 650, revenue: 15000 },
    { month: 'Feb', users: 780, revenue: 19000 },
    { month: 'Mar', users: 890, revenue: 24000 },
    { month: 'Apr', users: 950, revenue: 28000 },
    { month: 'May', users: 1100, revenue: 35000 },
    { month: 'Jun', users: 1247, revenue: 45678 }
  ];

  const planDistributionData = [
    { name: 'Free', value: stats.freeUsers, color: '#6b7280' },
    { name: 'Professional', value: stats.professionalUsers, color: '#16a34a' },
    { name: 'Enterprise', value: stats.enterpriseUsers, color: '#2563eb' }
  ];

  const activityData = [
    { day: 'Lun', feedings: 234, sheds: 45, vets: 12 },
    { day: 'Mar', feedings: 198, sheds: 52, vets: 8 },
    { day: 'Mer', feedings: 267, sheds: 38, vets: 15 },
    { day: 'Jeu', feedings: 289, sheds: 61, vets: 10 },
    { day: 'Ven', feedings: 312, sheds: 47, vets: 18 },
    { day: 'Sam', feedings: 256, sheds: 55, vets: 6 },
    { day: 'Dim', feedings: 201, sheds: 42, vets: 4 }
  ];

  const mockUsers = [
    { id: '1', email: 'user1@example.com', name: 'Jean Dupont', plan: 'professional', snakes: 12, events: 156, created: '2024-01-15', status: 'active' },
    { id: '2', email: 'user2@example.com', name: 'Marie Martin', plan: 'free', snakes: 3, events: 45, created: '2024-02-20', status: 'active' },
    { id: '3', email: 'user3@example.com', name: 'Pierre Lefebvre', plan: 'enterprise', snakes: 45, events: 892, created: '2023-11-10', status: 'active' },
    { id: '4', email: 'user4@example.com', name: 'Sophie Bernard', plan: 'professional', snakes: 18, events: 234, created: '2024-03-05', status: 'inactive' },
    { id: '5', email: 'user5@example.com', name: 'Luc Dubois', plan: 'free', snakes: 4, events: 67, created: '2024-04-12', status: 'active' }
  ];

  const mockSnakes = [
    { id: '1', name: 'Luna', species: 'Ball Python', owner: 'Jean Dupont', morph: 'Pastel', created: '2024-01-20', events: 25 },
    { id: '2', name: 'Thor', species: 'Corn Snake', owner: 'Marie Martin', morph: 'Anery', created: '2024-02-15', events: 18 },
    { id: '3', name: 'Bella', species: 'Boa Constrictor', owner: 'Pierre Lefebvre', morph: 'Jungle', created: '2023-12-05', events: 42 },
    { id: '4', name: 'Max', species: 'King Snake', owner: 'Sophie Bernard', morph: 'California', created: '2024-03-10', events: 31 },
    { id: '5', name: 'Ruby', species: 'Milk Snake', owner: 'Luc Dubois', morph: 'Pueblan', created: '2024-04-18', events: 15 }
  ];

  const activityLogs = [
    { id: '1', admin: 'Admin', action: 'Mise à jour utilisateur', target: 'user@example.com', time: '2025-01-10 14:35', status: 'success' },
    { id: '2', admin: 'Admin', action: 'Suppression serpent', target: 'Snake #1234', time: '2025-01-10 13:22', status: 'success' },
    { id: '3', admin: 'Admin', action: 'Modification plan', target: 'user2@example.com', time: '2025-01-10 11:45', status: 'success' },
    { id: '4', admin: 'Admin', action: 'Export données', target: 'Tous les utilisateurs', time: '2025-01-10 10:15', status: 'success' },
    { id: '5', admin: 'Admin', action: 'Changement paramètres', target: 'Système', time: '2025-01-09 16:30', status: 'warning' }
  ];

  const systemSettings = [
    { key: 'app_name', value: 'Snake Manager', description: 'Nom de l\'application' },
    { key: 'maintenance_mode', value: 'false', description: 'Mode maintenance' },
    { key: 'max_free_snakes', value: '5', description: 'Max serpents plan gratuit' },
    { key: 'max_professional_snakes', value: '50', description: 'Max serpents plan pro' },
    { key: 'max_enterprise_snakes', value: '999999', description: 'Max serpents plan entreprise' }
  ];

  const getPlanBadge = (plan: string) => {
    const styles = {
      free: 'bg-gray-100 text-gray-800',
      professional: 'bg-green-100 text-green-800',
      enterprise: 'bg-blue-100 text-blue-800'
    };
    return styles[plan as keyof typeof styles] || styles.free;
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const tabs = [
    { id: 'dashboard', name: 'Tableau de Bord', icon: BarChart3 },
    { id: 'users', name: 'Utilisateurs', icon: Users },
    { id: 'snakes', name: 'Serpents', icon: Database },
    { id: 'subscriptions', name: 'Abonnements', icon: DollarSign },
    { id: 'activity', name: 'Activité', icon: Activity },
    { id: 'settings', name: 'Paramètres', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold">Administration</h1>
                <p className="text-sm text-gray-300">Panneau de contrôle complet</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-gray-300">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
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
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Utilisateurs</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <p className="text-sm text-green-600 mt-1">+{stats.newUsersThisMonth} ce mois</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
                    <p className="text-sm text-gray-600 mt-1">{Math.round((stats.activeUsers / stats.totalUsers) * 100)}% du total</p>
                  </div>
                  <UserCheck className="h-12 w-12 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Serpents</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalSnakes}</p>
                    <p className="text-sm text-gray-600 mt-1">{(stats.totalSnakes / stats.totalUsers).toFixed(1)} par utilisateur</p>
                  </div>
                  <Database className="h-12 w-12 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Revenu Total</p>
                    <p className="text-3xl font-bold text-gray-900">${stats.revenue}</p>
                    <p className="text-sm text-green-600 mt-1">+12.5% ce mois</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Croissance des Utilisateurs</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stroke="#16a34a" fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plan Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des Plans</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {planDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Activity Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité de la Semaine</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="feedings" fill="#f59e0b" name="Repas" />
                    <Bar dataKey="sheds" fill="#8b5cf6" name="Mues" />
                    <Bar dataKey="vets" fill="#3b82f6" name="Vétérinaires" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Tous les plans</option>
                  <option value="free">Gratuit</option>
                  <option value="professional">Professionnel</option>
                  <option value="enterprise">Entreprise</option>
                </select>
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serpents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Événements
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inscrit le
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadge(user.plan)}`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.snakes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.events}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.created}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 mr-3">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Snakes Tab */}
        {activeTab === 'snakes' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher un serpent..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </button>
              </div>
            </div>

            {/* Snakes Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Espèce
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Morphe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Propriétaire
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Événements
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Créé le
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockSnakes.map((snake) => (
                      <tr key={snake.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{snake.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {snake.species}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {snake.morph}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {snake.owner}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {snake.events}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {snake.created}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {/* Revenue Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Revenu Mensuel</h3>
                  <DollarSign className="h-8 w-8" />
                </div>
                <p className="text-3xl font-bold">${stats.revenue}</p>
                <p className="text-sm mt-2 text-green-100">+12.5% vs mois dernier</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Abonnés Pro</h3>
                  <UserCheck className="h-8 w-8" />
                </div>
                <p className="text-3xl font-bold">{stats.professionalUsers}</p>
                <p className="text-sm mt-2 text-blue-100">23% du total</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Clients Entreprise</h3>
                  <Shield className="h-8 w-8" />
                </div>
                <p className="text-3xl font-bold">{stats.enterpriseUsers}</p>
                <p className="text-sm mt-2 text-purple-100">3% du total</p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du Revenu</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} name="Revenu ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Activity Logs */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Journal d'Activité</h3>
                <button className="text-green-600 hover:text-green-700 flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cible
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Heure
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Shield className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{log.admin}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.target}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {log.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.status === 'success' ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Succès
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Avertissement
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* System Settings */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Paramètres Système</h3>
              </div>
              <div className="p-6 space-y-6">
                {systemSettings.map((setting, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{setting.key}</h4>
                      <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={setting.value}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        readOnly
                      />
                      <button className="text-green-600 hover:text-green-700">
                        <Edit className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Mode Maintenance</h3>
                  <p className="text-sm text-gray-500 mt-1">Activer pour empêcher l'accès utilisateur</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
