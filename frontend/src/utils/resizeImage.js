// Canvas-based client-side image resize with "cover" crop (centres and fills).
// GIFs are returned unchanged to preserve animation.
export async function resizeImage(file, targetW, targetH, quality = 0.92) {
  if (file.type === 'image/gif') return file;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(targetW / img.width, targetH / img.height);
      const sw = targetW / scale;
      const sh = targetH / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Resize failed'));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}
