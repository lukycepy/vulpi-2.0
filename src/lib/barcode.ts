import bwipjs from 'bwip-js';

export async function generateBarcodeDataUrl(text: string): Promise<string> {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Browser environment
    try {
        const canvas = document.createElement('canvas');
        bwipjs.toCanvas(canvas, {
            bcid: 'code128',       // Barcode type
            text: text,            // Text to encode
            scale: 3,              // 3x scaling factor
            height: 10,            // Bar height, in millimeters
            includetext: false,    // Show human-readable text
            textxalign: 'center',  // Always good to set this
        });
        return canvas.toDataURL('image/png');
    } catch (e) {
        console.error("Browser barcode generation failed", e);
        return "";
    }
  } else {
    // Node environment
    try {
        const buffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: text,
            scale: 3,
            height: 10,
            includetext: false,
            textxalign: 'center',
        });
        return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (err) {
        console.error('Node barcode generation failed', err);
        return '';
    }
  }
}
