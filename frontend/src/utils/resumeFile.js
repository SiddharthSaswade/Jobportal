// Everything the resume upload needs. The heavy readers (pdfjs and tesseract)
// live in their own modules and are imported only when that file type is used.
// The API still receives plain text — the binary file is never uploaded.

export const MIN_TEXT_CHARS = 50;
export const MAX_TEXT_CHARS = 20000;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export const RESUME_ACCEPT = [
  '.txt',
  '.md',
  '.pdf',
  '.docx',
  '.doc',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.bmp',
  'text/plain',
  'text/markdown',
  'application/pdf',
  'image/*',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',');

const TEXT = new Set(['txt', 'md']);
const IMAGE = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp']);
const SUPPORTED = new Set(['pdf', 'docx', ...TEXT, ...IMAGE]);

export function getExtension(fileName = '') {
  const parts = String(fileName).toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

export function cleanExtractedText(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function validateResumeFile(file) {
  if (!file) throw new Error('Choose a file first.');
  if (file.size === 0) throw new Error('That file is empty.');
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`That file is too large. Maximum ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
  }

  const extension = getExtension(file.name);
  if (extension === 'doc') {
    throw new Error('Old .doc files are not supported. Save it as .docx and try again.');
  }
  if (!SUPPORTED.has(extension)) {
    throw new Error('Please choose a PDF, Word (.docx), image (JPG/PNG/WebP), .txt or .md file.');
  }
  return extension;
}

export async function extractResumeText(file, onProgress = () => {}) {
  const extension = validateResumeFile(file);
  let raw;

  if (TEXT.has(extension)) {
    raw = await file.text();
  } else if (extension === 'pdf') {
    const { readPdf } = await import('./pdfReader.js');
    raw = await readPdf(file, onProgress);
  } else if (IMAGE.has(extension)) {
    const { readImage } = await import('./imageReader.js');
    raw = await readImage(file, onProgress);
  } else {
    const { readDocx } = await import('./docxReader.js');
    raw = await readDocx(file);
  }

  const text = cleanExtractedText(raw);

  if (text.length > MAX_TEXT_CHARS) {
    throw new Error(`That file has too much text. Maximum ${MAX_TEXT_CHARS} characters.`);
  }
  if (text.length < MIN_TEXT_CHARS) {
    throw new Error(
      'We could not find enough readable text in that file. Try a clearer image or paste the text instead.'
    );
  }

  return { text, fileName: file.name };
}
