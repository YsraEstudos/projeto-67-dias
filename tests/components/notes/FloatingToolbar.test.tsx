import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FloatingToolbar } from '../../../components/notes/FloatingToolbar';

describe('FloatingToolbar', () => {
    const mockOnFormat = vi.fn();
    const mockContainerRef = { current: document.createElement('div') };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Visibility', () => {
        it('initially renders without being visible (no selection)', () => {
            const { container } = render(
                <FloatingToolbar
                    containerRef={mockContainerRef}
                    onFormat={mockOnFormat}
                />
            );

            // Should not render the toolbar when there's no selection
            expect(container.querySelector('[class*="fixed z-"]')).not.toBeInTheDocument();
        });
    });

    describe('Formatting Actions', () => {
        it('exports FloatingToolbar component', () => {
            expect(FloatingToolbar).toBeDefined();
            expect(typeof FloatingToolbar).toBe('object'); // React.memo wraps it
        });
    });

    describe('Component Structure', () => {
        it('accepts containerRef and onFormat props', () => {
            // This test verifies the component accepts the correct props
            expect(() => {
                render(
                    <FloatingToolbar
                        containerRef={mockContainerRef}
                        onFormat={mockOnFormat}
                    />
                );
            }).not.toThrow();
        });
    });
});
