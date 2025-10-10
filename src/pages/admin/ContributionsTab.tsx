// ContributionsTab.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Eye, Download, Search as SearchIcon, Undo2, ClipboardList, Tag } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import {
  SpeciesOpt,
  Contribution,
  ContributionType,
  ContributionStatus,
  fetchSpecies,
  adminFetchContributions,
  adminDecide,
  adminReopen
} from '../../lib/contribApi';

const REWARD_BY_TYPE: Record<ContributionType, number> = {
  species: 250, morph: 80, locality: 40, alias: 15, locus: 60, group: 50,
};

const FALLBACK_SPECIES: SpeciesOpt[] = [
  { id: 'python-regius', label: 'Ball Python' },
  { id: 'pantherophis-guttatus', label: 'Corn Snake' },
  { id: 'morelia-viridis', label: 'Green Tree Python' },
];

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

export default function ContributionsTab() {
  const { user } = useAuth();
  const moderatorId = user?.id || 'admin';

  const [species, setSpecies] = useState<SpeciesOpt[]>(FALLBACK_SPECIES);
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | ContributionType>('all');
  const [status, setStatus] = useState<'all' | ContributionStatus>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<Contribution | null>(null);
  const [note, setNote] = useState('');
  const [action, setAction] = useState<'approve'|'reject'|null>(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const sp = await fetchSpecies().catch(() => FALLBACK_SPECIES);
        // ⚠️ Important : récupérer TOUTES les contributions au chargement
        const list = await adminFetchContributions({ status: 'all' });
        if (abort) return;
        setSpecies(sp?.length ? sp : FALLBACK_SPECIES);
        setItems(list);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
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

  const decide = async (ids: string[], decision: 'approve'|'reject') => {
    try {
      await adminDecide(ids, decision, moderatorId, note || undefined);
      // refresh selon les filtres en cours (incluant 'all')
      const list = await adminFetchContributions({ q, type, status });
      setItems(list);
      setSelected({}); setAction(null); setNote('');
    } catch (e: any) {
      alert(e?.message || 'Action impossible.');
    }
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
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-semibold text-gray-900">{kpis.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">En attente</p>
          <p className="text-2xl font-semibold text-gray-900">{kpis.p}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Validées</p>
          <p className="text-2xl font-semibold text-gray-900">{kpis.a}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Refusées</p>
          <p className="text-2xl font-semibold text-gray-900">{kpis.r}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Taux d'acceptation</p>
          <p className="text-2xl font-semibold text-gray-900">{kpis.rate}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Délai moyen</p>
          <p className="text-2xl font-semibold text-gray-900">{kpis.avgH} h</p>
        </div>
      </div>

      {/* Répartition par type & statut (pleine largeur) */}
      {section('Répartition par type & statut', (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kpis.byType as any}>
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

      {/* Filtres & actions — déplacé juste au-dessus du tableau */}
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
            <button
              disabled={!selectedIds.length}
              onClick={() => setAction('approve')}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${selectedIds.length ? 'hover:bg-green-50' : 'opacity-50 cursor-not-allowed'}`}
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Approuver ({selectedIds.length})
            </button>

            <button
              disabled={!selectedIds.length}
              onClick={() => setAction('reject')}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${selectedIds.length ? 'hover:bg-rose-50' : 'opacity-50 cursor-not-allowed'}`}
            >
              <XCircle className="h-4 w-4 text-rose-600" /> Refuser ({selectedIds.length})
            </button>
          </div>
        </div>
      ))}

      {/* Tableau des contributions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contributions</h3>
          <div className="text-sm text-gray-600">{filtered.length} éléments • {selectedIds.length} sélectionné(s)</div>
        </div>

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
              {loading && <tr><td colSpan={10} className="p-6 text-gray-500">Chargement…</td></tr>}
              {!loading && filtered.length===0 && (
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
                    <td className="p-2 text-xs text-gray-600">
                      {i.stake != null
                        ? `${i.stake} ⟡ (${i.stakeStatus ? ({ locked: 'Bloqué', refunded: 'Remboursé', burned: 'Brûlé' } as const)[i.stakeStatus] : '—'})`
                        : '—'}
                    </td>
                    <td className="p-2 text-xs text-gray-600">
                      {i.reward != null ? `${i.reward} ⟡` : `${REWARD_BY_TYPE[i.type]} ⟡`}
                    </td>
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
                          <button onClick={()=>adminReopen(i.id).then(()=>adminFetchContributions({ q, type, status }).then(setItems))} className="px-2 py-1 text-xs rounded border hover:bg-amber-50 inline-flex items-center gap-1"><Undo2 className="h-4 w-4"/>Réouvrir</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
                <div className="text-xs text-gray-500">Les stakes seront {action==='approve' ? 'remboursés' : 'brûlés'} automatiquement.</div>
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
              <div className="p-5 space-y-4 text-sm">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><span className="text-gray-500">ID</span><div className="font-mono">{detail.id}</div></div>
                  <div><span className="text-gray-500">Utilisateur</span><div className="font-mono">{detail.userId}</div></div>
                  <div><span className="text-gray-500">Type</span><div className="">{detail.type}</div></div>
                  <div><span className="text-gray-500">Espèce</span><div className="">{detail.speciesId || '—'}</div></div>
                  <div><span className="text-gray-500">Créée</span><div className="">{new Date(detail.createdAt).toLocaleString()}</div></div>
                  <div><span className="text-gray-500">Statut</span><div className=""><strong>{detail.status}</strong></div></div>
                  {detail.decidedAt && <div><span className="text-gray-500">Décidée</span><div className="">{new Date(detail.decidedAt).toLocaleString()}</div></div>}
                  {detail.moderatorNote && <div className="sm:col-span-2"><span className="text-gray-500">Note</span><div className="">{detail.moderatorNote}</div></div>}
                </div>
                <div>
                  <div className="text-gray-500">Contenu</div>
                  <pre className="bg-gray-50 border rounded-lg p-3 whitespace-pre-wrap">{JSON.stringify(detail.payload, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
