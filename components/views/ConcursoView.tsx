import React from 'react';
import { ConcursoPlaceholderButton } from '../concurso/ConcursoPlaceholderButton';

const ConcursoView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <ConcursoPlaceholderButton />
    </div>
  );
};

export default ConcursoView;
