// ContributePage.tsx — Version corrigée et épurée (Supabase)
// - Fix TDZ (ordre des hooks / états)
// - UI nettoyée (pas de blocs dupliqués, sections cohérentes)
// - Alerte doublons (catalog + recherche)
// - Édition/Suppression sur propositions en attente
// - Porte‑monnaie local + "Redeem" fiable (anti double comptage)

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { t } from 'i18next';
import {
  ArrowLeft,
  FilePlus2,
  ListChecks,
  Medal,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  Coins,
  BadgeCheck,
  Upload,
  X,
  Lock,
  Users,
  Edit3,
  Trash2,
  Sparkles,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Contribution,
  ContributionType,
  SpeciesOpt,
  fetchSpecies,
  fetchMyContributions,
  submitContribution,
  updateContribution,
  deleteContribution,
  fetchCatalog,
  CatalogItem,
  findDuplicatesForProposal,
  fetchWalletBalance,
  fetchRewardsLast30
} from '../lib/contribApi';

// ————————————————————————————————————————————————————————————————————————————
// Constantes
// ————————————————————————————————————————————————————————————————————————————

const REWARD_BY_TYPE: Record<ContributionType, number> = {
  species: 250,
  morph: 80,
  locality: 40,
  alias: 15,
  locus: 60,
  group: 50,
};

const COIN_RULES = {
  stake: { defaultDeposit: 10 },
  initialGrant: 50,
} as const;

const FALLBACK_SPECIES: SpeciesOpt[] = [
  { id: 'python-regius', label: 'Ball Python', latin: 'Python regius' },
  { id: 'pantherophis-guttatus', label: 'Corn Snake', latin: 'Pantherophis guttatus' },
  { id: 'morelia-viridis', label: 'Green Tree Python', latin: 'Morelia viridis' },
];

const MAX_IMAGES = 8;
const MAX_IMAGE_MB = 4;

// ————————————————————————————————————————————————————————————————————————————
// Petites briques UI
// ————————————————————————————————————————————————————————————————————————————

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

const Thumbs: React.FC<{ images: string[]; onRemove?: (idx: number) => void }> = ({ images, onRemove }) => {
  if (!images?.length) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {images.map((src, idx) => (
        <div key={idx} className="relative group border rounded-lg overflow-hidden">
          <img src={src} alt={`proof-${idx}`} className="w-full h-24 object-cover" />
          {!!onRemove && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute top-1 right-1 bg-white/90 border rounded-full p-1 shadow hidden group-hover:block"
              aria-label={t('contribute.photo.delete', { defaultValue: 'Supprimer' })}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const StatusBadge: React.FC<{ status: 'pending'|'approved'|'rejected' }> = ({ status }) => {
  const map = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  } as const;
  const label = {
    pending: t('contribute.status.pending', { defaultValue: 'En attente' }),
    approved: t('contribute.status.approved', { defaultValue: 'Validé' }),
    rejected: t('contribute.status.rejected', { defaultValue: 'Refusé' }),
  } as const;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status]}`}>{label[status]}</span>;
};

// ————————————————————————————————————————————————————————————————————————————
// Page
// ————————————————————————————————————————————————————————————————————————————

const ContributePage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // États de base — déclarés AVANT tout calcul qui en dépend (évite TDZ)
  const [species, setSpecies] = useState<SpeciesOpt[]>(FALLBACK_SPECIES);
  const [submissions, setSubmissions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<'propose'|'mine'|'leaderboard'|'about'>('propose');
  const [type, setType] = useState<ContributionType>('morph');
  const [speciesId, setSpeciesId] = useState<string>('');
  const [name, setName] = useState('');
  const [genType, setGenType] = useState<'recessive'|'incomplete'|'dominant'|''>('');
  const [aliases, setAliases] = useState('');
  const [notes, setNotes] = useState('');
  const [references, setReferences] = useState('');
  const [latin, setLatin] = useState('');
  const [commonNames, setCommonNames] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Catalogue pour anti‑doublons
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogQ, setCatalogQ] = useState('');

  // Édition
  const [editing, setEditing] = useState<Contribution | null>(null);
  const [eType, setEType] = useState<ContributionType>('morph');
  const [eSpeciesId, setESpeciesId] = useState<string>('python-regius');
  const [eName, setEName] = useState('');
  const [eGenType, setEGenType] = useState<'recessive'|'incomplete'|'dominant'|''>('');
  const [eAliases, setEAliases] = useState('');
  const [eNotes, setENotes] = useState('');
  const [eReferences, setEReferences] = useState('');
  const [eLatin, setELatin] = useState('');
  const [eCommonNames, setECommonNames] = useState('');
  const [eImages, setEImages] = useState<string[]>([]);

  const [wallet, setWallet] = useState<number>(0);
  const [rewards30, setRewards30] = useState<number>(0);

  const refreshWalletAndStats = useCallback(async () => {
    if (!user?.id) { setWallet(0); setRewards30(0); return; }

    await ensureInitialWallet(user.id);
    
    const [bal, r30] = await Promise.all([
      fetchWalletBalance(user.id),
      fetchRewardsLast30(user.id),
    ]);
    setWallet(bal);
    setRewards30(r30);
  }, [user?.id]);

  useEffect(() => {
    void refreshWalletAndStats();
  }, [refreshWalletAndStats]);

  // ——————————————————————————————————————————————————
  // Effets
  // ——————————————————————————————————————————————————

  // Charger espèces + mes contributions
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const [sp, mine] = await Promise.all([
          fetchSpecies().catch(() => FALLBACK_SPECIES),
          user?.id ? fetchMyContributions(user.id) : Promise.resolve([]),
        ]);
        if (abort) return;
        const finalSpecies = sp?.length ? sp : FALLBACK_SPECIES;
        setSpecies(finalSpecies);
        setSubmissions(mine);
        // si aucune espèce sélectionnée, prendre la première
        if (!speciesId && finalSpecies[0]?.id) setSpeciesId(finalSpecies[0].id);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [user?.id]);

  // Charger le catalogue dépendant du type / espèce pour anti‑doublon
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const list = await fetchCatalog(type, type === 'species' ? null : (speciesId || null));
        if (!abort) setCatalog(list || []);
      } catch {
        if (!abort) setCatalog([]);
      }
    })();
    return () => { abort = true; };
  }, [type, speciesId]);

  // ——————————————————————————————————————————————————
  // Sélecteurs / dérivés
  // ——————————————————————————————————————————————————

  const mySubs = useMemo(() => submissions, [submissions]);
  const approvedCoins = useMemo(
    () => mySubs.filter(s => s.status === 'approved').reduce((acc, s) => acc + (s.reward || 0), 0),
    [mySubs]
  );
  const lockedStake = useMemo(
    () => mySubs.filter(s => s.stakeStatus === 'locked').reduce((acc, s) => acc + (s.stake || 0), 0),
    [mySubs]
  );
  const rewardForCurrent = REWARD_BY_TYPE[type];

  const currentAliases = aliases.split(',').map(a => a.trim()).filter(Boolean);
  const dupMatches = useMemo(
    () => findDuplicatesForProposal({
      type,
      speciesId: type === 'species' ? null : (speciesId || null),
      name: type === 'species' ? undefined : name,
      latin: type === 'species' ? latin : undefined,
      aliases: currentAliases,
    }, catalog),
    [type, speciesId, name, latin, aliases, catalog]
  );

  // ——————————————————————————————————————————————————
  // Handlers
  // ——————————————————————————————————————————————————

  const readFilesAsDataUrls = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        alert(`Image trop lourde (> ${MAX_IMAGE_MB} Mo): ${file.name}`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = String(e.target?.result || '');
        setImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          if (prev.includes(url)) return prev;
          return [...prev, url];
        });
      };
      reader.readAsDataURL(file);
    });
  };
  const onRemoveImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setName(''); setGenType(''); setAliases(''); setNotes(''); setReferences('');
    setLatin(''); setCommonNames(''); setImages([]);
  };

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!user?.id) { alert(t('contribute.errors.loginRequired', { defaultValue: 'Connecte‑toi pour proposer une contribution.' })); return; }
    if (type !== 'species' && !speciesId) { alert(t('contribute.errors.speciesRequired', { defaultValue: 'Sélectionne une espèce.' })); return; }
    if (type === 'species' && !latin.trim()) { alert(t('contribute.errors.latinRequired', { defaultValue: 'Le nom latin est requis.' })); return; }
    if ([ 'morph','locality','alias','locus','group' ].includes(type) && !name.trim()) { alert(t('contribute.errors.nameRequired', { defaultValue: 'Le nom est requis.' })); return; }
    if ((type === 'morph' || type === 'locus') && !genType) { alert(t('contribute.errors.genTypeRequired', { defaultValue: 'Sélectionne le type génétique.' })); return; }

    if (dupMatches.length) {
      alert(t('contribute.errors.duplicate', { defaultValue: 'Cette entrée existe déjà. Merci de vérifier pour éviter les doublons.' }));
      return;
    }

    const deposit = COIN_RULES.stake.defaultDeposit;
    if (deposit > 0) {
      if (wallet < deposit) {
        alert(t('contribute.errors.notEnoughStake', { defaultValue: 'Solde insuffisant pour soumettre.' }));
        return;
      }
    }

    const payload: Record<string, any> = {
      name: name.trim() || undefined,
      genType: genType || undefined,
      aliases: aliases.split(',').map(a=>a.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
      references: references.split(',').map(u=>u.trim()).filter(Boolean),
      images,
    };
    if (type === 'species') {
      payload['latin'] = latin.trim();
      payload['commonNames'] = commonNames.split(',').map(n=>n.trim()).filter(Boolean);
    }

    try {
      const inserted = await submitContribution(user.id, {
        type,
        speciesId: type === 'species' ? null : speciesId,
        payload,
        reward: rewardForCurrent,
        stake: deposit,
      });
      setSubmissions((prev) => [inserted, ...prev]);
      resetForm();
      setTab('mine');
      await refreshWalletAndStats();
    } catch (err: any) {
      alert(err?.message || t('contribute.errors.submitFailed', { defaultValue: 'Erreur lors de la soumission.' }));
    }
  };

  const openEdit = (s: Contribution) => {
    setEditing(s);
    setEType(s.type);
    setESpeciesId(s.speciesId || speciesId || 'python-regius');
    setEName(s.payload?.name || '');
    setEGenType((s.payload?.genType as any) || '');
    setEAliases((s.payload?.aliases || []).join(', '));
    setENotes(s.payload?.notes || '');
    setEReferences((s.payload?.references || []).join(', '));
    setELatin(s.payload?.latin || '');
    setECommonNames((s.payload?.commonNames || []).join(', '));
    setEImages(s.payload?.images || []);
  };

  const removeEditImage = (idx: number) => setEImages((prev) => prev.filter((_, i) => i !== idx));
  const editReadFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) { alert(`Image trop lourde (> ${MAX_IMAGE_MB} Mo): ${file.name}`); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = String(e.target?.result || '');
        setEImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          if (prev.includes(url)) return prev;
          return [...prev, url];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const saveEdit: React.FormEventHandler = async (ev) => {
    ev.preventDefault();
    if (!editing) return;
    if (eType !== 'species' && !eSpeciesId) { alert(t('contribute.errors.speciesRequired', { defaultValue: 'Sélectionne une espèce.' })); return; }
    if (eType === 'species' && !eLatin.trim()) { alert(t('contribute.errors.latinRequired', { defaultValue: 'Le nom latin est requis.' })); return; }
    if ([ 'morph','locality','alias','locus','group' ].includes(eType) && !eName.trim()) { alert(t('contribute.errors.nameRequired', { defaultValue: 'Le nom est requis.' })); return; }
    if ((eType === 'morph' || eType === 'locus') && !eGenType) { alert(t('contribute.errors.genTypeRequired', { defaultValue: 'Sélectionne le type génétique.' })); return; }

    const payload: Record<string, any> = {
      name: eName.trim() || undefined,
      genType: eGenType || undefined,
      aliases: eAliases.split(',').map(a=>a.trim()).filter(Boolean),
      notes: eNotes.trim() || undefined,
      references: eReferences.split(',').map(u=>u.trim()).filter(Boolean),
      images: eImages,
    };
    if (eType === 'species') {
      payload['latin'] = eLatin.trim();
      payload['commonNames'] = eCommonNames.split(',').map(n=>n.trim()).filter(Boolean);
    }

    try {
      const updated = await updateContribution(editing.id, {
        type: eType,
        species_id: eType === 'species' ? null : eSpeciesId,
        payload,
      });
      setSubmissions((prev) => prev.map(x => x.id === updated.id ? updated : x));
      setEditing(null);
    } catch (err: any) {
      alert(err?.message || t('contribute.errors.updateFailed', { defaultValue: 'Erreur lors de la mise à jour.' }));
    }
  };

  const deleteSubmission = async (s: Contribution) => {
    if (s.status !== 'pending') { alert(t('contribute.errors.deleteOnlyPending', { defaultValue: 'Seules les propositions en attente peuvent être supprimées.' })); return; }
    if (!confirm(t('contribute.confirm.delete', { defaultValue: 'Supprimer définitivement cette proposition ?' }))) return;
    try {
      await deleteContribution(s.id);
      setSubmissions(prev => prev.filter(x => x.id !== s.id));
    } catch (err: any) {
      alert(err?.message || t('contribute.errors.deleteFailed', { defaultValue: 'Suppression impossible.' }));
    }
  };

  // ——————————————————————————————————————————————————
  // Rendu
  // ——————————————————————————————————————————————————

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-green-600 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.contribute.title', { defaultValue: 'Contributions' })}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro + Wallet */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-start gap-4">
              <Lightbulb className="h-10 w-10 text-amber-500" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{t('dashboard.contribute.subtitle', { defaultValue: 'Participe à la base de connaissances' })}</h2>
                <p className="text-gray-600">{t('dashboard.contribute.description', { defaultValue: 'Propose des espèces, morphs, locus (gènes), groupes allélique, localités ou alias documentés.' })}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <FilePlus2 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">{t('contribute.steps.propose.title', { defaultValue: 'Proposer' })}</h3>
                <p className="text-sm text-gray-600">{t('contribute.steps.propose.text', { defaultValue: 'Décris précisément ta proposition avec sources.' })}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="text-lg font-semibold">{t('contribute.steps.moderation.title', { defaultValue: 'Modération' })}</h3>
                <p className="text-sm text-gray-600">{t('contribute.steps.moderation.text', { defaultValue: 'Notre équipe vérifie les doublons et la cohérence.' })}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <Coins className="h-5 w-5" />
                <h3 className="text-lg font-semibold">{t('contribute.steps.reward.title', { defaultValue: 'Récompense' })}</h3>
                <p className="text-sm text-gray-600">{t('contribute.steps.reward.text', { defaultValue: 'Gagne des coins si ta proposition est validée.' })}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-bold">{t('contribute.wallet.title', { defaultValue: 'Porte-monnaie' })}</h3>
            </div>

            <div className="mt-4">
              <p className="text-4xl font-extrabold text-gray-900">{wallet}</p>
              <p className="text-sm text-gray-500">{t('contribute.wallet.balance', { defaultValue: 'Solde actuel (⟡)' })}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <BadgeCheck className="h-5 w-5 text-green-600" />
                <p className="text-sm mt-1 text-gray-700">
                  <span className="font-semibold">{rewards30}</span> {t('contribute.wallet.receivedLast30', { defaultValue: 'Écailles reçues (30 jours)' })}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Lock className="h-5 w-5 text-amber-600" />
                <p className="text-sm mt-1 text-gray-700">
                  <span className="font-semibold">{lockedStake}</span> {t('contribute.wallet.stakeLocked', { defaultValue: 'stake actuellement bloqué' })}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="border-b px-4 sm:px-6">
            <nav className="flex flex-wrap gap-4">
              {[
                { id: 'propose', label: t('contribute.tabs.propose', { defaultValue: 'Proposer' }), icon: FilePlus2 },
                { id: 'mine', label: t('contribute.tabs.mine', { defaultValue: 'Mes propositions' }), icon: ListChecks },
                { id: 'leaderboard', label: t('contribute.tabs.leaderboard', { defaultValue: 'Leaderboard' }), icon: Medal },
                { id: 'about', label: t('contribute.tabs.about', { defaultValue: 'À propos' }), icon: HelpCircle },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id}
                  onClick={() => setTab(id as any)}
                  className={`flex items-center gap-2 py-3 border-b-2 -mb-[1px] ${tab===id ? 'text-green-600 border-green-600' : 'text-gray-600 border-transparent hover:text-gray-800'}`}>
                  <Icon className="h-5 w-5" /><span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* ——————————————————— PROPOSER ——————————————————— */}
            {tab === 'propose' && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Formulaire */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-bold mb-3">{t('contribute.form.title', { defaultValue: 'Nouvelle proposition' })}</h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type + Espèce */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('contribute.form.typeLabel', { defaultValue: 'Type' })}</label>
                        <select className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={type} onChange={(e)=>setType(e.target.value as ContributionType)}>
                          <option value="morph">{t('contribute.form.typeOptions.morph', { defaultValue: 'Morph (phénotype commercial)' })}</option>
                          <option value="locus">{t('contribute.form.typeOptions.locus', { defaultValue: 'Locus / gène (symbole)' })}</option>
                          <option value="group">{t('contribute.form.typeOptions.group', { defaultValue: 'Groupe allélique' })}</option>
                          <option value="locality">{t('contribute.form.typeOptions.locality', { defaultValue: 'Localité' })}</option>
                          <option value="alias">{t('contribute.form.typeOptions.alias', { defaultValue: 'Alias' })}</option>
                          <option value="species">{t('contribute.form.typeOptions.species', { defaultValue: 'Espèce' })}</option>
                        </select>
                      </div>
                      {type !== 'species' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">{t('contribute.form.speciesLabel', { defaultValue: 'Espèce' })}</label>
                          <select className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={speciesId} onChange={(e)=>setSpeciesId(e.target.value)}>
                            {species.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Champs dynamiques */}
                    {type === 'species' ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">{t('contribute.form.latinNameLabel', { defaultValue: 'Nom latin' })}</label>
                          <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={latin} onChange={(e)=>setLatin(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">{t('contribute.form.commonNamesLabel', { defaultValue: 'Noms communs (séparés par des virgules)' })}</label>
                          <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={commonNames} onChange={(e)=>setCommonNames(e.target.value)} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">{t('contribute.form.proposedNameLabel', { defaultValue: 'Nom proposé' })}</label>
                          <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={name} onChange={(e)=>setName(e.target.value)} />
                        </div>
                        {(type === 'morph' || type === 'locus') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('contribute.form.geneticTypeLabel', { defaultValue: 'Type génétique' })}</label>
                            <select className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={genType} onChange={(e)=>setGenType(e.target.value as any)}>
                              <option value="">{t('contribute.form.geneticTypePlaceholder', { defaultValue: '— Sélectionner —' })}</option>
                              <option value="recessive">{t('contribute.form.geneticTypeRecessive', { defaultValue: 'Récessif' })}</option>
                              <option value="incomplete">{t('contribute.form.geneticTypeIncomplete', { defaultValue: 'Incomplet (codominant)' })}</option>
                              <option value="dominant">{t('contribute.form.geneticTypeDominant', { defaultValue: 'Dominant' })}</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Métadonnées communes */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('contribute.form.aliasesLabel', { defaultValue: 'Alias (séparés par des virgules)' })}</label>
                        <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={aliases} onChange={(e)=>setAliases(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('contribute.form.referencesLabel', { defaultValue: 'Références (URLs, séparées par des virgules)' })}</label>
                        <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" placeholder="https://…, https://…" value={references} onChange={(e)=>setReferences(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('contribute.form.notesLabel', { defaultValue: 'Notes' })}</label>
                      <textarea rows={4} className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={notes} onChange={(e)=>setNotes(e.target.value)} />
                    </div>

                    {/* Photos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('contribute.form.photosLabel', { defaultValue: 'Photos (optionnel)' })}</label>
                      <div className="mt-1 flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <Upload className="h-4 w-4" /><span className="text-sm">{t('contribute.form.photosUploadLabel', { defaultValue: 'Ajouter des photos' })}</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={(ev) => {
                            const files = (ev.target as HTMLInputElement).files;
                            if (files) readFilesAsDataUrls(files);
                            (ev.target as HTMLInputElement).value = '';
                          }}/>
                        </label>
                        <span className="text-xs text-gray-500">{t('contribute.form.photosUploadInfo', { defaultValue: 'Max {{maxImages}} images • {{maxSize}} Mo / image', maxImages: MAX_IMAGES, maxSize: MAX_IMAGE_MB })}</span>
                      </div>
                      <div className="mt-2"><Thumbs images={images} onRemove={onRemoveImage} /></div>
                    </div>

                    {/* Anti‑doublon + Submit */}
                    <div className="flex flex-col gap-4">
                      {/* Barre de recherche + liste */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            {type === 'species'
                              ? t('contribute.catalog.speciesTitle', { defaultValue: 'Espèces existantes' })
                              : t('contribute.catalog.itemsForSpecies', { defaultValue: 'Éléments existants pour cette espèce' })}
                            <span className="ml-2 text-gray-500 font-normal">({catalog.length})</span>
                          </div>
                          <input
                            value={catalogQ}
                            onChange={(e)=>setCatalogQ(e.target.value)}
                            placeholder={t('contribute.catalog.search', { defaultValue: 'Rechercher…' })}
                            className="text-sm border rounded-md px-2 py-1"
                          />
                        </div>
                        <div className="max-h-48 overflow-auto divide-y">
                          {catalog
                            .filter(c => {
                              const q = catalogQ.toLowerCase();
                              if (!q) return true;
                              const hay = [c.name, c.latin || '', ...(c.aliases||[])].join(' ').toLowerCase();
                              return hay.includes(q);
                            })
                            .slice(0, 60)
                            .map(c => (
                              <div key={c.id} className="py-1.5 text-sm">
                                <div className="font-medium text-gray-900">{c.name}{c.latin ? <span className="text-gray-500"> — {c.latin}</span> : null}</div>
                                {c.aliases?.length ? <div className="text-xs text-gray-600">{t('contribute.catalog.aliases', { defaultValue: 'alias' })}: {c.aliases.slice(0,6).join(', ')}{c.aliases.length>6 ? '…' : ''}</div> : null}
                              </div>
                            ))}
                          {!catalog.length && (
                            <div className="text-sm text-gray-500">{t('contribute.catalog.empty', { defaultValue: 'Aucun élément existant pour l’instant.' })}</div>
                          )}
                        </div>
                      </div>

                      {dupMatches.length > 0 && (
                        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-3">
                          {t('contribute.catalog.duplicateWarning', { defaultValue: 'Potentiel doublon détecté. Vérifie avant de soumettre :'} as any)} ({dupMatches.length})
                          <ul className="list-disc pl-5 mt-1">
                            {dupMatches.slice(0, 3).map(d => (
                              <li key={d.id}><strong>{d.name}</strong>{d.latin ? ` — ${d.latin}` : ''}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 space-y-0.5">
                          <div>{t('contribute.form.estimatedReward', { defaultValue: 'Récompense estimée' })}: <span className="font-semibold">{rewardForCurrent} ⟡</span></div>
                          <div className="text-amber-700">{t('contribute.form.stakeRequired', { defaultValue: 'Stake requis' })}: <span className="font-semibold">{COIN_RULES.stake.defaultDeposit} ⟡</span></div>
                        </div>
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold">{t('contribute.form.submitProposal', { defaultValue: 'Soumettre' })}</button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Panneau latéral */}
                <div>
                  <h3 className="text-lg font-bold mb-3">{t('contribute.form.rewardsTitle', { defaultValue: 'Barème des récompenses' })}</h3>
                  <ul className="space-y-2">
                    {[
                      ['species','Nouvelle espèce'],
                      ['morph','Nouveau morph (confirmé)'],
                      ['locus','Nouveau locus (gène)'],
                      ['group','Nouveau groupe allélique'],
                      ['locality','Nouvelle localité'],
                      ['alias','Alias pertinent/documenté'],
                    ].map(([key, label]) => (
                      <li key={key} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-gray-700">{label}</span>
                        <span className="font-semibold">{REWARD_BY_TYPE[key as keyof typeof REWARD_BY_TYPE]} ⟡</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">{t('contribute.form.adviceTitle', { defaultValue: 'Conseils' })}</p>
                        <p className="text-sm text-blue-800">{t('contribute.form.adviceDescription', { defaultValue: 'Donne des sources, évite les doublons, distingue bien “morph” (phénotype) et “locus” (gène/symbole).' })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ——————————————————— MES PROPOSITIONS ——————————————————— */}
            {tab === 'mine' && (
              <div>
                <h3 className="text-lg font-bold mb-4">{t('contribute.form.myProposals', { defaultValue: 'Mes propositions' })}</h3>
                {!loading && mySubs.length === 0 ? (
                  <div className="text-center py-12">
                    <FilePlus2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">{t('contribute.form.noProposals', { defaultValue: 'Aucune proposition pour le moment.' })}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-4">{t('contribute.form.date', { defaultValue: 'Date' })}</th>
                          <th className="py-2 pr-4">{t('contribute.form.type', { defaultValue: 'Type' })}</th>
                          <th className="py-2 pr-4">{t('contribute.form.species', { defaultValue: 'Espèce' })}</th>
                          <th className="py-2 pr-4">{t('contribute.form.content', { defaultValue: 'Contenu' })}</th>
                          <th className="py-2 pr-4">{t('contribute.form.status', { defaultValue: 'Statut' })}</th>
                          <th className="py-2 pr-4 text-right">{t('contribute.form.reward', { defaultValue: 'Récompense' })}</th>
                          <th className="py-2 pr-4 text-right">{t('contribute.form.actions', { defaultValue: 'Actions' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mySubs.map((s) => (
                          <tr key={s.id} className="border-b last:border-none align-top">
                            <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                            <td className="py-2 pr-4 capitalize whitespace-nowrap">{s.type}</td>
                            <td className="py-2 pr-4 whitespace-nowrap">{s.type === 'species' ? '—' : (species.find(sp => sp.id === s.speciesId)?.label || s.speciesId)}</td>
                            <td className="py-2 pr-4">
                              <div className="text-gray-900 font-medium">{s.payload?.name || s.payload?.latin || '—'}</div>
                              {!!(s.payload?.images?.length) && (
                                <div className="mt-2">
                                  <Thumbs images={s.payload.images.slice(0, 3)} />
                                  {s.payload.images.length > 3 && (
                                    <div className="text-xs text-gray-500 mt-1">+ {s.payload.images.length - 3} {t('contribute.form.otherPhotos', { defaultValue: 'autres' })}</div>
                                  )}
                                </div>
                              )}
                              {!!s.stake && (
                                <div className="text-xs text-amber-700 mt-1">
                                  {t('contribute.form.stake', { defaultValue: 'Stake' })}: {s.stake} ⟡ — {s.stakeStatus === 'locked' ? t('contribute.form.locked', { defaultValue: 'bloqué' }) : t('contribute.form.released', { defaultValue: 'libéré' })}
                                </div>
                              )}
                            </td>
                            <td className="py-2 pr-4"><StatusBadge status={s.status} /></td>
                            <td className="py-2 pr-4 text-right">{s.reward || 0}</td>
                            <td className="py-2 pr-4 text-right whitespace-nowrap">
                              {s.status === 'pending' && (
                                <div className="inline-flex gap-2">
                                  <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50">
                                    <Edit3 className="h-4 w-4" /> {t('contribute.form.edit', { defaultValue: 'Éditer' })}
                                  </button>
                                  <button onClick={() => deleteSubmission(s)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-rose-50 text-rose-700 border-rose-200">
                                    <Trash2 className="h-4 w-4" /> {t('contribute.form.delete', { defaultValue: 'Supprimer' })}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ——————————————————— LEADERBOARD ——————————————————— */}
            {tab === 'leaderboard' && (
              <div className="space-y-2">
                <h3 className="text-lg font-bold">{t('contribute.leaderboard.title', { defaultValue: 'Contributeurs en tête' })}</h3>
                <p className="text-gray-600 text-sm">{t('contribute.leaderboard.soon', { defaultValue: 'Bientôt disponible.' })}</p>
              </div>
            )}

            {/* ——————————————————— ABOUT ——————————————————— */}
            {tab === 'about' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold">{t('contribute.about.title', { defaultValue: 'À propos des contributions' })}</h3>
                <p className="text-gray-700 text-sm">
                  {t('contribute.about.text', {
                    defaultValue: '“Morph” correspond au phénotype/commercial name (ex. Banana), tandis que “Locus” désigne le gène/symbole (ex. T+ Albino). Le “Groupe allélique” relie des locus incompatibles. Les alias doivent pointer vers des références fiables.'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ——————————————————— MODALE ÉDITION ——————————————————— */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-bold">{t('contribute.form.editProposal', { defaultValue: 'Éditer la proposition' })}</h4>
              <button onClick={()=>setEditing(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="mt-4 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('contribute.form.typeLabel', { defaultValue: 'Type' })}</label>
                  <select className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eType} onChange={(e)=>setEType(e.target.value as ContributionType)}>
                    <option value="morph">{t('contribute.form.typeOptions.morph', { defaultValue: 'Morph' })}</option>
                    <option value="locus">{t('contribute.form.typeOptions.locus', { defaultValue: 'Locus' })}</option>
                    <option value="group">{t('contribute.form.typeOptions.group', { defaultValue: 'Groupe allélique' })}</option>
                    <option value="locality">{t('contribute.form.typeOptions.locality', { defaultValue: 'Localité' })}</option>
                    <option value="alias">{t('contribute.form.typeOptions.alias', { defaultValue: 'Alias' })}</option>
                    <option value="species">{t('contribute.form.typeOptions.species', { defaultValue: 'Espèce' })}</option>
                  </select>
                </div>
                {eType !== 'species' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('contribute.form.speciesLabel', { defaultValue: 'Espèce' })}</label>
                    <select className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eSpeciesId} onChange={(e)=>setESpeciesId(e.target.value)}>
                      {species.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {eType === 'species' ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('contribute.form.latinNameLabel', { defaultValue: 'Nom latin' })}</label>
                    <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eLatin} onChange={(e)=>setELatin(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('contribute.form.commonNamesLabel', { defaultValue: 'Noms communs' })}</label>
                    <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eCommonNames} onChange={(e)=>setECommonNames(e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('contribute.form.proposedNameLabel', { defaultValue: 'Nom proposé' })}</label>
                    <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eName} onChange={(e)=>setEName(e.target.value)} />
                  </div>
                  {(eType === 'morph' || eType === 'locus') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('contribute.form.geneticTypeLabel', { defaultValue: 'Type génétique' })}</label>
                      <select className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eGenType} onChange={(e)=>setEGenType(e.target.value as any)}>
                        <option value="">{t('contribute.form.geneticTypePlaceholder', { defaultValue: '— Sélectionner —' })}</option>
                        <option value="recessive">{t('contribute.form.geneticTypeRecessive', { defaultValue: 'Récessif' })}</option>
                        <option value="incomplete">{t('contribute.form.geneticTypeIncomplete', { defaultValue: 'Incomplet (codominant)' })}</option>
                        <option value="dominant">{t('contribute.form.geneticTypeDominant', { defaultValue: 'Dominant' })}</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('contribute.form.aliasesLabel', { defaultValue: 'Alias' })}</label>
                  <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eAliases} onChange={(e)=>setEAliases(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('contribute.form.referencesLabel', { defaultValue: 'Références' })}</label>
                  <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eReferences} onChange={(e)=>setEReferences(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t('contribute.form.notesLabel', { defaultValue: 'Notes' })}</label>
                <textarea rows={4} className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eNotes} onChange={(e)=>setENotes(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t('contribute.form.photosLabel', { defaultValue: 'Photos' })}</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="h-4 w-4" /><span className="text-sm">{t('contribute.form.photosUploadLabel', { defaultValue: 'Ajouter des photos' })}</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(ev) => {
                      const files = (ev.target as HTMLInputElement).files;
                      if (files) editReadFiles(files);
                      (ev.target as HTMLInputElement).value = '';
                    }}/>
                  </label>
                  <span className="text-xs text-gray-500">{t('contribute.form.photosUploadInfo', { defaultValue: 'Max {{maxImages}} images • {{maxSize}} Mo / image', maxImages: MAX_IMAGES, maxSize: MAX_IMAGE_MB })}</span>
                </div>
                <div className="mt-2"><Thumbs images={eImages} onRemove={removeEditImage} /></div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={()=>setEditing(null)} className="px-4 py-2 rounded-lg border">{t('common.cancel', { defaultValue: 'Annuler' })}</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white">{t('common.save', { defaultValue: 'Enregistrer' })}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributePage;
