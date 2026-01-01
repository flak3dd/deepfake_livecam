export type FilterType = 'none' | 'blur' | 'brightness' | 'contrast' | 'grayscale';

export interface FilterSettings {
  type: FilterType;
  value: number;
}

export const applyFilter = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  filter: FilterSettings
) => {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (filter.type === 'none') {
    return;
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  switch (filter.type) {
    case 'blur':
      blurFilter(imageData, canvas.width, canvas.height, Math.min(filter.value, 10));
      break;
    case 'brightness':
      brightnessFilter(data, filter.value);
      break;
    case 'contrast':
      contrastFilter(data, filter.value);
      break;
    case 'grayscale':
      grayscaleFilter(data);
      break;
  }

  ctx.putImageData(imageData, 0, 0);
};

const blurFilter = (imageData: ImageData, width: number, height: number, radius: number) => {
  const data = imageData.data;
  const blurred = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    let r = 0, g = 0, b = 0, a = 0, count = 0;
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = Math.max(0, Math.min(width - 1, x + dx));
        const ny = Math.max(0, Math.min(height - 1, y + dy));
        const idx = (ny * width + nx) * 4;

        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        a += data[idx + 3];
        count++;
      }
    }

    blurred[i] = r / count;
    blurred[i + 1] = g / count;
    blurred[i + 2] = b / count;
    blurred[i + 3] = a / count;
  }

  imageData.data.set(blurred);
};

const brightnessFilter = (data: Uint8ClampedArray, value: number) => {
  const adjusted = Math.max(-100, Math.min(100, value));

  for (let i = 0; i < data.length; i += 4) {
    data[i] += adjusted;
    data[i + 1] += adjusted;
    data[i + 2] += adjusted;
  }
};

const contrastFilter = (data: Uint8ClampedArray, value: number) => {
  const factor = (259 * (value + 255)) / (255 * (259 - value));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
  }
};

const grayscaleFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
};
