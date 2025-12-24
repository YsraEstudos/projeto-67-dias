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
    // In tests, return a lightweight stub to avoid real API calls
    if (typeof process !== 'undefined' && (process.env.VITEST || process.env.NODE_ENV === 'test')) {
        return {
            models: {
                generateContent: async () => ({ text: 'mock-response', candidates: [] })
            }
        } as unknown as GoogleGenAI;
    }

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

/**
 * Generate content using Gemini 2.5 Flash with thinking mode enabled.
 * This allows the model to "think" before responding for better quality.
 */
export const generateWithThinking = async (
    prompt: string,
    schema: object,
    thinkingBudget: number = 1024
): Promise<{ text: string | undefined; thoughts?: string }> => {
    const models = getGeminiModel();
    const response = await models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            thinkingConfig: {
                thinkingBudget
            }
        }
    });

    return {
        text: response.text,
        thoughts: response.candidates?.[0]?.content?.parts?.find(
            (p: { thought?: boolean }) => p.thought
        )?.text
    };
};

// Test-only helpers to reset cached client between unit tests
export const __geminiTestUtils = {
    resetClient: () => { client = null; }
};
