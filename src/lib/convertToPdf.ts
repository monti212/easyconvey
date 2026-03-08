import { jsPDF } from 'jspdf';

/**
 * Converts an image file (JPG, PNG, etc.) to a PDF file.
 * If the file is already a PDF, returns it unchanged.
 */
export async function convertToPdf(file: File): Promise<File> {
  // Already a PDF — return as-is
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return file;
  }

  // Only convert image types
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Determine orientation
          const isLandscape = img.width > img.height;
          const orientation = isLandscape ? 'landscape' : 'portrait';

          // A4 dimensions in mm
          const pageWidth = isLandscape ? 297 : 210;
          const pageHeight = isLandscape ? 210 : 297;

          // Margins (10mm each side)
          const margin = 10;
          const maxW = pageWidth - margin * 2;
          const maxH = pageHeight - margin * 2;

          // Scale image to fit within margins
          const ratio = Math.min(maxW / img.width, maxH / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;

          // Center on page
          const x = (pageWidth - w) / 2;
          const y = (pageHeight - h) / 2;

          const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
          const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
          doc.addImage(e.target!.result as string, format, x, y, w, h);

          const pdfBlob = doc.output('blob');
          const pdfName = file.name.replace(/\.[^.]+$/, '.pdf');
          const pdfFile = new File([pdfBlob], pdfName, { type: 'application/pdf' });
          resolve(pdfFile);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for PDF conversion'));
      img.src = e.target!.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts multiple files, converting any images to PDF.
 */
export async function convertAllToPdf(files: File[]): Promise<File[]> {
  return Promise.all(files.map(convertToPdf));
}
