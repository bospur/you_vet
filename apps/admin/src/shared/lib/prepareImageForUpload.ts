const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 2048;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === 'image/heic'
    || type === 'image/heif'
    || name.endsWith('.heic')
    || name.endsWith('.heif')
  );
}

function needsProcessing(file: File): boolean {
  return isHeic(file) || !ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось прочитать изображение'));
    };
    img.src = url;
  });
}

async function loadImageSource(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Safari / старые браузеры — fallback ниже
    }
  }
  const img = await loadImageElement(file);
  return { source: img, width: img.naturalWidth, height: img.naturalHeight };
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Не удалось сжать изображение'))),
      'image/jpeg',
      quality,
    );
  });
}

async function resizeToJpeg(file: File): Promise<File> {
  const { source, width: srcW, height: srcH } = await loadImageSource(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcW, srcH));
  let width = Math.max(1, Math.round(srcW * scale));
  let height = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось обработать изображение');

  const draw = () => {
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(source, 0, 0, width, height);
  };

  draw();

  let quality = 0.9;
  let blob = await canvasToJpegBlob(canvas, quality);
  while (blob.size > MAX_BYTES && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToJpegBlob(canvas, quality);
  }

  while (blob.size > MAX_BYTES && width > 320) {
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
    draw();
    blob = await canvasToJpegBlob(canvas, 0.82);
  }

  if (blob.size > MAX_BYTES) {
    throw new Error('Файл слишком большой (макс 5 МБ). Попробуйте другое фото.');
  }

  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

/** Приводит фото к jpg/png/webp ≤5 МБ — для HEIC и снимков с телефона. */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!needsProcessing(file)) return file;
  return resizeToJpeg(file);
}
