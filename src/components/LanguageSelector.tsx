import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const languages = useMemo(() => ([
    { code: 'en', name: 'English',  flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español',  flag: '🇪🇸' },
  ]), []);

  // Normalise "fr-FR" -> "fr"
  const langCode2 = (i18n.language || 'en').split('-')[0];
  const currentLanguage = languages.find(l => l.code === langCode2) || languages[0];

  // Fermer au clic extérieur / touche Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const changeLang = async (code: string) => {
    await i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Langue actuelle : ${currentLanguage.name}`}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm hover:border-green-300 hover:text-green-700 transition"
      >
        <Globe className="h-5 w-5" />
        <span className="whitespace-nowrap">{currentLanguage.name}</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute left-0 mt-2 w-56 rounded-lg border bg-white shadow-lg z-50 overflow-hidden"
        >
          {languages.map(language => {
            const active = langCode2 === language.code;
            return (
              <button
                key={language.code}
                role="menuitem"
                onClick={() => changeLang(language.code)}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition ${
                  active ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-800'
                }`}
              >
                <span className="truncate">{language.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
