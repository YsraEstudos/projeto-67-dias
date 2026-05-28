// Prioridade da meta
export type GoalPriority = 'HIGH' | 'MEDIUM' | 'LOW';

// Status da meta
export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'DROPPED';

// Link vinculado a uma meta (referência a LinkItem ou URL manual)
export interface GoalLink {
  id: string;
  type: 'INTERNAL' | 'EXTERNAL';  // INTERNAL = referência a LinkItem, EXTERNAL = URL manual
  linkId?: string;                 // ID do LinkItem (se INTERNAL)
  url?: string;                    // URL manual (se EXTERNAL)
  title?: string;                  // Título customizado (obrigatório se EXTERNAL)
  description?: string;            // "O que vou fazer com isso"
}

// Meta anual
export interface YearlyGoal {
  id: string;
  title: string;
  description?: string;            // Detalhes/contexto da meta
  category?: string;               // Categoria opcional (ex: Saúde, Carreira, etc)
  year: number;                    // Ano da meta (2025, 2026...)
  priority: GoalPriority;
  status: GoalStatus;
  links: GoalLink[];               // Links vinculados indicando ações
  progress?: number;               // 0-100% (opcional)
  achievedAt?: number;             // Timestamp quando foi concluída
  createdAt: number;
  updatedAt: number;
}
