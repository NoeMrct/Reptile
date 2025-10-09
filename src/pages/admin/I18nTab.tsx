import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

type LangCode = 'en' | 'fr' | 'es';
type Lang = { code: LangCode; label: string; done: number; total: number };

type PendingTrad = {
  id: string;
  key: string;
  lang: LangCode;
  value: string;
  submittedBy: string;
  submittedAt: string;
};

type TranslationVersion = {
  value: string;
  author: string;
  timestamp: string;
};

type TranslationEntry = {
  value: string;
  author: string;
  updatedAt: string;
  history: TranslationVersion[];
};

type TranslationStore = Record<string, Partial<Record<LangCode, TranslationEntry>>>;

type LeadEvent = {
  translator: string;
  submittedAt: string;
  approvedAt: string;
  hours: number;
};

export default function I18nTab({ userEmail }: { userEmail?: string }) {
  const [i18nTab, setI18nTab] = useState<'overview' | 'pending' | 'missing' | 'add' | 'browse'>('overview');

  const langs: Lang[] = [
    { code: 'en', label: 'English',  done: 920, total: 1000 },
    { code: 'fr', label: 'Français', done: 870, total: 1000 },
    { code: 'es', label: 'Español',  done: 610, total: 1000 },
  ];

  const i18nAllKeys = [
    'contribute.title',
    'contribute.tabs.propose',
    'contribute.form.type',
    'contribute.form.species',
    'contribute.form.aliasesLabel',
    'auth.login',
    'auth.logout',
    'auth.register',
    'auth.accountCreated',
    'snake.add',
    'snake.delete',
    'feeding.add',
    'shed.add',
    'export.pdf',
    'i18n.coverage',
  ];

  const translationLeadTimeGlobal = [
    { month: 'Mar', hours: 72 },
    { month: 'Apr', hours: 48 },
    { month: 'May', hours: 30 },
    { month: 'Jun', hours: 26 },
  ];

  const translatorLeaderboard = [
    { user: 'Ana',  keys: 220 },
    { user: 'Paul', keys: 180 },
    { user: 'Léa',  keys: 160 },
  ];

  const [translationStore, setTranslationStore] = useState<TranslationStore>({
    'contribute.title': {
      en: { value: 'Contribute', author: 'Ana', updatedAt: '2025-09-22', history: [] },
      fr: { value: 'Contribuer', author: 'Paul', updatedAt: '2025-09-23', history: [] },
      es: { value: 'Contribuir', author: 'Léa',  updatedAt: '2025-09-25', history: [] },
    },
    'auth.accountCreated': {
      en: { value: 'Account created', author: 'Ana', updatedAt: '2025-09-12', history: [] },
      fr: { value: 'Compte créé', author: 'Paul', updatedAt: '2025-09-13', history: [] },
    },
    'contribute.form.aliasesLabel': {
      en: { value: 'Aliases (comma-separated)', author: 'Ana', updatedAt: '2025-10-02', history: [] },
      fr: { value: 'Alias (séparés par des virgules)', author: 'Paul', updatedAt: '2025-10-02', history: [] },
    },
  });

  const existingTranslations = useMemo(() => {
    const base: Record<LangCode, Set<string>> = { en: new Set(), fr: new Set(), es: new Set() };
    for (const k of Object.keys(translationStore)) {
      for (const lang of ['en','fr','es'] as LangCode[]) {
        if (translationStore[k][lang]) base[lang].add(k);
      }
    }
    return base;
  }, [translationStore]);

  const getMissingFor = (lang: LangCode) => i18nAllKeys.filter((k) => !existingTranslations[lang]?.has(k));

  const [pendingTrads, setPendingTrads] = useState<PendingTrad[]>([
    {
      id: 'T-001',
      key: 'contribute.form.aliasesLabel',
      lang: 'es',
      value: 'Alias (separados por comas)',
      submittedBy: 'Ana',
      submittedAt: '2025-10-01T08:11:00Z',
    },
    {
      id: 'T-002',
      key: 'auth.accountCreated',
      lang: 'es',
      value: 'Cuenta creada',
      submittedBy: 'Paul',
      submittedAt: '2025-10-05T10:33:00Z',
    },
  ]);

  const [leadEvents, setLeadEvents] = useState<LeadEvent[]>([
    { translator: 'Ana',  submittedAt: '2025-09-10T09:00:00Z', approvedAt: '2025-09-11T21:00:00Z', hours: 36 },
    { translator: 'Paul', submittedAt: '2025-09-15T10:00:00Z', approvedAt: '2025-09-16T22:00:00Z', hours: 36 },
    { translator: 'Léa',  submittedAt: '2025-09-20T14:00:00Z', approvedAt: '2025-09-21T02:00:00Z', hours: 12 },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addKey, setAddKey] = useState('');
  const [addEN, setAddEN] = useState('');
  const [addFR, setAddFR] = useState('');
  const [extraLang, setExtraLang] = useState<LangCode>('es');
  const [addExtra, setAddExtra] = useState(false);
  const [addExtraValue, setAddExtraValue] = useState('');
  const [formError, setFormError] = useState('');
  const [browseQuery, setBrowseQuery] = useState('');
  const [browseLangFilter, setBrowseLangFilter] = useState<'all' | LangCode>('all');
  const [browseTranslator, setBrowseTranslator] = useState<string>('all');

  const translatorsSet = useMemo(() => {
    const s = new Set<string>();
    Object.values(translationStore).forEach((langsMap) => {
      (['en', 'fr', 'es'] as LangCode[]).forEach((lg) => {
        const e = langsMap[lg];
        if (e?.author) s.add(e.author);
        e?.history.forEach((h) => s.add(h.author));
      });
    });
    pendingTrads.forEach((p) => s.add(p.submittedBy));
    return ['all', ...Array.from(s).sort()];
  }, [translationStore, pendingTrads]);

  const browseRows = useMemo(() => {
    const rows = Object.keys(translationStore).map((key) => ({
      key,
      en: translationStore[key].en,
      fr: translationStore[key].fr,
      es: translationStore[key].es,
    }));
    return rows.filter((r) => {
      const inKey = !browseQuery || r.key.toLowerCase().includes(browseQuery.toLowerCase());
      const inVal =
        !browseQuery ||
        (['en', 'fr', 'es'] as LangCode[]).some((lg) =>
          r[lg]?.value.toLowerCase().includes(browseQuery.toLowerCase()),
        );

      const langOk =
        browseLangFilter === 'all' ||
        Boolean(r[browseLangFilter]);

      const translatorOk =
        browseTranslator === 'all' ||
        (['en', 'fr', 'es'] as LangCode[]).some((lg) => r[lg]?.author === browseTranslator);

      return (inKey || inVal) && langOk && translatorOk;
    });
  }, [translationStore, browseQuery, browseLangFilter, browseTranslator]);

  const avgLeadPerTranslator = useMemo(() => {
    const byT: Record<string, { sum: number; n: number }> = {};
    for (const e of leadEvents) {
      if (!byT[e.translator]) byT[e.translator] = { sum: 0, n: 0 };
      byT[e.translator].sum += e.hours;
      byT[e.translator].n++;
    }
    return Object.keys(byT).map((t) => ({ translator: t, avgHours: +(byT[t].sum / byT[t].n).toFixed(1) }));
  }, [leadEvents]);

  const hoursBetween = (startISO: string, endISO: string) =>
    Math.max(0, (new Date(endISO).getTime() - new Date(startISO).getTime()) / 36e5);

  const approvePending = (id: string) => {
    const p = pendingTrads.find((x) => x.id === id);
    if (!p) return;

    const now = new Date().toISOString();
    setTranslationStore((prev) => {
      const next = { ...prev };
      const perLang = next[p.key] || {};
      const existed = perLang[p.lang];
      if (existed) {
        existed.history = [
          ...existed.history,
          { value: existed.value, author: existed.author, timestamp: existed.updatedAt },
        ];
        existed.value = p.value;
        existed.author = p.submittedBy;
        existed.updatedAt = now;
      } else {
        perLang[p.lang] = {
          value: p.value,
          author: p.submittedBy,
          updatedAt: now,
          history: [],
        };
      }
      next[p.key] = perLang;
      return next;
    });

    setPendingTrads((prev) => prev.filter((x) => x.id !== id));

    setLeadEvents((prev) => [
      ...prev,
      {
        translator: p.submittedBy,
        submittedAt: p.submittedAt,
        approvedAt: now,
        hours: +hoursBetween(p.submittedAt, now).toFixed(1),
      },
    ]);
  };

  const rejectPending = (id: string) => setPendingTrads((prev) => prev.filter((x) => x.id !== id));

  const submitAddMulti = () => {
    setFormError('');
    const key = addKey.trim();
    const enV = addEN.trim();
    const frV = addFR.trim();
    const extraV = addExtra ? addExtraValue.trim() : '';

    if (!key || !enV || !frV) {
      setFormError('La clé, EN et FR sont requis.');
      return;
    }

    const me = userEmail || 'You';
    const now = new Date().toISOString();

    const newPending: PendingTrad[] = [
      { id: 'T-' + cryptoRandom(), key, lang: 'en', value: enV, submittedBy: me, submittedAt: now },
      { id: 'T-' + cryptoRandom(), key, lang: 'fr', value: frV, submittedBy: me, submittedAt: now },
    ];

    if (addExtra && extraV) {
      newPending.push({ id: 'T-' + cryptoRandom(), key, lang: extraLang, value: extraV, submittedBy: me, submittedAt: now });
    }

    setPendingTrads((prev) => [...newPending, ...prev]);
    setAddKey(''); setAddEN(''); setAddFR(''); setAddExtraValue(''); setAddExtra(false);
    setShowAddModal(false);
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState<string>('');
  const [editLang, setEditLang] = useState<LangCode>('en');
  const [editDraft, setEditDraft] = useState<string>('');

  const openEdit = (key: string, lang: LangCode = 'en') => {
    setEditKey(key);
    setEditLang(lang);
    const current = translationStore[key]?.[lang]?.value || '';
    setEditDraft(current);
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editKey || !editLang) return;
    const current = translationStore[editKey]?.[editLang];
    const me = userEmail || 'You';
    const now = new Date().toISOString();

    setTranslationStore((prev) => {
      const next = { ...prev };
      const perLang = next[editKey] || {};
      if (current) {
        current.history = [
          ...current.history,
          { value: current.value, author: current.author, timestamp: current.updatedAt },
        ];
        current.value = editDraft;
        current.author = me;
        current.updatedAt = now;
        perLang[editLang] = current;
      } else {
        perLang[editLang] = { value: editDraft, author: me, updatedAt: now, history: [] };
      }
      next[editKey] = perLang;
      return next;
    });

    setEditOpen(false);
  };

  const ellips = (s?: string, n = 48) => (s ? (s.length > n ? s.slice(0, n - 1) + '…' : s) : '');
  const cryptoRandom = () => String(Math.floor(Math.random() * 900000 + 100000));

  const section = (title: string, children: React.ReactNode, actions?: React.ReactNode) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'overview', label: 'Aperçu' },
          { id: 'pending',  label: `En attente (${pendingTrads.length})` },
          { id: 'missing',  label: `Manquantes (${getMissingFor('fr').length})` },
          { id: 'add',      label: 'Ajouter' },
          { id: 'browse',   label: 'Parcourir & Éditer' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setI18nTab(s.id as any)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              i18nTab === s.id
                ? 'bg-green-50 border-green-600 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {i18nTab === 'overview' && (
        <div className="space-y-6">
          {section('Couverture des traductions', (
            <div className="grid md:grid-cols-3 gap-4">
              {langs.map((l) => (
                <div key={l.code} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{l.label}</div>
                      <div className="text-xs text-gray-500">{l.code}</div>
                    </div>
                    <div className="text-sm text-gray-600">{Math.round((l.done / l.total) * 100)}%</div>
                  </div>
                  <div className="mt-2 h-3 w-full bg-gray-100 rounded">
                    <div className="h-3 rounded" style={{ width: `${(l.done / l.total) * 100}%`, backgroundColor: '#16a34a' }} />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{l.done}/{l.total} clés</div>
                </div>
              ))}
            </div>
          ))}

          <div className="grid lg:grid-cols-2 gap-6">
            {section('Délai moyen global', (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={translationLeadTimeGlobal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" /><YAxis unit="h" />
                    <Tooltip /><Legend />
                    <Line dataKey="hours" name="Heures" stroke="#2563eb" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}

            {section('Délai moyen par traducteur', (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={avgLeadPerTranslator}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="translator" /><YAxis unit="h" />
                    <Tooltip /><Legend />
                    <Bar dataKey="avgHours" name="Moyenne (h)" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          {section('Leaderboard traducteurs', (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Traducteur</th>
                    <th className="p-2">Clés traduites</th>
                  </tr>
                </thead>
                <tbody>
                  {translatorLeaderboard.map((t) => (
                    <tr key={t.user} className="border-t">
                      <td className="p-2">{t.user}</td>
                      <td className="p-2">{t.keys}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {i18nTab === 'pending' && section('Traductions en attente de validation', (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Clé</th>
                <th className="p-2">Langue</th>
                <th className="p-2">Valeur</th>
                <th className="p-2">Soumise par</th>
                <th className="p-2">Soumise le</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingTrads.length === 0 && (
                <tr><td className="p-4 text-gray-500" colSpan={7}>Aucune traduction en attente.</td></tr>
              )}
              {pendingTrads.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2 font-mono text-xs">{p.key}</td>
                  <td className="p-2">{p.lang.toUpperCase()}</td>
                  <td className="p-2 truncate max-w-xs" title={p.value}>{p.value}</td>
                  <td className="p-2">{p.submittedBy}</td>
                  <td className="p-2">{new Date(p.submittedAt).toLocaleString()}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => approvePending(p.id)} className="px-2 py-1 text-xs rounded bg-green-600 text-white">Approuver</button>
                    <button onClick={() => rejectPending(p.id)}  className="px-2 py-1 text-xs rounded bg-red-600 text-white">Rejeter</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {i18nTab === 'missing' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600">Langue</label>
              <select
                defaultValue="fr"
                onChange={(e) => setI18nTab('missing')}
                className="w-full border rounded-lg p-2"
                onInput={(e: any) => undefined}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600">Recherche clé</label>
              <input
                value={browseQuery}
                onChange={(e) => setBrowseQuery(e.target.value)}
                placeholder="ex: contribute.form."
                className="w-full border rounded-lg p-2"
              />
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg">
              Ajouter (EN+FR)
            </button>
          </div>

          {section('Clés manquantes (FR)', (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Clé</th>
                  </tr>
                </thead>
                <tbody>
                  {getMissingFor('fr')
                    .filter((k) => !browseQuery || k.includes(browseQuery))
                    .map((k) => (
                      <tr key={k} className="border-t">
                        <td className="p-2 font-mono text-xs">{k}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {i18nTab === 'add' && section('Ajouter une traduction (EN + FR requis)', (
        <form className="grid md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); submitAddMulti(); }}>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600">Clé</label>
            <input value={addKey} onChange={(e) => setAddKey(e.target.value)} placeholder="ex: contribute.form.name" className="w-full border rounded-lg p-2" />
          </div>

          <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Anglais (EN) — requis</label>
              <textarea rows={4} value={addEN} onChange={(e) => setAddEN(e.target.value)} className="w-full border rounded-lg p-2" placeholder="English value" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Français (FR) — requis</label>
              <textarea rows={4} value={addFR} onChange={(e) => setAddFR(e.target.value)} className="w-full border rounded-lg p-2" placeholder="Valeur française" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={addExtra} onChange={(e) => setAddExtra(e.target.checked)} />
              Ajouter une langue supplémentaire
            </label>
            {addExtra && (
              <div className="mt-3 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">Langue supp.</label>
                  <select value={extraLang} onChange={(e) => setExtraLang(e.target.value as LangCode)} className="w-full border rounded-lg p-2">
                    {langs.filter(l => l.code !== 'en' && l.code !== 'fr').map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Valeur</label>
                  <textarea rows={4} value={addExtraValue} onChange={(e) => setAddExtraValue(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
              </div>
            )}
          </div>

          {formError && <div className="md:col-span-2 text-sm text-red-600">{formError}</div>}

          <div className="md:col-span-2 flex items-center gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg">Soumettre</button>
            <button type="button" onClick={() => { setFormError(''); setAddKey(''); setAddEN(''); setAddFR(''); setAddExtraValue(''); setAddExtra(false); }} className="px-4 py-2 rounded-lg border">Réinitialiser</button>
          </div>
        </form>
      ))}

      {i18nTab === 'browse' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600">Recherche (clé ou valeur)</label>
              <input value={browseQuery} onChange={(e) => setBrowseQuery(e.target.value)} placeholder="ex: contribute.title, 'Account created'…" className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Langue</label>
              <select value={browseLangFilter} onChange={(e) => setBrowseLangFilter(e.target.value as any)} className="w-full border rounded-lg p-2">
                <option value="all">Toutes</option>
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="es">ES</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Traducteur</label>
              <select value={browseTranslator} onChange={(e) => setBrowseTranslator(e.target.value)} className="w-full border rounded-lg p-2">
                {translatorsSet.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {section('Traductions existantes', (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2 w-1/4">Clé</th>
                    <th className="p-2">EN</th>
                    <th className="p-2">FR</th>
                    <th className="p-2">ES</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {browseRows.length === 0 && (
                    <tr><td className="p-4 text-gray-500" colSpan={5}>Aucun résultat.</td></tr>
                  )}
                  {browseRows.map((row) => (
                    <tr key={row.key} className="border-t align-top">
                      <td className="p-2 font-mono text-xs">{row.key}</td>
                      {(['en','fr','es'] as LangCode[]).map((lg) => (
                        <td key={lg} className="p-2">
                          {row[lg] ? (
                            <div>
                              <div className="text-gray-900">{ellips(row[lg]!.value)}</div>
                              <div className="text-xs text-gray-500">par {row[lg]!.author} — {row[lg]!.updatedAt}</div>
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                      ))}
                      <td className="p-2 space-x-2">
                        <button onClick={() => openEdit(row.key, 'en')} className="px-2 py-1 text-xs rounded bg-gray-900 text-white">Éditer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ajouter une traduction (EN + FR requis)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600">Clé</label>
                <input value={addKey} onChange={(e) => setAddKey(e.target.value)} className="w-full border rounded-lg p-2" />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Anglais (EN)</label>
                  <textarea rows={4} value={addEN} onChange={(e) => setAddEN(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Français (FR)</label>
                  <textarea rows={4} value={addFR} onChange={(e) => setAddFR(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={addExtra} onChange={(e) => setAddExtra(e.target.checked)} />
                Ajouter une langue supplémentaire
              </label>
              {addExtra && (
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600">Langue supp.</label>
                    <select value={extraLang} onChange={(e) => setExtraLang(e.target.value as LangCode)} className="w-full border rounded-lg p-2">
                      {langs.filter((l) => l.code !== 'en' && l.code !== 'fr').map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Valeur</label>
                    <textarea rows={4} value={addExtraValue} onChange={(e) => setAddExtraValue(e.target.value)} className="w-full border rounded-lg p-2" />
                  </div>
                </div>
              )}

              {formError && <div className="text-sm text-red-600">{formError}</div>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg border">Annuler</button>
              <button onClick={submitAddMulti} className="px-4 py-2 rounded-lg bg-green-600 text-white">Soumettre</button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Éditer & Historique</h3>
              <button onClick={() => setEditOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-600 font-mono">{editKey}</span>
                  <select value={editLang} onChange={(e) => setEditLang(e.target.value as LangCode)} className="border rounded-lg p-1 text-sm">
                    <option value="en">EN</option>
                    <option value="fr">FR</option>
                    <option value="es">ES</option>
                  </select>
                </div>
                <textarea rows={8} value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="w-full border rounded-lg p-2" />
                <div className="mt-3 flex gap-2">
                  <button onClick={saveEdit} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm">Enregistrer</button>
                  <button onClick={() => setEditOpen(false)} className="px-3 py-2 rounded-lg border text-sm">Annuler</button>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Historique ({translationStore[editKey]?.[editLang]?.history.length || 0})</div>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {translationStore[editKey]?.[editLang]?.history.length
                    ? translationStore[editKey]![editLang]!.history.slice().reverse().map((h, idx) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">{new Date(h.timestamp).toLocaleString()} — {h.author}</div>
                          <div className="text-sm whitespace-pre-wrap">{h.value}</div>
                        </div>
                      ))
                    : <div className="text-xs text-gray-400">Aucun historique pour cette langue.</div>}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
