export interface PromptImage {
  id: string;
  url: string;
  caption?: string;
}

// Variável dinâmica em um prompt
// Formato no texto: {{nome|opção1,opção2,opção3}}
export interface PromptVariable {
  id: string;
  name: string;           // Nome da variável (ex: "especialidade")
  options: string[];      // Opções disponíveis (ex: ["web", "software", "react"])
  defaultIndex: number;   // Índice da opção padrão (0)
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  images: PromptImage[];
  variables?: PromptVariable[];  // Lista de variáveis dinâmicas extraídas do content
  copyCount: number;
  isFavorite: boolean;
  order: number;       // Ordem dentro da categoria (para drag-and-drop)
  createdAt: number;
  updatedAt: number;
}

export interface PromptCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
}
