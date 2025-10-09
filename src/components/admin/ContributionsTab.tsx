import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Search as SearchIcon,
  Undo2,
  ClipboardList,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

type ContributionType = 'species' | 'morph' | 'locality' | 'alias' | 'locus' | 'group';
type ContributionStatus = 'pending' | 'approved' | 'rejected';
type StakeStatus = 'locked' | 'refunded' | 'burned';

interface SpeciesOpt { id: string; label: string; }

interface ContributionBase {
  id: string;
  userId: string;
  type: ContributionType;
  speciesId?: string | null;
  payload: Record<string, any> & { images?: string[] };
  createdAt: string;
  status: ContributionStatus;
  moderatorNote?: string | null;
  reward?: number;
  stake?: number;
  stakeStatus?: StakeStatus;
  decidedAt?: string;
  decidedBy?: string;
}

const STORAGE_KEYS = {
  SUBMISSIONS: 'contrib_submissions',
  WALLET: 'contrib_wallet',
} as const;

const REWARD_BY_TYPE: Record<ContributionType, number> = {
  species: 250,
  morph: 80,
  locality: 40,
  alias: 15,
  locus: 60,
  group: 50,
};

const FALLBACK_SPECIES: SpeciesOpt[] = [
  { id: 'python-regius', label: 'Ball Python' },
  { id: 'pantherophis-guttatus', label: 'Corn Snake' },
  { id: 'morelia-viridis', label: 'Green Tree Python' },
];

function loadSubmissions(): ContributionBase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return raw ? (JSON.parse(raw) as ContributionBase[]) : [];
  } catch { return []; }
}
function saveSubmissions(all: ContributionBase[]) {
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(all));
}
function loadWallet(userId: string): number {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.WALLET}:${userId}`);
    return raw ? Number(raw) : 0;
  } catch { return 0; }
}
function saveWallet(userId: string, balance: number) {
  localStorage.setItem(`${STORAGE_KEYS.WALLET}:${userId}`, String(balance));
}
function credit(userId: string, delta: number) {
  const cur = loadWallet(userId);
  saveWallet(userId, Math.max(0, cur + delta));
}

const StatusBadge: React.FC<{ s: ContributionStatus }> = ({ s }) => {
  const map: Record<ContributionStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const label: Record<ContributionStatus, string> = {
    pending: 'En attente', approved: 'Validé', rejected: 'Refusé'
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${map[s]}`}>{label[s]}</span>;
};

const TypePill: React.FC<{ t: ContributionType }> = ({ t }) => {
  const lbl: Record<ContributionType, string> = {
    species: 'Espèce', morph: 'Morph', locality: 'Localité', alias: 'Alias', locus: 'Locus', group: 'Groupe'
  };
  return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 border"><Tag className="h-3 w-3"/>{lbl[t]}</span>;
};

export default function AdminContributions() {
  const [species, setSpecies] = useState<SpeciesOpt[]>(FALLBACK_SPECIES);
  const [items, setItems] = useState<ContributionBase[]>(() => loadSubmissions());
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | ContributionType>('all');
  const [status, setStatus] = useState<'all' | ContributionStatus>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<ContributionBase | null>(null);
  const [note, setNote] = useState('');
  const [action, setAction] = useState<'approve'|'reject'|null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch('/data/species.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (aborted) return;
        if (Array.isArray(data?.species)) {
          const opts: SpeciesOpt[] = data.species.map((s: any) => ({ id: s.id, label: s.names?.[1] || s.names?.[0] || s.id }));
          if (opts.length) setSpecies(opts);
        }
      } catch {}
    })();
    return () => { aborted = true; };
  }, []);

  const kpis = useMemo(() => {
    const total = items.length;
    const p = items.filter(i=>i.status==='pending').length;
    const a = items.filter(i=>i.status==='approved').length;
    const r = items.filter(i=>i.status==='rejected').length;
    const rate = (a + r) ? Math.round((a/(a+r))*100) : 0;
    const ds: number[] = items.filter(i=>i.decidedAt).map(i => (
      (new Date(i.decidedAt as string).getTime() - new Date(i.createdAt).getTime()) / (1000*60*60)
    ));
    const avgH = ds.length ? Math.round((ds.reduce((x,y)=>x+y,0)/ds.length)*10)/10 : 0;

    const byTypeMap = new Map<ContributionType, any>();
    (['species','morph','locality','alias','locus','group'] as ContributionType[]).forEach(t=>{
      const tItems = items.filter(i=>i.type===t);
      byTypeMap.set(t, {
        type: t,
        pending: tItems.filter(i=>i.status==='pending').length,
        approved: tItems.filter(i=>i.status==='approved').length,
        rejected: tItems.filter(i=>i.status==='rejected').length,
      });
    });

    return { total, p, a, r, rate, avgH, byType: Array.from(byTypeMap.values()) };
  }, [items]);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    return items.filter(i => {
      if (type !== 'all' && i.type !== type) return false;
      if (status !== 'all' && i.status !== status) return false;
      if (!q) return true;
      const sp = i.speciesId && species.find(s=>s.id===i.speciesId)?.label;
      const text = [i.id, i.userId, i.type, sp, i.payload?.name, i.payload?.latin, i.moderatorNote].join(' ').toLowerCase();
      return text.includes(lower);
    });
  }, [items, q, type, status, species]);

  const toggleSelectAll = (checked: boolean) => {
    const obj: Record<string, boolean> = {};
    filtered.forEach(i => obj[i.id] = checked);
    setSelected(obj);
  };
  const selectedIds = useMemo(() => Object.entries(selected).filter(([,v])=>v).map(([k])=>k), [selected]);

  const decide = (ids: string[], decision: 'approve'|'reject') => {
    const now = new Date().toISOString();
    const next = items.map(i => {
      if (!ids.includes(i.id)) return i;
      const reward = i.reward ?? REWARD_BY_TYPE[i.type];
      const stake = i.stake ?? 0;
      if (decision === 'approve') {
        credit(i.userId, reward + (i.stakeStatus==='locked' ? stake : 0));
        return {
          ...i,
          status: 'approved' as ContributionStatus,
          stakeStatus: i.stakeStatus==='locked' ? 'refunded' : i.stakeStatus,
          moderatorNote: note || i.moderatorNote || null,
          decidedAt: now,
          decidedBy: 'admin',
        };
      } else {
        return {
          ...i,
          status: 'rejected' as ContributionStatus,
          stakeStatus: i.stakeStatus==='locked' ? 'burned' : i.stakeStatus,
          moderatorNote: note || i.moderatorNote || null,
          decidedAt: now,
          decidedBy: 'admin',
        };
      }
    });
    setItems(next); saveSubmissions(next); setSelected({}); setAction(null); setNote('');
  };

  const exportCSV = () => {
    const rows = [
      ['id','userId','type','species','status','createdAt','decidedAt','stake','stakeStatus','reward','note'],
      ...filtered.map(i => [
        i.id, i.userId, i.type,
        i.speciesId || '', i.status,
        i.createdAt, i.decidedAt || '',
        String(i.stake ?? ''), i.stakeStatus || '',
        String(i.reward ?? ''), (i.moderatorNote || '').replace(/\n/g,' ')
      ])
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contributions_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const KPI = (label: string, value: React.ReactNode, sub?: string) => (
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

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI('Total', kpis.total)}
        {KPI('En attente', kpis.p)}
        {KPI('Validées', kpis.a)}
        {KPI('Refusées', kpis.r)}
        {KPI('Taux d\'acceptation', `${kpis.rate}%`, 'sur décisions')}
        {KPI('Délai moyen', `${kpis.avgH} h`, 'appr./refus')}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {section('Répartition par type & statut', (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.byType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" /><YAxis />
                <Tooltip /><Legend />
                <Bar dataKey="pending" name="En attente" fill="#f59e0b" />
                <Bar dataKey="approved" name="Validées" fill="#16a34a" />
                <Bar dataKey="rejected" name="Refusées" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}

        {section('Filtres & actions', (
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-600">Recherche</label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"/>
                <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="id, user, nom, espèce…" className="pl-8 w-full border rounded-lg p-2" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Type</label>
              <select value={type} onChange={(e)=>setType(e.target.value as any)} className="border rounded-lg p-2">
                <option value="all">Tous</option>
                <option value="species">Espèce</option>
                <option value="morph">Morph</option>
                <option value="locality">Localité</option>
                <option value="alias">Alias</option>
                <option value="locus">Locus</option>
                <option value="group">Groupe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Statut</label>
              <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="border rounded-lg p-2">
                <option value="all">Tous</option>
                <option value="pending">En attente</option>
                <option value="approved">Validé</option>
                <option value="rejected">Refusé</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"><Download className="h-4 w-4"/> Export CSV</button>
              <button disabled={!selectedIds.length} onClick={()=>setAction('approve')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${selectedIds.length? 'hover:bg-green-50' : 'opacity-50 cursor-not-allowed'}`}><CheckCircle2 className="h-4 w-4 text-green-600"/> Approuver ({selectedIds.length})</button>
              <button disabled={!selectedIds.length} onClick={()=>setAction('reject')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${selectedIds.length? 'hover:bg-rose-50' : 'opacity-50 cursor-not-allowed'}`}><XCircle className="h-4 w-4 text-rose-600"/> Refuser ({selectedIds.length})</button>
            </div>
          </div>
        ))}
      </div>

      {section('Contributions', (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2"><input type="checkbox" onChange={(e)=>toggleSelectAll(e.target.checked)} /></th>
                <th className="p-2">Date</th>
                <th className="p-2">Utilisateur</th>
                <th className="p-2">Type</th>
                <th className="p-2">Espèce</th>
                <th className="p-2">Contenu</th>
                <th className="p-2">Stake</th>
                <th className="p-2">Récompense</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 && (
                <tr><td className="p-6 text-gray-500" colSpan={10}>Aucune contribution trouvée.</td></tr>
              )}
              {filtered.map(i => {
                const sp = i.speciesId && species.find(s=>s.id===i.speciesId)?.label;
                const title = i.payload?.name || i.payload?.latin || '—';
                return (
                  <tr key={i.id} className="border-t align-top">
                    <td className="p-2"><input type="checkbox" checked={!!selected[i.id]} onChange={(e)=>setSelected({ ...selected, [i.id]: e.target.checked })} /></td>
                    <td className="p-2 whitespace-nowrap text-gray-600">{new Date(i.createdAt).toLocaleString()}</td>
                    <td className="p-2 text-gray-700">{i.userId}</td>
                    <td className="p-2"><TypePill t={i.type}/></td>
                    <td className="p-2">{i.type==='species' ? '—' : (sp || i.speciesId)}</td>
                    <td className="p-2">
                      <div className="font-medium text-gray-900">{title}</div>
                      {i.payload?.aliases?.length ? <div className="text-xs text-gray-500">alias: {(i.payload.aliases as string[]).slice(0,3).join(', ')}{(i.payload.aliases.length>3?'…':'')}</div> : null}
                      {i.moderatorNote && <div className="text-xs text-gray-500 mt-1">note: {i.moderatorNote}</div>}
                    </td>
                    <td className="p-2 text-xs text-gray-600">{i.stake ? `${i.stake} ⟡ (${i.stakeStatus||'—'})` : '—'}</td>
                    <td className="p-2 text-xs text-gray-600">{i.reward ? `${i.reward} ⟡` : `${REWARD_BY_TYPE[i.type]} ⟡`}</td>
                    <td className="p-2"><StatusBadge s={i.status}/></td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button onClick={()=>setDetail(i)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50 inline-flex items-center gap-1"><Eye className="h-4 w-4"/>Détails</button>
                        {i.status==='pending' ? (
                          <>
                            <button onClick={()=>{ setSelected({ [i.id]: true }); setAction('approve'); }} className="px-2 py-1 text-xs rounded border hover:bg-green-50 inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600"/>Approuver</button>
                            <button onClick={()=>{ setSelected({ [i.id]: true }); setAction('reject'); }} className="px-2 py-1 text-xs rounded border hover:bg-rose-50 inline-flex items-center gap-1"><XCircle className="h-4 w-4 text-rose-600"/>Refuser</button>
                          </>
                        ) : (
                          <button onClick={()=>{ /* Option: revenir à pending */ const next = items.map(x=> x.id===i.id ? { ...x, status: 'pending' as ContributionStatus, decidedAt: undefined } : x); setItems(next); saveSubmissions(next); }} className="px-2 py-1 text-xs rounded border hover:bg-amber-50 inline-flex items-center gap-1"><Undo2 className="h-4 w-4"/>Réouvrir</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ), (
        <div className="text-sm text-gray-600">{filtered.length} éléments • {selectedIds.length} sélectionné(s)</div>
      ))}

      {action && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>{ setAction(null); setNote(''); }} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border">
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <div className="flex items-center gap-2">
                  {action==='approve' ? <CheckCircle2 className="h-5 w-5 text-green-600"/> : <XCircle className="h-5 w-5 text-rose-600"/>}
                  <h4 className="font-semibold">{action==='approve' ? 'Approuver' : 'Refuser'} {selectedIds.length} contribution(s)</h4>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-lg" onClick={()=>{ setAction(null); setNote(''); }}>✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="text-sm text-gray-600">Note au contributeur (optionnelle)</div>
                <textarea rows={4} value={note} onChange={(e)=>setNote(e.target.value)} className="w-full border rounded-lg p-2" placeholder={action==='approve' ? 'Merci, c\'est validé !' : 'Merci, nous ne pouvons pas accepter car…'} />
                <div className="text-xs text-gray-500">Les stakes seront {action==='approve' ? 'remboursés' : 'brûlés'} automatiquement. Les récompenses sont créditées au wallet du contributeur lors d\'une approbation.</div>
              </div>
              <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
                <button onClick={()=>{ setAction(null); setNote(''); }} className="px-4 py-2 rounded-lg border">Annuler</button>
                <button onClick={()=>decide(selectedIds, action)} className={`px-4 py-2 rounded-lg text-white ${action==='approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-rose-600 hover:bg-rose-700'}`}>{action==='approve' ? 'Approuver' : 'Refuser'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border">
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-green-600"/>
                  <h4 className="font-semibold">Détail contribution</h4>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-lg" onClick={()=>setDetail(null)}>✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">ID</span><div className="font-mono">{detail.id}</div></div>
                  <div><span className="text-gray-500">Utilisateur</span><div>{detail.userId}</div></div>
                  <div><span className="text-gray-500">Type</span><div><TypePill t={detail.type}/></div></div>
                  <div><span className="text-gray-500">Espèce</span><div>{detail.type==='species' ? '—' : (species.find(s=>s.id===detail.speciesId!)?.label || detail.speciesId)}</div></div>
                  <div><span className="text-gray-500">Créée</span><div>{new Date(detail.createdAt).toLocaleString()}</div></div>
                  <div><span className="text-gray-500">Statut</span><div><StatusBadge s={detail.status}/></div></div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="font-semibold mb-2">Contenu</div>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {detail.payload?.name && <div><span className="text-gray-500">Nom</span><div>{detail.payload.name}</div></div>}
                    {detail.payload?.latin && <div><span className="text-gray-500">Nom latin</span><div>{detail.payload.latin}</div></div>}
                    {detail.payload?.genType && <div><span className="text-gray-500">Génétique</span><div>{detail.payload.genType}</div></div>}
                    {detail.payload?.aliases?.length ? <div className="sm:col-span-2"><span className="text-gray-500">Alias</span><div>{detail.payload.aliases.join(', ')}</div></div> : null}
                    {detail.payload?.notes && <div className="sm:col-span-2"><span className="text-gray-500">Notes</span><div className="whitespace-pre-wrap">{detail.payload.notes}</div></div>}
                    {detail.payload?.references?.length ? <div className="sm:col-span-2"><span className="text-gray-500">Références</span><div className="break-words">{detail.payload.references.join(', ')}</div></div> : null}
                  </div>
                </div>

                {detail.payload?.images?.length ? (
                  <div>
                    <div className="font-semibold mb-2 flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Photos ({detail.payload.images.length})</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {detail.payload.images.map((src, idx) => (
                        <img key={idx} src={src} alt={`img-${idx}`} className="w-full h-24 object-cover rounded-lg border" />
                      ))}
                    </div>
                  </div>
                ) : null}

                {detail.status==='pending' && (
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={()=>{ setSelected({ [detail.id]: true }); setAction('reject'); }} className="px-3 py-2 rounded-lg border hover:bg-rose-50 inline-flex items-center gap-1"><XCircle className="h-4 w-4 text-rose-600"/> Refuser</button>
                    <button onClick={()=>{ setSelected({ [detail.id]: true }); setAction('approve'); }} className="px-3 py-2 rounded-lg border hover:bg-green-50 inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600"/> Approuver</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
