import React, { useState } from 'react';
import type { StyleOption } from '../types';
import { Spinner } from './Spinner';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleOption: StyleOption;
  onImageUpdate: (styleId: string, newImage: string) => void;
  geminiEditFunction: (base64Image: string, mimeType: string, prompt: string) => Promise<string>;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  styleOption,
  onImageUpdate,
  geminiEditFunction,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const newImageBase64 = await geminiEditFunction(styleOption.generatedImage, 'image/jpeg', prompt);
      onImageUpdate(styleOption.id, newImageBase64);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al editar la imagen.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-full overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
        <div className="w-full md:w-2/3 relative">
            {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="text-white mt-2">Aplicando cambios...</p>
                </div>
            )}
            <img src={`data:image/jpeg;base64,${styleOption.generatedImage}`} alt={`Editando ${styleOption.styleName}`} className="w-full h-full object-contain" />
        </div>
        <div className="w-full md:w-1/3 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Editar Imagen</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Usa un prompt simple para modificar la imagen. Por ejemplo: "agrega una planta grande en la esquina" o "cambia el color de la pared a azul claro".</p>
            <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                <div className="flex-grow">
                    <label htmlFor="edit-prompt" className="sr-only">Prompt de Edición</label>
                    <textarea
                        id="edit-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Tu prompt de edición..."
                        className="w-full h-24 p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                     {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-300"
                    disabled={isLoading || !prompt.trim()}
                >
                    {isLoading ? 'Aplicando...' : 'Aplicar Edición'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};