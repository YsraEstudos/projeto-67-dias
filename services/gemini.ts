import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const resolveApiKey = (): string | undefined => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }

    if (typeof process !== 'undefined') {
        return process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY;
    }

    return undefined;
};

const getClient = (): GoogleGenAI => {
    if (!client) {
        const apiKey = resolveApiKey();
        if (!apiKey) {
            throw new Error('Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your environment.');
        }
        client = new GoogleGenAI({ apiKey });
    }
    return client;
};

export const getGeminiModel = () => getClient().models;

// Test-only helpers to reset cached client between unit tests
export const __geminiTestUtils = {
    resetClient: () => { client = null; }
};
