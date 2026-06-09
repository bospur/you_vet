/** Лимит сервера — оставляем запас, чтобы multipart не упирался в 5 МБ */
const SERVER_MAX_BYTES = 5 * 1024 * 1024;

function isCoarseMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function getCompressionLimits() {
  const mobile = isCoarseMobile();
  return {
    maxDimension: mobile ? 1200 : 1600,
    targetBytes: mobile ? 1.8 * 1024 * 1024 : 3 * 1024 * 1024,
  };
}

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
      reject(new Error('Не удалось открыть фото. Попробуйте другое изображение.'));
    };
    img.src = url;
  });
}

async function loadImageSource(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  // На iOS HEIC надёжнее через <img>, чем через createImageBitmap
  if (isHeic(file) || isCoarseMobile()) {
    try {
      const img = await loadImageElement(file);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        return { source: img, width: img.naturalWidth, height: img.naturalHeight };
      }
    } catch {
      // fallback ниже
    }
  }

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      try {
        const bitmap = await createImageBitmap(file);
        return { source: bitmap, width: bitmap.width, height: bitmap.height };
      } catch {
        // fallback ниже
      }
    }
  }

  const img = await loadImageElement(file);
  return { source: img, width: img.naturalWidth, height: img.naturalHeight };
}

function closeSource(source: CanvasImageSource) {
  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }
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

async function compressToJpeg(file: File): Promise<File> {
  const { maxDimension, targetBytes } = getCompressionLimits();
  const { source, width: srcW, height: srcH } = await loadImageSource(file);

  try {
    let dimLimit = maxDimension;
    let bestBlob: Blob | null = null;

    for (let round = 0; round < 10; round++) {
      const scale = Math.min(1, dimLimit / Math.max(srcW, srcH));
      const width = Math.max(1, Math.round(srcW * scale));
      const height = Math.max(1, Math.round(srcH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Не удалось обработать изображение');
      ctx.drawImage(source, 0, 0, width, height);

      for (const quality of [0.85, 0.78, 0.7, 0.62, 0.54, 0.46, 0.38]) {
        const blob = await canvasToJpegBlob(canvas, quality);
        bestBlob = blob;
        if (blob.size <= targetBytes) {
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
          return new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
        }
      }

      if (bestBlob && bestBlob.size <= SERVER_MAX_BYTES) {
        break;
      }
      dimLimit = Math.round(dimLimit * 0.72);
      if (dimLimit < 400) break;
    }

    if (!bestBlob || bestBlob.size > SERVER_MAX_BYTES) {
      throw new Error('Не удалось ужать фото до 5 МБ. Попробуйте кадрировать снимок.');
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([bestBlob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    closeSource(source);
  }
}

/**
 * Сжимает и конвертирует фото в JPEG перед загрузкой.
 * На телефоне сжимаем всегда (HEIC, большие снимки с камеры).
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const { targetBytes } = getCompressionLimits();
  const skipCompress =
    !isCoarseMobile()
    && !isHeic(file)
    && file.type === 'image/jpeg'
    && file.size <= targetBytes
    && /\.jpe?g$/i.test(file.name);

  if (skipCompress) return file;
  return compressToJpeg(file);
}
