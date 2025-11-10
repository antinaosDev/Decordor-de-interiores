import React from 'react';
import type { Preferences, ColorPalette } from '../types';
import { FurnitureType } from '../types';

interface PreferenceFiltersProps {
  preferences: Preferences;
  onPreferencesChange: (newPreferences: Preferences) => void;
  onGenerate: () => void;
  isLoading: boolean;
  palettes: ColorPalette[];
  onGeneratePalettes: () => void;
  onSelectPalette: (palette: ColorPalette) => void;
  isGeneratingPalettes: boolean;
}

export const PreferenceFilters: React.FC<PreferenceFiltersProps> = ({
  preferences,
  onPreferencesChange,
  onGenerate,
  isLoading,
  palettes,
  onGeneratePalettes,
  onSelectPalette,
  isGeneratingPalettes,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onPreferencesChange({
      ...preferences,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg space-y-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-700">Personaliza Tu Estilo</h2>
      
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">¿Necesitas ideas de colores?</h3>
        <button
          onClick={onGeneratePalettes}
          disabled={isGeneratingPalettes}
          className="w-full bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-200 transition duration-300 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isGeneratingPalettes ? 'Generando...' : 'Sugerir Paletas desde la Imagen'}
        </button>
      </div>

      {palettes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Paletas Sugeridas</h3>
          <div className="space-y-3">
            {palettes.map((palette, index) => (
              <div 
                key={index} 
                onClick={() => onSelectPalette(palette)}
                className="p-3 rounded-lg border-2 border-transparent hover:border-indigo-500 cursor-pointer bg-gray-50"
              >
                <p className="font-semibold text-gray-800 text-sm mb-2">{palette.name}</p>
                <div className="flex gap-2">
                  {palette.colors.map(color => (
                    <div key={color} className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: color }} title={color}></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-grow space-y-6">
        <div>
          <label htmlFor="colorPalette" className="block text-sm font-medium text-gray-700 mb-1">
            Colores Preferidos
          </label>
          <input
            type="text"
            name="colorPalette"
            id="colorPalette"
            value={preferences.colorPalette}
            onChange={handleChange}
            placeholder="Ej: Tonos tierra, pasteles, o selecciona una sugerencia"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="furnitureType" className="block text-sm font-medium text-gray-700 mb-1">
            Estilo de Muebles
          </label>
          <select
            id="furnitureType"
            name="furnitureType"
            value={preferences.furnitureType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value={FurnitureType.ANY}>Cualquiera</option>
            <option value={FurnitureType.AFFORDABLE}>Económico</option>
            <option value={FurnitureType.LUXURY}>Lujo</option>
            <option value={FurnitureType.SUSTAINABLE}>Sostenible</option>
          </select>
        </div>

        <div>
          <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">
            Materiales Preferidos
          </label>
          <input
            type="text"
            name="material"
            id="material"
            value={preferences.material}
            onChange={handleChange}
            placeholder="Ej: Madera natural, metal, lino"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando...
          </>
        ) : "Generar Diseños"}
      </button>
    </div>
  );
};