import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { Download, RefreshCw } from 'lucide-react';

type Period = '7d' | '30d' | '90d' | '6m';
type Segment = 'All' | 'Free' | 'Pro' | 'Enterprise';
type Platform = 'All' | 'Web' | 'iOS' | 'Android';
type DWMP = { month: string; DAU: number; WAU: number; MAU: number };
type SessionsDaily = { day: string; sessions: number; avgDurationMin: number };
type FeatureUse = { feature: string; count: number };
type Cohort = { cohort: string; r1: number; r4: number; r12: number };

export default function EngagementTab() {
  const [subTab, setSubTab] = useState<'overview'|'sessions'|'heatmap'|'features'|'cohorts'>('overview');
  const [period, setPeriod] = useState<Period>('30d');
  const [segment, setSegment] = useState<Segment>('All');
  const [platform, setPlatform] = useState<Platform>('All');

  const dauWauMau: DWMP[] = [
    { month: 'Mar', DAU: 210, WAU: 610, MAU: 1150 },
    { month: 'Apr', DAU: 235, WAU: 640, MAU: 1190 },
    { month: 'May', DAU: 255, WAU: 670, MAU: 1230 },
    { month: 'Jun', DAU: 275, WAU: 700, MAU: 1270 },
  ];

  const eventsPerActive = [
    { label: '7 jours', events: 5.8 },
    { label: '30 jours', events: 17.4 },
  ];

  const sessionsDaily: SessionsDaily[] = [
    { day: 'Lun', sessions: 420, avgDurationMin: 7.6 },
    { day: 'Mar', sessions: 440, avgDurationMin: 7.2 },
    { day: 'Mer', sessions: 470, avgDurationMin: 7.9 },
    { day: 'Jeu', sessions: 510, avgDurationMin: 8.2 },
    { day: 'Ven', sessions: 580, avgDurationMin: 8.0 },
    { day: 'Sam', sessions: 600, avgDurationMin: 8.5 },
    { day: 'Dim', sessions: 390, avgDurationMin: 7.0 },
  ];

  const featureUsage: FeatureUse[] = [
    { feature: 'Ajout repas', count: 1210 },
    { feature: 'Ajout mue', count: 640 },
    { feature: 'Ajout serpent', count: 820 },
    { feature: 'Export PDF', count: 160 },
    { feature: 'Pedigree', count: 290 },
  ];

  const heatmap = Array.from({ length: 7 }, (_, d) => (
    Array.from({ length: 24 }, (_, h) => ({ day: d, hour: h, value: Math.floor(Math.random()*9) }))
  ));

  const cohortMonths = ['2025‑03','2025‑04','2025‑05','2025‑06'];
  const cohorts: Cohort[] = cohortMonths.map((m, i) => ({
    cohort: m,
    r1: Math.max(0, 64 - i * 2),
    r4: Math.max(0, 43 - i * 1.5),
    r12: Math.max(0, 22 - i * 1.2),
  }));

  const stickiness = Math.round((dauWauMau[dauWauMau.length - 1].DAU / Math.max(1, dauWauMau[dauWauMau.length - 1].MAU)) * 100);
  const sessionsSum = sessionsDaily.reduce((a, b) => a + b.sessions, 0);
  const activeUsersEstimate = 900;
  const sessionsPerActive = (sessionsSum / Math.max(1, activeUsersEstimate)).toFixed(2);
  const avgSessionDuration = (sessionsDaily.reduce((a, b) => a + b.avgDurationMin, 0) / sessionsDaily.length).toFixed(1);

  const refresh = () => {
    // hook → refetch(period, segment, platform)
  };

  const exportCSV = () => {
    const rows = [
      ['metric','value'],
      ['DAU', String(dauWauMau[dauWauMau.length-1].DAU)],
      ['WAU', String(dauWauMau[dauWauMau.length-1].WAU)],
      ['MAU', String(dauWauMau[dauWauMau.length-1].MAU)],
      ['Stickiness %', String(stickiness)],
      ['Sessions/actif (7j)', String(sessionsPerActive)],
      ['Durée moy. session (min)', String(avgSessionDuration)],
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `engagement_summary_${period}_${segment}_${platform}.csv`; a.click();
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
          <option value="7d">7 jours</option>
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
        <label className="block text-xs text-gray-600">Plateforme</label>
        <select className="border rounded-lg p-2" value={platform} onChange={(e)=>setPlatform(e.target.value as Platform)}>
          <option value="All">Toutes</option>
          <option value="Web">Web</option>
          <option value="iOS">iOS</option>
          <option value="Android">Android</option>
        </select>
      </div>
      <button onClick={refresh} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
        <RefreshCw className="h-4 w-4"/> Rafraîchir
      </button>
      <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
        <Download className="h-4 w-4"/> Export résumé
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'overview', label: 'Aperçu' },
          { id: 'sessions', label: 'Sessions' },
          { id: 'heatmap', label: 'Heatmap' },
          { id: 'features', label: 'Fonctionnalités' },
          { id: 'cohorts', label: 'Cohortes' },
        ].map((t)=> (
          <button
            key={t.id}
            onClick={()=>setSubTab(t.id as any)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              subTab===t.id ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {subTab==='overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">{FilterBar}</div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {KPI('DAU', dauWauMau[dauWauMau.length-1].DAU)}
            {KPI('WAU', dauWauMau[dauWauMau.length-1].WAU)}
            {KPI('MAU', dauWauMau[dauWauMau.length-1].MAU)}
            {KPI('Stickiness', `${stickiness}%`, 'DAU / MAU')}
            {KPI('Évents / actif', eventsPerActive[0].events.toFixed(1), 'sur 7j')}
            {KPI('Sessions / actif', sessionsPerActive, 'sur 7j')}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {section('DAU / WAU / MAU', (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dauWauMau}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" /><YAxis />
                    <Tooltip /><Legend />
                    <Area type="monotone" dataKey="MAU" fill="#e5e7eb" stroke="#9ca3af" name="MAU" />
                    <Bar dataKey="WAU" name="WAU" fill="#16a34a" />
                    <Line dataKey="DAU" name="DAU" stroke="#2563eb" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ), (<div className="text-right text-sm text-gray-600">Stickiness: <span className="font-semibold">{stickiness}%</span></div>))}

            {section('Événements par utilisateur actif', (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventsPerActive}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" /><YAxis />
                    <Tooltip />
                    <Bar dataKey="events" name="Événements" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab==='sessions' && (
        <div className="space-y-6">
          {section('Sessions actives / jour', (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionsDaily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" /><YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ), FilterBar)}

          {section('Durée moyenne de session (min)', (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionsDaily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" /><YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="avgDurationMin" name="Durée (min)" fill="#e5e7eb" stroke="#16a34a" />
                  <ReferenceLine y={8} stroke="#9ca3af" strokeDasharray="3 3" label="Seuil 8m" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {subTab==='heatmap' && (
        <div className="space-y-6">
          {section('Heatmap activité (jour × heure)', (
            <div className="grid grid-cols-24 gap-1">
              <div className="col-span-24 flex justify-between text-xs text-gray-500 mb-1 px-1">
                {Array.from({ length: 24 }, (_, h) => <span key={h}>{h}</span>)}
              </div>
              {heatmap.map((row, d) => (
                <div key={d} className="col-span-24 grid grid-cols-24 gap-1">
                  {row.map((cell, h) => (
                    <div
                      key={h}
                      className="h-5 rounded"
                      title={`Jour ${d}, ${h}h: ${cell.value}`}
                      style={{ backgroundColor: `rgba(34,197,94, ${cell.value/10})` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ), FilterBar)}
        </div>
      )}

      {subTab==='features' && (
        <div className="space-y-6">
          {section('Fonctionnalités les plus utilisées', (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureUsage} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" /><YAxis dataKey="feature" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" name="Actions" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ), FilterBar)}
        </div>
      )}

      {subTab==='cohorts' && (
        <div className="space-y-6">
          {section('Cohortes (rétention %)', (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Cohorte</th>
                    <th className="text-left p-2">S+1</th>
                    <th className="text-left p-2">S+4</th>
                    <th className="text-left p-2">S+12</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr key={c.cohort} className="border-t">
                      <td className="p-2 font-medium">{c.cohort}</td>
                      {[c.r1, c.r4, c.r12].map((v, i) => (
                        <td key={i} className="p-2">
                          <div className="h-6 w-24 bg-gray-100 rounded">
                            <div className="h-6 rounded" style={{ width: `${v}%`, backgroundColor: '#16a34a' }} />
                          </div>
                          <span className="text-xs text-gray-600 ml-2 align-middle">{v}%</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ), FilterBar)}
        </div>
      )}
    </div>
  );
}
