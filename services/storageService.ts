/**
 * Storage Service - Firebase Storage for images (drawings, etc.)
 */
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from './firebase';
import { compressImage, dataURLtoBlob } from '../utils/imageUtils';

// Initialize Storage
const storage = getStorage();

/**
 * Result of a drawing upload
 */
export interface DrawingUploadResult {
    url: string;           // Public download URL
    storagePath: string;   // Path for deletion
}

type UploadTarget = {
    contentType: string;
    extension: string;
};

const resolveUploadTarget = (blob: Blob): UploadTarget => {
    if (blob.type === 'image/webp') {
        return { contentType: 'image/webp', extension: 'webp' };
    }

    if (blob.type === 'image/png') {
        return { contentType: 'image/png', extension: 'png' };
    }

    return { contentType: 'image/jpeg', extension: 'jpg' };
};

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

    const uploadTarget = resolveUploadTarget(blob);
    const storagePath = `drawings/${userId}/${entryId}/${pageId}.${uploadTarget.extension}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob, {
        contentType: uploadTarget.contentType,
        customMetadata: {
            uploadedAt: new Date().toISOString(),
        }
    });

    const url = await getDownloadURL(storageRef);

    return { url, storagePath };
}

/**
 * Uploads a drawing from a data URL (base64)
 * Passes the image to our high-quality Python/Vercel compressor
 */
export async function uploadDrawingFromDataUrl(
    entryId: string,
    pageId: string,
    dataUrl: string,
    maxWidth: number = 1920
): Promise<DrawingUploadResult> {
    // 1. Initial Client-side safeguard resize (if needed, to avoid Vercel's 4.5MB limit)
    const compressedDataUrl = await compressImage(dataUrl, maxWidth, 0.85);

    // 2. Convert base64 safely without using fetch()
    const blob = dataURLtoBlob(compressedDataUrl);

    // 3. Send to advanced Python Serverless Compressor
    try {
        const formData = new FormData();
        formData.append("file", blob, "image.jpg");

        const compressRes = await fetch("/api/compress", {
            method: "POST",
            body: formData,
        });

        if (compressRes.ok) {
            const optimizedBlob = await compressRes.blob();
            return uploadDrawing(entryId, pageId, optimizedBlob);
        } else {
            console.warn("Python API compression failed. Falling back to client-side blob.");
        }
    } catch (error) {
         console.warn("Python API compression error. Falling back to client-side blob.", error);
    }

    // Fallback if API fails
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

/**
 * Uploads a game story image to Firebase Storage.
 */
export async function uploadGameStoryImage(
    gameId: string,
    storyId: string,
    file: File
): Promise<DrawingUploadResult> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        throw new Error('Usuário não autenticado');
    }

    const originalDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
        reader.readAsDataURL(file);
    });

    const compressedDataUrl = await compressImage(originalDataUrl, 1600, 0.86);
    let blob = dataURLtoBlob(compressedDataUrl);

    try {
        const formData = new FormData();
        formData.append("file", blob, "image.jpg");
        const compressRes = await fetch("/api/compress", {
            method: "POST",
            body: formData,
        });
        if (compressRes.ok) {
            blob = await compressRes.blob();
        } else {
             console.warn("Python API compression failed. Falling back to client-side blob.");
        }
    } catch (e) {
         console.warn("Python API compression error. Falling back to client-side blob.", e);
    }

    const uploadTarget = resolveUploadTarget(blob);
    const storagePath = `game-stories/${userId}/${gameId}/${storyId}.${uploadTarget.extension}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob, {
        contentType: uploadTarget.contentType,
        customMetadata: {
            uploadedAt: new Date().toISOString(),
            source: 'game-story'
        }
    });

    const url = await getDownloadURL(storageRef);

    return { url, storagePath };
}

/**
 * Deletes a game story image from Firebase Storage.
 */
export async function deleteGameStoryImage(storagePath: string): Promise<void> {
    await deleteDrawing(storagePath);
}
