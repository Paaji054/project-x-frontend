export const IMAGE_QUALITY_PRESETS = {
  high: { label: 'High', maxEdge: 2048, jpegQuality: 0.9, description: 'Best quality, larger file' },
  medium: { label: 'Medium', maxEdge: 1280, jpegQuality: 0.8, description: 'Balanced quality and size' },
  low: { label: 'Low', maxEdge: 720, jpegQuality: 0.65, description: 'Smaller file, faster upload' },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function compressImageDataUrl(dataUrl, qualityKey = 'medium') {
  const preset = IMAGE_QUALITY_PRESETS[qualityKey] || IMAGE_QUALITY_PRESETS.medium;
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, preset.maxEdge / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', preset.jpegQuality);
}

export function estimateDataUrlSize(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Math.round((base64.length * 3) / 4);
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
