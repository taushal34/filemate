import { PDFDocument } from 'pdf-lib';

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

// Canvas export helper
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error("This browser can't export that format."))),
      type,
      quality
    );
  });
}

// Process Image (compress, resize, convert)
export async function processImage(
  file: File,
  options: { w?: number; type?: string; q?: number }
): Promise<Blob> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name} can't be read as an image.`);
  }

  const scale = options.w ? Math.min(1, options.w / bmp.width) : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context.');

  const targetType = options.type || file.type || 'image/jpeg';
  if (targetType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();

  return canvasToBlob(canvas, targetType, options.q);
}

// PDF Utilities
export async function loadPdf(file: File): Promise<PDFDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return await PDFDocument.load(arrayBuffer);
  } catch {
    throw new Error(`${file.name} is encrypted or isn't a valid PDF.`);
  }
}

export async function savePdfBlob(doc: PDFDocument): Promise<Blob> {
  const bytes = await doc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

export function parsePageRanges(rangesStr: string, totalPages: number): number[] {
  const indices: number[] = [];
  const parts = rangesStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) {
      throw new Error(`"${trimmed}" isn't a valid page range. Use format like "1-3, 5".`);
    }
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;

    if (start < 1 || end < start || end > totalPages) {
      throw new Error(`Pages must be between 1 and ${totalPages}.`);
    }

    for (let p = start; p <= end; p++) {
      indices.push(p - 1); // 0-based index
    }
  }

  if (indices.length === 0) {
    throw new Error('Please specify at least one page to extract.');
  }

  return indices;
}

// Text word count and metrics
export function getWordMetrics(text: string): [string, string | number][] {
  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = text.length;
  const noSpacesCount = text.replace(/\s/g, '').length;
  const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).length;
  const readingTime = Math.max(wordCount ? 1 : 0, Math.round(wordCount / 230)) + ' min';

  return [
    ['Words', wordCount],
    ['Characters', charCount],
    ['No spaces', noSpacesCount],
    ['Sentences', sentences],
    ['Reading time', readingTime],
  ];
}

// Text case conversion map
export const CASE_CONVERTERS: Record<string, (str: string) => string> = {
  UPPER: s => s.toUpperCase(),
  lower: s => s.toLowerCase(),
  Title: s => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
  Sentence: s =>
    s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (_m, prefix, letter) => prefix + letter.toUpperCase()),
  camelCase: s => {
    const words = s.toLowerCase().match(/[a-z0-9]+/g) || [];
    return words.map((w, i) => (i ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join('');
  },
  snake_case: s => (s.toLowerCase().match(/[a-z0-9]+/g) || []).join('_'),
  'kebab-case': s => (s.toLowerCase().match(/[a-z0-9]+/g) || []).join('-'),
};
