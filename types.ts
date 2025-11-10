export interface Store {
  name: string;
  url: string;
  location?: string;
}

export interface FurnitureItem {
  name: string;
  description: string;
  stores: Store[];
}

export interface ColorPalette {
  name: string;
  colors: string[]; // array of hex codes
}

export interface StyleOption {
  id: string;
  styleName: string;
  description: string;
  generatedImage: string; // base64 string
  imagePrompt: string; // The prompt used to generate the image
  furniture: FurnitureItem[];
}

export enum FurnitureType {
    ANY = 'any',
    AFFORDABLE = 'affordable',
    LUXURY = 'luxury',
    SUSTAINABLE = 'sustainable',
}

export interface Preferences {
  colorPalette: string;
  furnitureType: FurnitureType;
  material: string;
}

export enum AppStep {
    UPLOAD,
    PREFERENCES,
    GENERATING,
    RESULTS,
}

export interface AppState {
    step: AppStep;
    originalImage: File | null;
    originalImageUrl: string | null;
    preferences: Preferences;
    styleOptions: StyleOption[];
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    editingImage: StyleOption | null;
    viewingIn3D: StyleOption | null; // For 3D viewer
    colorPalettes: ColorPalette[]; // For generated color palettes
    isGeneratingPalettes: boolean; // separate loading state for palettes
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}
