/**
 * Image Utilities - Handles image upload, compression and validation for notes
 */

/** Maximum image size in bytes (5MB) */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validates if a file is a valid image within size limits
 */
export function isValidImageFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return { valid: false, error: 'Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP.' };
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return { valid: false, error: `Imagem muito grande. Máximo: ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
    }
    return { valid: true };
}

/**
 * Converts a File to a Base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
        reader.readAsDataURL(file);
    });
}

/**
 * Compresses and resizes an image to reduce storage size
 * @param dataUrl - Base64 data URL of the image
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 */
export function compressImage(
    dataUrl: string,
    maxWidth: number = 800,
    quality: number = 0.8
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Calculate new dimensions maintaining aspect ratio
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Falha ao criar contexto do canvas'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to compressed JPEG (or keep PNG for transparency)
            const outputType = dataUrl.includes('image/png') ? 'image/png' : 'image/jpeg';
            const compressed = canvas.toDataURL(outputType, quality);
            resolve(compressed);
        };
        img.onerror = () => reject(new Error('Falha ao carregar imagem para compressão'));
        img.src = dataUrl;
    });
}

/**
 * Generates markdown syntax for an inline image
 */
export function generateImageMarkdown(dataUrl: string, altText: string = 'imagem'): string {
    return `![${altText}](${dataUrl})`;
}

/**
 * Extracts image from clipboard data (for paste support)
 */
export async function extractImageFromClipboard(
    clipboardData: DataTransfer
): Promise<File | null> {
    const items = Array.from(clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));

    if (imageItem) {
        const file = imageItem.getAsFile();
        return file;
    }
    return null;
}
