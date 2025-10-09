import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  ScatterChart, Scatter, ZAxis,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { Download, RefreshCw, Filter, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

type Species = 'Ball Python' | 'Corn Snake' | 'Boa c.';
type Period = '7d' | '30d' | '90d' | '6m';
type SubTab = 'overview' | 'feeding' | 'weight' | 'sheds' | 'repro' | 'morphs' | 'animals';

type AnimalRisk = {
  id: string;
  name: string;
  species: Species;
  owner: string;
  daysSinceFeeding: number;
  weightChangePct30d: number;
  lastShed: 'perfect' | 'incomplete' | 'unknown';
};

export default function HusbandryTab({
  onViewAnimal,
}: {
  onViewAnimal?: (id: string) => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [species, setSpecies] = useState<Species | 'All'>('All');
  const [period, setPeriod] = useState<Period>('30d');

  const speciesList: Species[] = ['Ball Python', 'Corn Snake', 'Boa c.'];

  const feedingSuccess = [
    { species: 'Ball Python', success: 78, owners: 320 },
    { species: 'Corn Snake',  success: 84, owners: 190 },
    { species: 'Boa c.',      success: 72, owners: 60  },
  ];

  const lastFeedingHist = Array.from({ length: 10 }, (_, i) => ({
    bucket: `${i * 3}-${i * 3 + 2} j`,
    count: Math.floor(Math.random() * 90) + 10,
  }));

  const weightVsAge = Array.from({ length: 120 }, (_, i) => ({
    ageM: i + 1,
    weight: 150 + i * 8 + Math.random() * 80,
  }));

  const shedsSeries = [
    { month: 'Mar', perfect: 62, incomplete: 8 },
    { month: 'Apr', perfect: 70, incomplete: 6 },
    { month: 'May', perfect: 74, incomplete: 7 },
    { month: 'Jun', perfect: 79, incomplete: 5 },
  ];

  const reproduction = [
    { stage: 'Accouplements', value: 52 },
    { stage: 'Œufs',          value: 38 },
    { stage: 'Éclosions',     value: 31 },
  ];

  const trendingMorphs = [
    { morph: 'Pastel',  delta: +12 },
    { morph: 'Albino',  delta: +7  },
    { morph: 'Clown',   delta: -4  },
    { morph: 'Piebald', delta: +3  },
    { morph: 'Banana',  delta: -2  },
  ];

  const [animalsAtRisk, setAnimalsAtRisk] = useState<AnimalRisk[]>([
    { id: 'S-101', name: 'Nyx',   species: 'Ball Python', owner: 'Léa',  daysSinceFeeding: 21, weightChangePct30d: -4.2, lastShed: 'incomplete' },
    { id: 'S-102', name: 'Kumo',  species: 'Corn Snake',  owner: 'Paul', daysSinceFeeding: 16, weightChangePct30d: -1.1, lastShed: 'perfect'   },
    { id: 'S-103', name: 'Rex',   species: 'Boa c.',      owner: 'Ana',  daysSinceFeeding: 28, weightChangePct30d: -6.8, lastShed: 'unknown'    },
    { id: 'S-104', name: 'Mira',  species: 'Ball Python', owner: 'Zoe',  daysSinceFeeding: 11, weightChangePct30d: -0.5, lastShed: 'incomplete' },
  ]);

  const filteredFeedingSuccess = useMemo(() => {
    if (species === 'All') return feedingSuccess;
    return feedingSuccess.filter((x) => x.species === species);
  }, [species]);

  const kpis = useMemo(() => {
    const succ = Math.round(
      (filteredFeedingSuccess.reduce((a, b) => a + b.success, 0) /
        Math.max(1, filteredFeedingSuccess.length)) * 10,
    ) / 10;

    const meanDaysSinceFeed =
      Math.round(
        (animalsAtRisk.reduce((a, b) => a + b.daysSinceFeeding, 0) /
          Math.max(1, animalsAtRisk.length)) * 10,
      ) / 10;

    const shedsTotal = shedsSeries.reduce((a, b) => a + b.perfect + b.incomplete, 0);
    const shedsPerfect = shedsSeries.reduce((a, b) => a + b.perfect, 0);
    const shedsPct = Math.round((shedsPerfect / Math.max(1, shedsTotal)) * 100);

    const reproConv = Math.round(
      (reproduction[reproduction.length - 1].value /
        Math.max(1, reproduction[0].value)) * 100,
    );

    return {
      succ,
      meanDaysSinceFeed,
      shedsPct,
      reproConv,
    };
  }, [filteredFeedingSuccess, animalsAtRisk, shedsSeries, reproduction]);

  const refreshRandomize = () => {
    setAnimalsAtRisk((prev) =>
      prev.map((a) => ({
        ...a,
        daysSinceFeeding: Math.max(0, a.daysSinceFeeding + (Math.random() > 0.5 ? 1 : -1)),
        weightChangePct30d: Math.round((a.weightChangePct30d + (Math.random() - 0.5)) * 10) / 10,
      })),
    );
  };

  const markFed = (id: string) => {
    setAnimalsAtRisk((prev) =>
      prev.map((a) => (a.id === id ? { ...a, daysSinceFeeding: 0 } : a)),
    );
  };

  const exportCSV = () => {
    const rows = [
      ['id', 'name', 'species', 'owner', 'daysSinceFeeding', 'weightChangePct30d', 'lastShed'],
      ...animalsAtRisk.map((a) => [
        a.id, a.name, a.species, a.owner, String(a.daysSinceFeeding), String(a.weightChangePct30d), a.lastShed,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `animals-at-risk_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const kpi = (label: string, value: string | number, sub?: string) => (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );

  const section = (title: string, children: React.ReactNode, actions?: React.ReactNode) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {children}
    </div>
  );

  const FilterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-600">Espèce</label>
        <select
          className="border rounded-lg p-2"
          value={species}
          onChange={(e) => setSpecies(e.target.value as any)}
        >
          <option value="All">Toutes</option>
          {speciesList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600">Période</label>
        <select
          className="border rounded-lg p-2"
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
        >
          <option value="7d">7 jours</option>
          <option value="30d">30 jours</option>
          <option value="90d">90 jours</option>
          <option value="6m">6 mois</option>
        </select>
      </div>

      <button onClick={refreshRandomize} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
        <RefreshCw className="h-4 w-4" /> Rafraîchir
      </button>
      <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
        <Download className="h-4 w-4" /> Export CSV
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'overview', label: 'Aperçu' },
          { id: 'feeding',  label: 'Repas' },
          { id: 'weight',   label: 'Poids' },
          { id: 'sheds',    label: 'Mues' },
          { id: 'repro',    label: 'Reproduction' },
          { id: 'morphs',   label: 'Morphs' },
          { id: 'animals',  label: 'Animaux à risque' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as SubTab)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              subTab === t.id
                ? 'bg-green-50 border-green-600 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {FilterBar}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpi('Succès repas (moy.)', `${kpis.succ}%`)}
            {kpi('Jours depuis dernier repas (moy.)', kpis.meanDaysSinceFeed)}
            {kpi('Mues parfaites', `${kpis.shedsPct}%`)}
            {kpi('Conversion repro', `${kpis.reproConv}%`)}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {section('Taux de réussite des repas (par espèce)', (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredFeedingSuccess}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="species" /><YAxis unit="%" />
                    <Tooltip />
                    <Bar dataKey="success" name="Succès %" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ), FilterBar)}

            {section('Temps depuis dernier repas (distribution)', (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lastFeedingHist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" /><YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Serpents" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {section('Poids vs âge (dispersion)', (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageM" name="Âge (mois)" /><YAxis dataKey="weight" name="Poids (g)" />
                    <ZAxis range={[60, 120]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={weightVsAge} fill="#2563eb" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ))}

            {section('Mues parfaites vs incomplètes', (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={shedsSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" /><YAxis />
                    <Tooltip /><Legend />
                    <Bar dataKey="perfect" name="Parfaites" fill="#10b981" />
                    <Line dataKey="incomplete" name="Incomplètes" stroke="#ef4444" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'feeding' && (
        <div className="space-y-6">
          {section('Réussite des repas (détail)', (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredFeedingSuccess}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="species" /><YAxis unit="%" />
                  <Tooltip /><Legend />
                  <Bar dataKey="success" name="Succès %" fill="#16a34a" />
                  <ReferenceLine y={75} stroke="#9ca3af" strokeDasharray="3 3" label="Seuil 75%" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ), FilterBar)}

          {section('Temps depuis dernier repas (distribution)', (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lastFeedingHist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" /><YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Serpents" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {subTab === 'weight' && (
        <div className="space-y-6">
          {section('Poids vs âge', (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageM" name="Âge (mois)" /><YAxis dataKey="weight" name="Poids (g)" />
                  <ZAxis range={[60, 120]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={weightVsAge} fill="#2563eb" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ), FilterBar)}
        </div>
      )}

      {subTab === 'sheds' && (
        <div className="space-y-6">
          {section('Mues parfaites vs incomplètes', (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={shedsSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" /><YAxis />
                  <Tooltip /><Legend />
                  <Bar dataKey="perfect" name="Parfaites" fill="#10b981" />
                  <Line dataKey="incomplete" name="Incomplètes" stroke="#ef4444" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ), FilterBar)}
        </div>
      )}

      {subTab === 'repro' && (
        <div className="space-y-6">
          {section('Reproduction (funnel)', (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reproduction} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" /><YAxis type="category" dataKey="stage" />
                  <Tooltip />
                  <Bar dataKey="value" name="Nombre" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {subTab === 'morphs' && (
        <div className="space-y-6">
          {section('Tendances morphs (Δ 30j)', (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendingMorphs} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" /><YAxis type="category" dataKey="morph" />
                  <Tooltip />
                  <Bar dataKey="delta" name="Δ" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {subTab === 'animals' && (
        <div className="space-y-6">
          {section('Animaux à risque', (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Nom</th>
                    <th className="p-2">Espèce</th>
                    <th className="p-2">Proprio</th>
                    <th className="p-2">Dernier repas (j)</th>
                    <th className="p-2">Poids 30j</th>
                    <th className="p-2">Dernière mue</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {animalsAtRisk.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-2 font-medium">{a.name}</td>
                      <td className="p-2">{a.species}</td>
                      <td className="p-2">{a.owner}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          a.daysSinceFeeding >= 21 ? 'bg-red-50 text-red-700' :
                          a.daysSinceFeeding >= 14 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {a.daysSinceFeeding}
                        </span>
                      </td>
                      <td className={`p-2 ${a.weightChangePct30d < -5 ? 'text-red-600' : a.weightChangePct30d < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {a.weightChangePct30d > 0 ? '+' : ''}{a.weightChangePct30d}%
                      </td>
                      <td className="p-2">
                        {a.lastShed === 'perfect' && (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs">
                            <CheckCircle className="h-4 w-4" /> Parfaite
                          </span>
                        )}
                        {a.lastShed === 'incomplete' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs">
                            <AlertTriangle className="h-4 w-4" /> Incomplète
                          </span>
                        )}
                        {a.lastShed === 'unknown' && <span className="text-gray-500 text-xs">—</span>}
                      </td>
                      <td className="p-2 space-x-2">
                        <button
                          onClick={() => markFed(a.id)}
                          className="px-2 py-1 text-xs rounded bg-green-600 text-white"
                          title="Marquer comme nourri"
                        >
                          Nourri
                        </button>
                        <button
                          onClick={() => onViewAnimal ? onViewAnimal(a.id) : undefined}
                          className="px-2 py-1 text-xs rounded border inline-flex items-center gap-1"
                          title="Voir la fiche"
                        >
                          <Eye className="h-4 w-4" /> Voir
                        </button>
                      </td>
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
