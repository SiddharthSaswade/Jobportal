// Kept in its own module so pdfjs (a large library) is only downloaded when a
// user actually picks a PDF. A PDF with selectable text is read directly; a
// scanned PDF is rendered to a canvas and passed through OCR instead.
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const MIN_SELECTABLE_CHARS = 50;

export async function readPdf(file, onProgress = () => {}) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  try {
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const words = content.items
        .map((item) => (typeof item.str === 'string' ? item.str : ''))
        .filter(Boolean);
      pages.push(words.join(' '));
    }

    const selectable = pages.join(' ').replace(/\s+/g, ' ').trim();
    if (selectable.length >= MIN_SELECTABLE_CHARS) {
      return pages.join('\n\n');
    }

    // Almost no selectable text — this is a scan or a photo turned into a PDF.
    onProgress(0);
    const { createOcrWorker, OCR_ERROR } = await import('./ocr.js');
    let worker;

    try {
      worker = await createOcrWorker(onProgress);
      const scanned = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is not available');

        await page.render({ canvasContext: context, viewport }).promise;
        const { data: result } = await worker.recognize(canvas);
        scanned.push(result.text || '');
      }

      return scanned.join('\n\n');
    } catch {
      throw new Error(OCR_ERROR);
    } finally {
      if (worker) await worker.terminate();
    }
  } finally {
    await pdf.destroy();
  }
}
