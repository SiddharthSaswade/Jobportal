import { createOcrWorker, OCR_ERROR } from './ocr.js';

export async function readImage(file, onProgress) {
  let worker;

  try {
    worker = await createOcrWorker(onProgress);
    const { data } = await worker.recognize(file);
    return data.text || '';
  } catch {
    throw new Error(OCR_ERROR);
  } finally {
    if (worker) await worker.terminate();
  }
}
