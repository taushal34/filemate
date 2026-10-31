import {
  processImage,
  loadPdf,
  savePdfBlob,
  parsePageRanges,
  stripExtension,
} from '../utils/fileTools';
import { PDFDocument } from 'pdf-lib';

export interface ToolOption {
  k: string;
  label: string;
  type: 'range' | 'number' | 'select' | 'text';
  def: any;
  min?: number;
  max?: number;
  options?: [string, string][];
}

export interface ToolDefinition {
  id: string;
  name: string;
  cat: 'PDF' | 'Image' | 'Text' | 'Student' | 'AI';
  desc: string;
  accept?: string[];
  kind?: string;
  multi?: boolean;
  opts?: ToolOption[];
  text?: 'count' | 'case';
  soon?: boolean;
  run?: (
    files: File[],
    opts: Record<string, any>,
    onProgress: (ratio: number) => void
  ) => Promise<Array<{ name: string; blob: Blob }>>;
}

export const CATEGORIES = ['All', 'PDF', 'Image', 'Text', 'AI', 'Student'] as const;

export const TOOLS: ToolDefinition[] = [
  {
    id: 'compress',
    name: 'Compress images',
    cat: 'Image',
    desc: 'Shrink JPG, PNG and WebP files. PNGs become WebP to save the most.',
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    kind: 'JPG, PNG or WebP images',
    multi: true,
    opts: [
      {
        k: 'q',
        label: 'Quality',
        type: 'range',
        min: 10,
        max: 95,
        def: 70,
      },
    ],
    run: async (files, opts, onProgress) => {
      const results: Array<{ name: string; blob: Blob }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const targetType = file.type === 'image/png' ? 'image/webp' : file.type;
        const ext = targetType === 'image/webp' ? 'webp' : targetType === 'image/jpeg' ? 'jpg' : 'png';
        const compressedBlob = await processImage(file, {
          type: targetType,
          q: opts.q / 100,
        });

        if (compressedBlob.size < file.size) {
          results.push({
            name: `${stripExtension(file.name)}-small.${ext}`,
            blob: compressedBlob,
          });
        } else {
          // Keep original if compression didn't save space
          results.push({
            name: file.name,
            blob: file,
          });
        }
        onProgress((i + 1) / files.length);
      }
      return results;
    },
  },
  {
    id: 'resize',
    name: 'Resize images',
    cat: 'Image',
    desc: 'Set a maximum width. Height follows, and small images are never stretched.',
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    kind: 'JPG, PNG or WebP images',
    multi: true,
    opts: [
      {
        k: 'w',
        label: 'Max width (px)',
        type: 'number',
        min: 16,
        max: 8000,
        def: 1280,
      },
    ],
    run: async (files, opts, onProgress) => {
      const results: Array<{ name: string; blob: Blob }> = [];
      const maxWidth = parseInt(opts.w, 10) || 1280;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const resizedBlob = await processImage(file, {
          w: maxWidth,
          type: file.type,
        });

        results.push({
          name: `${stripExtension(file.name)}-${maxWidth}w.${ext}`,
          blob: resizedBlob,
        });
        onProgress((i + 1) / files.length);
      }
      return results;
    },
  },
  {
    id: 'convert',
    name: 'Convert image format',
    cat: 'Image',
    desc: 'Switch between JPG, PNG and WebP.',
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    kind: 'JPG, PNG or WebP images',
    multi: true,
    opts: [
      {
        k: 't',
        label: 'Convert to',
        type: 'select',
        def: 'image/webp',
        options: [
          ['image/jpeg', 'JPG'],
          ['image/png', 'PNG'],
          ['image/webp', 'WebP'],
        ],
      },
    ],
    run: async (files, opts, onProgress) => {
      const results: Array<{ name: string; blob: Blob }> = [];
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };
      const ext = extMap[opts.t] || 'webp';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const convertedBlob = await processImage(file, {
          type: opts.t,
        });

        results.push({
          name: `${stripExtension(file.name)}.${ext}`,
          blob: convertedBlob,
        });
        onProgress((i + 1) / files.length);
      }
      return results;
    },
  },
  {
    id: 'merge',
    name: 'Merge PDFs',
    cat: 'PDF',
    desc: 'Combine PDFs into one, in the order you add them.',
    accept: ['application/pdf'],
    kind: 'PDF files',
    multi: true,
    run: async (files, _opts, onProgress) => {
      if (files.length < 2) {
        throw new Error('Add at least two PDFs to merge.');
      }
      const mergedDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const doc = await loadPdf(files[i]);
        const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
        pages.forEach(page => mergedDoc.addPage(page));
        onProgress((i + 1) / files.length);
      }

      const mergedBlob = await savePdfBlob(mergedDoc);
      return [{ name: 'merged.pdf', blob: mergedBlob }];
    },
  },
  {
    id: 'split',
    name: 'Split a PDF',
    cat: 'PDF',
    desc: 'Pull out pages or ranges, as one file or one file per page.',
    accept: ['application/pdf'],
    kind: 'PDF files',
    multi: false,
    opts: [
      {
        k: 'r',
        label: 'Pages',
        type: 'text',
        def: '1-2',
      },
      {
        k: 'm',
        label: 'Output',
        type: 'select',
        def: 'one',
        options: [
          ['one', 'One PDF'],
          ['each', 'Separate pages'],
        ],
      },
    ],
    run: async (files, opts, onProgress) => {
      const file = files[0];
      if (!file) throw new Error('Please select a PDF to split.');

      const doc = await loadPdf(file);
      const totalPages = doc.getPageCount();
      const pageIndices = parsePageRanges(opts.r || '1', totalPages);

      const createSubDocBlob = async (indices: number[]) => {
        const sub = await PDFDocument.create();
        const copied = await sub.copyPages(doc, indices);
        copied.forEach(p => sub.addPage(p));
        return savePdfBlob(sub);
      };

      const baseName = stripExtension(file.name);

      if (opts.m === 'one') {
        const blob = await createSubDocBlob(pageIndices);
        onProgress(1);
        return [{ name: `${baseName}-pages.pdf`, blob }];
      } else {
        const results: Array<{ name: string; blob: Blob }> = [];
        for (let i = 0; i < pageIndices.length; i++) {
          const idx = pageIndices[i];
          const blob = await createSubDocBlob([idx]);
          results.push({
            name: `${baseName}-p${idx + 1}.pdf`,
            blob,
          });
          onProgress((i + 1) / pageIndices.length);
        }
        return results;
      }
    },
  },
  {
    id: 'jpg2pdf',
    name: 'Images to PDF',
    cat: 'PDF',
    desc: 'Turn images into one PDF, one image per page.',
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    kind: 'JPG, PNG or WebP images',
    multi: true,
    run: async (files, _opts, onProgress) => {
      if (files.length === 0) throw new Error('Add at least one image.');
      const pdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let img;
        if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name)) {
          img = await pdf.embedJpg(await file.arrayBuffer());
        } else if (file.type === 'image/png' || /\.png$/i.test(file.name)) {
          img = await pdf.embedPng(await file.arrayBuffer());
        } else {
          // Convert WebP or other images to PNG first
          const pngBlob = await processImage(file, { type: 'image/png' });
          img = await pdf.embedPng(await pngBlob.arrayBuffer());
        }

        const page = pdf.addPage([img.width, img.height]);
        page.drawImage(img, {
          x: 0,
          y: 0,
          width: img.width,
          height: img.height,
        });
        onProgress((i + 1) / files.length);
      }

      return [{ name: 'images.pdf', blob: await savePdfBlob(pdf) }];
    },
  },
  {
    id: 'words',
    name: 'Word counter',
    cat: 'Student',
    desc: 'Words, characters, sentences and reading time as you type.',
    text: 'count',
  },
  {
    id: 'case',
    name: 'Text case converter',
    cat: 'Text',
    desc: 'UPPER, lower, Title, Sentence, camelCase, snake_case and kebab-case.',
    text: 'case',
  },
  {
    id: 'summary',
    name: 'AI summarizer',
    cat: 'AI',
    desc: 'Summaries of long documents, run locally.',
    soon: true,
  },
  {
    id: 'ocr',
    name: 'Image to text',
    cat: 'AI',
    desc: 'OCR for scans and photos.',
    soon: true,
  },
  {
    id: 'docx',
    name: 'Word to PDF',
    cat: 'PDF',
    desc: "Needs a document renderer we haven't added yet.",
    soon: true,
  },
  {
    id: 'cards',
    name: 'Flashcard maker',
    cat: 'Student',
    desc: 'Notes in, study cards out.',
    soon: true,
  },
];
