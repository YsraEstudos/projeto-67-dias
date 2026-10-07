import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CalculatorTool } from '../../../components/tools/CalculatorTool';

describe('CalculatorTool', () => {
    it('supports keyboard input, backspace and Enter', () => {
        render(<CalculatorTool />);
        const display = screen.getByTestId('calculator-display');

        ['1', '2', '+', '3', '9'].forEach(key => fireEvent.keyDown(window, { key }));
        fireEvent.keyDown(window, { key: 'Backspace' });
        expect(display).toHaveTextContent('12+3');

        fireEvent.keyDown(window, { key: 'Enter' });
        expect(display).toHaveTextContent('15');

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(display).toHaveTextContent('0');
    });

    it('recovers from an error when typing a new number', () => {
        render(<CalculatorTool />);
        const display = screen.getByTestId('calculator-display');
        ['1', '/', '0'].forEach(key => fireEvent.keyDown(window, { key }));
        fireEvent.keyDown(window, { key: 'Enter' });
        expect(display).toHaveTextContent('Erro');

        fireEvent.click(screen.getByText('7'));
        expect(display).toHaveTextContent('7');
    });

    it('has a backspace button', () => {
        render(<CalculatorTool />);
        fireEvent.click(screen.getByText('8'));
        fireEvent.click(screen.getByText('9'));
        fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
        expect(screen.getByTestId('calculator-display')).toHaveTextContent('8');
    });
});
