# Fluxos de Compressao de Imagens

Documentacao atualizada dos fluxos de imagem realmente usados no projeto.

## 1. Existem dois pipelines diferentes

### Pipeline A: imagens inline em notas

Usado no editor de notas.

- Compressao no cliente com `compressImage(dataUrl, 800, 0.8)`
- Resultado final embutido em markdown/base64
- Nao envia arquivo para Firebase Storage
- Nao depende da API Python

Esse fluxo existe para manter anotacoes rapidas leves e autocontidas.

### Pipeline B: drawings e imagens de historias de jogos

Usado quando a imagem precisa ir para Firebase Storage.

Etapas atuais:

1. Resize inicial no cliente com `compressImage`
2. Conversao segura de data URL para `Blob` com `dataURLtoBlob`
3. Tentativa de otimizar o blob em `/api/compress`
4. Upload do resultado ao Firebase Storage
5. Fallback para o blob cliente se a API falhar

## 2. Onde cada parte mora

- Cliente:
  - `utils/imageUtils.ts`
  - `services/storageService.ts`
  - `components/notes/NoteEditor.tsx`
- API:
  - `api/compress.py`

## 3. O que a API faz hoje

`api/compress.py`:

- aceita `multipart/form-data`
- valida `content_type` de imagem
- usa Pillow para abrir o arquivo
- devolve `image/webp`
- usa `quality=85` com `optimize=True`

Tambem existe `GET /api/health` para verificacao simples da API local.

## 4. Motivacao da arquitetura

- Evitar payloads gigantes indo direto para o backend
- Manter um fallback local quando a API estiver indisponivel
- Melhorar compressao final para imagens que vao ao Storage
- Evitar uso de `fetch(data:...)` ao converter base64 para blob

## 5. Desenvolvimento local

No app raiz, o Vite faz proxy de `/api/*` para `http://127.0.0.1:8000`.

Se a API Python local nao estiver rodando:

- o pipeline das notas continua funcionando
- fluxos com upload ao Storage dependem do fallback cliente

## 6. Observacao importante para manutencao

O endpoint `/api/compress` ja devolve `WebP`. Ao mexer no fluxo de upload, mantenha alinhados:

- extensao do arquivo salvo
- `contentType` enviado ao Firebase Storage
- expectativas de exibicao e remocao pelo `storagePath`
