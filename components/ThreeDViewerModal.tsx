import React, { useState, useEffect } from 'react';
import type { StyleOption } from '../types';
import { Spinner } from './Spinner';
import { generateRoomPerspective } from '../services/geminiService';

interface ThreeDViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleOption: StyleOption;
}

type ViewAngle = 'front' | 'left' | 'right' | 'top';

const angleTranslations: { [key in ViewAngle]: string } = {
    front: 'Frontal',
    left: 'Izquierda',
    right: 'Derecha',
    top: 'Superior',
};

const anglePrompts: { [key in ViewAngle]?: string } = {
    left: 'de 45 grados desde la izquierda',
    right: 'de 45 grados desde la derecha',
    top: 'cenital (vista de pájaro)',
};


export const ThreeDViewerModal: React.FC<ThreeDViewerModalProps> = ({
  isOpen,
  onClose,
  styleOption,
}) => {
  const [perspectives, setPerspectives] = useState<{ [key in ViewAngle]?: string }>({ front: styleOption.generatedImage });
  const [currentView, setCurrentView] = useState<ViewAngle>('front');
  const [loadingAngle, setLoadingAngle] = useState<ViewAngle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const anglesToLoad: ViewAngle[] = ['left', 'right', 'top'];

  const fetchPerspective = async (angle: ViewAngle) => {
    if (perspectives[angle] || loadingAngle || angle === 'front') return;
    setLoadingAngle(angle);
    setError(null);
    try {
      const angleDescription = anglePrompts[angle];
      if (!angleDescription) return;

      const newImageBase64 = await generateRoomPerspective(styleOption.imagePrompt, angleDescription);
      setPerspectives(prev => ({ ...prev, [angle]: newImageBase64 }));
    } catch (err) {
      const errorMessage = `Error al cargar la vista ${angleTranslations[angle]}.`;
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoadingAngle(null);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      // Prefetch other angles
      anglesToLoad.forEach(angle => {
        if (!perspectives[angle]) {
          fetchPerspective(angle);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, styleOption.id]);

  if (!isOpen) return null;

  const renderNavButton = (angle: ViewAngle) => {
    const isAvailable = !!perspectives[angle];
    const isActive = currentView === angle;
    const isLoadingThis = loadingAngle === angle;

    return (
      <button
        onClick={() => isAvailable && setCurrentView(angle)}
        disabled={!isAvailable}
        className={`w-24 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md'
            : isAvailable
            ? 'bg-white text-gray-700 hover:bg-gray-100'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLoadingThis ? (
          <div className="w-4 h-4 border-2 border-t-2 border-gray-400 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
        ) : angleTranslations[angle]}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Vista en Perspectiva 3D</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </header>
        <main className="flex-grow relative bg-gray-200 flex items-center justify-center">
          {(!perspectives[currentView] || (loadingAngle && currentView === loadingAngle)) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <Spinner />
              <p className="text-gray-600 mt-2">Generando perspectiva...</p>
            </div>
          )}
          {error && <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 bg-red-100">{error}</div>}
          
          <img 
            src={`data:image/jpeg;base64,${perspectives[currentView]}`} 
            alt={`${styleOption.styleName} - vista ${angleTranslations[currentView]}`} 
            className="w-full h-full object-contain transition-opacity duration-300" 
            style={{ opacity: loadingAngle && !perspectives[currentView] ? 0.5 : 1 }}
          />
        </main>
        <footer className="p-4 border-t bg-gray-50">
          <div className="flex justify-center items-center gap-4">
            {renderNavButton('front')}
            {renderNavButton('left')}
            {renderNavButton('right')}
            {renderNavButton('top')}
          </div>
        </footer>
      </div>
    </div>
  );
};