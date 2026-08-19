export type CoverCropFocus = {
  zoom: number;
  focusX: number;
  focusY: number;
};

export type CoverCropBounds = {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
};

const COVER_ASPECT_RATIO = 16 / 9;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function calculateCoverCropBounds(imageWidth: number, imageHeight: number, crop: CoverCropFocus): CoverCropBounds {
  if (imageWidth <= 0 || imageHeight <= 0) throw new Error("Kích thước ảnh không hợp lệ.");
  const safeZoom = clamp(crop.zoom, 1, 3);
  const imageRatio = imageWidth / imageHeight;
  const baseWidth = imageRatio > COVER_ASPECT_RATIO ? imageHeight * COVER_ASPECT_RATIO : imageWidth;
  const baseHeight = imageRatio > COVER_ASPECT_RATIO ? imageHeight : imageWidth / COVER_ASPECT_RATIO;
  const sourceWidth = baseWidth / safeZoom;
  const sourceHeight = baseHeight / safeZoom;
  const sourceX = ((clamp(crop.focusX, -1, 1) + 1) / 2) * (imageWidth - sourceWidth);
  const sourceY = ((clamp(crop.focusY, -1, 1) + 1) / 2) * (imageHeight - sourceHeight);
  return { sourceX, sourceY, sourceWidth, sourceHeight };
}

export const defaultCoverCropFocus: CoverCropFocus = { zoom: 1, focusX: 0, focusY: 0 };
