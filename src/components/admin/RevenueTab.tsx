import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  ComposedChart,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { Download, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

type Period = '6m' | '12m' | '24m';
type Plan = 'All' | 'Pro' | 'Enterprise';
type Currency = 'USD' | 'EUR';

type MrrPoint = { month: string; MRR: number; ARR: number };
type NrrPoint = { month: string; expansion: number; contraction: number; churn: number };
type ChurnPoint = { month: string; logo: number; revenue: number };
type UpgradePath = { path: string; count: number };
type CountryRev = { country: string; revenue: number };

type Customer = {
  id: string;
  name: string;
  plan: 'Pro' | 'Enterprise';
  country: string;
  mrr: number;
  ageMonths: number;
};

type DunningItem = {
  invoiceId: string;
  customer: string;
  amount: number;
  attempts: number;
  daysPastDue: number;
};

const fx: Record<Currency, number> = { USD: 1, EUR: 0.94 };
const fmt = (n: number, ccy: Currency) =>
  (ccy === 'USD' ? '$' : '€') + new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(Math.round(n * fx[ccy]));

const pct = (v: number, digits = 1) => `${v.toFixed(digits)}%`;

function forecastNext3(m: MrrPoint[]): MrrPoint[] {
  if (m.length < 4) return [];
  const last4 = m.slice(-4);
  const moms: number[] = [];
  for (let i = 1; i < last4.length; i++) moms.push((last4[i].MRR - last4[i - 1].MRR) / Math.max(1, last4[i - 1].MRR));
  const g = moms.reduce((a, b) => a + b, 0) / moms.length;
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const out: MrrPoint[] = [];
  let last = m[m.length - 1].MRR;
  for (let i = 0; i < 3; i++) {
    last = Math.max(0, last * (1 + g));
    out.push({ month: months[(i + 6) % 12], MRR: Math.round(last), ARR: Math.round(last * 12) });
  }
  return out;
}

export default function RevenueTab() {
  const [period, setPeriod] = useState<Period>('12m');
  const [plan, setPlan] = useState<Plan>('All');
  const [ccy, setCcy] = useState<Currency>('USD');

  const mrrArr: MrrPoint[] = [
    { month: 'Jan', MRR: 2700, ARR: 2700 * 12 },
    { month: 'Feb', MRR: 3200, ARR: 3200 * 12 },
    { month: 'Mar', MRR: 3600, ARR: 3600 * 12 },
    { month: 'Apr', MRR: 4100, ARR: 4100 * 12 },
    { month: 'May', MRR: 4600, ARR: 4600 * 12 },
    { month: 'Jun', MRR: 5200, ARR: 5200 * 12 },
    { month: 'Jul', MRR: 5600, ARR: 5600 * 12 },
    { month: 'Aug', MRR: 5900, ARR: 5900 * 12 },
    { month: 'Sep', MRR: 6400, ARR: 6400 * 12 },
    { month: 'Oct', MRR: 7000, ARR: 7000 * 12 },
    { month: 'Nov', MRR: 7600, ARR: 7600 * 12 },
    { month: 'Dec', MRR: 8200, ARR: 8200 * 12 },
  ];

  const nrrSeries: NrrPoint[] = [
    { month: 'Mar', expansion: 600, contraction: 200, churn: 150 },
    { month: 'Apr', expansion: 700, contraction: 230, churn: 180 },
    { month: 'May', expansion: 850, contraction: 260, churn: 210 },
    { month: 'Jun', expansion: 960, contraction: 300, churn: 240 },
    { month: 'Jul', expansion: 980, contraction: 340, churn: 250 },
    { month: 'Aug', expansion: 1020, contraction: 360, churn: 260 },
  ];

  const churnSeries: ChurnPoint[] = [
    { month: 'Mar', logo: 2.1, revenue: 1.4 },
    { month: 'Apr', logo: 2.0, revenue: 1.6 },
    { month: 'May', logo: 1.9, revenue: 1.5 },
    { month: 'Jun', logo: 1.7, revenue: 1.4 },
    { month: 'Jul', logo: 1.8, revenue: 1.3 },
    { month: 'Aug', logo: 1.6, revenue: 1.2 },
  ];

  const upgrades: UpgradePath[] = [
    { path: 'Free→Pro', count: 75 },
    { path: 'Pro→Ent', count: 6 },
    { path: 'Pro→Free', count: 18 },
  ];

  const revByCountry: CountryRev[] = [
    { country: 'FR', revenue: 2100 },
    { country: 'US', revenue: 1800 },
    { country: 'ES', revenue: 900 },
    { country: 'DE', revenue: 700 },
    { country: 'IT', revenue: 600 },
  ];

  const revByChannel = [
    { channel: 'SEO', value: 42 },
    { channel: 'Ads', value: 25 },
    { channel: 'Referrals', value: 18 },
    { channel: 'Direct', value: 15 },
  ];

  const customers: Customer[] = [
    { id: 'C-1001', name: 'HerpTech Labs', plan: 'Enterprise', country: 'US', mrr: 1200, ageMonths: 14 },
    { id: 'C-1002', name: 'Serpentarium FR', plan: 'Pro', country: 'FR', mrr: 180, ageMonths: 9 },
    { id: 'C-1003', name: 'BoaCare Intl', plan: 'Pro', country: 'DE', mrr: 160, ageMonths: 7 },
    { id: 'C-1004', name: 'AlbinoWorks', plan: 'Pro', country: 'US', mrr: 140, ageMonths: 5 },
    { id: 'C-1005', name: 'Clutch Co.', plan: 'Enterprise', country: 'ES', mrr: 900, ageMonths: 12 },
  ];

  const dunning: DunningItem[] = [
    { invoiceId: 'INV-901', customer: 'Serpentarium FR', amount: 180, attempts: 2, daysPastDue: 5 },
    { invoiceId: 'INV-904', customer: 'BoaCare Intl', amount: 160, attempts: 3, daysPastDue: 9 },
  ];

  const filteredMrr = useMemo(() => {
    const months = period === '6m' ? 6 : period === '12m' ? 12 : 24;
    const base = mrrArr.slice(-Math.min(months, mrrArr.length));
    return base;
  }, [period]);

  const mrr = filteredMrr[filteredMrr.length - 1]?.MRR || 0;
  const arr = mrr * 12;
  const paidAccounts = 420;
  const arpu = paidAccounts ? mrr / paidAccounts : 0;
  const grossMargin = 0.86;
  const churnRevMonthly = churnSeries[churnSeries.length - 1]?.revenue || 0;
  const ltv = (arpu * grossMargin) / Math.max(0.001, churnRevMonthly / 100);
  const cac = 95;
  const paybackMonths = cac / Math.max(1e-6, arpu * grossMargin);
  const momGrowth = filteredMrr.length >= 2
    ? ((filteredMrr[filteredMrr.length - 1].MRR - filteredMrr[filteredMrr.length - 2].MRR) / filteredMrr[filteredMrr.length - 2].MRR) * 100
    : 0;

  const nrrNow = useMemo(() => {
    const latest = nrrSeries[nrrSeries.length - 1];
    const base = Math.max(1, filteredMrr[filteredMrr.length - 2]?.MRR || mrr);
    return 100 + ((latest.expansion - latest.contraction - latest.churn) / base) * 100;
  }, [nrrSeries, filteredMrr, mrr]);

  const forecast = useMemo(() => forecastNext3(filteredMrr), [filteredMrr]);

  const exportCSV = () => {
    const rows = [
      ['month', 'MRR', 'ARR'],
      ...filteredMrr.map((r) => [r.month, r.MRR, r.ARR]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mrr_${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const retryDunning = (id: string) => {
    alert(`Relance du paiement pour ${id} (stub)`);
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
        <select className="border rounded-lg p-2" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          <option value="6m">6 mois</option>
          <option value="12m">12 mois</option>
          <option value="24m">24 mois</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Plan</label>
        <select className="border rounded-lg p-2" value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
          <option value="All">Tous</option>
          <option value="Pro">Pro</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Devise</label>
        <select className="border rounded-lg p-2" value={ccy} onChange={(e) => setCcy(e.target.value as Currency)}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
        <Download className="h-4 w-4" /> Export MRR
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI('MRR', fmt(mrr, ccy), `${pct(momGrowth)} MoM`)}
        {KPI('ARR', fmt(arr, ccy))}
        {KPI('ARPU', (ccy === 'USD' ? '$' : '€') + (arpu * fx[ccy]).toFixed(2), `${paidAccounts} comptes payants`)}
        {KPI('LTV (est.)', (ccy === 'USD' ? '$' : '€') + (ltv * fx[ccy]).toFixed(0), `Churn rev: ${churnRevMonthly}%`)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI('NRR actuel', pct(nrrNow, 1))}
        {KPI('Gross Margin', pct(grossMargin * 100))}
        {KPI('CAC', fmt(cac, ccy))}
        {KPI('Payback', `${paybackMonths.toFixed(1)} mois`)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {section('MRR & ARR (+ prévision)', (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[...filteredMrr, ...forecast.map(f => ({ ...f, forecast: true }))]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="MRR" name="MRR" fill="#16a34a" />
                <Line dataKey="ARR" name="ARR" stroke="#2563eb" strokeWidth={2} />
                {/* Prévision: trace seulement la partie forecast */}
                <Line type="monotone" dataKey="MRR" name="MRR (forecast)" stroke="#64748b" strokeDasharray="4 4"
                  dot={false} isAnimationActive={false}
                  data={forecast}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ), FilterBar)}

        {section('NRR (Expansion / Contraction / Churn)', (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nrrSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis />
                <Tooltip /><Legend />
                <Bar dataKey="expansion" stackId="nrr" name="Expansion" fill="#10b981" />
                <Bar dataKey="contraction" stackId="nrr" name="Contraction" fill="#f59e0b" />
                <Bar dataKey="churn" stackId="nrr" name="Churn" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {section('Churn (logo & revenu)', (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churnSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis />
                <Tooltip /><Legend />
                <Line dataKey="logo" name="Logo %" stroke="#ef4444" />
                <Line dataKey="revenue" name="Revenu %" stroke="#f59e0b" />
                <ReferenceLine y={2} label="Seuil 2%" stroke="#9ca3af" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}

        {section("Chemins d'upgrade/downgrade", (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={upgrades} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" /><YAxis type="category" dataKey="path" />
                <Tooltip />
                <Bar dataKey="count" name="Comptes" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {section('Revenu par pays', (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revByCountry}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" /><YAxis />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenu" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}

        {section('Canaux de revenu (part %)', (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={revByChannel} innerRadius={60} outerRadius={110}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {revByChannel.map((e, i) => <Cell key={i} fill={["#16a34a","#2563eb","#f59e0b","#8b5cf6"][i % 4]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {section('Top comptes (MRR)', (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Compte</th>
                  <th className="p-2">Plan</th>
                  <th className="p-2">Pays</th>
                  <th className="p-2">MRR</th>
                  <th className="p-2">Ancienneté</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2 font-medium">{c.name}</td>
                    <td className="p-2">{c.plan}</td>
                    <td className="p-2">{c.country}</td>
                    <td className="p-2">{fmt(c.mrr, ccy)}</td>
                    <td className="p-2">{c.ageMonths} mois</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {section('Dunning / Paiements en échec', (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Facture</th>
                  <th className="p-2">Client</th>
                  <th className="p-2">Montant</th>
                  <th className="p-2">Tentatives</th>
                  <th className="p-2">Retard (j)</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {dunning.map((d) => (
                  <tr key={d.invoiceId} className="border-t">
                    <td className="p-2">{d.invoiceId}</td>
                    <td className="p-2">{d.customer}</td>
                    <td className="p-2">{fmt(d.amount, ccy)}</td>
                    <td className="p-2">{d.attempts}</td>
                    <td className="p-2">{d.daysPastDue}</td>
                    <td className="p-2">
                      <button onClick={() => retryDunning(d.invoiceId)} className="px-2 py-1 text-xs rounded bg-amber-600 text-white">Relancer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-4 w-4"/>Attention</div>
          <p className="text-sm text-gray-700 mt-2">Churn revenu en baisse depuis 2 mois consécutifs — surveiller la tendance (positif).</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 text-green-700"><CheckCircle className="h-4 w-4"/>OK</div>
          <p className="text-sm text-gray-700 mt-2">NRR &gt; 100% ce mois-ci — expansion churn.</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 text-amber-700"><CreditCard className="h-4 w-4"/>Biling</div>
          <p className="text-sm text-gray-700 mt-2">2 factures en dunning &gt; 7 jours — vérifier moyens de paiement.</p>
        </div>
      </div>
    </div>
  );
}
