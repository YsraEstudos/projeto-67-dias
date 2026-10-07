/**
 * Safe arithmetic expression evaluator (Shunting Yard) — never uses eval().
 * Supports + - * / parentheses, decimals (".5", "2.") and unary minus ("-3", "5*-2", "-(2+1)").
 * Returns the formatted result or 'Erro'.
 */
export const CALCULATOR_ERROR = 'Erro';

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, 'neg': 3 };
const isNumberToken = (token: string) => /\d/.test(token);

const tokenize = (expression: string): string[] | null => {
    const rawTokens = expression.match(/\d+\.?\d*|\.\d+|[+\-*/()]/g);
    if (!rawTokens) return null;

    // Convert '-' into unary 'neg' when it doesn't follow a value or ')'
    return rawTokens.map((token, index) => {
        if (token !== '-') return token;
        const previous = rawTokens[index - 1];
        const followsValue = previous !== undefined && (isNumberToken(previous) || previous === ')');
        return followsValue ? '-' : 'neg';
    });
};

const toRpn = (tokens: string[]): string[] | null => {
    const output: string[] = [];
    const operators: string[] = [];

    for (const token of tokens) {
        if (isNumberToken(token)) {
            output.push(token);
        } else if (token === 'neg') {
            operators.push(token); // right-associative prefix operator
        } else if (token in PRECEDENCE) {
            while (operators.length > 0) {
                const top = operators[operators.length - 1];
                if (!(top in PRECEDENCE) || PRECEDENCE[top] < PRECEDENCE[token]) break;
                output.push(operators.pop()!);
            }
            operators.push(token);
        } else if (token === '(') {
            operators.push(token);
        } else if (token === ')') {
            while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                output.push(operators.pop()!);
            }
            if (operators.length === 0) return null; // Mismatched parentheses
            operators.pop();
        }
    }

    while (operators.length > 0) {
        const op = operators.pop()!;
        if (op === '(' || op === ')') return null;
        output.push(op);
    }
    return output;
};

const evaluateRpn = (rpn: string[]): number | null => {
    const stack: number[] = [];
    for (const token of rpn) {
        if (isNumberToken(token)) {
            stack.push(parseFloat(token));
            continue;
        }
        if (token === 'neg') {
            if (stack.length < 1) return null;
            stack.push(-stack.pop()!);
            continue;
        }
        if (stack.length < 2) return null;
        const b = stack.pop()!;
        const a = stack.pop()!;
        switch (token) {
            case '+': stack.push(a + b); break;
            case '-': stack.push(a - b); break;
            case '*': stack.push(a * b); break;
            case '/':
                if (b === 0) return null;
                stack.push(a / b);
                break;
            default: return null;
        }
    }
    return stack.length === 1 ? stack[0] : null;
};

export const safeCalculate = (expression: string): string => {
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) return CALCULATOR_ERROR;

    const tokens = tokenize(expression);
    if (!tokens) return CALCULATOR_ERROR;

    const rpn = toRpn(tokens);
    if (!rpn) return CALCULATOR_ERROR;

    const result = evaluateRpn(rpn);
    if (result === null || !isFinite(result)) return CALCULATOR_ERROR;

    // Normalize -0 and format decimals nicely
    const normalized = Object.is(result, -0) ? 0 : result;
    return Number.isInteger(normalized)
        ? normalized.toString()
        : normalized.toFixed(8).replace(/\.?0+$/, '');
};

/** Maps a keyboard key to a calculator input value, or null when not handled. */
export const mapCalculatorKey = (key: string): string | null => {
    if (/^[0-9]$/.test(key)) return key;
    if (['+', '-', '*', '/', '(', ')', '.'].includes(key)) return key;
    if (key === ',') return '.';
    if (key === 'x' || key === 'X') return '*';
    if (key === 'Enter' || key === '=') return '=';
    if (key === 'Backspace') return 'DEL';
    if (key === 'Escape' || key === 'Delete') return 'C';
    return null;
};

/** Pure reducer for the calculator display. */
export const applyCalculatorInput = (display: string, value: string): string => {
    const current = display === CALCULATOR_ERROR ? '' : display;
    if (value === 'C') return '';
    if (value === 'DEL') return current.slice(0, -1);
    if (value === '=') return current ? safeCalculate(current) : '';
    return current + value;
};
