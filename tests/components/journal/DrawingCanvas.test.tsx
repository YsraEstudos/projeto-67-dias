import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../services/storageService', () => ({
    uploadDrawingFromDataUrl: vi.fn(),
}));

import DrawingCanvas from '../../../components/journal/DrawingCanvas';

describe('DrawingCanvas', () => {
    it('renders without crashing', () => {
        render(<DrawingCanvas entryId="e1" onClose={vi.fn()} />);
        expect(screen.getByText('Toque na tela para começar')).toBeInTheDocument();
    });
});
