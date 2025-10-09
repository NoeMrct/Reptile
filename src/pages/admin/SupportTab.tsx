import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  Line,
  BarChart, Bar,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { Download, RefreshCw } from 'lucide-react';

type Period = '7d' | '30d' | '90d';
type Channel = 'All' | 'Email' | 'Chat' | 'In‑app' | 'Phone';
type Priority = 'All' | 'Low' | 'Normal' | 'High' | 'Urgent';
type Status = 'Open' | 'Pending' | 'On‑hold' | 'Solved' | 'Closed';

type Trend = { t: string; open: number; closed: number; sla: number };
type Score = { month: string; CSAT: number; NPS: number };

type QueueItem = {
  id: string;
  subject: string;
  requester: string;
  channel: Exclude<Channel,'All'>;
  priority: Exclude<Priority,'All'>;
  status: Status;
  assignee?: string;
  createdAt: string;
  lastReplyAt?: string;
  slaDueAt?: string;
};

type AgentPerf = {
  agent: string;
  tickets: number;
  frtMin: number;
  resHrs: number;
  csat: number;
};

const fmtPct = (v:number, d=1)=> `${v.toFixed(d)}%`;
const hoursBetween = (a?:string,b?:string)=> a&&b ? (new Date(b).getTime()-new Date(a).getTime())/36e5 : 0;

export default function SupportTab() {
  const [tab, setTab] = useState<'overview'|'analytics'|'queue'|'agents'|'settings'>('overview');
  const [period, setPeriod] = useState<Period>('30d');
  const [channel, setChannel] = useState<Channel>('All');
  const [priority, setPriority] = useState<Priority>('All');
  const [qSearch, setQSearch] = useState('');

  const ticketsTrend: Trend[] = [
    { t: 'S‑1', open: 42, closed: 96, sla: 91 },
    { t: 'S‑2', open: 38, closed: 88, sla: 92 },
    { t: 'S‑3', open: 35, closed: 90, sla: 93 },
    { t: 'S‑4', open: 31, closed: 97, sla: 95 },
  ];

  const csatNps: Score[] = [
    { month: 'Mar', CSAT: 86, NPS: 41 },
    { month: 'Apr', CSAT: 87, NPS: 43 },
    { month: 'May', CSAT: 88, NPS: 45 },
    { month: 'Jun', CSAT: 89, NPS: 47 },
  ];

  const volByChannel = [
    { month: 'Mar', Email: 72, Chat: 51, 'In‑app': 34, Phone: 12 },
    { month: 'Apr', Email: 80, Chat: 55, 'In‑app': 31, Phone: 14 },
    { month: 'May', Email: 78, Chat: 57, 'In‑app': 36, Phone: 12 },
    { month: 'Jun', Email: 74, Chat: 60, 'In‑app': 38, Phone: 15 },
  ];

  const frtHist = [
    { bucket: '<5m', count: 46 },
    { bucket: '5‑15m', count: 62 },
    { bucket: '15‑60m', count: 33 },
    { bucket: '1‑4h', count: 18 },
    { bucket: '>4h', count: 6 },
  ];

  const backlogAging = [
    { age: '<24h', count: 19 },
    { age: '1‑3j', count: 14 },
    { age: '3‑7j', count: 9 },
    { age: '7‑14j', count: 6 },
    { age: '14‑30j', count: 3 },
  ];

  const agents: AgentPerf[] = [
    { agent: 'Léa', tickets: 120, frtMin: 9,  resHrs: 14, csat: 94 },
    { agent: 'Paul', tickets: 98,  frtMin: 12, resHrs: 18, csat: 91 },
    { agent: 'Ana', tickets: 86,  frtMin: 7,  resHrs: 16, csat: 96 },
  ];

  const queue: QueueItem[] = [
    { id: 'T‑1021', subject: 'Impossible d’ajouter un serpent', requester: 'zoe@ex.com', channel: 'In‑app', priority: 'Normal', status: 'Open', assignee: 'Léa', createdAt: '2025-10-06T09:15:00Z', slaDueAt: '2025-10-06T13:15:00Z' },
    { id: 'T‑1022', subject: 'Erreur export PDF', requester: 'rex@boa.co', channel: 'Email', priority: 'High', status: 'Pending', assignee: 'Paul', createdAt: '2025-10-05T16:40:00Z', lastReplyAt: '2025-10-06T07:10:00Z', slaDueAt: '2025-10-06T12:00:00Z' },
    { id: 'T‑1023', subject: 'Facturation : changement de plan', requester: 'herptech@labs.io', channel: 'Chat', priority: 'Normal', status: 'Open', assignee: 'Ana', createdAt: '2025-10-06T10:05:00Z', slaDueAt: '2025-10-06T14:05:00Z' },
    { id: 'T‑1024', subject: 'Connexion MFA', requester: 'sam@clutch.co', channel: 'Email', priority: 'Urgent', status: 'On‑hold', assignee: 'Léa', createdAt: '2025-10-03T11:00:00Z', lastReplyAt: '2025-10-05T11:00:00Z', slaDueAt: '2025-10-06T11:00:00Z' },
  ];

  const backlog = useMemo(() => queue.filter(q => q.status==='Open'||q.status==='Pending'||q.status==='On‑hold'), [queue]);
  const backlogCount = backlog.length;

  const frtMedianMin = useMemo(()=>{
    const expanded:number[]=[];
    frtHist.forEach(b=>{
      const m = b.bucket==='<'+'5m'?2: b.bucket==='5‑15m'?10: b.bucket==='15‑60m'?35: b.bucket==='1‑4h'?120: 300;
      for(let i=0;i<b.count;i++) expanded.push(m);
    });
    expanded.sort((a,b)=>a-b);
    const mid = Math.floor(expanded.length/2);
    return expanded[mid]||0;
  },[frtHist]);

  const resMedianHrs = 16;
  const slaAttain = ticketsTrend[ticketsTrend.length-1]?.sla || 0;
  const csatNow = csatNps[csatNps.length-1]?.CSAT || 0;
  const npsNow = csatNps[csatNps.length-1]?.NPS || 0;

  const refresh = ()=>{
    // hook: refetch(
    //   period, channel, priority
    // )
  };

  const exportQueueCSV = ()=>{
    const rows = [
      ['id','subject','requester','channel','priority','status','assignee','createdAt','lastReplyAt','slaDueAt'],
      ...queue.map(t=>[
        t.id,t.subject,t.requester,t.channel,t.priority,t.status,t.assignee||'',t.createdAt,t.lastReplyAt||'',t.slaDueAt||''
      ])
    ];
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`support_queue_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const assignTo = (id:string, agent:string)=>{
    alert(`Assigner ${id} → ${agent} (stub)`);
  };
  const closeTicket = (id:string)=>{
    alert(`Fermer ${id} (stub)`);
  };

  const section = (title:string, children:React.ReactNode, actions?:React.ReactNode)=> (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {children}
    </div>
  );

  const KPI = (label:string, value:React.ReactNode, sub?:string)=> (
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
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Canal</label>
        <select className="border rounded-lg p-2" value={channel} onChange={(e)=>setChannel(e.target.value as Channel)}>
          {['All','Email','Chat','In‑app','Phone'].map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Priorité</label>
        <select className="border rounded-lg p-2" value={priority} onChange={(e)=>setPriority(e.target.value as Priority)}>
          {['All','Low','Normal','High','Urgent'].map(p=> <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <button onClick={refresh} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
        <RefreshCw className="h-4 w-4"/> Rafraîchir
      </button>
      <button onClick={exportQueueCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
        <Download className="h-4 w-4"/> Export file d’attente
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'overview', label: 'Aperçu' },
          { id: 'analytics', label: 'Analytique' },
          { id: 'queue', label: 'File' },
          { id: 'agents', label: 'Agents' },
          { id: 'settings', label: 'Réglages' },
        ].map((t)=> (
          <button
            key={t.id}
            onClick={()=>setTab(t.id as any)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              tab===t.id ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">{FilterBar}</div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {KPI('Backlog', backlogCount)}
            {KPI('FRT médian', `${Math.round(frtMedianMin)} min`)}
            {KPI('Résolution méd.', `${resMedianHrs} h`)}
            {KPI('SLA atteint', fmtPct(slaAttain))}
            {KPI('CSAT', fmtPct(csatNow))}
            {KPI('NPS', npsNow)}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {section('Tickets (ouverts/fermés) & SLA', (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={ticketsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" /><YAxis />
                    <Tooltip /><Legend />
                    <Bar dataKey="open" name="Ouverts" fill="#f59e0b" />
                    <Bar dataKey="closed" name="Fermés" fill="#10b981" />
                    <Line dataKey="sla" name="SLA %" stroke="#2563eb" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ), FilterBar)}

            {section('CSAT & NPS', (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={csatNps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" /><YAxis />
                    <Tooltip /><Legend />
                    <Bar dataKey="CSAT" name="CSAT" fill="#16a34a" />
                    <Line dataKey="NPS" name="NPS" stroke="#8b5cf6" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='analytics' && (
        <div className="space-y-6">
          {section('Volume par canal', (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volByChannel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" /><YAxis />
                  <Tooltip /><Legend />
                  <Bar dataKey="Email" fill="#2563eb" />
                  <Bar dataKey="Chat" fill="#10b981" />
                  <Bar dataKey="In‑app" fill="#f59e0b" />
                  <Bar dataKey="Phone" fill="#8b5cf6" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ), FilterBar)}

          <div className="grid lg:grid-cols-2 gap-6">
            {section('Distribution du FRT (1er réponse)', (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frtHist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" /><YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Tickets" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}

            {section('Vieillissement du backlog', (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={backlogAging}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" /><YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Tickets" fill="#ef4444" />
                    <ReferenceLine x={'7‑14j'} stroke="#9ca3af" strokeDasharray="3 3" label="Seuil" ifOverflow="extendDomain" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='queue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600">Recherche</label>
              <input value={qSearch} onChange={(e)=>setQSearch(e.target.value)} placeholder="sujet, #id, email…" className="w-full border rounded-lg p-2" />
            </div>
            {FilterBar}
          </div>

          {section('File des tickets', (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">ID</th>
                    <th className="p-2">Sujet</th>
                    <th className="p-2">Client</th>
                    <th className="p-2">Canal</th>
                    <th className="p-2">Priorité</th>
                    <th className="p-2">Statut</th>
                    <th className="p-2">Assigné</th>
                    <th className="p-2">Âge</th>
                    <th className="p-2">Échéance SLA</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue
                    .filter(t=>!qSearch ||
                      t.id.toLowerCase().includes(qSearch.toLowerCase()) ||
                      t.subject.toLowerCase().includes(qSearch.toLowerCase()) ||
                      t.requester.toLowerCase().includes(qSearch.toLowerCase()))
                    .filter(t=> channel==='All' || t.channel===channel)
                    .filter(t=> priority==='All' || t.priority===priority)
                    .map((t)=>{
                      const ageH = Math.max(0, hoursBetween(t.createdAt, new Date().toISOString()));
                      const slaH = Math.max(0, hoursBetween(new Date().toISOString(), t.slaDueAt));
                      const slaWarn = t.slaDueAt && (new Date(t.slaDueAt).getTime() - Date.now())/36e5 < 2; // <2h
                      return (
                        <tr key={t.id} className="border-t align-top">
                          <td className="p-2 font-mono text-xs">{t.id}</td>
                          <td className="p-2 max-w-xs truncate" title={t.subject}>{t.subject}</td>
                          <td className="p-2">{t.requester}</td>
                          <td className="p-2">{t.channel}</td>
                          <td className="p-2">{t.priority}</td>
                          <td className="p-2">{t.status}</td>
                          <td className="p-2">{t.assignee || <span className="text-gray-400">—</span>}</td>
                          <td className="p-2">{ageH.toFixed(1)} h</td>
                          <td className="p-2">
                            {t.slaDueAt ? (
                              <span className={`px-2 py-1 rounded text-xs ${slaWarn? 'bg-amber-50 text-amber-700':'bg-green-50 text-green-700'}`}>
                                {slaH.toFixed(1)} h
                              </span>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="p-2 space-x-2 whitespace-nowrap">
                            <button onClick={()=>assignTo(t.id,'Léa')} className="px-2 py-1 text-xs rounded border">Assigner Léa</button>
                            <button onClick={()=>closeTicket(t.id)} className="px-2 py-1 text-xs rounded bg-green-600 text-white">Fermer</button>
                          </td>
                        </tr>
                      )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab==='agents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {KPI('Agents actifs', agents.length)}
            {KPI('Tickets/agent (méd.)', Math.round(agents.map(a=>a.tickets).sort((a,b)=>a-b)[Math.floor(agents.length/2)]) )}
            {KPI('FRT médian (min)', Math.round(agents.reduce((a,b)=>a+b.frtMin,0)/agents.length))}
            {KPI('CSAT moyen', fmtPct(agents.reduce((a,b)=>a+b.csat,0)/agents.length))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {section('Performance agents (tickets & CSAT)', (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={agents}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" /><YAxis />
                    <Tooltip /><Legend />
                    <Bar dataKey="tickets" name="Tickets" fill="#16a34a" />
                    <Line dataKey="csat" name="CSAT %" stroke="#2563eb" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ))}

            {section('Délais agents (FRT min & Résolution h)', (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={agents}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" /><YAxis />
                    <Tooltip /><Legend />
                    <Bar dataKey="frtMin" name="FRT (min)" fill="#f59e0b" />
                    <Line dataKey="resHrs" name="Résolution (h)" stroke="#8b5cf6" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='settings' && (
        <div className="space-y-6">
          {section('Politiques SLA (exemple)', (
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-1">P1 Urgent</div>
                <ul className="text-gray-700 list-disc ml-5 space-y-1">
                  <li>FRT &lt; 15 min</li>
                  <li>Résolution &lt; 8 h</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-1">P2 Haute</div>
                <ul className="text-gray-700 list-disc ml-5 space-y-1">
                  <li>FRT &lt; 1 h</li>
                  <li>Résolution &lt; 24 h</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-1">P3 Normale</div>
                <ul className="text-gray-700 list-disc ml-5 space-y-1">
                  <li>FRT &lt; 4 h</li>
                  <li>Résolution &lt; 72 h</li>
                </ul>
              </div>
            </div>
          ))}

          {section('Webhooks & intégrations (stub)', (
            <div className="text-sm text-gray-700">Configurer Intercom/Zendesk, mapping des champs, auto‑assignation, heures ouvrées…</div>
          ))}
        </div>
      )}
    </div>
  );
}
