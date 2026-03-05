from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from io import BytesIO
from PIL import Image
import os

app = FastAPI()

@app.post("/api/compress")
async def compress_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado não é uma imagem.")

    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents))

        # WebP supports transparency, so we don't need to force conversion to RGB
        output_io = BytesIO()
        image.save(output_io, format="WEBP", quality=85, optimize=True)

        output_io.seek(0)

        return Response(content=output_io.read(), media_type="image/webp")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao comprimir imagem: {str(e)}")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
