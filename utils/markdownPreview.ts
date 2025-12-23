/**
 * Simple utility to strip common Markdown syntax for performant previews.
 */
export function stripMarkdown(text: string): string {
    if (!text) return '';

    return text
        // Remove horizontal rules
        .replace(/^---$/gm, '')
        // Remove Headers
        .replace(/^#+\s+/gm, '')
        // Remove bold/italic markers
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '[Código]')
        // Remove inline code
        .replace(/`(.*?)`/g, '$1')
        // Remove images ![alt](url) -> [Imagem: alt] or [Imagem]
        .replace(/!\[(.*?)\]\(.*?\)/g, (_, alt) => alt ? `[Imagem: ${alt}]` : '[Imagem]')
        // Remove links [text](url) -> text
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        // Remove blockquotes
        .replace(/^>\s+/gm, '')
        // Remove list markers
        .replace(/^[\s\t]*([-*+]|\d+\.)\s+/gm, '')
        // Remove HTML tags (simple)
        .replace(/<[^>]*>/g, '')
        // Clean up extra spaces
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .join(' ')
        .substring(0, 300); // Limit preview length
}
