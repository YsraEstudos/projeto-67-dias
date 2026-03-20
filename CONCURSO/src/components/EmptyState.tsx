interface EmptyStateProps {
  message: string;
  className?: string;
}

export const EmptyState = ({ message, className }: EmptyStateProps) => (
  <p className={className ? `empty-state ${className}` : 'empty-state'}>{message}</p>
);
