export interface TonePreset {
  id: string;
  name: string;
  systemInstruction: string;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  images?: string[];
  promptMode: boolean;
  isGenerating?: boolean;
  error?: string | null;
}

export interface ExportData {
  userEmail?: string;
  orgName?: string;
  clientName?: string;
  clientEmail?: string;
  documentType?: string;
  includeMetadataTable?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface ModalInput {
  id: keyof ExportData;
  label: string;
  type: 'text' | 'email' | 'checkbox';
  placeholder?: string;
  required?: boolean;
}

export interface ModalConfig {
  title: string;
  message: string;
  inputs?: ModalInput[];
  confirmText: string;
  isDestructive: boolean;
  action: (data: ExportData) => void | Promise<void>;
}
