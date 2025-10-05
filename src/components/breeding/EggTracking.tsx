import React, { useEffect, useMemo, useState } from 'react';
import { Egg as EggIcon, Plus, Thermometer, Droplet, Calendar, TrendingUp, Pencil, Trash2, X } from 'lucide-react';
import { Clutch, Egg, Pairing, Snake } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { format, differenceInDays, addDays } from 'date-fns';
import { t } from 'i18next';

const K_CLUTCHES = (uid: string) => `clutches_by_user_${uid || 'anonymous'}`;
const K_EGGS     = (uid: string) => `eggs_by_user_${uid || 'anonymous'}`;
const K_SNAKES   = (uid: string) => `snakes_by_user_${uid || 'anonymous'}`;
const K_PAIRINGS = (uid: string) => `pairings_by_user_${uid || 'anonymous'}`;

type EggStatus = Egg['status'];

type ClutchForm = {
  pairingId: string;
  laidDate: string;
  eggCount: number;
  fertileCount: number;
  incubationTemp: number;
  incubationHumidity: number;
  expectedHatchDate: string;
  notes: string;
};

type EggEdit = {
  id: string;
  status: EggStatus;
  weight?: number | null;
};

const statusColor = (s: EggStatus) =>
  s === 'incubating' ? 'border-blue-300 bg-blue-50 text-blue-900'
  : s === 'hatched'  ? 'border-green-300 bg-green-50 text-green-900'
  : s === 'infertile'? 'border-gray-300 bg-gray-50 text-gray-900'
  :                    'border-red-300 bg-red-50 text-red-900';

const statusLabel = (s: EggStatus) =>
  s === 'incubating' ? t('eggTracking.status.incubating')
  : s === 'hatched'  ? t('eggTracking.status.hatched')
  : s === 'infertile'? t('eggTracking.status.infertile')
  : t('eggTracking.status.damaged');

const fmt = (d: string) => format(new Date(d), 'dd MMM yyyy');

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const EggTracking = () => {
  const { user } = useAuth();
  const ukey = user?.id || '';

  const [clutches, setClutches] = useState<Clutch[]>([]);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [snakes, setSnakes] = useState<Snake[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<ClutchForm>(() => {
    const laid = new Date();
    const expected = addDays(laid, 60);
    return {
      pairingId: '',
      laidDate: laid.toISOString().split('T')[0],
      eggCount: 6,
      fertileCount: 6,
      incubationTemp: 31.5,
      incubationHumidity: 90,
      expectedHatchDate: expected.toISOString().split('T')[0],
      notes: '',
    };
  });

  const [editingEgg, setEditingEgg] = useState<EggEdit | null>(null);

  useEffect(() => {
    // Snakes
    try {
      const raw = localStorage.getItem(K_SNAKES(ukey));
      if (raw) {
        setSnakes(JSON.parse(raw));
      } else {
        const mockSnakes: Snake[] = [
          { id: '1', name: 'Luna', species: 'Ball Python', morph: 'Pastel', sex: 'Female', birthDate: '2022-03-15', weight: 1200, length: 120, userId: ukey },
          { id: '2', name: 'Thor', species: 'Ball Python', morph: 'Anery',  sex: 'Male',   birthDate: '2021-08-20', weight: 800,  length: 95,  userId: ukey },
        ];
        setSnakes(mockSnakes);
        localStorage.setItem(K_SNAKES(ukey), JSON.stringify(mockSnakes));
      }
    } catch {}

    // Pairings
    try {
      const raw = localStorage.getItem(K_PAIRINGS(ukey));
      if (raw) {
        setPairings(JSON.parse(raw));
      } else {
        const mockPairings: Pairing[] = [
          { id: 'p1', maleSnakeId: '2', femaleSnakeId: '1', pairingDate: '2024-12-01', status: 'successful', userId: ukey, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];
        setPairings(mockPairings);
        localStorage.setItem(K_PAIRINGS(ukey), JSON.stringify(mockPairings));
      }
    } catch {}

    // Clutches
    try {
      const raw = localStorage.getItem(K_CLUTCHES(ukey));
      if (raw) {
        setClutches(JSON.parse(raw));
      } else {
        const mockClutches: Clutch[] = [
          { id: 'c1', pairingId: 'p1', laidDate: '2025-01-15', eggCount: 8, fertileCount: 7, incubationTemp: 31.5, incubationHumidity: 90, expectedHatchDate: '2025-03-15', notes: 'Première ponte de Luna', userId: ukey, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];
        setClutches(mockClutches);
        localStorage.setItem(K_CLUTCHES(ukey), JSON.stringify(mockClutches));
      }
    } catch {}

    // Eggs
    try {
      const raw = localStorage.getItem(K_EGGS(ukey));
      if (raw) {
        setEggs(JSON.parse(raw));
      } else {
        const mockEggs: Egg[] = Array.from({ length: 8 }, (_, i) => ({
          id: `e_${i + 1}`,
          clutchId: 'c1',
          eggNumber: i + 1,
          status: i === 7 ? 'infertile' : 'incubating',
          weight: Math.round((55 + Math.random() * 10) * 10) / 10,
          userId: ukey,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setEggs(mockEggs);
        localStorage.setItem(K_EGGS(ukey), JSON.stringify(mockEggs));
      }
    } catch {}
  }, [ukey]);

  useEffect(() => { try { localStorage.setItem(K_CLUTCHES(ukey), JSON.stringify(clutches)); } catch {} }, [clutches, ukey]);
  useEffect(() => { try { localStorage.setItem(K_EGGS(ukey),     JSON.stringify(eggs));     } catch {} }, [eggs, ukey]);

  const getSnakeName = (id: string) => snakes.find(s => s.id === id)?.name || 'Unknown';
  const getDaysRemaining = (date?: string) => (date ? differenceInDays(new Date(date), new Date()) : null);

  const clutchEggs = (cid: string) => eggs.filter(e => e.clutchId === cid).sort((a, b) => a.eggNumber - b.eggNumber);

  const maleLabel = (p: Pairing) => `${getSnakeName(p.maleSnakeId)}`;
  const femaleLabel = (p: Pairing) => `${getSnakeName(p.femaleSnakeId)}`;

  const openAdd = () => {
    const laid = new Date();
    const expected = addDays(laid, 60);
    setIsEditing(false);
    setEditingId(null);
    setForm({
      pairingId: pairings[0]?.id || '',
      laidDate: laid.toISOString().split('T')[0],
      eggCount: 6,
      fertileCount: 6,
      incubationTemp: 31.5,
      incubationHumidity: 90,
      expectedHatchDate: expected.toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (c: Clutch) => {
    setIsEditing(true);
    setEditingId(c.id);
    setForm({
      pairingId: c.pairingId,
      laidDate: c.laidDate,
      eggCount: c.eggCount,
      fertileCount: c.fertileCount || 0,
      incubationTemp: c.incubationTemp || 31.5,
      incubationHumidity: c.incubationHumidity || 90,
      expectedHatchDate: c.expectedHatchDate || addDays(new Date(c.laidDate), 60).toISOString().split('T')[0],
      notes: c.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setIsEditing(false); setEditingId(null); };

  const ensureEggsForClutch = (clutchId: string, eggCount: number, fertileCount: number) => {
    setEggs(prev => {
      const existing = prev.filter(e => e.clutchId === clutchId);
      const out = prev.filter(e => e.clutchId !== clutchId);

      if (existing.length > eggCount) {
        const keep = existing
          .sort((a, b) => a.eggNumber - b.eggNumber)
          .slice(0, eggCount);
        return [...out, ...keep];
      }

      if (existing.length < eggCount) {
        const next: Egg[] = [];
        for (let n = existing.length + 1; n <= eggCount; n++) {
          next.push({
            id: uid(),
            clutchId: clutchId,
            eggNumber: n,
            status: n <= fertileCount ? 'incubating' : 'infertile',
            weight: null as any,
            userId: ukey,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        return [...out, ...existing, ...next];
      }

      const normalized = existing.map(e => {
        if (e.eggNumber > fertileCount && e.status === 'incubating') {
          return { ...e, status: 'infertile', updatedAt: new Date().toISOString() };
        }
        return e;
      });

      return [...out, ...normalized];
    });
  };

  const onSubmitClutch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pairingId) return;
    if (form.fertileCount > form.eggCount) {
      alert("{t('eggTracking.form.error.fertileExceedsTotal')}");
      return;
    }

    if (isEditing && editingId) {
      setClutches(prev => prev.map(c => c.id === editingId ? ({
        ...c,
        pairingId: form.pairingId,
        laidDate: form.laidDate,
        eggCount: form.eggCount,
        fertileCount: form.fertileCount,
        incubationTemp: form.incubationTemp,
        incubationHumidity: form.incubationHumidity,
        expectedHatchDate: form.expectedHatchDate,
        notes: form.notes,
        updatedAt: new Date().toISOString(),
      }) : c));
      ensureEggsForClutch(editingId, form.eggCount, form.fertileCount);
    } else {
      const id = uid();
      const now = new Date().toISOString();
      const newClutch: Clutch = {
        id,
        pairingId: form.pairingId,
        laidDate: form.laidDate,
        eggCount: form.eggCount,
        fertileCount: form.fertileCount,
        incubationTemp: form.incubationTemp,
        incubationHumidity: form.incubationHumidity,
        expectedHatchDate: form.expectedHatchDate,
        notes: form.notes,
        userId: ukey,
        createdAt: now,
        updatedAt: now,
      };
      setClutches(prev => [newClutch, ...prev]);

      setEggs(prev => {
        const created: Egg[] = Array.from({ length: form.eggCount }, (_, i) => ({
          id: uid(),
          clutchId: id,
          eggNumber: i + 1,
          status: i + 1 <= form.fertileCount ? 'incubating' : 'infertile',
          weight: null as any,
          userId: ukey,
          createdAt: now,
          updatedAt: now,
        }));
        return [...created, ...prev];
      });
    }
    closeModal();
  };

  const requestDelete = (id: string) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);
  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    const cid = confirmDeleteId;
    setClutches(prev => prev.filter(c => c.id !== cid));
    setEggs(prev => prev.filter(e => e.clutchId !== cid));
    setConfirmDeleteId(null);
  };

  const openEggEdit = (egg: Egg) => setEditingEgg({ id: egg.id, status: egg.status, weight: egg.weight ?? null });
  const cancelEggEdit = () => setEditingEgg(null);
  const saveEggEdit = () => {
    if (!editingEgg) return;
    setEggs(prev => prev.map(e => e.id === editingEgg.id ? ({
      ...e,
      status: editingEgg.status,
      weight: editingEgg.weight == null || editingEgg.weight === ('' as any) ? null : Number(editingEgg.weight),
      updatedAt: new Date().toISOString(),
    }) : e));
    setEditingEgg(null);
  };

  const totals = useMemo(() => {
    const totalEggs = eggs.length;
    const inc = eggs.filter(e => e.status === 'incubating').length;
    const hat = eggs.filter(e => e.status === 'hatched').length;
    const inf = eggs.filter(e => e.status === 'infertile').length;
    const dam = eggs.filter(e => e.status === 'damaged').length;
    return { totalEggs, inc, hat, inf, dam };
  }, [eggs]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{t('eggTracking.title')}</h3>
          <p className="text-gray-600 mt-1">{t('eggTracking.subtitle')}</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('eggTracking.actions.newClutch')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">{t('eggTracking.stats.eggs')}</div>
          <div className="text-xl font-semibold">{totals.totalEggs}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-700">{t('eggTracking.stats.incubating')}</div>
          <div className="text-xl font-semibold text-blue-900">{totals.inc}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-xs text-green-700">{t('eggTracking.status.hatched')}</div>
          <div className="text-xl font-semibold text-green-900">{totals.hat}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-700">{t('eggTracking.stats.infertilePlural')}</div>
          <div className="text-xl font-semibold text-gray-900">{totals.inf}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-xs text-red-700">{t('eggTracking.stats.damagedPlural')}</div>
          <div className="text-xl font-semibold text-red-900">{totals.dam}</div>
        </div>
      </div>

      <div className="grid gap-6">
        {clutches.map(clutch => {
          const pairing = pairings.find(p => p.id === clutch.pairingId);
          const eggsOfClutch = clutchEggs(clutch.id);
          const daysRemaining = clutch.expectedHatchDate ? getDaysRemaining(clutch.expectedHatchDate) : null;

          return (
            <div key={clutch.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('eggTracking.clutchLabel')}: {pairing ? `${maleLabel(pairing)} × ${femaleLabel(pairing)}` : '—'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {t('eggTracking.laidOn', { date: fmt(clutch.laidDate) })}
                    </div>
                    {clutch.expectedHatchDate && daysRemaining !== null && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${daysRemaining > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {daysRemaining > 0 ? t('eggTracking.daysRemaining', { count: daysRemaining }) : t('eggTracking.hatchingSoon')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => openEdit(clutch)}
                    aria-label={t('eggTracking.a11y.editClutch')}
                    title={t('common.edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    onClick={() => requestDelete(clutch.id)}
                    aria-label={t('eggTracking.a11y.deleteClutch')}
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <EggIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">{clutch.eggCount}</span>
                  </div>
                  <p className="text-sm text-gray-600">{t('eggTracking.stat.totalEggs')}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-900">{clutch.fertileCount || 0}</span>
                  </div>
                  <p className="text-sm text-green-700">{t('eggTracking.form.fertileCount')}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Thermometer className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-900">{clutch.incubationTemp}°C</span>
                  </div>
                  <p className="text-sm text-blue-700">{t('eggTracking.temperature')}</p>
                </div>

                <div className="bg-cyan-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Droplet className="h-5 w-5 text-cyan-600" />
                    <span className="text-2xl font-bold text-cyan-900">{clutch.incubationHumidity}%</span>
                  </div>
                  <p className="text-sm text-cyan-700">{t('eggTracking.humidity')}</p>
                </div>
              </div>

              {clutch.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-900">{clutch.notes}</p>
                </div>
              )}

              {/* Grille d’œufs */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">{t('eggTracking.individualEggs')}</h5>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {eggsOfClutch.map(egg => (
                    <button
                      key={egg.id}
                      type="button"
                      onClick={() => openEggEdit(egg)}
                      className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${statusColor(egg.status)}`}
                      aria-label={t('eggTracking.egg.aria', { n: egg.eggNumber, status: statusLabel(egg.status), weight: egg.weight == null ? '' : t('eggTracking.egg.weightSuffix', { w: egg.weight }) })}
                      title={t('eggTracking.egg.title', { n: egg.eggNumber })}
                    >
                      <span className="text-lg font-bold">{egg.eggNumber}</span>
                      <span className="text-[10px] leading-none mt-0.5">{statusLabel(egg.status)}</span>
                      {egg.weight != null && (
                        <span className="text-[10px] leading-none mt-0.5">{egg.weight} g</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded mr-2"></div>
                    <span className="text-gray-600">{t('eggTracking.status.incubating')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-200 border border-green-300 rounded mr-2"></div>
                    <span className="text-gray-600">{t('eggTracking.status.hatched')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded mr-2"></div>
                    <span className="text-gray-600">{t('eggTracking.status.infertile')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-200 border border-red-300 rounded mr-2"></div>
                    <span className="text-gray-600">{t('eggTracking.status.damaged')}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {clutches.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <EggIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('eggTracking.empty')}</p>
          <button
            onClick={openAdd}
            className="mt-4 text-green-600 hover:text-green-700 font-medium"
          >
            {t('eggTracking.createFirst')}
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {isEditing ? t('eggTracking.modal.editTitle') : t('eggTracking.modal.createTitle')}
            </h3>

            <form onSubmit={onSubmitClutch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.form.pairing')}</label>
                <select
                  value={form.pairingId}
                  onChange={e => setForm({ ...form, pairingId: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">{t('eggTracking.form.selectPairing')}</option>
                  {pairings.map(p => (
                    <option key={p.id} value={p.id}>
                      {getSnakeName(p.maleSnakeId)} × {getSnakeName(p.femaleSnakeId)}
                    </option>
                  ))}
                </select>
                {pairings.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {t('eggTracking.form.noPairingsHint')}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.form.laidDate')}</label>
                  <input
                    type="date"
                    value={form.laidDate}
                    onChange={(e) => {
                      const newLaid = e.target.value;
                      const newExpected = addDays(new Date(newLaid), 60).toISOString().split('T')[0];
                      setForm({ ...form, laidDate: newLaid, expectedHatchDate: newExpected });
                    }}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.form.expectedHatchDate')}</label>
                  <input
                    type="date"
                    value={form.expectedHatchDate}
                    onChange={(e) => setForm({ ...form, expectedHatchDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.form.eggCount')}</label>
                  <input
                    type="number"
                    min={0}
                    value={form.eggCount}
                    onChange={(e) => {
                      const eggCount = Math.max(0, Number(e.target.value));
                      const fertileCount = Math.min(form.fertileCount, eggCount);
                      setForm({ ...form, eggCount, fertileCount });
                    }}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.form.fertileCount')}</label>
                  <input
                    type="number"
                    min={0}
                    max={form.eggCount}
                    value={form.fertileCount}
                    onChange={(e) => setForm({ ...form, fertileCount: Math.min(Number(e.target.value), form.eggCount) })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.form.tempC')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.incubationTemp}
                    onChange={(e) => setForm({ ...form, incubationTemp: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.form.humidityPct')}</label>
                  <input
                    type="number"
                    step="1"
                    value={form.incubationHumidity}
                    onChange={(e) => setForm({ ...form, incubationHumidity: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.form.notes')}</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('eggTracking.form.notesPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  {isEditing ? t('common.update') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h4 className="text-lg font-semibold mb-2">{t('eggTracking.delete.title')}</h4>
            <p className="text-sm text-gray-600 mb-6">
              {t('eggTracking.delete.subtitle')}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelDelete} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={confirmDelete} className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {editingEgg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 relative">
            <button
              onClick={cancelEggEdit}
              className="absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('eggTracking.eggModal.title')}</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.eggModal.status')}</label>
                <select
                  value={editingEgg.status}
                  onChange={(e) => setEditingEgg({ ...editingEgg, status: e.target.value as EggStatus })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="incubating">{t('eggTracking.status.incubating')}</option>
                  <option value="hatched">{t('eggTracking.status.hatched')}</option>
                  <option value="infertile">{t('eggTracking.status.infertile')}</option>
                  <option value="damaged">{t('eggTracking.status.damaged')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('eggTracking.eggModal.weight')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingEgg.weight ?? ''}
                  onChange={(e) => setEditingEgg({ ...editingEgg, weight: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder={t('eggTracking.eggModal.weightPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={cancelEggEdit} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button onClick={saveEggEdit} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{t('common.save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EggTracking;
