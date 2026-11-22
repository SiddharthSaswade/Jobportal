// OCR is only loaded when the user picks an image or a scanned PDF.
// The English language model is served from /public/tessdata so the feature
// works without a third-party CDN (and keeps working offline after first load).
import { createWorker } from 'tesseract.js';

const LANG_PATH = `${import.meta.env.BASE_URL}tessdata`;

export const OCR_ERROR =
  'Could not read the text in that image. Try a clearer photo or paste the text instead.';

export async function createOcrWorker(onProgress = () => {}) {
  return createWorker('eng', 1, {
    langPath: LANG_PATH,
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress(Math.round((message.progress || 0) * 100));
      }
    },
  });
}
