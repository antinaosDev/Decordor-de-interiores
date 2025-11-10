import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { PreferenceFilters } from './components/PreferenceFilters';
import { StyleOptionCard } from './components/StyleOptionCard';
import { Chatbot } from './components/Chatbot';
import { ImageEditorModal } from './components/ImageEditorModal';
import { ThreeDViewerModal } from './components/ThreeDViewerModal';
import { Spinner } from './components/Spinner';
import { generateDesigns, editImageWithGemini, generateColorPalettes } from './services/geminiService';
import type { AppState, StyleOption, Preferences, ColorPalette } from './types';
import { AppStep, FurnitureType } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    step: AppStep.UPLOAD,
    originalImage: null,
    originalImageUrl: null,
    preferences: {
      colorPalette: '',
      furnitureType: FurnitureType.ANY,
      material: '',
    },
    styleOptions: [],
    isLoading: false,
    loadingMessage: '',
    error: null,
    editingImage: null,
    viewingIn3D: null,
    colorPalettes: [],
    isGeneratingPalettes: false,
  });

  const handleImageUpload = (file: File) => {
    setAppState(prev => ({
      ...prev,
      originalImage: file,
      originalImageUrl: URL.createObjectURL(file),
      step: AppStep.PREFERENCES,
      error: null,
      styleOptions: [],
    }));
  };

  const handlePreferencesChange = (newPreferences: Preferences) => {
    setAppState(prev => ({ ...prev, preferences: newPreferences }));
  };

  const handleGenerateDesigns = async () => {
    if (!appState.originalImage) return;
    setAppState(prev => ({
      ...prev,
      isLoading: true,
      loadingMessage: 'Creando el cuarto de tus sueños... Esto puede tardar unos minutos.',
      error: null,
      step: AppStep.GENERATING,
    }));
    try {
      const designs = await generateDesigns(appState.originalImage, appState.preferences);
      setAppState(prev => ({
        ...prev,
        styleOptions: designs,
        step: AppStep.RESULTS,
      }));
    } catch (err) {
      console.error(err);
      setAppState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Ocurrió un error desconocido.',
        step: AppStep.PREFERENCES,
      }));
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false, loadingMessage: '' }));
    }
  };

  const handleEditImage = (styleOption: StyleOption) => {
    setAppState(prev => ({ ...prev, editingImage: styleOption }));
  };
  
  const handleCloseEditor = () => {
    setAppState(prev => ({ ...prev, editingImage: null }));
  };
  
  const handleViewIn3D = (styleOption: StyleOption) => {
    setAppState(prev => ({ ...prev, viewingIn3D: styleOption }));
  };

  const handleClose3DViewer = () => {
      setAppState(prev => ({ ...prev, viewingIn3D: null }));
  };

  const handleGeneratePalettes = async () => {
    if (!appState.originalImage) return;
    setAppState(prev => ({ ...prev, isGeneratingPalettes: true, error: null }));
    try {
        const palettes = await generateColorPalettes(appState.originalImage);
        setAppState(prev => ({ ...prev, colorPalettes: palettes }));
    } catch (err) {
        console.error(err);
        setAppState(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Error al generar las paletas de colores.' }));
    } finally {
        setAppState(prev => ({ ...prev, isGeneratingPalettes: false }));
    }
  };

  const handleSelectPalette = (palette: ColorPalette) => {
    handlePreferencesChange({
        ...appState.preferences,
        colorPalette: palette.name,
    });
  };

  const handleStartOver = () => {
    if (appState.originalImageUrl) {
        URL.revokeObjectURL(appState.originalImageUrl);
    }
    setAppState({
      step: AppStep.UPLOAD,
      originalImage: null,
      originalImageUrl: null,
      preferences: {
        colorPalette: '',
        furnitureType: FurnitureType.ANY,
        material: '',
      },
      styleOptions: [],
      isLoading: false,
      loadingMessage: '',
      error: null,
      editingImage: null,
      viewingIn3D: null,
      colorPalettes: [],
      isGeneratingPalettes: false,
    });
  };

  const handleUpdateEditedImage = (styleId: string, newImage: string) => {
    setAppState(prev => ({
      ...prev,
      styleOptions: prev.styleOptions.map(opt => 
        opt.id === styleId ? { ...opt, generatedImage: newImage } : opt
      ),
      editingImage: prev.editingImage ? { ...prev.editingImage, generatedImage: newImage } : null,
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {appState.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{appState.error}</span>
          </div>
        )}

        {appState.step === AppStep.UPLOAD && (
          <ImageUploader onImageUpload={handleImageUpload} />
        )}

        {(appState.step === AppStep.PREFERENCES || appState.step === AppStep.GENERATING) && appState.originalImageUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold mb-4 text-gray-700">Tu Espacio</h2>
              <img src={appState.originalImageUrl} alt="Habitación subida" className="rounded-xl shadow-lg w-full" />
            </div>
            <div className="lg:col-span-2">
              <PreferenceFilters
                preferences={appState.preferences}
                onPreferencesChange={handlePreferencesChange}
                onGenerate={handleGenerateDesigns}
                isLoading={appState.isLoading}
                palettes={appState.colorPalettes}
                onGeneratePalettes={handleGeneratePalettes}
                onSelectPalette={handleSelectPalette}
                isGeneratingPalettes={appState.isGeneratingPalettes}
              />
            </div>
          </div>
        )}

        {appState.step === AppStep.GENERATING && appState.isLoading && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50">
            <Spinner />
            <p className="text-white text-xl mt-4 text-center max-w-md">{appState.loadingMessage}</p>
          </div>
        )}

        {appState.step === AppStep.RESULTS && (
          <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Tus Opciones de Diseño</h2>
                <button
                    onClick={handleStartOver}
                    className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
                >
                    Comenzar Nuevo Proyecto
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {appState.styleOptions.map(option => (
                <StyleOptionCard key={option.id} option={option} onEdit={handleEditImage} onViewIn3D={handleViewIn3D} />
              ))}
            </div>
          </div>
        )}
      </main>

      {appState.editingImage && (
        <ImageEditorModal
          isOpen={!!appState.editingImage}
          onClose={handleCloseEditor}
          styleOption={appState.editingImage}
          onImageUpdate={handleUpdateEditedImage}
          geminiEditFunction={editImageWithGemini}
        />
      )}
      
      {appState.viewingIn3D && (
        <ThreeDViewerModal
            isOpen={!!appState.viewingIn3D}
            onClose={handleClose3DViewer}
            styleOption={appState.viewingIn3D}
        />
      )}

      <Chatbot />
    </div>
  );
};

export default App;