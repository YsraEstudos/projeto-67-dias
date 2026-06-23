const STANDALONE_MATH_BLOCK = /^([ \t]*)\[\s*\n([\s\S]*?)\n\1\][ \t]*$/gm;

/**
 * Normalizes legacy AI-generated display math that uses standalone `[` and `]`
 * lines into delimiters understood by remark-math.
 */
export function normalizeAulasMathMarkdown(markdown: string): string {
    return markdown.replace(
        STANDALONE_MATH_BLOCK,
        (_match, indentation: string, formula: string) =>
            `${indentation}$$\n${formula}\n${indentation}$$`,
    );
}
