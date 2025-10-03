import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, ChevronDown } from 'lucide-react';

interface FilterDropdownProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ selectedFilter, onFilterChange }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const filters = [
    { value: 'all', label: t('dashboard.filters.all') },
    { value: 'male', label: t('dashboard.filters.male') },
    { value: 'female', label: t('dashboard.filters.female') },
    { value: 'unknown', label: t('dashboard.filters.unknown') },
    { value: 'recent', label: t('dashboard.filters.recentChanges') },
    { value: 'feeding', label: t('dashboard.filters.needsFeeding') }
  ];

  const selectedFilterLabel = filters.find(f => f.value === selectedFilter)?.label || filters[0].label;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="h-4 w-4" />
        <span>{selectedFilterLabel}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border z-50">
          {filters.map(filter => (
            <button
              key={filter.value}
              onClick={() => {
                onFilterChange(filter.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                selectedFilter === filter.value ? 'bg-green-50 text-green-600' : 'text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;