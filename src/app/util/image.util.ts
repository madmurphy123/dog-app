/* Read an image File, square-crop + downscale it via canvas, and return a JPEG
   data URL small enough to live happily in localStorage. */

const DEFAULT_SIZE = 240;
const QUALITY = 0.85;

export function fileToAvatar(file: File, size = DEFAULT_SIZE): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unsupported file'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Could not load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        // Cover: scale to fill the square, centred.
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      };
      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
