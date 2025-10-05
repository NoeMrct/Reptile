import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar, Scale, Activity, Stethoscope, Hand, FileText,
  Trash2, MoreVertical, Pencil
} from 'lucide-react';
import { Event } from '../types';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';

interface EventCardProps {
  event: Event;
  snakeName: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, snakeName, onDelete, onEdit }) => {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuOpen) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'feeding':   return <Activity className="h-5 w-5 text-blue-600" />;
      case 'shed':      return <Scale className="h-5 w-5 text-purple-600" />;
      case 'vet_visit': return <Stethoscope className="h-5 w-5 text-green-600" />;
      case 'handling':  return <Hand className="h-5 w-5 text-orange-600" />;
      default:          return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'feeding':   return 'bg-blue-50 border-blue-200';
      case 'shed':      return 'bg-purple-50 border-purple-200';
      case 'vet_visit': return 'bg-green-50 border-green-200';
      case 'handling':  return 'bg-orange-50 border-orange-200';
      default:          return 'bg-gray-50 border-gray-200';
    }
  };

  // Libellé i18n du type d’événement (fallback propre)
  const formatEventType = (type: string) =>
    type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const getEventLabel = (type: string) =>
    t(`events.types.${type}`, { defaultValue: formatEventType(type) });

  const handleDeleteClick = () => {
    if (!onDelete) return;
    const confirmed = window.confirm(
      t('events.confirmDelete', {
        defaultValue: t('events.confirmDelete'),
      })
    );
    if (confirmed) onDelete(event.id);
    setMenuOpen(false);
  };

  const handleEditClick = () => {
    if (onEdit) onEdit(event.id);
    setMenuOpen(false);
  };

  const style = (t('date.cardStyle', { defaultValue: 'medium' }) as
    | 'short'
    | 'medium'
    | 'long'
    | 'full');

  const formatter = new Intl.DateTimeFormat(i18n.language || 'fr-FR', {
    dateStyle: style,
  });
  const dateText = formatter.format(new Date(event.date));

  return (
    <div className={`group border rounded-lg p-4 ${getEventColor(event.type)}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">{getEventIcon(event.type)}</div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              {getEventLabel(event.type)} - {snakeName}
            </h4>

            <div className="relative flex items-center shrink-0">
              <span className="text-sm text-gray-500 flex items-center pr-0 transition-all duration-150 ease-out group-hover:pr-10">
                <Calendar className="h-4 w-4 mr-1" />
                {dateText}
              </span>

              {(onDelete || onEdit) && (
                <>
                  <button
                    ref={btnRef}
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label={t('events.actions.ariaLabel', {
                      defaultValue: "Actions de l'événement",
                    })}
                    onClick={() => setMenuOpen((v) => !v)}
                    className="absolute right-0 p-1.5 rounded-md hover:bg-white/70 focus:bg-white/70 outline-none transition
                               opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>

                  {menuOpen && (
                    <div
                      ref={menuRef}
                      role="menu"
                      aria-label={t('events.actions.menuLabel', {
                        defaultValue: t('events.actions.menuLabel'),
                      })}
                      className="absolute right-0 top-8 z-10 w-44 rounded-lg border bg-white shadow-lg py-1"
                    >
                      {onEdit && (
                        <button
                          role="menuitem"
                          onClick={handleEditClick}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          {t('common.edit', { defaultValue: 'Modifier' })}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          role="menuitem"
                          onClick={handleDeleteClick}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('common.delete', { defaultValue: 'Supprimer' })}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {event.notes && (
            <p className="text-gray-600 text-sm mt-1">
              {event.notes}
            </p>
          )}

          {event.weight && (
            <p className="text-gray-600 text-sm mt-1">
              {t('events.weightWithUnit', {
                defaultValue: 'Poids : {{weight}}g',
                weight: event.weight,
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
