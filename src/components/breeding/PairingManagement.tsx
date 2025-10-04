import React, { useState, useEffect } from 'react';
import { Heart, Plus, Pencil, Trash2, Calendar, X } from 'lucide-react';
import { Pairing, Snake } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

type FormState = {
  maleSnakeId: string;
  femaleSnakeId: string;
  pairingDate: string;
  status: Pairing['status'];
  notes: string;
};

const STORAGE_KEY_PREFIX = 'pairings_by_user_';

const PairingManagement = () => {
  const { user } = useAuth();
  const storageKey = `${STORAGE_KEY_PREFIX}${user?.id || 'anonymous'}`;

  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormState>({
    maleSnakeId: '',
    femaleSnakeId: '',
    pairingDate: new Date().toISOString().split('T')[0],
    status: 'planned' as Pairing['status'],
    notes: ''
  });

  useEffect(() => {
    const mockSnakes: Snake[] = [
      {
        id: '1',
        name: 'Luna',
        species: 'Ball Python',
        morph: 'Pastel',
        sex: 'Female',
        birthDate: '2022-03-15',
        weight: 1200,
        length: 120,
        userId: user?.id || ''
      },
      {
        id: '2',
        name: 'Thor',
        species: 'Ball Python',
        morph: 'Anery',
        sex: 'Male',
        birthDate: '2021-08-20',
        weight: 800,
        length: 95,
        userId: user?.id || ''
      }
    ];
    setSnakes(mockSnakes);
  }, [user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Pairing[];
        setPairings(parsed);
        return;
      }
    } catch {}

    const mockPairings: Pairing[] = [
      {
        id: '1',
        maleSnakeId: '2',
        femaleSnakeId: '1',
        pairingDate: '2025-01-15',
        status: 'active',
        notes: "Première tentative d'accouplement",
        userId: user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setPairings(mockPairings);
  }, [storageKey, user]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(pairings));
    } catch {}
  }, [pairings, storageKey]);

  const resetForm = () => {
    setFormData({
      maleSnakeId: '',
      femaleSnakeId: '',
      pairingDate: new Date().toISOString().split('T')[0],
      status: 'planned',
      notes: ''
    });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (p: Pairing) => {
    setIsEditing(true);
    setEditingId(p.id);
    setFormData({
      maleSnakeId: p.maleSnakeId,
      femaleSnakeId: p.femaleSnakeId,
      pairingDate: p.pairingDate,
      status: p.status,
      notes: p.notes || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  };

  const getSnakeName = (id: string) => snakes.find(s => s.id === id)?.name || 'Unknown';
  const getSnakeMorph = (id: string) => snakes.find(s => s.id === id)?.morph || '';

  const getStatusColor = (status: Pairing['status']) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'separated': return 'bg-yellow-100 text-yellow-800';
      case 'successful': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Pairing['status']) => {
    switch (status) {
      case 'planned': return 'Planifié';
      case 'active': return 'En cours';
      case 'separated': return 'Séparés';
      case 'successful': return 'Réussi';
      case 'failed': return 'Échec';
      default: return status;
    }
  };

  const maleSnakes = snakes.filter(s => s.sex === 'Male');
  const femaleSnakes = snakes.filter(s => s.sex === 'Female');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.maleSnakeId || !formData.femaleSnakeId) return;
    if (formData.maleSnakeId === formData.femaleSnakeId) {
      alert('Le mâle et la femelle ne peuvent pas être le même serpent.');
      return;
    }

    if (isEditing && editingId) {
      setPairings(prev =>
        prev.map(p =>
          p.id === editingId
            ? {
                ...p,
                ...formData,
                updatedAt: new Date().toISOString()
              }
            : p
        )
      );
    } else {
      const newPairing: Pairing = {
        id: Date.now().toString(),
        ...formData,
        userId: user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setPairings(prev => [newPairing, ...prev]);
    }

    closeModal();
  };

  const requestDelete = (id: string) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);
  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    setPairings(prev => prev.filter(p => p.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Gestion des Pairings</h3>
          <p className="text-gray-600 mt-1">Suivez vos accouplements et leur progrès</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Pairing
        </button>
      </div>

      <div className="grid gap-4">
        {pairings.map(pairing => (
          <div key={pairing.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-4">
                <Heart className="h-6 w-6 text-pink-500" />
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-semibold text-blue-600">
                      {getSnakeName(pairing.maleSnakeId)} ({getSnakeMorph(pairing.maleSnakeId)})
                    </span>
                    <span className="text-gray-400">×</span>
                    <span className="font-semibold text-pink-600">
                      {getSnakeName(pairing.femaleSnakeId)} ({getSnakeMorph(pairing.femaleSnakeId)})
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(pairing.pairingDate), 'dd MMM yyyy')}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pairing.status)}`}>
                      {getStatusLabel(pairing.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => openEditModal(pairing)}
                  aria-label="Modifier"
                  title="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  onClick={() => requestDelete(pairing.id)}
                  aria-label="Supprimer"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {pairing.notes && (
              <p className="text-sm text-gray-600 mt-2 pl-10">{pairing.notes}</p>
            )}
          </div>
        ))}
      </div>

      {pairings.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun pairing enregistré</p>
          <button
            onClick={openAddModal}
            className="mt-4 text-green-600 hover:text-green-700 font-medium"
          >
            Créer votre premier pairing
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100"
              aria-label="Fermer"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {isEditing ? 'Modifier le Pairing' : 'Nouveau Pairing'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mâle
                  </label>
                  <select
                    value={formData.maleSnakeId}
                    onChange={(e) => setFormData({ ...formData, maleSnakeId: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un mâle…</option>
                    {maleSnakes.map(snake => (
                      <option key={snake.id} value={snake.id}>
                        {snake.name} - {snake.morph}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Femelle
                  </label>
                  <select
                    value={formData.femaleSnakeId}
                    onChange={(e) => setFormData({ ...formData, femaleSnakeId: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner une femelle…</option>
                    {femaleSnakes.map(snake => (
                      <option key={snake.id} value={snake.id}>
                        {snake.name} - {snake.morph}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d’accouplement
                  </label>
                  <input
                    type="date"
                    value={formData.pairingDate}
                    onChange={(e) => setFormData({ ...formData, pairingDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Pairing['status'] })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="planned">Planifié</option>
                    <option value="active">En cours</option>
                    <option value="separated">Séparés</option>
                    <option value="successful">Réussi</option>
                    <option value="failed">Échec</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Observations, comportements, etc…"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h4 className="text-lg font-semibold mb-2">Supprimer ce pairing ?</h4>
            <p className="text-sm text-gray-600 mb-6">
              Cette action est définitive. Voulez-vous vraiment supprimer ce pairing ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PairingManagement;
