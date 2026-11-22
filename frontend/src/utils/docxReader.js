// mammoth's browser build reads .docx (the XML-based Word format) with no
// server round trip. extractRawText gives us plain paragraphs, not HTML.
import mammoth from 'mammoth/mammoth.browser.js';

export async function readDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}
