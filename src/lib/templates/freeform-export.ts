// Real client-side export for the freeform canvas -- rasterizes each
// page's actual DOM (html2canvas), then either triggers a direct image
// download (single page), bundles multiple pages into a .zip (jszip), or
// composes a multi-page PDF sized to each page's own real dimensions
// (jspdf). No server round-trip: everything happens in the browser from
// what's already rendered on screen.
//
// Known limitation, disclosed rather than silently accepted: html2canvas
// rasterizes a live DOM snapshot, and its CSS support isn't 100% complete
// (e.g. some CSS filter combinations or conic-gradient rendering can differ
// slightly from the live canvas) -- output is generally faithful but isn't
// guaranteed pixel-identical to what's on screen for every possible style
// combination this editor can produce.
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

export interface FreeformExportPage {
  name: string;
  el: HTMLElement;
}

const PX_TO_MM = 25.4 / 96;

function slug(s: string): string {
  return (
    (s || 'portfolio')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'portfolio'
  );
}

function downloadUrl(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function captureFreeformPage(el: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  return html2canvas(el, { scale, useCORS: true, backgroundColor: null });
}

export async function exportFreeformPagesAsImages(pages: FreeformExportPage[], format: 'png' | 'jpg', projectTitle: string): Promise<void> {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  if (pages.length === 1) {
    const canvas = await captureFreeformPage(pages[0].el);
    downloadUrl(canvas.toDataURL(mime, 0.92), `${slug(projectTitle)}.${format}`);
    return;
  }
  const zip = new JSZip();
  for (let i = 0; i < pages.length; i++) {
    const canvas = await captureFreeformPage(pages[i].el);
    const dataUrl = canvas.toDataURL(mime, 0.92);
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    zip.file(`${String(i + 1).padStart(2, '0')}-${slug(pages[i].name)}.${format}`, base64, { base64: true });
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${slug(projectTitle)}-${format}.zip`);
}

export async function exportFreeformPagesAsPdf(pages: FreeformExportPage[], projectTitle: string): Promise<void> {
  let pdf: jsPDF | null = null;
  for (const { el } of pages) {
    const canvas = await captureFreeformPage(el);
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const widthMm = el.offsetWidth * PX_TO_MM;
    const heightMm = el.offsetHeight * PX_TO_MM;
    const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
    if (!pdf) {
      pdf = new jsPDF({ orientation, unit: 'mm', format: [widthMm, heightMm] });
    } else {
      pdf.addPage([widthMm, heightMm], orientation);
    }
    pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
  }
  pdf?.save(`${slug(projectTitle)}.pdf`);
}

// Used for the My Projects cover thumbnail -- a real downsampled capture
// of the Cover page, never a stock/placeholder image.
export async function captureFreeformCoverThumb(el: HTMLElement): Promise<string | null> {
  try {
    const canvas = await captureFreeformPage(el, 1);
    const targetW = 320;
    const scale = targetW / canvas.width;
    const targetH = Math.max(1, Math.round(canvas.height * scale));
    const out = document.createElement('canvas');
    out.width = targetW;
    out.height = targetH;
    const ctx = out.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(canvas, 0, 0, targetW, targetH);
    return out.toDataURL('image/jpeg', 0.62);
  } catch {
    return null;
  }
}
