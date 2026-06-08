// Render each page of a PDF to a JPEG data-URL so the AI vision model
// can read scanned documents (Omang, title deed, marriage certificate, etc.).
// The Supabase edge function can't render PDFs in Deno — we do it in the browser
// at upload time and send the page images alongside the original PDF.

const MAX_PAGES = 10;        // cap to keep payload reasonable
const RENDER_SCALE = 1.8;    // good balance for OCR legibility
const JPEG_QUALITY = 0.85;

let pdfjsLib: any = null;

// Lazy-import pdfjs-dist on first use — keeps it out of the initial bundle for
// users who never upload a PDF.
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  // Use the "legacy" build — Vite-friendly and works in all evergreen browsers.
  const mod: any = await import('pdfjs-dist');
  // The worker has to be served separately. pdfjs-dist exposes the worker file
  // as a static asset under the package; Vite resolves the URL at build time.
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  mod.GlobalWorkerOptions.workerSrc = workerUrl;
  pdfjsLib = mod;
  return mod;
}

export async function renderPdfToImages(file: File | Blob): Promise<string[]> {
  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

    const pageCount = Math.min(pdf.numPages, MAX_PAGES);
    const images: string[] = [];

    for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) continue;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      // White background — many scans rely on it
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      images.push(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    }

    return images;
  } catch (err) {
    // Best-effort: if rendering fails, return [] so the upload still proceeds.
    console.warn('PDF rendering failed:', err);
    return [];
  }
}

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
