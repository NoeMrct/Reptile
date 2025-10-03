import React, { useState } from 'react';
import { X, Camera, Loader2, Check } from 'lucide-react';
import { Snake } from '../types';
import { t } from 'i18next';

interface AddSnakeModalProps {
  onClose: () => void;
  onAdd: (snake: Omit<Snake, 'id' | 'userId'>) => void;
}

const AddSnakeModal: React.FC<AddSnakeModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    morph: '',
    sex: 'Unknown' as 'Male' | 'Female' | 'Unknown',
    birthDate: '',
    weight: '',
    length: '',
    notes: '',
    imageUrl: '',
    imageFile: null as File | null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowSuccess(true);
      setTimeout(() => {
        onAdd({
          name: formData.name,
          species: formData.species,
          morph: formData.morph || undefined,
          sex: formData.sex,
          birthDate: formData.birthDate,
          weight: parseFloat(formData.weight),
          length: parseFloat(formData.length),
          notes: formData.notes || undefined,
          imageUrl: formData.imageUrl || formData.imageFile ? URL.createObjectURL(formData.imageFile!) : 'https://images.pexels.com/photos/45863/python-snake-reptile-green-45863.jpeg?auto=compress&cs=tinysrgb&w=400'
        });
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error adding snake:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        imageFile: file,
        imageUrl: URL.createObjectURL(file)
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{t('addSnake.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Photo Upload Section */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('addSnake.photo')}
              </label>
              <div className="flex items-center space-x-4">
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                  />
                )}
                <div className="flex-1">
                  <label className="flex items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center">
                      <Camera className="h-6 w-6 text-gray-400 mb-1" />
                      <span className="text-sm text-gray-500">{t('addSnake.addPhoto')}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addSnake.name')} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={t('addSnake.namePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addSnake.species')} *
              </label>
              <input
                type="text"
                id="species"
                name="species"
                value={formData.species}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={t('addSnake.speciesPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="morph" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addSnake.morph')}
              </label>
              <input
                type="text"
                id="morph"
                name="morph"
                value={formData.morph}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={t('addSnake.morphPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addSnake.sex')}
              </label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Unknown">{t('addSnake.unknown')}</option>
                <option value="Male">{t('addSnake.male')}</option>
                <option value="Female">{t('addSnake.female')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addSnake.birthDate')} *
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addSnake.weight')} *
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="ex: 1200"
              />
            </div>

            <div>
              <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addSnake.length')} *
              </label>
              <input
                type="number"
                id="length"
                name="length"
                value={formData.length}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="ex: 120"
              />
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                {t('addSnake.imageUrl')}
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://exemple.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              {t('addSnake.notes')}
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={t('addSnake.notesPlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('addSnake.adding')}
                </div>
              ) : showSuccess ? (
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  {t('addSnake.added')}
                </div>
              ) : (
                t('addSnake.add')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSnakeModal;