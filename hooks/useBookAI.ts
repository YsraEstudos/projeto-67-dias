import { useState } from 'react';
import { getGeminiModel } from '../services/gemini';
import { Type } from "@google/genai";
import { Book as IBook } from '../types';

interface AIState {
  isLoading: boolean;
  error: string | null;
}

export const useBookAI = () => {
  const [state, setState] = useState<AIState>({ isLoading: false, error: null });

  const generateBookFromPrompt = async (prompt: string): Promise<Partial<IBook> | null> => {
    setState({ isLoading: true, error: null });
    
    try {
      const models = getGeminiModel();
      const response = await models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Atue como um editor literário. Com base no briefing: "${prompt}", sugira um livro ou crie um plano de leitura.
        
        Regras:
        - Responda em português.
        - Retorne JSON estrito.
        - "unit" deve ser "PAGES" ou "CHAPTERS".
        - Se for um livro real, use dados reais. Se for um plano, invente um título criativo.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              genre: { type: Type.STRING },
              total: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              coverUrl: { type: Type.STRING },
              notes: { type: Type.STRING }, // summary or rationale
            },
            required: ["title"]
          }
        }
      });

      if (!response.text) throw new Error("Resposta vazia da IA");

      const data = JSON.parse(response.text);
      return {
        title: data.title,
        author: data.author || 'Desconhecido',
        genre: data.genre || 'Geral',
        total: Number(data.total) || 0,
        unit: data.unit === 'CHAPTERS' ? 'CHAPTERS' : 'PAGES',
        coverUrl: data.coverUrl || '',
        notes: data.notes || '',
        current: 0
      };

    } catch (error) {
      console.error("AI Generation Error:", error);
      setState({ isLoading: false, error: "Falha ao gerar sugestão. Tente novamente." });
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    ...state,
    generateBookFromPrompt
  };
};
