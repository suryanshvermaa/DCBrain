import fs from 'fs';
import path from 'path';

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function looksLikeText(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  if (sample.includes(0)) {
    return false;
  }
  const text = sample.toString('utf8');
  return !text.includes('\uFFFD');
}

function detectMimeType(buffer: Buffer, originalName: string): string | null {
  const extension = getExtension(originalName);
  
  if (!looksLikeText(buffer)) {
    return null;
  }

  if (extension === '.txt' || extension === '.md') {
    return 'text/plain';
  }

  return null;
}

const filePaths = [
  'd:\\dc_brain\\test_documents\\HVAC_Cooling_System_Specs.txt',
  'd:\\dc_brain\\test_documents\\Power_Distribution_Architecture.txt'
];

for (const fp of filePaths) {
  const buffer = fs.readFileSync(fp);
  const name = path.basename(fp);
  const isText = looksLikeText(buffer);
  const mime = detectMimeType(buffer, name);
  console.log({ name, isText, mime, extension: getExtension(name) });
}
