export type ToolCategory =
  | 'all'
  | 'formatters'
  | 'converters'
  | 'security'
  | 'inspectors'
  | 'generators'
  | 'web';

export interface ToolItem {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  iconName: string;
  keywords: string[];
  hash: string;
}

export interface DiffResult {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}
