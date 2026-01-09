/**
 * Storage Service - Firebase Storage for images (drawings, etc.)
 */
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from './firebase';
import { compressImage } from '../utils/imageUtils';

// Initialize Storage
const storage = getStorage();

/**
 * Result of a drawing upload
 */
export interface DrawingUploadResult {
    url: string;           // Public download URL
    storagePath: string;   // Path for deletion
}

/**
 * Converts a canvas to a compressed Blob
 */
export async function canvasToBlob(
    canvas: HTMLCanvasElement,
    quality: number = 0.8
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Falha ao converter canvas para blob'));
                }
            },
            'image/jpeg',
            quality
        );
    });
}

/**
 * Uploads a drawing to Firebase Storage
 * @param entryId - Journal entry ID
 * @param pageId - Drawing page ID
 * @param blob - Image blob to upload
 * @returns Upload result with URL and path
 */
export async function uploadDrawing(
    entryId: string,
    pageId: string,
    blob: Blob
): Promise<DrawingUploadResult> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        throw new Error('Usuário não autenticado');
    }

    const storagePath = `drawings/${userId}/${entryId}/${pageId}.jpg`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
            uploadedAt: new Date().toISOString(),
        }
    });

    const url = await getDownloadURL(storageRef);

    return { url, storagePath };
}

/**
 * Uploads a drawing from a data URL (base64)
 * Compresses the image before uploading
 */
export async function uploadDrawingFromDataUrl(
    entryId: string,
    pageId: string,
    dataUrl: string,
    maxWidth: number = 1920
): Promise<DrawingUploadResult> {
    // Compress image first
    const compressedDataUrl = await compressImage(dataUrl, maxWidth, 0.85);

    // Convert to blob
    const response = await fetch(compressedDataUrl);
    const blob = await response.blob();

    return uploadDrawing(entryId, pageId, blob);
}

/**
 * Deletes a drawing from Firebase Storage
 */
export async function deleteDrawing(storagePath: string): Promise<void> {
    const storageRef = ref(storage, storagePath);
    try {
        await deleteObject(storageRef);
    } catch (error: unknown) {
        // Ignore if file doesn't exist
        if (error instanceof Error && error.message.includes('object-not-found')) {
            console.warn('Drawing already deleted:', storagePath);
            return;
        }
        throw error;
    }
}

/**
 * Deletes all drawings for a journal entry
 */
export async function deleteAllDrawingsForEntry(
    entryId: string,
    storagePaths: string[]
): Promise<void> {
    const deletePromises = storagePaths.map(path => deleteDrawing(path));
    await Promise.allSettled(deletePromises);
}
