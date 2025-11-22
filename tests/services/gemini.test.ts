import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn(),
  };
});

import { getGeminiModel, __geminiTestUtils } from '../../services/gemini';
import { GoogleGenAI } from '@google/genai';

const mockedGoogleGenAI = vi.mocked(GoogleGenAI);

const mockModelsInstance = { generateContent: vi.fn() } as const;

describe('services/gemini', () => {
  beforeEach(() => {
    mockedGoogleGenAI.mockReset();
    mockedGoogleGenAI.mockImplementation(function ({ apiKey }: { apiKey: string }) {
      return {
        models: mockModelsInstance,
        __apiKey: apiKey,
      } as any;
    });
    __geminiTestUtils.resetClient();
    vi.unstubAllEnvs();
    delete process.env.VITE_GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers VITE_GEMINI_API_KEY from import.meta.env', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'import-meta-key');

    const models = getGeminiModel();

    expect(models).toBe(mockModelsInstance);
    const [[args]] = mockedGoogleGenAI.mock.calls as [[{ apiKey: string }]];
    expect(args.apiKey).toBe('import-meta-key');
    expect(mockedGoogleGenAI).toHaveBeenCalledTimes(1);
    expect(mockedGoogleGenAI).toHaveBeenCalledWith({ apiKey: 'import-meta-key' });
  });

  it('falls back to process.env when import meta is not defined', () => {
    process.env.GEMINI_API_KEY = 'process-key';

    const models = getGeminiModel();

    expect(models).toBe(mockModelsInstance);
    const [[args]] = mockedGoogleGenAI.mock.calls as [[{ apiKey: string }]];
    expect(args.apiKey).toBe('process-key');
    expect(mockedGoogleGenAI).toHaveBeenCalledTimes(1);
    expect(mockedGoogleGenAI).toHaveBeenCalledWith({ apiKey: 'process-key' });
  });

  it('throws a descriptive error when no API key is configured', () => {
    mockedGoogleGenAI.mockImplementation(() => ({ models: mockModelsInstance }) as any);

    expect(() => getGeminiModel()).toThrowError(
      'Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your environment.'
    );
    expect(mockedGoogleGenAI).not.toHaveBeenCalled();
  });

  it('reuses the same GoogleGenAI client across calls', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'singleton-key');

    const first = getGeminiModel();
    const second = getGeminiModel();

    expect(first).toBe(second);
    expect(mockedGoogleGenAI).toHaveBeenCalledTimes(1);
  });
});
