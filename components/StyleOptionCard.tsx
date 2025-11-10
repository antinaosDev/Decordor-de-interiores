import React from 'react';
import type { StyleOption, FurnitureItem } from '../types';

interface StyleOptionCardProps {
  option: StyleOption;
  onEdit: (option: StyleOption) => void;
  onViewIn3D: (option: StyleOption) => void;
}

const StoreIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const EditIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

const ThreeDIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.032v2.85a3.865 3.865 0 01-3.865 3.865H6.865A3.865 3.865 0 013 14.882v-2.85m18 0a2.448 2.448 0 00-2.448-2.448H5.448A2.448 2.448 0 003 12.032m18 0L12 5.064 3 12.032" />
    </svg>
);


export const StyleOptionCard: React.FC<StyleOptionCardProps> = ({ option, onEdit, onViewIn3D }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div className="relative">
        <img
          src={`data:image/jpeg;base64,${option.generatedImage}`}
          alt={option.styleName}
          className="w-full h-56 object-cover"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button 
                onClick={() => onEdit(option)}
                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                title="Editar esta imagen"
            >
                <EditIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={() => onViewIn3D(option)}
                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                title="Ver en 3D"
            >
                <ThreeDIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-gray-800">{option.styleName}</h3>
        <p className="text-gray-600 mt-2 mb-4 text-sm flex-grow">{option.description}</p>
        
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Compra el Look:</h4>
          <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
            {option.furniture.map((item, index) => (
              <div key={index}>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                <div className="flex flex-wrap gap-2">
                    {item.stores.map((store, storeIndex) => (
                        <a
                        key={storeIndex}
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                        >
                            <StoreIcon className="w-3 h-3 mr-1.5" />
                            {store.name}
                        </a>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};