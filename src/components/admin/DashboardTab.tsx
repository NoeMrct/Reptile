import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  Line,
   Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { Download, AlertTriangle, CheckCircle } from 'lucide-react';

type Period = '30d' | '90d' | '6m';
type Segment = 'All' | 'Free' | 'Pro' | 'Enterprise';
type Region = 'All' | 'EU' | 'US' | 'Other';

type GrowthPoint = { month: string; users: number; revenue: number };

type ActivityPoint = { day: string; feedings: number; sheds: number; vets: number };

type PlanSlice = { name: string; value: number; color: string };

function forecastNext3(data: GrowthPoint[]) {
  if (data.length < 4) return [] as GrowthPoint[];
  const last4 = data.slice(-4);
  const moms: number[] = [];
  for (let i = 1; i < last4.length; i++) {
    const prev = last4[i - 1].users || 1;
    moms.push((last4[i].users - prev) / prev);
  }
  const g = moms.reduce((a, b) => a + b, 0) / moms.length;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let lastU = data[data.length - 1].users;
  let lastR = data[data.length - 1].revenue;
  const out: GrowthPoint[] = [];
  for (let i = 0; i < 3; i++) {
    lastU = Math.round(Math.max(0, lastU * (1 + g)));
    lastR = Math.round(Math.max(0, lastR * (1 + g * 1.1)));
    out.push({ month: months[(i + 6) % 12], users: lastU, revenue: lastR });
  }
  return out;
}

const pct = (v: number, d = 1) => `${v.toFixed(d)}%`;

export default function DashboardTab() {
  const [period, setPeriod] = useState<Period>('90d');
  const [segment, setSegment] = useState<Segment>('All');
  const [region, setRegion] = useState<Region>('All');

  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalSnakes: 5834,
    revenue: 45678,
    newUsersThisMonth: 342,
  };

  const userGrowthData: GrowthPoint[] = [
    { month: 'Jan', users: 650, revenue: 15000 },
    { month: 'Feb', users: 780, revenue: 19000 },
    { month: 'Mar', users: 890, revenue: 24000 },
    { month: 'Apr', users: 950, revenue: 28000 },
    { month: 'May', users: 1100, revenue: 35000 },
    { month: 'Jun', users: 1247, revenue: 45678 },
  ];

  const planDistributionData: PlanSlice[] = [
    { name: 'Free', value: 920, color: '#6b7280' },
    { name: 'Pro', value: 287, color: '#16a34a' },
    { name: 'Enterprise', value: 40, color: '#2563eb' },
  ];

  const activityData: ActivityPoint[] = [
    { day: 'Lun', feedings: 234, sheds: 45, vets: 12 },
    { day: 'Mar', feedings: 198, sheds: 52, vets: 8 },
    { day: 'Mer', feedings: 267, sheds: 38, vets: 15 },
    { day: 'Jeu', feedings: 289, sheds: 61, vets: 10 },
    { day: 'Ven', feedings: 312, sheds: 47, vets: 18 },
    { day: 'Sam', feedings: 256, sheds: 55, vets: 6 },
    { day: 'Dim', feedings: 201, sheds: 42, vets: 4 },
  ];

  const dauWauMau = [
    { month: 'Mar', DAU: 210, WAU: 610, MAU: 1150 },
    { month: 'Apr', DAU: 235, WAU: 640, MAU: 1190 },
    { month: 'May', DAU: 255, WAU: 670, MAU: 1230 },
    { month: 'Jun', DAU: 275, WAU: 700, MAU: 1270 },
  ];

  const newVsReturning7d = [
    { day: 'Lun', newU: 34, retU: 186 },
    { day: 'Mar', newU: 28, retU: 192 },
    { day: 'Mer', newU: 31, retU: 205 },
    { day: 'Jeu', newU: 44, retU: 214 },
    { day: 'Ven', newU: 52, retU: 228 },
    { day: 'Sam', newU: 60, retU: 240 },
    { day: 'Dim', newU: 22, retU: 168 },
  ];

  const powerUsersHist = [
    { bucket: '0‑2', count: 120 },
    { bucket: '3‑5', count: 240 },
    { bucket: '6‑10', count: 190 },
    { bucket: '11‑20', count: 110 },
    { bucket: '21+', count: 34 },
  ];

  const activationFunnel = [
    { step: 'Inscrits', value: 1000 },
    { step: '1er serpent', value: 730 },
    { step: '1er événement', value: 620 },
    { step: 'Abonnements', value: 210 },
  ];

  const recentSignups = [
    { id: 'U‑1041', email: 'marta@boa.co', plan: 'Free', date: '2025‑10‑06' },
    { id: 'U‑1042', email: 'sam@clutch.co', plan: 'Pro', date: '2025‑10‑06' },
    { id: 'U‑1043', email: 'lea@serpent.fr', plan: 'Free', date: '2025‑10‑05' },
    { id: 'U‑1044', email: 'ana@herp.io', plan: 'Enterprise', date: '2025‑10‑05' },
  ];

  const activePct = Math.round((stats.activeUsers / Math.max(1, stats.totalUsers)) * 100);
  const snakesPerUser = (stats.totalSnakes / Math.max(1, stats.totalUsers)).toFixed(1);

  const momGrowth = useMemo(() => {
    if (userGrowthData.length < 2) return 0;
    const last = userGrowthData[userGrowthData.length - 1].users;
    const prev = userGrowthData[userGrowthData.length - 2].users;
    return ((last - prev) / Math.max(1, prev)) * 100;
  }, [userGrowthData]);

  const stickiness = useMemo(() => {
    const last = dauWauMau[dauWauMau.length - 1];
    return Math.round((last.DAU / Math.max(1, last.MAU)) * 100);
  }, [dauWauMau]);

  const forecast = useMemo(() => forecastNext3(userGrowthData), [userGrowthData]);

  const exportCSV = () => {
    const rows = [
      ['month','users','revenue'],
      ...userGrowthData.map(r => [r.month, r.users, r.revenue]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dashboard_growth_${period}_${segment}_${region}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const section = (title: string, children: React.ReactNode, actions?: React.ReactNode) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {children}
    </div>
  );

  const KPI = (label: string, value: React.ReactNode, sub?: string) => (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );

  const FilterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-600">Période</label>
        <select className="border rounded-lg p-2" value={period} onChange={(e)=>setPeriod(e.target.value as Period)}>
          <option value="30d">30 jours</option>
          <option value="90d">90 jours</option>
          <option value="6m">6 mois</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Segment</label>
        <select className="border rounded-lg p-2" value={segment} onChange={(e)=>setSegment(e.target.value as Segment)}>
          <option value="All">Tous</option>
          <option value="Free">Free</option>
          <option value="Pro">Pro</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Région</label>
        <select className="border rounded-lg p-2" value={region} onChange={(e)=>setRegion(e.target.value as Region)}>
          <option value="All">Toutes</option>
          <option value="EU">EU</option>
          <option value="US">US</option>
          <option value="Other">Autres</option>
        </select>
      </div>
      <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
        <Download className="h-4 w-4"/> Export croissance
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">{FilterBar}</div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI('Total Utilisateurs', stats.totalUsers, `+${stats.newUsersThisMonth} ce mois`)}
        {KPI('Utilisateurs actifs', stats.activeUsers, `${activePct}%`)}
        {KPI('Serpents / user', snakesPerUser)}
        {KPI('Revenu total', `$${stats.revenue}`)}
        {KPI('DAU/MAU (stickiness)', `${stickiness}%`)}
        {KPI('Croissance MoM', pct(momGrowth))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {section('Croissance des utilisateurs (+ prévision)', (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[...userGrowthData, ...forecast.map(f=>({ ...f, forecast: true }))]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis />
                <Tooltip /><Legend />
                <Area type="monotone" dataKey="users" name="Utilisateurs" fill="#e5e7eb" stroke="#16a34a" />
                <Line type="monotone" dataKey="revenue" name="Revenu" stroke="#2563eb" />
                <Line type="monotone" dataKey="users" name="Prévision (users)" stroke="#64748b" strokeDasharray="4 4" dot={false} isAnimationActive={false} data={forecast} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ), FilterBar)}

        {section('Distribution des plans', (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planDistributionData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}>
                  {planDistributionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {section('Activité de la semaine (stack)', (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" /><YAxis />
              <Tooltip /><Legend />
              <Bar dataKey="feedings" stackId="act" name="Repas" fill="#f59e0b" />
              <Bar dataKey="sheds" stackId="act" name="Mues" fill="#8b5cf6" />
              <Bar dataKey="vets" stackId="act" name="Vétérinaires" fill="#3b82f6" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ))}

      <div className="grid lg:grid-cols-2 gap-6">
        {section("Funnel d'activation", (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activationFunnel} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" /><YAxis dataKey="step" type="category" />
                <Tooltip /><Legend />
                <Bar dataKey="value" name="Utilisateurs" fill="#16a34a" />
                <ReferenceLine x={activationFunnel[0].value} stroke="#9ca3af" strokeDasharray="3 3" label="Base" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}

        {section('Nouveaux vs Récurrents (7j)', (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={newVsReturning7d}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" /><YAxis />
                <Tooltip /><Legend />
                <Bar dataKey="newU" name="Nouveaux" fill="#16a34a" />
                <Bar dataKey="retU" name="Récurrents" fill="#2563eb" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {section('Répartition events / utilisateur', (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={powerUsersHist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" /><YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Utilisateurs" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}

        {section('Dernières inscriptions', (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">ID</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Plan</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((u)=> (
                  <tr key={u.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{u.id}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.plan}</td>
                    <td className="p-2">{u.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-4 w-4"/>Surveillance</div>
          <p className="text-sm text-gray-700 mt-2">Stickiness &lt; 25% sur Free — penser à un nudge onboarding.</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 text-green-700"><CheckCircle className="h-4 w-4"/>OK</div>
          <p className="text-sm text-gray-700 mt-2">Croissance MoM positive pour le 3e mois consécutif.</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-4 w-4"/>Capacité</div>
          <p className="text-sm text-gray-700 mt-2">Samedi = pic d'activité — prévoir scaling/CRONs.</p>
        </div>
      </div>
    </div>
  );
}
