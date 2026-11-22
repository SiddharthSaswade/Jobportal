import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readDocx } from './docxReader.js';
import { readImage } from './imageReader.js';
import { readPdf } from './pdfReader.js';
import {
  cleanExtractedText,
  extractResumeText,
  getExtension,
  MAX_FILE_BYTES,
  validateResumeFile,
} from './resumeFile.js';

// The real readers pull in pdfjs/tesseract, which have no place in a jsdom
// unit test. We only need to prove that the right reader is selected.
vi.mock('./pdfReader.js', () => ({ readPdf: vi.fn() }));
vi.mock('./docxReader.js', () => ({ readDocx: vi.fn() }));
vi.mock('./imageReader.js', () => ({ readImage: vi.fn() }));

const TEXT = [
  'Asha Sharma is a frontend developer with 5 years of experience.',
  'Built applications with React, TypeScript, Node.js and MongoDB.',
].join(' ');

function makeFile(name, size = 500, content = TEXT) {
  return { name, size, text: vi.fn().mockResolvedValue(content) };
}

beforeEach(() => {
  readPdf.mockResolvedValue(TEXT);
  readDocx.mockResolvedValue(TEXT);
  readImage.mockResolvedValue(TEXT);
});

describe('resumeFile helpers', () => {
  it('reads extensions case-insensitively', () => {
    expect(getExtension('Resume.PDF')).toBe('pdf');
    expect(getExtension('photo.jpeg')).toBe('jpeg');
    expect(getExtension('noextension')).toBe('');
  });

  it('accepts PDF, Word, image and text files but explains the rest', () => {
    for (const name of ['cv.pdf', 'cv.docx', 'cv.jpg', 'photo.PNG', 'cv.txt', 'cv.md']) {
      expect(validateResumeFile(makeFile(name))).toBe(getExtension(name));
    }

    expect(() => validateResumeFile(makeFile('cv.doc'))).toThrow(/save it as \.docx/i);
    expect(() => validateResumeFile(makeFile('cv.exe'))).toThrow(/please choose a pdf/i);
    expect(() => validateResumeFile(makeFile('cv.pdf', 0))).toThrow(/empty/i);
    expect(() => validateResumeFile(makeFile('cv.pdf', MAX_FILE_BYTES + 1))).toThrow(/too large/i);
  });

  it('cleans up extracted text without losing paragraph breaks', () => {
    expect(cleanExtractedText('  Hello\r\n\r\n\r\n  world   \n')).toBe('Hello\n\nworld');
  });

  it('reads a .txt file directly without loading a heavy reader', async () => {
    const file = makeFile('resume.txt');
    await expect(extractResumeText(file)).resolves.toEqual({ text: TEXT, fileName: 'resume.txt' });
    expect(file.text).toHaveBeenCalledOnce();
    expect(readPdf).not.toHaveBeenCalled();
    expect(readImage).not.toHaveBeenCalled();
  });

  it('sends a PDF to the pdf reader and forwards progress', async () => {
    const onProgress = vi.fn();
    await extractResumeText(makeFile('resume.pdf'), onProgress);

    expect(readPdf).toHaveBeenCalledWith(expect.objectContaining({ name: 'resume.pdf' }), onProgress);
  });

  it.each(['cv.jpg', 'cv.jpeg', 'photo.png', 'pic.webp', 'scan.bmp'])(
    'sends %s to the OCR reader',
    async (name) => {
      const onProgress = vi.fn();
      await expect(extractResumeText(makeFile(name), onProgress)).resolves.toEqual({
        text: TEXT,
        fileName: name,
      });
      expect(readImage).toHaveBeenCalledWith(expect.objectContaining({ name }), onProgress);
    }
  );

  it('sends a .docx file to the Word reader', async () => {
    await extractResumeText(makeFile('resume.docx'));
    expect(readDocx).toHaveBeenCalledOnce();
  });

  it('rejects files where OCR found too little text', async () => {
    readImage.mockResolvedValueOnce('hello');
    await expect(extractResumeText(makeFile('empty.jpg'))).rejects.toThrow(
      /could not find enough readable text/i
    );
  });
});
