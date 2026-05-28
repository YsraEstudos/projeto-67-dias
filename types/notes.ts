export interface Tag {
  id: string;      // UUID
  label: string;   // Display name
  color: string;   // Tailwind class (e.g. 'bg-red-500') or hex
  createdAt: number;
}

export type NoteColor = 'amber' | 'rose' | 'emerald' | 'blue' | 'purple' | 'cyan' | 'pink' | 'orange';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  tags: string[];
  isPinned: boolean;
  pinnedToTags: string[];  // IDs das tags onde a nota está fixada
  createdAt: number;
  updatedAt: number;
}

export interface NoteFilter {
  tags: string[];
  colors: NoteColor[];
  searchTerm: string;
  sortBy: 'recent' | 'oldest' | 'alphabetical' | 'color';
}
