// Tipo de entrada do diário
export type JournalEntryType = 'text' | 'drawing';

// Página de desenho (armazenada no Firebase Storage)
export interface DrawingPage {
  id: string;
  storageUrl: string;      // URL do Firebase Storage
  storagePath: string;     // Path para delete
  width: number;           // Largura do canvas
  height: number;          // Altura do canvas
  createdAt: number;
}
