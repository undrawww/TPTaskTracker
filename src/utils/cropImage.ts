export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  const bBoxWidth =
    Math.abs(Math.cos(rotRad) * image.width) +
    Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight =
    Math.abs(Math.sin(rotRad) * image.width) +
    Math.abs(Math.cos(rotRad) * image.height);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return null;
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob((file) => {
      resolve(file);
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Automatically crops the white or transparent background from an image and adds a small padding.
 */
export async function cropWhitespaceFromImage(file: File, padding = 20): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);
  const image = await createImage(imageUrl);
  
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) throw new Error('Failed to get canvas context');
  
  // Fill white background just in case there's transparency
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  
  // Tolerance for "white" (0-255). Lower means stricter white.
  const threshold = 245; 
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // If pixel is NOT white (darker than threshold)
      if (r < threshold || g < threshold || b < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  // If the image was entirely white or empty
  if (minX > maxX || minY > maxY) {
    URL.revokeObjectURL(imageUrl);
    return file; // Return original if no content found
  }
  
  // Dimensions of the actual content
  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  
  // Create final canvas with padding
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = contentWidth + (padding * 2);
  finalCanvas.height = contentHeight + (padding * 2);
  const finalCtx = finalCanvas.getContext('2d');
  
  if (!finalCtx) {
    URL.revokeObjectURL(imageUrl);
    return file;
  }
  
  // Fill final canvas with white
  finalCtx.fillStyle = '#ffffff';
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  
  // Draw the cropped area onto the final canvas with padding
  finalCtx.drawImage(
    canvas,
    minX, minY, contentWidth, contentHeight,
    padding, padding, contentWidth, contentHeight
  );
  
  URL.revokeObjectURL(imageUrl);
  
  return new Promise((resolve, reject) => {
    finalCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas is empty'));
    }, file.type || 'image/jpeg', 0.95);
  });
}
