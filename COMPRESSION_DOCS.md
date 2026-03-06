# Advanced Image Compression Architecture

This document describes the image compression workflow used in this project, designed specifically to address Vercel's limitations, fix Content Security Policy (CSP) errors, and maintain high visual quality using a Python Serverless backend.

## Why this Architecture?

1. **CSP Fix:** Browsers block using `fetch()` on `data:` URLs if not explicitly allowed by the `connect-src` policy. We avoid modifying the CSP by replacing `fetch(data:...)` with a custom memory-based base64-to-Blob converter (`dataURLtoBlob`).
2. **Vercel's Payload Limit:** Vercel limits Serverless Function request payloads to **4.5 MB** on the Hobby tier. High-resolution images from modern phones can easily exceed this size, causing a 413 Payload Too Large error.
3. **Advanced WebP Compression:** While JavaScript/Canvas can compress JPEGs, Python's `Pillow` library provides superior algorithms to convert and optimize images into the `WebP` format, giving a much smaller file size for the same visual quality.

## The Workflow

1. **Client-side Interception & Safeguard (Vite/React)**
   - When the user uploads an image or drawing, it is first evaluated on the frontend.
   - We use the `compressImage` utility to resize the image using an HTML5 Canvas. This acts as a *safeguard*. Even if the user uploads a 10MB image, the canvas quickly resizes it down to a manageable size (e.g., max 1920px width), ensuring the output is well under Vercel's 4.5MB limit.
   - The result is a Base64 data string.

2. **Safe Blob Conversion**
   - The Base64 string is converted directly to a `Blob` in memory using `dataURLtoBlob()`. This completely bypasses the browser's `fetch()` API, guaranteeing no CSP violations.

3. **Backend Optimization (Vercel Python Serverless)**
   - The client sends the safe `Blob` to our custom `/api/compress` endpoint.
   - The API (built with FastAPI and Pillow) loads the image into memory.
   - It normalizes the image (converting RGBA to RGB if needed to prevent WebP/JPEG artifacts).
   - It performs an advanced optimization pass and converts the image to WebP (`quality=85`, `optimize=True`).
   - The ultra-compressed WebP file is sent back to the client.

4. **Upload to Firebase Storage**
   - The client receives the highly optimized WebP file from the Python API.
   - The client then uploads this final file directly to Firebase Storage.
   - *Fallback Mechanism:* If the Vercel API is down, times out, or errors out, the client catches the error and automatically uploads the initial client-side compressed Blob, ensuring the user's workflow is never interrupted.

## Environment Requirements
- This project utilizes the `@vercel/python` and `@vercel/vite` builders via `vercel.json`.
- When deploying to Vercel, the Python function inside `/api` will be automatically provisioned as a serverless function.
