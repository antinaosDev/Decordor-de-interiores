import { GoogleGenAI, Type, Modality, Chat, GenerateContentResponse } from "@google/genai";
import type { Preferences, StyleOption, FurnitureItem, Store, ColorPalette } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chatInstance: Chat | null = null;

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const furnitureSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Nombre del producto, ej., "Sofá Moderno de Mediados de Siglo".' },
            description: { type: Type.STRING, description: 'Una descripción breve y atractiva del artículo.' },
        }
    }
};

const styleOptionSchema = {
    type: Type.OBJECT,
    properties: {
        styleName: { type: Type.STRING, description: 'El nombre del estilo, ej., "Moderno y Minimalista".' },
        description: { type: Type.STRING, description: 'Un párrafo detallado describiendo este concepto de estilo.' },
        imagePrompt: { type: Type.STRING, description: 'Un prompt detallado y rico para que un modelo de generación de imágenes cree una visualización fotorrealista de la habitación en este estilo. Debe incluir detalles de la habitación original.' },
        furniture: furnitureSchema
    }
};

const designResponseSchema = {
    type: Type.ARRAY,
    description: "Un arreglo de exactamente tres opciones de estilo de diseño de interiores distintas.",
    items: styleOptionSchema
};

export const generateDesigns = async (image: File, preferences: Preferences): Promise<StyleOption[]> => {
    const imagePart = await fileToGenerativePart(image);
    
    const preferenceText = `
        Preferencias del usuario:
        - Paleta de colores: ${preferences.colorPalette || 'Sin preferencia'}
        - Presupuesto/Tipo de mobiliario: ${preferences.furnitureType}
        - Materiales: ${preferences.material || 'Sin preferencia'}
    `;

    const prompt = `
        Analiza la imagen adjunta de una habitación. Basado en la distribución, dimensiones e iluminación de la habitación, genera tres conceptos de diseño de interiores distintos y completos. Los conceptos deben ser: 1. Moderno y Minimalista, 2. Vintage o Rústico, y 3. Industrial o Nórdico.
        Para cada concepto, proporciona un nombre de estilo, una descripción detallada, una lista de muebles adecuados y un prompt detallado para un modelo de generación de imágenes para visualizar la habitación transformada. Asegúrate de que el prompt para la imagen sea extremadamente descriptivo e instruya al modelo para que conserve la arquitectura original de la habitación (ventanas, puertas, distribución) mientras aplica el nuevo estilo.
        ${preferenceText}
        Responde con un objeto JSON que siga estrictamente el esquema proporcionado.
    `;

    const designModel = 'gemini-2.5-pro';
    const designResponse = await ai.models.generateContent({
        model: designModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: designResponseSchema,
            thinkingConfig: { thinkingBudget: 32768 }
        },
    });

    const designData = JSON.parse(designResponse.text);

    const enrichedDesigns = await Promise.all(designData.map(async (style: any) => {
        const generatedImage = await generateImageWithImagen(style.imagePrompt);
        
        const enrichedFurniture = await Promise.all(style.furniture.map(async (item: FurnitureItem) => {
            const stores = await findStoresForItem(item.name, preferences);
            return { ...item, stores };
        }));

        return {
            id: crypto.randomUUID(),
            styleName: style.styleName,
            description: style.description,
            generatedImage: generatedImage,
            imagePrompt: style.imagePrompt,
            furniture: enrichedFurniture
        };
    }));

    return enrichedDesigns;
};

const generateImageWithImagen = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Foto de diseño de interiores fotorrealista: ${prompt}`,
        config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("La generación de la imagen falló.");
    }
    return response.generatedImages[0].image.imageBytes;
};

export const generateRoomPerspective = async (basePrompt: string, angle: string): Promise<string> => {
    const modifiedPrompt = `${basePrompt}, mostrado desde una perspectiva ${angle}.`;
    return generateImageWithImagen(modifiedPrompt);
};

const findStoresForItem = async (itemName: string, preferences: Preferences): Promise<Store[]> => {
    const prompt = `Encuentra 3 tiendas en línea para comprar un "${itemName}". Prioriza tiendas que coincidan con una preferencia de tipo de mueble "${preferences.furnitureType}". Para cada una, proporciona el nombre de la tienda y una URL directa. Si es posible, menciona si tienen ubicaciones físicas usando datos de Google Maps. Formatea como una lista simple.`;

    const searchModel = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
        model: searchModel,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }, { googleMaps: {} }],
        },
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Simple parsing logic. This can be improved with a more structured response.
    const stores: Store[] = [];
    const urlRegex = /https?:\/\/[^\s)]+/g;
    // FIX: Explicitly type `urls` as `string[]` to prevent type widening to `any[]` when pushing values from `groundingChunks`.
    const urls: string[] = text.match(urlRegex) || [];
    
    // Add URLs found in grounding metadata
    groundingChunks.forEach(chunk => {
        if (chunk.web?.uri && typeof chunk.web.uri === 'string') {
            urls.push(chunk.web.uri);
        }
        if (chunk.maps?.uri && typeof chunk.maps.uri === 'string') {
            urls.push(chunk.maps.uri);
        }
    });

    const uniqueUrls = [...new Set(urls)];

    uniqueUrls.slice(0, 3).forEach(url => {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            stores.push({
                name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
                url: url,
            });
        } catch (e) {
            console.warn(`URL inválida encontrada: ${url}`);
        }
    });

    return stores;
};

export const editImageWithGemini = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const generatedPart = response.candidates?.[0]?.content.parts[0];
    if (generatedPart && generatedPart.inlineData) {
        return generatedPart.inlineData.data;
    }
    throw new Error("Error al editar la imagen.");
};

export const getChatResponse = async (history: { role: string, parts: { text: string }[] }[], message: string): Promise<string> => {
    if (!chatInstance) {
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history,
        });
    }

    const response: GenerateContentResponse = await chatInstance.sendMessage({ message });
    return response.text;
};


const colorPaletteSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Un nombre creativo para la paleta de colores, ej., 'Atardecer en Santorini'." },
        colors: {
            type: Type.ARRAY,
            description: "Un arreglo de 5 códigos de color HEX armoniosos.",
            items: { type: Type.STRING }
        }
    }
};

const colorPalettesResponseSchema = {
    type: Type.ARRAY,
    description: "Un arreglo de exactamente tres paletas de colores distintas.",
    items: colorPaletteSchema
};

export const generateColorPalettes = async (image: File): Promise<ColorPalette[]> => {
    const imagePart = await fileToGenerativePart(image);
    const prompt = `
        Analiza los colores en la imagen adjunta de una habitación. 
        Genera 3 paletas de colores distintas y armoniosas inspiradas en la imagen.
        Para cada paleta, proporciona un nombre creativo y un arreglo de 5 códigos de color HEX que funcionen bien juntos para el diseño de interiores.
        Responde con un objeto JSON que siga estrictamente el esquema proporcionado.
    `;

    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: colorPalettesResponseSchema,
        },
    });
    
    return JSON.parse(response.text);
};