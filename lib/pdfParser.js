import pdfParse from 'pdf-parse';

/**
 * Extracts text from a PDF buffer.
 * @param {Buffer} buffer - The PDF file buffer.
 * @returns {Promise<string>} The extracted text.
 */
export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text ? data.text.trim() : '';
    
    if (text.length < 100) {
      throw new Error('PDF_EMPTY_OR_SCANNED');
    }
    
    return text;
  } catch (error) {
    if (error.message === 'PDF_EMPTY_OR_SCANNED') {
      throw error;
    }
    console.error('[PDF Parser Error]', error.message);
    throw new Error('FAILED_TO_PARSE_PDF');
  }
}
