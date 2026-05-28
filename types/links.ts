export interface LinkItem {
  id: string;
  title: string;
  url: string;
  siteId: string;               // ID do site que contém este link
  folderId?: string | null;     // ID da pasta dentro do site (null = raiz do site)
  clickCount: number;
  lastClicked?: number;
  order: number;
  promptIds: string[];          // IDs dos prompts vinculados (múltiplos)
  /** @deprecated Use siteId. Mantido para migração. */
  categoryId?: string;
  /** @deprecated Use promptIds. Mantido para migração. */
  promptId?: string;
}

export interface SiteCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  isDefault?: boolean;    // Categorias padrão não podem ser deletadas
  parentId: string | null; // null = categoria raiz, string = subcategoria
  isCollapsed?: boolean;   // Estado de UI para árvore expandida/colapsada
}

// Agrupador de links relacionados (ex: Google → Drive, Docs, Gmail)
export interface Site {
  id: string;
  name: string;
  description?: string;
  categoryId: string;       // Categoria pai
  faviconUrl?: string;      // Cache do favicon principal
  order: number;
  promptIds?: string[];     // Prompts vinculados diretamente ao site
  createdAt: number;
  updatedAt: number;
}

// Pasta dentro de um Site para organizar links
export interface SiteFolder {
  id: string;
  name: string;
  siteId: string;           // Site pai
  color?: string;           // Cor opcional (slug de cor das constantes)
  order: number;
  isCollapsed?: boolean;    // Estado de UI (se deve esconder links)
  createdAt: number;
  updatedAt: number;
}
