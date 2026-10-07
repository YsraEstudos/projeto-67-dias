import { describe, it, expect } from 'vitest';
import { safeCalculate, applyCalculatorInput, mapCalculatorKey, CALCULATOR_ERROR } from '../../../components/tools/utils/calculatorEngine';

describe('safeCalculate', () => {
    it('respects operator precedence and parentheses', () => {
        expect(safeCalculate('2+3*4')).toBe('14');
        expect(safeCalculate('(2+3)*4')).toBe('20');
        expect(safeCalculate('10/4')).toBe('2.5');
    });

    it('supports unary minus', () => {
        expect(safeCalculate('-5+3')).toBe('-2');
        expect(safeCalculate('5*-2')).toBe('-10');
        expect(safeCalculate('-(2+1)')).toBe('-3');
        expect(safeCalculate('3--2')).toBe('5');
    });

    it('supports leading-dot decimals', () => {
        expect(safeCalculate('.5+.25')).toBe('0.75');
    });

    it('returns Erro for invalid expressions', () => {
        expect(safeCalculate('1/0')).toBe(CALCULATOR_ERROR);
        expect(safeCalculate('(1+2')).toBe(CALCULATOR_ERROR);
        expect(safeCalculate('1+')).toBe(CALCULATOR_ERROR);
        expect(safeCalculate('alert(1)')).toBe(CALCULATOR_ERROR);
    });

    it('formats floating point results', () => {
        expect(safeCalculate('0.1+0.2')).toBe('0.3');
        expect(safeCalculate('-0*1')).toBe('0');
    });
});

describe('applyCalculatorInput', () => {
    it('starts fresh after an error instead of appending to "Erro"', () => {
        expect(applyCalculatorInput(CALCULATOR_ERROR, '7')).toBe('7');
        expect(applyCalculatorInput(CALCULATOR_ERROR, 'DEL')).toBe('');
    });

    it('allows continuing from a negative result', () => {
        const result = applyCalculatorInput('2-5', '=');
        expect(result).toBe('-3');
        expect(applyCalculatorInput(applyCalculatorInput(result, '+'), '1')).toBe('-3+1');
        expect(applyCalculatorInput('-3+1', '=')).toBe('-2');
    });

    it('handles clear, backspace and empty equals', () => {
        expect(applyCalculatorInput('123', 'C')).toBe('');
        expect(applyCalculatorInput('123', 'DEL')).toBe('12');
        expect(applyCalculatorInput('', '=')).toBe('');
    });
});

describe('mapCalculatorKey', () => {
    it('maps keyboard keys to calculator inputs', () => {
        expect(mapCalculatorKey('7')).toBe('7');
        expect(mapCalculatorKey('*')).toBe('*');
        expect(mapCalculatorKey(',')).toBe('.');
        expect(mapCalculatorKey('Enter')).toBe('=');
        expect(mapCalculatorKey('Backspace')).toBe('DEL');
        expect(mapCalculatorKey('Escape')).toBe('C');
        expect(mapCalculatorKey('a')).toBeNull();
    });
});
