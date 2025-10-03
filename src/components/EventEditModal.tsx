import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type EditableEvent = {
  id: string;
  snakeId: string;
  type: 'feeding' | 'shed' | 'vet_visit' | 'handling' | string;
  date: string; // ISO string
  weight?: number | null;
  notes?: string | null;
};

interface EventEditModalProps {
  open: boolean;
  event: EditableEvent | null;
  onClose: () => void;
  onSave: (updated: EditableEvent) => void;
}

const EventEditModal: React.FC<EventEditModalProps> = ({ open, event, onClose, onSave }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<EditableEvent | null>(event);

  useEffect(() => setForm(event), [event]);

  if (!open || !form) return null;

  // Helpers
  const toDateInput = (iso: string) => {
    // yyyy-MM-dd pour <input type="date">
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fromDateInput = (value: string) => {
    // garder l’heure existante si possible, sinon 00:00:00
    const d = new Date(form!.date);
    const [y, m, day] = value.split('-').map(Number);
    d.setFullYear(y);
    d.setMonth((m || 1) - 1);
    d.setDate(day || 1);
    return d.toISOString();
  };

  const handleChange =
    (key: keyof EditableEvent) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      let val: any = e.target.value;
      if (key === 'weight') val = e.target.value === '' ? null : Number(e.target.value);
      if (key === 'date') val = fromDateInput(e.target.value);
      setForm(prev => (prev ? { ...prev, [key]: val } : prev));
    };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form) onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">
          {t('events.editTitle', { defaultValue: 'Modifier l’événement' })}
        </h3>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {t('events.fields.type', { defaultValue: 'Type' })}
            </label>
            <select
              value={form.type}
              onChange={handleChange('type')}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="feeding">{t('events.types.feeding', { defaultValue: 'Nourrissage' })}</option>
              <option value="shed">{t('events.types.shed', { defaultValue: 'Mue' })}</option>
              <option value="vet_visit">{t('events.types.vet_visit', { defaultValue: 'Visite véto' })}</option>
              <option value="handling">{t('events.types.handling', { defaultValue: 'Manipulation' })}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {t('events.fields.date', { defaultValue: 'Date' })}
            </label>
            <input
              type="date"
              value={toDateInput(form.date)}
              onChange={handleChange('date')}
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {t('events.fields.weight', { defaultValue: 'Poids (g)' })}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={form.weight ?? ''}
              onChange={handleChange('weight')}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder={t('events.placeholders.weight', { defaultValue: 'ex: 120' }) as string}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {t('events.fields.notes', { defaultValue: 'Notes' })}
            </label>
            <textarea
              rows={3}
              value={form.notes ?? ''}
              onChange={handleChange('notes')}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder={t('events.placeholders.notes', { defaultValue: 'Notes libres…' }) as string}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-3 py-2 text-sm"
            >
              {t('common.cancel', { defaultValue: 'Annuler' })}
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              {t('common.save', { defaultValue: 'Enregistrer' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventEditModal;
